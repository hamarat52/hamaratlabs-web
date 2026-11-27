/* Demo: offline cache for the app shell. Generated at build. */
const PREFIX = 'agent-market:' + new URL(self.registration.scope).pathname + ':';
const CACHE = PREFIX + '6ad4472f7b9b';
const SHELL = ["./","index.html","assets/index-0PISwTAp.js","assets/archivo-C_XDQD9H.woff2","assets/index-BhwYKuuw.css","assets/jetbrains-mono-C5_QY4WZ.woff2","favicon.svg","manifest.webmanifest","icon-192.png","icon-512.png"];
const scoped = (p) => new URL(p, self.registration.scope).href;
const SHELL_URLS = new Set(SHELL.map(scoped));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL.map((p) => new Request(scoped(p), { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  url.hash = '';
  url.search = '';
  const scope = self.registration.scope;
  if (!url.href.startsWith(scope)) return;
  const key = req.mode === 'navigate' && (url.href === scope || url.href === scoped('index.html')) ? scoped('index.html') : url.href;
  if (!SHELL_URLS.has(key)) return;
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(key).then((hit) => (hit && hit.redirected ? new Response(hit.body, { status: hit.status, statusText: hit.statusText, headers: hit.headers }) : hit) || fetch(req).then((res) => {
        if (res.ok) cache.put(key, res.clone());
        return res;
      })),
    ),
  );
});
