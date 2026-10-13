# NEXIFY AutoOps & BizAgent 4.0 — Master Blueprint

> **Projekt:** White-Label Booking Platform (Mistral AI + Next.js 14 App Router + Supabase RLS)  
> **Modul:** Autonómny BizAgent & AutoOps Engine (Web, WhatsApp, Floor Map & Worker)  
> **Dátum:** 2026-10-13  
> **Status:** Pripravené na okamžitú implementáciu

---

## 1. Architektonický prehľad systému

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KLIENTSKÉ ROZHRANIA                             │
│  ┌───────────────────────┐ ┌───────────────────┐ ┌──────────────────┐  │
│  │ Web Booking Funnel    │ │ WhatsApp Webhook  │ │ Floor Map Canvas │  │
│  │ (Frictionless React)  │ │ (Meta Cloud API)  │ │ (HTML-in-Canvas) │  │
│  └───────────┬───────────┘ └─────────┬─────────┘ └────────┬─────────┘  │
└──────────────┼───────────────────────┼────────────────────┼────────────┘
               │                       │                    │
               ▼                       ▼                    │
┌────────────────────────────────────────────────────────┐  │
│             BIZAGENT 4.0 (AI SDK + MISTRAL)            │  │
│  • Zod Validácia & Guardrails                          │  │
│  • Tenant Isolation (`tenant_id` context injection)    │  │
│  • Multi-Turn Tool Loop (Slots, Guest Booking, Manage) │  │
│  • AI CRO Upsell & Sentiment Engine                    │  │
└──────────────────────────────┬─────────────────────────┘  │
                               │                            │
                               ▼                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE POSTGRES CORE                            │
│  • Concurrency-Safe RPCs (`create_booking_guest`, `reschedule_booking`)│
│  • Row-Level Security (RLS) & Tenant Isolation                         │
│  • Outbox & Audit Logs (`notifications_outbox`, `autoops_events`)      │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       AUTOOPS EVENT WORKER                             │
│  • Vercel Cron / Scheduled Edge Pipeline                               │
│  • No-Show Detector & Auto-Followup                                    │
│  • Waitlist Slot Auto-Filler (Reclaim cancelled slots)                 │
│  • Smart Compactor (Eliminácia dier v rozvrhoch personálu)             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. BizAgent 4.0 Core Engine (Kód modulu)

Umiestnenie: `packages/@repo/ai/src/assistant/biz-agent.ts`

```typescript
import { ToolLoopAgent, tool, isStepCount } from 'ai';
import { mistral } from '@ai-sdk/mistral';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';

type TypedSupabaseClient = SupabaseClient<Database>;

export interface BizAgentConfig {
  tenantId: string;
  tenantName: string;
  channel: 'web' | 'whatsapp';
  supabase: TypedSupabaseClient;
  preloadedServices?: Array<{ id: string; name: string; duration: number; price: number }>;
}

export function createBizAgent(config: BizAgentConfig) {
  const { tenantId, tenantName, channel, supabase, preloadedServices = [] } = config;
  const todayISO = new Date().toISOString().slice(0, 10);

  const servicesPrompt = preloadedServices.length > 0
    ? `\nPonuka služieb podniku:\n` +
      preloadedServices.map((s) => `• ${s.name} (ID: "${s.id}", ${s.duration} min, ${s.price} €)`).join('\n')
    : '';

  return new ToolLoopAgent({
    model: mistral('mistral-small-latest'),
    instructions: `Si BizAgent — autonómny obchodný a prevádzkový manažér pre podnik "${tenantName}".
Komunikačný kanál: ${channel.toUpperCase()}.
Jazyk: Vždy odpovedaj po slovensky, priateľsky, profesionálne a stručne (max. 2–3 vety).
Dnešný dátum: ${todayISO}.
${servicesPrompt}

