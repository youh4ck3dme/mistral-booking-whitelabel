import { NextResponse } from 'next/server';
import { isCronRequestAuthorized } from '@repo/web/src/lib/notifications/cron-auth';
import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';
import { checkRequestRateLimit } from '@repo/web/src/lib/security/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

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
    return NextResponse.json({ error: 'CRON_SECRET is not configured.' }, { status: 503 });
  }
  if (!isCronRequestAuthorized(request.headers, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient({ requireServiceRole: true });
    const { data, error } = await supabase.rpc('run_autoops_cycle');
    if (error) {
      console.error('[cron/autoops-worker] rpc failed', error.code);
      return NextResponse.json({ error: 'AutoOps cycle failed.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: data ?? {},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AutoOps worker failed';
    console.error('[cron/autoops-worker]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
