import { expect, test } from '@playwright/test';

import { collectContrast, gotoAndStabilize, setTheme } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('accessibility contrast', () => {
  test('keeps critical text contrast above 4.5:1 in dark theme', async ({ page }) => {
    await setTheme(page, 'dark');
    await gotoAndStabilize(page, routes.home);

    const samples = await collectContrast(page, ['h1', 'p', 'a.premium-button', '.premium-nav-link']);
    for (const sample of samples) {
      expect(sample.ratio, `${sample.selector} contrast`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
