// Offline-Unterstützung. Strategie: erst Netz (immer die neueste Version), nur ohne Netz aus dem Cache.
// Bei jeder neuen Version VERSION erhöhen.
const VERSION = 'notiz-v37';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'vault.js', 'viz.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // cache: 'reload' umgeht den HTTP-Zwischenspeicher des Browsers → garantiert frische Dateien
    await Promise.all(FILES.map(async f => {
      const r = await fetch(new Request(f, { cache: 'reload' }));
      if (r.ok) await cache.put(f, r);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const r = await fetch(e.request, { cache: 'no-cache' }); // prüft beim Server, ob es etwas Neues gibt
      if (r.ok) cache.put(e.request, r.clone());
      return r;
    } catch {
      return (await cache.match(e.request, { ignoreSearch: true })) || (await cache.match('index.html'));
    }
  })());
});
