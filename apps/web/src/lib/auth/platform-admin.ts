import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';

/**
 * Checks whether the given user ID is listed in the platform_admins table.
 * Uses the service-role client so the query bypasses RLS — this table is
 * intentionally not readable by the anon or authenticated Supabase roles.
 *
 * Must only be called from Server Components, Route Handlers, or middleware
 * — never from client components.
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const supabase = createServiceRoleClient({ requireServiceRole: true });

    const { data, error } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[platform-admin] lookup error:', error.message);
      return false;
    }

    return data !== null;
  } catch {
    return false;
  }
}
