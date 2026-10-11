import { getServerUser } from '@repo/web/src/lib/auth/server-user';
import { createClient } from '@repo/web/src/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ bookingId: z.string().uuid() });
const bodySchema = z.object({ outcome: z.enum(['completed', 'no_show']) });

/**
 * Records completed or no-show for a booking. Authorization and the
 * "appointment has started" rule are enforced inside set_booking_outcome(),
 * so this route only maps database errors to HTTP status codes.
 */
export async function POST(
  request: Request,
  { params }: { params: { bookingId: string } }
) {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'outcome must be completed or no_show' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc('set_booking_outcome', {
    p_booking_id: parsedParams.data.bookingId,
    p_outcome: parsedBody.data.outcome,
  });

  if (error) {
    switch (error.code) {
      case '42501':
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      case 'P0002':
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      case 'P0001':
        return NextResponse.json({ error: error.message }, { status: 409 });
      case '23514':
        return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 });
      default:
        console.error('set_booking_outcome failed', error.code);
        return NextResponse.json({ error: 'Could not record outcome' }, { status: 500 });
    }
  }

  return NextResponse.json({ bookingId: parsedParams.data.bookingId, status: data });
}
