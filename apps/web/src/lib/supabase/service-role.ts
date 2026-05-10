import { createClient } from '@supabase/supabase-js';

import type { Database } from '@repo/supabase';

export function createServiceRoleClient({ requireServiceRole = false }: { requireServiceRole?: boolean } = {}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for server-side Supabase access.');
  }

  if (requireServiceRole && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side notification access.');
  }

  if (!serviceRoleKey) {
    throw new Error('A Supabase API key is required for server-side Supabase access.');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
