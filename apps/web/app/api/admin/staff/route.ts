import { getServerUser } from '@repo/web/src/lib/auth/server-user';
import { createClient } from '@repo/web/src/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const uuid = z.string().uuid();
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const weekday = z.number().int().min(1).max(7);

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('createStaff'),
    tenantSlug: z.string().regex(/^[a-z0-9-]{1,63}$/),
    displayName: z.string().trim().min(1).max(80),
  }),
  z.object({
    action: z.literal('updateStaff'),
    tenantSlug: z.string().regex(/^[a-z0-9-]{1,63}$/),
    staffId: uuid,
    displayName: z.string().trim().min(1).max(80).optional(),
    isActive: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('setServiceStaff'),
    tenantSlug: z.string().regex(/^[a-z0-9-]{1,63}$/),
    serviceId: uuid,
    staffIds: z.array(uuid).max(100),
  }),
  z.object({
    action: z.literal('setWorkingHours'),
    tenantSlug: z.string().regex(/^[a-z0-9-]{1,63}$/),
    staffId: uuid,
    weekday,
    // null clears the day. Otherwise a single working interval for that weekday.
    interval: z.object({ start: timeOfDay, end: timeOfDay }).nullable(),
  }).refine(v => v.interval === null || v.interval.start < v.interval.end, {
    message: 'Koniec musí byť po začiatku.',
    path: ['interval'],
  }),
  z.object({
    action: z.literal('setBreak'),
    tenantSlug: z.string().regex(/^[a-z0-9-]{1,63}$/),
    staffId: uuid,
    weekday,
    interval: z.object({ start: timeOfDay, end: timeOfDay }).nullable(),
  }).refine(v => v.interval === null || v.interval.start < v.interval.end, {
    message: 'Koniec musí byť po začiatku.',
    path: ['interval'],
  }),
  z.object({
    action: z.literal('addTimeOff'),
    tenantSlug: z.string().regex(/^[a-z0-9-]{1,63}$/),
    staffId: uuid,
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    reason: z.string().trim().max(200).optional(),
  }).refine(v => new Date(v.startsAt) < new Date(v.endsAt), {
    message: 'Koniec musí byť po začiatku.',
    path: ['endsAt'],
  }),
  z.object({
    action: z.literal('removeTimeOff'),
    tenantSlug: z.string().regex(/^[a-z0-9-]{1,63}$/),
    timeOffId: uuid,
  }),
]);

/**
 * Staff administration. The session client runs every write, so RLS
 * (is_tenant_admin per tenant) is the authority. Non-admins and cross-tenant
 * writes come back as 403 from the database, not from this code.
 */
