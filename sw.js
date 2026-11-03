const CACHE_NAME = 'morningboard-offline-v4';
const CORE_ASSETS = [
  './', './index.html', './styles.css', './favicon.svg', './manifest.json',
  './icon-192.png', './icon-512.png', './assets/pdf.min.js',
  './assets/tasfik.MP3', './assets/ahtifal.MP3', './assets/heh.MP3',
  './assets/new.gif', './src/free-edition.js', './src/gifler.min.js',
  './src/jspdf.umd.min.js', './src/state-manager.js', './src/laser-pointer.js',
  './src/math-tools.js', './src/encouragement-games.js', './src/shapes-manager.js',
  './src/canvas-manager.js', './src/water-gun.js', './src/super-laser.js',
  './src/trace-logger.js', './src/main.js'
];
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Cache individually so one optional/missing file cannot cancel installation.
    await Promise.all(CORE_ASSETS.map(async (assetPath) => {
      const url = new URL(assetPath, self.registration.scope);
      try {
        const response = await fetch(url.toString(), { cache: 'reload' });
        if (response && response.ok && response.type === 'basic') {
          await cache.put(url.toString(), response);
        }
      } catch (error) {
        console.warn('[MorningBoard SW] Could not pre-cache:', url.pathname, error);
      }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => key.startsWith('morningboard-') && key !== CACHE_NAME
      ? caches.delete(key) : Promise.resolve()));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        const shell = await cache.match(new URL('index.html', scopeUrl).toString());
        if (shell) return shell;
      }
      return new Response('هذا الملف غير متاح دون اتصال بالإنترنت.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
