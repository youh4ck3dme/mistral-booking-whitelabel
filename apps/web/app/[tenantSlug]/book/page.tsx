import { getServerSession } from '@repo/web/src/lib/auth/server-session';
import { getServicesByTenant } from '@repo/web/src/lib/booking/booking.service';
import { getServerTenantContext } from '@repo/web/src/lib/tenant/server-tenant-context';
import { redirect } from 'next/navigation';
import BookingPageClient from './booking-page-client';

export default async function BookingPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const session = await getServerSession();
  const tenantContext = await getServerTenantContext(params.tenantSlug, session?.user?.id);

  if (!tenantContext) {
    redirect('/404');
  }

  const initialServices = await getServicesByTenant(tenantContext.tenant.id);

  return <BookingPageClient initialServices={initialServices} />;
}
