import { z } from 'zod';

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: Record<string, unknown>;
}

export class EnvValidationError extends Error {
  public readonly errors: string[];
  public readonly warnings: string[];

  constructor(errors: string[], warnings: string[] = []) {
    const summary = [
      '❌ [ENV VALIDATION ERROR] Startup environment variable check failed:',
      ...errors.map((err) => `  - ${err}`),
      warnings.length > 0 ? '\n⚠️ Warnings:' : '',
      ...warnings.map((warn) => `  - ${warn}`),
    ]
      .filter(Boolean)
      .join('\n');

    super(summary);
    this.name = 'EnvValidationError';
    this.errors = errors;
    this.warnings = warnings;
  }
}

/**
 * Zod schema defining the environment configuration for Mistral White-Label Booking SaaS.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ message: 'NEXT_PUBLIC_SUPABASE_URL is required.' })
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL.'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required.' })
    .min(10, 'NEXT_PUBLIC_SUPABASE_ANON_KEY appears too short or invalid.'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'test', 'staging', 'production']).optional(),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, 'SUPABASE_SERVICE_ROLE_KEY is required for server operations.').optional(),
  NOTIFICATION_CRON_SECRET: z.string().min(8, 'NOTIFICATION_CRON_SECRET should have at least 8 characters.').optional(),
  NOTIFICATION_FROM_EMAIL: z.string().email().optional(),
  NOTIFICATION_REPLY_TO_EMAIL: z.string().email().optional(),
  RESEND_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  NEXIFY_API_KEY: z.string().refine((k) => !k || k.startsWith('nex_live_'), {
    message: "NEXIFY_API_KEY must start with 'nex_live_' prefix.",
  }).optional(),
  NEXIFY_DEFAULT_TENANT_SLUG: z.string().optional(),
  RATE_LIMIT_CHAT_MAX: z.coerce.number().positive().optional(),
  RATE_LIMIT_CHAT_WINDOW_MS: z.coerce.number().positive().optional(),
  RATE_LIMIT_NOTIFICATIONS_MAX: z.coerce.number().positive().optional(),
  RATE_LIMIT_NOTIFICATIONS_WINDOW_MS: z.coerce.number().positive().optional(),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().positive().optional(),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().positive().optional(),
});

/**
 * Validates the runtime environment against requirements.
 * When isProduction is true, enforces strict checks (no placeholders, service role key required).
 */
export function validateEnv(
  sourceEnv: Record<string, string | undefined> = process.env,
  options: { isProduction?: boolean; throwOnError?: boolean; isServer?: boolean } = {}
): EnvValidationResult {
  const {
    isProduction = sourceEnv.NODE_ENV === 'production',
    throwOnError = false,
    isServer = typeof window === 'undefined',
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  const parsedValues: Record<string, unknown> = {};

  // 1. Client env check
  const clientResult = clientEnvSchema.safeParse(sourceEnv);
  if (!clientResult.success) {
    for (const issue of clientResult.error.issues) {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    }
  } else {
    Object.assign(parsedValues, clientResult.data);
  }

  // Check for placeholder URL in production
  const supabaseUrl = sourceEnv.NEXT_PUBLIC_SUPABASE_URL;
  if (isProduction && supabaseUrl && (supabaseUrl.includes('placeholder') || supabaseUrl.includes('invalid'))) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL cannot use build-time placeholder in production.');
  }

  // 2. Server env check
  if (isServer) {
    const serverResult = serverEnvSchema.safeParse(sourceEnv);
    if (!serverResult.success) {
      for (const issue of serverResult.error.issues) {
        errors.push(`${issue.path.join('.')}: ${issue.message}`);
      }
    } else {
      Object.assign(parsedValues, serverResult.data);
    }

    // In production server environment, service role key is mandatory
    if (isProduction && !sourceEnv.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production server environment.');
    }

    // Warnings for optional integrations
    if (isProduction && !sourceEnv.NOTIFICATION_CRON_SECRET) {
      warnings.push('NOTIFICATION_CRON_SECRET is not configured; scheduled reminders endpoint will be open or fail.');
    }

    if (isProduction && !sourceEnv.NEXIFY_API_KEY) {
      warnings.push('NEXIFY_API_KEY is not configured; AutoOps AI connector API v1 will fall back to default master test key.');
    }
  }

  const valid = errors.length === 0;

  if (!valid && throwOnError) {
    throw new EnvValidationError(errors, warnings);
  }

  return {
    valid,
    errors,
    warnings,
    values: parsedValues,
  };
}

/**
 * Helper to ensure a required server-side environment variable is present.
 */
export function requireEnv(key: string, sourceEnv: Record<string, string | undefined> = process.env): string {
  const value = sourceEnv[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
