// UPSC Tracker — Service Worker for PWA install
const CACHE_NAME = 'upsc-tracker-v2'; // 👈 v1 se v2 kar diya (force update ke liye)
const PRECACHE_URLS = ['/', '/index.html', '/auth.html', '/app.html', '/offline.html']; // 👈 offline.html add kiya

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {});
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    }),
  );
  self.clients.claim();
});

// Network-first strategy (always fresh content)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Skip Supabase, Cloudflare, Google APIs
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).catch(() => {
      // Agar page load ho raha hai (navigate mode) aur net nahi hai, toh offline.html dikhao
      if (event.request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
      // Baaki requests ke liye normal cache fallback
      return caches.match(event.request);
    }),
  );
});
