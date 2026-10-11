import type { Metadata } from 'next';
import ManageBookingClient from './manage-booking-client';

export const dynamic = 'force-dynamic';

// The token is in the path. Keep it out of the Referer header and out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ManageBookingPage({
  params,
}: {
  params: { tenantSlug: string; token: string };
}) {
  return <ManageBookingClient tenantSlug={params.tenantSlug} token={params.token} />;
}
