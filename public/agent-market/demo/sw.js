/* Agent market demo: offline cache for the app shell. Generated at build. */
const PREFIX = 'agent-market:' + new URL(self.registration.scope).pathname + ':';
const CACHE = PREFIX + '01e10eb7cb0f';
const SHELL = ["./","index.html","assets/index-W6Ppb0sM.js","assets/index-DVUFMzBL.css","favicon.svg","manifest.webmanifest"];
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
      cache.match(key).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) cache.put(key, res.clone());
        return res;
      })),
    ),
  );
});
