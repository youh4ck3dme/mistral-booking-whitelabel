import { supabase } from '@repo/supabase';
import { Tenant, TenantBranding } from '@repo/core';

export interface TenantContext {
  tenant: Tenant;
  branding: TenantBranding | null;
  userRole?: 'admin' | 'staff' | 'client' | null;
}

/**
 * Fetch tenant by slug from the database
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Fetch tenant branding by tenant ID
 */
export async function getTenantBranding(tenantId: string): Promise<TenantBranding | null> {
  const { data, error } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Get the current user's role in a specific tenant
 */
export async function getUserRoleInTenant(tenantId: string, userId: string): Promise<'admin' | 'staff' | 'client' | null> {
  const { data, error } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role as 'admin' | 'staff' | 'client';
}

/**
 * Get full tenant context (tenant + branding + user role)
 */
export async function getTenantContext(slug: string, userId?: string): Promise<TenantContext | null> {
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    return null;
  }

  const branding = await getTenantBranding(tenant.id);
  let userRole: 'admin' | 'staff' | 'client' | null = null;

  if (userId) {
    userRole = await getUserRoleInTenant(tenant.id, userId);
  }

  return {
    tenant,
    branding,
    userRole,
  };
}

/**
 * Validate if a user has access to a tenant
 */
export async function validateTenantAccess(tenantId: string, userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('tenant_users')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  if (error) {
    return false;
  }

  return (count || 0) > 0;
}
