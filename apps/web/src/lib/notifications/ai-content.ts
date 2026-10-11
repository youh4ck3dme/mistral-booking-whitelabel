import { generateText, Output } from 'ai';
import { mistral } from '@ai-sdk/mistral';
import { z } from 'zod';
import { renderNotificationEmail } from './templates';
import type { NotificationContext, NotificationEmailPayload } from './types';

const NOTIFICATION_MODEL = 'mistral-small-latest';
const GENERATION_TIMEOUT_MS = 6_000;

const copySchema = z.object({
  headline: z.string().describe('Krátky nadpis, max. 6 slov'),
  message: z.string().describe('1-2 vety, teplý ale vecný tón, bez emoji'),
});

const NOTIFICATION_PURPOSE: Record<string, string> = {
  booking_confirmation: 'potvrdenie novej rezervácie',
  booking_reminder: 'pripomienka blížiaceho sa termínu',
  booking_cancellation: 'oznámenie o zrušení rezervácie',
  booking_update: 'oznámenie o zmene rezervácie',
};

async function generateCopy(context: NotificationContext): Promise<{ headline: string; message: string } | null> {
  if (!process.env.MISTRAL_API_KEY) return null;

  const locale = context.tenant.locale === 'cz' ? 'česky' : 'po slovensky';
  const purpose = NOTIFICATION_PURPOSE[context.delivery.notification_type] ?? context.delivery.notification_type;

  try {
    const { output } = await generateText({
      model: mistral(NOTIFICATION_MODEL),
      system: `Píšeš krátky, profesionálny text do e-mailovej notifikácie pre salón/kliniku "${context.tenant.name}". Píš ${locale}. Vráť nadpis a 1-2 vetnú správu, teplý ale vecný tón, bez emoji, bez oslovenia menom (meno nepoznáš).`,
      prompt: `Typ notifikácie: ${purpose}. Služba: ${context.service.name}.`,
      output: Output.object({ schema: copySchema }),
      abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    });
    return output;
  } catch (e) {
    console.warn('AI notification copy generation failed, falling back to static template:', e);
    return null;
  }
}

/**
 * Same output shape as `renderNotificationEmail`, but tries to generate the
 * headline/message with Mistral first (SK/CZ per tenant.locale). Never blocks
 * a real send on a flaky AI call — falls back to the static template on any
 * failure or timeout.
 */
export async function renderNotificationEmailWithAI(context: NotificationContext): Promise<NotificationEmailPayload> {
  const copy = await generateCopy(context);
  return renderNotificationEmail(context, copy ?? undefined);
}