export async function POST(request: Request) {
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
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Neplatné dáta.' }, { status: 400, headers: NO_STORE });
  }

  const body = parsed.data;
  const supabase = createClient();

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', body.tenantSlug)
    .maybeSingle();
  if (tenantError) {
    return NextResponse.json({ error: 'Nepodarilo sa uložiť.' }, { status: 500, headers: NO_STORE });
  }
  if (!tenant) {
    return NextResponse.json({ error: 'Prevádzka sa nenašla.' }, { status: 404, headers: NO_STORE });
  }
  const tenantId = tenant.id as string;

  const fail = (error: { code?: string; message?: string }) => {
    if (error.code === '42501') {
      return NextResponse.json({ error: 'Na túto zmenu nemáte oprávnenie.' }, { status: 403, headers: NO_STORE });
    }
    if (error.code === '23505' || error.code === '23514') {
      return NextResponse.json({ error: 'Údaje nie sú platné alebo sa kolidujú s existujúcimi.' }, { status: 409, headers: NO_STORE });
    }
    console.error('staff admin write failed', error.code);
    return NextResponse.json({ error: 'Nepodarilo sa uložiť.' }, { status: 500, headers: NO_STORE });
  };

  switch (body.action) {
    case 'createStaff': {
      const { data, error } = await supabase
        .from('staff')
        .insert({ tenant_id: tenantId, display_name: body.displayName })
        .select('id, display_name, is_active')
        .single();
      if (error) return fail(error);
      return NextResponse.json({ staff: data }, { headers: NO_STORE });
    }

    case 'updateStaff': {
      const patch: Record<string, unknown> = {};
      if (body.displayName !== undefined) patch.display_name = body.displayName;
      if (body.isActive !== undefined) patch.is_active = body.isActive;
      const { data, error } = await supabase
        .from('staff')
        .update(patch)
        .eq('id', body.staffId)
        .eq('tenant_id', tenantId)
        .select('id, display_name, is_active');
      if (error) return fail(error);
      if (!data || data.length === 0) return NextResponse.json({ error: 'Pracovník sa nenašiel.' }, { status: 404, headers: NO_STORE });
      return NextResponse.json({ staff: data[0] }, { headers: NO_STORE });
    }

    case 'setServiceStaff': {
      // Add the new pairs first, then remove the ones no longer wanted. The order keeps
      // every service with at least the staff it had before a failed write.
      const wanted = Array.from(new Set(body.staffIds));
      if (wanted.length > 0) {
        const { error } = await supabase
          .from('service_staff')
          .upsert(wanted.map(staffId => ({ tenant_id: tenantId, service_id: body.serviceId, staff_id: staffId })),
            { onConflict: 'service_id,staff_id', ignoreDuplicates: true });
        if (error) return fail(error);
      }
      const { error: deleteError } = await supabase
        .from('service_staff')
        .delete()
        .eq('service_id', body.serviceId)
        .eq('tenant_id', tenantId)
        .not('staff_id', 'in', `(${wanted.length > 0 ? wanted.join(',') : '00000000-0000-0000-0000-000000000000'})`);
      if (deleteError) return fail(deleteError);
      return NextResponse.json({ serviceId: body.serviceId, staffIds: wanted }, { headers: NO_STORE });
    }

    case 'setWorkingHours': {
      const { error: deleteError } = await supabase
        .from('staff_working_hours')
        .delete()
        .eq('staff_id', body.staffId)
        .eq('tenant_id', tenantId)
        .eq('weekday', body.weekday);
      if (deleteError) return fail(deleteError);
      if (body.interval) {
        const { error } = await supabase.from('staff_working_hours').insert({
          tenant_id: tenantId,
          staff_id: body.staffId,
          weekday: body.weekday,
          start_time: body.interval.start,
          end_time: body.interval.end,
        });
        if (error) return fail(error);
      }
      return NextResponse.json({ ok: true }, { headers: NO_STORE });
    }

    case 'setBreak': {
      const { error: deleteError } = await supabase
        .from('staff_breaks')
        .delete()
        .eq('staff_id', body.staffId)
        .eq('tenant_id', tenantId)
        .eq('weekday', body.weekday);
      if (deleteError) return fail(deleteError);
      if (body.interval) {
        const { error } = await supabase.from('staff_breaks').insert({
          tenant_id: tenantId,
          staff_id: body.staffId,
          weekday: body.weekday,
          start_time: body.interval.start,
          end_time: body.interval.end,
        });
        if (error) return fail(error);
      }
      return NextResponse.json({ ok: true }, { headers: NO_STORE });
    }

    case 'addTimeOff': {
      const { data, error } = await supabase
        .from('staff_time_off')
        .insert({
          tenant_id: tenantId,
          staff_id: body.staffId,
          starts_at: body.startsAt,
          ends_at: body.endsAt,
          reason: body.reason ?? null,
        })
        .select('id, starts_at, ends_at, reason')
        .single();
      if (error) return fail(error);
      return NextResponse.json({ timeOff: data }, { headers: NO_STORE });
    }

    case 'removeTimeOff': {
      const { data, error } = await supabase
        .from('staff_time_off')
        .delete()
        .eq('id', body.timeOffId)
        .eq('tenant_id', tenantId)
        .select('id');
      if (error) return fail(error);
      if (!data || data.length === 0) return NextResponse.json({ error: 'Záznam sa nenašiel.' }, { status: 404, headers: NO_STORE });
      return NextResponse.json({ ok: true }, { headers: NO_STORE });
    }
  }
}
