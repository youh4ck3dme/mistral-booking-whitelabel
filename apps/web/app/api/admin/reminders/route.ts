import { getServerUser } from '@repo/web/src/lib/auth/server-user';
import { checkRequestRateLimit } from '@repo/web/src/lib/security/rate-limit';
import { createClient } from '@repo/web/src/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const STATUSES = ['pending', 'processing', 'sent', 'failed', 'cancelled'] as const;
const DEFAULTS = { enabled: true, leadMinutes: 1440 };

const slugSchema = z.string().regex(/^[a-z0-9-]{1,63}$/);
const settingsSchema = z.object({
  tenantSlug: slugSchema,
  enabled: z.boolean(),
  leadMinutes: z.number().int().min(60).max(10080),
});

async function resolveTenant(supabase: ReturnType<typeof createClient>, slug: string) {
  const { data, error } = await supabase.from('tenants').select('id').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data as { id: string } | null;
}

/**
 * Reminder status for one tenant. RLS allows reading the outbox to tenant admins only,
 * so non-admins get zero counts and no rows. Recipient e-mail addresses are never returned.
 */
export async function GET(request: Request) {
  const rateLimitGuard = checkRequestRateLimit(request, 'notifications');
  if (!rateLimitGuard.allowed) {
    return rateLimitGuard.response;
  }

  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
  }

  const slug = new URL(request.url).searchParams.get('tenantSlug');
  if (!slugSchema.safeParse(slug).success) {
    return NextResponse.json({ error: 'Neplatné parametre.' }, { status: 400, headers: NO_STORE });
  }

  const supabase = createClient();
  const tenant = await resolveTenant(supabase, slug as string).catch(() => null);
  if (!tenant) {
    return NextResponse.json({ error: 'Prevádzka sa nenašla.' }, { status: 404, headers: NO_STORE });
  }

  const [settingsResult, counts, recent] = await Promise.all([
    supabase.from('tenant_reminder_settings').select('enabled, lead_minutes').eq('tenant_id', tenant.id).maybeSingle(),
    Promise.all(STATUSES.map(status =>
      supabase.from('notification_deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('notification_type', 'booking_reminder')
        .eq('status', status)
        .then(result => [status, result.count ?? 0] as const),
    )),
    supabase.from('notification_deliveries')
      .select('booking_id, status, scheduled_for, sent_at, attempt_count, error_message')
      .eq('tenant_id', tenant.id)
      .eq('notification_type', 'booking_reminder')
      .order('scheduled_for', { ascending: false })
      .limit(20),
  ]);

  if (settingsResult.error || recent.error) {
    console.error('reminder status read failed');
    return NextResponse.json({ error: 'Nepodarilo sa načítať stav pripomienok.' }, { status: 500, headers: NO_STORE });
  }

  const settings = settingsResult.data
    ? { enabled: settingsResult.data.enabled as boolean, leadMinutes: settingsResult.data.lead_minutes as number }
    : DEFAULTS;

  return NextResponse.json(
    {
      settings,
      counts: Object.fromEntries(counts),
      recent: recent.data ?? [],
    },
    { headers: NO_STORE },
  );
}

export async function POST(request: Request) {
  const rateLimitGuard = checkRequestRateLimit(request, 'notifications');
  if (!rateLimitGuard.allowed) {
    return rateLimitGuard.response;
  }

  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Neplatné dáta.' }, { status: 400, headers: NO_STORE });
  }
  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatné nastavenie pripomienok.' }, { status: 400, headers: NO_STORE });
  }

  const supabase = createClient();
  const tenant = await resolveTenant(supabase, parsed.data.tenantSlug).catch(() => null);
  if (!tenant) {
    return NextResponse.json({ error: 'Prevádzka sa nenašla.' }, { status: 404, headers: NO_STORE });
  }

  // RLS (is_tenant_admin) decides whether this write is allowed.
  const { error } = await supabase.from('tenant_reminder_settings').upsert(
    {
      tenant_id: tenant.id,
      enabled: parsed.data.enabled,
      lead_minutes: parsed.data.leadMinutes,
    },
    { onConflict: 'tenant_id' },
  );

  if (error) {
    if (error.code === '42501') {
      return NextResponse.json({ error: 'Na túto zmenu nemáte oprávnenie.' }, { status: 403, headers: NO_STORE });
    }
    console.error('reminder settings write failed', error.code);
    return NextResponse.json({ error: 'Nastavenie sa nepodarilo uložiť.' }, { status: 500, headers: NO_STORE });
  }

  return NextResponse.json({ settings: { enabled: parsed.data.enabled, leadMinutes: parsed.data.leadMinutes } }, { headers: NO_STORE });
}
