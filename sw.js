const CACHE = 'finanzas-v12-20';
const CORE = [
  './',
  'index.html',
  'css/app.css',
  'js/state.js',
  'js/finance.js',
  'js/charts.js',
  'js/importers.js',
  'js/live.js',
  'js/connectors.js',
  'js/ai.js',
  'js/views-desktop.js',
  'js/views-mobile.js',
  'js/app.js',
  'actualizar.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png'
];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => { })); });
self.addEventListener('activate', e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k.startsWith('finanzas-') && k !== CACHE) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const nav = e.request.mode === 'navigate';
  if (nav) { e.respondWith(fetch(e.request, { cache: 'no-store' }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('index.html', c)); return r; }).catch(() => caches.match('index.html'))); return; }
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request)));
});
