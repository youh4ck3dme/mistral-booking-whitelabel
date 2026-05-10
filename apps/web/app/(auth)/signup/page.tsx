'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { storeFlashToast } from '@repo/web/src/lib/notifications/client';
import { useNotifications } from '@repo/web/app/notifications-provider';
import type { FormEvent } from 'react';
import { useState } from 'react';

export default function SignupPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { notifyError, notifySuccess } = useNotifications();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError('Heslá sa nezhodujú');
      notifyError('Registrácia zlyhala', 'Heslá sa nezhodujú.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        },
      });

      if (signupError) throw signupError;

      setSuccess(true);
      notifySuccess('Registrácia úspešná', 'Overovací email je na ceste do vašej schránky.');
      storeFlashToast({
        title: 'Účet je pripravený',
        description: 'Po overení emailu sa môžete prihlásiť a pokračovať v booking flow.',
        variant: 'success',
      });
      setTimeout(() => router.push('/login'), 3000);
    } catch (signupError: any) {
      const message = signupError.message || 'Nepodarilo sa zaregistrovať';
      setError(message);
      notifyError('Registrácia zlyhala', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="premium-stack" style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div className="premium-alert premium-alert--success">
          <h1 className="premium-card-title">Registrácia úspešná!</h1>
          <p>Overovací email bol odoslaný na vašu adresu. Presmerujeme vás na prihlásenie…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-stack" style={{ maxWidth: '560px', margin: '0 auto' }}>
      <section className="premium-hero">
        <div className="premium-hero-copy premium-stack">
          <span className="premium-eyebrow">Create account</span>
          <h1 className="premium-title premium-title--medium">Registrácia</h1>
          <p className="premium-lead">Vytvorte si nový účet pre tenant booking a klientský portál.</p>
        </div>
      </section>

      {error && <div className="premium-alert premium-alert--error">{error}</div>}

      <form className="premium-card premium-form" onSubmit={handleSignup}>
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

        <div className="premium-field">
          <label htmlFor="password" className="premium-label">Heslo</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="premium-input"
            placeholder="heslo"
            minLength={8}
          />
        </div>

        <div className="premium-field">
          <label htmlFor="confirm-password" className="premium-label">Potvrďte heslo</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="premium-input"
            placeholder="potvrďte heslo"
          />
        </div>

        <label className="premium-checkbox-row">
          <input id="terms" name="terms" type="checkbox" className="premium-checkbox" required />
          <span className="premium-copy">
            Súhlasím s{' '}
            <Link href="/terms" className="premium-inline-link">
              podmienkami
            </Link>
          </span>
        </label>

        <button type="submit" disabled={isLoading} className="premium-button">
          {isLoading ? 'Registrácia...' : 'Zaregistrovať sa'}
        </button>

        <button
          type="button"
          className="premium-button-secondary"
          onClick={() => router.push('/login')}
        >
          Prihlásiť sa
        </button>
      </form>

      <div className="premium-card premium-card--tight premium-stack">
        <span className="premium-copy">
          Už máte účet?{' '}
          <Link href="/login" className="premium-inline-link">
            Prihláste sa
          </Link>
        </span>
      </div>
    </div>
  );
}
