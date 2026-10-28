// Service worker retirado: la web ya no es una PWA. Este archivo solo existe para desinstalar
// el que quedó en los dispositivos que la abrieron: borra sus cachés, se desregistra y recarga.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k.startsWith("2894-")) await caches.delete(k);
      await self.registration.unregister();
      for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
    })(),
  );
});
