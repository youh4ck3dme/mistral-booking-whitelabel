import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@repo/web/app/api/cron/process-outbox/route';

vi.mock('@repo/web/src/lib/notifications/dispatch', () => ({
  processPendingNotificationDeliveries: vi.fn().mockResolvedValue({
    failed: 0,
    processed: 2,
    sent: 2,
  }),
}));

vi.mock('@repo/web/src/lib/security/rate-limit', () => ({
  checkRequestRateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

describe('process-outbox cron endpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = 'test-cron-secret-12345';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('rejects requests without CRON_SECRET configured', async () => {
    delete process.env.CRON_SECRET;
    delete process.env.NOTIFICATION_CRON_SECRET;

    const request = new Request('http://localhost:3009/api/cron/process-outbox', {
      method: 'POST',
      headers: { authorization: 'Bearer test-cron-secret-12345' },
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toContain('not configured');
  });

  it('rejects unauthorized requests with wrong secret', async () => {
    const request = new Request('http://localhost:3009/api/cron/process-outbox', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-secret' },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('successfully executes outbox delivery with valid bearer secret', async () => {
    const request = new Request('http://localhost:3009/api/cron/process-outbox', {
      method: 'POST',
      headers: { authorization: 'Bearer test-cron-secret-12345' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.sent).toBe(2);
    expect(body.processed).toBe(2);
  });

  it('handles GET requests (Vercel Cron default)', async () => {
    const request = new Request('http://localhost:3009/api/cron/process-outbox', {
      method: 'GET',
      headers: { authorization: 'Bearer test-cron-secret-12345' },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
  });
});
