import type { NotificationEmailPayload } from './types';

type ProviderResponse = {
  id: string | null;
};

export async function sendTransactionalEmail(
  payload: NotificationEmailPayload
): Promise<ProviderResponse> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL;
  const replyTo = process.env.NOTIFICATION_REPLY_TO_EMAIL;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  if (!fromEmail) {
    throw new Error('NOTIFICATION_FROM_EMAIL is not configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      html: payload.html,
      reply_to: replyTo,
      subject: payload.subject,
      text: payload.text,
      to: payload.to,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend request failed with ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as { id?: string };
  return { id: data.id ?? null };
}
