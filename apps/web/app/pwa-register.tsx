'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        void registration.update();
      } catch (error) {
        console.warn('PWA service worker registration failed.', error);
      }
    };

    if (document.readyState === 'complete') {
      void registerServiceWorker();
      return;
    }

    const onLoad = () => {
      void registerServiceWorker();
    };

    window.addEventListener('load', onLoad, { once: true });
    return () => {
      window.removeEventListener('load', onLoad);
    };
  }, []);

  return null;
}
