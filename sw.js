// Offline-Cache: App-Dateien, Leaflet, Schrift und Kartenkacheln
const APP = "app-v1", TILES = "tiles-v1";
const CORE = ["./", "index.html", "manifest.json", "icon.svg",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const url = e.request.url;
  if (e.request.method !== "GET") return;
  // Kartenkacheln: erst Speicher, sonst Netz (und merken)
  if (url.includes("tile.openstreetmap.org")) {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(url);
      if (hit) return hit;
      try { const r = await fetch(e.request); if (r.ok) c.put(url, r.clone()); return r; }
      catch { return new Response("", { status: 504 }); }
    }));
    return;
  }
  // Alles andere: Netz zuerst, bei Funkstille aus dem Speicher
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(APP).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then(h => h || caches.match("index.html"))));
});
