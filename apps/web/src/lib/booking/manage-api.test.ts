import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const maybeSingle = vi.fn();
const getServerUser = vi.fn();
const sendManageLinkEmail = vi.fn();

vi.mock('@repo/web/src/utils/supabase/server', () => ({
  createClient: () => ({
    rpc,
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle }) }),
    }),
  }),
}));
vi.mock('@repo/web/src/lib/auth/server-user', () => ({ getServerUser: () => getServerUser() }));
vi.mock('@repo/web/src/lib/booking/manage-link-email', () => ({
  sendManageLinkEmail: (input: unknown) => sendManageLinkEmail(input),
}));

import { hashManageToken, generateManageToken } from '@repo/web/src/lib/booking/manage-token';
import { POST as manageRoute } from '@repo/web/app/api/booking-manage/route';
import { POST as manageLinkRoute } from '@repo/web/app/api/bookings/[bookingId]/manage-link/route';

const TOKEN = 'A'.repeat(43);
const TENANT = 'salon-a';
const BOOKING_ID = '11111111-1111-4111-8111-111111111111';

function post(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function manage(body: unknown) {
  return manageRoute(post('http://localhost/api/booking-manage', body));
}

describe('POST /api/booking-manage', () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it('rejects malformed JSON and unknown actions without touching the database', async () => {
    expect((await manageRoute(post('http://x', '{bad'))).status).toBe(400);
    expect((await manage({ action: 'delete', tenantSlug: TENANT, token: TOKEN })).status).toBe(400);
    expect((await manage({ action: 'read', tenantSlug: 'Bad Slug!', token: TOKEN })).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns 404 for a malformed token without a database call', async () => {
    const res = await manage({ action: 'read', tenantSlug: TENANT, token: 'short' });
    expect(res.status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('sends only the SHA-256 hash to the database, never the raw token', async () => {
    rpc.mockResolvedValue({ data: { status: 'ok', booking: { id: BOOKING_ID } }, error: null });
    const res = await manage({ action: 'read', tenantSlug: TENANT, token: TOKEN });

    expect(res.status).toBe(200);
    const args = rpc.mock.calls[0][1];
    expect(args.p_token_hash).toBe(hashManageToken(TOKEN));
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(TOKEN);
  });

  it.each([
    ['invalid', 404],
    ['expired', 410],
  ])('maps a read result of %s to HTTP %i', async (status, http) => {
    rpc.mockResolvedValue({ data: { status }, error: null });
    const res = await manage({ action: 'read', tenantSlug: TENANT, token: TOKEN });
    expect(res.status).toBe(http);
    expect((await res.json()).status).toBe(status);
  });

  it('treats a repeated cancellation as success', async () => {
    rpc.mockResolvedValueOnce({ data: { status: 'ok' }, error: null });
    rpc.mockResolvedValueOnce({ data: { status: 'already_cancelled' }, error: null });

    const first = await manage({ action: 'cancel', tenantSlug: TENANT, token: TOKEN });
    const second = await manage({ action: 'cancel', tenantSlug: TENANT, token: TOKEN });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect((await second.json()).status).toBe('already_cancelled');
  });

  it('reschedules with a rotated token and returns the new management URL once', async () => {
    rpc.mockResolvedValue({
      data: { status: 'ok', startTime: '2030-03-02T14:00:00Z', endTime: '2030-03-02T15:00:00Z' },
      error: null,
    });

    const res = await manage({
      action: 'reschedule',
      tenantSlug: TENANT,
      token: TOKEN,
      startTime: '2030-03-02T14:00:00Z',
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    const args = rpc.mock.calls[0][1];
    expect(args.p_new_token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(args.p_new_token_hash).not.toBe(args.p_token_hash);
    expect(body.manageUrl).toContain(`/${TENANT}/booking/manage/`);
    expect(body.manageUrl.endsWith(`/${TENANT}/booking/manage/${TOKEN}`)).toBe(false);
  });

  it.each([
    ['slot_taken', 409],
    ['outside_hours', 422],
    ['in_past', 422],
    ['invalid', 404],
    ['not_editable', 409],
  ])('reschedule failure %s returns HTTP %i and no new link', async (status, http) => {
    rpc.mockResolvedValue({ data: { status }, error: null });
    const res = await manage({
      action: 'reschedule',
      tenantSlug: TENANT,
      token: TOKEN,
      startTime: '2030-03-02T14:00:00Z',
    });
    expect(res.status).toBe(http);
    const body = await res.json();
    expect(body.manageUrl).toBeUndefined();
  });

  it('returns a generic 500 on database errors without leaking details', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'internal detail' } });
    const res = await manage({ action: 'cancel', tenantSlug: TENANT, token: TOKEN });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('internal detail');
  });
});

describe('POST /api/bookings/[bookingId]/manage-link', () => {
  const ctx = { params: { bookingId: BOOKING_ID } };

  beforeEach(() => {
    rpc.mockReset();
    maybeSingle.mockReset();
    getServerUser.mockReset();
    sendManageLinkEmail.mockReset();
    getServerUser.mockResolvedValue({ id: 'user-1', email: 'client@example.test' });
    maybeSingle.mockResolvedValue({
      data: {
        start_time: '2030-03-02T10:00:00Z',
        services: { name: 'Strihanie' },
        tenants: { name: 'Salón A', slug: TENANT },
      },
      error: null,
    });
  });

  it('returns 401 when there is no authenticated user', async () => {
    getServerUser.mockResolvedValue(null);
    const res = await manageLinkRoute(new Request('http://x', { method: 'POST' }), ctx);
    expect(res.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns 404 when RLS hides the booking', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await manageLinkRoute(new Request('http://x', { method: 'POST' }), ctx);
    expect(res.status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('maps a non-owner RPC denial to 403', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'Not authorized' } });
    const res = await manageLinkRoute(new Request('http://x', { method: 'POST' }), ctx);
    expect(res.status).toBe(403);
  });

  it('issues a link, stores only the hash, and emails the customer when configured', async () => {
    rpc.mockResolvedValue({ data: { expiresAt: '2030-03-03T11:00:00Z', actor: 'customer' }, error: null });
    sendManageLinkEmail.mockResolvedValue({ sent: true });

    const res = await manageLinkRoute(new Request('http://x', { method: 'POST' }), ctx);
    expect(res.status).toBe(200);

    const args = rpc.mock.calls[0][1];
    expect(args.p_booking_id).toBe(BOOKING_ID);
    expect(args.p_token_hash).toMatch(/^[0-9a-f]{64}$/);

    const body = await res.json();
    expect(body.manageUrl).toMatch(new RegExp(`/${TENANT}/booking/manage/[A-Za-z0-9_-]{43}$`));
    const rawToken = body.manageUrl.split('/').pop();
    expect(hashManageToken(rawToken)).toBe(args.p_token_hash);
    expect(body.email).toEqual({ sent: true });
    expect(sendManageLinkEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'client@example.test' }));
  });

  it('does not email when a staff member issues the link', async () => {
    rpc.mockResolvedValue({ data: { expiresAt: '2030-03-03T11:00:00Z', actor: 'staff' }, error: null });
    const res = await manageLinkRoute(new Request('http://x', { method: 'POST' }), ctx);
    expect(res.status).toBe(200);
    expect(sendManageLinkEmail).not.toHaveBeenCalled();
    expect((await res.json()).email.sent).toBe(false);
  });

  it('reports a disabled provider as not sent, never as sent', async () => {
    rpc.mockResolvedValue({ data: { expiresAt: '2030-03-03T11:00:00Z', actor: 'customer' }, error: null });
    sendManageLinkEmail.mockResolvedValue({ sent: false, reason: 'provider_disabled' });
    const res = await manageLinkRoute(new Request('http://x', { method: 'POST' }), ctx);
    expect((await res.json()).email).toEqual({ sent: false, reason: 'provider_disabled' });
  });

  it('generates a different token on every call', async () => {
    rpc.mockResolvedValue({ data: { expiresAt: '2030-03-03T11:00:00Z', actor: 'staff' }, error: null });
    await manageLinkRoute(new Request('http://x', { method: 'POST' }), ctx);
    await manageLinkRoute(new Request('http://x', { method: 'POST' }), ctx);
    expect(rpc.mock.calls[0][1].p_token_hash).not.toBe(rpc.mock.calls[1][1].p_token_hash);
    expect(generateManageToken()).not.toBe(generateManageToken());
  });
});
