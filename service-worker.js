const CACHE_NAME = 'upsc-tracker-v1';
const PRECACHE_URLS = ['/', '/index.html', '/auth.html', '/app.html'];

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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

// ⬇️ YAHAN SE NAYA CODE ADD HUA HAI ⬇️

// Notification receive karne ke liye
self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'UPSC Tracker', body: event.data.text() };
    }
  }

  const title = data.title || 'UPSC Tracker';
  const options = {
    body: data.body || 'Naya update aaya hai!',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification par click hone par app kholne ke liye
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
