import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const TEST_KEY = 'nex_live_autoops_master_test_2026';
process.env.NEXIFY_API_KEY = TEST_KEY;

// Mock service-role client
const mockFrom = vi.fn();

vi.mock('@repo/web/src/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}));

import { verifyApiKey, authenticateApiV1 } from './auth';
import { GET as getServices } from '@repo/web/app/api/v1/services/route';
import { GET as getAvailability } from '@repo/web/app/api/v1/availability/route';
import { GET as getTodayBookings } from '@repo/web/app/api/v1/bookings/today/route';
import { POST as createBooking } from '@repo/web/app/api/v1/bookings/route';

describe('API v1 - Authentication & Security', () => {
  it('rejects missing x-api-key', () => {
    expect(verifyApiKey(null)).toBe(false);
    expect(verifyApiKey(undefined)).toBe(false);
    expect(verifyApiKey('')).toBe(false);
  });

  it('rejects keys without nex_live_ prefix', () => {
    expect(verifyApiKey('autoops_test_key')).toBe(false);
    expect(verifyApiKey('sk_live_12345')).toBe(false);
  });

  it('rejects invalid nex_live_ key', () => {
    expect(verifyApiKey('nex_live_wrong_hash_xyz')).toBe(false);
  });

  it('accepts correct nex_live_ key', () => {
    expect(verifyApiKey(TEST_KEY)).toBe(true);
  });

  it('authenticateApiV1 returns 401 with expected JSON specification on failure', async () => {
    const req = new NextRequest('http://localhost/api/v1/services');
    const result = await authenticateApiV1(req);
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(401);
      const json = await result.response.json();
      expect(json).toEqual({
        error: 'Unauthorized: Neplatný alebo chýbajúci x-api-key',
      });
    }
  });

  it('authenticateApiV1 succeeds with valid x-api-key', async () => {
    const req = new NextRequest('http://localhost/api/v1/services', {
      headers: { 'x-api-key': TEST_KEY },
    });
    const result = await authenticateApiV1(req);
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.tenant.id).toBeDefined();
      expect(result.tenant.name).toBeDefined();
    }
  });
});

describe('GET /api/v1/services', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('returns 401 when x-api-key is missing', async () => {
    const req = new NextRequest('http://localhost/api/v1/services');
    const res = await getServices(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized: Neplatný alebo chýbajúci x-api-key');
  });

  it('returns 200 with tenant and services structure on valid key', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () =>
            Promise.resolve({
              data: [
                {
                  id: 'srv_1',
                  name_sk: 'Konzultácia',
                  duration: 30,
                  price: 50,
                  is_active: true,
                },
                {
                  id: 'srv_2',
                  name: 'Strih',
                  duration: 45,
                  price: 35,
                  is_active: true,
                },
              ],
              error: null,
            }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/v1/services', {
      headers: { 'x-api-key': TEST_KEY },
    });
    const res = await getServices(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tenant).toBeDefined();
    expect(data.tenant.id).toBeDefined();
    expect(data.tenant.name).toBeDefined();
    expect(Array.isArray(data.services)).toBe(true);
    expect(data.services.length).toBeGreaterThan(0);
    expect(data.services[0]).toMatchObject({
      id: 'srv_1',
      name: 'Konzultácia',
      duration: 30,
      price: 50,
      currency: 'EUR',
    });
  });

  it('falls back to mock services when DB query errors or returns empty', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/v1/services', {
      headers: { 'x-api-key': TEST_KEY },
    });
    const res = await getServices(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.services.length).toBeGreaterThan(0);
    expect(data.services[0].currency).toBe('EUR');
  });
});

