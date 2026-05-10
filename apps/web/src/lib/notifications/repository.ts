import type { Booking } from '@repo/core';

import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';

import type { NotificationContext, NotificationDelivery } from './types';

type ClaimNotificationDeliveriesArgs = {
  bookingId?: string;
  limit?: number;
};

export async function claimPendingNotificationDeliveries({
  bookingId,
  limit = 20,
}: ClaimNotificationDeliveriesArgs = {}): Promise<NotificationDelivery[]> {
  const supabase = createServiceRoleClient({ requireServiceRole: true });
  const { data, error } = await supabase.rpc('claim_notification_deliveries', {
    p_booking_id: bookingId ?? null,
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Failed to claim notification deliveries: ${error.message}`);
  }

  return data ?? [];
}

export async function markNotificationDeliverySent(
  deliveryId: string,
  providerMessageId: string | null,
  subject: string
) {
  const supabase = createServiceRoleClient({ requireServiceRole: true });
  const { error } = await supabase
    .from('notification_deliveries')
    .update({
      error_message: null,
      provider_message_id: providerMessageId,
      sent_at: new Date().toISOString(),
      status: 'sent',
      subject,
    })
    .eq('id', deliveryId);

  if (error) {
    throw new Error(`Failed to mark notification delivery ${deliveryId} as sent: ${error.message}`);
  }
}

export async function markNotificationDeliveryFailed(deliveryId: string, errorMessage: string) {
  const supabase = createServiceRoleClient({ requireServiceRole: true });
  const { error } = await supabase
    .from('notification_deliveries')
    .update({
      error_message: errorMessage,
      status: 'failed',
    })
    .eq('id', deliveryId);

  if (error) {
    throw new Error(`Failed to mark notification delivery ${deliveryId} as failed: ${error.message}`);
  }
}

export async function scheduleReminderNotifications() {
  const supabase = createServiceRoleClient({ requireServiceRole: true });
  const { data, error } = await supabase.rpc('schedule_booking_reminders');

  if (error) {
    throw new Error(`Failed to schedule booking reminders: ${error.message}`);
  }

  return Number(data ?? 0);
}

export async function getNotificationContext(
  delivery: NotificationDelivery
): Promise<NotificationContext> {
  const supabase = createServiceRoleClient({ requireServiceRole: true });

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', delivery.booking_id)
    .single();

  if (bookingError || !booking) {
    throw new Error(`Unable to load booking ${delivery.booking_id} for notifications.`);
  }

  const [{ data: service, error: serviceError }, { data: tenant, error: tenantError }, { data: branding }] =
    await Promise.all([
      supabase.from('services').select('*').eq('id', booking.service_id).single(),
      supabase.from('tenants').select('*').eq('id', booking.tenant_id).single(),
      supabase.from('tenant_branding').select('*').eq('tenant_id', booking.tenant_id).maybeSingle(),
    ]);

  if (serviceError || !service) {
    throw new Error(`Unable to load service ${booking.service_id} for notification delivery ${delivery.id}.`);
  }

  if (tenantError || !tenant) {
    throw new Error(`Unable to load tenant ${booking.tenant_id} for notification delivery ${delivery.id}.`);
  }

  return {
    booking,
    branding: branding ?? null,
    delivery,
    recipientEmail: delivery.recipient_email,
    service,
    tenant,
  };
}

export async function verifyBookingAccess(bookingId: string, userId: string) {
  const supabase = createServiceRoleClient({ requireServiceRole: true });

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return null;
  }

  if (booking.user_id === userId) {
    return booking;
  }

  const { data: membership } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('tenant_id', booking.tenant_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (membership?.role === 'admin' || membership?.role === 'staff') {
    return booking;
  }

  return null;
}

export function dedupeDeliveries(deliveries: NotificationDelivery[]) {
  const seenKeys = new Set<string>();

  return deliveries.filter((delivery) => {
    if (seenKeys.has(delivery.idempotency_key)) {
      return false;
    }

    seenKeys.add(delivery.idempotency_key);
    return true;
  });
}

export function getReminderIdempotencyKey(booking: Pick<Booking, 'id' | 'start_time'>) {
  const scheduledAt = new Date(booking.start_time);
  scheduledAt.setUTCMinutes(0, 0, 0);

  return `${booking.id}:booking_reminder:${scheduledAt.toISOString().slice(0, 16).replace(/[-:T]/g, '')}`;
}
