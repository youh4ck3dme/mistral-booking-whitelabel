import { ToolLoopAgent, tool, isStepCount } from 'ai';
import { mistral } from '@ai-sdk/mistral';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';

function hashSha256Hex(token: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cryptoMod = require('crypto');
    return cryptoMod.createHash('sha256').update(token, 'utf8').digest('hex');
  } catch {
    return token;
  }
}

function generateRandomToken(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cryptoMod = require('crypto');
    return cryptoMod.randomBytes(32).toString('base64url');
  } catch {
    const arr = new Uint8Array(32);
    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
      globalThis.crypto.getRandomValues(arr);
    }
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
}

type TypedSupabaseClient = SupabaseClient<Database>;

export interface BizAgentConfig {
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  channel?: 'web' | 'whatsapp';
  supabase: TypedSupabaseClient | SupabaseClient<any>;
  preloadedServices?: Array<{ id: string; name: string; duration: number; price: number }>;
  appUrl?: string;
}

export function createBizAgent(config: BizAgentConfig) {
  const {
    tenantId,
    tenantName,
    tenantSlug = 'default',
    channel = 'web',
    supabase,
    preloadedServices = [],
    appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booking.example.com',
  } = config;

  const todayISO = new Date().toISOString().slice(0, 10);

  const servicesPrompt =
    preloadedServices.length > 0
      ? `\nPonuka služieb podniku:\n` +
        preloadedServices
          .map((s) => `• ${s.name} (ID: "${s.id}", ${s.duration} min, ${s.price} €)`)
          .join('\n')
      : '';

  const db = supabase as any;

  const instructions = buildBizAgentInstructions(tenantName, channel, todayISO, servicesPrompt);

  const agent = new ToolLoopAgent({
    model: mistral('mistral-small-latest'),
    instructions,
    stopWhen: isStepCount(4),
    tools: {
      get_available_slots: tool({
        description: 'Vráti voľné termíny pre danú službu a dátum (YYYY-MM-DD).',
        inputSchema: z.object({
          serviceId: z.string().describe('ID služby'),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Dátum YYYY-MM-DD'),
        }),
        execute: async ({ serviceId, date }) => {
          try {
            const rangeStart = new Date(`${date}T00:00:00Z`).toISOString();
            const rangeEnd = new Date(`${date}T23:59:59Z`).toISOString();

            // 1. Try get_available_slots RPC with standard params (p_tenant_id, p_service_id, p_date, p_staff_id)
            const rpcRes = await (db.rpc ? db.rpc('get_available_slots', {
              p_tenant_id: tenantId,
              p_service_id: serviceId,
              p_date: date,
              p_staff_id: null,
            }) : Promise.resolve({ data: null, error: null }));

            const slots = rpcRes?.data;
            const slotsError = rpcRes?.error;

            if (slotsError) {
              return { error: 'Termíny sa nepodarilo overiť: ' + (slotsError.message || 'Chyba') };
            }

            if (Array.isArray(slots) && slots.length > 0) {
              return {
                availableSlots: slots.map((s: any) => ({
                  staffId: s.staff_id || s.staffId,
                  startTime: s.start_time || s.startTime,
                  endTime: s.end_time || s.endTime,
                  slot_start: s.start_time || s.slot_start || s,
                })),
              };
            }

            // 2. Fallback to custom get_service_availability RPC if present
            const altRes = await (db.rpc ? db.rpc('get_service_availability', {
              p_tenant_id: tenantId,
              p_service_id: serviceId,
              p_date: date,
            }) : Promise.resolve({ data: null, error: null }));

            const altData = altRes?.data;
            const altError = altRes?.error;

            if (!altError && altData) {
              return { availableSlots: altData };
            }

            // 3. Fallback: check operating hours and booked slots
            const { data: service } = await db
              .from('services')
              .select('duration')
              .eq('id', serviceId)
              .maybeSingle();

            const duration = service?.duration || 30;
            const bookedRes = await (db.rpc ? db.rpc('get_booked_slots', {
              p_tenant_id: tenantId,
              p_service_id: serviceId,
              p_start_range: rangeStart,
              p_end_range: rangeEnd,
            }) : Promise.resolve({ data: null, error: null }));

            const booked = bookedRes?.data;
            const bookedRanges = (booked || []).map((b: any) => ({
              start_time: b.start_time,
              end_time: b.end_time,
            }));

            const generatedSlots = generateDaySlots(date, duration, bookedRanges);
            return { availableSlots: generatedSlots };
          } catch (err) {
            console.error('[biz-agent] get_available_slots error:', err);
            return { error: 'Termíny sa nepodarilo overiť.' };
          }
        },
      }),

      book_guest_slot: tool({
        description: 'Vytvorí záväznú hosťovskú rezerváciu po schválení klientom a vygeneruje odkaz na správu.',
        inputSchema: z.object({
          serviceId: z.string().describe('ID služby'),
          startTimeISO: z.string().describe('Začiatok v ISO formáte'),
          customerName: z.string().min(2).describe('Meno zákazníka'),
          customerEmail: z.string().email().describe('E-mail zákazníka'),
          customerPhone: z.string().min(9).describe('Telefón zákazníka'),
          staffId: z.string().optional().describe('ID pracovníka (voliteľné)'),
          notes: z.string().optional().describe('Poznámka k rezervácii'),
        }),
        execute: async ({
          serviceId,
          startTimeISO,
          customerName,
          customerEmail,
          customerPhone,
          staffId,
          notes,
        }) => {
          try {
            // 1. Try create_guest_booking RPC if implemented
            const { data: guestRpcData, error: guestRpcError } = await db.rpc('create_guest_booking', {
              p_tenant_id: tenantId,
              p_service_id: serviceId,
              p_start_time: startTimeISO,
              p_client_name: customerName,
              p_client_email: customerEmail,
              p_client_phone: customerPhone,
              p_staff_id: staffId || null,
              p_note: notes || 'Rezervované cez BizAgent',
            });

            if (!guestRpcError && guestRpcData) {
              return {
                success: true,
                bookingId: guestRpcData.booking_id,
                manageUrl: guestRpcData.manage_url,
                message: `Rezervácia úspešná! Potvrdenie s odkazom na správu sme odoslali na ${customerEmail}.`,
              };
            }

            // 2. Standard fallback: find service duration, create booking and token
            const { data: service } = await db
              .from('services')
              .select('duration')
              .eq('id', serviceId)
              .maybeSingle();

            const durationMinutes = service?.duration || 30;
            const startTime = new Date(startTimeISO);
            const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);

            // Insert into bookings table
            const { data: booking, error: bookingErr } = await db
              .from('bookings')
              .insert({
                tenant_id: tenantId,
                service_id: serviceId,
                staff_id: staffId || null,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                status: 'confirmed',
                user_id: '00000000-0000-0000-0000-000000000000', // guest placeholder uuid
              })
              .select('id')
              .single();

            if (bookingErr || !booking) {
              return { success: false, error: bookingErr?.message || 'Nepodarilo sa vytvoriť rezerváciu.' };
            }

            // Generate management token
            const rawToken = generateRandomToken();
            const tokenHash = hashSha256Hex(rawToken);
            const expiresAt = new Date(Date.now() + 30 * 86400_000).toISOString();

            await db.from('booking_manage_tokens').insert({
              tenant_id: tenantId,
              booking_id: booking.id,
              token_hash: tokenHash,
              expires_at: expiresAt,
            });

            const cleanAppUrl = appUrl.replace(/\/+$/, '');
            const manageUrl = `${cleanAppUrl}/${tenantSlug}/booking/manage/${rawToken}`;

            return {
              success: true,
              bookingId: booking.id,
              manageUrl,
              message: `Rezervácia úspešná! Potvrdenie s odkazom na správu termínu nájdete na: ${manageUrl}`,
            };
          } catch (err) {
            console.error('[biz-agent] book_guest_slot error:', err);
            return { success: false, error: 'Chyba pri spracovaní rezervácie.' };
          }
        },
      }),

      manage_booking: tool({
        description: 'Vyhľadá stav rezervácie alebo vykoná zmenu/storno podľa bezpečnostného tokenu.',
        inputSchema: z.object({
          token: z.string().describe('Bezpečný token rezervácie (z potvrdzujúceho odkazu)'),
          action: z.enum(['check', 'cancel', 'reschedule']).describe('Akcia so zvolenou rezerváciou'),
          newStartTimeISO: z.string().optional().describe('Nový začiatočný čas ISO pri akcii reschedule'),
        }),
        execute: async ({ token, action, newStartTimeISO }) => {
          try {
            const tokenHash = hashSha256Hex(token.trim());

            if (action === 'check') {
              // 1. Try RPC get_booking_by_manage_token
              const rpcRes = await (db.rpc ? db.rpc('get_booking_by_manage_token', {
                p_token_hash: tokenHash,
                p_tenant_slug: tenantSlug,
              }) : Promise.resolve({ data: null, error: null }));

              const rpcData = rpcRes?.data;
              const rpcErr = rpcRes?.error;

              if (!rpcErr && rpcData && (rpcData as any).status === 'ok') {
                const b = (rpcData as any).booking;
                return {
                  success: true,
                  status: b.status,
                  startTime: b.start_time,
                  endTime: b.end_time,
                  serviceName: b.service_name || b.services?.name,
                };
              }

              // 2. Direct query fallback
              const { data: tokenRec } = await db
                .from('booking_manage_tokens')
                .select('booking_id, revoked_at, expires_at')
                .eq('token_hash', tokenHash)
                .maybeSingle();

              if (!tokenRec || tokenRec.revoked_at || (tokenRec.expires_at && new Date(tokenRec.expires_at) < new Date())) {
                return { success: false, error: 'Rezerváciu sa nepodarilo nájsť (neplatný token alebo vypršal).' };
              }

              const { data: bookingRec } = await db
                .from('bookings')
                .select('id, start_time, end_time, status, service_id')
                .eq('id', tokenRec.booking_id)
                .maybeSingle();

              if (!bookingRec) {
                return { success: false, error: 'Rezerváciu sa nepodarilo nájsť.' };
              }

              return {
                success: true,
                status: bookingRec.status,
                startTime: bookingRec.start_time,
                endTime: bookingRec.end_time,
              };
            }

            if (action === 'cancel') {
              // 1. Try cancel_booking_by_token RPC
              const cancelRes = await (db.rpc ? db.rpc('cancel_booking_by_token', {
                p_token_hash: tokenHash,
                p_tenant_slug: tenantSlug,
              }) : Promise.resolve({ data: null, error: null }));

              const cancelData = cancelRes?.data;
              const cancelErr = cancelRes?.error;

              if (!cancelErr && cancelData && ((cancelData as any).status === 'ok' || (cancelData as any).status === 'already_cancelled')) {
                return { success: true, message: 'Rezervácia bola úspešne zrušená.' };
              }

              // 2. Direct fallback
              const { data: tokenRec } = await db
                .from('booking_manage_tokens')
                .select('booking_id')
                .eq('token_hash', tokenHash)
                .maybeSingle();

              if (tokenRec) {
                await db.from('bookings').update({ status: 'cancelled' }).eq('id', tokenRec.booking_id);
                await db.from('booking_manage_tokens').update({ revoked_at: new Date().toISOString() }).eq('token_hash', tokenHash);
                return { success: true, message: 'Rezervácia bola úspešne zrušená.' };
              }

              return { success: false, error: 'Rezerváciu sa nepodarilo zrušiť.' };
            }

            if (action === 'reschedule' && newStartTimeISO) {
              const newToken = generateRandomToken();
              const newTokenHash = hashSha256Hex(newToken);

              // 1. Try reschedule_booking_by_token RPC
              const reschedRes = await (db.rpc ? db.rpc('reschedule_booking_by_token', {
                p_token_hash: tokenHash,
                p_tenant_slug: tenantSlug,
                p_new_start: newStartTimeISO,
                p_new_token_hash: newTokenHash,
              }) : Promise.resolve({ data: null, error: null }));

              const reschedData = reschedRes?.data;
              const reschedErr = reschedRes?.error;

              if (!reschedErr && reschedData && (reschedData as any).status === 'ok') {
                return { success: true, message: 'Termín rezervácie bol úspešne presunutý.' };
              }

              // 2. Direct fallback
              const { data: tokenRec } = await db
                .from('booking_manage_tokens')
                .select('booking_id')
                .eq('token_hash', tokenHash)
                .maybeSingle();

              if (tokenRec) {
                const newStart = new Date(newStartTimeISO);
                const newEnd = new Date(newStart.getTime() + 30 * 60_000);
                await db
                  .from('bookings')
                  .update({ start_time: newStart.toISOString(), end_time: newEnd.toISOString() })
                  .eq('id', tokenRec.booking_id);

                return { success: true, message: 'Termín rezervácie bol úspešne presunutý.' };
              }

              return { success: false, error: 'Nepodarilo sa presunúť termín rezervácie.' };
            }

            return { success: false, error: 'Neznáma operácia správy rezervácie.' };
          } catch (err) {
            console.error('[biz-agent] manage_booking error:', err);
            return { success: false, error: 'Chyba pri správe rezervácie.' };
          }
        },
      }),
    },
  });

  (agent as any).instructions = instructions;
  (agent as any).model = mistral('mistral-small-latest');

  return agent;
}

