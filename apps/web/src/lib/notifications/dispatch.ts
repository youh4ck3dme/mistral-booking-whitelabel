import {
  claimPendingNotificationDeliveries,
  dedupeDeliveries,
  getNotificationContext,
  markNotificationDeliveryFailed,
  markNotificationDeliverySent,
} from './repository';
import { sendTransactionalEmail } from './provider';
import { renderNotificationEmail } from './templates';
import type { NotificationDelivery, NotificationDispatchResult } from './types';

async function processDelivery(delivery: NotificationDelivery) {
  const context = await getNotificationContext(delivery);
  const emailPayload = renderNotificationEmail(context);
  const providerResponse = await sendTransactionalEmail(emailPayload);

  await markNotificationDeliverySent(delivery.id, providerResponse.id, emailPayload.subject);
}

export async function processPendingNotificationDeliveries({
  bookingId,
  limit = Number(process.env.NOTIFICATION_BATCH_SIZE ?? 20),
}: {
  bookingId?: string;
  limit?: number;
} = {}): Promise<NotificationDispatchResult> {
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
      await processDelivery(delivery);
      sent += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : 'Unknown notification delivery failure';
      await markNotificationDeliveryFailed(delivery.id, message);
    }
  }

  return {
    failed,
    processed: deliveries.length,
    sent,
  };
}
