import { expect, test } from '@playwright/test';

import { gotoAndStabilize, is404Path, login } from '../utils/helpers';
import {
  bookingSuccessConfig,
  chooseBookingSlot,
  deleteBookingRecord,
  extractBookingId,
  getBookingRecord,
  getBookingSuccessRoute,
  getNotificationDeliveries,
  signInFromBookingFlow,
  submitBooking,
} from '../utils/booking';

test.describe('booking flow', () => {
  test.describe.configure({ mode: 'serial' });

  let bookingIdsToCleanup: string[] = [];

  test.beforeEach(async ({ page }) => {
    bookingIdsToCleanup = [];
    await gotoAndStabilize(page, '/');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.context().clearCookies();
  });

  test.afterEach(async () => {
    for (const bookingId of bookingIdsToCleanup) {
      await deleteBookingRecord(bookingId);
    }
  });

  test('guides a guest through login return and finishes a successful booking', async ({ page }) => {
    const bookingRoute = getBookingSuccessRoute();
    await gotoAndStabilize(page, bookingRoute);
    test.skip(is404Path(page), 'Booking route is unavailable in the current environment');

    const selection = await chooseBookingSlot(page);
    await page.getByRole('button', { name: 'Potvrdiť rezerváciu' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('toast-info')).toContainText('Prihláste sa pre dokončenie');

    await signInFromBookingFlow(page);
    await expect(page.getByTestId('toast-success')).toContainText('Prihlásenie úspešné');
    await expect(page.getByRole('heading', { level: 2, name: 'Prehľad rezervácie' })).toBeVisible();
    const bookingSummary = page
      .locator('.premium-split')
      .locator('.premium-card')
      .first();
    await expect(bookingSummary.getByText(selection.selectedDateLabel, { exact: false })).toBeVisible();
    await expect(bookingSummary.getByText(selection.selectedTimeLabel, { exact: false })).toBeVisible();

    await submitBooking(page);

    const bookingId = await extractBookingId(page);
    bookingIdsToCleanup.push(bookingId);

    const bookingRecord = await getBookingRecord(bookingId);
    expect(bookingRecord.service_id).toBe(bookingSuccessConfig.serviceId);
    expect(bookingRecord.status).toBe('confirmed');

    const notificationDeliveries = await getNotificationDeliveries(bookingId);
    expect(notificationDeliveries.some((delivery) => delivery.notification_type === 'booking_confirmation')).toBeTruthy();
  });

  test('allows an already authenticated user to complete a booking with a persisted record', async ({
    page,
  }) => {
    const bookingRoute = getBookingSuccessRoute();
    await login(page, bookingRoute);
    await expect(page).toHaveURL(new RegExp(`/${bookingSuccessConfig.tenantSlug}/book\\?service=${bookingSuccessConfig.serviceId}`));

    await chooseBookingSlot(page);
    await submitBooking(page);

    const bookingId = await extractBookingId(page);
    bookingIdsToCleanup.push(bookingId);

    const bookingRecord = await getBookingRecord(bookingId);
    expect(bookingRecord.service_id).toBe(bookingSuccessConfig.serviceId);
    expect(bookingRecord.status).toBe('confirmed');

    const notificationDeliveries = await getNotificationDeliveries(bookingId);
    expect(notificationDeliveries.some((delivery) => delivery.notification_type === 'booking_confirmation')).toBeTruthy();
  });
});
