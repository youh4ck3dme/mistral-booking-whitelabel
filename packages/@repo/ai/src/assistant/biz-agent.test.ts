import { describe, expect, it, vi } from 'vitest';
import { createBizAgent, buildBizAgentInstructions } from './biz-agent';

describe('createBizAgent', () => {
  const mockSupabase = {
    rpc: vi.fn(),
    from: vi.fn(),
  } as any;

  it('initializes BizAgent with correct system prompt, instructions, and tools', () => {
    const agent = createBizAgent({
      tenantId: '11111111-1111-1111-1111-111111111111',
      tenantName: 'Elite Salon & Spa',
      channel: 'web',
      supabase: mockSupabase,
      preloadedServices: [
        { id: 'srv-1', name: 'Strih vlasov', duration: 30, price: 25 },
        { id: 'srv-2', name: 'Farbenie', duration: 60, price: 50 },
      ],
    });

    expect(agent).toBeDefined();
    // Verify tools definition
    expect(agent.tools).toBeDefined();
    expect(agent.tools.get_available_slots).toBeDefined();
    expect(agent.tools.book_guest_slot).toBeDefined();
    expect(agent.tools.manage_booking).toBeDefined();
  });

  it('correctly formats instructions with tenant name and services prompt', () => {
    const instructions = buildBizAgentInstructions(
      'Barber Shop Bratislava',
      'whatsapp',
      '2026-10-13',
      '• Pánsky strih (ID: "srv-barber", 45 min, 30 €)'
    );

    expect(instructions).toContain('Barber Shop Bratislava');
    expect(instructions).toContain('WHATSAPP');
    expect(instructions).toContain('Pánsky strih');
  });
});
