import { processPendingNotificationDeliveries } from './dispatch';
import { scheduleReminderNotifications } from './repository';

export async function runReminderDispatchCycle() {
  const scheduled = await scheduleReminderNotifications();
  const dispatch = await processPendingNotificationDeliveries();

  return {
    ...dispatch,
    scheduled,
  };
}
