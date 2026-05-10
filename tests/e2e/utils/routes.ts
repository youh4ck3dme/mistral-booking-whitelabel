export const tenantSlug = process.env.PLAYWRIGHT_TENANT_SLUG || 'demo-clinic';

export const routes = {
  home: '/',
  tenant: `/${tenantSlug}`,
  booking: `/${tenantSlug}/book`,
  portal: `/${tenantSlug}/portal`,
  admin: `/${tenantSlug}/admin`,
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password?type=recovery&token=mock-token',
  platform: '/platform',
  newTenant: '/platform/tenants/new',
};

export const credentials = {
  email: process.env.PLAYWRIGHT_EMAIL,
  password: process.env.PLAYWRIGHT_PASSWORD,
};

export const hasCredentials = Boolean(credentials.email && credentials.password);
