import { beforeEach, describe, expect, it, vi } from 'vitest';

type Result = { data?: unknown; error?: { code?: string; message?: string } | null };

// Queue-based query builder: each awaited query or maybeSingle() takes the next queued result.
const queue: Result[] = [];
const calls: { table: string; ops: string[] }[] = [];
const getServerUser = vi.fn();

function builder(table: string) {
  const entry = { table, ops: [] as string[] };
  calls.push(entry);
  const next = () => Promise.resolve(queue.shift() ?? { data: null, error: null });
  const self: Record<string, unknown> = {
    then: (resolve: (v: Result) => unknown, reject?: (e: unknown) => unknown) => next().then(resolve, reject),
    maybeSingle: () => {
      entry.ops.push('maybeSingle');
      return next();
    },
  };
  for (const op of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'not', 'single']) {
    self[op] = (...args: unknown[]) => {
      entry.ops.push(op);
      void args;
      return self;
    };
  }
  return self;
}

vi.mock('@repo/web/src/utils/supabase/server', () => ({
  createClient: () => ({ from: (table: string) => builder(table) }),
}));
vi.mock('@repo/web/src/lib/auth/server-user', () => ({ getServerUser: () => getServerUser() }));

import { POST } from '@repo/web/app/api/admin/staff/route';

const TENANT = 'salon-a';
const STAFF = '44444444-4444-4444-8444-444444444444';
const SERVICE = '55555555-5555-4555-8555-555555555555';

function call(body: unknown) {
  return POST(new Request('http://localhost/api/admin/staff', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

describe('POST /api/admin/staff', () => {
  beforeEach(() => {
    queue.length = 0;
    calls.length = 0;
    getServerUser.mockReset();
    getServerUser.mockResolvedValue({ id: 'admin-1' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns 401 without a user', async () => {
    getServerUser.mockResolvedValue(null);
    expect((await call({ action: 'createStaff', tenantSlug: TENANT, displayName: 'A' })).status).toBe(401);
  });

  it('validates input before touching the database', async () => {
    expect((await call({ action: 'createStaff', tenantSlug: TENANT, displayName: '   ' })).status).toBe(400);
    expect((await call({ action: 'setWorkingHours', tenantSlug: TENANT, staffId: STAFF, weekday: 8, interval: null })).status).toBe(400);
    expect((await call({ action: 'setWorkingHours', tenantSlug: TENANT, staffId: STAFF, weekday: 1,
      interval: { start: '17:00', end: '09:00' } })).status).toBe(400);
    expect((await call({ action: 'addTimeOff', tenantSlug: TENANT, staffId: STAFF,
      startsAt: '2030-01-02T00:00:00Z', endsAt: '2030-01-01T00:00:00Z' })).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('returns 404 for an unknown tenant', async () => {
    queue.push({ data: null, error: null });
    expect((await call({ action: 'createStaff', tenantSlug: TENANT, displayName: 'Anna' })).status).toBe(404);
  });

  it('creates a staff member for the resolved tenant only', async () => {
    queue.push({ data: { id: 'tenant-1' }, error: null });
    queue.push({ data: { id: STAFF, display_name: 'Anna', is_active: true }, error: null });
    const res = await call({ action: 'createStaff', tenantSlug: TENANT, displayName: 'Anna' });
    expect(res.status).toBe(200);
    expect((await res.json()).staff.display_name).toBe('Anna');
    expect(calls.map(c => c.table)).toEqual(['tenants', 'staff']);
  });

  it('maps an RLS denial to 403', async () => {
    queue.push({ data: { id: 'tenant-1' }, error: null });
    queue.push({ data: null, error: { code: '42501', message: 'row-level security' } });
    expect((await call({ action: 'createStaff', tenantSlug: TENANT, displayName: 'Anna' })).status).toBe(403);
  });

  it('returns 404 when updating a staff member of another tenant (no row matched)', async () => {
    queue.push({ data: { id: 'tenant-1' }, error: null });
    queue.push({ data: [], error: null });
    expect((await call({ action: 'updateStaff', tenantSlug: TENANT, staffId: STAFF, isActive: false })).status).toBe(404);
  });

  it('removes time off only inside the caller tenant', async () => {
    queue.push({ data: { id: 'tenant-1' }, error: null });
    queue.push({ data: [], error: null });
    expect((await call({ action: 'removeTimeOff', tenantSlug: TENANT, timeOffId: STAFF })).status).toBe(404);
    const ops = calls.find(c => c.table === 'staff_time_off')?.ops ?? [];
    expect(ops).toEqual(expect.arrayContaining(['delete', 'eq']));
  });

  it('clears a weekday when the interval is null', async () => {
    queue.push({ data: { id: 'tenant-1' }, error: null });
    queue.push({ data: null, error: null });
    const res = await call({ action: 'setWorkingHours', tenantSlug: TENANT, staffId: STAFF, weekday: 3, interval: null });
    expect(res.status).toBe(200);
    expect(calls.map(c => c.table)).toEqual(['tenants', 'staff_working_hours']);
    expect(calls[1].ops).not.toContain('insert');
  });

  it('replaces the weekday with one interval', async () => {
    queue.push({ data: { id: 'tenant-1' }, error: null });
    queue.push({ data: null, error: null });
    queue.push({ data: null, error: null });
    const res = await call({ action: 'setWorkingHours', tenantSlug: TENANT, staffId: STAFF, weekday: 3,
      interval: { start: '09:00', end: '17:00' } });
    expect(res.status).toBe(200);
    expect(calls[1].ops).toEqual(expect.arrayContaining(['delete']));
    expect(calls[2].table).toBe('staff_working_hours');
    expect(calls[2].ops).toContain('insert');
  });

  it('stores breaks in their own table', async () => {
    queue.push({ data: { id: 'tenant-1' }, error: null });
    queue.push({ data: null, error: null });
    queue.push({ data: null, error: null });
    await call({ action: 'setBreak', tenantSlug: TENANT, staffId: STAFF, weekday: 2,
      interval: { start: '12:00', end: '13:00' } });
    expect(calls.map(c => c.table)).toEqual(['tenants', 'staff_breaks', 'staff_breaks']);
  });

  it('assigns services with a de-duplicated staff list', async () => {
    queue.push({ data: { id: 'tenant-1' }, error: null });
    queue.push({ data: null, error: null });
    queue.push({ data: null, error: null });
    const res = await call({ action: 'setServiceStaff', tenantSlug: TENANT, serviceId: SERVICE, staffIds: [STAFF, STAFF] });
    expect(res.status).toBe(200);
    expect((await res.json()).staffIds).toEqual([STAFF]);
  });

  it('clears service assignment when the staff list is empty', async () => {
    queue.push({ data: { id: 'tenant-1' }, error: null });
    queue.push({ data: null, error: null });
    const res = await call({ action: 'setServiceStaff', tenantSlug: TENANT, serviceId: SERVICE, staffIds: [] });
    expect(res.status).toBe(200);
    expect(calls.map(c => c.table)).toEqual(['tenants', 'service_staff']);
  });

  it('maps a database check violation to 409 without the raw message', async () => {
    queue.push({ data: { id: 'tenant-1' }, error: null });
    queue.push({ data: null, error: { code: '23P01', message: 'overlap detail' } });
    const res = await call({ action: 'addTimeOff', tenantSlug: TENANT, staffId: STAFF,
      startsAt: '2030-01-01T00:00:00Z', endsAt: '2030-01-02T00:00:00Z' });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('overlap detail');
  });
});
