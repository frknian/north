const CACHE = "planorth-brand-v20";
const CORE = [
  "/offline.html",
  "/planorth-192.png?v=4",
  "/planorth-512.png?v=4",
  "/planorth-180.png?v=4",
  "/apple-touch-icon.png?v=4",
  "/favicon.ico?v=4",
  "/planorth-mark-dark.png?v=4",
  "/planorth-mark-white.png?v=4"
];


self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});
self.addEventListener("activate", event => event.waitUntil(Promise.all([
 caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
 self.clients.claim(),
])));
self.addEventListener("fetch", event => {
 const url = new URL(event.request.url);
 if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;
 if (event.request.mode === "navigate") { event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html"))); return; }
 // Only public static assets; never personalized HTML or API responses.
 if (!CORE.includes(url.pathname) && !url.pathname.startsWith("/_next/static/")) return;
 event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
   if (response.ok) { const copy=response.clone(); event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy))); }
   return response;
 })));
});
self.addEventListener("notificationclick", event => {
 event.notification.close();
 const target = (event.notification.data && event.notification.data.url) || "/";
 event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(windows => {
   const open = windows.find(client => "focus" in client);
   return open ? open.focus() : self.clients.openWindow(target);
 }));
});
