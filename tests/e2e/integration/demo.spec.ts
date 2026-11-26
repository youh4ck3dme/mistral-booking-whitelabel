import { expect, test } from '@playwright/test';

test.describe('demo page', () => {
  test('GET /demo returns 200 without a database', async ({ request }) => {
    const response = await request.get('/demo', { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<title>Demo salón — NEXIFY Booking</title>');
  });

  test('shows the sample tenant, its services and team', async ({ page }) => {
    // Not waiting for networkidle: globals.css requests web fonts from a third-party host,
    // which can keep the network busy; the assertions below auto-wait for the content.
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/demo$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Salón Aurora (demo)');
    await expect(page.getByRole('heading', { name: 'Dámsky strih a fúkaná' })).toBeVisible();
    await expect(page.getByText('35,00 €')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Martin' })).toBeVisible();
  });
});
