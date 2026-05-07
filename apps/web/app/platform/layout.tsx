import { createServerClient } from '@repo/supabase';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // In production, check if user has platform admin role
  // For demo, we'll just check if user is logged in
  if (!session) {
    redirect('/login');
  }

  return (
    <html lang="sk">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
