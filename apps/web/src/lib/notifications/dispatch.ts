import {
  cancelNotificationDelivery,
  claimPendingNotificationDeliveries,
  dedupeDeliveries,
  getNotificationContext,
  markNotificationDeliverySent,
  recordNotificationFailure,
} from './repository';
import { isNotificationProviderConfigured, sendTransactionalEmail } from './provider';
import { renderNotificationEmailWithAI } from './ai-content';
import type { NotificationDelivery, NotificationDispatchResult } from './types';

type DeliveryOutcome = 'sent' | 'cancelled';

async function processDelivery(delivery: NotificationDelivery): Promise<DeliveryOutcome> {
  const context = await getNotificationContext(delivery);

  // A reminder for a booking that was cancelled or moved after claiming must not go out.
  if (delivery.notification_type === 'booking_reminder' && context.booking.status !== 'confirmed') {
    await cancelNotificationDelivery(delivery.id, 'booking is no longer confirmed');
    return 'cancelled';
  }

  const emailPayload = await renderNotificationEmailWithAI(context);
  const providerResponse = await sendTransactionalEmail(emailPayload);

  await markNotificationDeliverySent(delivery.id, providerResponse.id, emailPayload.subject);
  return 'sent';
}

export async function processPendingNotificationDeliveries({
  bookingId,
  limit = Number(process.env.NOTIFICATION_BATCH_SIZE ?? 20),
}: {
  bookingId?: string;
  limit?: number;
} = {}): Promise<NotificationDispatchResult> {
  // Without credentials nothing is claimed, so pending rows stay pending and no attempt is used up.
  if (!isNotificationProviderConfigured()) {
    return { failed: 0, processed: 0, sent: 0, skipped: 'provider_disabled' };
  }

  const deliveries = dedupeDeliveries(
    await claimPendingNotificationDeliveries({
      bookingId,
      limit,
    })
  );

  let sent = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    try {
      const outcome = await processDelivery(delivery);
      if (outcome === 'sent') {
        sent += 1;
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : 'Unknown notification delivery failure';
      await recordNotificationFailure(delivery.id, message);
    }
  }

  return {
    failed,
    processed: deliveries.length,
    sent,
  };
}
