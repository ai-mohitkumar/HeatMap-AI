/**
 * HeatShield AI Service Worker
 * Enables 100% offline shell caching and PWA installability while NEVER serving
 * stale cached live-weather, forecast, or IP-geolocation responses as current data.
 */

const CACHE_NAME = 'heatshield-v6';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
  '/leaflet.css',
  '/icon-192.png',
  '/icon-512.png'
];

// Endpoints whose freshness and provenance MUST never be spoofed by SW HTTP cache
const NO_CACHE_API_PREFIXES = [
  '/api/geo/ip',
  '/api/geo/reverse',
  '/api/safety/weather/live',
  '/api/safety/forecast/hourly',
  '/api/safety/predict',
  '/api/predict/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log('[HeatShield SW] Evicting legacy cache:', cache);
              return caches.delete(cache);
            }
            return Promise.resolve(false);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. Live weather, forecasts, and geolocation must NEVER replay stale cached responses
  if (NO_CACHE_API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ error: 'network_unavailable', offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          })
      )
    );
    return;
  }

  // 2. Static/research API endpoints: Network-first, JSON-only cache with explicit 503 fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const contentType = response.headers.get('content-type') || '';
          if (response.ok && contentType.includes('application/json')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cached) =>
              cached ||
              new Response(JSON.stringify({ error: 'offline', offline: true }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              })
          )
        )
    );
    return;
  }

  // 3. Navigation / HTML documents: Network-first to serve the latest production deploy immediately
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cached) => cached || caches.match('/index.html') || Response.error()
          )
        )
    );
    return;
  }

  // 4. Content-hashed static assets (JS, CSS, SVG, icons): Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});

// 5. Handle Notification click events on mobile and desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
