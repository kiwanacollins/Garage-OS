const SHELL_CACHE = "garageos-shell-v1";
const RUNTIME_CACHE = "garageos-runtime-v1";
const SHELL_ROUTES = ["/mechanic", "/manifest.webmanifest", "/icon.svg"];
const MECHANIC_API_PREFIXES = [
  "/api/v1/work-orders",
  "/api/v1/labour-logs",
  "/api/v1/parts-requests",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ROUTES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![SHELL_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, fallbackPath) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    if (request.mode === "navigate" && fallbackPath) {
      const fallback = await caches.match(fallbackPath);
      if (fallback) {
        return fallback;
      }
    }

    throw new Error("Offline cache miss");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate" && url.pathname === "/mechanic") {
    event.respondWith(networkFirst(request, "/mechanic"));
    return;
  }

  if (MECHANIC_API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(networkFirst(request));
    return;
  }
});
