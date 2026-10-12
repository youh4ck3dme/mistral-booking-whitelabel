import { NextResponse } from 'next/server';

import { isCronRequestAuthorized } from '@repo/web/src/lib/notifications/cron-auth';
import { runReminderDispatchCycle } from '@repo/web/src/lib/notifications/reminders';
import { checkRequestRateLimit } from '@repo/web/src/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

function getCronSecret() {
  return process.env.NOTIFICATION_CRON_SECRET;
}

export async function POST(request: Request) {
  const rateLimitGuard = checkRequestRateLimit(request, 'notifications');
  if (!rateLimitGuard.allowed) {
    return rateLimitGuard.response;
  }

  const secret = getCronSecret();

  if (!secret) {
    return NextResponse.json(
      { error: 'NOTIFICATION_CRON_SECRET is not configured.' },
      { status: 503 }
    );
  }

  if (!isCronRequestAuthorized(request.headers, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runReminderDispatchCycle();
  return NextResponse.json(result);
}
