import { getServerUser } from '@repo/web/src/lib/auth/server-user';
import { NextResponse } from 'next/server';

import { processPendingNotificationDeliveries } from '@repo/web/src/lib/notifications/dispatch';
import { verifyBookingAccess } from '@repo/web/src/lib/notifications/repository';

export async function POST(request: Request) {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { bookingId?: string };

  if (!body.bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
  }

  const booking = await verifyBookingAccess(body.bookingId, user.id);

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const result = await processPendingNotificationDeliveries({
    bookingId: body.bookingId,
    limit: 10,
  });

  return NextResponse.json(result);
}