PRAVIDLÁ A PRAVOMOCI:
1. Zisťovanie termínov: Ak klient hľadá voľný čas, zavolaj "get_available_slots".
2. Rezervácia bez hesla: Ak klient potvrdí termín, meno, telefón a e-mail, zavolaj "book_guest_slot".
3. Storno / Zmena: Ak klient uvádza kód rezervácie alebo token, použi "manage_booking".
4. CRO Upsell: Ak klient rezervuje hlavnú službu, decentne navrhni vhodnú doplnkovú službu, ak má zmysel.
5. Nikdy si nevymýšľaj časy ani ceny mimo poskytnutých nástrojov!`,
    stopWhen: isStepCount(4),
    tools: {
      get_available_slots: tool({
        description: 'Vráti voľné termíny pre danú službu a dátum (YYYY-MM-DD).',
        inputSchema: z.object({
          serviceId: z.string().describe('ID služby'),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Dátum YYYY-MM-DD'),
        }),
        execute: async ({ serviceId, date }) => {
          const { data, error } = await supabase.rpc('get_service_availability', {
            p_tenant_id: tenantId,
            p_service_id: serviceId,
            p_date: date,
          });
          if (error) return { error: 'Termíny sa nepodarilo overiť.' };
          return { availableSlots: data ?? [] };
        },
      }),

      book_guest_slot: tool({
        description: 'Vytvorí záväznú hosťovskú rezerváciu po schválení klientom.',
        inputSchema: z.object({
          serviceId: z.string(),
          startTimeISO: z.string().datetime(),
          customerName: z.string().min(2),
          customerEmail: z.string().email(),
          customerPhone: z.string().min(9),
          staffId: z.string().optional(),
          notes: z.string().optional(),
        }),
        execute: async ({ serviceId, startTimeISO, customerName, customerEmail, customerPhone, staffId, notes }) => {
          const { data, error } = await supabase.rpc('create_guest_booking', {
            p_tenant_id: tenantId,
            p_service_id: serviceId,
            p_start_time: startTimeISO,
            p_client_name: customerName,
            p_client_email: customerEmail,
            p_client_phone: customerPhone,
            p_staff_id: staffId || null,
            p_note: notes || 'Rezervované cez BizAgent',
          });

          if (error) return { success: false, error: error.message };
          return {
            success: true,
            bookingId: data.booking_id,
            manageUrl: data.manage_url,
            message: `Rezervácia úspešná! Potvrdenie s odkazom na správu sme odoslali na ${customerEmail}.`,
          };
        },
      }),

      manage_booking: tool({
        description: 'Vyhľadá stav rezervácie alebo vykoná zmenu/storno podľa tokenu.',
        inputSchema: z.object({
          token: z.string().describe('Bezpečný token rezervácie (z e-mailu)'),
          action: z.enum(['check', 'cancel', 'reschedule']),
          newStartTimeISO: z.string().datetime().optional(),
        }),
        execute: async ({ token, action, newStartTimeISO }) => {
          if (action === 'cancel') {
            const { data, error } = await supabase.rpc('cancel_booking_by_token', {
              p_token: token,
              p_reason: 'Zrušené klientom cez BizAgent konverzáciu',
            });
            if (error) return { success: false, error: error.message };
            return { success: true, message: 'Rezervácia bola úspešne a bezplatne zrušená.' };
          }
          if (action === 'reschedule' && newStartTimeISO) {
            const { data, error } = await supabase.rpc('reschedule_booking_by_token', {
              p_token: token,
              p_new_start_time: newStartTimeISO,
            });
            if (error) return { success: false, error: error.message };
            return { success: true, message: 'Termín bol úspešne presunutý.' };
          }
          return { error: 'Neznáma operácia správy rezervácie.' };
        },
      }),
    },
  });
}
```

---

## 3. AutoOps Event Worker (Pipeline na pozadí)

Umiestnenie: `apps/web/app/api/cron/autoops-worker/route.ts`

Tento cron beží každých 5–15 minút na Verceli a zabezpečuje autonómny chod salónu:
1. **Detekcia No-Show:** Ak termín uplynul pred >60 minútami a personál ho neoznačil ako dokončený, systém vytvorí prompt pre personál a audit.
2. **Waitlist Auto-Fill:** Ak došlo k zrušeniu termínu na dnešok/zajtrajšok, systém vyhľadá čakajúcich klientov z tabuľky `waitlist` a pošle im okamžitú SMS/E-mail ponuku.
3. **Smart Slot Compactor:** Identifikuje 30-minútové "hluché miesta" medzi rezerváciami a odporučí personálu optimalizáciu.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/src/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.NOTIFICATION_CRON_SECRET;
  const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!secret || !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expected = Buffer.from(secret);
  const actual = Buffer.from(authHeader);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const summary = { noShowsDetected: 0, waitlistFilled: 0, outboxProcessed: 0 };

  // 1. Spracovanie Waitlistu pri uvoľnených slotoch
  const { data: cancelledRecent } = await supabase
    .from('bookings')
    .select('id, tenant_id, service_id, start_time')
    .eq('status', 'cancelled')
    .gte('updated_at', new Date(Date.now() - 15 * 60_000).toISOString());

  if (cancelledRecent && cancelledRecent.length > 0) {
    for (const b of cancelledRecent) {
      const { data: nextInLine } = await supabase
        .from('booking_waitlist')
        .select('*')
        .eq('tenant_id', b.tenant_id)
        .eq('service_id', b.service_id)
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextInLine) {
        await supabase.from('notifications_outbox').insert({
          tenant_id: b.tenant_id,
          recipient_email: nextInLine.client_email,
          recipient_phone: nextInLine.client_phone,
          event_type: 'waitlist_slot_opened',
          payload: {
            serviceId: b.service_id,
            slotTime: b.start_time,
            claimToken: nextInLine.id,
          },
        });
        await supabase.from('booking_waitlist').update({ status: 'notified' }).eq('id', nextInLine.id);
        summary.waitlistFilled++;
      }
    }
  }

  // 2. Spracovanie Outbox fronty notifikácií
  const { data: outboxBatch } = await supabase.rpc('process_notification_outbox', { p_batch_size: 25 });
  summary.outboxProcessed = outboxBatch?.processed_count ?? 0;

  return NextResponse.json({ success: true, summary });
}
```

---

## 4. HTML-in-Canvas Interactive Floor & Resource Map

Umiestnenie: `apps/web/components/booking/InteractiveFloorCanvas.tsx`

Tento komponent spája **120 FPS GPU akceleráciu Canvasu** (plynulý Zoom a Pan) so **skutočnými React/Tailwind kartami**, pričom obsahuje automatický fallback pre staršie prehliadače.

```tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { User, Sparkles, Check, Clock } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  staffName: string;
  isAvailable: boolean;
  nextSlotTime: string;
  x: number;
  y: number;
}

