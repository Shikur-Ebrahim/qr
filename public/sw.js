const CACHE_NAME = 'qr-ticket-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch to satisfy PWA requirements while keeping Next.js dynamic routing working
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("You are currently offline. Please reconnect to the internet to use the ticket scanner.", {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'text/plain' })
      });
    })
  );
});
