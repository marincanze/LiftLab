/* Offline cache for the whole app (network-first so updates arrive when online, cache otherwise). */
const CACHE = 'liftlab-v2';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/i18n.js', 'js/data.js', 'js/engine.js', 'js/anim.js', 'js/store.js', 'js/app.js', 'js/profile.js', 'js/settings.js', 'js/session.js', 'js/views.js', 'js/boot.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
