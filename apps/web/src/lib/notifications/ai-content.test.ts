import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Booking, Service, Tenant, TenantBranding } from '@repo/core';
import type { NotificationContext, NotificationDelivery } from './types';

const aiMocks = vi.hoisted(() => ({
  generateText: vi.fn(),
}));

vi.mock('ai', async () => {
  const actual = await vi.importActual<typeof import('ai')>('ai');
  return {
    ...actual,
    generateText: aiMocks.generateText,
  };
});

vi.mock('@ai-sdk/mistral', () => ({
  mistral: vi.fn(() => 'mocked-model'),
}));

import { renderNotificationEmail } from './templates';
import { renderNotificationEmailWithAI } from './ai-content';

function createContext(overrides: Partial<{ locale: string }> = {}): NotificationContext {
  const delivery: NotificationDelivery = {
    attempt_count: 0,
    booking_id: 'booking-1',
    channel: 'email',
    created_at: '2026-05-10T00:00:00.000Z',
    error_message: null,
    id: 'delivery-1',
    idempotency_key: 'booking-1:booking_confirmation',
    notification_type: 'booking_confirmation',
    payload: {},
    provider_message_id: null,
    recipient_email: 'client@example.com',
    scheduled_for: '2026-05-10T00:00:00.000Z',
    sent_at: null,
    status: 'pending',
    subject: null,
    tenant_id: 'tenant-1',
    updated_at: '2026-05-10T00:00:00.000Z',
    user_id: 'user-1',
  };

  const booking: Booking = {
    id: delivery.booking_id,
    tenant_id: delivery.tenant_id,
    user_id: delivery.user_id,
    service_id: 'service-1',
    start_time: '2026-05-12T09:00:00.000Z',
    end_time: '2026-05-12T10:00:00.000Z',
    status: 'confirmed',
  };

  const service: Service = {
    id: 'service-1',
    tenant_id: delivery.tenant_id,
    name: 'Premium Consultation',
    description: null,
    duration: 60,
    is_active: true,
    price: 90,
  };

  const tenant: Tenant = {
    id: delivery.tenant_id,
    name: 'Demo Clinic',
    slug: 'demo-clinic',
    locale: overrides.locale ?? 'sk',
    created_at: '2026-05-10T00:00:00.000Z',
  };

  const branding: TenantBranding = {
    id: 'branding-1',
    tenant_id: delivery.tenant_id,
    favicon_url: null,
    logo_url: null,
    primary_color: '#8ba5ff',
  };

  return { booking, branding, delivery, recipientEmail: delivery.recipient_email, service, tenant };
}

describe('renderNotificationEmailWithAI', () => {
  const originalKey = process.env.MISTRAL_API_KEY;

  beforeEach(() => {
    aiMocks.generateText.mockReset();
  });

  afterEach(() => {
    process.env.MISTRAL_API_KEY = originalKey;
  });

  it('falls back to the static template when MISTRAL_API_KEY is not set', async () => {
    delete process.env.MISTRAL_API_KEY;
    const context = createContext();

    const result = await renderNotificationEmailWithAI(context);

    expect(aiMocks.generateText).not.toHaveBeenCalled();
    expect(result).toEqual(renderNotificationEmail(context));
  });

  it('falls back to the static template when the AI call throws', async () => {
    process.env.MISTRAL_API_KEY = 'test-key';
    aiMocks.generateText.mockRejectedValue(new Error('network error'));
    const context = createContext();

    const result = await renderNotificationEmailWithAI(context);

    expect(aiMocks.generateText).toHaveBeenCalledTimes(1);
    expect(result).toEqual(renderNotificationEmail(context));
  });

  it('uses the AI-generated headline/message when the call succeeds', async () => {
    process.env.MISTRAL_API_KEY = 'test-key';
    aiMocks.generateText.mockResolvedValue({
      output: { headline: 'Rezervácia potvrdená', message: 'Tešíme sa na vašu návštevu.' },
    });
    const context = createContext();

    const result = await renderNotificationEmailWithAI(context);
    const fallback = renderNotificationEmail(context);

    expect(result.html).toContain('Rezervácia potvrdená');
    expect(result.html).toContain('Tešíme sa na vašu návštevu.');
    expect(result.subject).toBe(fallback.subject);
    expect(result.to).toBe(fallback.to);
  });

  it('asks for Czech copy when tenant.locale is cz', async () => {
    process.env.MISTRAL_API_KEY = 'test-key';
    aiMocks.generateText.mockResolvedValue({
      output: { headline: 'Rezervace potvrzena', message: 'Těšíme se na vaši návštěvu.' },
    });
    const context = createContext({ locale: 'cz' });

    await renderNotificationEmailWithAI(context);

    const call = aiMocks.generateText.mock.calls[0][0];
    expect(call.system).toContain('česky');
  });
});