function generateDaySlots(
  dateISO: string,
  durationMinutes: number,
  bookedRanges: Array<{ start_time: string; end_time: string }>
): string[] {
  const slots: string[] = [];
  const startHour = 9;
  const endHour = 17;
  const durationMs = durationMinutes * 60_000;

  const cursor = new Date(`${dateISO}T00:00:00Z`);
  cursor.setUTCHours(startHour, 0, 0, 0);

  const dayEnd = new Date(`${dateISO}T00:00:00Z`);
  dayEnd.setUTCHours(endHour, 0, 0, 0);

  while (cursor.getTime() + durationMs <= dayEnd.getTime()) {
    const slotEndMs = cursor.getTime() + durationMs;
    const overlaps = bookedRanges.some((b) => {
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      return cursor.getTime() < bEnd && slotEndMs > bStart;
    });

    if (!overlaps) {
      slots.push(cursor.toISOString());
    }
    cursor.setTime(cursor.getTime() + durationMs);
  }

  return slots;
}

export function buildBizAgentInstructions(
  tenantName: string,
  channel: string,
  todayISO: string,
  servicesPrompt: string
): string {
  return `Si BizAgent — autonómny obchodný a prevádzkový manažér pre podnik "${tenantName}".
Komunikačný kanál: ${channel.toUpperCase()}.
Jazyk: Vždy odpovedaj po slovensky, priateľsky, profesionálne a stručne (max. 2–3 vety).
Dnešný dátum: ${todayISO}.
${servicesPrompt}

PRAVIDLÁ A PRAVOMOCI:
1. Zisťovanie termínov: Ak klient hľadá voľný čas, zavolaj "get_available_slots".
2. Rezervácia: Ak klient potvrdí termín, meno, telefón a e-mail, zavolaj "book_guest_slot".
3. Storno / Zmena / Stav: Ak klient uvádza token alebo kód rezervácie, použi "manage_booking".
4. CRO Upsell: Ak klient rezervuje hlavnú službu, decentne navrhni vhodnú doplnkovú službu, ak má zmysel.
5. Nikdy si nevymýšľaj časy ani ceny mimo poskytnutých nástrojov!`;
}

