import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

import { credentials } from './routes';

export async function gotoAndStabilize(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await disableMotion(page);
}

export function is404Path(page: Page) {
  const url = new URL(page.url());
  return url.pathname === '/404';
}

export async function disableMotion(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
  });
}

export async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((value) => {
    window.localStorage.setItem('nexify-theme', value);
    document.documentElement.dataset.theme = value;
    document.documentElement.style.colorScheme = value;
  }, theme);
}

export async function login(page: Page, targetPath: string) {
  if (!credentials.email || !credentials.password) {
    throw new Error('PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD must be set for authenticated tests');
  }

  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((path) => {
    window.sessionStorage.setItem('returnTo', path);
  }, targetPath);
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Heslo').fill(credentials.password);
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/(demo-clinic|platform)(?:\/.*)?$/);
  await page.waitForLoadState('networkidle');
  await page.goto(targetPath, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
}

export async function runAxe(page: Page) {
  return new AxeBuilder({ page }).analyze();
}

export async function expectTouchTargets(targets: Locator, minimum = 48) {
  const count = await targets.count();
  for (let index = 0; index < count; index += 1) {
    const box = await targets.nth(index).boundingBox();
    if (!box) continue;
    expect(box.width).toBeGreaterThanOrEqual(minimum);
    expect(box.height).toBeGreaterThanOrEqual(minimum);
  }
}

type ContrastSample = {
  selector: string;
  ratio: number;
};

export async function collectContrast(page: Page, selectors: string[]) {
  return page.evaluate((inputSelectors) => {
    const parseRgb = (value: string) => {
      const match = value.match(/\d+(\.\d+)?/g);
      if (!match || match.length < 3) return [255, 255, 255];
      return match.slice(0, 3).map(Number);
    };

    const normalize = (channel: number) => {
      const scaled = channel / 255;
      return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
    };

    const luminance = ([r, g, b]: number[]) =>
      0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);

    const ratio = (foreground: number[], background: number[]) => {
      const light = Math.max(luminance(foreground), luminance(background));
      const dark = Math.min(luminance(foreground), luminance(background));
      return (light + 0.05) / (dark + 0.05);
    };

    const resolvedBackground = (element: Element) => {
      let current: Element | null = element;
      while (current) {
        const value = getComputedStyle(current).backgroundColor;
        if (!value.includes('rgba(0, 0, 0, 0)') && value !== 'transparent') return value;
        current = current.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    };

    return inputSelectors
      .map((selector) => document.querySelector(selector))
      .filter((element): element is Element => Boolean(element))
      .map((element) => {
        const styles = getComputedStyle(element);
        return {
          selector: element.tagName.toLowerCase(),
          ratio: ratio(parseRgb(styles.color), parseRgb(resolvedBackground(element))),
        };
      });
  }, selectors) as Promise<ContrastSample[]>;
}
