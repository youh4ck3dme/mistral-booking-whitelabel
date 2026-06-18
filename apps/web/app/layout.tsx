import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NotificationsProvider } from './notifications-provider';
import PwaRegister from './pwa-register';
import ThemeToggle from './theme-toggle';
import CookieConsent from './cookie-consent';
import { getAppUrl } from '@repo/web/src/lib/app-url';

const metadataBase = new URL(getAppUrl());
const themeColors = {
  dark: '#0a0a0a',
  light: '#f7f4f0',
} as const;

const themeScript = `
  const storedTheme = window.localStorage.getItem('nexify-theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : systemTheme;
  const themeColor = theme === 'light' ? '${themeColors.light}' : '${themeColors.dark}';
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  let themeMeta = document.querySelector('meta[name="theme-color"][data-nexify-dynamic]');
  if (!themeMeta) {
    themeMeta = document.createElement('meta');
    themeMeta.setAttribute('name', 'theme-color');
    themeMeta.setAttribute('data-nexify-dynamic', 'true');
    document.head.appendChild(themeMeta);
  }
  themeMeta.setAttribute('content', themeColor);
`;

export const metadata: Metadata = {
  metadataBase,
  applicationName: 'NEXIFY TECH CENTER',
  title: 'NEXIFY TECH CENTER - White-Label Booking',
  description: 'Multi-tenant booking platform with AI CRO and upsell capabilities.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
    shortcut: ['/favicon.ico'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NEXIFY',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: themeColors.dark },
    { media: '(prefers-color-scheme: light)', color: themeColors.light },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <NotificationsProvider>
          <PwaRegister />
          <ThemeToggle />
          <CookieConsent />
          {children}
        </NotificationsProvider>
      </body>
    </html>
  );
}
