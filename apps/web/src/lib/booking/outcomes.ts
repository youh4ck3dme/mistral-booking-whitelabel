// Booking outcome rules, dashboard summary and accounting CSV export.
// Pure functions only: no I/O, so the UI and tests share one definition.

export type BookingOutcome = 'completed' | 'no_show';

export interface OutcomeBookingInput {
  status: string;
  start_time: string;
}

export interface SummaryBookingInput {
  status: string;
  start_time: string;
  service_id: string;
  service?: { name: string; price: number | string | null } | null;
}

export interface BookingSummary {
  todayCount: number;
  counts: Record<'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show', number>;
  completedRevenue: number;
  noShowRate: number | null;
  topServices: { serviceId: string; name: string; count: number }[];
}

export interface ExportBookingInput extends SummaryBookingInput {
  id: string;
  end_time: string;
}

/** Outcome may be recorded only for a confirmed booking whose start time has passed. */
export function canSetOutcome(booking: OutcomeBookingInput, now: Date): boolean {
  return booking.status === 'confirmed' && new Date(booking.start_time).getTime() <= now.getTime();
}

function toAmount(value: number | string | null | undefined): number {
  const n = typeof value === 'string' ? Number(value) : value ?? 0;
  return Number.isFinite(n) ? n : 0;
}

function sameUtcDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
}

/**
 * Summary over rows the admin already loaded through RLS. Revenue counts only
 * completed bookings, and only the recorded service price. Nothing is estimated.
 */
export function summarizeBookings(bookings: SummaryBookingInput[], now: Date): BookingSummary {
  const counts: BookingSummary['counts'] = {
    pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0,
  };
  let todayCount = 0;
  let completedRevenue = 0;
  const serviceCounts = new Map<string, { name: string; count: number }>();

  for (const booking of bookings) {
    if (booking.status in counts) {
      counts[booking.status as keyof BookingSummary['counts']] += 1;
    }
    if (booking.status !== 'cancelled' && sameUtcDay(new Date(booking.start_time), now)) {
      todayCount += 1;
    }
    if (booking.status === 'completed') {
      completedRevenue += toAmount(booking.service?.price);
    }
    if (booking.status !== 'cancelled') {
      const entry = serviceCounts.get(booking.service_id) ?? {
        name: booking.service?.name ?? 'Služba',
        count: 0,
      };
      entry.count += 1;
      serviceCounts.set(booking.service_id, entry);
    }
  }

  const finished = counts.completed + counts.no_show;
  const topServices = Array.from(serviceCounts.entries())
    .map(([serviceId, entry]) => ({ serviceId, ...entry }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 3);

  return {
    todayCount,
    counts,
    completedRevenue: Math.round(completedRevenue * 100) / 100,
    noShowRate: finished === 0 ? null : counts.no_show / finished,
    topServices,
  };
}

const CSV_HEADER = ['id', 'zaciatok_utc', 'koniec_utc', 'sluzba', 'cena_eur', 'stav'];

/**
 * Cell escaping for CSV opened in spreadsheets. Values starting with a formula
 * trigger are prefixed with an apostrophe so they cannot run as formulas.
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Semicolon-separated export, which is what SK/CZ spreadsheet software expects. */
export function toAccountingCsv(bookings: ExportBookingInput[]): string {
  const rows = bookings.map(booking => [
    booking.id,
    booking.start_time,
    booking.end_time,
    booking.service?.name ?? '',
    toAmount(booking.service?.price).toFixed(2),
    booking.status,
  ].map(escapeCsvCell).join(';'));
  return [CSV_HEADER.join(';'), ...rows].join('\r\n') + '\r\n';
}
