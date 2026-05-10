import { expect, test } from '@playwright/test';

import { gotoAndStabilize } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('accessibility keyboard', () => {
  test('supports visible focus order through primary controls', async ({ page }) => {
    await gotoAndStabilize(page, routes.home);
    const primaryNav = page.getByLabel('Primary');
    const homeLink = primaryNav.getByRole('link', { name: 'Home' });
    const servicesLink = primaryNav.getByRole('link', { name: 'Services' });

    await homeLink.focus();
    await expect(homeLink).toBeFocused();

    await servicesLink.focus();
    await expect(servicesLink).toBeFocused();
  });
});
