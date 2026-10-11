import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getServerTenantContext: vi.fn(),
}));

vi.mock('@repo/web/src/lib/auth/server-session', () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock('@repo/web/src/lib/tenant/server-tenant-context', () => ({
  getServerTenantContext: mocks.getServerTenantContext,
}));

// Next's redirect() throws; surface the target so the test can assert on it.
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock('next/link', () => ({ default: () => null }));

import AdminLayout from '../../../app/[tenantSlug]/admin/layout';

const tenantContext = (userRole: string | null) => ({
  tenant: { id: 't1', name: 'Demo', slug: 'demo' },
  branding: null,
  userRole,
});

const render = () => AdminLayout({ children: null, params: { tenantSlug: 'demo' } });

describe('tenant admin layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects anonymous visitors to login before rendering', async () => {
    mocks.getServerSession.mockResolvedValue(null);
    mocks.getServerTenantContext.mockResolvedValue(tenantContext(null));

    await expect(render()).rejects.toThrow('REDIRECT:/login');
  });

  it('does not reveal the admin area to clients', async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: 'u1' } });
    mocks.getServerTenantContext.mockResolvedValue(tenantContext('client'));

    await expect(render()).rejects.toThrow('REDIRECT:/404');
  });

  it('renders for tenant admins', async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: 'u1' } });
    mocks.getServerTenantContext.mockResolvedValue(tenantContext('admin'));

    await expect(render()).resolves.toBeTruthy();
  });
});
