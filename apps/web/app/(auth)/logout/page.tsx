'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { hasPublicSupabaseEnv } from '@repo/web/src/lib/app-url';
import { useEffect, useState } from 'react';

export default function LogoutPage() {
  const [supabase] = useState(() => (hasPublicSupabaseEnv() ? createClientComponentClient() : null));
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      if (supabase) {
        await supabase.auth.signOut();
      }
      router.push('/login');
    };

    logout();
  }, [router, supabase]);

  return (
    <div className="premium-stack" style={{ maxWidth: '560px', margin: '0 auto' }}>
      <div className="premium-card premium-stack">
        <div className="premium-inline-actions">
          <div className="premium-spinner" />
          <span className="premium-copy">Odhlásenie…</span>
        </div>
      </div>
    </div>
  );
}
