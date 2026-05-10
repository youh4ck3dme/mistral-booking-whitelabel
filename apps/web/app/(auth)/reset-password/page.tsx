'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { storeFlashToast } from '@repo/web/src/lib/notifications/client';
import { useNotifications } from '@repo/web/app/notifications-provider';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notifyError, notifySuccess } = useNotifications();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const typeParam = searchParams.get('type');

    if (tokenParam && typeParam === 'recovery') {
      setToken(tokenParam);
    } else {
      router.push('/forgot-password');
    }
  }, [router, searchParams]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError('Heslá sa nezhodujú');
      notifyError('Reset hesla zlyhal', 'Heslá sa nezhodujú.');
      return;
    }

    if (!token) {
      setError('Neplatný token');
      notifyError('Reset hesla zlyhal', 'Neplatný alebo expirovaný token.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(token);
      if (exchangeError) throw exchangeError;

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);
      notifySuccess('Heslo bolo aktualizované', 'Presmerujeme vás späť na prihlásenie.');
      storeFlashToast({
        title: 'Heslo je zmenené',
        description: 'Prihláste sa novým heslom a pokračujte do aplikácie.',
        variant: 'success',
      });
      setTimeout(() => router.push('/login'), 3000);
    } catch (resetError: any) {
      const message = resetError.message || 'Nepodarilo sa resetovať heslo';
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
          <h1 className="premium-card-title">Heslo bolo resetované!</h1>
          <p>Presmerujeme vás na prihlásenie…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-stack" style={{ maxWidth: '560px', margin: '0 auto' }}>
      <section className="premium-hero">
        <div className="premium-hero-copy premium-stack">
          <span className="premium-eyebrow">Reset password</span>
          <h1 className="premium-title premium-title--medium">Resetovať heslo</h1>
          <p className="premium-lead">Zadajte nové heslo a potvrďte aktualizáciu účtu.</p>
        </div>
      </section>

      {error && <div className="premium-alert premium-alert--error">{error}</div>}

      <form className="premium-card premium-form" onSubmit={handleSubmit}>
        <div className="premium-field">
          <label htmlFor="password" className="premium-label">Nové heslo</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="premium-input"
            placeholder="nové heslo"
            minLength={8}
          />
        </div>

        <div className="premium-field">
          <label htmlFor="confirm-password" className="premium-label">Potvrďte nové heslo</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="premium-input"
            placeholder="potvrďte nové heslo"
          />
        </div>

        <button type="submit" disabled={isLoading} className="premium-button">
          {isLoading ? 'Resetujem...' : 'Resetovať heslo'}
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
