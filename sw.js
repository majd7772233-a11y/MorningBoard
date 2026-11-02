const CACHE_NAME = 'morningboard-free-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './favicon.svg',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './src/free-edition.js',
  './src/main.js',
  './src/canvas-manager.js',
  './src/shapes-manager.js',
  './src/state-manager.js',
  './src/laser-pointer.js',
  './src/math-tools.js',
  './assets/tasfik.MP3',
  './assets/ahtifal.MP3',
  './assets/heh.MP3',
  './assets/new.gif'
];

// Allow the page to trigger skipWaiting immediately
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA SW] Pre-caching static assets');
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[PWA SW] Pre-cache failed for some assets, registration continuing:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PWA SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests and exclude tauri:// or file:// resources
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Rewrite index.html to / to prevent Cloudflare Pages 308 redirects from failing the PWA
  let request = e.request;
  const url = new URL(e.request.url);
  if (url.pathname === '/index.html') {
    request = new Request(url.origin + '/');
  }

  e.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background to update cache (stale-while-revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
