import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';
import {
  buildManageUrl,
  hashManageToken,
  isWellFormedManageToken,
} from '@repo/web/src/lib/booking/manage-token';
import { getAppUrl } from '@repo/web/src/lib/app-url';
import { SuccessViewClient } from './success-view-client';
import { ArrowLeft, CalendarX } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface SuccessPageProps {
  params: {
    tenantSlug: string;
  };
  searchParams?: {
    booking_id?: string;
    token?: string;
  };
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { tenantSlug } = params;
  const token = searchParams?.token;
  const bookingIdParam = searchParams?.booking_id;

  if (!token || !isWellFormedManageToken(token)) {
    return (
      <div className="min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white/90 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/80 p-8 text-center space-y-6 backdrop-blur-xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400">
            <CalendarX className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Rezervácia nebola nájdená</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Chýba platný autentifikačný token alebo odkaz vypršal.
            </p>
          </div>
          <Link
            href={`/${tenantSlug}/book`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Nová rezervácia
          </Link>
        </div>
      </div>
    );
  }

  const supabase = createServiceRoleClient();
  const tokenHash = hashManageToken(token);

  // 1. Fetch booking details via SEC-safe RPC get_booking_by_manage_token
  const { data, error } = await supabase.rpc('get_booking_by_manage_token', {
    p_token_hash: tokenHash,
    p_tenant_slug: tenantSlug,
  });

  if (error || !data || (data as { status: string }).status !== 'ok') {
    return (
      <div className="min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white/90 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/80 p-8 text-center space-y-6 backdrop-blur-xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400">
            <CalendarX className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Neplatný odkaz</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Tento odkaz na rezerváciu už neexistuje alebo vypršal.
            </p>
          </div>
          <Link
            href={`/${tenantSlug}/book`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Späť na rezervácie
          </Link>
        </div>
      </div>
    );
  }

  const rpcResult = data as {
    status: string;
    booking: {
      id: string;
      startTime: string;
      endTime: string;
      status: string;
      serviceName: string;
      serviceDuration: number;
      servicePrice: number;
      tenantName: string;
      tenantSlug: string;
    };
  };

  const booking = rpcResult.booking;

  // 2. Resolve staff name if assigned
  let staffName = 'Pridelený špecialista';
  const targetBookingId = booking.id || bookingIdParam;

  if (targetBookingId) {
    const { data: bRow } = await supabase
      .from('bookings')
      .select('staff_id, staff:staff_id(display_name)')
      .eq('id', targetBookingId)
      .maybeSingle();

    if (bRow?.staff && typeof bRow.staff === 'object' && 'display_name' in bRow.staff) {
      staffName = (bRow.staff as { display_name: string }).display_name;
    }
  }

  const manageUrl = buildManageUrl(getAppUrl(), tenantSlug, token);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <SuccessViewClient
        tenantName={booking.tenantName}
        tenantSlug={booking.tenantSlug}
        bookingId={booking.id}
        token={token}
        serviceName={booking.serviceName}
        serviceDuration={booking.serviceDuration}
        servicePrice={booking.servicePrice}
        staffName={staffName}
        startTime={booking.startTime}
        endTime={booking.endTime}
        manageUrl={manageUrl}
      />
    </div>
  );
}
