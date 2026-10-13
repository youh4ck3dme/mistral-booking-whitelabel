import { ThemeProvider } from '@/components/theme-provider';
import { getAppUrl } from '@repo/web/src/lib/app-url';
import type { Metadata, Viewport } from 'next';
import CookieConsent from './cookie-consent';
import './globals.css';
import { NotificationsProvider } from './notifications-provider';
import PwaRegister from './pwa-register';

const metadataBase = new URL(getAppUrl());
const themeColors = {
  dark: '#04070c',
  light: '#fbfcfd',
} as const;

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NotificationsProvider>
            <PwaRegister />
            <CookieConsent />
            {children}
          </NotificationsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
