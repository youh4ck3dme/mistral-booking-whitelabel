import { getServerSession } from '@repo/web/src/lib/auth/server-session';
import { getServicesByTenant } from '@repo/web/src/lib/booking/booking.service';
import { getServerTenantContext } from '@repo/web/src/lib/tenant/server-tenant-context';
import { redirect } from 'next/navigation';
import { BookingFunnel } from '@repo/web/components/booking/BookingFunnel';
import BookingAssistantWidget from './booking-assistant-widget';

export const dynamic = 'force-dynamic';

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { tenantSlug: string };
  searchParams?: { service?: string };
}) {
  const session = await getServerSession();
  const tenantContext = await getServerTenantContext(params.tenantSlug, session?.user?.id);

  if (!tenantContext) {
    redirect('/404');
  }

  const initialServices = await getServicesByTenant(tenantContext.tenant.id);

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Tenant Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            Online rezervácia termínu
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {tenantContext.tenant.name}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Vyberte si službu, čas a potvrďte rezerváciu za menej ako 30 sekúnd.
          </p>
        </div>

        {/* 4-Step Frictionless Booking Funnel */}
        <BookingFunnel
          tenant={tenantContext.tenant}
          branding={tenantContext.branding}
          initialServices={initialServices}
          preselectedServiceId={searchParams?.service ?? null}
        />
      </div>

      <BookingAssistantWidget />
    </div>
  );
}
