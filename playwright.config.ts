import { defineConfig, devices } from '@playwright/test';

const useExternalBaseURL = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: useExternalBaseURL
    ? undefined
    : {
        command: 'pnpm --filter @repo/web start -- --hostname 127.0.0.1 --port 3000',
        env: {
          ...process.env,
          NOTIFICATION_CRON_SECRET:
            process.env.NOTIFICATION_CRON_SECRET ?? 'local-notification-cron-secret',
        },
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'desktop-chromium',
      testMatch: [
        '**/accessibility/*.spec.ts',
        '**/integration/*.spec.ts',
        '**/visual/landing.spec.ts',
        '**/visual/tenant.spec.ts',
        '**/apple/retina.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1512, height: 982 },
      },
    },
    {
      name: 'macbook-safari',
      testMatch: ['**/safari/safari.spec.ts', '**/apple/macbook.spec.ts'],
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1512, height: 982 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'iphone-15',
      testMatch: ['**/apple/ios.spec.ts', '**/responsive/mobile.spec.ts', '**/touch/touch.spec.ts'],
      use: {
        ...devices['iPhone 15'],
      },
    },
    {
      name: 'ipad-pro-11',
      testMatch: ['**/responsive/mobile.spec.ts'],
      use: {
        ...devices['iPad Pro 11'],
      },
    },
  ],
});
