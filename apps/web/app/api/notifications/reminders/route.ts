import { NextResponse } from 'next/server';

import { runReminderDispatchCycle } from '@repo/web/src/lib/notifications/reminders';

function getCronSecret() {
  return process.env.NOTIFICATION_CRON_SECRET;
}

function isAuthorized(request: Request, secret: string) {
  const authorization = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-notification-secret');

  return authorization === `Bearer ${secret}` || headerSecret === secret;
}

export async function POST(request: Request) {
  const secret = getCronSecret();

  if (!secret) {
    return NextResponse.json(
      { error: 'NOTIFICATION_CRON_SECRET is not configured.' },
      { status: 503 }
    );
  }

  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runReminderDispatchCycle();
  return NextResponse.json(result);
}
