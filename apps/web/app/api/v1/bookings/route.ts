import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateApiV1 } from '@repo/web/src/lib/api-v1/auth';
import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
  'Cache-Control': 'no-store',
};

const customerSchema = z.object({
  name: z.string().min(1, 'Meno zákazníka je povinné'),
  email: z.string().email('Neplatný e-mail'),
  phone: z.string().min(3, 'Telefónne číslo je povinné'),
});

const createBookingSchema = z.object({
  customer: customerSchema,
  serviceId: z.string().min(1, 'serviceId je povinné'),
  startAt: z.string().min(1, 'startAt je povinné'),
  notes: z.string().optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function parseStartAt(startAt: string): { date: string; timeSlot: string; startIso: string } | null {
  try {
    if (startAt.includes('T')) {
      const d = new Date(startAt);
      if (Number.isNaN(d.getTime())) return null;
      const date = d.toISOString().slice(0, 10);
      const timeSlot = d.toISOString().slice(11, 16);
      return { date, timeSlot, startIso: d.toISOString() };
    }

    if (startAt.includes(' ')) {
      const [dPart, tPart] = startAt.trim().split(/\s+/);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dPart) && /^\d{1,2}:\d{2}/.test(tPart)) {
        const timeSlot = tPart.slice(0, 5).padStart(5, '0');
        const startIso = new Date(`${dPart}T${timeSlot}:00Z`).toISOString();
        return { date: dPart, timeSlot, startIso };
      }
    }

    const d = new Date(startAt);
    if (!Number.isNaN(d.getTime())) {
      const date = d.toISOString().slice(0, 10);
      const timeSlot = d.toISOString().slice(11, 16);
      return { date, timeSlot, startIso: d.toISOString() };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * POST /api/v1/bookings
 * 
 * Creates a new booking via AutoOps AI connector.
 * Payload: { customer: { name, email, phone }, serviceId, startAt, notes? }
 */
export async function POST(req: NextRequest) {
  const authResult = await authenticateApiV1(req);
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { tenant } = authResult;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Neplatný JSON formát v tele požiadavky.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json(
      { error: `Neplatné údaje: ${errorMsg}` },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { customer, serviceId, startAt, notes } = parsed.data;

  const parsedTime = parseStartAt(startAt);
  if (!parsedTime) {
    return NextResponse.json(
      { error: 'Neplatný formát startAt. Použite ISO 8601 (napr. 2026-10-14T10:00:00Z) alebo YYYY-MM-DD HH:mm.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { date, timeSlot, startIso } = parsedTime;

  try {
    const supabase = createServiceRoleClient();

    // 1. Look up service to obtain name and duration
    let serviceName = 'Služba';
    let duration = 30;

    const { data: serviceData } = await (supabase as any)
      .from('services')
      .select('name, name_sk, name_en, duration')
      .eq('id', serviceId)
      .maybeSingle();

    if (serviceData) {
      serviceName = serviceData.name ?? serviceData.name_sk ?? serviceData.name_en ?? 'Služba';
      duration = Number(serviceData.duration) || 30;
    }

    const endIso = new Date(new Date(startIso).getTime() + duration * 60_000).toISOString();

    // 2. Check for slot conflict
    const { data: conflict } = await (supabase as any)
      .from('bookings')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('date', date)
      .eq('time_slot', timeSlot)
      .neq('status', 'cancelled')
      .limit(1)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json(
        { error: 'Termín je už obsadený. Vyberte si prosím iný voľný slot.' },
        { status: 409, headers: CORS_HEADERS }
      );
    }

    // 3. Insert new booking
    const insertPayload: Record<string, any> = {
      tenant_id: tenant.id,
      service_id: serviceId,
      date,
      time_slot: timeSlot,
      client_name: customer.name,
      client_email: customer.email,
      client_phone: customer.phone,
      booking_duration: duration,
      status: 'confirmed',
    };

    if (notes) {
      insertPayload.notes = notes;
    }

    const { data: createdBooking, error: insertError } = await (supabase as any)
      .from('bookings')
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      console.error('[api-v1/bookings] Insert failed:', insertError);
      return NextResponse.json(
        { error: `Chyba pri ukladaní rezervácie: ${insertError.message}` },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: createdBooking.id,
          tenantId: tenant.id,
          serviceId,
          serviceName,
          startAt: startIso,
          date,
          time: timeSlot,
          duration,
          customer,
          status: 'confirmed',
          notes: notes ?? null,
        },
      },
      {
        status: 201,
        headers: CORS_HEADERS,
      }
    );
  } catch (err: any) {
    console.error('[api-v1/bookings] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Nastala neočakávaná chyba pri vytváraní rezervácie.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