describe('GET /api/v1/availability', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('returns 401 when unauthorized', async () => {
    const req = new NextRequest('http://localhost/api/v1/availability');
    const res = await getAvailability(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when missing serviceId or date', async () => {
    const req = new NextRequest('http://localhost/api/v1/availability?date=2026-10-14', {
      headers: { 'x-api-key': TEST_KEY },
    });
    const res = await getAvailability(req);
    expect(res.status).toBe(400);
  });

  it('returns available slots in { slots: string[] } structure', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'services') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { duration: 60 } }),
            }),
          }),
        };
      }
      if (table === 'time_slots_config') {
        return {
          select: () => ({
            eq: () => ({
              eq: () =>
                Promise.resolve({
                  data: [
                    {
                      is_active: true,
                      start_time: '09:00:00',
                      end_time: '12:00:00',
                    },
                  ],
                }),
            }),
          }),
        };
      }
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                neq: () =>
                  Promise.resolve({
                    data: [{ time_slot: '10:00', booking_duration: 60, status: 'confirmed' }],
                  }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new NextRequest(
      'http://localhost/api/v1/availability?serviceId=srv_1&date=2028-10-14',
      {
        headers: { 'x-api-key': TEST_KEY },
      }
    );
    const res = await getAvailability(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(Array.isArray(json.slots)).toBe(true);
    // 09:00 should be free, 10:00 is booked, 11:00 should be free
    expect(json.slots).toContain('09:00');
    expect(json.slots).not.toContain('10:00');
  });
});

describe('GET /api/v1/bookings/today', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('returns 401 when unauthorized', async () => {
    const req = new NextRequest('http://localhost/api/v1/bookings/today');
    const res = await getTodayBookings(req);
    expect(res.status).toBe(401);
  });

  it('returns today bookings format for Morning Brief', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'services') {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [{ id: 'srv_1', name_sk: 'Dámsky strih', duration: 45 }],
              }),
          }),
        };
      }
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                neq: () => ({
                  order: () =>
                    Promise.resolve({
                      data: [
                        {
                          id: 'b_1',
                          service_id: 'srv_1',
                          time_slot: '10:00',
                          client_name: 'Ján Novák',
                          client_email: 'jan@example.com',
                          client_phone: '+421900000000',
                          status: 'confirmed',
                          booking_duration: 45,
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new NextRequest('http://localhost/api/v1/bookings/today', {
      headers: { 'x-api-key': TEST_KEY },
    });
    const res = await getTodayBookings(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.date).toBeDefined();
    expect(json.total).toBe(1);
    expect(json.bookings[0]).toMatchObject({
      id: 'b_1',
      time: '10:00',
      serviceId: 'srv_1',
      serviceName: 'Dámsky strih',
      duration: 45,
      customer: {
        name: 'Ján Novák',
        email: 'jan@example.com',
        phone: '+421900000000',
      },
      status: 'confirmed',
    });
  });
});

describe('POST /api/v1/bookings', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('returns 401 when unauthorized', async () => {
    const req = new NextRequest('http://localhost/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await createBooking(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid payload', async () => {
    const req = new NextRequest('http://localhost/api/v1/bookings', {
      method: 'POST',
      headers: { 'x-api-key': TEST_KEY },
      body: JSON.stringify({ customer: { name: '' } }),
    });
    const res = await createBooking(req);
    expect(res.status).toBe(400);
  });

  it('returns 201 on valid booking creation', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'services') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { name: 'Konzultácia', duration: 30 },
                }),
            }),
          }),
        };
      }
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  neq: () => ({
                    limit: () => ({
                      maybeSingle: () => Promise.resolve({ data: null }), // No conflict
                    }),
                  }),
                }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: 'booking-new-uuid-123' },
                  error: null,
                }),
            }),
          }),
        };
      }
      return {};
    });

    const payload = {
      customer: {
        name: 'Peter Kováč',
        email: 'peter@example.com',
        phone: '+421900111222',
      },
      serviceId: 'srv_1',
      startAt: '2026-10-15T14:30:00Z',
    };

    const req = new NextRequest('http://localhost/api/v1/bookings', {
      method: 'POST',
      headers: { 'x-api-key': TEST_KEY },
      body: JSON.stringify(payload),
    });
    const res = await createBooking(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.booking).toMatchObject({
      id: 'booking-new-uuid-123',
      serviceId: 'srv_1',
      serviceName: 'Konzultácia',
      date: '2026-10-15',
      time: '14:30',
      duration: 30,
      customer: payload.customer,
      status: 'confirmed',
    });
  });
});
