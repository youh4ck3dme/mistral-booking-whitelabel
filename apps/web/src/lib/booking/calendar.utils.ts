import type { Booking } from '@repo/core';

/**
 * Calendar and slot generation utilities
 * 
 * FALLBACK ASSUMPTIONS (clearly marked):
 * - Working hours: 09:00-17:00 if no time_slots_config exists
 * - Slot interval: service duration (not fixed 15-min intervals)
 * - Timezone: Uses browser local time for display, ISO strings for storage
 */

// ============================================================================
// Types
// ============================================================================

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayOfMonth: number;
  month: number; // 0-11
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface CalendarWeek {
  days: CalendarDay[];
  weekNumber: number;
}

export interface CalendarMonth {
  year: number;
  month: number; // 0-11
  weeks: CalendarWeek[];
  firstDay: Date;
  lastDay: Date;
}

export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  isPast: boolean; // For today's slots that have already passed
}

export interface BookedSlotRange {
  start_time: string; // ISO date-time string
  end_time: string; // ISO date-time string
}

// ============================================================================
// Calendar Generation
// ============================================================================

/**
 * Generate a calendar month with weeks and days
 * Always starts with Sunday as first day of week (US convention)
 */
export function generateCalendarMonth(year: number, month: number): CalendarMonth {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Start from the Sunday before or on the first day of the month
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  
  // End on the Saturday after or on the last day of the month
  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  
  const weeks: CalendarWeek[] = [];
  let currentDate = new Date(startDate);
  let weekNumber = 0;
  
  while (currentDate <= endDate) {
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = isSameDay(date, new Date());
      const isPast = date < new Date() && !isSameDay(date, new Date());
      const isFuture = date > new Date();
      
      days.push({
        date,
        dateString: formatDate(date),
        dayOfWeek: date.getDay(),
        dayOfMonth: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isCurrentMonth,
        isToday,
        isPast,
        isFuture,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    weeks.push({
      days,
      weekNumber,
    });
    
    weekNumber++;
  }
  
  return {
    year,
    month,
    weeks,
    firstDay,
    lastDay,
  };
}

/**
 * Get the current month and year
 */
export function getCurrentMonthAndYear(): { month: number; year: number } {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
  };
}

/**
 * Get month names
 */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_NAMES_SK = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December'
];

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_SHORT_SK = ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'];

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is in the past (not including today)
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Check if a date is in the future (not including today)
 */
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

/**
 * Format date for display in Slovak
 */
export function formatDateDisplay(date: Date | string, locale: string = 'sk-SK'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format date as short (e.g., "Mon, Jan 1")
 */
export function formatDateShort(date: Date | string, locale: string = 'sk-SK'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// ============================================================================
// Time Slot Generation
// ============================================================================

/**
 * Parse time string (HH:MM or HH:MM:SS) to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to HH:MM format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Generate time slots for a given date, service duration, and operating hours
 * 
 * FALLBACK: If no operating hours provided, uses 09:00-17:00
 * Slots are generated at intervals equal to service duration
 */
export function generateTimeSlotsForDate(
  date: Date | string,
  serviceDuration: number,
  operatingHours?: { start: string; end: string }
): TimeSlot[] {
  // FALLBACK: Default operating hours if not provided
  const hours = operatingHours || { start: '09:00:00', end: '17:00:00' };
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const isToday = isSameDay(d, today);
  
  const startMinutes = timeToMinutes(hours.start);
  const endMinutes = timeToMinutes(hours.end);
  
  const slots: TimeSlot[] = [];
  
  // Start from the beginning of operating hours
  for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += serviceDuration) {
    const slotEnd = slotStart + serviceDuration;
    
    const startHour = Math.floor(slotStart / 60);
    const startMin = slotStart % 60;
    const endHour = Math.floor(slotEnd / 60);
    const endMin = slotEnd % 60;
    
    const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
    const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    
    // Check if this slot is in the past (for today)
    const slotDateTime = new Date(d);
    slotDateTime.setHours(startHour, startMin, 0, 0);
    
    const isPast = isToday && slotDateTime < today;
    
    slots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      isAvailable: true, // Will be updated based on booked slots
      isPast,
    });
  }
  
  return slots;
}

/**
 * Get the next available slot from a list of slots
 */
export function getNextAvailableSlot(slots: TimeSlot[]): TimeSlot | null {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  
  // Find first available slot that's not in the past
  for (const slot of slots) {
    if (slot.isAvailable && !slot.isPast) {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const slotTotalMinutes = startH * 60 + startM;
      
      if (slotTotalMinutes >= currentTotalMinutes) {
        return slot;
      }
    }
  }
  
  return null;
}

