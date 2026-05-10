'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { consumeFlashToast } from '@repo/web/src/lib/notifications/client';
import type { ToastInput } from '@repo/web/src/lib/notifications/types';

type ToastRecord = ToastInput & { id: string };

type NotificationsContextValue = {
  notify: (toast: ToastInput) => void;
  notifyError: (title: string, description?: string) => void;
  notifyInfo: (title: string, description?: string) => void;
  notifySuccess: (title: string, description?: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function createToastId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function NotificationsProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (toast: ToastInput) => {
      const id = createToastId();
      setToasts((current) => [...current, { ...toast, id }]);

      window.setTimeout(() => {
        dismiss(id);
      }, toast.variant === 'error' ? 6500 : 4800);
    },
    [dismiss]
  );

  useEffect(() => {
    const flashToast = consumeFlashToast();
    if (flashToast) {
      notify(flashToast);
    }
  }, [notify, pathname]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notify,
      notifyError: (title: string, description?: string) =>
        notify({ title, description, variant: 'error' }),
      notifyInfo: (title: string, description?: string) =>
        notify({ title, description, variant: 'info' }),
      notifySuccess: (title: string, description?: string) =>
        notify({ title, description, variant: 'success' }),
    }),
    [notify]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div className="premium-toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`premium-toast premium-toast--${toast.variant}`}
            data-testid={`toast-${toast.variant}`}
            role={toast.variant === 'error' ? 'alert' : 'status'}
          >
            <div className="premium-toast-copy">
              <strong>{toast.title}</strong>
              {toast.description ? <p>{toast.description}</p> : null}
            </div>
            <button
              type="button"
              className="premium-toast-close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider.');
  }

  return context;
}
