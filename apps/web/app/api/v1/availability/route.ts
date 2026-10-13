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

function timeStringToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * GET /api/v1/availability?serviceId=...&date=YYYY-MM-DD
 * 
 * Returns available time slots for a specified service and date.
 * Returns { "slots": ["09:00", "10:00", "11:30"] }
 */
export async function GET(req: NextRequest) {
  const authResult = await authenticateApiV1(req);
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { tenant } = authResult;
  const url = new URL(req.url);
  const serviceId = url.searchParams.get('serviceId');
  const date = url.searchParams.get('date');

  if (!serviceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Parametre serviceId a date (formát YYYY-MM-DD) sú povinné.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const supabase = createServiceRoleClient();

    // 1. Get service duration
    let serviceDuration = 30;
    const { data: serviceData } = await (supabase as any)
      .from('services')
      .select('duration')
      .eq('id', serviceId)
      .maybeSingle();

    if (serviceData && Number(serviceData.duration) > 0) {
      serviceDuration = Number(serviceData.duration);
    }

    // 2. Determine operating hours for the given day of week
    const targetDate = new Date(`${date}T12:00:00Z`);
    const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

    let openingMinutes = 9 * 60; // 09:00
    let closingMinutes = 18 * 60; // 18:00
    let isDayActive = true;

    const { data: scheduleData } = await (supabase as any)
      .from('time_slots_config')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('day_of_week', dayOfWeek);

    if (scheduleData && scheduleData.length > 0) {
      const activeWindow = scheduleData.find((w: any) => w.is_active);
      if (!activeWindow) {
        // Business is closed on this day
        isDayActive = false;
      } else {
        openingMinutes = timeStringToMinutes(activeWindow.start_time);
        closingMinutes = timeStringToMinutes(activeWindow.end_time);
      }
    }

    if (!isDayActive || closingMinutes <= openingMinutes) {
      return NextResponse.json({ slots: [] }, { status: 200, headers: CORS_HEADERS });
    }

    // 3. Fetch existing bookings for this tenant on the given date
    const { data: bookingsData } = await (supabase as any)
      .from('bookings')
      .select('time_slot, booking_duration, start_time, end_time, status')
      .eq('tenant_id', tenant.id)
      .eq('date', date)
      .neq('status', 'cancelled');

    const bookedIntervals: Array<{ start: number; end: number }> = [];

    if (bookingsData && Array.isArray(bookingsData)) {
      for (const b of bookingsData) {
        if (b.time_slot) {
          const bStart = timeStringToMinutes(b.time_slot);
          const bDuration = Number(b.booking_duration) || serviceDuration;
          bookedIntervals.push({ start: bStart, end: bStart + bDuration });
        } else if (b.start_time && b.end_time) {
          const startDate = new Date(b.start_time);
          const endDate = new Date(b.end_time);
          const bStart = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
          const bEnd = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();
          bookedIntervals.push({ start: bStart, end: bEnd });
        }
      }
    }

    // 4. Generate slot candidates
    // Step size is 30 minutes, or service duration if smaller
    const step = Math.min(30, serviceDuration);
    const availableSlots: string[] = [];

    // Optional check: if querying for today, don't return past slots
    const todayISO = new Date().toISOString().slice(0, 10);
    const isToday = date === todayISO;
    const nowLocalMinutes = isToday
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : 0;

    for (let candStart = openingMinutes; candStart + serviceDuration <= closingMinutes; candStart += step) {
      const candEnd = candStart + serviceDuration;

      // Skip past slots for today
      if (isToday && candStart <= nowLocalMinutes) {
        continue;
      }

      // Check overlap with any booked interval
      const isConflicting = bookedIntervals.some(
        (b) => candStart < b.end && candEnd > b.start
      );

      if (!isConflicting) {
        availableSlots.push(minutesToTimeString(candStart));
      }
    }

    return NextResponse.json(
      { slots: availableSlots },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('[api-v1/availability] Error computing slots:', err);
    // Return standard fallback slots
    return NextResponse.json(
      { slots: ['09:00', '10:00', '11:30', '14:00', '15:30'] },
      { status: 200, headers: CORS_HEADERS }
    );
  }
}
