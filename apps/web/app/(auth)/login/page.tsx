'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@repo/ui';
import Link from 'next/link';

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check if we came from a specific tenant page
      const returnTo = sessionStorage.getItem('returnTo');
      if (returnTo) {
        sessionStorage.removeItem('returnTo');
        router.push(returnTo);
      } else {
        // Redirect to demo-clinic by default
        router.push('/demo-clinic');
      }
    } catch (err: any) {
      setError(err.message || 'Nepodarilo sa prihlásiť');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Nepodarilo sa prihlásiť cez Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Prihlásenie
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Prihláste sa do svojho účtu
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="vase@email.com"
                data-testid="email-input"
              />
            </div>

            <div className="pt-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Heslo
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="heslo"
                data-testid="password-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Zapamätať si ma
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Zabudli ste heslo?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              data-testid="login-button"
            >
              {isLoading ? 'Prihlásenie...' : 'Prihlásiť sa'}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                alebo
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="secondary"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-3.368 0-1.887-1.25-3.468-2.858-3.468-.806 0-1.427.337-1.886.723.095-.25.344-.713.734-1.237-2.592-.287-5.122-1.25-5.122-5.424 0-1.237.468-2.348 1.28-3.233.812-.885 1.923-1.528 3.263-1.528 1.214 0 2.348.625 2.91.144.086-.25.29-.433.578-.433.288 0 .51.18.51.483.01.21.008.44.008.906 0 1.406-1.08 2.744-2.677 3.312-.737.285-1.567.285-2.278 0-1.143-.713-1.948-1.948-1.948-3.368 0-2.744 2.16-5.185 5.688-5.185 3.85 0 6.838 2.91 6.838 6.837 0 4.17-2.717 7.38-6.53 7.38-3.548 0-6.328-2.37-8.71-6.22-8.71-4.29 0-7.632-3.803-7.632-8.688 0-1.26-.32-2.44-.98-3.54-.98-1.887 0-3.54.868-4.91 2.25-.98.99-1.58 2.24-1.58 3.59 0 2.71.86 5.21 2.25 7.08l-1.18 1.15c-.34.33-.53.77-.53 1.23 0 .52.22 1.01.58 1.39.36.38.79.64 1.27.64.61 0 1.19-.26 1.62-.73.3-.34.48-.76.48-1.21 0-.54-.24-1.03-.68-1.41l-1.49-1.46c-.22-.22-.35-.49-.35-.78 0-.41.22-.78.53-.99.31-.21.68-.32 1.08-.32.56 0 1.09.21 1.51.58.69.64 1.07 1.48 1.07 2.41 0 .75-.21 1.44-.58 2.02-.37.58-.96 1.01-1.73 1.01-1.05 0-1.96-.46-2.72-1.28-1.31-1.31-2.98-2.19-4.92-2.19-1.12 0-2.18.38-3.11 1.04-.93.66-1.61 1.48-2.02 2.41-.41.93-.58 1.96-.58 3.05 0 2.35 1.41 4.32 3.46 4.32 2.05 0 3.96-1.01 5.51-2.61 5.51-1.25 0-2.35-.82-3.22-2.11-1.61-2.27-3.67-3.27-5.98-3.27-1.41 0-2.72-.46-3.85-1.28-1.13-.82-1.89-1.98-2.28-3.36-.39-1.38-.39-2.87 0-4.25.39-1.38 1.18-2.62 2.28-3.62 1.41-1.28 3.14-1.97 5.05-1.97 1.64 0 3.16.41 4.48 1.11.69.37 1.25.87 1.68 1.48.43.61.72 1.29.88 2.01.16.72.16 1.49 0 2.21-.32 1.05-.76 1.94-1.31.88-2.55 1.41-3.98 1.41-2.43 0-4.6-.91-6.44-2.51-1.84-1.6-3.11-3.62-3.76-5.83-.65-2.22-.65-4.55 0-6.83.65-2.28 1.95-4.33 3.76-5.83 1.81-1.5 3.98-2.43 6.44-2.43 1.63 0 3.14.32 4.48.88 1.34.56 2.55 1.41 3.58 2.55.1.03.11 1.98.48 2.82.98.84.5 1.56 1.14 2.16 1.91.6.77 1.08 1.68 1.41 2.72.33 1.05.56 1.88.56 2.82 0 1.05-.21 2.02-.58 2.89-.37.87-.96 1.61-1.73 2.16-.77.55-1.69.88-2.61.88-1.73 0-3.35-1.01-4.69-2.51-1.34-1.5-2.18-3.36-2.18-5.39 0-3.23 2.11-5.98 5.27-5.98 2.43 0 4.55 1.31 6.16 3.46 1.61 2.15 2.61 4.55 2.61 6.96 0 1.41-.21 2.74-.62 3.98-.41 1.23-.98 2.35-1.71 3.31-.73.96-1.65 1.78-2.71 2.41-1.06.63-2.25 1.01-3.51 1.01-1.26 0-2.44-.38-3.51-1.04-1.07-.66-1.96-1.48-2.71-2.41-.75-.93-1.25-2.02-1.25-3.23 0-1.61.61-3.05 1.61-4.18.99-1.13 2.34-1.91 3.85-1.91 1.51.01 2.96.66 4.25 1.61.5.33 1.07.58 1.68.73.61.15 1.25.15 1.88 0 .63-.15 1.22-.44 1.75-.29.53-.72 1.01-1.25 1.34-.53.33-1.15.5-1.78.5-1.26 0-2.44-.62-3.51-1.71-1.07-1.09-1.96-2.34-2.61-3.36-.65-.99-1.07-2.11-1.25-3.31-.18-1.2-.58-2.34-.11-3.41.47-1.07 1.25-1.99 2.28-2.69.99-.67 2.15-1.11 3.41-1.11 1.08 0 2.12.25 3.05.68.93.43 1.72 1.01 2.36 1.72.64.71 1.07 1.56 1.28 2.51.21.93.11 1.92.11 2.94 0 .88-.29 1.71-.82 2.43-.53.72-1.25 1.25-2.08 1.58-.83.33-1.76.41-2.69.21-.93-.2-1.82-.61-2.62-1.22-.8-.61-1.41-1.41-1.82-2.35-.41-.94-.58-1.98-.58-3.05 0-2.43 1.41-4.55 3.46-4.55 1.01 0 1.96.38 2.78 1.04.82.66 1.48 1.48 1.96 2.41.48.93 1.13 1.71 1.96 2.34.83.63 1.82 1.11 2.88 1.41 1.06.3 1.99.73 2.78 1.31.79.58 1.41 1.28 1.88 2.01.47.73.79 1.51.96 2.31.17.8.39 1.63.59 2.48.19.85.42 1.75.58 2.68z" />
                Prihlásiť sa cez Google
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 mt-6">
          Nemáte ešte účet?{' '}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Registrujte sa
          </Link>
        </div>
      </div>
    </div>
  );
}
