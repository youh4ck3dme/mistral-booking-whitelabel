import { expect, test } from '@playwright/test';

import { gotoAndStabilize, setTheme } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('visual landing', () => {
  test('renders premium landing styling on desktop', async ({ page }, testInfo) => {
    await setTheme(page, 'dark');
    await gotoAndStabilize(page, routes.home);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Book');
    await expect(page.getByRole('link', { name: 'Book Now' })).toBeVisible();

    const heroStyle = await page.locator('h1').evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        fontFamily: styles.fontFamily,
        lineHeight: styles.lineHeight,
        letterSpacing: styles.letterSpacing,
      };
    });

    expect(heroStyle.fontFamily).toContain('SF Pro');
    expect(parseFloat(heroStyle.letterSpacing)).toBeLessThan(0);

    await testInfo.attach('landing-dark', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  test('renders warm light theme consistently', async ({ page }, testInfo) => {
    await setTheme(page, 'light');
    await gotoAndStabilize(page, routes.home);

    const pageStyle = await page.locator('main').evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        color: styles.color,
        backgroundImage: styles.backgroundImage,
      };
    });

    expect(pageStyle.backgroundImage).toContain('gradient');
    expect(pageStyle.color).toBeTruthy();

    await testInfo.attach('landing-light', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
});
