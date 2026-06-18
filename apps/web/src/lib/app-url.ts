const DEFAULT_PRODUCTION_APP_URL = 'https://mistral-booking-whitelabel.vercel.app';

function normalizeUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;
}

export function getAppUrl() {
  return (
    normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeUrl(process.env.VERCEL_URL) ??
    DEFAULT_PRODUCTION_APP_URL
  );
}

export function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getAppUrlWithPath(path = '') {
  return new URL(path, getAppUrl()).toString();
}

export function getClientAppUrl() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return getAppUrl();
}
