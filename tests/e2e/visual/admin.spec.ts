import { expect, test } from '@playwright/test';

import { gotoAndStabilize, is404Path, login, setTheme } from '../utils/helpers';
import { hasCredentials, routes } from '../utils/routes';

test.describe('visual admin', () => {
  test.skip(!hasCredentials, 'Admin visual tests require PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD');

  test('renders tenant admin tables and forms', async ({ page }, testInfo) => {
    await setTheme(page, 'dark');
    await login(page, routes.admin);
    await gotoAndStabilize(page, routes.admin);
    test.skip(is404Path(page), 'Admin route is unavailable in the current environment');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('control room');
    await expect(page.locator('.premium-tab-list')).toBeVisible();

    await testInfo.attach('admin-dark', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
});
