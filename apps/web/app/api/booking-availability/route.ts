import { createClient } from '@repo/web/src/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const MAX_RANGE_DAYS = 31;
const NO_STORE = { 'Cache-Control': 'no-store' };

const querySchema = z.object({
  tenantSlug: z.string().regex(/^[a-z0-9-]{1,63}$/),
  serviceId: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  staffId: z.string().uuid().optional(),
});

function dayList(from: string, to: string): string[] | null {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  const days: string[] = [];
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86_400_000)) {
    days.push(d.toISOString().slice(0, 10));
    if (days.length > MAX_RANGE_DAYS) return null;
  }
  return days;
}

/**
 * Public availability: free slots per day for one service, computed by the database
 * from real staff schedules, breaks, time off and existing bookings.
 * Only tenant slug and service id come from the client. The tenant is resolved here,
 * and the service must belong to it (enforced in SQL).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatné parametre.' }, { status: 400, headers: NO_STORE });
  }

  const days = dayList(parsed.data.from, parsed.data.to);
  if (!days) {
    return NextResponse.json({ error: 'Neplatný rozsah dátumov (max. 31 dní).' }, { status: 400, headers: NO_STORE });
  }

  const supabase = createClient();
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, timezone')
    .eq('slug', parsed.data.tenantSlug)
    .maybeSingle();

  if (tenantError) {
    console.error('availability tenant lookup failed', tenantError.code);
    return NextResponse.json({ error: 'Dostupnosť sa nepodarilo načítať.' }, { status: 500, headers: NO_STORE });
  }
  if (!tenant) {
    return NextResponse.json({ error: 'Prevádzka sa nenašla.' }, { status: 404, headers: NO_STORE });
  }

  const { data: staff, error: staffError } = await supabase.rpc('list_bookable_staff', {
    p_tenant_id: tenant.id,
    p_service_id: parsed.data.serviceId,
  });
  if (staffError) {
    console.error('list_bookable_staff failed', staffError.code);
    return NextResponse.json({ error: 'Dostupnosť sa nepodarilo načítať.' }, { status: 500, headers: NO_STORE });
  }
  if (!staff || staff.length === 0) {
    return NextResponse.json({ error: 'Služba sa nenašla.' }, { status: 404, headers: NO_STORE });
  }

  const results = await Promise.all(
    days.map(async day => {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_tenant_id: tenant.id,
        p_service_id: parsed.data.serviceId,
        p_date: day,
        p_staff_id: parsed.data.staffId ?? null,
      });
      if (error) throw error;
      return [day, (data ?? []).map((row: { staff_id: string; start_time: string; end_time: string }) => ({
        staffId: row.staff_id,
        startTime: row.start_time,
        endTime: row.end_time,
      }))] as const;
    }),
  ).catch(error => {
    console.error('get_available_slots failed', error?.code);
    return null;
  });

  if (!results) {
    return NextResponse.json({ error: 'Dostupnosť sa nepodarilo načítať.' }, { status: 500, headers: NO_STORE });
  }

  return NextResponse.json(
    {
      timezone: tenant.timezone,
      staff: staff.map((s: { id: string; display_name: string }) => ({ id: s.id, name: s.display_name })),
      days: Object.fromEntries(results),
    },
    { headers: NO_STORE },
  );
}
