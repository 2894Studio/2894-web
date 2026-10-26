// Service worker de 2894_: guarda la web completa para que la app instalada funcione sin conexión.
const CACHE = "2894-v1";
const SHELL = ["/", "/manifest.webmanifest", "/poster.jpg", "/icons/icon-192.png", "/icons/icon-512.png", "/apple-icon.png"];

// Rastrea la página: HTML → scripts, estilos, fuentes e imágenes; JS y CSS → chunks cargados bajo demanda.
async function precache() {
  const cache = await caches.open(CACHE);
  const seen = new Set();
  const queue = [...SHELL];
  while (queue.length) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    let res;
    try {
      res = await fetch(url, { cache: "no-cache" });
    } catch {
      continue;
    }
    if (!res.ok) continue;
    await cache.put(url, res.clone());
    const type = res.headers.get("content-type") || "";
    if (!/html|javascript|css/.test(type)) continue;
    const text = await res.text();
    const found = new Set();
    for (const m of text.matchAll(/\/_next\/static\/[\w./@~-]+?\.(?:js|css|woff2)/g)) found.add(m[0]);
    for (const m of text.matchAll(/["'(]static\/(?:chunks|media)\/[\w./@~-]+?\.(?:js|css|woff2)/g)) found.add("/_next/" + m[0].slice(1));
    for (const m of text.matchAll(/\/stock\/[\w.-]+\.jpg/g)) found.add(m[0]);
    if (type.includes("css")) {
      const base = new URL(url, self.location.origin);
      for (const m of text.matchAll(/url\(([^)"']+)\)/g)) if (!m[1].startsWith("data:")) found.add(new URL(m[1], base).pathname);
    }
    for (const f of found) if (!seen.has(f)) queue.push(f);
  }
}

self.addEventListener("install", (e) => {
  e.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

let refreshing = null;
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return; // YouTube y externos: sin tocar

  // Páginas: red primero (contenido al día); sin conexión, la copia guardada.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          // Tras un despliegue nuevo, guarda en segundo plano los chunks que hayan cambiado.
          if (!refreshing) refreshing = precache().finally(() => (refreshing = null));
          return res;
        })
        .catch(() => caches.match("/", { ignoreSearch: true })),
    );
    return;
  }

  // Archivos con hash, imágenes e iconos: caché primero (no cambian).
  if (/^\/(_next\/static|stock|icons)\//.test(url.pathname) || url.pathname === "/poster.jpg") {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Resto del mismo origen: copia guardada al instante y actualización en segundo plano.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});
