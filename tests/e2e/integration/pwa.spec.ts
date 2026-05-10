import { expect, test } from '@playwright/test';

import { gotoAndStabilize } from '../utils/helpers';
import { routes } from '../utils/routes';

test.describe('pwa', () => {
  test('publishes install metadata, icons, and a registered service worker', async ({
    page,
    request,
  }) => {
    await gotoAndStabilize(page, routes.home);

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      '/manifest.webmanifest'
    );
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      '/icons/apple-touch-icon.png'
    );

    await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]'))
      .toHaveAttribute('content', '#0a0a0a');
    await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: light)"]'))
      .toHaveAttribute('content', '#f7f4f0');

    const manifestResponse = await request.get('/manifest.webmanifest');
    expect(manifestResponse.ok()).toBeTruthy();
    expect(manifestResponse.headers()['content-type']).toContain('application/manifest+json');

    const manifest = await manifestResponse.json();
    expect(manifest).toMatchObject({
      name: 'NEXIFY TECH CENTER',
      short_name: 'NEXIFY',
      display: 'standalone',
      start_url: '/',
      theme_color: '#0a0a0a',
      background_color: '#0a0a0a',
    });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/icons/icon-192.png', sizes: '192x192' }),
        expect.objectContaining({ src: '/icons/icon-512.png', sizes: '512x512' }),
        expect.objectContaining({
          src: '/icons/icon-maskable-512.png',
          sizes: '512x512',
          purpose: 'maskable',
        }),
      ])
    );

    for (const assetPath of [
      '/favicon.ico',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/apple-touch-icon.png',
    ]) {
      const assetResponse = await request.get(assetPath);
      expect(assetResponse.ok(), `${assetPath} should be reachable`).toBeTruthy();
    }

    const serviceWorkerResponse = await request.get('/sw.js');
    expect(serviceWorkerResponse.ok()).toBeTruthy();
    expect(serviceWorkerResponse.headers()['cache-control']).toContain('no-cache');

    await expect
      .poll(async () =>
        page.evaluate(async () => {
          const registration = await navigator.serviceWorker.getRegistration('/');
          return (
            registration?.active?.scriptURL ??
            registration?.waiting?.scriptURL ??
            registration?.installing?.scriptURL ??
            null
          );
        })
      )
      .toContain('/sw.js');
  });
});
