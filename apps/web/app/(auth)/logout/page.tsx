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
