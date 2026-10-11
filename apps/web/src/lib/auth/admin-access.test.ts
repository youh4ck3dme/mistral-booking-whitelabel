import { describe, expect, it } from 'vitest';

import { resolveTenantAdminAccess } from './admin-access';

describe('resolveTenantAdminAccess', () => {
  it('sends anonymous visitors to login', () => {
    expect(resolveTenantAdminAccess({ hasSession: false, userRole: null })).toEqual({
      allowed: false,
      redirectTo: '/login',
    });
  });

  it('does not trust a role without a session', () => {
    expect(resolveTenantAdminAccess({ hasSession: false, userRole: 'admin' })).toEqual({
      allowed: false,
      redirectTo: '/login',
    });
  });

  it('hides the admin area from signed-in users who are not tenant members', () => {
    expect(resolveTenantAdminAccess({ hasSession: true, userRole: null })).toEqual({
      allowed: false,
      redirectTo: '/404',
    });
  });

  it('hides the admin area from clients', () => {
    expect(resolveTenantAdminAccess({ hasSession: true, userRole: 'client' })).toEqual({
      allowed: false,
      redirectTo: '/404',
    });
  });

  it('hides the admin area from staff, matching the admin dashboard check', () => {
    expect(resolveTenantAdminAccess({ hasSession: true, userRole: 'staff' })).toEqual({
      allowed: false,
      redirectTo: '/404',
    });
  });

  it('allows tenant admins', () => {
    expect(resolveTenantAdminAccess({ hasSession: true, userRole: 'admin' })).toEqual({ allowed: true });
  });
});
