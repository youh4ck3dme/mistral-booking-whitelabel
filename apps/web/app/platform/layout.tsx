import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';
import { getServerSession } from '@repo/web/src/lib/auth/server-session';
import { isPlatformAdmin } from '@repo/web/src/lib/auth/platform-admin';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/login');
  }

  // Double-check: middleware already guards /platform, but the layout
  // re-validates so that direct server renders (e.g. Next.js prerendering)
  // never leak content to non-platform-admins.
  const adminAccess = await isPlatformAdmin(session.user.id);
  if (!adminAccess) {
    redirect('/404');
  }

  return (
    <div className="premium-page">
      <header className="premium-header">
        <div className="premium-container">
          <div className="premium-nav-shell">
            <Link href="/platform" className="premium-brand">
              <span className="premium-brand-word">NEXIFY</span>
              <span className="premium-brand-mark">Platform</span>
            </Link>
            <nav className="premium-nav" aria-label="Platform navigation">
              <Link href="/platform" className="premium-nav-link">
                Dashboard
              </Link>
              <Link href="/platform/tenants/new" className="premium-nav-link">
                New tenant
              </Link>
            </nav>
            <div className="premium-nav-actions">
              <Link href="/" className="premium-button-secondary">
                Homepage
              </Link>
              <Link href="/logout" className="premium-button">
                Sign out
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="premium-main">
        <div className="premium-container">{children}</div>
      </main>
    </div>
  );
}
