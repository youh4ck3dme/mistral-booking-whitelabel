import { getServerUser } from './server-user';

/**
 * Returns `{ user }` for a request with a verified user, or null.
 * Built on `getServerUser()`, so the result is validated by Supabase Auth.
 */
export async function getServerSession() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const user = await getServerUser();

  return user ? { user } : null;
}
