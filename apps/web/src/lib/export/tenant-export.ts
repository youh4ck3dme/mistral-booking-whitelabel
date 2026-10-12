// OPS-9: Tenant data export — CSV and JSON for bookings, services, staff.
// Pure functions only: no I/O, no Supabase calls.
// The admin component passes already-loaded (RLS-filtered) data.

import { escapeCsvCell } from '../booking/outcomes';

// ============================================================================
// Types
// ============================================================================

export interface ExportService {
  id: string;
  name: string;
  description?: string | null;
  price: number | string | null;
  duration: number | string | null;
  is_active: boolean;
  created_at?: string | null;
}

export interface ExportStaff {
  id: string;
  display_name: string;
  email?: string | null;
  is_active: boolean;
  created_at?: string | null;
}

export interface ExportBooking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  service_name?: string | null;
  staff_name?: string | null;
  price?: number | string | null;
  created_at?: string | null;
}

export interface TenantExportData {
  tenantName: string;
  exportedAt: string;
  bookings: ExportBooking[];
  services: ExportService[];
  staff: ExportStaff[];
}

// ============================================================================
// CSV generators (semicolon-separated, UTF-8 BOM, formula-safe)
// ============================================================================

const SERVICES_HEADER = ['id', 'nazov', 'popis', 'cena_eur', 'trvanie_min', 'aktivna', 'vytvorena'];

export function servicesToCsv(services: ExportService[]): string {
  const rows = services.map((s) =>
    [
      s.id,
      s.name,
      s.description ?? '',
      toAmount(s.price).toFixed(2),
      String(s.duration ?? ''),
      s.is_active ? 'áno' : 'nie',
      s.created_at ?? '',
    ]
      .map(escapeCsvCell)
      .join(';'),
  );
  return [SERVICES_HEADER.join(';'), ...rows].join('\r\n') + '\r\n';
}

const STAFF_HEADER = ['id', 'meno', 'email', 'aktivny', 'vytvoreny'];

export function staffToCsv(staff: ExportStaff[]): string {
  const rows = staff.map((s) =>
    [
      s.id,
      s.display_name,
      s.email ?? '',
      s.is_active ? 'áno' : 'nie',
      s.created_at ?? '',
    ]
      .map(escapeCsvCell)
      .join(';'),
  );
  return [STAFF_HEADER.join(';'), ...rows].join('\r\n') + '\r\n';
}

const BOOKINGS_HEADER = [
  'id',
  'zaciatok_utc',
  'koniec_utc',
  'sluzba',
  'personal',
  'cena_eur',
  'stav',
  'vytvorena',
];

export function bookingsToCsv(bookings: ExportBooking[]): string {
  const rows = bookings.map((b) =>
    [
      b.id,
      b.start_time,
      b.end_time,
      b.service_name ?? '',
      b.staff_name ?? '',
      toAmount(b.price).toFixed(2),
      b.status,
      b.created_at ?? '',
    ]
      .map(escapeCsvCell)
      .join(';'),
  );
  return [BOOKINGS_HEADER.join(';'), ...rows].join('\r\n') + '\r\n';
}

// ============================================================================
// JSON export (structured, safe)
// ============================================================================

export function tenantToJson(data: TenantExportData): string {
  return JSON.stringify(data, null, 2);
}

// ============================================================================
// Multi-table CSV bundle (single file with section separators)
// ============================================================================

/**
 * Produces a single CSV file with all 3 tables separated by blank lines
 * and section headers. This is what OPS-9 requires:
 * "Export: rezervácie, klienti, služby."
 */
export function tenantToFullCsv(data: TenantExportData): string {
  const sections: string[] = [];

  sections.push(`# Export: ${data.tenantName}`);
  sections.push(`# Dátum exportu: ${data.exportedAt}`);
  sections.push('');

  sections.push('## Služby');
  sections.push(servicesToCsv(data.services));

  sections.push('## Personál');
  sections.push(staffToCsv(data.staff));

  sections.push('## Rezervácie');
  sections.push(bookingsToCsv(data.bookings));

  return sections.join('\r\n');
}

// ============================================================================
// Download helpers (browser-side, safe blob creation)
// ============================================================================

/**
 * Triggers a browser download of a file. The BOM prefix ensures
 * Slovak/Czech characters render correctly in Excel (UTF-8 BOM).
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/csv;charset=utf-8',
): void {
  const bom = mimeType.includes('csv') ? '\uFEFF' : '';
  const blob = new Blob([bom, content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ============================================================================
// Helpers
// ============================================================================

function toAmount(value: number | string | null | undefined): number {
  const n = typeof value === 'string' ? Number(value) : value ?? 0;
  return Number.isFinite(n) ? n : 0;
}
