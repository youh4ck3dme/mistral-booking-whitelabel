// Confirmation email carrying a management link. Uses the existing Resend adapter.
// When the provider is not configured, nothing is sent and the result says so.
// This never reports a successful send that did not happen.

import { sendTransactionalEmail } from '@repo/web/src/lib/notifications/provider';

export interface ManageLinkEmailInput {
  to: string;
  tenantName: string;
  serviceName: string;
  startTime: string;
  manageUrl: string;
}

export type ManageLinkEmailResult =
  | { sent: true }
  | { sent: false; reason: 'provider_disabled' | 'send_failed' };

export function isManageLinkEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderManageLinkEmail(input: ManageLinkEmailInput) {
  const when = `${new Date(input.startTime).toISOString().replace('T', ' ').slice(0, 16)} UTC`;
  const subject = `Potvrdenie rezervácie: ${input.serviceName}`;
  const text = [
    `Vaša rezervácia v ${input.tenantName} je potvrdená.`,
    `Služba: ${input.serviceName}`,
    `Termín: ${when}`,
    '',
    `Správa rezervácie (zmena termínu alebo storno): ${input.manageUrl}`,
    '',
    'Odkaz je osobný. Nezdieľajte ho.',
  ].join('\n');
  const html = [
    `<p>Vaša rezervácia v ${escapeHtml(input.tenantName)} je potvrdená.</p>`,
    `<p>Služba: ${escapeHtml(input.serviceName)}<br>Termín: ${escapeHtml(when)}</p>`,
    `<p><a href="${escapeHtml(input.manageUrl)}">Spravovať rezerváciu</a></p>`,
    '<p>Odkaz je osobný. Nezdieľajte ho.</p>',
  ].join('');
  return { subject, text, html };
}

export async function sendManageLinkEmail(input: ManageLinkEmailInput): Promise<ManageLinkEmailResult> {
  if (!isManageLinkEmailConfigured()) {
    return { sent: false, reason: 'provider_disabled' };
  }

  try {
    await sendTransactionalEmail({ to: input.to, ...renderManageLinkEmail(input) });
    return { sent: true };
  } catch (error) {
    console.error('Management link email failed', error instanceof Error ? error.message : 'unknown');
    return { sent: false, reason: 'send_failed' };
  }
}
