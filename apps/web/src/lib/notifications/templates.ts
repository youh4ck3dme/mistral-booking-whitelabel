import type { NotificationContext, NotificationEmailPayload } from './types';

const DEFAULT_BRAND_COLOR = '#8ba5ff';
const DEFAULT_BRAND_NAME = 'NEXIFY TECH CENTER';

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('sk-SK', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://127.0.0.1:3000';
}

function getBrandColor(context: NotificationContext) {
  return context.branding?.primary_color ?? DEFAULT_BRAND_COLOR;
}

function getBrandName(context: NotificationContext) {
  return context.tenant.name || DEFAULT_BRAND_NAME;
}

function getPortalUrl(context: NotificationContext) {
  return `${getAppUrl()}/${context.tenant.slug}/portal`;
}

function renderShell({
  context,
  eyebrow,
  headline,
  message,
}: {
  context: NotificationContext;
  eyebrow: string;
  headline: string;
  message: string;
}) {
  const accent = getBrandColor(context);
  const portalUrl = getPortalUrl(context);
  const bookingDate = formatDateTime(context.booking.start_time);
  const brandName = getBrandName(context);

  const html = `
    <div style="background:#0a0a0a;color:#eaeaea;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Arial,sans-serif;padding:32px;">
      <div style="max-width:640px;margin:0 auto;background:rgba(26,26,26,0.92);border:1px solid rgba(255,255,255,0.08);border-radius:28px;padding:32px;">
        <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:16px;">${eyebrow}</div>
        <h1 style="font-size:32px;line-height:1.1;margin:0 0 16px;font-family:'SF Pro Display','Helvetica Neue',Arial,sans-serif;">${headline}</h1>
        <p style="font-size:16px;line-height:1.7;color:rgba(234,234,234,0.82);margin:0 0 24px;">${message}</p>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:20px;margin-bottom:24px;">
          <div style="font-size:13px;color:rgba(234,234,234,0.6);margin-bottom:8px;">Rezervácia</div>
          <div style="font-size:20px;font-weight:600;margin-bottom:8px;">${context.service.name}</div>
          <div style="font-size:15px;color:rgba(234,234,234,0.82);margin-bottom:4px;">${bookingDate}</div>
          <div style="font-size:15px;color:rgba(234,234,234,0.82);">${brandName}</div>
        </div>
        <a href="${portalUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:${accent};color:#0a0a0a;font-weight:700;text-decoration:none;">Otvoriť klientský portál</a>
      </div>
    </div>
  `;

  const text = `${headline}\n\n${message}\n\nSlužba: ${context.service.name}\nTermín: ${bookingDate}\nTenant: ${brandName}\nPortál: ${portalUrl}`;

  return { html, text };
}

export function renderNotificationEmail(
  context: NotificationContext
): NotificationEmailPayload {
  switch (context.delivery.notification_type) {
    case 'booking_confirmation': {
      const subject = `Potvrdenie rezervácie • ${getBrandName(context)}`;
      const message = `Vaša rezervácia bola potvrdená. V klientskom portáli nájdete aktuálny stav, detaily termínu aj ďalšie kroky.`;
      const shell = renderShell({
        context,
        eyebrow: 'Booking confirmation',
        headline: 'Rezervácia je potvrdená.',
        message,
      });
      return { ...shell, subject, to: context.recipientEmail };
    }
    case 'booking_reminder': {
      const subject = `Pripomienka rezervácie • ${getBrandName(context)}`;
      const message = `Pripomíname vám blížiaci sa termín. Ak potrebujete zmenu alebo zrušenie, urobte ju čo najskôr v klientskom portáli.`;
      const shell = renderShell({
        context,
        eyebrow: 'Booking reminder',
        headline: 'Pripomíname váš termín.',
        message,
      });
      return { ...shell, subject, to: context.recipientEmail };
    }
    case 'booking_cancellation': {
      const subject = `Rezervácia bola zrušená • ${getBrandName(context)}`;
      const message = `Vaša rezervácia bola zrušená. Nový termín si môžete vybrať okamžite cez booking flow alebo klientský portál.`;
      const shell = renderShell({
        context,
        eyebrow: 'Booking cancellation',
        headline: 'Rezervácia bola zrušená.',
        message,
      });
      return { ...shell, subject, to: context.recipientEmail };
    }
    case 'booking_update': {
      const subject = `Rezervácia bola aktualizovaná • ${getBrandName(context)}`;
      const message = `Detaily vašej rezervácie sa zmenili. Prosím, skontrolujte si nový termín a aktuálne detaily v klientskom portáli.`;
      const shell = renderShell({
        context,
        eyebrow: 'Booking update',
        headline: 'Rezervácia bola aktualizovaná.',
        message,
      });
      return { ...shell, subject, to: context.recipientEmail };
    }
    default:
      throw new Error(`Unsupported notification type: ${String(context.delivery.notification_type)}`);
  }
}