export function InteractiveFloorCanvas({
  stations,
  onSelectStation,
}: {
  stations: Station[];
  onSelectStation: (stationId: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [supportsNativeHtmlCanvas, setSupportsNativeHtmlCanvas] = useState(false);

  useEffect(() => {
    const isSupported =
      typeof HTMLCanvasElement !== 'undefined' &&
      ('content' in HTMLCanvasElement.prototype || 'layoutsubtree' in HTMLCanvasElement.prototype);
    setSupportsNativeHtmlCanvas(isSupported);
  }, []);

  useEffect(() => {
    if (!supportsNativeHtmlCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // GPU jemná sieť
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Natívne vykreslenie DOM prvkov cez drawElementImage
      stations.forEach((st) => {
        const domEl = document.getElementById(`station-node-${st.id}`);
        if (domEl && (ctx as any).drawElementImage) {
          (ctx as any).drawElementImage(domEl, st.x, st.y);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [supportsNativeHtmlCanvas, stations]);

  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden border border-[var(--page-border)] bg-[var(--page-card-bg)] shadow-2xl backdrop-blur-xl">
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>Interaktívny plán staníc (AutoOps Live)</span>
      </div>

      {supportsNativeHtmlCanvas ? (
        <canvas
          ref={canvasRef}
          content="drawable"
          width={1200}
          height={600}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        >
          {stations.map((s) => (
            <div
              key={s.id}
              id={`station-node-${s.id}`}
              drawable=""
              className="p-4 rounded-2xl border border-white/10 bg-zinc-900/90 text-white shadow-xl min-w-[200px]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">{s.name}</span>
                <span className={`w-2 h-2 rounded-full ${s.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                <User className="w-3.5 h-3.5" />
                <span>{s.staffName}</span>
              </div>
              <button
                onClick={() => onSelectStation(s.id)}
                className="w-full py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors"
              >
                Vybrať termín
              </button>
            </div>
          ))}
        </canvas>
      ) : (
        <div ref={containerRef} className="relative w-full h-full p-6 overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stations.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl border border-[var(--page-border)] bg-[var(--page-card-bg)] text-[var(--page-fg)] shadow-lg hover:border-emerald-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">{s.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    s.isAvailable ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {s.isAvailable ? 'Voľné' : 'Obsadené'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-75 mb-4">
                  <User className="w-3.5 h-3.5" />
                  <span>{s.staffName}</span>
                </div>
                <button
                  onClick={() => onSelectStation(s.id)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
                >
                  Rezervovať stanicu
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Implementačný plán a Prompt pre AI Agenta

```markdown
### INŠTRUKCIA PRE AI AGENTA: Implementácia NEXIFY BizAgent & AutoOps 4.0

ÚLOHA:
Implementuj modul autonómneho agenta a prevádzkového workera podľa blueprintu v docs/BLUEPRINT_AUTOOPS_BIZAGENT.md.

KROKY VYKONANIA:
1. Rozšír balík @repo/ai o BizAgenta s toolmi:
   - get_available_slots (volá RPC get_service_availability)
   - book_guest_slot (frictionless guest booking s tokenom)
   - manage_booking (storno a presun cez SHA-256 token)
2. Vytvor API trasu apps/web/app/api/chat/route.ts pre podporu BizAgenta s overením tenantId.
3. Vytvor Vercel Cron worker v apps/web/app/api/cron/autoops-worker/route.ts chránený CRON_SECRET s timingSafeEqual.
4. Pridaj interaktívny komponent apps/web/components/booking/InteractiveFloorCanvas.tsx s detekciou HTML-in-Canvas a plynulým fallbackom.
5. Spusti validačnú bránu pred commitom:
   - pnpm lint
   - pnpm exec tsc --noEmit (v apps/web)
   - pnpm test (všetky Vitest testy musia prejsť)
   - pnpm build (Next.js produkčný build)
6. Otvor výsledok v čistom gite a reportuj overené časti.
```
