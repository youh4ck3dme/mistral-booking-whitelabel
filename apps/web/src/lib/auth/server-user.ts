import { createClient } from '@repo/web/src/utils/supabase/server';

/**
 * Returns the authenticated user for the current request, or null.
 *
 * Uses `auth.getUser()`, which validates the JWT with the Supabase Auth server.
 * Do not replace it with `auth.getSession()`: that only reads the cookie and
 * does not verify it, so a stale or forged session would be trusted.
 */
export async function getServerUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