// ============================================================================
// Availability Checking
// ============================================================================

/**
 * Check if a time slot overlaps with any booked slots
 * Uses the same logic as the database EXCLUDE constraint (half-open interval [start, end))
 */
export function isSlotAvailable(
  slotStartTime: string,
  slotEndTime: string,
  bookedSlots: BookedSlotRange[]
): boolean {
  if (bookedSlots.length === 0) {
    return true;
  }
  
  // Parse slot times (HH:MM format on the same date)
  // We need to compare as timestamps for accuracy
  const slotStart = new Date(`1970-01-01T${slotStartTime}:00Z`);
  const slotEnd = new Date(`1970-01-01T${slotEndTime}:00Z`);
  
  for (const booked of bookedSlots) {
    const bookedStart = new Date(booked.start_time);
    const bookedEnd = new Date(booked.end_time);
    
    // Check for overlap using half-open interval logic: [slotStart, slotEnd) overlaps [bookedStart, bookedEnd)
    // Two intervals [a, b) and [c, d) overlap if: a < d AND c < b
    if (slotStart.getTime() < bookedEnd.getTime() && bookedStart.getTime() < slotEnd.getTime()) {
      return false;
    }
    
    // Also check for exact duplicate (same start and end)
    if (
      slotStart.getTime() === bookedStart.getTime() &&
      slotEnd.getTime() === bookedEnd.getTime()
    ) {
      return false;
    }
  }
  
  return true;
}

/**
 * Mark slots as unavailable based on booked slots
 * Returns new array with isAvailable updated
 */
export function markBookedSlots(
  slots: TimeSlot[],
  date: string,
  bookedSlots: BookedSlotRange[]
): TimeSlot[] {
  return slots.map(slot => {
    const slotDateStart = new Date(`${date}T${slot.startTime}:00`);
    const slotDateEnd = new Date(`${date}T${slot.endTime}:00`);
    
    const isBooked = bookedSlots.some(booked => {
      const bookedStart = new Date(booked.start_time);
      const bookedEnd = new Date(booked.end_time);
      
      // Check overlap: [slotStart, slotEnd) overlaps [bookedStart, bookedEnd)
      return slotDateStart.getTime() < bookedEnd.getTime() && bookedStart.getTime() < slotDateEnd.getTime();
    });
    
    return {
      ...slot,
      isAvailable: !isBooked && !slot.isPast,
    };
  });
}

/**
 * Filter out past slots for today
 * Slots that have already passed today should be disabled
 */
export function filterPastSlots(slots: TimeSlot[]): TimeSlot[] {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  
  return slots.map(slot => {
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const slotTotalMinutes = startH * 60 + startM;
    
    // Slot is in the past if it starts before current time
    // For today's date, we've already set isPast in generateTimeSlotsForDate
    // But we also need to check if the slot has already started
    const isPast = slotTotalMinutes < currentTotalMinutes;
    
    return {
      ...slot,
      isPast: slot.isPast || isPast,
      isAvailable: slot.isAvailable && !isPast,
    };
  });
}

// ============================================================================
// Calendar Navigation
// ============================================================================

/**
 * Get the next month
 */
export function getNextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 11) {
    return { month: 0, year: year + 1 };
  }
  return { month: month + 1, year };
}

/**
 * Get the previous month
 */
export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 0) {
    return { month: 11, year: year - 1 };
  }
  return { month: month - 1, year };
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Parse Supabase error to get user-friendly message
 */
export function getBookingErrorMessage(error: any): string {
  if (!error) {
    return 'Nepodarilo sa vytvoriť rezerváciu';
  }
  
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('time slot already booked')) {
    return 'Toto časové úseku bolo práve rezervované. Vyberte prosím iný čas.';
  }
  
  if (message.includes('overlapping')) {
    return 'Toto časové úseku je už obsadené. Vyberte prosím iný čas.';
  }
  
  if (message.includes('service not found') || message.includes('service does not belong')) {
    return 'Vybraná služba nie je dostupná.';
  }
  
  if (message.includes('invalid time range')) {
    return 'Neplatný časový úsek.';
  }
  
  if (message.includes('duration does not match')) {
    return 'Doba trvania rezervácie neodpovedá službe.';
  }
  
  if (message.includes('not authenticated') || message.includes('jwt')) {
    return 'Prosím prihláste sa, aby ste mohli rezervovať.';
  }
  
  return error.message || 'Nepodarilo sa vytvoriť rezerváciu';
}

/**
 * Check if error is a concurrency/conflict error
 */
export function isConflictError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('time slot already booked') ||
    message.includes('overlapping') ||
    message.includes('duplicate') ||
    message.includes('already booked')
  );
}
