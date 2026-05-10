import type { Booking, Service, Tenant, TenantBranding } from '@repo/core';
import type { Tables } from '@repo/supabase';

export type NotificationDelivery = Tables<'notification_deliveries'>;

export type NotificationDeliveryStatus = NotificationDelivery['status'];
export type NotificationChannel = NotificationDelivery['channel'];
export type BookingNotificationType = NotificationDelivery['notification_type'];

export type NotificationContext = {
  booking: Booking;
  delivery: NotificationDelivery;
  recipientEmail: string;
  service: Service;
  tenant: Tenant;
  branding: TenantBranding | null;
};

export type NotificationEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type NotificationDispatchResult = {
  failed: number;
  processed: number;
  sent: number;
};

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastInput = {
  description?: string;
  title: string;
  variant: ToastVariant;
};
