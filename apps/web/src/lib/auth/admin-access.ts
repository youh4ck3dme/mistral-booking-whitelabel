/**
 * Server-side access rule for tenant admin pages (`/[tenantSlug]/admin/**`).
 *
 * Only the tenant's `admin` role may render the admin area. The client-side
 * check in `admin/page.tsx` stays as a second line of defence.
 */
export type TenantAdminAccess =
  | { allowed: true }
  | { allowed: false; redirectTo: '/login' | '/404' };

export function resolveTenantAdminAccess(input: {
  hasSession: boolean;
  userRole: string | null | undefined;
}): TenantAdminAccess {
  if (!input.hasSession) {
    return { allowed: false, redirectTo: '/login' };
  }

  if (input.userRole !== 'admin') {
    // Signed in, but not an admin of this tenant. Answer like a missing page,
    // so the admin area is not revealed to other users.
    return { allowed: false, redirectTo: '/404' };
  }

  return { allowed: true };
}
