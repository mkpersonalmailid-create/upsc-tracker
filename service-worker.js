/* ═══════════════════════════════════════════════════════
   UPSC Tracker — Service Worker (PWA + Safe Fetch)
   File: /service-worker.js
   ═══════════════════════════════════════════════════════ */

const CACHE_NAME = 'upsc-tracker-v2';
const PRECACHE_URLS = ['/', '/index.html', '/auth.html', '/app.html'];

/* ═══════════════════════════════════════════════════════
   INSTALL — Precache essential files
   ═══════════════════════════════════════════════════════ */
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Individual failures ignore karo
      });
    }),
  );
});

/* ═══════════════════════════════════════════════════════
   ACTIVATE — Purane caches delete karo
   ═══════════════════════════════════════════════════════ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      })
      .then(() => self.clients.claim()),
  );
});

/* ═══════════════════════════════════════════════════════
   FETCH — Network-first with safe fallback
   Bug fix: "Failed to convert value to 'Response'" error
   ═══════════════════════════════════════════════════════ */
self.addEventListener('fetch', (event) => {
  // Sirf GET requests handle karo
  if (event.request.method !== 'GET') return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    return; // Invalid URL — bypass
  }

  // Sirf http/https handle karo
  if (!url.protocol.startsWith('http')) return;

  // External origins bypass karo (Supabase, Cloudflare, Google, Razorpay, etc.)
  if (url.origin !== self.location.origin) return;

  // Sensitive endpoints bypass
  if (url.pathname.includes('/api/') || url.pathname.includes('razorpay') || url.pathname.includes('supabase')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Successful response — cache a copy
        if (response && response.status === 200 && response.type === 'basic') {
          try {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone).catch(() => {});
            });
          } catch (e) {
            // Cache failure ignore karo
          }
        }
        return response;
      })
      .catch(() => {
        // Network fail — cache try karo
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;

          // Kuch bhi nahi mila — valid empty Response return karo
          // (undefined return karne se "Failed to convert value to 'Response'" error aata hai)
          return new Response('', {
            status: 504,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      }),
  );
});

/* ═══════════════════════════════════════════════════════
   MESSAGE — Skip waiting on demand
   ═══════════════════════════════════════════════════════ */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
