const CACHE_NAME = 'qr-ticket-cache-v2';
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  // Chrome requires the start_url to be cached for PWA install prompt to fire reliably
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    }).catch(err => console.error("Cache addAll failed:", err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch, fallback to cache if offline
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;
      
      // Fallback for document requests
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
      
      return new Response("Offline", { status: 503 });
    })
  );
});
