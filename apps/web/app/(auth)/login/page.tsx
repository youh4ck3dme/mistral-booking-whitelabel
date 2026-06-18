'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { storeFlashToast } from '@repo/web/src/lib/notifications/client';
import { getClientAppUrl, hasPublicSupabaseEnv } from '@repo/web/src/lib/app-url';
import { useNotifications } from '@repo/web/app/notifications-provider';
import type { FormEvent } from 'react';
import { useState } from 'react';

export default function LoginPage() {
  const [supabase] = useState(() => (hasPublicSupabaseEnv() ? createClientComponentClient() : null));
  const router = useRouter();
  const { notifyError } = useNotifications();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Prihlásenie teraz nie je dostupné. Chýba konfigurácia Supabase.');
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;

      const returnTo = typeof window !== 'undefined' ? sessionStorage.getItem('returnTo') : null;
      if (returnTo) {
        storeFlashToast({
          title: 'Prihlásenie úspešné',
          description: 'Pokračujeme späť do vašej rezervácie alebo portálu.',
          variant: 'success',
        });
        sessionStorage.removeItem('returnTo');
        router.push(returnTo);
      } else {
        storeFlashToast({
          title: 'Vitajte späť',
          description: 'Účet je pripravený a môžete pokračovať v booking flow.',
          variant: 'success',
        });
        router.push('/demo-clinic');
      }
    } catch (loginError: any) {
      const message = loginError.message || 'Nepodarilo sa prihlásiť';
      setError(message);
      notifyError('Prihlásenie zlyhalo', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Google prihlásenie teraz nie je dostupné. Chýba konfigurácia Supabase.');
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getClientAppUrl(),
        },
      });

      if (oauthError) throw oauthError;
    } catch (oauthLoginError: any) {
      const message = oauthLoginError.message || 'Nepodarilo sa prihlásiť cez Google';
      setError(message);
      notifyError('Google prihlásenie zlyhalo', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="premium-stack" style={{ maxWidth: '560px', margin: '0 auto' }}>
      <section className="premium-hero">
        <div className="premium-hero-copy premium-stack">
          <span className="premium-eyebrow">Account access</span>
          <h1 className="premium-title premium-title--medium">Prihlásenie</h1>
          <p className="premium-lead">
            Prihláste sa do svojho účtu a pokračujte späť do booking flow alebo tenant portálu.
          </p>
        </div>
      </section>

      {error && <div className="premium-alert premium-alert--error">{error}</div>}

      <form className="premium-card premium-form" onSubmit={handleLogin}>
        <div className="premium-field">
          <label htmlFor="email" className="premium-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="premium-input"
            placeholder="vase@email.com"
            data-testid="email-input"
          />
        </div>

        <div className="premium-field">
          <label htmlFor="password" className="premium-label">Heslo</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="premium-input"
            placeholder="heslo"
            data-testid="password-input"
          />
        </div>

        <div className="premium-toolbar">
          <label className="premium-checkbox-row">
            <input id="remember-me" name="remember-me" type="checkbox" className="premium-checkbox" />
            <span className="premium-copy">Zapamätať si ma</span>
          </label>
          <Link href="/forgot-password" className="premium-inline-link">
            Zabudli ste heslo?
          </Link>
        </div>

        <button type="submit" disabled={isLoading} className="premium-button" data-testid="login-button">
          {isLoading ? 'Prihlásenie...' : 'Prihlásiť sa'}
        </button>

        <div className="premium-card premium-card--tight premium-stack">
          <span className="premium-helper">alebo</span>
          <button
            type="button"
            className="premium-button-secondary"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <span>G</span>
            <span>Prihlásiť sa cez Google</span>
          </button>
        </div>
      </form>

      <div className="premium-card premium-card--tight premium-stack">
        <span className="premium-copy">
          Nemáte ešte účet?{' '}
          <Link href="/signup" className="premium-inline-link">
            Registrujte sa
          </Link>
        </span>
      </div>
    </div>
  );
}
