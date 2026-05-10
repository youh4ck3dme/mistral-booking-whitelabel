import { expect, test } from '@playwright/test';

import { verticalRouteList } from '../../../apps/web/src/lib/booking/vertical-routing';
import { gotoAndStabilize, is404Path } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('vertical routing', () => {
  test('connects every vertical CTA to a real booking target', async ({ page }) => {
    await gotoAndStabilize(page, routes.home);

    for (const vertical of verticalRouteList) {
      const expectedHref = `/${vertical.tenantSlug}/book?service=${vertical.serviceId}`;
      const cta = page.getByRole('link', { name: vertical.cta });

      await expect(cta).toHaveAttribute('href', expectedHref);
      await cta.click();
      await page.waitForLoadState('networkidle');

      expect(is404Path(page)).toBeFalsy();
      await expect(page).toHaveURL(expectedHref);
      await expect(page.getByRole('heading', { level: 1, name: 'Rezervácia termínu' })).toBeVisible();
      await expect(page.getByRole('button', { name: new RegExp(vertical.serviceName, 'i') })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Vyberte dátum' })).toBeVisible();

      await gotoAndStabilize(page, routes.home);
    }
  });
});
