import { expect, test } from '@playwright/test';

import { gotoAndStabilize, is404Path } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('notifications', () => {
  test('shows a flash notification after guest booking redirects to login', async ({ page }) => {
    await gotoAndStabilize(page, routes.booking);
    test.skip(is404Path(page), 'Booking route is unavailable in the current environment');

    await page.locator('button.premium-card').first().click();
    await page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Vyberte dátum' }) })
      .locator('button.premium-chip-button')
      .first()
      .click();
    await page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Vyberte čas' }) })
      .locator('button.premium-chip-button')
      .first()
      .click();
    await page.getByRole('button', { name: 'Potvrdiť rezerváciu' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('toast-info')).toContainText('Prihláste sa pre dokončenie');
  });

  test('shows an error toast for mismatched signup passwords', async ({ page }) => {
    await gotoAndStabilize(page, routes.signup);

    await page.getByLabel('Email').fill('notifications@example.com');
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirm-password').fill('Mismatch123!');
    await page.locator('#terms').check();
    await page.getByRole('button', { name: 'Zaregistrovať sa' }).click();

    await expect(page.getByTestId('toast-error')).toContainText('Registrácia zlyhala');
    await expect(page.locator('.premium-alert--error')).toContainText('Heslá sa nezhodujú');
  });
});
