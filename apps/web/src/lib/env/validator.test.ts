import { describe, expect, it } from 'vitest';
import { EnvValidationError, requireEnv, validateEnv } from './validator';

describe('Environment Validator (OPS-3)', () => {
  const validDevEnv: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-1234567890-abcdef',
    NODE_ENV: 'development',
  };

  const validProdEnv: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://real-prod.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'prod-anon-key-1234567890-abcdef',
    SUPABASE_SERVICE_ROLE_KEY: 'prod-service-role-key-1234567890',
    NOTIFICATION_CRON_SECRET: 'super-secret-cron-token',
    NEXIFY_API_KEY: 'nex_live_prod_key_123456',
    NODE_ENV: 'production',
  };

  it('validates a valid development environment', () => {
    const result = validateEnv(validDevEnv, { isProduction: false });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates a complete production environment', () => {
    const result = validateEnv(validProdEnv, { isProduction: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('detects missing NEXT_PUBLIC_SUPABASE_URL', () => {
    const env = { ...validDevEnv, NEXT_PUBLIC_SUPABASE_URL: undefined };
    const result = validateEnv(env, { isProduction: false });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('NEXT_PUBLIC_SUPABASE_URL'))).toBe(true);
  });

  it('detects invalid NEXT_PUBLIC_SUPABASE_URL format', () => {
    const env = { ...validDevEnv, NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' };
    const result = validateEnv(env, { isProduction: false });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('valid URL'))).toBe(true);
  });

  it('detects placeholder supabase url in production', () => {
    const env = {
      ...validProdEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.invalid',
    };
    const result = validateEnv(env, { isProduction: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('placeholder in production'))).toBe(true);
  });

  it('flags missing SUPABASE_SERVICE_ROLE_KEY in production server environment', () => {
    const env = { ...validProdEnv, SUPABASE_SERVICE_ROLE_KEY: undefined };
    const result = validateEnv(env, { isProduction: true, isServer: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('SUPABASE_SERVICE_ROLE_KEY is required in production'))).toBe(true);
  });

  it('flags invalid NEXIFY_API_KEY prefix', () => {
    const env = { ...validProdEnv, NEXIFY_API_KEY: 'sk_test_invalid_prefix' };
    const result = validateEnv(env, { isProduction: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('nex_live_'))).toBe(true);
  });

  it('throws EnvValidationError when throwOnError is true on invalid env', () => {
    const env = { NEXT_PUBLIC_SUPABASE_URL: 'invalid' };
    expect(() => validateEnv(env, { throwOnError: true })).toThrow(EnvValidationError);
  });

  it('requireEnv returns valid value and throws on missing key', () => {
    const env = { TEST_VAR: 'hello-world' };
    expect(requireEnv('TEST_VAR', env)).toBe('hello-world');
    expect(() => requireEnv('MISSING_VAR', env)).toThrow('Missing required environment variable: MISSING_VAR');
  });
});
