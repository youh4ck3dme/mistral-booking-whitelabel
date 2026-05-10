import type { NotificationDispatchResult, ToastInput } from './types';

const FLASH_TOAST_KEY = 'nexify-flash-toast';

export function storeFlashToast(toast: ToastInput) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(FLASH_TOAST_KEY, JSON.stringify(toast));
}

export function consumeFlashToast() {
  if (typeof window === 'undefined') return null;

  const rawToast = window.sessionStorage.getItem(FLASH_TOAST_KEY);
  if (!rawToast) return null;

  window.sessionStorage.removeItem(FLASH_TOAST_KEY);

  try {
    return JSON.parse(rawToast) as ToastInput;
  } catch {
    return null;
  }
}

export async function dispatchBookingNotificationsRequest(
  bookingId: string
): Promise<NotificationDispatchResult> {
  const response = await fetch('/api/notifications/dispatch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bookingId }),
  });

  if (!response.ok) {
    throw new Error(`Notification dispatch failed with status ${response.status}.`);
  }

  return (await response.json()) as NotificationDispatchResult;
}
