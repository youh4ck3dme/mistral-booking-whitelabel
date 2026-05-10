import { expect, test } from '@playwright/test';

import { gotoAndStabilize, is404Path } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('touch interaction', () => {
  test('supports tapping booking service and date chips on mobile', async ({ page }) => {
    await gotoAndStabilize(page, routes.booking);
    test.skip(is404Path(page), 'Booking route is unavailable in the current environment');

    const services = page.locator('button.premium-card');
    await expect(services.first()).toBeVisible();

    await services.first().tap();
    await expect(page.getByRole('heading', { name: 'Vyberte dátum' })).toBeVisible();

    const dateButtons = page.locator('button.premium-chip-button');
    await dateButtons.first().tap();
    await expect(page.getByRole('heading', { name: 'Vyberte čas' })).toBeVisible();
  });
});
