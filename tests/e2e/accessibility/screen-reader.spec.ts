import { expect, test } from '@playwright/test';

import { gotoAndStabilize, runAxe } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('accessibility screen reader', () => {
  test('has no critical axe violations on landing and login', async ({ page }) => {
    await gotoAndStabilize(page, routes.home);
    const landing = await runAxe(page);
    expect(landing.violations).toEqual([]);

    await gotoAndStabilize(page, routes.login);
    const login = await runAxe(page);
    expect(login.violations).toEqual([]);
  });
});
