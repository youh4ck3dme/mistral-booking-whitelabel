import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
  getUser: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@repo/web/src/utils/supabase/server', () => ({
  createClient: () => ({ auth: supabaseMock }),
}));
vi.mock('ai', () => ({
  createAgentUIStreamResponse: async () => new Response('STREAM', { status: 200 }),
}));
vi.mock('@repo/ai', () => ({ createBookingAssistant: () => ({}) }));
vi.mock('@repo/web/src/lib/notifications/dispatch', () => ({
  processPendingNotificationDeliveries: vi.fn(async () => ({ processed: 0 })),
}));
vi.mock('@repo/web/src/lib/notifications/repository', () => ({
  verifyBookingAccess: vi.fn(async () => ({ id: 'b1' })),
}));

import { POST as chatPOST } from '../../../app/api/chat/route';
import { POST as dispatchPOST } from '../../../app/api/notifications/dispatch/route';
import { verifyBookingAccess } from '@repo/web/src/lib/notifications/repository';

const chatRequest = () =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: [], tenantId: 't1' }),
  });

const dispatchRequest = () =>
  new Request('http://localhost/api/notifications/dispatch', {
    method: 'POST',
    body: JSON.stringify({ bookingId: 'b1' }),
  });

describe('API auth uses validated user, not cookie session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // A cookie session exists, but the JWT is rejected by Supabase Auth.
    supabaseMock.getSession.mockResolvedValue({
      data: { session: { user: { id: 'attacker' } } },
      error: null,
    });
    supabaseMock.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid JWT' } });
  });

  it('/api/chat returns 401 for an invalid JWT', async () => {
    const res = await chatPOST(chatRequest());
    expect(res.status).toBe(401);
    expect(supabaseMock.getSession).not.toHaveBeenCalled();
  });

  it('/api/notifications/dispatch returns 401 for an invalid JWT', async () => {
    const res = await dispatchPOST(dispatchRequest());
    expect(res.status).toBe(401);
    expect(verifyBookingAccess).not.toHaveBeenCalled();
  });

  it('/api/chat accepts a request with a validated user', async () => {
    supabaseMock.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const res = await chatPOST(chatRequest());
    expect(res.status).toBe(200);
  });

  it('/api/notifications/dispatch checks booking access for the validated user', async () => {
    supabaseMock.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const res = await dispatchPOST(dispatchRequest());
    expect(res.status).toBe(200);
    expect(verifyBookingAccess).toHaveBeenCalledWith('b1', 'u1');
  });
});
