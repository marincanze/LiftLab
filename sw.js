/* Offline cache for the whole app (network-first so updates arrive when online, cache otherwise). */
const CACHE = 'liftlab-v5';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/i18n.js', 'js/data.js', 'js/engine.js', 'js/anim.js', 'js/store.js', 'js/app.js', 'js/profile.js', 'js/settings.js', 'js/session.js', 'js/views.js', 'js/boot.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });

/* Timer notifications: the page sends the end time of the running rest / warm-up timer; the worker stays awake until
 * then and shows the notification itself, so it also arrives when the page is frozen in the background. */
let timer = null;
function cancelTimer() { if (timer) { clearTimeout(timer.id); timer.done(); timer = null; } }
self.addEventListener('message', e => {
  const m = e.data || {};
  if (m.type === 'timer-cancel') { cancelTimer(); return; }
  if (m.type !== 'timer') return;
  cancelTimer();
  e.waitUntil(new Promise(done => {
    const id = setTimeout(async () => {
      timer = null;
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (!wins.some(c => c.visibilityState === 'visible')) {
        await self.registration.showNotification('LiftLab', { body: m.body, tag: 'liftlab-timer', renotify: true, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', vibrate: [250, 120, 250, 120, 400] });
      }
      done();
    }, Math.max(0, m.at - Date.now()));
    timer = { id, done };
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => (wins.length ? wins[0].focus() : self.clients.openWindow('./'))));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
