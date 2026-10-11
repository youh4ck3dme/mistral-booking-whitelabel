import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const maybeSingle = vi.fn();

vi.mock('@repo/web/src/utils/supabase/server', () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
    rpc,
  }),
}));

import { GET } from '@repo/web/app/api/booking-availability/route';

const SERVICE = '11111111-1111-4111-8111-111111111111';
const STAFF = '22222222-2222-4222-8222-222222222222';

function get(params: Record<string, string>) {
  const search = new URLSearchParams(params).toString();
  return GET(new Request(`http://localhost/api/booking-availability?${search}`));
}

const VALID = { tenantSlug: 'salon-a', serviceId: SERVICE, from: '2030-03-01', to: '2030-03-02' };

describe('GET /api/booking-availability', () => {
  beforeEach(() => {
    rpc.mockReset();
    maybeSingle.mockReset();
    maybeSingle.mockResolvedValue({ data: { id: 'tenant-1', timezone: 'Europe/Bratislava' }, error: null });
    rpc.mockImplementation((name: string, args: Record<string, unknown>) => {
      if (name === 'list_bookable_staff') {
        return Promise.resolve({ data: [{ id: STAFF, display_name: 'Anna' }], error: null });
      }
      return Promise.resolve({
        data: [{ staff_id: STAFF, start_time: `${args.p_date}T08:00:00Z`, end_time: `${args.p_date}T09:00:00Z` }],
        error: null,
      });
    });
  });

  it('rejects invalid parameters without a database call', async () => {
    expect((await get({ ...VALID, serviceId: 'nope' })).status).toBe(400);
    expect((await get({ ...VALID, tenantSlug: 'Bad Slug' })).status).toBe(400);
    expect((await get({ ...VALID, from: '2030-03-05', to: '2030-03-01' })).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects ranges longer than 31 days', async () => {
    const res = await get({ ...VALID, from: '2030-01-01', to: '2030-02-15' });
    expect(res.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown tenant', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await get(VALID)).status).toBe(404);
  });

  it('returns 404 when the service is not offered by the tenant', async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    expect((await get(VALID)).status).toBe(404);
  });

  it('returns staff and day-by-day slots computed by the database', async () => {
    const res = await get(VALID);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.timezone).toBe('Europe/Bratislava');
    expect(body.staff).toEqual([{ id: STAFF, name: 'Anna' }]);
    expect(Object.keys(body.days)).toEqual(['2030-03-01', '2030-03-02']);
    expect(body.days['2030-03-01'][0]).toEqual({
      staffId: STAFF,
      startTime: '2030-03-01T08:00:00Z',
      endTime: '2030-03-01T09:00:00Z',
    });
  });

  it('never trusts a tenant id from the query string', async () => {
    await get({ ...VALID, tenantId: '33333333-3333-4333-8333-333333333333' } as Record<string, string>);
    expect(rpc.mock.calls.every(([, args]) => args.p_tenant_id === 'tenant-1')).toBe(true);
  });

  it('passes the optional staff filter through to the database', async () => {
    await get({ ...VALID, staffId: STAFF });
    const slotCall = rpc.mock.calls.find(([name]) => name === 'get_available_slots');
    expect(slotCall?.[1].p_staff_id).toBe(STAFF);
  });

  it('returns a generic 500 when the database fails', async () => {
    rpc.mockImplementation((name: string) =>
      name === 'list_bookable_staff'
        ? Promise.resolve({ data: null, error: { code: 'XX000', message: 'secret detail' } })
        : Promise.resolve({ data: [], error: null }),
    );
    const res = await get(VALID);
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret detail');
  });
});
