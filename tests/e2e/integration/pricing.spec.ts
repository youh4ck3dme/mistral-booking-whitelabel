import { expect, test } from '@playwright/test';

import { gotoAndStabilize } from '../utils/helpers';

test.describe('pricing page', () => {
  test('GET /pricing returns 200 and is not rewritten to a tenant 404', async ({ request }) => {
    const response = await request.get('/pricing', { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('<title>Cenník — NEXIFY Booking</title>');
  });

  test('shows the three plans and links to signup', async ({ page }) => {
    await gotoAndStabilize(page, '/pricing');
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cenník');
    for (const plan of ['Solo / Štartér', 'Pro / Salón', 'Multi-pobočka']) {
      await expect(page.getByText(plan, { exact: true })).toBeVisible();
    }
    await expect(page.locator('a[href="/signup?plan=pro"]')).toBeVisible();
  });
});
