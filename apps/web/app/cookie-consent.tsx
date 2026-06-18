'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'nexify-cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable — don't show banner
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch { /* ignore */ }
    setVisible(false);
  };

  const decline = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'declined');
    } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
      className="cookie-banner"
    >
      <div className="cookie-banner__inner">
        <div className="cookie-banner__copy">
          <strong>🍪 Táto stránka používa cookies</strong>
          <p>
            Používame nevyhnutné cookies pre autentifikáciu a zabezpečenie funkčnosti.{' '}
            <Link href="/privacy" className="cookie-banner__link">
              Zistiť viac
            </Link>
          </p>
        </div>
        <div className="cookie-banner__actions">
          <button
            type="button"
            onClick={decline}
            className="cookie-banner__btn cookie-banner__btn--secondary"
          >
            Odmietnuť
          </button>
          <button
            type="button"
            onClick={accept}
            className="cookie-banner__btn cookie-banner__btn--primary"
          >
            Prijať
          </button>
        </div>
      </div>
    </div>
  );
}
