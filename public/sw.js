/* ═══════════════════════════════════════════════════════════
   Varadhi Service Worker  v1.0
   Strategy:
     • Cache-first  → static assets (JS, CSS, images, fonts)
     • Network-first → API / data calls (/api/*)
     • Offline fallback → /offline.html
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME    = 'varadhi-v1';
const OFFLINE_URL   = '/offline.html';

/* Assets to pre-cache on install */
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/road.jpeg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/* ── INSTALL ────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching shell assets');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE ───────────────────────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH ──────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET and cross-origin requests */
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  /* API calls → Network-first, fallback to cache */
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  /* Navigation requests → Network-first, offline.html fallback */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  /* Everything else → Cache-first */
  event.respondWith(cacheFirst(request));
});

/* ── STRATEGIES ─────────────────────────────────────────── */

/** Cache-first: return cache hit immediately; fetch + update in background */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    /* If it's an image / font, fail gracefully */
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/** Network-first: try network, fall back to cache */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'offline', message: 'Varadhi is offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/* ── PUSH NOTIFICATIONS (future-ready) ──────────────────── */
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Varadhi Alert', {
      body:    data.body   || 'Emergency update from Varadhi.',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag:     'varadhi-alert',
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
