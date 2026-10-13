import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiV1 } from '@repo/web/src/lib/api-v1/auth';
import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
  'Cache-Control': 'no-store',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * GET /api/v1/bookings/today
 * 
 * AutoOps AI Morning Brief endpoint.
 * Returns all bookings scheduled for today for the authenticated tenant.
 */
export async function GET(req: NextRequest) {
  const authResult = await authenticateApiV1(req);
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { tenant } = authResult;

  // Compute today's date in Central European Time (Europe/Bratislava)
  const todayISO = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bratislava',
  }).format(new Date());

  try {
    const supabase = createServiceRoleClient();

    // 1. Fetch all services for name resolution
    const { data: servicesData } = await (supabase as any)
      .from('services')
      .select('id, name, name_sk, name_en, duration, price')
      .eq('tenant_id', tenant.id);

    const serviceMap = new Map<string, { name: string; duration: number }>();
    if (servicesData && Array.isArray(servicesData)) {
      for (const s of servicesData) {
        serviceMap.set(String(s.id), {
          name: s.name ?? s.name_sk ?? s.name_en ?? 'Služba',
          duration: Number(s.duration) || 30,
        });
      }
    }

    // 2. Fetch today's bookings
    const { data: bookingsData, error } = await (supabase as any)
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('date', todayISO)
      .neq('status', 'cancelled')
      .order('time_slot', { ascending: true });

    if (error) {
      console.error('[api-v1/bookings/today] DB query error:', error);
      return NextResponse.json(
        { date: todayISO, total: 0, bookings: [] },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    const bookings = (bookingsData ?? []).map((row: any) => {
      const srv = serviceMap.get(String(row.service_id));
      const serviceName = srv?.name ?? 'Služba';
      const duration = Number(row.booking_duration) || srv?.duration || 30;

      return {
        id: String(row.id),
        time: String(row.time_slot ?? (row.start_time ? new Date(row.start_time).toISOString().slice(11, 16) : '09:00')),
        serviceId: String(row.service_id),
        serviceName,
        duration,
        customer: {
          name: String(row.client_name ?? row.customer_name ?? 'Klient'),
          email: String(row.client_email ?? row.customer_email ?? ''),
          phone: String(row.client_phone ?? row.customer_phone ?? ''),
        },
        status: String(row.status ?? 'confirmed'),
        notes: row.notes ? String(row.notes) : null,
      };
    });

    return NextResponse.json(
      {
        date: todayISO,
        total: bookings.length,
        bookings,
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (err) {
    console.error('[api-v1/bookings/today] Unexpected error:', err);
    return NextResponse.json(
      { date: todayISO, total: 0, bookings: [] },
      { status: 200, headers: CORS_HEADERS }
    );
  }
}
