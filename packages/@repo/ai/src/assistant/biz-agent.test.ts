import { createBizAgent } from './biz-agent';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'test-booking-id' }, error: null }),
      }),
    }),
  }),
};

describe('BizAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBizAgent', () => {
    it('should create a ToolLoopAgent with the correct configuration', () => {
      const agent = createBizAgent({
        tenantId: 'test-tenant-id',
        tenantName: 'Test Tenant',
        channel: 'web',
        supabase: mockSupabase as any,
        preloadedServices: [
          { id: 'service-1', name: 'Haircut', duration: 60, price: 20 },
        ],
      });

      expect(agent).toBeDefined();
      expect(agent).toHaveProperty('model');
      expect(agent).toHaveProperty('instructions');
      expect(agent).toHaveProperty('tools');
    });

    it('should include tenant name in instructions', () => {
      const agent = createBizAgent({
        tenantId: 'test-tenant-id',
        tenantName: 'Test Tenant',
        channel: 'web',
        supabase: mockSupabase as any,
      });

      expect(agent.instructions).toContain('Test Tenant');
    });

    it('should include channel in instructions', () => {
      const webAgent = createBizAgent({
        tenantId: 'test-tenant-id',
        tenantName: 'Test Tenant',
        channel: 'web',
        supabase: mockSupabase as any,
      });

      expect(webAgent.instructions).toContain('WEB');

      const whatsappAgent = createBizAgent({
        tenantId: 'test-tenant-id',
        tenantName: 'Test Tenant',
        channel: 'whatsapp',
        supabase: mockSupabase as any,
      });

      expect(whatsappAgent.instructions).toContain('WHATSAPP');
    });

    it('should include preloaded services in instructions', () => {
      const services = [
        { id: 'service-1', name: 'Haircut', duration: 60, price: 20 },
        { id: 'service-2', name: 'Color', duration: 120, price: 50 },
      ];

      const agent = createBizAgent({
        tenantId: 'test-tenant-id',
        tenantName: 'Test Tenant',
        channel: 'web',
        supabase: mockSupabase as any,
        preloadedServices: services,
      });

      expect(agent.instructions).toContain('Haircut');
      expect(agent.instructions).toContain('Color');
      expect(agent.instructions).toContain('60 min');
      expect(agent.instructions).toContain('120 min');
      expect(agent.instructions).toContain('20 €');
      expect(agent.instructions).toContain('50 €');
    });

    it('should have get_available_slots tool', () => {
      const agent = createBizAgent({
        tenantId: 'test-tenant-id',
        tenantName: 'Test Tenant',
        channel: 'web',
        supabase: mockSupabase as any,
      });

      expect(agent.tools.get_available_slots).toBeDefined();
      expect(agent.tools.get_available_slots.description).toContain('voľné termíny');
    });

    it('should have book_guest_slot tool', () => {
      const agent = createBizAgent({
        tenantId: 'test-tenant-id',
        tenantName: 'Test Tenant',
        channel: 'web',
        supabase: mockSupabase as any,
      });

      expect(agent.tools.book_guest_slot).toBeDefined();
      expect(agent.tools.book_guest_slot.description).toContain('záväznú hosťovskú rezerváciu');
    });

    it('should have manage_booking tool', () => {
      const agent = createBizAgent({
        tenantId: 'test-tenant-id',
        tenantName: 'Test Tenant',
        channel: 'web',
        supabase: mockSupabase as any,
      });

      expect(agent.tools.manage_booking).toBeDefined();
      expect(agent.tools.manage_booking.description).toContain('stav rezervácie');
    });
  });

  describe('tools', () => {
    describe('get_available_slots', () => {
      it('should call get_available_slots RPC with correct parameters', async () => {
        const mockRpc = vi.fn().mockResolvedValue({
          data: [
            { staff_id: 'staff-1', start_time: '2026-10-13T10:00:00', end_time: '2026-10-13T10:30:00' },
          ],
          error: null,
        });

        const mockSupabase = {
          rpc: mockRpc,
        };

        const agent = createBizAgent({
          tenantId: 'test-tenant-id',
          tenantName: 'Test Tenant',
          channel: 'web',
          supabase: mockSupabase as any,
        });

        const result = await agent.tools.get_available_slots.execute({
          serviceId: 'service-1',
          date: '2026-10-13',
        });

        expect(mockRpc).toHaveBeenCalledWith('get_available_slots', {
          p_tenant_id: 'test-tenant-id',
          p_service_id: 'service-1',
          p_date: '2026-10-13',
          p_staff_id: null,
        });

        expect(result.availableSlots).toBeDefined();
        expect(result.availableSlots?.length).toBe(1);
        expect(result.availableSlots?.[0].staffId).toBe('staff-1');
      });

      it('should handle RPC errors', async () => {
        const mockRpc = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Service not found' },
        });

        const mockSupabase = {
          rpc: mockRpc,
        };

        const agent = createBizAgent({
          tenantId: 'test-tenant-id',
          tenantName: 'Test Tenant',
          channel: 'web',
          supabase: mockSupabase as any,
        });

        const result = await agent.tools.get_available_slots.execute({
          serviceId: 'service-1',
          date: '2026-10-13',
        });

        expect(result.error).toBeDefined();
        expect(result.error).toContain('Termíny sa nepodarilo overiť');
      });
    });

    describe('manage_booking', () => {
      it('should return error for invalid token when checking', async () => {
        const mockFrom = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        });

        const mockSupabase = {
          from: mockFrom,
          rpc: vi.fn(),
        };

        const agent = createBizAgent({
          tenantId: 'test-tenant-id',
          tenantName: 'Test Tenant',
          channel: 'web',
          supabase: mockSupabase as any,
        });

        const result = await agent.tools.manage_booking.execute({
          token: 'invalid-token',
          action: 'check',
        });

        expect(result.error).toBeDefined();
        expect(result.error).toContain('Rezerváciu sa nepodarilo nájsť');
      });
    });
  });
});
