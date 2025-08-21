// sw.js – App Shell cache
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `pandaroyale-${CACHE_VERSION}`;

// Llista mínima de fitxers per treballar offline (afegeix aquí el que calgui)
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k.startsWith('pandaroyale-') && k !== CACHE_NAME)
        .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratègia "Cache, falling back to Network"
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Evita cachejar peticions POST o de tercers si no vols
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(networkResp => {
        // Cacheja en segon pla si és de la mateixa origen
        if (networkResp && networkResp.ok && new URL(req.url).origin === self.location.origin) {
          const clone = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return networkResp;
      }).catch(() => cached); // offline: usa cache si hi havia
      return cached || fetchPromise;
    })
  );
});
