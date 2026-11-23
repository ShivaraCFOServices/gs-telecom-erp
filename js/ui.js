/* UI helpers: tiny DOM builder, sheets, toasts, formatting, icons */
window.UI = (function () {
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'selected') el[k] = !!v;
      else el.setAttribute(k, v);
    });
    append(el, children);
    return el;
  }
  function append(el, children) {
    if (children === undefined || children === null || children === false) return;
    if (Array.isArray(children)) { children.forEach(function (c) { append(el, c); }); return; }
    if (children instanceof Node) { el.appendChild(children); return; }
    el.appendChild(document.createTextNode(String(children)));
  }
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function money(n, noDec) {
    n = Math.round((Number(n) || 0) * 100) / 100;
    var neg = n < 0; n = Math.abs(n);
    var parts = (noDec ? String(Math.round(n)) : n.toFixed(2)).split('.');
    var x = parts[0], last3 = x.slice(-3), rest = x.slice(0, -3);
    if (rest) last3 = ',' + last3;
    return (neg ? '-' : '') + '₹' + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + last3 + (parts[1] ? '.' + parts[1] : '');
  }
  function short(n) { n = Number(n) || 0; var a = Math.abs(n); if (a >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr'; if (a >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L'; if (a >= 1000) return '₹' + (n / 1000).toFixed(1) + 'k'; return money(n, true); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fdate(d) { if (!d) return ''; var p = String(d).slice(0, 10).split('-'); return p.length === 3 ? Number(p[2]) + ' ' + MON[Number(p[1]) - 1] + ' ' + p[0] : d; }
  function fdt(d) { if (!d) return ''; var s = String(d); return fdate(s) + (s.length > 10 ? ' ' + s.slice(11, 16) : ''); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function initials(name) { return String(name || '?').split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
  function num(v) { var n = parseFloat(String(v).replace(/[^\d.\-]/g, '')); return isNaN(n) ? 0 : n; }

  // ---- toast ----
  var toastT = null;
  function toast(msg, kind, ms) {
    var root = document.getElementById('toast-root');
    root.innerHTML = '';
    var el = h('div', { class: 'toast ' + (kind || '') }, msg);
    root.appendChild(el);
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.remove(); }, ms || (kind === 'err' ? 4500 : 2500));
  }

  // ---- bottom sheet ----
  var sheets = [];
  function sheet(title, body, opts) {
    opts = opts || {};
    var root = document.getElementById('sheet-root');
    var bg = h('div', { class: 'sheet-bg', onClick: function (e) { if (e.target === bg && !opts.sticky) close(); } });
    var closeBtn = h('button', { class: 'iconbtn', style: { color: '#6b6b70' }, 'aria-label': 'Close', onClick: function () { close(); } }, icon('x'));
    var box = h('div', { class: 'sheet' }, [h('div', { class: 'handle' }), title ? h('h3', null, [h('span', null, title), closeBtn]) : null, body]);
    bg.appendChild(box);
    root.appendChild(bg);
    sheets.push(bg);
    function close() { bg.remove(); sheets = sheets.filter(function (s) { return s !== bg; }); if (opts.onClose) opts.onClose(); }
    return { close: close, el: box };
  }
  function closeAllSheets() { sheets.forEach(function (s) { s.remove(); }); sheets = []; }
  function confirm(msg, okLabel) {
    return new Promise(function (resolve) {
      var s = sheet(null, h('div', null, [h('div', { class: 'b', style: { fontSize: '16px', marginBottom: '16px' } }, msg), h('div', { class: 'row' }, [h('button', { class: 'btn ghost', onClick: function () { s.close(); resolve(false); } }, t('cancel')), h('button', { class: 'btn gold', onClick: function () { s.close(); resolve(true); } }, okLabel || 'OK')])]));
    });
  }
  function prompt(title, label, placeholder) {
    return new Promise(function (resolve) {
      var inp = h('input', { placeholder: placeholder || '' });
      var s = sheet(title, h('div', null, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, label), inp]), h('div', { class: 'row' }, [h('button', { class: 'btn ghost', onClick: function () { s.close(); resolve(null); } }, t('cancel')), h('button', { class: 'btn gold', onClick: function () { s.close(); resolve(inp.value); } }, 'OK')])]));
      setTimeout(function () { inp.focus(); }, 50);
    });
  }

  // ---- icons (inline stroke SVG) ----
  var ICONS = {
    home: '<path d="M3 11l9-8 9 8v10H3z"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-5-6"/>', more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>', phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', wallet: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>', down: '<path d="M5 9l7 7 7-7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', scan: '<path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 8v8M11 8v8M14 8v8M17 8v8"/>', check: '<path d="M20 6L9 17l-5-5"/>', card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', bank: '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>', print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/>', share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>', lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', edit: '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M12 6l4 4"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>', logout: '<path d="M10 17l5-5-5-5M15 12H3M21 3v18"/>'
  };
  function icon(name, size) { var s = size || 22; var el = h('span', { html: '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>' }); el.style.display = 'inline-flex'; return el; }

  function topbar(title, sub, opts) {
    opts = opts || {};
    var left = opts.back ? h('a', { href: opts.back, class: 'iconbtn', 'aria-label': 'Back' }, icon('back')) : (opts.logo ? h('img', { src: 'icons/logo.png', alt: '', style: { width: '40px', height: '40px', borderRadius: '50%', boxShadow: '0 0 0 2px #F5B800' } }) : null);
    return h('div', { class: 'top' }, [h('div', { class: 'bar' }, [left, h('div', { class: 'grow' }, [h('div', { class: 'title' }, title), sub ? h('div', { class: 'sub' }, sub) : null]), opts.right || null]), opts.extra || null]);
  }
  function tabbar(active) {
    var tabs = [['#/home', 'home', t('home')], ['#/bills', 'search', t('bills_title')], ['#/parties', 'users', t('parties')], ['#/more', 'more', t('more')]];
    return h('nav', { class: 'tabbar' }, tabs.map(function (tb) { return h('a', { href: tb[0], class: active === tb[1] ? 'on' : '' }, [icon(tb[1]), tb[2]]); }));
  }
  function spinner() { return h('div', { class: 'empty' }, [h('span', { class: 'spin' })]); }

  return { h: h, esc: esc, money: money, short: short, fdate: fdate, fdt: fdt, today: today, initials: initials, num: num, toast: toast, sheet: sheet, closeAllSheets: closeAllSheets, confirm: confirm, prompt: prompt, icon: icon, topbar: topbar, tabbar: tabbar, spinner: spinner };
})();
