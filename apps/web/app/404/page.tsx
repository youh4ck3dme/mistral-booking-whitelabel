import type { Metadata } from 'next';
import Link from 'next/link';

import styles from './page.module.css';

export const metadata: Metadata = {
  title: '404 | NEXIFY TECH CENTER',
  description: 'Page not found.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFoundPage() {
  return (
    <main className={styles.page}>
      <div className={styles.gridOverlay} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.shell}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoWord}>NEXIFY</span>
          <span className={styles.logoMark}>BOOKING</span>
        </Link>

        <div className={styles.card}>
          <span className={styles.eyebrow}>Error 404</span>
          <h1 className={styles.title}>This page is no longer on the booking map.</h1>
          <p className={styles.copy}>
            The link may be outdated, the tenant route may be invalid, or the page was moved.
            Return to the booking homepage and continue from an active tenant or service flow.
          </p>

          <div className={styles.actions}>
            <Link href="/" className={styles.primaryButton}>
              Go home
            </Link>
            <Link href="/demo-clinic/book" className={styles.secondaryButton}>
              Open booking
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
