// UPSC Tracker — Service Worker for PWA install
const CACHE_NAME = 'upsc-tracker-v3'; // 👈 v3 kar diya
const PRECACHE_URLS = ['/', '/index.html', '/auth.html', '/app.html', '/offline.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Ek-ek file ko cache kar raha hai taaki koi ek file fail ho toh baaki na ruke
      return Promise.all(
        PRECACHE_URLS.map((url) => cache.add(url).catch((err) => console.log('Failed to cache:', url))),
      );
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

// Network-first strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Skip external APIs
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      // Agar net fail ho jaye
      if (event.request.mode === 'navigate') {
        // Toh offline.html dikhao
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) return offlinePage;
      }
      // Baaki cheezon ke liye cache check karo
      return caches.match(event.request);
    }),
  );
});
