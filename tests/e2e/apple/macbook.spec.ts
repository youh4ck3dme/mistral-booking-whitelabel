import { expect, test } from '@playwright/test';

import { gotoAndStabilize, is404Path } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('apple macbook', () => {
  test('keeps sticky premium header and wide layout on desktop safari', async ({ page }) => {
    await gotoAndStabilize(page, routes.tenant);
    test.skip(is404Path(page), 'Tenant route is unavailable in the current environment');
    await expect(page.locator('.premium-nav-shell')).toBeVisible();

    const width = await page.locator('.premium-nav-shell').evaluate((element) =>
      Math.round(element.getBoundingClientRect().width)
    );
    expect(width).toBeGreaterThan(900);
  });
});
