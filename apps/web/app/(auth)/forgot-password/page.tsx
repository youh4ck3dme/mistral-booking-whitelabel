'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { getClientAppUrl, getAppUrlWithPath, hasPublicSupabaseEnv } from '@repo/web/src/lib/app-url';
import { useNotifications } from '@repo/web/app/notifications-provider';
import type { FormEvent } from 'react';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [supabase] = useState(() => (hasPublicSupabaseEnv() ? createClientComponentClient() : null));
  const { notifyError, notifySuccess } = useNotifications();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Reset hesla teraz nie je dostupný. Chýba konfigurácia Supabase.');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== 'undefined'
            ? `${getClientAppUrl()}/reset-password`
            : getAppUrlWithPath('/reset-password'),
      });

      if (resetError) throw resetError;
      setSuccess(true);
      notifySuccess('Reset email odoslaný', 'Skontrolujte svoju emailovú schránku.');
    } catch (submitError: any) {
      const message = submitError.message || 'Nepodarilo sa odoslať email na resetovanie hesla';
      setError(message);
      notifyError('Reset hesla zlyhal', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="premium-stack" style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div className="premium-alert premium-alert--success">
          <h1 className="premium-card-title">Overovací email odoslaný</h1>
          <p>
            Skontrolujte svoju emailovú schránku a postupujte podľa inštrukcií na resetovanie hesla.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-stack" style={{ maxWidth: '560px', margin: '0 auto' }}>
      <section className="premium-hero">
        <div className="premium-hero-copy premium-stack">
          <span className="premium-eyebrow">Password recovery</span>
          <h1 className="premium-title premium-title--medium">Zabudli ste heslo?</h1>
          <p className="premium-lead">
            Zadajte svoju emailovú adresu a pošleme vám odkaz na resetovanie hesla.
          </p>
        </div>
      </section>

      {error && <div className="premium-alert premium-alert--error">{error}</div>}

      <form className="premium-card premium-form" onSubmit={handleSubmit}>
        <div className="premium-field">
          <label htmlFor="email" className="premium-label">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="premium-input"
            placeholder="vase@email.com"
          />
        </div>

        <button type="submit" disabled={isLoading} className="premium-button">
          {isLoading ? 'Odosielam...' : 'Resetovať heslo'}
        </button>
      </form>

      <div className="premium-card premium-card--tight premium-stack">
        <Link href="/login" className="premium-inline-link">
          Späť na prihlásenie
        </Link>
      </div>
    </div>
  );
}
