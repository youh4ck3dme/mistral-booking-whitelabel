import { createServerClient } from '@repo/supabase';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If user is already logged in, redirect to demo-clinic
  if (session) {
    redirect('/demo-clinic');
  }

  return (
    <html lang="sk">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
