import { getServerUser } from '@repo/web/src/lib/auth/server-user';
import { getAppUrl } from '@repo/web/src/lib/app-url';
import {
  buildManageUrl,
  generateManageToken,
  hashManageToken,
} from '@repo/web/src/lib/booking/manage-token';
import { sendManageLinkEmail } from '@repo/web/src/lib/booking/manage-link-email';
import { createClient } from '@repo/web/src/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ bookingId: z.string().uuid() });
const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * Issues (or rotates) the management link for a booking. The RPC checks that the
 * caller owns the booking or is tenant staff, so this route only shapes the response.
 * The raw token is returned once and is never stored.
 */
export async function POST(_request: Request, { params }: { params: { bookingId: string } }) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
  }

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Neplatné ID rezervácie.' }, { status: 400, headers: NO_STORE });
  }
  const bookingId = parsedParams.data.bookingId;

  const supabase = createClient();

  // Visibility under RLS doubles as the first authorization check.
  const { data: booking, error: lookupError } = await supabase
    .from('bookings')
    .select('start_time, services(name), tenants(name, slug)')
    .eq('id', bookingId)
    .maybeSingle();

  if (lookupError) {
    console.error('manage-link lookup failed', lookupError.code);
    return NextResponse.json({ error: 'Nepodarilo sa načítať rezerváciu.' }, { status: 500, headers: NO_STORE });
  }
  if (!booking) {
    return NextResponse.json({ error: 'Rezervácia sa nenašla.' }, { status: 404, headers: NO_STORE });
  }

  const tenant = booking.tenants as unknown as { name: string; slug: string } | null;
  const service = booking.services as unknown as { name: string } | null;
  if (!tenant) {
    return NextResponse.json({ error: 'Rezervácia sa nenašla.' }, { status: 404, headers: NO_STORE });
  }

  const token = generateManageToken();
  const { data, error } = await supabase.rpc('issue_booking_manage_token', {
    p_booking_id: bookingId,
    p_token_hash: hashManageToken(token),
  });

  if (error) {
    switch (error.code) {
      case '42501':
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE });
      case 'P0002':
        return NextResponse.json({ error: 'Rezervácia sa nenašla.' }, { status: 404, headers: NO_STORE });
      case 'P0001':
        return NextResponse.json({ error: error.message }, { status: 409, headers: NO_STORE });
      default:
        console.error('issue_booking_manage_token failed', error.code);
        return NextResponse.json({ error: 'Odkaz sa nepodarilo vytvoriť.' }, { status: 500, headers: NO_STORE });
    }
  }

  const issued = data as { expiresAt: string; actor: 'customer' | 'staff' };
  const manageUrl = buildManageUrl(getAppUrl(), tenant.slug, token);

  // Email goes out only for the customer's own confirmation, and only when the adapter is configured.
  let email: { sent: boolean; reason?: string } = { sent: false, reason: 'not_requested' };
  if (issued.actor === 'customer' && user.email) {
    email = await sendManageLinkEmail({
      to: user.email,
      tenantName: tenant.name,
      serviceName: service?.name ?? 'Služba',
      startTime: booking.start_time as string,
      manageUrl,
    });
  }

  return NextResponse.json(
    { bookingId, manageUrl, expiresAt: issued.expiresAt, email },
    { headers: NO_STORE },
  );
}
