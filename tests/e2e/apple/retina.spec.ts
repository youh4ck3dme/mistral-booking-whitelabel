import { expect, test } from '@playwright/test';

import { gotoAndStabilize } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('apple retina', () => {
  test('renders crisp high density headings and controls', async ({ page }) => {
    await gotoAndStabilize(page, routes.home);

    const devicePixelRatio = await page.evaluate(() => window.devicePixelRatio);
    expect(devicePixelRatio).toBeGreaterThanOrEqual(1);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Book Now' })).toBeVisible();
  });
});
