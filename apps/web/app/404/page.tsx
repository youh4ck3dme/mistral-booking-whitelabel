'use client';

import Link from 'next/link';
import { Button } from '@repo/ui';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-extrabold text-gray-900">404</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Stránka neexistuje
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Stránku, ktorú hľadáte, sa nepodarilo nájsť.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => window.history.back()}>
            Späť
          </Button>
          <Button variant="secondary" onClick={() => (window.location.href = '/')}>
            Domov
          </Button>
        </div>
      </div>
    </div>
  );
}
