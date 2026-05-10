import { expect, test } from '@playwright/test';

import { gotoAndStabilize, is404Path, setTheme } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('visual tenant', () => {
  test('renders tenant hero and service cards', async ({ page }, testInfo) => {
    await setTheme(page, 'dark');
    await gotoAndStabilize(page, routes.tenant);
    test.skip(is404Path(page), 'Tenant route is unavailable in the current environment');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.premium-card').first()).toBeVisible();

    const cardCount = await page.locator('.premium-card').count();
    expect(cardCount).toBeGreaterThan(1);

    await testInfo.attach('tenant-dark', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
});
