import { expect, test } from '@playwright/test';

import { expectTouchTargets, gotoAndStabilize, is404Path } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('responsive mobile', () => {
  test('keeps navigation and CTAs touch friendly', async ({ page }) => {
    await gotoAndStabilize(page, routes.home);

    const buttons = page.locator('a.premium-button, button.premium-button, a.premium-button-secondary');
    await expectTouchTargets(buttons.first(), 44);
    await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();
  });

  test('keeps booking cards inside viewport', async ({ page }) => {
    await gotoAndStabilize(page, routes.booking);
    test.skip(is404Path(page), 'Booking route is unavailable in the current environment');
    const serviceCard = page.locator('.premium-card').first();
    await expect(serviceCard).toBeVisible();

    const box = await serviceCard.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(250);
  });
});
