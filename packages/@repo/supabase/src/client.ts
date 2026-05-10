import { createClient } from '@supabase/supabase-js';
import { Database } from './types/database';

const buildTimeSupabaseUrl = 'https://supabase.invalid';
const buildTimeSupabaseAnonKey = 'build-time-placeholder-key';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? buildTimeSupabaseUrl;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? buildTimeSupabaseAnonKey;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export function createServerClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createBrowserClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
