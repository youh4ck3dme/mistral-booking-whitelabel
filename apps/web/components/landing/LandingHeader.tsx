'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Piliere & Funkcie', href: '#features' },
    { label: 'Spoľahlivosť', href: '#reliability' },
    { label: 'Cenník', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 pt-4 pb-2">
      <div className="premium-container">
        <div className="premium-nav-shell">
          {/* Brand Logo matching Auth & App */}
          <Link href="/" className="premium-brand">
            <span className="premium-brand-word">NEXIFY</span>
            <span className="premium-brand-mark">Booking</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex premium-nav" aria-label="Landing navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="premium-nav-link text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden sm:flex premium-nav-actions items-center gap-3">
            <Link
              href="/login"
              className="premium-nav-link text-sm font-semibold"
            >
              Prihlásenie
            </Link>
            <Link
              href="/signup"
              className="premium-button text-sm"
            >
              Vyskúšať zadarmo
            </Link>
            <ThemeToggle />
          </div>

          {/* Mobile menu button & ThemeToggle */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Otvoriť navigáciu"
              className="p-2 rounded-full border border-white/10 text-zinc-300 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-2 p-5 rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl space-y-4">
            <nav className="flex flex-col space-y-2 text-sm font-medium">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full text-xs font-semibold premium-button-secondary"
              >
                Prihlásenie
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full text-xs font-semibold premium-button"
              >
                Vyskúšať zadarmo
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
