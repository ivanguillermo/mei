const CACHE = "mei-app-v1";
const SHELL = [
  "./",
  "./index.html", 
  "./style.css", 
  "./app.js",
  "./manifest.json",
  "./js/medidas.js",
  "./js/rutinas.js", 
  "./js/alimentacion.js",
  "./js/atletas.js",
  "./assets/mei_logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./bulking_cutting.html",
  "./deficit_calorico.html"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Datos y servicios de Google: siempre red, nunca cache
  if (url.hostname.endsWith("google.com") || url.hostname.endsWith("googleusercontent.com") || url.hostname.endsWith("youtube.com")) return;
  // Archivos de la app: red primero (para recibir cambios), cache si no hay conexión
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && (url.origin === location.origin || url.hostname.includes("gstatic"))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
