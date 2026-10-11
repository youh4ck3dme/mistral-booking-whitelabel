import { createClient } from '@repo/web/src/utils/supabase/server';
import {
  buildManageUrl,
  generateManageToken,
  hashManageToken,
  isWellFormedManageToken,
} from '@repo/web/src/lib/booking/manage-token';
import { getAppUrl } from '@repo/web/src/lib/app-url';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const slugSchema = z.string().regex(/^[a-z0-9-]{1,63}$/);

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('read'), tenantSlug: slugSchema, token: z.string() }),
  z.object({ action: z.literal('cancel'), tenantSlug: slugSchema, token: z.string() }),
  z.object({
    action: z.literal('reschedule'),
    tenantSlug: slugSchema,
    token: z.string(),
    startTime: z.string().datetime({ offset: true }),
  }),
]);

const NO_STORE = { 'Cache-Control': 'no-store' };

// Every token failure looks the same to the caller, so the response does not
// reveal whether a booking exists. Only the holder of a valid token gets detail.
const RESCHEDULE_FAILURES: Record<string, { http: number; error: string }> = {
  invalid: { http: 404, error: 'Odkaz nie je platný.' },
  expired: { http: 410, error: 'Odkaz vypršal.' },
  already_cancelled: { http: 409, error: 'Rezervácia je zrušená.' },
  not_editable: { http: 409, error: 'Rezerváciu už nie je možné upraviť.' },
  in_past: { http: 422, error: 'Nový termín musí byť v budúcnosti.' },
  outside_hours: { http: 422, error: 'Termín je mimo otváracích hodín.' },
  slot_taken: { http: 409, error: 'Tento termín je už obsadený. Vyberte iný.' },
};

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Neplatné dáta.' }, { status: 400, headers: NO_STORE });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatné dáta.' }, { status: 400, headers: NO_STORE });
  }

  const body = parsed.data;
  if (!isWellFormedManageToken(body.token)) {
    return NextResponse.json({ status: 'invalid', error: 'Odkaz nie je platný.' }, { status: 404, headers: NO_STORE });
  }

  // The raw token is hashed here and never sent to the database.
  const tokenHash = hashManageToken(body.token);
  const supabase = createClient();

  if (body.action === 'read') {
    const { data, error } = await supabase.rpc('get_booking_by_manage_token', {
      p_token_hash: tokenHash,
      p_tenant_slug: body.tenantSlug,
    });
    if (error) {
      console.error('get_booking_by_manage_token failed', error.code);
      return NextResponse.json({ error: 'Nepodarilo sa načítať rezerváciu.' }, { status: 500, headers: NO_STORE });
    }
    const result = data as { status: string; booking?: unknown };
    if (result.status === 'ok') {
      return NextResponse.json(result, { headers: NO_STORE });
    }
    const http = result.status === 'expired' ? 410 : 404;
    return NextResponse.json(
      { status: result.status, error: RESCHEDULE_FAILURES[result.status]?.error ?? 'Odkaz nie je platný.' },
      { status: http, headers: NO_STORE },
    );
  }

  if (body.action === 'cancel') {
    const { data, error } = await supabase.rpc('cancel_booking_by_token', {
      p_token_hash: tokenHash,
      p_tenant_slug: body.tenantSlug,
    });
    if (error) {
      console.error('cancel_booking_by_token failed', error.code);
      return NextResponse.json({ error: 'Storno sa nepodarilo dokončiť.' }, { status: 500, headers: NO_STORE });
    }
    const result = data as { status: string };
    // Repeated cancellation is a success: the booking is cancelled either way.
    if (result.status === 'ok' || result.status === 'already_cancelled') {
      return NextResponse.json({ status: result.status }, { headers: NO_STORE });
    }
    const failure = RESCHEDULE_FAILURES[result.status] ?? { http: 404, error: 'Odkaz nie je platný.' };
    return NextResponse.json({ status: result.status, error: failure.error }, { status: failure.http, headers: NO_STORE });
  }

  // reschedule: rotate to a fresh token. The new raw token is returned once, to the holder.
  const newToken = generateManageToken();
  const { data, error } = await supabase.rpc('reschedule_booking_by_token', {
    p_token_hash: tokenHash,
    p_tenant_slug: body.tenantSlug,
    p_new_start: body.startTime,
    p_new_token_hash: hashManageToken(newToken),
  });
  if (error) {
    console.error('reschedule_booking_by_token failed', error.code);
    return NextResponse.json({ error: 'Presun sa nepodarilo dokončiť.' }, { status: 500, headers: NO_STORE });
  }

  const result = data as { status: string; startTime?: string; endTime?: string };
  if (result.status !== 'ok') {
    const failure = RESCHEDULE_FAILURES[result.status] ?? { http: 404, error: 'Odkaz nie je platný.' };
    return NextResponse.json({ status: result.status, error: failure.error }, { status: failure.http, headers: NO_STORE });
  }

  return NextResponse.json(
    {
      status: 'ok',
      startTime: result.startTime,
      endTime: result.endTime,
      manageUrl: buildManageUrl(getAppUrl(), body.tenantSlug, newToken),
    },
    { headers: NO_STORE },
  );
}
