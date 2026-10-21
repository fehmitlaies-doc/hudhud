// Hudhud offline: the app shell is cached on install; fonts and verse recitations are cached the first time they play.
const SHELL = "hudhud-shell-v3";
const MEDIA = "hudhud-media-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== MEDIA).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // App files: network first so updates arrive, cache when offline
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(SHELL).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
    return;
  }
  // Fonts and recitations: cache first
  if (/fonts\.(googleapis|gstatic)\.com|everyayah\.com/.test(url.hostname) && !e.request.headers.has("range")) {
    e.respondWith(caches.open(MEDIA).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok || r.type === "opaque") c.put(e.request, r.clone());
      return r;
    }))));
  }
});
