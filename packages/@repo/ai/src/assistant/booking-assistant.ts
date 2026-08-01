import { ToolLoopAgent, tool, isStepCount } from 'ai';
import { mistral } from '@ai-sdk/mistral';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';

type TypedSupabaseClient = SupabaseClient<Database>;

const CHAT_MODEL = 'mistral-small-latest';

/**
 * `supabase` must be a per-request, session-authenticated client (e.g. from
 * `apps/web/src/utils/supabase/server.ts`), not the shared anon singleton.
 * `create_booking`/`cancel_booking` derive the caller's identity from
 * `auth.uid()` server-side (migration 007) — an unauthenticated/anon client
 * will fail with "Not authenticated" on every booking attempt.
 */
export function createBookingAssistant(params: { tenantId: string; supabase: TypedSupabaseClient }) {
  const { tenantId, supabase } = params;
  const todayISO = new Date().toISOString().slice(0, 10);

  return new ToolLoopAgent({
    model: mistral(CHAT_MODEL),
    instructions: `Si asistent pre rezervácie termínov. Odpovedaj vždy po slovensky, stručne a prakticky.
Dnešný dátum: ${todayISO}.

Postupuj v tomto poradí:
1. Zisti dostupné služby cez list_services (ak ich používateľ ešte nespomenul).
2. Over voľné termíny cez get_available_slots pre konkrétny dátum a vybranú službu.
3. Rezerváciu vytvor cez create_booking LEN AK používateľ v aktuálnej správe jasne a explicitne potvrdil konkrétny termín (dátum + čas + službu).

Nikdy si nevymýšľaj časy ani ID služieb — vždy ich over cez nástroje. Ak create_booking zlyhá (napr. termín je už obsadený), ospravedlň sa, over aktuálne voľné termíny znova a navrhni alternatívu.`,
    stopWhen: isStepCount(6),
    tools: {
      list_services: tool({
        description: 'Vráti zoznam aktívnych služieb tenantu (id, názov, trvanie v minútach, cena v EUR).',
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await supabase
            .from('services')
            .select('id,name,duration,price')
            .eq('tenant_id', tenantId)
            .eq('is_active', true);
          if (error) {
            console.error('[booking-assistant] list_services failed:', error);
            return { error: error.message };
          }
          return { services: data };
        },
      }),
      get_available_slots: tool({
        description: 'Vráti zoznam voľných začiatočných časov (ISO 8601) pre danú službu a dátum.',
        inputSchema: z.object({
          serviceId: z.string().describe('ID služby zo list_services'),
          date: z.string().describe('Dátum vo formáte YYYY-MM-DD'),
        }),
        execute: async ({ serviceId, date }) => {
          try {
            const slots = await getAvailableSlots(supabase, tenantId, serviceId, date);
            return { slots };
          } catch (e) {
            return { error: e instanceof Error ? e.message : 'Nepodarilo sa zistiť voľné termíny.' };
          }
        },
      }),
      create_booking: tool({
        description:
          'Vytvorí rezerváciu pre aktuálne prihláseného používateľa. Používaj len po explicitnom potvrdení konkrétneho termínu používateľom v aktuálnej správe.',
        inputSchema: z.object({
          serviceId: z.string().describe('ID služby zo list_services'),
          startTimeISO: z.string().describe('Presný začiatočný čas z get_available_slots (ISO 8601)'),
        }),
        execute: async ({ serviceId, startTimeISO }) => {
          const { data: service, error: serviceError } = await supabase
            .from('services')
            .select('duration')
            .eq('id', serviceId)
            .eq('tenant_id', tenantId)
            .single();

          if (serviceError || !service) {
            return { success: false, error: 'Služba sa nenašla.' };
          }

          const startTime = new Date(startTimeISO);
          const endTime = new Date(startTime.getTime() + service.duration * 60_000);

          const { data, error } = await supabase.rpc('create_booking', {
            p_tenant_id: tenantId,
            p_service_id: serviceId,
            p_start_time: startTime.toISOString(),
            p_end_time: endTime.toISOString(),
          });

          if (error) {
            console.error('[booking-assistant] create_booking RPC failed:', error);
            return { success: false, error: error.message };
          }
          return { success: true, bookingId: data };
        },
      }),
    },
  });
}

async function getAvailableSlots(
  supabase: TypedSupabaseClient,
  tenantId: string,
  serviceId: string,
  dateISO: string
): Promise<string[]> {
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('duration')
    .eq('id', serviceId)
    .eq('tenant_id', tenantId)
    .single();
  if (serviceError || !service) {
    if (serviceError) console.error('[booking-assistant] getAvailableSlots service lookup failed:', serviceError);
    throw new Error('Služba sa nenašla.');
  }

  const { data: hours, error: hoursError } = await supabase
    .from('time_slots_config')
    .select('start_time,end_time')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);
  if (hoursError) {
    console.error('[booking-assistant] time_slots_config lookup failed:', hoursError);
    throw new Error(hoursError.message);
  }
  if (!hours || hours.length === 0) return [];

  // time_slots_config.start_time/end_time are timezone-less TIME values compared
  // against p_start_time::TIME inside create_booking, which casts under the DB
  // session's (UTC) timezone — so slots are generated in UTC here to match.
  const rangeStart = new Date(`${dateISO}T00:00:00Z`);
  const rangeEnd = new Date(`${dateISO}T23:59:59Z`);

  const { data: booked, error: bookedError } = await supabase.rpc('get_booked_slots', {
    p_tenant_id: tenantId,
    p_service_id: serviceId,
    p_start_range: rangeStart.toISOString(),
    p_end_range: rangeEnd.toISOString(),
  });
  if (bookedError) {
    console.error('[booking-assistant] get_booked_slots RPC failed:', bookedError);
    throw new Error(bookedError.message);
  }

  const durationMs = service.duration * 60_000;
  const slots: string[] = [];

  for (const window of hours) {
    const [startH, startM] = window.start_time.split(':').map(Number);
    const [endH, endM] = window.end_time.split(':').map(Number);

    const cursor = new Date(`${dateISO}T00:00:00Z`);
    cursor.setUTCHours(startH, startM, 0, 0);
    const windowEnd = new Date(`${dateISO}T00:00:00Z`);
    windowEnd.setUTCHours(endH, endM, 0, 0);

    while (cursor.getTime() + durationMs <= windowEnd.getTime()) {
      const slotEndMs = cursor.getTime() + durationMs;
      const overlaps = (booked ?? []).some((b: { start_time: string; end_time: string }) => {
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        return cursor.getTime() < bEnd && slotEndMs > bStart;
      });
      if (!overlaps) {
        slots.push(cursor.toISOString());
      }
      cursor.setTime(cursor.getTime() + durationMs);
    }
  }

  return slots;
}
