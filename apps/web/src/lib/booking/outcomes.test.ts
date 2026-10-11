import { describe, expect, it } from 'vitest';
import {
  canSetOutcome,
  escapeCsvCell,
  summarizeBookings,
  toAccountingCsv,
} from './outcomes';

const NOW = new Date('2026-10-11T12:00:00Z');

describe('canSetOutcome', () => {
  it('allows a confirmed booking that has started', () => {
    expect(canSetOutcome({ status: 'confirmed', start_time: '2026-10-11T09:00:00Z' }, NOW)).toBe(true);
  });

  it('rejects a future confirmed booking', () => {
    expect(canSetOutcome({ status: 'confirmed', start_time: '2026-10-11T13:00:00Z' }, NOW)).toBe(false);
  });

  it('rejects pending, cancelled and already finalized bookings', () => {
    const start = '2026-10-10T09:00:00Z';
    for (const status of ['pending', 'cancelled', 'completed', 'no_show']) {
      expect(canSetOutcome({ status, start_time: start }, NOW)).toBe(false);
    }
  });
});

describe('summarizeBookings', () => {
  const svc = (id: string, name: string, price: number) => ({ service_id: id, service: { name, price } });

  it('counts statuses, today, completed revenue and no-show rate from real rows', () => {
    const summary = summarizeBookings([
      { status: 'completed', start_time: '2026-10-11T08:00:00Z', ...svc('s1', 'Strihanie', 20) },
      { status: 'completed', start_time: '2026-10-10T08:00:00Z', ...svc('s1', 'Strihanie', 20) },
      { status: 'no_show', start_time: '2026-10-11T10:00:00Z', ...svc('s2', 'Farbenie', 50) },
      { status: 'cancelled', start_time: '2026-10-11T11:00:00Z', ...svc('s2', 'Farbenie', 50) },
      { status: 'confirmed', start_time: '2026-10-11T15:00:00Z', ...svc('s1', 'Strihanie', 20) },
    ], NOW);

    expect(summary.counts).toEqual({ pending: 0, confirmed: 1, completed: 2, cancelled: 1, no_show: 1 });
    expect(summary.todayCount).toBe(3);
    expect(summary.completedRevenue).toBe(40);
    expect(summary.noShowRate).toBeCloseTo(1 / 3);
    expect(summary.topServices[0]).toEqual({ serviceId: 's1', name: 'Strihanie', count: 3 });
  });

  it('returns null no-show rate and zero revenue with no finished bookings', () => {
    const summary = summarizeBookings([], NOW);
    expect(summary.noShowRate).toBeNull();
    expect(summary.completedRevenue).toBe(0);
    expect(summary.todayCount).toBe(0);
    expect(summary.topServices).toEqual([]);
  });

  it('does not count a cancelled booking as revenue or as a service request', () => {
    const summary = summarizeBookings([
      { status: 'cancelled', start_time: '2026-10-11T08:00:00Z', ...svc('s1', 'Strihanie', 20) },
    ], NOW);
    expect(summary.completedRevenue).toBe(0);
    expect(summary.topServices).toEqual([]);
  });
});

describe('escapeCsvCell', () => {
  it('quotes values with separators, quotes or newlines', () => {
    expect(escapeCsvCell('a;b')).toBe('"a;b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('line\nbreak')).toBe('"line\nbreak"');
  });

  it('neutralises spreadsheet formula triggers', () => {
    expect(escapeCsvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(escapeCsvCell('+1')).toBe(`'+1`);
    expect(escapeCsvCell('@SUM(A1)')).toBe(`'@SUM(A1)`);
  });

  it('leaves plain values and null unchanged', () => {
    expect(escapeCsvCell('Strihanie')).toBe('Strihanie');
    expect(escapeCsvCell(null)).toBe('');
  });
});

describe('toAccountingCsv', () => {
  it('writes a semicolon-separated header and one line per booking', () => {
    const csv = toAccountingCsv([{
      id: 'b1',
      start_time: '2026-10-11T08:00:00Z',
      end_time: '2026-10-11T09:00:00Z',
      status: 'completed',
      service_id: 's1',
      service: { name: 'Strihanie', price: '20' },
    }]);

    expect(csv).toBe(
      'id;zaciatok_utc;koniec_utc;sluzba;cena_eur;stav\r\n'
      + 'b1;2026-10-11T08:00:00Z;2026-10-11T09:00:00Z;Strihanie;20.00;completed\r\n',
    );
  });

  it('escapes a malicious service name so it cannot inject a formula or column', () => {
    const csv = toAccountingCsv([{
      id: 'b2',
      start_time: '2026-10-11T08:00:00Z',
      end_time: '2026-10-11T09:00:00Z',
      status: 'completed',
      service_id: 's1',
      service: { name: '=cmd|"x";y', price: 5 },
    }]);
    const dataLine = csv.split('\r\n')[1];
    expect(dataLine).toContain(`"'=cmd|""x"";y"`);
    expect(dataLine.endsWith(';5.00;completed')).toBe(true);
  });

  it('exports only the header for an empty list', () => {
    expect(toAccountingCsv([])).toBe('id;zaciatok_utc;koniec_utc;sluzba;cena_eur;stav\r\n');
  });
});
