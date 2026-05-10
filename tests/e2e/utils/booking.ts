import { expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import { credentials } from './routes';

export const bookingSuccessConfig = {
  tenantSlug: 'demo-clinic',
  serviceId: '10000000-0000-0000-0000-000000000001',
  serviceName: 'General Checkup',
};

export type BookingRecord = {
  id: string;
  tenant_id: string;
  user_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'pending';
};

export type NotificationDeliveryRecord = {
  booking_id: string;
  notification_type: string;
  status: string;
  idempotency_key: string;
};

export function getBookingSuccessRoute() {
  return `/${bookingSuccessConfig.tenantSlug}/book?service=${bookingSuccessConfig.serviceId}`;
}

export async function chooseBookingSlot(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Rezervácia termínu' })).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(bookingSuccessConfig.serviceName, 'i') })).toBeVisible();

  const dateSection = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { level: 2, name: 'Vyberte dátum' }) });
  await expect(dateSection).toBeVisible();

  const dateButtons = dateSection.locator('button.premium-chip-button');
  const dateButton = dateButtons.nth(1);
  const selectedDateLabel = (await dateButton.innerText()).trim();
  await dateButton.click();

  const timeSection = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { level: 2, name: 'Vyberte čas' }) });
  await expect(timeSection).toBeVisible();

  const preferredTimeButton = timeSection.getByRole('button', { name: /^12:00-/ });
  const fallbackTimeButton = timeSection.getByRole('button', { name: /^10:00-/ });
  const timeButton =
    (await preferredTimeButton.count()) > 0
      ? preferredTimeButton
      : (await fallbackTimeButton.count()) > 0
        ? fallbackTimeButton
        : timeSection.locator('button.premium-chip-button').first();
  const selectedTimeLabel = (await timeButton.innerText()).trim();
  await timeButton.click();

  const bookingSummary = page
    .locator('.premium-split')
    .locator('.premium-card')
    .first();
  await expect(page.getByRole('heading', { level: 2, name: 'Prehľad rezervácie' })).toBeVisible();
  await expect(bookingSummary.getByText(bookingSuccessConfig.serviceName, { exact: false })).toBeVisible();

  return { selectedDateLabel, selectedTimeLabel };
}

export async function signInFromBookingFlow(page: Page) {
  if (!credentials.email || !credentials.password) {
    throw new Error('PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD must be set for authenticated booking tests');
  }

  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Heslo').fill(credentials.password);
  await page.getByTestId('login-button').click();
  await page.waitForURL(new RegExp(`/${bookingSuccessConfig.tenantSlug}/book\\?service=${bookingSuccessConfig.serviceId}`));
  await page.waitForLoadState('networkidle');
}

export async function submitBooking(page: Page) {
  await page.getByRole('button', { name: 'Potvrdiť rezerváciu' }).click();
  await expect(page.locator('.premium-alert--success')).toContainText('Rezervácia úspešná!');
}

export async function extractBookingId(page: Page) {
  const successPanel = page.locator('.premium-alert--success');
  const successText = await successPanel.innerText();
  const bookingIdMatch = successText.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );

  if (!bookingIdMatch) {
    throw new Error('Booking success panel did not include a booking ID');
  }

  return bookingIdMatch[0];
}

function createServiceRoleTestClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for booking verification');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getBookingRecord(bookingId: string) {
  const supabase = createServiceRoleTestClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('id, tenant_id, user_id, service_id, start_time, end_time, status')
    .eq('id', bookingId)
    .single();

  if (error || !data) {
    throw error ?? new Error(`Booking ${bookingId} was not found`);
  }

  return data as BookingRecord;
}

export async function getNotificationDeliveries(bookingId: string) {
  const supabase = createServiceRoleTestClient();
  const { data, error } = await supabase
    .from('notification_deliveries')
    .select('booking_id, notification_type, status, idempotency_key')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as NotificationDeliveryRecord[];
}

export async function deleteBookingRecord(bookingId: string) {
  const supabase = createServiceRoleTestClient();
  const { error } = await supabase.from('bookings').delete().eq('id', bookingId);

  if (error) {
    throw error;
  }
}
