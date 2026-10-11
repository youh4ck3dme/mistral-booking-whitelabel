import { beforeEach, describe, expect, it, vi } from 'vitest';

const runReminderDispatchCycle = vi.fn();
vi.mock('./reminders', () => ({ runReminderDispatchCycle: () => runReminderDispatchCycle() }));

import { POST } from '@repo/web/app/api/notifications/reminders/route';

const SECRET = 'route-test-secret-0123456789abcdef0123456789';

function request(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/notifications/reminders', { method: 'POST', headers });
}

describe('POST /api/notifications/reminders', () => {
  const saved = { ...process.env };

  beforeEach(() => {
    runReminderDispatchCycle.mockReset();
    runReminderDispatchCycle.mockResolvedValue({ failed: 0, processed: 0, sent: 0, scheduled: 0 });
    process.env = { ...saved, NOTIFICATION_CRON_SECRET: SECRET };
  });

  it('returns 503 when the secret is not configured and runs nothing', async () => {
    delete process.env.NOTIFICATION_CRON_SECRET;
    const res = await POST(request());
    expect(res.status).toBe(503);
    expect(runReminderDispatchCycle).not.toHaveBeenCalled();
  });

  it('rejects unauthorized requests without running the worker', async () => {
    expect((await POST(request())).status).toBe(401);
    expect((await POST(request({ authorization: 'Bearer nope' }))).status).toBe(401);
    expect(runReminderDispatchCycle).not.toHaveBeenCalled();
  });

  it('runs the cycle for an authorized request', async () => {
    const res = await POST(request({ authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    expect(runReminderDispatchCycle).toHaveBeenCalledTimes(1);
  });
});
