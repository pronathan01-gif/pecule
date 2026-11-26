/* Pécule — service worker : marche hors connexion, toujours la dernière version quand il y a du réseau */
const CACHE = "pecule-v7";
const SHELL = ["./", "index.html", "app.css", "config.js", "courses.js", "app.js",
  "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Supabase API : jamais en cache
  if (url.hostname.endsWith("supabase.co")) return;
  // Réseau d'abord, cache en secours
  e.respondWith(
    fetch(req,url.origin===location.origin?{cache:"no-cache"}:undefined).then(res => {
      if (res && res.ok && (url.origin === location.origin || url.hostname === "cdn.jsdelivr.net")) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html")))
  );
});
