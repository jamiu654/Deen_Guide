const CACHE_NAME = 'deen-guide-v2';
const APP_SHELL = [
  '/Deen_Guide/',
  '/Deen_Guide/index.html',
  '/Deen_Guide/index.css',
  '/Deen_Guide/index.js',
  '/Deen_Guide/manifest.webmanifest',
  '/Deen_Guide/icons/app-icon-192.png',
  '/Deen_Guide/icons/app-icon-512.png',
  '/Deen_Guide/icons/app-icon.svg',
  '/Deen_Guide/icons/maskable-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', responseClone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  const url = new URL(request.url);
  const isAppAsset = url.origin === self.location.origin;
  const isApiRequest = [
    'api.alquran.cloud',
    'api.aladhan.com',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ].includes(url.hostname);

  if (isApiRequest) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isAppAsset) {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}
