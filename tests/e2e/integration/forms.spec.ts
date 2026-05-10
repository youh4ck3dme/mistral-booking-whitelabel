import { expect, test } from '@playwright/test';

import { gotoAndStabilize } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('form usability', () => {
  test('surfaces native validation on login and signup forms', async ({ page }) => {
    await gotoAndStabilize(page, routes.login);
    await page.getByTestId('login-button').click();

    const emailValid = await page.getByLabel('Email').evaluate(
      (element) => (element as HTMLInputElement).validationMessage.length > 0
    );
    expect(emailValid).toBe(true);

    await gotoAndStabilize(page, routes.signup);
    await page.getByRole('button', { name: 'Zaregistrovať sa' }).click();
    const signupMessage = await page.getByLabel('Email').evaluate(
      (element) => (element as HTMLInputElement).validationMessage.length > 0
    );
    expect(signupMessage).toBe(true);
  });
});
