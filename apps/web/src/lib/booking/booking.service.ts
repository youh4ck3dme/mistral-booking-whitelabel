import { supabase } from '@repo/supabase';
import { Booking, Service, TimeSlotConfig } from '@repo/core';

export interface BookingSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Re-export calendar utilities for backward compatibility
export type { TimeSlot } from './calendar.utils';
export {
  generateTimeSlotsForDate,
  markBookedSlots,
  getNextAvailableSlot,
} from './calendar.utils';

/**
 * Fetch all services for a tenant
 */
export async function getServicesByTenant(tenantId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch a single service by ID
 */
export async function getServiceById(serviceId: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Fetch time slots configuration for a tenant
 */
export async function getTimeSlotsConfig(tenantId: string): Promise<TimeSlotConfig[]> {
  const { data, error } = await supabase
    .from('time_slots_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching time slots config:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if a time slot is available for booking
 */
export async function isSlotAvailable(
  tenantId: string,
  serviceId: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  // Check for overlapping bookings
  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('service_id', serviceId)
    .neq('status', 'cancelled')
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (error) {
    console.error('Error checking slot availability:', error);
    return false;
  }

  return count === 0;
}

/**
 * Create a new booking
 */
export async function createBooking(
  tenantId: string,
  serviceId: string,
  startTime: string,
  endTime: string
): Promise<Booking | null> {
  try {
    const { data, error } = await supabase.rpc('create_booking', {
      p_tenant_id: tenantId,
      p_service_id: serviceId,
      p_start_time: startTime,
      p_end_time: endTime,
    });

    if (error) {
      throw error;
    }

    // Fetch the created booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError || !booking) {
      return null;
    }

    return booking;
  } catch (err) {
    console.error('Error creating booking:', err);
    return null;
  }
}

/**
 * Get bookings for a user in a specific tenant
 */
export async function getBookingsByUser(
  tenantId: string,
  userId: string
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  return data || [];
}

/**
 * Cancel a booking
 */
export async function cancelBooking(
  bookingId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_user_id: userId,
    });

    if (error) {
      throw error;
    }

    return data as boolean;
  } catch (err) {
    console.error('Error cancelling booking:', err);
    return false;
  }
}

/**
 * Generate available time slots for a service on a specific date
 */
export function generateTimeSlots(
  date: Date,
  serviceDuration: number,
  operatingHours: { start: string; end: string }
): BookingSlot[] {
  const slots: BookingSlot[] = [];
  const [startHour, startMinute] = operatingHours.start.split(':').map(Number);
  const [endHour, endMinute] = operatingHours.end.split(':').map(Number);

  const startTime = new Date(date);
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);

  const currentTime = new Date(startTime);

  while (currentTime < endTime) {
    const slotEndTime = new Date(currentTime);
    slotEndTime.setMinutes(slotEndTime.getMinutes() + serviceDuration);

    if (slotEndTime > endTime) {
      break;
    }

    slots.push({
      startTime: currentTime.toISOString(),
      endTime: slotEndTime.toISOString(),
      isAvailable: true, // Will be checked against actual bookings
    });

    currentTime.setMinutes(currentTime.getMinutes() + 15); // 15-minute intervals
  }

  return slots;
}
