import { beforeEach, describe, expect, it, vi } from 'vitest';

const getServerUser = vi.fn();
const rpc = vi.fn();

vi.mock('@repo/web/src/lib/auth/server-user', () => ({ getServerUser: () => getServerUser() }));
vi.mock('@repo/web/src/utils/supabase/server', () => ({ createClient: () => ({ rpc }) }));

import { POST } from '@repo/web/app/api/bookings/[bookingId]/outcome/route';

const BOOKING_ID = '11111111-1111-4111-8111-111111111111';

function call(body: unknown, bookingId = BOOKING_ID) {
  const request = new Request('http://localhost/api/bookings/x/outcome', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return POST(request, { params: { bookingId } });
}

describe('POST /api/bookings/[bookingId]/outcome', () => {
  beforeEach(() => {
    getServerUser.mockReset();
    rpc.mockReset();
    getServerUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 without an authenticated user and never calls the RPC', async () => {
    getServerUser.mockResolvedValue(null);
    const res = await call({ outcome: 'completed' });
    expect(res.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns 400 for a malformed booking id', async () => {
    const res = await call({ outcome: 'completed' }, 'not-a-uuid');
    expect(res.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON or an outcome outside the allowed set', async () => {
    expect((await call('{oops')).status).toBe(400);
    expect((await call({ outcome: 'cancelled' })).status).toBe(400);
    expect((await call({ outcome: 'confirmed' })).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('passes the validated values to set_booking_outcome and returns the new status', async () => {
    rpc.mockResolvedValue({ data: 'no_show', error: null });
    const res = await call({ outcome: 'no_show' });
    expect(rpc).toHaveBeenCalledWith('set_booking_outcome', {
      p_booking_id: BOOKING_ID,
      p_outcome: 'no_show',
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ bookingId: BOOKING_ID, status: 'no_show' });
  });

  it.each([
    ['42501', 403],
    ['P0002', 404],
    ['P0001', 409],
    ['23514', 400],
    ['XX000', 500],
  ])('maps database error %s to HTTP %i', async (code, status) => {
    rpc.mockResolvedValue({ data: null, error: { code, message: 'db says no' } });
    const res = await call({ outcome: 'completed' });
    expect(res.status).toBe(status);
  });
});
