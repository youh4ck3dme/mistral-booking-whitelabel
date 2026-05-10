import { expect, test } from '@playwright/test';

import { gotoAndStabilize, is404Path } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('booking flow', () => {
  test('guides guest user from service selection to login redirect', async ({ page }) => {
    await gotoAndStabilize(page, routes.booking);
    test.skip(is404Path(page), 'Booking route is unavailable in the current environment');

    const services = page.locator('button.premium-card');
    await expect(services.first()).toBeVisible();

    await services.first().click();
    const dateSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Vyberte dátum' }) });
    await dateSection.locator('button.premium-chip-button').first().click();

    const timeSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Vyberte čas' }) });
    await timeSection.locator('button.premium-chip-button').first().click();
    await expect(page.getByRole('heading', { name: 'Prehľad rezervácie' })).toBeVisible();

    await page.getByRole('button', { name: 'Potvrdiť rezerváciu' }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});
