import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
  getUser: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@repo/web/src/utils/supabase/server', () => ({
  createClient: () => ({ auth: supabaseMock }),
}));

import { getServerUser } from './server-user';
import { getServerSession } from './server-session';

describe('getServerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
  });

  it('returns the user when Supabase Auth validates the JWT', async () => {
    supabaseMock.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    await expect(getServerUser()).resolves.toEqual({ id: 'u1' });
    expect(supabaseMock.getUser).toHaveBeenCalledTimes(1);
  });

  it('returns null when the JWT is rejected, even if a cookie session exists', async () => {
    supabaseMock.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid JWT' } });
    supabaseMock.getSession.mockResolvedValue({ data: { session: { user: { id: 'forged' } } }, error: null });

    await expect(getServerUser()).resolves.toBeNull();
    expect(supabaseMock.getSession).not.toHaveBeenCalled();
  });
});

describe('getServerSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
  });

  it('builds the session from the validated user only', async () => {
    supabaseMock.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    await expect(getServerSession()).resolves.toEqual({ user: { id: 'u1' } });
    expect(supabaseMock.getSession).not.toHaveBeenCalled();
  });

  it('returns null for an invalid JWT', async () => {
    supabaseMock.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid JWT' } });

    await expect(getServerSession()).resolves.toBeNull();
  });
});
