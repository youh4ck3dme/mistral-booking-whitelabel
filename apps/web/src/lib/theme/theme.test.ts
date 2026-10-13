import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Theme and Design System Contracts', () => {
  const globalsCssPath = path.resolve(__dirname, '../../../app/globals.css');
  const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

  it('defines Apple Liquid Glass light mode tokens in :root', () => {
    expect(globalsCss).toContain('--page-fg: #14171c;');
    expect(globalsCss).toContain('--page-card-bg: rgba(255, 255, 255, 0.78);');
    expect(globalsCss).toContain('--page-border: rgba(20, 23, 28, 0.08);');
    expect(globalsCss).toContain('--page-bg-start: #fbfcfd;');
  });

  it('defines Dark Graphite dark mode tokens in .dark and [data-theme="dark"]', () => {
    expect(globalsCss).toContain('--page-fg: #f5f8fc;');
    expect(globalsCss).toContain('--page-card-bg: rgba(10, 16, 26, 0.72);');
    expect(globalsCss).toContain('--page-border: rgba(255, 255, 255, 0.08);');
    expect(globalsCss).toContain('--page-bg-start: #04070c;');
  });

  it('provides light and dark title gradient styling', () => {
    expect(globalsCss).toContain('.premium-title-gradient');
    expect(globalsCss).toContain('.dark .premium-title-gradient');
  });

  it('has ThemeToggle and ThemeProvider exported and loadable', async () => {
    const { ThemeToggle } = await import('@repo/web/components/theme-toggle');
    const { ThemeProvider } = await import('@repo/web/components/theme-provider');

    expect(typeof ThemeToggle).toBe('function');
    expect(typeof ThemeProvider).toBe('function');
  });

  it('includes booking calendar and timeSlotPicker styles with theme awareness', async () => {
    const { calendarStyles, timeSlotPickerStyles } = await import(
      '@repo/web/src/lib/booking'
    );

    expect(calendarStyles).toContain('var(--page-fg');
    expect(calendarStyles).toContain('var(--page-border');
    expect(timeSlotPickerStyles).toContain('booking-time-slot');
  });
});
