/* Screens part 1: Login, Home, Sale (3-step), Stock */
window.Screens = window.Screens || {};
(function (S) {
  var h = UI.h, icon = UI.icon, money = UI.money;

  // ---------------- LOGIN ----------------
  S.login = function () {
    var last = API.lastUser();
    var userInp = h('input', { placeholder: t('username'), value: last, autocapitalize: 'none', autocomplete: 'username' });
    var pwInp = h('input', { type: 'password', placeholder: t('password'), autocomplete: 'current-password' });
    var btn = h('button', { class: 'btn gold', onClick: doLogin }, t('login'));
    var userBox = last ? h('div', { class: 'userbox' }, [h('div', { class: 'avatar', style: { background: '#F5B800', borderRadius: '50%' } }, UI.initials(last)), h('div', { style: { flex: 1 } }, [h('div', { class: 'b' }, last), h('div', { class: 'small mute' }, t('username'))]), h('button', { class: 'goldc b small', onClick: function () { userBox.replaceWith(h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('username')), userInp])); userInp.value = ''; userInp.focus(); } }, t('change_user'))]) : h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('username')), userInp]);
    function doLogin() {
      var u = userInp.value.trim(), p = pwInp.value;
      if (!u || !p) return UI.toast(t('username') + ' + ' + t('password'), 'err');
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
      API.login(u, p).then(function () { API.invalidateMasters(); location.hash = '#/home'; }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; btn.textContent = t('login'); });
    }
    pwInp.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
    var langRow = h('div', { class: 'lang' }, [h('span', { style: { border: 0, cursor: 'default' } }, t('language') + ':'), h('span', { class: LANG === 'hinglish' ? 'on' : '', onClick: function () { setLang('hinglish'); App.render(); } }, 'Hinglish'), h('span', { class: LANG === 'english' ? 'on' : '', onClick: function () { setLang('english'); App.render(); } }, 'English')]);
    setTimeout(function () { (last ? pwInp : userInp).focus(); }, 50);
    return h('div', { class: 'login' }, [
      h('div', { class: 'hero' }, [h('img', { src: 'icons/logo.png', alt: '' }), h('h1', null, ['GS ', h('span', null, 'TELECOM')]), h('div', { class: 'small', style: { color: '#bdbdbd', letterSpacing: '2px', textTransform: 'uppercase' } }, 'Shop App')]),
      h('div', { class: 'panel' }, [h('div', { style: { fontSize: '20px', fontWeight: 800 } }, t('welcome') + (last ? ', ' + last : '') + ' 👋'), userBox, h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('password')), pwInp]), btn, h('label', { class: 'row small', style: { color: '#444' } }, [h('input', { type: 'checkbox', checked: true, style: { flex: '0 0 20px' } }), h('span', null, t('remember'))]), h('div', { style: { flex: 1 } }), langRow, h('div', { class: 'center xs mute' }, t('session_note')), API.state.demo ? h('div', { class: 'note xs mt' }, t('demo_banner')) : null])
    ]);
  };

  // ---------------- HOME ----------------
  S.home = function () {
    var u = API.state.user;
    var wrap = h('div');
    var kpis = h('div', { class: 'kpis' }, [kpi(t('today_sale'), '…', ''), kpi(t('cash_in_hand'), '…', ''), kpi(t('receivable'), '…', '')]);
    var recent = h('div', { class: 'card pad0 list' }, UI.spinner());
    var trend = h('div', { class: 'card hide' });
    var langBtn = h('button', { class: 'pillbtn', onClick: function () { setLang(LANG === 'hinglish' ? 'english' : 'hinglish'); App.render(); } }, LANG === 'hinglish' ? 'Hinglish' : 'English');
    wrap.appendChild(UI.topbar(API.state.settings.shop_name || 'GS Telecom', (u ? u.name : '') + ' · ' + UI.fdate(UI.today()), { logo: true, right: langBtn, extra: kpis }));
    var tiles = [
      API.can('purchase') ? tile('#/purchase', 'box', t('purchase'), t('purchase_s'), 'var(--blue-t)', 'var(--blue)') : null,
      API.can('stock') ? tile('#/stock', 'phone', t('stock'), '…', 'var(--green-t)', 'var(--green)', 'stock') : null,
      API.can('expense') ? tile('#/expense', 'wallet', t('expense'), t('expense_s'), 'var(--red-t)', 'var(--red)') : null,
      API.can('sale') ? tile('#/repair', 'edit', LANG === 'hinglish' ? 'Repair' : 'Repair', '…', 'var(--purple-t)', 'var(--purple)', 'repair') : null,
      tile('#/pending', 'clock', LANG === 'hinglish' ? 'Lena / Dena' : 'Outstanding', '…', 'var(--gold-t)', 'var(--gold-d)', 'pending'),
      API.can('reports') || API.can('sale') ? tile('#/reports', 'chart', t('reports'), t('reports_s'), 'var(--soft)', '#444') : null
    ];
    var content = h('div', { class: 'content' }, [
      API.can('sale') ? h('a', { href: '#/sale', class: 'bigbtn' }, [h('div', { class: 'ic' }, icon('plus', 26)), h('div', null, [h('div', { class: 't' }, t('new_bill')), h('div', { class: 's' }, t('new_bill_s'))])]) : null,
      h('div', { class: 'tiles' }, tiles), trend,
      h('div', { class: 'sec' }, [h('span', null, t('todays_bills')), h('a', { href: '#/bills', class: 'goldc', style: { textTransform: 'none', letterSpacing: 0 } }, t('bills_title') + ' →')]), recent
    ]);
    wrap.appendChild(content); wrap.appendChild(UI.tabbar('home'));
    API.call('reports.dashboard').then(function (d) {
      kpis.innerHTML = '';
      kpis.appendChild(kpi(t('today_sale'), money(d.today.sales, true), d.today.bills + ' ' + t('bills'), true));
      kpis.appendChild(kpi(t('cash_in_hand'), money(d.cash_in_hand, true), t('margin') + ' ' + money(d.today.margin, true)));
      kpis.appendChild(kpi(t('receivable'), money(d.receivable.finance + d.receivable.udhar, true), 'Finance ' + UI.short(d.receivable.finance) + ' · Udhar ' + UI.short(d.receivable.udhar), false, '#/pending'));
      var st = wrap.querySelector('[data-tile=stock] .s'); if (st) st.textContent = d.stock.phones + ' ' + t('phones') + ' · ' + UI.short(d.stock.value) + (d.stock.aged90 ? ' · ' + d.stock.aged90 + ' ×90d' : '');
      var rp = wrap.querySelector('[data-tile=repair] .s'); if (rp) rp.textContent = (d.open_jobs || 0) + (LANG === 'hinglish' ? ' job chal rahe' : ' open jobs');
      var pd = wrap.querySelector('[data-tile=pending] .s'); if (pd) pd.textContent = (LANG === 'hinglish' ? 'Lena ' : 'Due ') + UI.short(d.receivable.udhar + d.receivable.finance) + ' · ' + (LANG === 'hinglish' ? 'Dena ' : 'Pay ') + UI.short(d.payable);
      if (d.license && d.license.valid_till && d.license.valid_till < UI.today()) wrap.querySelector('.content').insertBefore(h('div', { class: 'note red mb' }, LANG === 'hinglish' ? 'Plan expire ho gaya — sirf dekh sakte hain. Accountant se baat karein.' : 'Plan expired — read-only. Contact your accountant.'), wrap.querySelector('.content').firstChild);
      if (d.trend && d.trend.length > 1) { var max = Math.max.apply(null, d.trend.map(function (x) { return x.total; })) || 1; trend.className = 'card'; trend.appendChild(h('div', { class: 'sec', style: { margin: '0 0 8px' } }, [h('span', null, '30 ' + t('days')), h('span', null, money(d.month.sales, true) + ' · ' + d.month.bills + ' ' + t('bills'))])); trend.appendChild(h('div', { class: 'trend' }, d.trend.map(function (x) { return h('i', { class: x.total ? '' : 'z', style: { height: Math.max(3, x.total / max * 60) + 'px' }, title: x.date + ' ' + money(x.total, true) }); }))); }
      recent.innerHTML = '';
      if (!d.recent.length) recent.appendChild(h('div', { class: 'empty' }, t('no_match')));
      d.recent.forEach(function (s) { recent.appendChild(billRow(s)); });
      if (d.review_open) UI.toast(d.review_open + ' review items', '', 2000);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
    return wrap;
  };
  function kpi(k, v, s, gold, href) { var el = h(href ? 'a' : 'div', { class: 'kpi', href: href }, [h('div', { class: 'k' }, k), h('div', { class: 'v' + (gold ? ' g' : '') }, v), s ? h('div', { class: 's' }, s) : null]); return el; }
  function tile(href, ic, title, sub, bg, fg, key) { return h('a', { href: href, class: 'tile', 'data-tile': key || '' }, [h('div', { class: 'ic', style: { background: bg, color: fg } }, icon(ic)), h('div', { class: 't' }, title), h('div', { class: 's' }, sub)]); }
  function billRow(s) {
    return h('div', { class: 'item click', onClick: function () { Screens.billSheet(s.id); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, s.bill_no + ' · ' + (s.cust_name || t('walkin'))), h('div', { class: 's' }, (s.doc_type === 'CreditNote' ? 'CREDIT NOTE · ' : '') + (s.items || '') + (s.status === 'Cancelled' ? ' · CANCELLED' : ''))]), h('div', { class: 'amt', style: s.status === 'Cancelled' ? { textDecoration: 'line-through', color: '#999' } : null }, [money(s.total, true), s.pending > 0 ? h('div', { class: 's red' }, t('balance') + ' ' + money(s.pending, true)) : null, s.locked ? h('div', { class: 's' }, '🔒') : null])]);
  }
  S.billRow = billRow;

  // ---------------- SALE ----------------
  var DRAFT_KEY = 'gs_sale_draft';
  function loadDraft() { try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null') || { step: 1, lines: [], extra: [], payments: [], customer: null, exchange: null, template: '' }; } catch (e) { return { step: 1, lines: [], extra: [], payments: [], customer: null, exchange: null, template: '' }; } }
  function saveDraft(d) { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); }
  function clearDraft() { sessionStorage.removeItem(DRAFT_KEY); }
  function lineAmount(l) { return (Number(l.qty) || 1) * (Number(l.rate_incl) || 0); }
  function saleTotal(d) { var g = d.lines.reduce(function (a, l) { return a + lineAmount(l); }, 0) + d.extra.reduce(function (a, x) { return a + (Number(x.amount) || 0); }, 0); return Math.round(g); }

  S.sale = function () {
    var d = loadDraft();
    if (d.result) return saleDone(d);
    return d.step === 2 ? salePayment(d) : saleItems(d);
  };

  function saleHeader(d, step) {
    return UI.topbar(t('new_bill'), (d.result ? d.result.sale.bill_no : (API.state.masters ? nextBillNo() : '')) + ' · ' + UI.fdate(UI.today()), { back: step === 1 ? '#/home' : '#/sale', extra: h('div', null, [h('div', { class: 'steps' }, [h('i', { class: 'on' }), h('i', { class: step >= 2 ? 'on' : '' }), h('i', { class: step >= 3 ? 'on' : '' })]), h('div', { class: 'steplbl', style: { marginTop: '6px' } }, [h(step === 1 ? 'b' : 'span', null, t('step_item')), h(step === 2 ? 'b' : 'span', null, t('step_pay')), h(step === 3 ? 'b' : 'span', null, t('step_print'))])]) });
  }
  function nextBillNo() { var seq = (API.state.masters.sequences || []).filter(function (s) { return s.series === 'INV'; })[0]; return seq ? seq.prefix + String(seq.next_no).padStart(3, '0') : ''; }

  function saleItems(d) {
    var wrap = h('div');
    wrap.appendChild(saleHeader(d, 1));
    var results = h('div');
    var q = h('input', { placeholder: t('search_item_ph'), autocomplete: 'off', inputmode: 'search' });
    var searchT = null;
    q.addEventListener('input', function () { clearTimeout(searchT); searchT = setTimeout(function () { runSearch(q.value); }, 250); });
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter') runSearch(q.value, true); });
    function runSearch(text, enter) {
      text = (text || '').trim();
      if (text.length < 2) { results.innerHTML = ''; return; }
      results.innerHTML = ''; results.appendChild(UI.spinner());
      API.call('stock.search', { q: text }).then(function (r) {
        results.innerHTML = '';
        if (r.exact_imei && enter) { addUnitLine(r.exact_imei); q.value = ''; return; }
        var list = h('div', { class: 'card pad0 list' });
        r.groups.forEach(function (g) {
          list.appendChild(h('div', { class: 'item click', onClick: function () { pickGroup(g); } }, [h('div', { class: 'avatar', style: { background: 'var(--blue-t)', color: 'var(--blue)' } }, UI.initials(g.brand)), h('div', { class: 'grow' }, [h('div', { class: 't' }, g.full_name), h('div', { class: 's' }, g.qty + ' in stock · ' + money(g.sale_price, true) + (g.item_type === 'Quantity' ? ' · qty item' : ''))]), icon('chev')]));
        });
        list.appendChild(h('button', { class: 'item click', style: { background: 'var(--gold-t)', width: '100%', textAlign: 'left' }, onClick: function () { newItemSheet(text, function (variant) { afterCreateVariant(variant); }); } }, [h('div', { class: 'avatar', style: { background: 'var(--gold)', color: '#111', fontSize: '20px' } }, '+'), h('div', { class: 'grow' }, [h('div', { class: 't' }, t('new_item_create') + ': "' + text + '"'), h('div', { class: 's', style: { color: '#7a5a00' } }, t('create_hint'))])]));
        if (!r.groups.length) list.insertBefore(h('div', { class: 'empty' }, t('no_match')), list.firstChild);
        results.appendChild(list);
      }).catch(function (e) { results.innerHTML = ''; UI.toast(e.message, 'err'); });
    }
    function pickGroup(g) {
      if (g.item_type === 'Quantity') { d.lines.push({ variant_id: g.variant_id, name: g.full_name, qty: 1, rate_incl: g.sale_price || 0, min_price: g.min_price, cost: g.avg_cost || 0, item_type: 'Quantity' }); saveDraft(d); App.render(); return; }
      if (g.units.length === 1) { addUnit(g, g.units[0]); return; }
      var s = UI.sheet(g.full_name + ' — ' + t('imei_list'), h('div', { class: 'card pad0 list' }, g.units.map(function (u) { return h('div', { class: 'item click', onClick: function () { s.close(); addUnit(g, u); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, '…' + String(u.imei1).slice(-6) + (u.colour ? ' · ' + u.colour : '')), h('div', { class: 's' }, t('landing') + ' ' + money(u.landing_cost, true) + ' · ' + u.age_days + ' ' + t('days') + (u.condition === 'Old' ? ' · ' + t('old') + ' ' + (u.grade || '') : ''))]), icon('chev')]); })));
    }
    function addUnit(g, u) { if (d.lines.some(function (l) { return l.unit_id === u.id; })) return UI.toast('Already in bill', 'err'); d.lines.push({ variant_id: g.variant_id, unit_id: u.id, imei: u.imei1, name: g.full_name + (u.condition === 'Old' ? ' (Pre-owned)' : ''), colour: u.colour, age: u.age_days, qty: 1, rate_incl: g.sale_price || 0, min_price: g.min_price, cost: u.landing_cost, item_type: 'Serialized', condition: u.condition }); saveDraft(d); App.render(); }
    function addUnitLine(u) { addUnit({ variant_id: u.variant_id, full_name: u.full_name, sale_price: u.sale_price, min_price: u.min_price }, { id: u.id, imei1: u.imei1, colour: u.colour, age_days: u.age_days, landing_cost: u.landing_cost, condition: u.condition }); }
    function afterCreateVariant(v) {
      if (v.item_type === 'Quantity' || v.category === 'Service') { d.lines.push({ variant_id: v.id, name: v.full_name, qty: 1, rate_incl: v.sale_price || 0, min_price: v.min_price, cost: 0, item_type: 'Quantity' }); saveDraft(d); App.render(); return; }
      quickStockIn(v, function (unit) { addUnit({ variant_id: v.id, full_name: v.full_name, sale_price: v.sale_price, min_price: v.min_price }, unit); });
    }

    var lineList = h('div', null, d.lines.map(function (l, i) {
      var price = h('input', { value: l.rate_incl || '', inputmode: 'numeric', style: { height: '44px', fontWeight: 800, fontSize: '17px' }, onInput: function () { l.rate_incl = UI.num(price.value); saveDraft(d); marginEl.textContent = marginText(l); } });
      var marginEl = h('div', { class: 'b green', style: { height: '44px', display: 'flex', alignItems: 'center' } }, marginText(l));
      var qty = l.item_type === 'Quantity' ? h('input', { value: l.qty, inputmode: 'numeric', style: { height: '44px', width: '70px', textAlign: 'center', fontWeight: 700 }, onInput: function () { l.qty = UI.num(qty.value) || 1; saveDraft(d); marginEl.textContent = marginText(l); } }) : null;
      return h('div', { class: 'line' }, [
        h('div', { class: 'row', style: { alignItems: 'flex-start' } }, [h('div', { style: { flex: 1 } }, [h('div', { class: 'b', style: { fontSize: '15px' } }, l.name), h('div', { class: 'small mute' }, l.imei ? 'IMEI …' + String(l.imei).slice(-6) + (l.colour ? ' · ' + l.colour : '') + ' · ' + l.age + ' ' + t('days') : t('qty') + ' item')]), h('button', { class: 'iconbtn', style: { background: 'var(--soft)', color: 'var(--mute)', flex: '0 0 36px', width: '36px', height: '36px' }, 'aria-label': t('remove'), onClick: function () { d.lines.splice(i, 1); saveDraft(d); App.render(); } }, icon('x', 16))]),
        h('div', { class: 'row' }, [h('div', { style: { flex: 2 } }, [h('label', { class: 'lbl' }, t('price_incl')), price]), qty ? h('div', { style: { flex: '0 0 auto' } }, [h('label', { class: 'lbl' }, t('qty')), qty]) : null, h('div', { style: { flex: 1, textAlign: 'right' } }, [h('label', { class: 'lbl' }, t('margin')), marginEl])]),
        l.min_price ? h('div', { class: 'xs mute' }, t('min_price') + ' ' + money(l.min_price, true) + (l.rate_incl < l.min_price ? ' ✗' : ' ✔')) : null
      ]);
    }));
    function marginText(l) { var m = lineAmount(l) / 1.18 - (Number(l.cost) || 0) * (Number(l.qty) || 1); return (m >= 0 ? '+ ' : '− ') + money(Math.abs(m), true); }

    var extraList = h('div', null, d.extra.map(function (x, i) { return h('div', { class: 'line', style: { borderLeftColor: '#bdbdbd' } }, [h('div', { class: 'row' }, [h('div', { style: { flex: 1 } }, [h('div', { class: 'b' }, x.description), h('div', { class: 'small mute' }, 'GST ' + (x.gst_rate || 0) + '%')]), h('div', { class: 'b' }, money(x.amount)), h('button', { class: 'iconbtn', style: { background: 'var(--soft)', color: 'var(--mute)', flex: '0 0 36px', width: '36px', height: '36px' }, onClick: function () { d.extra.splice(i, 1); saveDraft(d); App.render(); } }, icon('x', 16))])]); }));

    var cust = d.customer;
    var custBox = h('div', { class: 'card click', style: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }, onClick: function () { customerSheet(d, function () { saveDraft(d); App.render(); }); } }, [h('div', { class: 'avatar', style: { background: cust ? 'var(--blue-t)' : 'var(--soft)', color: 'var(--blue)', borderRadius: '50%' } }, cust ? UI.initials(cust.name) : '?'), h('div', { class: 'grow', style: { flex: 1 } }, [h('div', { class: 'b' }, cust ? cust.name : t('walkin')), h('div', { class: 'small mute' }, cust ? ((cust.mobile || '') + (cust.gstin ? ' · ' + cust.gstin : '')) : t('customer_opt'))]), h('span', { class: 'goldc b small' }, cust ? t('change_user') : '+')]);

    var cfs = ((API.state.masters && API.state.masters.customFields) || []).filter(function (f) { return f.screen === 'Sale'; });
    d.extra_fields = d.extra_fields || {};
    var cfBox = cfs.length ? h('div', { class: 'card', style: { marginTop: '10px' } }, [h('div', { class: 'sec', style: { margin: '0 0 8px' } }, [h('span', null, t('more'))])].concat(cfs.map(function (f) { var inp = f.type === 'select' ? h('select', null, [h('option', { value: '' }, '—')].concat(String(f.options || '').split('|').filter(Boolean).map(function (o) { return h('option', { value: o, selected: d.extra_fields[f.id] === o }, o); }))) : f.type === 'yesno' ? h('select', null, [h('option', { value: '' }, '—'), h('option', { value: 'Yes', selected: d.extra_fields[f.id] === 'Yes' }, 'Yes'), h('option', { value: 'No', selected: d.extra_fields[f.id] === 'No' }, 'No')]) : h('input', { type: f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text', value: d.extra_fields[f.id] || '' }); inp.addEventListener('change', function () { d.extra_fields[f.id] = inp.value; saveDraft(d); }); return h('div', { class: 'field' }, [h('label', { class: 'lbl' }, f.label + (f.required === true || f.required === 'true' ? ' *' : '')), inp]); }))) : null;
    var exBox = d.exchange ? h('div', { class: 'note', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [h('div', null, [h('div', { class: 'b' }, t('exchange_title') + ': ' + d.exchange.brand_name + ' ' + d.exchange.model_name), h('div', { class: 'small' }, 'IMEI ' + d.exchange.imei + ' · − ' + money(d.exchange.value, true))]), h('button', { class: 'iconbtn', style: { color: 'var(--mute)' }, onClick: function () { d.exchange = null; saveDraft(d); App.render(); } }, icon('x', 16))]) : null;

    var total = saleTotal(d);
    var content = h('div', { class: 'content' }, [
      h('div', { class: 'search' }, [icon('search'), q, h('button', { class: 'scan', 'aria-label': 'scan', onClick: function () { UI.toast('Camera scan: Phase 2 · abhi IMEI type/paste karo'); } }, icon('scan'))]),
      results,
      d.lines.length || d.extra.length ? h('div', { class: 'sec' }, [h('span', null, t('in_bill') + ' (' + (d.lines.length + d.extra.length) + ')')]) : h('div', { class: 'empty' }, LANG === 'hinglish' ? 'Upar IMEI ya naam type karo, ya scan karo' : 'Type IMEI or name above, or scan'),
      lineList, extraList,
      h('div', { class: 'sec' }, [h('span', null, t('customer_opt'))]), custBox, cfBox, exBox,
      h('div', { class: 'row mt' }, [d.exchange ? null : h('button', { class: 'btn dash', onClick: function () { exchangeSheet(d, function () { saveDraft(d); App.render(); }); } }, t('add_exchange')), h('button', { class: 'btn dashg', onClick: function () { extraLineSheet(d, function () { saveDraft(d); App.render(); }); } }, t('add_extra'))])
    ]);
    wrap.appendChild(content);
    wrap.appendChild(h('div', { class: 'footbar' }, [h('div', { class: 'tot' }, [h('div', { class: 'k' }, t('total')), h('div', { class: 'v' }, money(total, true))]), h('button', { class: 'btn gold', disabled: !total, onClick: function () { var bad = d.lines.filter(function (l) { return l.min_price && l.rate_incl < l.min_price; }); if (bad.length && !API.can('edit_all')) return UI.toast(bad[0].name + ': ' + t('min_price') + ' ' + money(bad[0].min_price, true), 'err'); d.step = 2; saveDraft(d); App.render(); } }, t('payment_next'))]));
    setTimeout(function () { if (!d.lines.length) q.focus(); }, 80);
    return wrap;
  }

  // --- sheets used by sale ---
  function newItemSheet(text, done) {
    var m = API.state.masters || { brands: [] };
    var guessBrand = m.brands.filter(function (b) { return text.toLowerCase().indexOf(b.name.toLowerCase()) === 0; })[0];
    var model = guessBrand ? text.slice(guessBrand.name.length).trim() : text;
    var brandInp = h('input', { value: guessBrand ? guessBrand.name : '', list: 'brands-dl', placeholder: 'vivo, Samsung…' });
    var dl = h('datalist', { id: 'brands-dl' }, m.brands.map(function (b) { return h('option', { value: b.name }); }));
    var modelInp = h('input', { value: model, placeholder: 'Y31' });
    var cat = 'Phone';
    var catChips = h('div', { class: 'chips' }, [['Phone', t('phone')], ['Accessory', t('accessory')], ['Service', t('service')]].map(function (c) { return h('button', { class: 'chip' + (cat === c[0] ? ' on' : ''), onClick: function () { cat = c[0]; Array.from(catChips.children).forEach(function (x) { x.classList.remove('on'); }); this.classList.add('on'); variantsWrap.classList.toggle('hide', cat !== 'Phone'); } }, c[1]); }));
    var combos = ['4/64', '4/128', '6/128', '8/128', '8/256', '12/256'], picked = {};
    var comboChips = h('div', { class: 'chips', style: { flexWrap: 'wrap' } }, combos.map(function (c) { return h('button', { class: 'chip', onClick: function () { picked[c] = !picked[c]; this.classList.toggle('on', picked[c]); } }, c); }).concat([h('button', { class: 'chip dash', onClick: function () { UI.prompt('RAM/Storage', 'jaise 6/256').then(function (v) { if (v) { picked[v] = true; comboChips.insertBefore(h('button', { class: 'chip on', onClick: function () { picked[v] = !picked[v]; this.classList.toggle('on', picked[v]); } }, v), comboChips.lastChild); } }); } }, '+ aur')]));
    var colourInp = h('input', { placeholder: 'Black, Blue (comma se alag)' });
    var priceInp = h('input', { placeholder: '14999', inputmode: 'numeric' });
    var minInp = h('input', { placeholder: '13500', inputmode: 'numeric' });
    var variantsWrap = h('div', null, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('ram_storage')), comboChips]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('colour')), colourInp])]);
    var btn = h('button', { class: 'btn gold', onClick: function () {
      var brand = brandInp.value.trim(), mdl = modelInp.value.trim();
      if (!brand || !mdl) return UI.toast(t('brand') + ' + ' + t('model'), 'err');
      var variants = [];
      if (cat === 'Phone') { var colours = colourInp.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean); if (!colours.length) colours = ['']; Object.keys(picked).filter(function (k) { return picked[k]; }).forEach(function (c) { var p = c.split('/'); colours.forEach(function (col) { variants.push({ ram: p[0], storage: p[1] || '', colour: col, sale_price: UI.num(priceInp.value), min_price: UI.num(minInp.value) }); }); }); }
      if (!variants.length) variants.push({ sale_price: UI.num(priceInp.value), min_price: UI.num(minInp.value) });
      btn.disabled = true;
      API.call('masters.saveItem', { brand_name: brand, model_name: mdl, category: cat, item_type: cat === 'Phone' ? 'Serialized' : 'Quantity', variants: variants }).then(function (r) {
        API.invalidateMasters(); API.masters(true);
        sh.close();
        var v = r.variants[0]; v.full_name = (r.brand.name + ' ' + r.item.model_name + ' ' + (v.variant_name || '')).trim(); v.item_type = r.item.item_type; v.category = r.item.category;
        if (r.variants.length > 1) { var s2 = UI.sheet(LANG === 'hinglish' ? 'Kaunsa variant bill mein?' : 'Which variant?', h('div', { class: 'card pad0 list' }, r.variants.map(function (vv) { return h('div', { class: 'item click', onClick: function () { s2.close(); vv.full_name = (r.brand.name + ' ' + r.item.model_name + ' ' + (vv.variant_name || '')).trim(); vv.item_type = r.item.item_type; vv.category = r.item.category; done(vv); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, vv.variant_name || r.item.model_name)]), icon('chev')]); }))); return; }
        done(v);
      }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; });
    } }, t('create_add'));
    var sh = UI.sheet(t('new_item_create'), h('div', null, [dl, h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('category')), catChips]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('brand')), brandInp]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('model')), modelInp])]), variantsWrap, h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('sale_price')), priceInp]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('min_price')), minInp])]), h('div', { class: 'note xs mb' }, 'HSN & GST ' + (LANG === 'hinglish' ? 'brand se auto lagenge · accountant review karega' : 'auto from brand · accountant reviews')), btn]));
  }
  S.newItemSheet = newItemSheet;

  /** Phone created inline but not in stock → 4-field quick stock-in (creates a NoGST purchase) */
  function quickStockIn(v, done) {
    var sup = h('input', { placeholder: LANG === 'hinglish' ? 'Kisse liya (supplier naam)' : 'Supplier name' });
    var rate = h('input', { placeholder: LANG === 'hinglish' ? 'Landing rate (kharid daam)' : 'Landing cost', inputmode: 'numeric' });
    var imei = h('input', { placeholder: 'IMEI (15 digit)', inputmode: 'numeric' });
    var isGst = h('input', { type: 'checkbox' });
    var btn = h('button', { class: 'btn gold', onClick: function () {
      var im = imei.value.replace(/\D/g, ''); if (im.length !== 15) return UI.toast('IMEI 15 digit', 'err'); if (!UI.num(rate.value)) return UI.toast(t('rate'), 'err');
      btn.disabled = true;
      API.call('purchase.create', { type: isGst.checked ? 'GST' : 'NoGST', supplier: { name: sup.value.trim() || 'Unknown supplier' }, bill_lines: [{ bill_item_name: v.full_name, qty: 1, rate: UI.num(rate.value), gst_rate: isGst.checked ? 18 : 0 }], receipt_lines: [{ bill_line_idx: 0, variant_id: v.id, qty: 1, rate: UI.num(rate.value), imeis: [{ imei1: im }] }], notes: 'Quick stock-in from sale screen' })
        .then(function () { return API.call('stock.search', { q: im }); })
        .then(function (r) { sh.close(); var u = r.exact_imei; if (!u) throw new Error('unit not found'); done({ id: u.id, imei1: u.imei1, colour: u.colour, age_days: 0, landing_cost: u.landing_cost, condition: 'New' }); })
        .catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; });
    } }, LANG === 'hinglish' ? 'Stock mein daalo & bill mein lo' : 'Add to stock & bill');
    var sh = UI.sheet(v.full_name, h('div', null, [h('div', { class: 'note mb' }, LANG === 'hinglish' ? 'Yeh phone stock mein nahi hai. 3 cheezein batao, stock mein aa jayega aur bill mein lag jayega. Poora purchase bill baad mein "Maal Aaya" se.' : 'Not in stock yet. Three fields and it goes to stock + this bill.'), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('supplier')), sup]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('landing')), rate]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'IMEI'), imei])]), h('label', { class: 'row small mb' }, [isGst, h('span', null, LANG === 'hinglish' ? 'GST bill mila hai (18%)' : 'GST bill received (18%)')]), btn]));
  }

  function customerSheet(d, done) {
    var m = API.state.masters || { parties: [] };
    var q = h('input', { placeholder: LANG === 'hinglish' ? 'Naam ya mobile khojo…' : 'Search name or mobile…' });
    var list = h('div', { class: 'card pad0 list mt' });
    function show() {
      var text = q.value.trim().toLowerCase(); list.innerHTML = '';
      var rows = m.parties.filter(function (p) { return p.type !== 'Supplier' && (!text || (p.name + ' ' + p.mobile).toLowerCase().indexOf(text) >= 0); }).slice(0, 8);
      rows.forEach(function (p) { list.appendChild(h('div', { class: 'item click', onClick: function () { d.customer = { party_id: p.id, name: p.name, mobile: p.mobile, gstin: p.gstin, state_code: p.state_code }; sh.close(); done(); } }, [h('div', { class: 'avatar', style: { background: 'var(--blue-t)', color: 'var(--blue)', borderRadius: '50%' } }, UI.initials(p.name)), h('div', { class: 'grow' }, [h('div', { class: 't' }, p.name), h('div', { class: 's' }, (p.mobile || '') + (p.gstin ? ' · ' + p.gstin : ''))])])); });
      list.appendChild(h('button', { class: 'item click', style: { background: 'var(--gold-t)', width: '100%', textAlign: 'left' }, onClick: function () { sh.close(); partyForm({ name: /\d{10}/.test(text) ? '' : q.value.trim(), mobile: (text.match(/\d{10}/) || [''])[0], type: 'Customer' }, function (p) { d.customer = { party_id: p.id, name: p.name, mobile: p.mobile, gstin: p.gstin, state_code: p.state_code }; done(); }); } }, [h('div', { class: 'avatar', style: { background: 'var(--gold)', color: '#111', fontSize: '20px' } }, '+'), h('div', { class: 'grow' }, [h('div', { class: 't' }, t('new_party') + (text ? ': "' + q.value.trim() + '"' : ''))])]));
      if (d.customer) list.appendChild(h('button', { class: 'item click', style: { width: '100%', textAlign: 'left' }, onClick: function () { d.customer = null; sh.close(); done(); } }, [h('div', { class: 'grow' }, [h('div', { class: 't mute' }, t('walkin') + ' (' + t('remove') + ')')])]));
    }
    q.addEventListener('input', show); show();
    var sh = UI.sheet(t('customer_opt'), h('div', null, [q, list]));
    setTimeout(function () { q.focus(); }, 60);
  }
  S.customerSheet = customerSheet;

  function partyForm(init, done) {
    init = init || {};
    var name = h('input', { value: init.name || '' }), mobile = h('input', { value: init.mobile || '', inputmode: 'numeric' }), gstin = h('input', { value: init.gstin || '', style: { textTransform: 'uppercase' } }), addr = h('textarea', { value: init.address || '' });
    var type = init.type || 'Customer';
    var typeChips = h('div', { class: 'chips' }, ['Customer', 'Supplier', 'Both'].map(function (tp) { return h('button', { class: 'chip' + (type === tp ? ' on' : ''), onClick: function () { type = tp; Array.from(typeChips.children).forEach(function (x) { x.classList.remove('on'); }); this.classList.add('on'); } }, tp); }));
    var more = h('div', { class: 'hide' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('gstin')), gstin]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('address')), addr]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Type'), typeChips])]);
    var btn = h('button', { class: 'btn gold', onClick: function () {
      if (!name.value.trim()) return UI.toast(t('name'), 'err');
      btn.disabled = true;
      API.call('masters.saveParty', { id: init.id, type: type, name: name.value.trim(), mobile: mobile.value, gstin: gstin.value, address: addr.value }).then(function (p) { API.invalidateMasters(); API.masters(true).then(function () { sh.close(); done(p); }); }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; });
    } }, t('save'));
    var sh = UI.sheet(init.id ? init.name : t('new_party'), h('div', null, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('name')), name]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('mobile')), mobile]), h('button', { class: 'goldc b small mb', onClick: function () { more.classList.toggle('hide'); } }, t('more') + ' ▾'), more, btn]));
    setTimeout(function () { (init.name ? mobile : name).focus(); }, 60);
  }
  S.partyForm = partyForm;

  function exchangeSheet(d, done) {
    var brand = h('input', { placeholder: 'vivo' }), model = h('input', { placeholder: 'Y11' }), ram = h('input', { placeholder: '4/64' }), imei = h('input', { placeholder: '15 digit', inputmode: 'numeric' }), value = h('input', { placeholder: '5000', inputmode: 'numeric' }), cond = h('input', { placeholder: LANG === 'hinglish' ? 'Theek hai, halke scratch' : 'Good, minor scratches' });
    var grade = 'B', gradeChips = h('div', { class: 'chips' }, ['A', 'B', 'C'].map(function (g) { return h('button', { class: 'chip' + (g === grade ? ' on' : ''), onClick: function () { grade = g; Array.from(gradeChips.children).forEach(function (x) { x.classList.remove('on'); }); this.classList.add('on'); } }, g); }));
    var btn = h('button', { class: 'btn gold', onClick: function () { var im = imei.value.replace(/\D/g, ''); if (im.length !== 15) return UI.toast('IMEI 15 digit', 'err'); if (!UI.num(value.value)) return UI.toast(t('ex_value'), 'err'); var p = ram.value.split('/'); d.exchange = { brand_name: brand.value.trim() || 'Other', model_name: model.value.trim() || 'Old phone', ram: p[0] || '', storage: p[1] || '', imei: im, value: UI.num(value.value), condition: cond.value, grade: grade }; sh.close(); done(); } }, t('save'));
    var sh = UI.sheet(t('exchange_title'), h('div', null, [h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('brand')), brand]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('model')), model])]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'RAM/Storage'), ram]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('ex_imei')), imei])]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('ex_value')), value]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('grade')), gradeChips])]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('ex_condition')), cond]), h('div', { class: 'note xs mb' }, LANG === 'hinglish' ? 'Bill par "Less: Exchange" dikhega. Purana phone stock mein "Old" ban kar aa jayega.' : 'Bill shows "Less: Exchange". Old phone enters stock as Pre-owned.'), btn]));
  }
  function extraLineSheet(d, done) {
    var desc = h('input', { placeholder: LANG === 'hinglish' ? 'Tempered glass lagana / Screen guard / Charges…' : 'Fitting / charges…' }), amt = h('input', { placeholder: '200', inputmode: 'numeric' }), gst = h('input', { value: '18', inputmode: 'numeric' });
    var btn = h('button', { class: 'btn gold', onClick: function () { if (!desc.value.trim() || !UI.num(amt.value)) return UI.toast(t('name') + ' + ₹', 'err'); d.extra.push({ description: desc.value.trim(), amount: UI.num(amt.value), gst_rate: UI.num(gst.value) }); sh.close(); done(); } }, t('save'));
    var sh = UI.sheet(t('add_extra'), h('div', null, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('name')), desc]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, '₹ (incl. GST)'), amt]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('gst')), gst])]), btn]));
    setTimeout(function () { desc.focus(); }, 60);
  }

  function salePayment(d) {
    var wrap = h('div');
    wrap.appendChild(saleHeader(d, 2));
    var modes = (API.state.masters ? API.state.masters.paymentModes : []).filter(function (m) { return m.kind !== 'Exchange'; });
    var total = saleTotal(d), ex = d.exchange ? Number(d.exchange.value) : 0, net = total - ex;
    function paidSum() { return d.payments.reduce(function (a, p) { return a + (Number(p.amount) || 0); }, 0); }
    var balEl = h('div', { style: { fontSize: '22px', fontWeight: 800 } });
    var noteEl = h('div', { class: 'small mute', style: { padding: '0 4px' } });
    function refresh() { var bal = Math.round((net - paidSum()) * 100) / 100; balEl.textContent = money(bal, true) + (Math.abs(bal) < 0.5 ? ' ✔' : ''); balEl.className = Math.abs(bal) < 0.5 ? 'green' : (bal < 0 ? 'red' : ''); balEl.style.cssText = 'font-size:22px;font-weight:800'; noteEl.textContent = bal > 0.5 ? t('udhar_note', { n: Math.round(bal) }) : (bal < -0.5 ? (LANG === 'hinglish' ? 'Payment bill se zyada hai' : 'Payment exceeds bill') : ''); saveDraft(d); }
    var rows = h('div');
    function renderRows() {
      rows.innerHTML = '';
      d.payments.forEach(function (p, i) {
        var mode = modes.filter(function (m) { return m.id === p.mode_id; })[0] || {};
        var amt = h('input', { class: 'amt', value: p.amount || '', inputmode: 'numeric', onInput: function () { p.amount = UI.num(amt.value); refresh(); } });
        var ref = mode.kind === 'Finance' || mode.kind === 'Card' ? h('input', { placeholder: t('ref_no'), value: p.ref_no || '', style: { height: '40px', marginTop: '8px', fontSize: '13px' }, onInput: function () { p.ref_no = ref.value; saveDraft(d); } }) : null;
        rows.appendChild(h('div', { class: 'payrow', style: { flexWrap: 'wrap' } }, [h('div', { class: 'avatar', style: { background: mode.kind === 'Finance' ? 'var(--gold-t)' : mode.kind === 'Cash' ? 'var(--green-t)' : 'var(--blue-t)', color: mode.kind === 'Finance' ? 'var(--gold-d)' : mode.kind === 'Cash' ? 'var(--green)' : 'var(--blue)' } }, icon(mode.kind === 'Cash' ? 'wallet' : mode.kind === 'Finance' ? 'bank' : 'card', 18)), h('div', { class: 'grow' }, [h('div', { class: 'b' }, mode.name || p.mode_name), h('div', { class: 'xs mute' }, mode.kind === 'Finance' ? (LANG === 'hinglish' ? 'Company degi (DA) · ' : 'Finance co. pays · ') + t('finance_pending') : mode.kind === 'Credit' ? t('udhar_days') : 'Down payment')]), amt, h('button', { class: 'iconbtn', style: { color: 'var(--mute)', width: '32px' }, onClick: function () { d.payments.splice(i, 1); renderRows(); refresh(); } }, icon('x', 16)), ref ? h('div', { style: { flexBasis: '100%' } }, ref) : null]));
      });
    }
    function addMode(m) { var bal = Math.max(0, Math.round((net - paidSum()) * 100) / 100); d.payments.push({ mode_id: m.id, mode_name: m.name, amount: bal, ref_no: '' }); renderRows(); refresh(); }
    var grid = h('div', { class: 'paygrid' }, modes.map(function (m) { return h('button', { onClick: function () { addMode(m); } }, m.name); }).concat([h('button', { class: 'ex', onClick: function () { exchangeSheet(d, function () { d.step = 2; saveDraft(d); App.render(); }); } }, d.exchange ? 'Exchange ✔' : 'Exchange')]));
    var whats = h('input', { type: 'checkbox', checked: true });
    var tmpl = h('select', { style: { height: '38px', width: 'auto', fontSize: '13px' } }, [['GST', 'GST Invoice'], ['Retail', 'Retail (simple)'], ['Repair', 'Repair bill']].map(function (o) { return h('option', { value: o[0], selected: (d.template || API.state.settings.default_template || 'GST') === o[0] }, o[1]); }));
    tmpl.addEventListener('change', function () { d.template = tmpl.value; saveDraft(d); });
    var saveBtn = h('button', { class: 'btn gold', onClick: function () {
      var bal = net - paidSum();
      if (bal < -0.5) return UI.toast(LANG === 'hinglish' ? 'Payment bill se zyada hai' : 'Payment exceeds bill', 'err');
      if (bal > 0.5 && !d.customer) return UI.toast(t('udhar_note', { n: Math.round(bal) }), 'err');
      var missing = ((API.state.masters.customFields || []).filter(function (f) { return f.screen === 'Sale' && (f.required === true || f.required === 'true') && !(d.extra_fields || {})[f.id]; }))[0]; if (missing) return UI.toast(missing.label + ' ' + (LANG === 'hinglish' ? 'bharna zaroori hai (Item step → More)' : 'is required'), 'err');
      saveBtn.disabled = true; saveBtn.innerHTML = '<span class="spin"></span>';
      var payload = { customer: d.customer || {}, lines: d.lines.map(function (l) { return { variant_id: l.variant_id, unit_id: l.unit_id, qty: l.qty, rate_incl: l.rate_incl }; }), extra_lines: d.extra, payments: d.payments.filter(function (p) { return p.amount > 0; }).map(function (p) { return { mode_id: p.mode_id, amount: p.amount, ref_no: p.ref_no }; }), exchange: d.exchange, template: tmpl.value, salesperson: API.state.user.name, extra: d.extra_fields || {} };
      API.call('sales.create', payload).then(function (r) { d.result = r; d.whatsapp = whats.checked; saveDraft(d); API.invalidateMasters(); App.render(); }).catch(function (e) { UI.toast(e.message, 'err', 6000); saveBtn.disabled = false; saveBtn.textContent = t('save_print'); });
    } }, t('save_print'));
    renderRows(); refresh();
    wrap.appendChild(h('div', { class: 'content' }, [
      h('div', { class: 'card', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [h('div', null, [h('div', { class: 'xs mute' }, t('to_collect')), h('div', { style: { fontSize: '22px', fontWeight: 800 } }, money(net, true)), ex ? h('div', { class: 'xs mute' }, money(total, true) + ' − Exchange ' + money(ex, true)) : null]), h('div', { class: 'right' }, [h('div', { class: 'xs mute' }, t('balance')), balEl])]),
      h('div', { class: 'sec' }, [h('span', null, t('how_paid'))]), grid, h('div', { class: 'mt' }), rows, noteEl
    ]));
    wrap.appendChild(h('div', { class: 'footbar col' }, [h('div', { class: 'row small', style: { color: '#444' } }, [h('label', { class: 'row', style: { flex: 1 } }, [whats, h('span', null, t('whatsapp'))]), h('div', { style: { flex: '0 0 auto' } }, tmpl)]), saveBtn]));
    return wrap;
  }

  function saleDone(d) {
    var r = d.result, wrap = h('div');
    wrap.appendChild(saleHeader(d, 3));
    var data = { settings: API.state.settings, sale: r.sale, lines: r.lines, payments: r.payments, exchange: r.exchange };
    var waText = Bill.whatsappText(data);
    var waHref = 'https://wa.me/' + (r.sale.cust_mobile ? '91' + r.sale.cust_mobile : '') + '?text=' + encodeURIComponent(waText);
    wrap.appendChild(h('div', { class: 'content' }, [
      h('div', { class: 'card center', style: { padding: '28px 16px' } }, [h('div', { style: { width: '64px', height: '64px', borderRadius: '50%', background: 'var(--green-t)', color: 'var(--green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } }, icon('check', 32)), h('div', { style: { fontSize: '22px', fontWeight: 800, marginTop: '12px' } }, t('saved')), h('div', { class: 'mute' }, r.sale.bill_no + ' · ' + money(r.sale.total, true) + (r.sale.pending > 0 ? ' · ' + t('balance') + ' ' + money(r.sale.pending, true) : '')), r.pdf_url ? h('div', { class: 'xs green mt' }, 'PDF Drive mein save · owner ko mail') : h('div', { class: 'xs mute mt' }, API.state.demo ? 'Demo: PDF/email sirf live backend par' : 'PDF ban raha hai…')]),
      h('div', { class: 'grid2 mt' }, [h('button', { class: 'btn black', onClick: function () { Bill.print(data); } }, [icon('print', 20), t('print')]), h('a', { class: 'btn ghost', href: waHref, target: '_blank', rel: 'noopener' }, [icon('share', 20), t('share')])]),
      r.pdf_url ? h('a', { class: 'btn ghost mt', href: r.pdf_url, target: '_blank', rel: 'noopener' }, t('pdf') + ' (Drive)') : null,
      h('div', { class: 'card mt', html: Bill.render(data), style: { padding: '8px', overflow: 'auto' } })
    ]));
    wrap.appendChild(h('div', { class: 'footbar' }, [h('button', { class: 'btn gold', onClick: function () { clearDraft(); App.render(); } }, [icon('plus', 20), t('new_sale')]), h('a', { class: 'btn ghost', href: '#/home', style: { flex: '0 0 auto' }, onClick: function () { clearDraft(); } }, t('home'))]));
    if (d.whatsapp && r.sale.cust_mobile && !d.waOpened) { d.waOpened = true; saveDraft(d); setTimeout(function () { window.open(waHref, '_blank'); }, 400); }
    return wrap;
  }

  // ---------------- STOCK ----------------
  S.stock = function (params) {
    var level = params.level || 'brand', filters = {};
    ['brand', 'model', 'ram', 'storage', 'colour', 'condition', 'price_min', 'price_max', 'age_min'].forEach(function (k) { if (params[k]) filters[k] = params[k]; });
    var wrap = h('div');
    var sub = (filters.brand ? filters.brand + (filters.model ? ' › ' + filters.model : '') : t('only_original'));
    var kpis = h('div', { class: 'kpis' });
    wrap.appendChild(UI.topbar(t('stock'), sub, { back: level === 'brand' ? '#/home' : (level === 'model' ? '#/stock' : '#/stock?level=model&brand=' + encodeURIComponent(filters.brand || '')), extra: kpis, right: h('a', { class: 'pillbtn', href: '#/stock?level=variant' + qs(filters) }, 'IMEI view') }));
    var body = h('div', { class: 'content' }, UI.spinner());
    wrap.appendChild(body); wrap.appendChild(UI.tabbar(''));
    API.call('stock.summary', { level: level, filters: filters }).then(function (r) {
      kpis.innerHTML = '';
      kpis.appendChild(kpi(t('stock_value'), UI.short(r.totals.value), r.totals.phones + ' ' + t('phones') + (r.totals.accessories ? ' · ' + r.totals.accessories + ' acc' : ''), true));
      kpis.appendChild(kpi(t('exp_margin'), UI.short(r.totals.expected_margin), (r.totals.old ? r.totals.old + ' ' + t('old') : '')));
      kpis.appendChild(kpi(t('aged'), r.totals.aged90 + ' ' + t('pcs'), '', false, '#/stock?level=variant&age_min=90'));
      var chips = h('div', { class: 'chips' }, [
        chip('brand', t('brand'), r.facets.brands), chip('ram', 'RAM', r.facets.rams.map(function (x) { return x + ' GB'; }), r.facets.rams), chip('storage', 'Storage', r.facets.storages.map(function (x) { return x + ' GB'; }), r.facets.storages),
        priceChip(), chip('condition', t('new_old'), [t('new'), t('old')], ['New', 'Old']), chip('age_min', t('age'), ['30+ ' + t('days'), '60+ ' + t('days'), '90+ ' + t('days')], ['30', '60', '90']), chip('colour', t('colour'), r.facets.colours)
      ]);
      body.innerHTML = '';
      body.appendChild(chips);
      body.appendChild(h('div', { class: 'sec' }, [h('span', null, level === 'brand' ? t('brandwise') : level === 'model' ? (LANG === 'hinglish' ? 'Model-wise' : 'By model') : (LANG === 'hinglish' ? 'Variant-wise · tap → IMEI' : 'By variant · tap → IMEI')), h('span', null, t('qty') + ' · ' + t('stock_value'))]));
      var list = h('div', { class: 'card pad0 list' });
      if (!r.groups.length && !r.accessories.length) list.appendChild(h('div', { class: 'empty' }, t('no_match')));
      r.groups.forEach(function (g) {
        var href = level === 'brand' ? '#/stock?level=model&brand=' + encodeURIComponent(g.brand) + qs(filters, ['brand']) : level === 'model' ? '#/stock?level=variant&brand=' + encodeURIComponent(g.brand) + '&model=' + encodeURIComponent(g.model) + qs(filters, ['brand', 'model']) : '#/stock/units/' + g.variant_id;
        var subline = level === 'brand' ? g.model_count + ' ' + t('models') + (Object.keys(g.rams).length ? ' · ' + Object.keys(g.rams).map(function (k) { return k + 'GB: ' + g.rams[k]; }).join(' · ') : '') : level === 'model' ? Object.keys(g.rams).map(function (k) { return k + 'GB: ' + g.rams[k]; }).join(' · ') : Object.keys(g.colours).map(function (k) { return k + ' ' + g.colours[k]; }).join(' · ') + (g.sale_price ? ' · ' + money(g.sale_price, true) : '');
        list.appendChild(h('a', { href: href, class: 'item click' }, [h('div', { class: 'avatar', style: { background: 'var(--blue-t)', color: 'var(--blue)' } }, UI.initials(g.brand)), h('div', { class: 'grow' }, [h('div', { class: 't' }, g.name), h('div', { class: 's' }, [subline, g.aged90 ? h('span', { class: 'red b' }, ' · ' + g.aged90 + ' ×90d') : null, g.old ? h('span', { class: 'goldc b' }, ' · ' + g.old + ' old') : null])]), h('div', { class: 'amt' }, [g.qty + ' ' + t('pcs'), h('div', { class: 's' }, UI.short(g.value))]), icon('chev')]));
      });
      r.accessories.forEach(function (a) { list.appendChild(h('div', { class: 'item' }, [h('div', { class: 'avatar', style: { background: 'var(--soft)', color: '#444' } }, 'Ac'), h('div', { class: 'grow' }, [h('div', { class: 't' }, a.name), h('div', { class: 's' }, (LANG === 'hinglish' ? 'qty item · ' : 'qty item · ') + money(a.sale_price, true))]), h('div', { class: 'amt' }, [a.qty + ' ' + t('pcs'), h('div', { class: 's' }, UI.short(a.value))])])); });
      body.appendChild(list);
      if (r.totals.aged90) body.appendChild(h('a', { href: '#/stock?level=variant&age_min=90', class: 'row mt small mute', style: { padding: '0 4px' } }, [h('span', { style: { flex: '0 0 8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red)' } }), h('span', null, r.totals.aged90 + ' ' + t('dead') + ' →')]));
    }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });

    function chip(key, label, labels, values) {
      values = values || labels; var cur = filters[key];
      var lbl = cur ? label + ': ' + (labels[values.indexOf(cur)] || cur) : label + ' ▾';
      return h('button', { class: 'chip' + (cur ? ' on' : ''), onClick: function () {
        var s = UI.sheet(label, h('div', { class: 'card pad0 list' }, [h('div', { class: 'item click', onClick: function () { s.close(); delete filters[key]; location.hash = '#/stock?level=' + level + qs(filters); } }, [h('div', { class: 'grow' }, [h('div', { class: 't mute' }, t('all'))])])].concat(labels.map(function (l, i) { return h('div', { class: 'item click', onClick: function () { s.close(); filters[key] = values[i]; location.hash = '#/stock?level=' + (level === 'brand' && key !== 'brand' ? 'variant' : level) + qs(filters); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, l)]), cur === values[i] ? icon('check') : null]); }))));
      } }, lbl);
    }
    function priceChip() {
      var ranges = [['0', '10000', '< ₹10k'], ['10000', '15000', '₹10–15k'], ['15000', '25000', '₹15–25k'], ['25000', '50000', '₹25–50k'], ['50000', '', '₹50k+']];
      var cur = filters.price_min || filters.price_max ? ranges.filter(function (r) { return r[0] === (filters.price_min || '0') && r[1] === (filters.price_max || ''); })[0] : null;
      return h('button', { class: 'chip' + (cur ? ' on' : ''), onClick: function () { var s = UI.sheet(t('price'), h('div', { class: 'card pad0 list' }, [h('div', { class: 'item click', onClick: function () { s.close(); delete filters.price_min; delete filters.price_max; location.hash = '#/stock?level=' + level + qs(filters); } }, [h('div', { class: 'grow' }, [h('div', { class: 't mute' }, t('all'))])])].concat(ranges.map(function (r) { return h('div', { class: 'item click', onClick: function () { s.close(); filters.price_min = r[0]; if (r[1]) filters.price_max = r[1]; else delete filters.price_max; location.hash = '#/stock?level=variant' + qs(filters); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, r[2])])]); })))); } }, cur ? cur[2] : t('price') + ' ▾');
    }
    return wrap;
  };
  function qs(f, skip) { skip = skip || []; return Object.keys(f).filter(function (k) { return skip.indexOf(k) < 0 && f[k] !== ''; }).map(function (k) { return '&' + k + '=' + encodeURIComponent(f[k]); }).join(''); }

  S.stockUnits = function (params) {
    var wrap = h('div'), vid = params.id;
    var m = API.state.masters, v = m ? m.variants.filter(function (x) { return x.id === vid; })[0] : null;
    wrap.appendChild(UI.topbar(v ? v.full_name : t('imei_list'), v ? money(v.sale_price, true) + ' · ' + t('min_price') + ' ' + money(v.min_price, true) : '', { back: '#/stock?level=variant' }));
    var body = h('div', { class: 'content' }, UI.spinner());
    wrap.appendChild(body);
    wrap.appendChild(h('div', { class: 'footbar' }, [h('a', { class: 'btn gold', href: '#/sale' }, t('sell_this'))]));
    API.call('stock.units', { variant_id: vid }).then(function (rows) {
      body.innerHTML = '';
      var tbl = h('table', { class: 'tbl' }, [h('thead', null, h('tr', null, [h('th', null, 'IMEI'), h('th', null, t('colour')), h('th', { class: 'r' }, t('landing')), h('th', { class: 'r' }, t('came'))])), h('tbody', null, rows.map(function (u) { return h('tr', { class: 'click', style: { cursor: 'pointer' }, onClick: function () { unitSheet(u); } }, [h('td', { class: 'b' }, (u.imei1 ? '…' + String(u.imei1).slice(-6) : h('span', { class: 'red' }, 'IMEI?')) ), h('td', null, (u.colour || '') + (u.condition === 'Old' ? ' · Old ' + (u.grade || '') : '')), h('td', { class: 'r' }, money(u.landing_cost, true)), h('td', { class: 'r' + (u.age_days >= 90 ? ' red b' : ' mute') }, u.age_days + ' ' + t('days'))]); }))]);
      body.appendChild(h('div', { class: 'card pad0' }, rows.length ? tbl : h('div', { class: 'empty' }, t('no_match'))));
      if (rows.length) body.appendChild(h('div', { class: 'xs mute mt', style: { padding: '0 4px' } }, t('supplier') + ': ' + uniq(rows.map(function (u) { return u.supplier_name + ' (' + u.pur_no + ')'; })).join(', ') + ' · ' + t('bill_item') + ': ' + uniq(rows.map(function (u) { return u.bill_item_name; })).join(', ')));
    }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
    function unitSheet(u) {
      var imei1 = h('input', { value: u.imei1 || '', inputmode: 'numeric' }), notes = h('input', { value: u.notes || '' });
      var statusSel = h('select', null, ['In Stock', 'Damaged', 'Demo', 'Transferred'].map(function (s) { return h('option', { value: s, selected: u.status === s }, s); }));
      var btn = h('button', { class: 'btn gold', onClick: function () { btn.disabled = true; API.call('stock.adjust', { unit_id: u.id, imei1: imei1.value, notes: notes.value, status: statusSel.value }).then(function () { sh.close(); App.render(); }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, t('save'));
      var sh = UI.sheet(u.full_name, h('div', null, [h('div', { class: 'small mute mb' }, 'IMEI2: ' + (u.imei2 || '—') + ' · ' + t('supplier') + ': ' + u.supplier_name + ' · ' + u.pur_no + ' · ' + UI.fdate(u.in_date) + '\n' + t('bill_item') + ': ' + u.bill_item_name + ' · HSN ' + u.bill_hsn), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'IMEI 1'), imei1]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Status'), statusSel]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Notes'), notes]), API.can('edit_all') ? btn : null]));
    }
    return wrap;
  };
  function uniq(a) { var m = {}; return a.filter(function (x) { if (!x || m[x]) return false; m[x] = 1; return true; }); }
})(window.Screens);
