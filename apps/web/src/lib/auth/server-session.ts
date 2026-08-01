import { createClient } from '@repo/web/src/utils/supabase/server';

import type { Database } from '@repo/supabase';

export async function getServerSession() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}
