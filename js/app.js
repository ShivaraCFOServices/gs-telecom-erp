/* App shell: hash router, auth guard, PWA install/update */
window.App = (function () {
  var root = document.getElementById('app');
  var ROUTES = {
    'login': function () { return Screens.login(); },
    'home': function () { return Screens.home(); },
    'sale': function () { return Screens.sale(); },
    'stock': function (p) { return Screens.stock(p); },
    'stock/units': function (p, rest) { return Screens.stockUnits({ id: rest[0] }); },
    'purchase': function () { return Screens.purchase(); },
    'bills': function (p) { return Screens.bills(p); },
    'pending': function (p) { return Screens.pending(p); },
    'parties': function () { return Screens.parties(); },
    'reports': function (p) { return Screens.reports(p); },
    'expense': function () { return Screens.expense(); },
    'accounts': function () { return Screens.accounts(); },
    'ledgers': function () { return Screens.ledgers(); },
    'book': function (p, rest) { return Screens.book({ id: rest[0] }); },
    'repair': function (p) { return Screens.repair(p); },
    'purchases': function () { return Screens.purchases(); },
    'gst': function (p) { return Screens.gst(p); },
    'tally': function (p) { return Screens.tally(p); },
    'customfields': function () { return Screens.customFields(); },
    'import': function () { return Screens.importData(); },
    'console': function () { return Screens.console(); },
    'notes': function () { return Screens.notes(); },
    'more': function () { return Screens.more(); },
    'settings': function () { return Screens.settings(); },
    'users': function () { return Screens.users(); },
    'locks': function () { return Screens.locks(); },
    'review': function () { return Screens.review(); },
    'audit': function () { return Screens.audit(); },
    'password': function () { return Screens.password(); }
  };
  function parse() {
    var hsh = location.hash.replace(/^#\/?/, '') || 'home';
    var q = {}, qi = hsh.indexOf('?');
    if (qi >= 0) { hsh.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); }); hsh = hsh.slice(0, qi); }
    var parts = hsh.split('/');
    var route = ROUTES[parts.slice(0, 2).join('/')] ? parts.slice(0, 2).join('/') : parts[0];
    var rest = ROUTES[parts.slice(0, 2).join('/')] ? parts.slice(2) : parts.slice(1);
    return { route: route, params: q, rest: rest };
  }
  function render() {
    var r = parse();
    if (!API.state.user && r.route !== 'login') { location.hash = '#/login'; return; }
    if (API.state.user && r.route === 'login') { location.hash = '#/home'; return; }
    var fn = ROUTES[r.route] || ROUTES.home;
    UI.closeAllSheets();
    var draw = function () {
      try { var el = fn(r.params, r.rest); root.innerHTML = ''; root.appendChild(el); window.scrollTo(0, 0); }
      catch (e) { console.error(e); root.innerHTML = ''; root.appendChild(UI.h('div', { class: 'content' }, UI.h('div', { class: 'note red' }, e.message))); }
    };
    if (API.state.user && !API.state.masters && r.route !== 'login') { API.masters().then(draw, draw); } else draw();
  }
  window.addEventListener('hashchange', render);
  document.addEventListener('masters-updated', function () { /* silent refresh of cached masters */ });

  // ---- PWA: service worker + update banner ----
  function setupPwa() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      reg.addEventListener('updatefound', function () { var nw = reg.installing; nw && nw.addEventListener('statechange', function () { if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdate(); }); });
      setInterval(function () { reg.update(); }, 5 * 60 * 1000);
    }).catch(function () { });
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (refreshing) return; refreshing = true; location.reload(); });
  }
  function showUpdate() {
    if (document.querySelector('.updbar')) return;
    var bar = UI.h('div', { class: 'updbar', onClick: function () { navigator.serviceWorker.getRegistration().then(function (reg) { if (reg && reg.waiting) reg.waiting.postMessage('SKIP_WAITING'); else location.reload(); }); } }, t('update_available'));
    document.body.appendChild(bar);
  }
  var deferredInstall = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; });
  function install() { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; } }

  function boot() {
    setupPwa();
    API.restore().then(function () { if (!location.hash) location.hash = API.state.user ? '#/home' : '#/login'; render(); });
  }
  boot();
  return { render: render, install: install };
})();
