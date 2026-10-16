const CACHE_NAME = 'mei-app-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './assets/mei_logo.png',
  './bulking_cutting.html'
];

// Instalación del Service Worker y almacenamiento en caché de los archivos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Guardando recursos en caché...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de respuesta: Network First para llamadas a Apps Script / Stale-While-Revalidate para recursos estáticos
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Peticiones a Apps Script siempre van a la red directo
  if (requestUrl.hostname.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para el resto de archivos estáticos: intenta caché, si no, busca en red
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Actualiza el caché en segundo plano
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Ignorar errores de red en segundo plano */});
        
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
