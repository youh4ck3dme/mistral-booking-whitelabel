import { describe, expect, it } from 'vitest';
import {
  bookingsToCsv,
  downloadFile,
  servicesToCsv,
  staffToCsv,
  tenantToFullCsv,
  tenantToJson,
  type ExportBooking,
  type ExportService,
  type ExportStaff,
  type TenantExportData,
} from './tenant-export';

// ============================================================================
// Fixtures
// ============================================================================

const SERVICE: ExportService = {
  id: 's1',
  name: 'Strihanie',
  description: 'Klasický strih',
  price: 20,
  duration: 30,
  is_active: true,
  created_at: '2026-01-01T10:00:00Z',
};

const STAFF: ExportStaff = {
  id: 'st1',
  display_name: 'Ján Novák',
  email: 'jan@example.com',
  is_active: true,
  created_at: '2026-01-01T10:00:00Z',
};

const BOOKING: ExportBooking = {
  id: 'b1',
  start_time: '2026-10-11T08:00:00Z',
  end_time: '2026-10-11T08:30:00Z',
  status: 'completed',
  service_name: 'Strihanie',
  staff_name: 'Ján Novák',
  price: 20,
  created_at: '2026-10-10T12:00:00Z',
};

const TENANT_DATA: TenantExportData = {
  tenantName: 'Barber District',
  exportedAt: '2026-10-12T10:00:00Z',
  bookings: [BOOKING],
  services: [SERVICE],
  staff: [STAFF],
};

// ============================================================================
// servicesToCsv
// ============================================================================

