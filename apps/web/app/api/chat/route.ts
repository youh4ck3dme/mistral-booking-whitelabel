import { createAgentUIStreamResponse } from 'ai';
import { createBookingAssistant } from '@repo/ai';
import { createClient } from '@repo/web/src/utils/supabase/server';
import { getServerUser } from '@repo/web/src/lib/auth/server-user';
import { isPlatformAdmin } from '@repo/web/src/lib/auth/platform-admin';
import { checkRequestRateLimit } from '@repo/web/src/lib/security/rate-limit';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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

  const { tenantId, messages } = parsed.data;

  const supabase = createClient();

  // 1. Check if tenant exists
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('id', tenantId)
    .maybeSingle();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // 2. Check if user is a member of this tenant (or platform admin)
  const { data: membership } = await supabase
    .from('tenant_users')
    .select('id, role')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .maybeSingle();

  const isMember = Boolean(membership);
  const isPlatform = !isMember && (await isPlatformAdmin(user.id));

  if (!isMember && !isPlatform) {
    return NextResponse.json(
      { error: 'Forbidden: user is not a member of this tenant' },
      { status: 403 }
    );
  }

  // 3. Input sanitization & token clamping (limit history to last 6 messages)
  const clampedMessages = messages.slice(-6).map((msg) => ({
    ...msg,
    content: msg.role === 'user' ? msg.content.trim() : msg.content,
  }));

  const agent = createBookingAssistant({ tenantId, supabase });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: clampedMessages,
  });
}
