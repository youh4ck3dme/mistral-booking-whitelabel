import { expect, test } from '@playwright/test';

import { gotoAndStabilize } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('safari compatibility', () => {
  test('uses stable layout and scrolling in webkit', async ({ page, isMobile }) => {
    await gotoAndStabilize(page, routes.home);
    if (isMobile) {
      await page.evaluate(() => window.scrollTo(0, 1200));
    } else {
      await page.mouse.wheel(0, 1200);
    }

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
    await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Booking experiences shaped for every vertical/i })).toBeVisible();
  });
});
