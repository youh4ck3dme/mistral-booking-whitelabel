'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LogoutPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut();
      router.push('/login');
    };

    logout();
  }, [supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-4">Odhlásenie...</p>
    </div>
  );
}
