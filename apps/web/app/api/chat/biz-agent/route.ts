import { createAgentUIStreamResponse } from 'ai';
import { createBizAgent } from '@repo/ai';
import { createClient } from '@repo/web/src/utils/supabase/server';
import { getServerUser } from '@repo/web/src/lib/auth/server-user';
import { isPlatformAdmin } from '@repo/web/src/lib/auth/platform-admin';
import { checkRequestRateLimit } from '@repo/web/src/lib/security/rate-limit';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * BizAgent 4.0 API Route
 * 
 * Autonomous business agent for:
 * - Guest booking (frictionless, without password)
 * - Multi-channel support (web, whatsapp)
 * - Tenant isolation
 * - CRO upsell
 * 
 * Security:
 * - Rate limited
 * - Tenant membership required (or platform admin)
 * - Zod validated inputs
 */
export const maxDuration = 10; // Vercel Hobby hard execution limit safety

const chatMessageSchema = z
  .object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })
  .superRefine((msg, ctx) => {
    if (msg.role === 'user') {
      const trimmed = msg.content.trim();
      if (trimmed.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'User message cannot be empty',
          path: ['content'],
        });
      } else if (trimmed.length > 1000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'User message cannot exceed 1000 characters',
          path: ['content'],
        });
      }
    }
  });

const chatRequestSchema = z.object({
  tenantId: z.string().uuid('Invalid tenantId format'),
  messages: z.array(chatMessageSchema).min(1, 'At least one message is required'),
  channel: z.enum(['web', 'whatsapp']).optional().default('web'),
});

export async function POST(request: Request) {
  const rateLimitGuard = checkRequestRateLimit(request, 'chat');
  if (!rateLimitGuard.allowed) {
    return rateLimitGuard.response;
  }

  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { tenantId, messages, channel } = parsed.data;

  const supabase = createClient();

  const [tenantRes, servicesRes, membershipRes] = await Promise.all([
    supabase.from('tenants').select('id, name, slug').eq('id', tenantId).maybeSingle(),
    supabase
      .from('services')
      .select('id, name, duration, price')
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabase
      .from('tenant_users')
      .select('id, role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (tenantRes.error || !tenantRes.data) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const isMember = Boolean(membershipRes.data);
  const isPlatform = !isMember && (await isPlatformAdmin(user.id));

  if (!isMember && !isPlatform) {
    return NextResponse.json(
      { error: 'Forbidden: user is not a member of this tenant' },
      { status: 403 }
    );
  }

  const clampedMessages = messages.slice(-6).map((msg) => ({
    ...msg,
    content: msg.role === 'user' ? msg.content.trim() : msg.content,
  }));

  const agent = createBizAgent({
    tenantId,
    tenantName: tenantRes.data.name,
    channel,
    supabase,
    preloadedServices: servicesRes.data ?? [],
  });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: clampedMessages,
  });
}
