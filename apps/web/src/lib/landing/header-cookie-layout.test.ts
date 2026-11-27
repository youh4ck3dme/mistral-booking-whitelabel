import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(__dirname, '../../..');

const headerSource = readFileSync(
  path.join(appRoot, 'components/landing/LandingHeader.tsx'),
  'utf8',
);
const cookieCss = extractBlock(
  readFileSync(path.join(appRoot, 'app/globals.css'), 'utf8'),
  '.cookie-banner',
);
const cookieSource = readFileSync(path.join(appRoot, 'app/cookie-consent.tsx'), 'utf8');
const globalsSource = readFileSync(path.join(appRoot, 'app/globals.css'), 'utf8');

function extractBlock(css: string, selector: string): string {
  const start = css.indexOf(selector);
  expect(start, `${selector} is missing from globals.css`).toBeGreaterThan(-1);
  const brace = css.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  throw new Error(`Unclosed ${selector} block`);
}

function classOf(source: string, uniqueSnippet: string): string {
  const idx = source.indexOf(uniqueSnippet);
  expect(idx, `snippet not found: ${uniqueSnippet}`).toBeGreaterThan(-1);
  const from = source.lastIndexOf('className="', idx);
  expect(from, `className before ${uniqueSnippet}`).toBeGreaterThan(-1);
  const end = source.indexOf('"', from + 'className="'.length);
  return source.slice(from, end + 1);
}

describe('LandingHeader uses one shared breakpoint for nav vs hamburger', () => {
  it('reveals the desktop nav and CTAs from md (768px), not sm', () => {
    const nav = classOf(headerSource, 'aria-label="Landing navigation"');
    const actionsOpen = headerSource.indexOf('premium-nav-actions');
    const actionsClass = headerSource.slice(
      headerSource.lastIndexOf('className="', actionsOpen),
      headerSource.indexOf('"', headerSource.lastIndexOf('className="', actionsOpen) + 11) + 1,
    );

    expect(nav).toMatch(/!hidden/);
    expect(nav).toMatch(/md:!flex/);
    expect(nav).not.toMatch(/sm:!flex/);

    expect(actionsClass).toMatch(/!hidden/);
    expect(actionsClass).toMatch(/md:!flex/);
    expect(actionsClass).not.toMatch(/sm:!flex/);
  });

  it('shows the hamburger and mobile dropdown below the same md breakpoint', () => {
    expect(headerSource).toMatch(/className="flex md:hidden items-center gap-2"/);
    expect(headerSource).toMatch(/aria-label="Otvoriť navigáciu"/);
    expect(headerSource).toMatch(/className="md:hidden mt-2 /);
    expect(headerSource).not.toMatch(/\bflex sm:hidden\b/);
    expect(headerSource).not.toMatch(/\bsm:hidden mt-2\b/);
  });

  it('gives Prihlásenie high-contrast text on the dark mobile menu', () => {
    const menuStart = headerSource.indexOf('Otvoriť navigáciu');
    const menu = headerSource.slice(menuStart);
    const loginIdx = menu.indexOf('href="/login"');
    expect(loginIdx).toBeGreaterThan(-1);
    const loginBlock = menu.slice(loginIdx, menu.indexOf('</Link>', loginIdx));
    expect(loginBlock).toMatch(/text-white/);
    expect(loginBlock).not.toMatch(/premium-button-secondary/);
  });
});

describe('cookie consent banner is a compact in-viewport bottom bar', () => {
  it('is still a consent dialog with accept and decline actions', () => {
    expect(cookieSource).toMatch(/aria-label="Cookie consent"/);
    expect(cookieSource).toMatch(/Prijať/);
    expect(cookieSource).toMatch(/Odmietnuť/);
    expect(cookieSource).toMatch(/href="\/privacy"/);
  });

  it('pins the bar to the viewport bottom without a centering translateX', () => {
    expect(cookieCss).toMatch(/position:\s*fixed/);
    expect(cookieCss).toMatch(/left:\s*0/);
    expect(cookieCss).toMatch(/bottom:\s*0/);
    expect(cookieCss).toMatch(/width:\s*100%/);
    expect(cookieCss).toMatch(/max-height:\s*15vh/);
    expect(cookieCss).not.toMatch(/left:\s*50%/);
    expect(globalsSource).not.toMatch(/translateX\(-50%\)/);
  });

  it('animates with translateY only, so fill-mode cannot shift the bar off-screen', () => {
    const keyframesStart = globalsSource.indexOf('@keyframes cookie-slide-up');
    expect(keyframesStart).toBeGreaterThan(-1);
    const keyframes = extractBlock(globalsSource.slice(keyframesStart), '@keyframes cookie-slide-up');
    expect(keyframes).toMatch(/translateY\(/);
    expect(keyframes).not.toMatch(/translateX\(/);
  });
});