describe('servicesToCsv', () => {
  it('produces a header and one row per service', () => {
    const csv = servicesToCsv([SERVICE]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('id;nazov;popis;cena_eur;trvanie_min;aktivna;vytvorena');
    expect(lines[1]).toContain('s1;Strihanie');
    expect(lines[1]).toContain('20.00');
    expect(lines[1]).toContain('30');
    expect(lines[1]).toContain('áno');
  });

  it('marks inactive service as "nie"', () => {
    const csv = servicesToCsv([{ ...SERVICE, is_active: false }]);
    expect(csv).toContain('nie');
  });

  it('returns only header for empty list', () => {
    const csv = servicesToCsv([]);
    expect(csv.trim()).toBe('id;nazov;popis;cena_eur;trvanie_min;aktivna;vytvorena');
  });

  it('escapes a malicious service name', () => {
    const csv = servicesToCsv([{ ...SERVICE, name: '=CMD("x")' }]);
    // Should be prefixed with apostrophe and quoted
    expect(csv).toContain("'=CMD");
  });
});

// ============================================================================
// staffToCsv
// ============================================================================

describe('staffToCsv', () => {
  it('produces header and data row', () => {
    const csv = staffToCsv([STAFF]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('id;meno;email;aktivny;vytvoreny');
    expect(lines[1]).toContain('st1');
    expect(lines[1]).toContain('Ján Novák');
    expect(lines[1]).toContain('jan@example.com');
    expect(lines[1]).toContain('áno');
  });

  it('handles missing email gracefully', () => {
    const csv = staffToCsv([{ ...STAFF, email: null }]);
    const lines = csv.split('\r\n');
    // email field should be empty
    expect(lines[1]).toContain('st1;Ján Novák;;áno');
  });

  it('returns only header for empty list', () => {
    const csv = staffToCsv([]);
    expect(csv.trim()).toBe('id;meno;email;aktivny;vytvoreny');
  });
});

// ============================================================================
// bookingsToCsv
// ============================================================================

describe('bookingsToCsv', () => {
  it('produces header and data row', () => {
    const csv = bookingsToCsv([BOOKING]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('id;zaciatok_utc;koniec_utc;sluzba;personal;cena_eur;stav;vytvorena');
    expect(lines[1]).toContain('b1');
    expect(lines[1]).toContain('Strihanie');
    expect(lines[1]).toContain('Ján Novák');
    expect(lines[1]).toContain('20.00');
    expect(lines[1]).toContain('completed');
  });

  it('handles missing service and staff names', () => {
    const csv = bookingsToCsv([{ ...BOOKING, service_name: null, staff_name: null }]);
    const lines = csv.split('\r\n');
    expect(lines[1]).toContain('b1;2026-10-11T08:00:00Z;2026-10-11T08:30:00Z;;;20.00;completed');
  });

  it('handles string price correctly', () => {
    const csv = bookingsToCsv([{ ...BOOKING, price: '35.50' }]);
    expect(csv).toContain('35.50');
  });

  it('returns only header for empty list', () => {
    const csv = bookingsToCsv([]);
    expect(csv.trim()).toBe('id;zaciatok_utc;koniec_utc;sluzba;personal;cena_eur;stav;vytvorena');
  });
});

// ============================================================================
// tenantToJson
// ============================================================================

describe('tenantToJson', () => {
  it('produces valid JSON with all sections', () => {
    const json = tenantToJson(TENANT_DATA);
    const parsed = JSON.parse(json);
    expect(parsed.tenantName).toBe('Barber District');
    expect(parsed.bookings).toHaveLength(1);
    expect(parsed.services).toHaveLength(1);
    expect(parsed.staff).toHaveLength(1);
  });

  it('produces valid JSON for empty data', () => {
    const json = tenantToJson({
      tenantName: 'Test',
      exportedAt: '2026-01-01T00:00:00Z',
      bookings: [],
      services: [],
      staff: [],
    });
    const parsed = JSON.parse(json);
    expect(parsed.bookings).toEqual([]);
    expect(parsed.services).toEqual([]);
    expect(parsed.staff).toEqual([]);
  });
});

// ============================================================================
// tenantToFullCsv
// ============================================================================

describe('tenantToFullCsv', () => {
  it('includes all three sections with headers', () => {
    const csv = tenantToFullCsv(TENANT_DATA);
    expect(csv).toContain('# Export: Barber District');
    expect(csv).toContain('## Služby');
    expect(csv).toContain('## Personál');
    expect(csv).toContain('## Rezervácie');
  });

  it('includes the export date', () => {
    const csv = tenantToFullCsv(TENANT_DATA);
    expect(csv).toContain('2026-10-12T10:00:00Z');
  });

  it('contains data from all three tables', () => {
    const csv = tenantToFullCsv(TENANT_DATA);
    expect(csv).toContain('Strihanie');
    expect(csv).toContain('Ján Novák');
    expect(csv).toContain('completed');
  });

  it('handles empty export gracefully', () => {
    const csv = tenantToFullCsv({
      tenantName: 'Empty',
      exportedAt: '2026-01-01T00:00:00Z',
      bookings: [],
      services: [],
      staff: [],
    });
    expect(csv).toContain('## Služby');
    expect(csv).toContain('## Personál');
    expect(csv).toContain('## Rezervácie');
    // Should have headers but no data rows beyond them
    expect(csv).toContain('id;nazov');
    expect(csv).toContain('id;meno');
    expect(csv).toContain('id;zaciatok_utc');
  });
});

// ============================================================================
// Formula injection protection (cross-table)
// ============================================================================

describe('formula injection protection', () => {
  it('sanitizes formula triggers in all export types', () => {
    const malicious: TenantExportData = {
      tenantName: 'Test',
      exportedAt: '2026-01-01T00:00:00Z',
      bookings: [{ ...BOOKING, service_name: '+SUM(A1)' }],
      services: [{ ...SERVICE, name: '@evil' }],
      staff: [{ ...STAFF, display_name: '-cmd' }],
    };

    const csv = tenantToFullCsv(malicious);
    // All formula triggers should be prefixed with apostrophe
    expect(csv).toContain("'+SUM(A1)");
    expect(csv).toContain("'@evil");
    expect(csv).toContain("'-cmd");
  });
});
