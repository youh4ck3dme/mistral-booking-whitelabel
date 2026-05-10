import { expect, test } from '@playwright/test';

import { verticalRouteList } from '../../../apps/web/src/lib/booking/vertical-routing';
import { expectNo404, expectRouteContent, gotoAndStabilize } from '../utils/helpers';
import { routes } from '../utils/routes';

const tenantRouteInventory = [
  {
    slug: 'demo-clinic',
    heading: /Welcome to Demo Clinic/i,
    serviceName: 'General Checkup',
  },
  {
    slug: 'wellness-center',
    heading: /Welcome to Wellness Center/i,
    serviceName: 'Yoga Class',
  },
  ...verticalRouteList
    .filter((vertical) => vertical.tenantSlug !== 'demo-clinic')
    .map((vertical) => ({
      slug: vertical.tenantSlug,
      heading: new RegExp(`Welcome to .*`, 'i'),
      serviceName: vertical.serviceName,
    })),
];

test.describe('endpoint diagnostics', () => {
  test('serves public routes with the expected content', async ({ page }) => {
    await gotoAndStabilize(page, routes.home);
    await expectRouteContent(page, /^.*\/$/, /Book Your Perfect Service/i);

    await gotoAndStabilize(page, routes.login);
    await expectRouteContent(page, /\/login$/, /Prihlásenie/i);
    await expect(page.getByLabel('Email')).toBeVisible();

    await gotoAndStabilize(page, routes.signup);
    await expectRouteContent(page, /\/signup$/, /Registrácia/i);
    await expect(page.getByLabel('Potvrďte heslo')).toBeVisible();

    await gotoAndStabilize(page, routes.forgotPassword);
    await expectRouteContent(page, /\/forgot-password$/, /Zabudli ste heslo\?/i);
    await expect(page.getByLabel('Email')).toBeVisible();

    await gotoAndStabilize(page, routes.resetPassword);
    await expectRouteContent(page, /\/reset-password/, /Resetovať heslo/i);
    await expect(page.locator('#password')).toBeVisible();
  });

  test('serves tenant homepages and booking entry points without 404s', async ({ page }) => {
    for (const tenant of tenantRouteInventory) {
      await gotoAndStabilize(page, `/${tenant.slug}`);
      await expectNo404(page);
      await expect(page.getByRole('heading', { level: 1, name: tenant.heading })).toBeVisible();
      await expect(page.getByText(tenant.serviceName, { exact: false })).toBeVisible();

      await gotoAndStabilize(page, `/${tenant.slug}/book`);
      await expectRouteContent(page, new RegExp(`/${tenant.slug}/book$`), /Rezervácia termínu/i);
      await expect(page.getByRole('heading', { level: 2, name: 'Vyberte službu' })).toBeVisible();
      await expect(page.getByRole('button', { name: new RegExp(tenant.serviceName, 'i') })).toBeVisible();
    }
  });

  test('routes protected pages into the auth flow for guests', async ({ page }) => {
    for (const path of [routes.platform, routes.portal, routes.admin]) {
      await gotoAndStabilize(page, routes.home);
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await page.context().clearCookies();
      await gotoAndStabilize(page, path);
      await expect(page).toHaveURL(/\/(login|demo-clinic)$/);

      if (page.url().endsWith('/login')) {
        await expect(page.getByRole('heading', { level: 1, name: /Prihlásenie/i })).toBeVisible();
      } else {
        await expect(page.getByRole('heading', { level: 1, name: /Welcome to Demo Clinic/i })).toBeVisible();
      }
    }
  });

  test('keeps homepage CTA targets and featured service links live', async ({ page }) => {
    await gotoAndStabilize(page, routes.home);

    await expect(page.getByRole('link', { name: 'Explore Services' })).toHaveAttribute(
      'href',
      `/${verticalRouteList[0].tenantSlug}`
    );
    await expect(page.getByRole('link', { name: 'Book Now' })).toHaveAttribute(
      'href',
      '/demo-clinic/book'
    );

    const selectLinks = page.getByRole('link', { name: 'Select' });
    await expect(selectLinks).toHaveCount(verticalRouteList.length);

    for (let index = 0; index < verticalRouteList.length; index += 1) {
      const vertical = verticalRouteList[index];
      const expectedHref = `/${vertical.tenantSlug}/book?service=${vertical.serviceId}`;
      await expect(selectLinks.nth(index)).toHaveAttribute('href', expectedHref);
    }
  });

  test('serves PWA assets and notification API guards with explicit statuses', async ({ request }) => {
    const manifestResponse = await request.get('/manifest.webmanifest');
    expect(manifestResponse.status()).toBe(200);
    expect(manifestResponse.headers()['content-type']).toContain('application/manifest+json');

    const serviceWorkerResponse = await request.get('/sw.js');
    expect(serviceWorkerResponse.status()).toBe(200);
    expect(serviceWorkerResponse.headers()['content-type']).toContain('application/javascript');

    for (const assetPath of [
      '/favicon.ico',
      '/favicon-32.png',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/apple-touch-icon.png',
    ]) {
      const response = await request.get(assetPath);
      expect(response.ok(), `${assetPath} should be reachable`).toBeTruthy();
    }

    const dispatchGet = await request.get('/api/notifications/dispatch');
    expect(dispatchGet.status()).toBe(405);

    const dispatchPost = await request.post('/api/notifications/dispatch', {
      data: { bookingId: '00000000-0000-0000-0000-000000000000' },
    });
    expect(dispatchPost.status()).toBe(401);

    const remindersGet = await request.get('/api/notifications/reminders');
    expect(remindersGet.status()).toBe(405);

    const remindersPost = await request.post('/api/notifications/reminders');
    expect(remindersPost.status()).toBe(401);
  });
});
