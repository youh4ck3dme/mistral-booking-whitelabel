import type { TenantContext } from './tenant.service';
import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';

export async function getServerTenantContext(
  slug: string,
  userId?: string
): Promise<TenantContext | null> {
  const supabase = createServiceRoleClient();

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (tenantError || !tenant) {
    return null;
  }

  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  let userRole: TenantContext['userRole'] = null;

  if (userId) {
    const { data: membership } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', userId)
      .maybeSingle();

    userRole = membership?.role ?? null;
  }

  return {
    tenant,
    branding: branding ?? null,
    userRole,
  };
}
