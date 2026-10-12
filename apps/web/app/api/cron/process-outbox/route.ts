import { NextResponse } from 'next/server';
import { isCronRequestAuthorized } from '@repo/web/src/lib/notifications/cron-auth';
import { processPendingNotificationDeliveries } from '@repo/web/src/lib/notifications/dispatch';
import { checkRequestRateLimit } from '@repo/web/src/lib/security/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel Hobby hard timeout safety

function getCronSecret(): string | undefined {
  return process.env.CRON_SECRET || process.env.NOTIFICATION_CRON_SECRET;
}

export async function POST(request: Request) {
  const rateLimitGuard = checkRequestRateLimit(request, 'notifications');
  if (!rateLimitGuard.allowed) {
    return rateLimitGuard.response;
  }

  const secret = getCronSecret();

  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured.' },
      { status: 503 }
    );
  }

  if (!isCronRequestAuthorized(request.headers, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Process batch of pending notification deliveries (max 10 to ensure completion within 10s on Hobby)
    const result = await processPendingNotificationDeliveries({
      limit: 10,
    });

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Outbox processing failed';
    console.error('[cron/process-outbox] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Vercel Cron sends GET requests by default!
  return POST(request);
}
