import { createAgentUIStreamResponse } from 'ai';
import { createBookingAssistant } from '@repo/ai';
import { createClient } from '@repo/web/src/utils/supabase/server';
import { getServerUser } from '@repo/web/src/lib/auth/server-user';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  const body = await request.json();
  const { messages, tenantId } = body as { messages: unknown[]; tenantId?: string };

  if (typeof tenantId !== 'string' || !tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  const agent = createBookingAssistant({ tenantId, supabase });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
  });
}
