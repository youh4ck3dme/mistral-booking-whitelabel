import { createAgentUIStreamResponse } from 'ai';
import { createBookingAssistant } from '@repo/ai';
import { createClient } from '@repo/web/src/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
