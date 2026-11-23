/* API client. Real mode: POST to Apps Script. Demo mode: run the real backend code in-browser (demo-backend.js). */
window.API = (function () {
  var cfg = window.APP_CONFIG || {};
  var shopParam = (location.search.match(/[?&]shop=([a-z0-9-]+)/i) || [])[1];
  if (shopParam) { localStorage.setItem('gs_shop', shopParam); }
  var shopCode = localStorage.getItem('gs_shop') || cfg.SHOP_CODE || 'shop';
  if (cfg.SHOPS && cfg.SHOPS[shopCode]) cfg.API_URL = cfg.SHOPS[shopCode];
  var KEY = 'gs_' + shopCode;
  var state = { token: localStorage.getItem(KEY + '_token') || '', user: null, settings: {}, masters: null, demo: !cfg.API_URL, serverVersion: '' };
  var device = (navigator.userAgent.indexOf('Mobile') >= 0 ? 'mobile' : 'desktop') + ' ' + (navigator.platform || '');
  var demoReady = null;

  function loadDemo() {
    if (demoReady) return demoReady;
    demoReady = new Promise(function (resolve, reject) {
      if (window.DemoBackend) return resolve();
      var s = document.createElement('script'); s.src = 'js/demo-backend.js'; s.onload = function () { resolve(); }; s.onerror = function () { reject(new Error('demo backend load failed')); };
      document.head.appendChild(s);
    }).then(function () { window.DemoBackend.init(KEY); });
    return demoReady;
  }

  function call(action, data, opts) {
    opts = opts || {};
    var body = JSON.stringify({ action: action, token: state.token, data: data || {}, device: device });
    var p;
    if (state.demo) {
      p = loadDemo().then(function () { return new Promise(function (r) { setTimeout(r, 120); }); }).then(function () { return JSON.parse(window.DemoBackend.doPost(body)); });
    } else {
      p = fetch(cfg.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body, redirect: 'follow' })
        .then(function (r) { return r.json(); })
        .catch(function (e) { throw new Error(navigator.onLine ? t('err_generic') + ' (' + e.message + ')' : t('offline')); });
    }
    return p.then(function (res) {
      if (res.version) state.serverVersion = res.version;
      if (!res.ok) {
        if (res.code === 401 && action !== 'auth.login') { logoutLocal(); location.hash = '#/login'; }
        var err = new Error(res.error || t('err_generic')); err.code = res.code; throw err;
      }
      return res.data;
    });
  }

  function login(username, password) {
    return call('auth.login', { username: username, password: password }).then(function (d) {
      state.token = d.token; state.user = d.user; state.settings = d.settings || {};
      localStorage.setItem(KEY + '_token', d.token);
      localStorage.setItem(KEY + '_user', JSON.stringify(d.user));
      localStorage.setItem(KEY + '_lastuser', username);
      return d;
    });
  }
  function restore() {
    if (!state.token) return Promise.resolve(null);
    try { state.user = JSON.parse(localStorage.getItem(KEY + '_user') || 'null'); } catch (e) { state.user = null; }
    return call('auth.me').then(function (d) { state.user = d.user; state.settings = d.settings || {}; localStorage.setItem(KEY + '_user', JSON.stringify(d.user)); return d; }).catch(function () { logoutLocal(); return null; });
  }
  function logout() { return call('auth.logout').catch(function () { }).then(logoutLocal); }
  function logoutLocal() { state.token = ''; state.user = null; state.masters = null; localStorage.removeItem(KEY + '_token'); localStorage.removeItem(KEY + '_user'); }
  function lastUser() { return localStorage.getItem(KEY + '_lastuser') || ''; }
  function can(perm) { var u = state.user; if (!u) return false; return u.role === 'super_admin' || (u.permissions || []).indexOf(perm) >= 0; }

  /** Masters cached in memory + localStorage; refreshed after any master write. */
  function masters(force) {
    if (!force && state.masters) return Promise.resolve(state.masters);
    if (!force) { try { var c = JSON.parse(localStorage.getItem(KEY + '_masters') || 'null'); if (c && c.ts > Date.now() - 10 * 60 * 1000) { state.masters = c.data; refreshMastersSoon(); return Promise.resolve(c.data); } } catch (e) { /* ignore */ } }
    return call('masters.all').then(function (m) { state.masters = m; try { localStorage.setItem(KEY + '_masters', JSON.stringify({ ts: Date.now(), data: m })); } catch (e) { /* quota */ } return m; });
  }
  var refreshT = null;
  function refreshMastersSoon() { clearTimeout(refreshT); refreshT = setTimeout(function () { masters(true).then(function () { document.dispatchEvent(new CustomEvent('masters-updated')); }); }, 800); }
  function invalidateMasters() { state.masters = null; localStorage.removeItem(KEY + '_masters'); }

  return { state: state, call: call, login: login, restore: restore, logout: logout, lastUser: lastUser, can: can, masters: masters, invalidateMasters: invalidateMasters, KEY: KEY };
})();
