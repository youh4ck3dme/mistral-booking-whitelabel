import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetRateLimiter } from '@repo/web/src/lib/security/rate-limit';

const mockRunAutoopsCycle = vi.fn().mockResolvedValue({
  data: { no_shows_flagged: 1, slots_reclaimed: 0, gaps_compacted: 0 },
  error: null,
});

const mockSupabase = {
  rpc: mockRunAutoopsCycle,
};

vi.mock('@repo/web/src/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockSupabase,
}));

import { GET, POST } from '@repo/web/app/api/cron/autoops-worker/route';

const SECRET = 'autoops-worker-test-secret-1234567890abcdef';

function makeRequest(method = 'GET', headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/cron/autoops-worker', {
    method,
    headers: new Headers(headers),
  });
}

describe('AutoOps Worker Cron Route (/api/cron/autoops-worker)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetRateLimiter();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      CRON_SECRET: SECRET,
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    };
  });

  it('rejects unauthorized requests with 401 when header is missing', async () => {
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(401);
  });

  it('rejects requests with invalid bearer secret with 401', async () => {
    const res = await GET(makeRequest('GET', { authorization: 'Bearer invalid-secret' }));
    expect(res.status).toBe(401);
  });

  it('executes successfully and returns summary on authorized GET request', async () => {
    const res = await GET(makeRequest('GET', { authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.summary).toBeDefined();
    expect(mockRunAutoopsCycle).toHaveBeenCalledWith('run_autoops_cycle');
  });

  it('executes successfully and returns summary on authorized POST request', async () => {
    const res = await POST(makeRequest('POST', { authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.summary).toBeDefined();
  });
});
