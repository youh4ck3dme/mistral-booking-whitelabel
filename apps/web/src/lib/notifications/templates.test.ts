import { describe, expect, it } from 'vitest';
import type { Booking, Service, Tenant, TenantBranding } from '@repo/core';
import type { NotificationContext, NotificationDelivery } from './types';
import { renderNotificationEmail } from './templates';

function createMockContext(payload: Record<string, unknown> = {}): NotificationContext {
  const delivery: NotificationDelivery = {
    attempt_count: 0,
    booking_id: 'b-1',
    channel: 'email',
    created_at: '2026-05-10T00:00:00.000Z',
    error_message: null,
    id: 'd-1',
    idempotency_key: 'b-1:booking_confirmation',
    notification_type: 'booking_confirmation',
    payload: payload as unknown as NotificationDelivery['payload'],
    provider_message_id: null,
    recipient_email: 'client@example.com',
    scheduled_for: '2026-05-10T00:00:00.000Z',
    sent_at: null,
    status: 'pending',
    subject: null,
    tenant_id: 't-1',
    updated_at: '2026-05-10T00:00:00.000Z',
    user_id: 'u-1',
  };

  const booking: Booking = {
    id: 'b-1',
    tenant_id: 't-1',
    user_id: 'u-1',
    service_id: 's-1',
    start_time: '2026-05-12T09:00:00.000Z',
    end_time: '2026-05-12T10:00:00.000Z',
    status: 'confirmed',
  };

  const service: Service = {
    id: 's-1',
    tenant_id: 't-1',
    name: 'Strihanie vlasov',
    description: null,
    duration: 60,
    price: 35,
    is_active: true,
  };

  const tenant: Tenant = {
    id: 't-1',
    name: 'Salón Elite',
    slug: 'salon-elite',
    locale: 'sk',
    created_at: '2026-01-01T00:00:00.000Z',
  };

  const branding: TenantBranding = {
    id: 'branding-1',
    tenant_id: 't-1',
    primary_color: '#3b82f6',
    logo_url: null,
    favicon_url: null,
  };

  return {
    booking,
    delivery,
    recipientEmail: 'client@example.com',
    service,
    tenant,
    branding,
  };
}

describe('renderNotificationEmail', () => {
  it('renders standard email shell without manage url when not present', () => {
    const ctx = createMockContext({});
    const result = renderNotificationEmail(ctx);

    expect(result.subject).toContain('Potvrdenie rezervácie');
    expect(result.html).toContain('Salón Elite');
    expect(result.html).toContain('Strihanie vlasov');
    expect(result.html).toContain('Otvoriť klientský portál');
    expect(result.html).not.toContain('Spravovať rezerváciu (zmena / storno)');
    expect(result.text).not.toContain('Správa rezervácie');
  });

  it('renders manage url CTA button and text link when manage_url is in delivery payload (BK-4)', () => {
    const manageUrl = 'https://app.nexify.sk/salon-elite/booking/manage/secret-token-xyz';
    const ctx = createMockContext({ manage_url: manageUrl });
    const result = renderNotificationEmail(ctx);

    expect(result.html).toContain(manageUrl);
    expect(result.html).toContain('Spravovať rezerváciu (zmena / storno)');
    expect(result.text).toContain(`Správa rezervácie (zmena / storno): ${manageUrl}`);
  });
});
