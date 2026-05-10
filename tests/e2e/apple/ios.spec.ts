import { expect, test } from '@playwright/test';

import { gotoAndStabilize } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('apple ios', () => {
  test('maintains viewport fit and booking CTA visibility on iPhone', async ({ page }) => {
    await gotoAndStabilize(page, routes.home);
    await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Book Now' })).toBeVisible();
  });

  test('publishes Apple home screen metadata and touch icon', async ({ page, request }) => {
    await gotoAndStabilize(page, routes.home);

    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
      'content',
      'yes'
    );
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
      'content',
      'NEXIFY'
    );
    await expect(
      page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')
    ).toHaveAttribute('content', 'black-translucent');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      '/icons/apple-touch-icon.png'
    );

    const iconResponse = await request.get('/icons/apple-touch-icon.png');
    expect(iconResponse.ok()).toBeTruthy();
    expect(iconResponse.headers()['content-type']).toContain('image/png');
  });
});
