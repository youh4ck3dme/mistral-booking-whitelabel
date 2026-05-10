import { NextResponse } from 'next/server';

import { runReminderDispatchCycle } from '@repo/web/src/lib/notifications/reminders';

function isAuthorized(request: Request) {
  const secret = process.env.NOTIFICATION_CRON_SECRET;

  if (!secret) {
    throw new Error('NOTIFICATION_CRON_SECRET is not configured.');
  }

  const authorization = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-notification-secret');

  return authorization === `Bearer ${secret}` || headerSecret === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runReminderDispatchCycle();
  return NextResponse.json(result);
}
