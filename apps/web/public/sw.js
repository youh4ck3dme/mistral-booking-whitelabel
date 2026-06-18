const CACHE_NAME = 'nexify-shell-v2';

// Static shell routes cached on install
const SHELL_ROUTES = ['/', '/404', '/manifest.webmanifest'];

// Path prefixes that always use stale-while-revalidate
const STATIC_PATH_PREFIXES = ['/_next/static/', '/icons/'];

// ---------------------------------------------------------------------------
// Install — pre-cache shell routes
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          SHELL_ROUTES.map((route) =>
            cache.add(new Request(route, { cache: 'reload' }))
          )
        )
      )
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — purge old caches
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Network-first: try network, fall back to cache
// ---------------------------------------------------------------------------
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    // Only cache valid responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Offline fallback: serve the root shell for navigation requests
    if (request.mode === 'navigate') {
      const shell = await cache.match('/');
      if (shell) return shell;
    }
    return Response.error();
  }
}

// ---------------------------------------------------------------------------
// Stale-while-revalidate: serve cache instantly, update in background
// ---------------------------------------------------------------------------
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached ?? (await networkPromise) ?? Response.error();
}

// ---------------------------------------------------------------------------
// Fetch handler
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GETs
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Static assets (_next/static, icons, fonts, images) — stale-while-revalidate
  if (
    STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
    ['style', 'script', 'font', 'image'].includes(request.destination)
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Navigation requests (page loads):
  // - Shell routes: network-first with offline fallback
  // - Tenant booking routes (/[slug], /[slug]/book, /[slug]/portal): network-first
  //   so users get fresh server-rendered content, with shell fallback if offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // API routes — never intercept
  if (url.pathname.startsWith('/api/')) return;
});
