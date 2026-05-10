import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';
import { getServerSession } from '@repo/web/src/lib/auth/server-session';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // If user is already logged in, redirect to demo-clinic
  if (session) {
    redirect('/demo-clinic');
  }

  return (
    <div className="premium-page">
      <header className="premium-header">
        <div className="premium-container">
          <div className="premium-nav-shell">
            <Link href="/" className="premium-brand">
              <span className="premium-brand-word">NEXIFY</span>
              <span className="premium-brand-mark">Access</span>
            </Link>
            <nav className="premium-nav" aria-label="Auth navigation">
              <Link href="/" className="premium-nav-link">
                Home
              </Link>
              <Link href="/login" className="premium-nav-link">
                Login
              </Link>
              <Link href="/signup" className="premium-nav-link">
                Signup
              </Link>
            </nav>
            <div className="premium-nav-actions">
              <Link href="/" className="premium-button-secondary">
                Back home
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
