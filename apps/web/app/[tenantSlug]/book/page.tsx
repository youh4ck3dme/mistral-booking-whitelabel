import { getServerSession } from '@repo/web/src/lib/auth/server-session';
import { getServicesByTenant } from '@repo/web/src/lib/booking/booking.service';
import { getServerTenantContext } from '@repo/web/src/lib/tenant/server-tenant-context';
import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';
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

  const supabase = createServiceRoleClient();
  const [initialServices, timeSlotsResult] = await Promise.all([
    getServicesByTenant(tenantContext.tenant.id),
    supabase
      .from('time_slots_config')
      .select('start_time, end_time')
      .eq('tenant_id', tenantContext.tenant.id)
      .eq('is_active', true)
      .order('start_time', { ascending: true }),
  ]);

  // Use DB config if available, fall back to defaults
  const timeSlots = timeSlotsResult.data ?? [];
  const operatingHours =
    timeSlots.length > 0
      ? { start: timeSlots[0].start_time, end: timeSlots[timeSlots.length - 1].end_time }
      : { start: '08:00:00', end: '18:00:00' };

  return (
    <BookingPageClient
      initialServices={initialServices}
      operatingHours={operatingHours}
    />
  );
}
