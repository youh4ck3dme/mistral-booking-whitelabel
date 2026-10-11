'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';
import { useNotifications } from '@repo/web/app/notifications-provider';
import { useState, type FormEvent } from 'react';

function toolStatusLabel(toolName: string, state: string): string {
  const labels: Record<string, string> = {
    list_services: 'Zisťujem dostupné služby…',
    get_available_slots: 'Overujem voľné termíny…',
    create_booking: 'Vytváram rezerváciu…',
  };
  if (state === 'output-available') {
    if (toolName === 'create_booking') return 'Rezervácia spracovaná.';
    return 'Hotovo.';
  }
  return labels[toolName] ?? 'Pracujem…';
}

export default function BookingAssistantWidget() {
  const tenant = useTenant();
  const { notifySuccess } = useNotifications();
  const primaryColor = tenant.branding?.primary_color || '#3B82F6';

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [notifiedBookingIds, setNotifiedBookingIds] = useState<Set<string>>(new Set());

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { tenantId: tenant.tenant.id },
    }),
  });

  const isBusy = status === 'submitted' || status === 'streaming';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setInput('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Zavrieť asistenta' : 'Otvoriť AI asistenta'}
        style={{ backgroundColor: primaryColor }}
        className="fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.06 0-2.075-.163-3.016-.463L3 21l1.516-4.032C3.55 15.554 3 13.836 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 left-5 z-40 flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <div style={{ backgroundColor: primaryColor }} className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-semibold">
              AI
            </div>
            <div className="text-sm font-semibold text-gray-900">Rezervačný asistent</div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400">
                Napíš napr. „Chcem sa objednať zajtra na strihanie“ a pomôžem ti nájsť a potvrdiť voľný termín.
              </p>
            )}
            {messages.map((message) => (
              <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    message.role === 'user'
                      ? 'max-w-[85%] rounded-2xl px-3 py-2 text-sm text-white'
                      : 'max-w-[85%] rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-800'
                  }
                  style={message.role === 'user' ? { backgroundColor: primaryColor } : undefined}
                >
                  {message.parts.map((part, i) => {
                    if (part.type === 'text') {
                      return (
                        <span key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                          {part.text}
                        </span>
                      );
                    }

                    if (part.type.startsWith('tool-')) {
                      const toolName = part.type.slice('tool-'.length);
                      const state = (part as { state?: string }).state ?? '';

                      if (toolName === 'create_booking' && state === 'output-available') {
                        const output = (part as { output?: { success?: boolean; error?: string; bookingId?: string } }).output;
                        if (output?.success && output.bookingId && !notifiedBookingIds.has(output.bookingId)) {
                          setNotifiedBookingIds((prev) => new Set(prev).add(output.bookingId!));
                          notifySuccess('Rezervácia bola úspešne vytvorená.');
                        }
                        if (output?.success) {
                          return (
                            <div key={`${message.id}-${i}`} className="mt-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                              Rezervácia potvrdená.
                            </div>
                          );
                        }
                        return (
                          <div key={`${message.id}-${i}`} className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">
                            {output?.error ?? 'Rezerváciu sa nepodarilo vytvoriť.'}
                          </div>
                        );
                      }

                      return (
                        <div key={`${message.id}-${i}`} className="mt-1 text-xs italic text-gray-400">
                          {toolStatusLabel(toolName, state)}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            ))}
            {isBusy && <div className="text-xs italic text-gray-400">Asistent píše…</div>}
            {error && <div className="text-xs text-red-600">Asistent momentálne nie je dostupný. Skús to prosím znova.</div>}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isBusy}
              placeholder="Napíš správu…"
              className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
            <button
              type="submit"
              disabled={isBusy || !input.trim()}
              style={{ backgroundColor: primaryColor }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-7.5-15-7.5v6l10 1.5-10 1.5v6Z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
