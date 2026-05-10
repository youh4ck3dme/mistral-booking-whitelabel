import { describe, expect, it } from 'vitest';

import type { NotificationDelivery } from './types';
import { dedupeDeliveries, getReminderIdempotencyKey } from './repository';

function createReminderDelivery(
  overrides: Partial<NotificationDelivery> = {}
): NotificationDelivery {
  return {
    attempt_count: 0,
    booking_id: 'booking-1',
    channel: 'email',
    created_at: '2026-05-10T00:00:00.000Z',
    error_message: null,
    id: 'delivery-1',
    idempotency_key: 'booking-1:booking_reminder:202605101000',
    notification_type: 'booking_reminder',
    payload: {},
    provider_message_id: null,
    recipient_email: 'client@example.com',
    scheduled_for: '2026-05-10T10:00:00.000Z',
    sent_at: null,
    status: 'pending',
    subject: null,
    tenant_id: 'tenant-1',
    updated_at: '2026-05-10T00:00:00.000Z',
    user_id: 'user-1',
    ...overrides,
  };
}

describe('notification reminder helpers', () => {
  it('keeps only one reminder delivery per idempotency key', () => {
    const deliveries = [
      createReminderDelivery(),
      createReminderDelivery({ id: 'delivery-2' }),
      createReminderDelivery({
        id: 'delivery-3',
        booking_id: 'booking-2',
        idempotency_key: 'booking-2:booking_reminder:202605111000',
      }),
    ];

    expect(dedupeDeliveries(deliveries).map((delivery) => delivery.id)).toEqual([
      'delivery-1',
      'delivery-3',
    ]);
  });

  it('builds stable reminder keys for the same booking window', () => {
    const booking = {
      id: 'booking-1',
      start_time: '2026-05-12T09:45:00.000Z',
    };

    expect(getReminderIdempotencyKey(booking)).toBe(
      getReminderIdempotencyKey({
        id: 'booking-1',
        start_time: '2026-05-12T09:15:00.000Z',
      })
    );
  });
});
