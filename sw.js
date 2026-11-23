/* Service worker: app-shell cache + instant update. Bump CACHE on each release (build script does it). */
var CACHE = 'gs-erp-v2.1.1';
var SHELL = ['./', './index.html', './css/app.css', './js/config.js', './js/i18n.js', './js/ui.js', './js/api.js', './js/bill.js', './js/screens.js', './js/screens2.js', './js/screens3.js', './js/screens4.js', './js/screens5.js', './js/app.js', './manifest.json', './icons/logo.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('message', function (e) { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // API calls (POST, other origin) always go to network
  e.respondWith(caches.match(e.request).then(function (hit) {
    var fetched = fetch(e.request).then(function (res) { if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); } return res; }).catch(function () { return hit; });
    return hit || fetched; // stale-while-revalidate: instant load, fresh next time
  }));
});
