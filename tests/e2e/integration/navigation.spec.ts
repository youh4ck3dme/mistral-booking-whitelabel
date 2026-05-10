import { expect, test } from '@playwright/test';

import { gotoAndStabilize } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('navigation', () => {
  test('connects primary landing links to tenant and platform flows', async ({ page }) => {
    await gotoAndStabilize(page, routes.home);

    await expect(page.getByRole('link', { name: 'Explore Services' })).toHaveAttribute('href', /.+/);
    await expect(page.getByRole('link', { name: 'Book Now' })).toHaveAttribute('href', /\/book$/);

    await gotoAndStabilize(page, routes.home);
    const adminLink = page.getByLabel('Primary').getByRole('link', { name: 'Admin' });
    await expect(adminLink).toHaveAttribute('href', '/platform');
    await adminLink.click();
    await expect(page).toHaveURL(/\/(platform|login)/);
  });
});
