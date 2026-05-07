'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Extract token from URL
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const typeParam = searchParams.get('type');
    
    if (tokenParam && typeParam === 'recovery') {
      setToken(tokenParam);
    } else {
      router.push('/forgot-password');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Heslá sa nezhodujú');
      return;
    }

    if (!token) {
      setError('Neplatný token');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.exchangeCodeForSession(token);

      if (error) {
        throw error;
      }

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      
      // Redirect to login after a moment
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Nepodarilo sa resetovať heslo');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Heslo bolo resetované!
            </h2>
            <p className="mt-2 text-gray-600">
              Presmerujeme vás na prihlásenie...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Resetovať heslo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Zadajte nové heslo
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nové heslo
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="nové heslo"
                minLength={8}
              />
            </div>

            <div className="pt-4">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Potvrďte nové heslo
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="potvrďte nové heslo"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Resetujem...' : 'Resetovať heslo'}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600 mt-6">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Späť na prihlásenie
          </Link>
        </div>
      </div>
    </div>
  );
}
