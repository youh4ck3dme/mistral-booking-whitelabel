import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendTransactionalEmail = vi.fn();
vi.mock('@repo/web/src/lib/notifications/provider', () => ({
  sendTransactionalEmail: (payload: unknown) => sendTransactionalEmail(payload),
}));

import { renderManageLinkEmail, sendManageLinkEmail } from './manage-link-email';

const INPUT = {
  to: 'client@example.test',
  tenantName: 'Salón <Test>',
  serviceName: 'Strihanie & farbenie',
  startTime: '2030-03-01T10:00:00Z',
  manageUrl: 'https://app.example/salon/booking/manage/tok',
};

describe('renderManageLinkEmail', () => {
  it('escapes tenant and service names in HTML but keeps the link intact', () => {
    const { html, text } = renderManageLinkEmail(INPUT);
    expect(html).toContain('Salón &lt;Test&gt;');
    expect(html).toContain('Strihanie &amp; farbenie');
    expect(html).toContain('href="https://app.example/salon/booking/manage/tok"');
    expect(text).toContain('https://app.example/salon/booking/manage/tok');
  });
});

describe('sendManageLinkEmail', () => {
  const saved = { ...process.env };

  beforeEach(() => {
    sendTransactionalEmail.mockReset();
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it('reports provider_disabled and does not call the provider without credentials', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.NOTIFICATION_FROM_EMAIL;
    const result = await sendManageLinkEmail(INPUT);
    expect(result).toEqual({ sent: false, reason: 'provider_disabled' });
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it('sends once when configured and reports sent', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.NOTIFICATION_FROM_EMAIL = 'noreply@example.test';
    sendTransactionalEmail.mockResolvedValue({ id: 'msg-1' });
    const result = await sendManageLinkEmail(INPUT);
    expect(result).toEqual({ sent: true });
    expect(sendTransactionalEmail).toHaveBeenCalledWith(expect.objectContaining({ to: INPUT.to }));
  });

  it('reports send_failed without claiming success when the provider errors', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.NOTIFICATION_FROM_EMAIL = 'noreply@example.test';
    sendTransactionalEmail.mockRejectedValue(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await sendManageLinkEmail(INPUT);
    expect(result).toEqual({ sent: false, reason: 'send_failed' });
  });
});
