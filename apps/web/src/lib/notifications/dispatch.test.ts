import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Booking, Service, Tenant, TenantBranding } from '@repo/core';

import { processPendingNotificationDeliveries } from './dispatch';
import type { NotificationContext, NotificationDelivery } from './types';

const repositoryMocks = vi.hoisted(() => ({
  claimPendingNotificationDeliveries: vi.fn(),
  getNotificationContext: vi.fn(),
  markNotificationDeliveryFailed: vi.fn(),
  markNotificationDeliverySent: vi.fn(),
}));

const providerMocks = vi.hoisted(() => ({
  sendTransactionalEmail: vi.fn(),
}));

const templateMocks = vi.hoisted(() => ({
  renderNotificationEmail: vi.fn(),
}));

vi.mock('./repository', async () => {
  const actual = await vi.importActual<typeof import('./repository')>('./repository');

  return {
    ...actual,
    claimPendingNotificationDeliveries: repositoryMocks.claimPendingNotificationDeliveries,
    getNotificationContext: repositoryMocks.getNotificationContext,
    markNotificationDeliveryFailed: repositoryMocks.markNotificationDeliveryFailed,
    markNotificationDeliverySent: repositoryMocks.markNotificationDeliverySent,
  };
});

vi.mock('./provider', () => ({
  sendTransactionalEmail: providerMocks.sendTransactionalEmail,
}));

vi.mock('./templates', () => ({
  renderNotificationEmail: templateMocks.renderNotificationEmail,
}));

function createDelivery(
  overrides: Partial<NotificationDelivery> = {}
): NotificationDelivery {
  return {
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
    ...overrides,
  };
}

function createContext(delivery: NotificationDelivery): NotificationContext {
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
    created_at: '2026-05-10T00:00:00.000Z',
  };

  const branding: TenantBranding = {
    id: 'branding-1',
    tenant_id: delivery.tenant_id,
    favicon_url: null,
    logo_url: null,
    primary_color: '#8ba5ff',
  };

  return {
    booking,
    branding,
    delivery,
    recipientEmail: delivery.recipient_email,
    service,
    tenant,
  };
}

describe('processPendingNotificationDeliveries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dedupes deliveries by idempotency key before sending', async () => {
    const firstDelivery = createDelivery();
    const duplicateDelivery = createDelivery({
      id: 'delivery-2',
      idempotency_key: firstDelivery.idempotency_key,
    });
    const uniqueDelivery = createDelivery({
      id: 'delivery-3',
      booking_id: 'booking-3',
      idempotency_key: 'booking-3:booking_update',
      notification_type: 'booking_update',
    });

    repositoryMocks.claimPendingNotificationDeliveries.mockResolvedValue([
      firstDelivery,
      duplicateDelivery,
      uniqueDelivery,
    ]);
    repositoryMocks.getNotificationContext.mockImplementation((delivery: NotificationDelivery) =>
      Promise.resolve(createContext(delivery))
    );
    templateMocks.renderNotificationEmail.mockImplementation((context: NotificationContext) => ({
      to: context.recipientEmail,
      subject: `Subject ${context.delivery.id}`,
      html: '<p>Hello</p>',
      text: 'Hello',
    }));
    providerMocks.sendTransactionalEmail.mockResolvedValue({ id: 'provider-message-id' });

    const result = await processPendingNotificationDeliveries({ limit: 10 });

    expect(result).toEqual({
      failed: 0,
      processed: 2,
      sent: 2,
    });
    expect(providerMocks.sendTransactionalEmail).toHaveBeenCalledTimes(2);
    expect(repositoryMocks.markNotificationDeliverySent).toHaveBeenCalledTimes(2);
  });

  it('marks failed deliveries when provider sending throws', async () => {
    const delivery = createDelivery();

    repositoryMocks.claimPendingNotificationDeliveries.mockResolvedValue([delivery]);
    repositoryMocks.getNotificationContext.mockResolvedValue(createContext(delivery));
    templateMocks.renderNotificationEmail.mockReturnValue({
      to: delivery.recipient_email,
      subject: 'Failure case',
      html: '<p>Hello</p>',
      text: 'Hello',
    });
    providerMocks.sendTransactionalEmail.mockRejectedValue(new Error('Provider unavailable'));

    const result = await processPendingNotificationDeliveries({ limit: 5 });

    expect(result).toEqual({
      failed: 1,
      processed: 1,
      sent: 0,
    });
    expect(repositoryMocks.markNotificationDeliveryFailed).toHaveBeenCalledWith(
      delivery.id,
      'Provider unavailable'
    );
  });
});
