/* Screens part 2: Purchase, Bills, Pending, Parties, Reports, More (settings/users/locks/review/audit) */
(function (S) {
  var h = UI.h, icon = UI.icon, money = UI.money;

  // ---------------- PURCHASE ----------------
  var PKEY = 'gs_pur_draft';
  function loadP() { try { return JSON.parse(sessionStorage.getItem(PKEY) || 'null') || fresh(); } catch (e) { return fresh(); } }
  function fresh() { return { type: 'GST', supplier: null, bill_no: '', bill_date: UI.today(), bill_lines: [], receipt_lines: [], payment: null }; }
  function saveP(d) { sessionStorage.setItem(PKEY, JSON.stringify(d)); }
  function billTaxable(d) { return d.bill_lines.reduce(function (a, b) { return a + (Number(b.qty) || 0) * (Number(b.rate) || 0); }, 0); }
  function billTax(d) { return d.type === 'GST' ? d.bill_lines.reduce(function (a, b) { return a + (Number(b.qty) || 0) * (Number(b.rate) || 0) * (Number(b.gst_rate) || 0) / 100; }, 0) : 0; }
  function recvTotal(d) { return d.receipt_lines.reduce(function (a, r) { return a + (Number(r.qty) || 0) * (Number(r.rate) || 0); }, 0); }

  S.purchase = function () {
    var d = loadP(), wrap = h('div');
    var m = API.state.masters || { variants: [], parties: [], paymentModes: [] };
    var typeChips = h('div', { class: 'chips' }, [['GST', t('gst_bill')], ['NoGST', t('no_gst')], ['OldPhone', t('old_from_cust')]].map(function (tp) { return h('button', { class: 'chip' + (d.type === tp[0] ? ' on' : ''), style: d.type === tp[0] ? { background: 'var(--gold)', color: '#111', borderColor: 'var(--gold)' } : { background: '#222', color: '#ddd', borderColor: '#222' }, onClick: function () { d.type = tp[0]; saveP(d); App.render(); } }, tp[1]); }));
    wrap.appendChild(UI.topbar(t('pur_title'), UI.fdate(UI.today()), { back: '#/home', extra: typeChips }));
    var sup = d.supplier;
    var supBox = h('div', { class: 'card', style: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }, onClick: function () { supplierSheet(d); } }, [h('div', { class: 'avatar', style: { background: sup ? 'var(--blue-t)' : 'var(--soft)', color: 'var(--blue)', borderRadius: '50%' } }, sup ? UI.initials(sup.name) : '?'), h('div', { style: { flex: 1 } }, [h('div', { class: 'b' }, sup ? sup.name : (d.type === 'OldPhone' ? (LANG === 'hinglish' ? 'Customer chuno (kisse liya)' : 'Pick customer') : (LANG === 'hinglish' ? 'Supplier chuno' : 'Pick supplier'))), h('div', { class: 'small mute' }, sup ? ((sup.gstin || (LANG === 'hinglish' ? 'GSTIN nahi' : 'no GSTIN')) + (sup.mobile ? ' · ' + sup.mobile : '')) : '')]), h('span', { class: 'goldc b small' }, sup ? t('change_user') : '+')]);
    var billNo = h('input', { value: d.bill_no, placeholder: '1187', onInput: function () { d.bill_no = billNo.value; saveP(d); } });
    var billDate = h('input', { type: 'date', value: d.bill_date, onInput: function () { d.bill_date = billDate.value; saveP(d); } });

    var blList = h('div', { class: 'card pad0 list' }, d.bill_lines.length ? d.bill_lines.map(function (b, i) { return h('div', { class: 'item click', onClick: function () { billLineSheet(d, i); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, b.bill_item_name), h('div', { class: 's' }, (b.hsn ? 'HSN ' + b.hsn + ' · ' : '') + (d.type === 'GST' ? b.gst_rate + '%' : 'no GST'))]), h('div', { class: 'amt' }, [b.qty + ' × ' + money(b.rate, true), h('div', { class: 's' }, money(b.qty * b.rate, true))])]); }) : h('div', { class: 'empty' }, LANG === 'hinglish' ? 'Bill ki line daalo (jaise bill par likha hai)' : 'Add bill lines as printed'));
    var rlList = h('div', { class: 'card pad0 list', style: { border: '2px solid var(--gold)' } }, d.receipt_lines.length ? d.receipt_lines.map(function (r, i) { var ok = r.item_type !== 'Serialized' || (r.imeis || []).length === Number(r.qty); return h('div', { class: 'item click', onClick: function () { receiptLineSheet(d, i); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, r.name), h('div', { class: 's' }, [r.qty + ' ' + t('pcs') + ' · ' + money(r.rate, true) + ' · ', r.item_type === 'Serialized' ? h('span', { class: ok ? 'green b' : 'red b' }, (r.imeis || []).length + '/' + r.qty + ' IMEI' + (ok ? ' ✔' : '')) : h('span', { class: 'mute' }, 'qty item'), ' · ', h('span', { class: 'mute' }, '→ ' + (d.bill_lines[r.bill_line_idx] ? d.bill_lines[r.bill_line_idx].bill_item_name : '?'))])]), h('div', { class: 'amt' }, money(r.qty * r.rate, true))]); }) : h('div', { class: 'empty' }, LANG === 'hinglish' ? 'Jo asal mein aaya, wo daalo (IMEI ke saath)' : 'Add what actually arrived (with IMEIs)'));
    var bt = billTaxable(d), rt = recvTotal(d), diff = Math.round((bt - rt) * 100) / 100, ok = Math.abs(diff) <= 1 && bt > 0;
    var matchBox = h('div', { class: 'note ' + (ok ? 'green' : 'red'), style: { display: 'flex', justifyContent: 'space-between' } }, [h('span', { class: 'b' }, (LANG === 'hinglish' ? 'Asal ' : 'Actual ') + money(rt, true) + (ok ? ' = ' : ' ≠ ') + 'Bill ' + money(bt, true) + (ok ? ' ✔' : '')), h('span', null, ok ? t('match') : (LANG === 'hinglish' ? 'fark ' : 'diff ') + money(diff, true))]);
    var total = Math.round((bt + billTax(d)) * 100) / 100;
    var payLbl = d.payment ? (d.payment.mode_name + ' ' + money(d.payment.amount, true)) : (LANG === 'hinglish' ? 'Udhar (baad mein)' : 'Credit (pay later)');
    var saveBtn = h('button', { class: 'btn gold', disabled: !ok || !d.receipt_lines.length, onClick: function () {
      var bad = d.receipt_lines.filter(function (r) { return r.item_type === 'Serialized' && (r.imeis || []).length !== Number(r.qty); });
      if (bad.length && (API.state.settings.require_imei || 'true') === 'true') return UI.toast(bad[0].name + ': IMEI ' + (bad[0].imeis || []).length + '/' + bad[0].qty, 'err');
      if (!d.supplier && d.type !== 'NoGST') return UI.toast(LANG === 'hinglish' ? 'Supplier chuno' : 'Pick supplier', 'err');
      saveBtn.disabled = true; saveBtn.innerHTML = '<span class="spin"></span>';
      API.call('purchase.create', { type: d.type, supplier: d.supplier ? { party_id: d.supplier.id } : { name: 'Unknown supplier' }, supplier_bill_no: d.bill_no, bill_date: d.bill_date, bill_lines: d.bill_lines, receipt_lines: d.receipt_lines.map(function (r) { return { bill_line_idx: r.bill_line_idx, variant_id: r.variant_id, qty: r.qty, rate: r.rate, imeis: (r.imeis || []).map(function (x) { return { imei1: x }; }) }; }), payments: d.payment ? [d.payment] : [] })
        .then(function (r) { sessionStorage.removeItem(PKEY); API.invalidateMasters(); UI.toast(r.purchase.pur_no + ' ✔ ' + r.units + ' ' + t('phones') + ' stock mein', 'ok'); location.hash = '#/stock'; })
        .catch(function (e) { UI.toast(e.message, 'err', 6000); saveBtn.disabled = false; saveBtn.textContent = t('save'); });
    } }, t('save'));
    wrap.appendChild(h('div', { class: 'content' }, [
      supBox,
      d.type !== 'OldPhone' ? h('div', { class: 'grid2 mt' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('supplier_bill_no')), billNo]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('bill_date')), billDate])]) : h('div', { class: 'field mt' }, [h('label', { class: 'lbl' }, t('bill_date')), billDate]),
      h('div', { class: 'sec' }, [h('span', null, t('bill_says')), h('span', { class: 'tag r' }, t('tax_tally'))]), blList, h('button', { class: 'goldc b small mt', onClick: function () { billLineSheet(d, -1); } }, t('add_bill_line')),
      h('div', { class: 'sec' }, [h('span', null, t('actual')), h('span', { class: 'tag g' }, t('for_stock'))]), rlList,
      h('div', { class: 'row mt' }, [h('button', { class: 'btn dashg', disabled: !d.bill_lines.length, onClick: function () { receiptLineSheet(d, -1); } }, t('add_item'))]),
      h('div', { class: 'mt' }, matchBox)
    ]));
    wrap.appendChild(h('div', { class: 'footbar col' }, [h('div', { class: 'row small', style: { color: '#444', justifyContent: 'space-between' } }, [h('span', null, [t('payment') + ': ', h('b', null, payLbl)]), h('button', { class: 'goldc b', style: { flex: '0 0 auto' }, onClick: function () { paySheet(d, total); } }, t('change_user'))]), h('div', { class: 'row' }, [h('div', { class: 'tot', style: { flex: '0 0 auto' } }, [h('div', { class: 'k' }, t('bill_total')), h('div', { class: 'v' }, money(total, true))]), saveBtn])]));
    return wrap;

    function supplierSheet(d) {
      var q = h('input', { placeholder: LANG === 'hinglish' ? 'Naam / GSTIN / mobile khojo…' : 'Search…' }), list = h('div', { class: 'card pad0 list mt' });
      function show() { var text = q.value.trim().toLowerCase(); list.innerHTML = ''; m.parties.filter(function (p) { return (d.type === 'OldPhone' ? p.type !== 'Supplier' : p.type !== 'Customer') && (!text || (p.name + ' ' + p.gstin + ' ' + p.mobile).toLowerCase().indexOf(text) >= 0); }).slice(0, 8).forEach(function (p) { list.appendChild(h('div', { class: 'item click', onClick: function () { d.supplier = p; saveP(d); sh.close(); App.render(); } }, [h('div', { class: 'avatar', style: { background: 'var(--blue-t)', color: 'var(--blue)', borderRadius: '50%' } }, UI.initials(p.name)), h('div', { class: 'grow' }, [h('div', { class: 't' }, p.name), h('div', { class: 's' }, (p.gstin || '') + (p.mobile ? ' · ' + p.mobile : ''))])])); }); list.appendChild(h('button', { class: 'item click', style: { background: 'var(--gold-t)', width: '100%', textAlign: 'left' }, onClick: function () { sh.close(); S.partyForm({ name: q.value.trim(), type: d.type === 'OldPhone' ? 'Customer' : 'Supplier' }, function (p) { d.supplier = p; saveP(d); App.render(); }); } }, [h('div', { class: 'avatar', style: { background: 'var(--gold)', color: '#111', fontSize: '20px' } }, '+'), h('div', { class: 'grow' }, [h('div', { class: 't' }, t('new_party'))])])); }
      q.addEventListener('input', show); show();
      var sh = UI.sheet(t('supplier'), h('div', null, [q, list])); setTimeout(function () { q.focus(); }, 60);
    }
    function billLineSheet(d, i) {
      var b = i >= 0 ? d.bill_lines[i] : { bill_item_name: '', hsn: '85171300', qty: 1, rate: '', gst_rate: 18 };
      var name = h('input', { value: b.bill_item_name, placeholder: 'Samsung A17 6/128' }), hsn = h('input', { value: b.hsn, inputmode: 'numeric' }), qty = h('input', { value: b.qty, inputmode: 'numeric' }), rate = h('input', { value: b.rate, inputmode: 'numeric', placeholder: LANG === 'hinglish' ? 'per piece, bina GST' : 'per piece, excl. GST' }), gst = h('input', { value: b.gst_rate, inputmode: 'numeric' });
      var btn = h('button', { class: 'btn gold', onClick: function () { if (!name.value.trim() || !UI.num(qty.value) || !UI.num(rate.value)) return UI.toast(t('item_name_on_bill') + ', qty, rate', 'err'); var nb = { bill_item_name: name.value.trim(), hsn: hsn.value.trim(), qty: UI.num(qty.value), rate: UI.num(rate.value), gst_rate: d.type === 'GST' ? UI.num(gst.value) : 0 }; if (i >= 0) d.bill_lines[i] = nb; else d.bill_lines.push(nb); saveP(d); sh.close(); App.render(); } }, t('save'));
      var del = i >= 0 ? h('button', { class: 'btn red mt', onClick: function () { d.bill_lines.splice(i, 1); saveP(d); sh.close(); App.render(); } }, t('remove')) : null;
      var sh = UI.sheet(t('bill_says'), h('div', null, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('item_name_on_bill')), name]), h('div', { class: 'grid3' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('hsn')), hsn]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('qty')), qty]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, d.type === 'GST' ? t('gst') : '—'), d.type === 'GST' ? gst : h('div')])]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('rate')), rate]), btn, del]));
      setTimeout(function () { name.focus(); }, 60);
    }
    function receiptLineSheet(d, i, preset) {
      var mv = (API.state.masters && API.state.masters.variants) || m.variants;
      var r = i >= 0 ? d.receipt_lines[i] : { bill_line_idx: 0, variant_id: '', name: '', item_type: 'Serialized', qty: 1, rate: d.bill_lines[0] ? d.bill_lines[0].rate : '', imeis: [] };
      var picked = preset || (r.variant_id ? (mv.filter(function (v) { return v.id === r.variant_id; })[0] || { id: r.variant_id, full_name: r.name, item_type: r.item_type }) : null);
      var q = h('input', { value: picked ? picked.full_name : '', placeholder: LANG === 'hinglish' ? 'Asli item khojo (vivo Y21 4/128)…' : 'Search original item…' });
      var hits = h('div', { class: 'card pad0 list hide' });
      q.addEventListener('input', function () { var text = q.value.trim().toLowerCase(); hits.innerHTML = ''; if (text.length < 2) { hits.classList.add('hide'); return; } var rows = mv.filter(function (v) { return (v.full_name || '').toLowerCase().indexOf(text) >= 0; }).slice(0, 6); rows.forEach(function (v) { hits.appendChild(h('div', { class: 'item click', onClick: function () { picked = v; q.value = v.full_name; hits.classList.add('hide'); imeiWrap.classList.toggle('hide', v.item_type === 'Quantity'); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, v.full_name), h('div', { class: 's' }, v.item_type + ' · ' + money(v.sale_price, true))])])); }); hits.appendChild(h('button', { class: 'item click', style: { background: 'var(--gold-t)', width: '100%', textAlign: 'left' }, onClick: function () { sh.close(); S.newItemSheet(q.value.trim(), function (v) { r.variant_id = v.id; r.name = v.full_name; r.item_type = v.item_type; if (i >= 0) d.receipt_lines[i] = r; else { d.receipt_lines.push(r); i = d.receipt_lines.length - 1; } saveP(d); receiptLineSheet(d, i, v); }); } }, [h('div', { class: 'avatar', style: { background: 'var(--gold)', color: '#111', fontSize: '20px' } }, '+'), h('div', { class: 'grow' }, [h('div', { class: 't' }, t('new_item_create') + ': "' + q.value.trim() + '"')])])); hits.classList.remove('hide'); });
      var blSel = h('select', null, d.bill_lines.map(function (b, k) { return h('option', { value: k, selected: k === r.bill_line_idx }, (k + 1) + '. ' + b.bill_item_name + ' (' + money(b.rate, true) + ')'); }));
      var qty = h('input', { value: r.qty, inputmode: 'numeric' }), rate = h('input', { value: r.rate, inputmode: 'numeric', placeholder: LANG === 'hinglish' ? 'per piece (landing)' : 'per piece (landing)' });
      var imeiTa = h('textarea', { value: (r.imeis || []).join('\n'), placeholder: LANG === 'hinglish' ? 'IMEI paste karo — ek line mein ek, ya comma/space se alag' : 'Paste IMEIs — one per line or separated by comma/space', style: { minHeight: '100px', fontFamily: 'monospace', fontSize: '13px' } });
      var cnt = h('div', { class: 'xs mute' });
      function parseImeis() { var arr = imeiTa.value.split(/[^0-9]+/).filter(function (x) { return x.length === 15; }); cnt.textContent = arr.length + ' IMEI' + (arr.length !== UI.num(qty.value) ? ' (qty ' + UI.num(qty.value) + ')' : ' ✔'); cnt.className = 'xs ' + (arr.length === UI.num(qty.value) ? 'green b' : 'red b'); return arr; }
      imeiTa.addEventListener('input', parseImeis); qty.addEventListener('input', parseImeis); parseImeis();
      var imeiWrap = h('div', { class: 'field' + (picked && picked.item_type === 'Quantity' ? ' hide' : '') }, [h('label', { class: 'lbl' }, t('imei_paste')), imeiTa, cnt]);
      var btn = h('button', { class: 'btn gold', onClick: function () { if (!picked) return UI.toast(LANG === 'hinglish' ? 'Item chuno' : 'Pick item', 'err'); var nr = { bill_line_idx: Number(blSel.value), variant_id: picked.id, name: picked.full_name, item_type: picked.item_type, qty: UI.num(qty.value) || 1, rate: UI.num(rate.value), imeis: picked.item_type === 'Quantity' ? [] : parseImeis() }; if (i >= 0) d.receipt_lines[i] = nr; else d.receipt_lines.push(nr); saveP(d); sh.close(); App.render(); } }, t('save'));
      var del = i >= 0 ? h('button', { class: 'btn red mt', onClick: function () { d.receipt_lines.splice(i, 1); saveP(d); sh.close(); App.render(); } }, t('remove')) : null;
      var sh = UI.sheet(t('actual'), h('div', null, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, LANG === 'hinglish' ? 'Asli item (stock ke liye)' : 'Original item (for stock)'), q, hits]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, LANG === 'hinglish' ? 'Bill ki kaunsi line se (tax/HSN)' : 'Maps to bill line (tax/HSN)'), blSel]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('qty')), qty]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('rate')), rate])]), imeiWrap, btn, del]));
      setTimeout(function () { if (!picked) q.focus(); }, 60);
    }
    function paySheet(d, total) {
      var modes = m.paymentModes.filter(function (x) { return ['Cash', 'Bank', 'Card'].indexOf(x.kind) >= 0; });
      var amt = h('input', { value: d.payment ? d.payment.amount : total, inputmode: 'numeric' });
      var sh = UI.sheet(t('payment'), h('div', null, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('paid_now') + ' (₹)'), amt]), h('div', { class: 'paygrid mb' }, modes.map(function (mo) { return h('button', { onClick: function () { d.payment = { mode_id: mo.id, mode_name: mo.name, amount: UI.num(amt.value) }; saveP(d); sh.close(); App.render(); } }, mo.name); })), h('button', { class: 'btn ghost', onClick: function () { d.payment = null; saveP(d); sh.close(); App.render(); } }, LANG === 'hinglish' ? 'Udhar — baad mein denge' : 'Credit — pay later')]));
    }
  };

  // ---------------- BILLS ----------------
  S.bills = function (params) {
    var wrap = h('div');
    var q = h('input', { placeholder: LANG === 'hinglish' ? 'Bill no, naam, mobile…' : 'Bill no, name, mobile…' });
    var from = h('input', { type: 'date', value: params.from || UI.today().slice(0, 8) + '01', style: { height: '40px', fontSize: '13px' } }), to = h('input', { type: 'date', value: params.to || UI.today(), style: { height: '40px', fontSize: '13px' } });
    wrap.appendChild(UI.topbar(t('bills_title'), '', { back: '#/home', extra: h('div', null, [h('div', { class: 'search', style: { height: '46px', borderWidth: '1px', borderColor: '#444', background: '#1c1c1c', color: '#fff' } }, [icon('search'), q]), h('div', { class: 'row mt' }, [from, to])]) }));
    var list = h('div', { class: 'card pad0 list' }, UI.spinner()); var sum = h('div', { class: 'sec' });
    wrap.appendChild(h('div', { class: 'content' }, [sum, list])); wrap.appendChild(UI.tabbar('search'));
    var tm = null;
    function load() { list.innerHTML = ''; list.appendChild(UI.spinner()); API.call('sales.list', { from: from.value, to: to.value, q: q.value.trim() }).then(function (rows) { list.innerHTML = ''; if (!rows.length) list.appendChild(h('div', { class: 'empty' }, t('no_match'))); rows.forEach(function (s) { list.appendChild(S.billRow(s)); }); var tot = rows.filter(function (s) { return s.status === 'Active'; }).reduce(function (a, s) { return a + (s.doc_type === 'CreditNote' ? -1 : 1) * Number(s.total); }, 0); sum.innerHTML = ''; sum.appendChild(h('span', null, rows.length + ' ' + t('bills'))); sum.appendChild(h('span', null, money(tot, true))); }).catch(function (e) { UI.toast(e.message, 'err'); }); }
    q.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(load, 300); }); from.addEventListener('change', load); to.addEventListener('change', load);
    load();
    return wrap;
  };

  S.billSheet = function (id) {
    var body = h('div', null, UI.spinner());
    var sh = UI.sheet(t('view_bill'), body);
    API.call('sales.get', { id: id }).then(function (g) {
      var s = g.sale, data = { settings: API.state.settings, sale: s, lines: g.lines, payments: g.payments };
      var waHref = 'https://wa.me/' + (s.cust_mobile ? '91' + s.cust_mobile : '') + '?text=' + encodeURIComponent(Bill.whatsappText(data));
      var canEdit = s.status === 'Active' && (API.can('edit_all') || (API.can('edit_own') && s.created_by === API.state.user.id));
      body.innerHTML = '';
      body.appendChild(h('div', null, [
        h('div', { class: 'row', style: { alignItems: 'flex-start' } }, [h('div', null, [h('div', { style: { fontSize: '20px', fontWeight: 800 } }, s.bill_no), h('div', { class: 'small mute' }, UI.fdate(s.date) + ' · ' + s.salesperson + (s.doc_type === 'CreditNote' ? ' · CREDIT NOTE' : ''))]), h('div', { class: 'right' }, [h('div', { style: { fontSize: '20px', fontWeight: 800 } }, money(s.total, true)), s.status === 'Cancelled' ? h('span', { class: 'tag r' }, 'CANCELLED') : g.locked ? h('span', { class: 'tag y' }, '🔒 ' + t('locked_msg')) : h('span', { class: 'tag g' }, s.pending > 0 ? t('balance') + ' ' + money(s.pending, true) : 'PAID')])]),
        h('div', { class: 'card mt' }, [h('div', { class: 'b' }, s.cust_name), h('div', { class: 'small mute' }, (s.cust_mobile || '') + (s.cust_gstin ? ' · ' + s.cust_gstin : ''))]),
        h('div', { class: 'card pad0 list mt' }, g.lines.map(function (l) { return h('div', { class: 'item' }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, l.description), h('div', { class: 's' }, (l.imei ? 'IMEI ' + l.imei + ' · ' : '') + 'HSN ' + l.hsn + ' · GST ' + l.gst_rate + '%')]), h('div', { class: 'amt' }, [money(l.amount, true), l.qty > 1 ? h('div', { class: 's' }, l.qty + ' × ' + money(l.rate_incl, true)) : null])]); })),
        h('div', { class: 'card pad0 list mt' }, g.payments.map(function (p) { return h('div', { class: 'item', style: { minHeight: '46px' } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, p.mode_name + (p.ref_no ? ' · ' + p.ref_no : '')), h('div', { class: 's' }, p.kind)]), h('div', { class: 'amt' }, [money(p.amount, true), h('div', { class: 's ' + (p.status === 'Pending' ? 'red' : 'green') }, p.status)])]); })),
        h('div', { class: 'grid2 mt' }, [h('button', { class: 'btn black', onClick: function () { Bill.print(data); } }, [icon('print', 20), t('print')]), h('a', { class: 'btn ghost', href: waHref, target: '_blank', rel: 'noopener' }, [icon('share', 20), t('share')])]),
        s.pdf_url ? h('a', { class: 'btn ghost mt', href: s.pdf_url, target: '_blank', rel: 'noopener' }, t('pdf') + ' (Drive)') : null,
        s.status === 'Active' && s.doc_type !== 'CreditNote' && API.can('sale') ? h('button', { class: 'btn ghost mt', onClick: function () { S.noteSheet({ side: 'customer', ref: s, g: g, parentSheet: sh }); } }, LANG === 'hinglish' ? 'Credit note / adjustment (wapas · rate diff · discount)' : 'Credit note / adjustment (return · rate diff · discount)') : null,
        canEdit && s.doc_type !== 'CreditNote' ? h('div', { class: 'grid2 mt' }, [h('button', { class: 'btn ghost', onClick: function () { editPayments(g, sh); } }, [icon('edit', 18), t('payment')]), API.can('delete') ? h('button', { class: 'btn red', onClick: function () { UI.prompt(t('cancel_bill'), t('reason')).then(function (reason) { if (reason === null) return; API.call('sales.cancel', { id: s.id, reason: reason }).then(function () { UI.toast(s.bill_no + ' cancelled', 'ok'); sh.close(); App.render(); }).catch(function (e) { UI.toast(e.message, 'err', 6000); }); }); } }, t('cancel_bill')) : null]) : null,
        h('div', { class: 'sec mt' }, [h('span', null, 'History')]), h('div', { class: 'hist' }, g.history.map(function (x) { return h('div', { class: 'h' }, [h('span', { class: 'tag ' + (x.action === 'INSERT' ? 'g' : x.action === 'DELETE' || x.action === 'DENIED' ? 'r' : x.action === 'LOCKED_EDIT' ? 'y' : 'b') }, x.action), ' ', h('b', null, x.user), ' · ', h('span', { class: 'mute' }, UI.fdt(x.ts)), x.version ? ' · v' + x.version : '', x.changes && typeof x.changes === 'object' ? h('div', { class: 'xs mute' }, Object.keys(x.changes).slice(0, 6).map(function (k) { var c = x.changes[k]; return k + ': ' + (c && c.from !== undefined ? c.from + ' → ' + c.to : JSON.stringify(c)); }).join(' · ')) : null]); }))
      ]));
    }).catch(function (e) { body.innerHTML = ''; body.appendChild(h('div', { class: 'empty red' }, e.message)); });
  };
  function editPayments(g, parentSheet) {
    var s = g.sale, modes = API.state.masters.paymentModes.filter(function (m) { return m.kind !== 'Exchange'; });
    var pays = g.payments.filter(function (p) { return p.kind !== 'Exchange'; }).map(function (p) { return { mode_id: p.mode_id, mode_name: p.mode_name, amount: Number(p.amount), ref_no: p.ref_no }; });
    var rows = h('div'), bal = h('div', { class: 'b' });
    function sum() { return pays.reduce(function (a, p) { return a + (Number(p.amount) || 0); }, 0); }
    function refresh() { var b = Math.round((Number(s.net_payable) - sum()) * 100) / 100; bal.textContent = t('balance') + ': ' + money(b, true); bal.className = 'b ' + (Math.abs(b) < 0.5 ? 'green' : 'red'); }
    function render() { rows.innerHTML = ''; pays.forEach(function (p, i) { var amt = h('input', { class: 'amt', value: p.amount, inputmode: 'numeric', onInput: function () { p.amount = UI.num(amt.value); refresh(); } }); rows.appendChild(h('div', { class: 'payrow' }, [h('div', { class: 'grow b' }, p.mode_name), amt, h('button', { class: 'iconbtn', style: { color: 'var(--mute)', width: '32px' }, onClick: function () { pays.splice(i, 1); render(); refresh(); } }, icon('x', 16))])); }); refresh(); }
    render();
    var grid = h('div', { class: 'paygrid mb' }, modes.map(function (m) { return h('button', { onClick: function () { pays.push({ mode_id: m.id, mode_name: m.name, amount: Math.max(0, Number(s.net_payable) - sum()), ref_no: '' }); render(); } }, m.name); }));
    var btn = h('button', { class: 'btn gold', onClick: function () { btn.disabled = true; API.call('sales.update', { id: s.id, payments: pays, regenerate_pdf: true }).then(function () { UI.toast('✔', 'ok'); sh.close(); parentSheet.close(); App.render(); }).catch(function (e) { UI.toast(e.message, 'err', 6000); btn.disabled = false; }); } }, t('save'));
    var sh = UI.sheet(t('payment') + ' · ' + s.bill_no, h('div', null, [h('div', { class: 'row mb' }, [h('div', null, t('to_collect') + ': ' + money(s.net_payable, true)), bal]), grid, rows, btn]));
  }

  // ---------------- PENDING ----------------
  S.pending = function () {
    var wrap = h('div'); wrap.appendChild(UI.topbar(t('pending_title'), LANG === 'hinglish' ? 'Finance DA + customer udhar' : 'Finance DA + customer credit', { back: '#/home' }));
    var body = h('div', { class: 'content' }, UI.spinner()); wrap.appendChild(body); wrap.appendChild(UI.tabbar(''));
    API.call('sales.pending').then(function (r) {
      body.innerHTML = '';
      body.appendChild(h('div', { class: 'kpis' }, Object.keys(r.byMode).slice(0, 3).map(function (k) { return h('div', { class: 'kpi' }, [h('div', { class: 'k' }, k), h('div', { class: 'v g' }, UI.short(r.byMode[k]))]); })));
      body.appendChild(h('div', { class: 'sec' }, [h('span', null, r.rows.length + ' items'), h('span', null, money(r.total, true))]));
      var list = h('div', { class: 'card pad0 list' });
      if (!r.rows.length) list.appendChild(h('div', { class: 'empty' }, '🎉 ' + (LANG === 'hinglish' ? 'Sab paisa aa gaya' : 'All received')));
      r.rows.forEach(function (x) { list.appendChild(h('div', { class: 'item' }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, x.customer + ' · ' + x.bill_no), h('div', { class: 's' }, x.mode + ' · ' + UI.fdate(x.date) + ' · ' + x.days + ' ' + t('days') + (x.ref_no ? ' · ' + x.ref_no : ''))]), h('div', { class: 'amt' }, money(x.amount, true)), API.can('sale') ? h('button', { class: 'btn sm black', onClick: function () { UI.prompt(t('mark_received'), t('ref_no')).then(function (ref) { if (ref === null) return; API.call('sales.markReceived', { ids: [x.id], ref_no: ref }).then(function () { UI.toast('✔', 'ok'); App.render(); }).catch(function (e) { UI.toast(e.message, 'err'); }); }); } }, '✓') : null])); });
      body.appendChild(list);
    }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
    return wrap;
  };

  // ---------------- PARTIES ----------------
  S.parties = function () {
    var wrap = h('div'); var q = h('input', { placeholder: LANG === 'hinglish' ? 'Naam, mobile, GSTIN…' : 'Name, mobile, GSTIN…' });
    wrap.appendChild(UI.topbar(t('parties'), '', { back: '#/home', extra: h('div', { class: 'search', style: { height: '46px', borderWidth: '1px', borderColor: '#444', background: '#1c1c1c', color: '#fff' } }, [icon('search'), q]), right: API.can('parties') ? h('button', { class: 'pillbtn', onClick: function () { S.partyForm({}, function () { App.render(); }); } }, '+ ' + t('new_party').split(' ')[0]) : null }));
    var list = h('div', { class: 'card pad0 list' }); wrap.appendChild(h('div', { class: 'content' }, list)); wrap.appendChild(UI.tabbar('users'));
    function show() { var m = API.state.masters || { parties: [] }, text = q.value.trim().toLowerCase(); list.innerHTML = ''; var rows = m.parties.filter(function (p) { return !text || (p.name + ' ' + p.mobile + ' ' + p.gstin).toLowerCase().indexOf(text) >= 0; }).slice(0, 60); if (!rows.length) list.appendChild(h('div', { class: 'empty' }, t('no_match'))); rows.forEach(function (p) { list.appendChild(h('div', { class: 'item click', onClick: function () { if (API.can('parties')) S.partyForm(p, function () { App.render(); }); } }, [h('div', { class: 'avatar', style: { background: p.type === 'Supplier' ? 'var(--purple-t)' : 'var(--blue-t)', color: p.type === 'Supplier' ? 'var(--purple)' : 'var(--blue)', borderRadius: '50%' } }, UI.initials(p.name)), h('div', { class: 'grow' }, [h('div', { class: 't' }, p.name), h('div', { class: 's' }, (p.mobile || '') + (p.gstin ? ' · ' + p.gstin : '') + ' · ' + p.type)]), icon('chev')])); }); }
    q.addEventListener('input', show); API.masters().then(show);
    return wrap;
  };

  // ---------------- REPORTS ----------------
  S.reports = function () {
    var wrap = h('div'); wrap.appendChild(UI.topbar(t('reports'), UI.fdate(UI.today()).slice(2), { back: '#/home' }));
    var body = h('div', { class: 'content' }, UI.spinner()); wrap.appendChild(body); wrap.appendChild(UI.tabbar(''));
    API.call('reports.dashboard').then(function (d) {
      body.innerHTML = '';
      body.appendChild(h('div', { class: 'sec' }, [h('span', null, LANG === 'hinglish' ? 'Is mahine' : 'This month')]));
      body.appendChild(h('div', { class: 'kpis' }, [h('div', { class: 'kpi' }, [h('div', { class: 'k' }, 'Sales'), h('div', { class: 'v g' }, UI.short(d.month.sales)), h('div', { class: 's' }, d.month.bills + ' ' + t('bills'))]), h('div', { class: 'kpi' }, [h('div', { class: 'k' }, 'Gross ' + t('margin')), h('div', { class: 'v' }, UI.short(d.month.margin))]), h('div', { class: 'kpi' }, [h('div', { class: 'k' }, 'Purchases'), h('div', { class: 'v' }, UI.short(d.month.purchases))])]));
      body.appendChild(h('div', { class: 'card pad0 list mt' }, [row(t('receivable') + ' — Finance', d.receivable.finance, '#/pending'), row(t('receivable') + ' — Udhar', d.receivable.udhar, '#/pending'), row(LANG === 'hinglish' ? 'Suppliers ko dena' : 'Payable to suppliers', d.payable), row(t('stock_value'), d.stock.value, '#/stock'), row(t('cash_in_hand'), d.cash_in_hand)]));
      if (API.can('gst')) { var per = UI.today().slice(0, 7); var gbox = h('div', { class: 'card mt' }, UI.spinner()); body.appendChild(h('div', { class: 'sec' }, [h('span', null, 'GST summary · ' + per), h('a', { href: '#/locks', class: 'goldc', style: { textTransform: 'none', letterSpacing: 0 } }, t('locks') + ' →')])); body.appendChild(gbox); API.call('reports.gstSummary', { period: per }).then(function (g) { gbox.innerHTML = ''; gbox.appendChild(h('table', { class: 'tbl' }, [h('tr', null, [h('td', null, 'Bills'), h('td', { class: 'r b' }, g.bills)]), h('tr', null, [h('td', null, 'B2B / B2C'), h('td', { class: 'r' }, g.b2b.length + ' / ' + g.b2c.count)]), h('tr', null, [h('td', null, 'Taxable'), h('td', { class: 'r' }, money(g.totals.taxable))]), h('tr', null, [h('td', null, 'CGST + SGST'), h('td', { class: 'r' }, money(g.totals.cgst + g.totals.sgst))]), h('tr', null, [h('td', null, 'IGST'), h('td', { class: 'r' }, money(g.totals.igst))]), h('tr', null, [h('td', { class: 'b' }, 'Output tax'), h('td', { class: 'r b' }, money(g.totals.cgst + g.totals.sgst + g.totals.igst))]), h('tr', null, [h('td', null, 'ITC (purchases ' + g.itc.bills + ')'), h('td', { class: 'r green' }, money(g.itc.cgst + g.itc.sgst + g.itc.igst))]), h('tr', null, [h('td', { class: 'b' }, 'Net payable (approx)'), h('td', { class: 'r b' }, money(g.totals.cgst + g.totals.sgst + g.totals.igst - g.itc.cgst - g.itc.sgst - g.itc.igst))])])); gbox.appendChild(h('div', { class: 'sec' }, [h('span', null, 'HSN-wise')])); gbox.appendChild(h('table', { class: 'tbl' }, [h('tr', null, [h('th', null, 'HSN'), h('th', { class: 'r' }, 'Qty'), h('th', { class: 'r' }, 'Taxable'), h('th', { class: 'r' }, 'Tax')])].concat(g.hsn.map(function (x) { return h('tr', null, [h('td', null, x.hsn), h('td', { class: 'r' }, x.qty), h('td', { class: 'r' }, money(x.taxable)), h('td', { class: 'r' }, money(x.cgst + x.sgst + x.igst))]); })))); }).catch(function (e) { gbox.textContent = e.message; }); }
      body.appendChild(h('div', { class: 'note blue mt small' }, LANG === 'hinglish' ? 'Graphs, P&L, partner statement, Tally XML — Phase 3–4 mein.' : 'Graphs, P&L, partner statements, Tally XML — Phase 3–4.'));
    }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
    function row(k, v, href) { return h(href ? 'a' : 'div', { class: 'item' + (href ? ' click' : ''), href: href, style: { minHeight: '50px' } }, [h('div', { class: 'grow t' }, k), h('div', { class: 'amt' }, money(v, true)), href ? icon('chev') : null]); }
    return wrap;
  };

  // ---------------- MORE / ADMIN ----------------
  S.more = function () {
    var wrap = h('div'), u = API.state.user;
    wrap.appendChild(UI.topbar(t('more'), u.name + ' · ' + u.role, { back: '#/home' }));
    var items = [
      ['#/pending', 'clock', LANG === 'hinglish' ? 'Lena / Dena' : 'Outstanding', LANG === 'hinglish' ? 'bill-wise · finance DA' : 'bill-wise · finance DA', true],
      ['#/accounts', 'bank', LANG === 'hinglish' ? 'Accounts' : 'Accounts', LANG === 'hinglish' ? 'Cash · Bank · Partner · Loan · P&L' : 'Cash · Bank · Partners · Loans · P&L', API.can('accounts')],
      ['#/purchases', 'box', LANG === 'hinglish' ? 'Purchases list' : 'Purchases', LANG === 'hinglish' ? 'bills · debit note · 2B' : 'bills · debit note · 2B', API.can('purchase')],
      ['#/repair', 'edit', 'Repair', LANG === 'hinglish' ? 'job cards' : 'job cards', API.can('sale')],
      ['#/notes', 'edit', LANG === 'hinglish' ? 'Credit / Debit notes' : 'Credit / Debit notes', LANG === 'hinglish' ? 'wapas · rate diff · discount · damage' : 'return · rate diff · discount · damage', API.can('sale') || API.can('purchase')],
      ['#/settings', 'edit', t('settings'), t('profile') + ' · ' + t('language'), true],
      ['#/customfields', 'plus', LANG === 'hinglish' ? 'Custom fields' : 'Custom fields', null, API.can('settings')],
      ['#/import', 'box', LANG === 'hinglish' ? 'Excel import' : 'Excel import', null, API.can('settings')],
      ['#/console', 'chart', 'Console', LANG === 'hinglish' ? 'clients · DB health · license' : 'clients · DB health · license', API.can('console')],
      ['#/users', 'users', t('users'), null, API.can('users')],
      ['#/locks', 'lock', t('locks'), 'GSTR-1 · 2B · Tally', API.can('gst')],
      ['#/review', 'check', t('review'), null, API.can('console')],
      ['#/audit', 'clock', t('audit'), 'Tally-style edit log', true],
      ['#/password', 'lock', t('change_pw'), null, true]
    ].filter(function (x) { return x[4]; });
    wrap.appendChild(h('div', { class: 'content' }, [
      h('div', { class: 'card pad0 list menu' }, items.map(function (x) { return h('a', { href: x[0], class: 'item click' }, [h('div', { class: 'avatar', style: { background: 'var(--soft)', color: '#444' } }, icon(x[1], 18)), h('div', { class: 'grow' }, [h('div', { class: 't' }, x[2]), x[3] ? h('div', { class: 's' }, x[3]) : null]), icon('chev')]); })),
      h('button', { class: 'btn ghost mt', onClick: function () { API.logout().then(function () { location.hash = '#/login'; }); } }, [icon('logout', 20), t('logout')]),
      h('div', { class: 'center xs mute mt' }, 'v' + (APP_CONFIG.APP_VERSION) + (API.state.serverVersion ? ' · server ' + API.state.serverVersion : '') + (API.state.demo ? ' · DEMO' : '')),
      API.state.demo ? h('button', { class: 'btn sm ghost mt', style: { margin: '12px auto 0', display: 'flex' }, onClick: function () { UI.confirm('Demo data reset?').then(function (ok) { if (ok) { window.DemoBackend.reset(); API.logout().then(function () { location.hash = '#/login'; }); } }); } }, 'Reset demo data') : null
    ]));
    wrap.appendChild(UI.tabbar('more'));
    return wrap;
  };

  S.settings = function () {
    var wrap = h('div'), s = API.state.settings, canEdit = API.can('settings');
    wrap.appendChild(UI.topbar(t('settings'), '', { back: '#/more' }));
    var keys = [['shop_name', 'Shop name'], ['shop_tagline', 'Tagline'], ['shop_address', 'Address'], ['shop_gstin', 'GSTIN'], ['shop_state_code', 'State code'], ['shop_phone1', 'Phone 1'], ['shop_phone2', 'Phone 2'], ['shop_instagram', 'Instagram'], ['owner_email', 'Owner email (bill copy)'], ['bill_pdf_folder', 'Drive folder']];
    if (API.state.user.role === 'super_admin') [['tally_company', 'Tally company name (optional)'], ['hot_months', LANG === 'hinglish' ? 'Hot data (mahine) — purana archive hoga' : 'Hot data (months) — older is archived'], ['repair_warranty_days', 'Repair warranty days'], ['shop_city', 'City (jurisdiction on bill)']].forEach(function (k) { keys.push(k); });
    var inputs = {};
    var form = h('div', { class: 'card' }, keys.map(function (k) { inputs[k[0]] = h('input', { value: s[k[0]] || '', disabled: !canEdit }); return h('div', { class: 'field' }, [h('label', { class: 'lbl' }, k[1]), inputs[k[0]]]); }));
    var toggles = [['send_bill_email', LANG === 'hinglish' ? 'Har bill owner ko email' : 'Email every bill to owner'], ['margin_scheme_old_phones', LANG === 'hinglish' ? 'Purane phone: GST sirf margin par' : 'Old phones: GST on margin only'], ['require_imei', LANG === 'hinglish' ? 'Purchase mein IMEI zaroori' : 'IMEI mandatory on purchase']].concat(API.state.user.role === 'super_admin' ? [['tally_with_inventory', LANG === 'hinglish' ? 'Tally XML mein stock items bhejo' : 'Send stock items in Tally XML'], ['archive_enabled', LANG === 'hinglish' ? 'Raat ko purana data archive karo' : 'Nightly archive of old data'], ['allow_negative_stock', LANG === 'hinglish' ? 'Accessories negative stock allow' : 'Allow negative accessory stock']] : []);
    var tg = {};
    var tbox = h('div', { class: 'card mt' }, toggles.map(function (k) { tg[k[0]] = h('input', { type: 'checkbox', checked: s[k[0]] === 'true', disabled: !canEdit, style: { flex: '0 0 20px' } }); return h('label', { class: 'row', style: { minHeight: '44px' } }, [tg[k[0]], h('span', null, k[1])]); }));
    var tmpl = h('select', { disabled: !canEdit }, [['GST', 'GST Invoice'], ['Retail', 'Retail (simple)']].map(function (o) { return h('option', { value: o[0], selected: (s.default_template || 'GST') === o[0] }, o[1]); }));
    var lang = h('div', { class: 'chips' }, [['hinglish', 'Hinglish'], ['english', 'English']].map(function (l) { return h('button', { class: 'chip' + (LANG === l[0] ? ' on' : ''), onClick: function () { setLang(l[0]); App.render(); } }, l[1]); }));
    var btn = canEdit ? h('button', { class: 'btn gold mt', onClick: function () { var p = {}; keys.forEach(function (k) { p[k[0]] = inputs[k[0]].value; }); toggles.forEach(function (k) { p[k[0]] = tg[k[0]].checked ? 'true' : 'false'; }); p.default_template = tmpl.value; btn.disabled = true; API.call('settings.save', p).then(function (ns) { API.state.settings = ns; API.invalidateMasters(); UI.toast('✔', 'ok'); btn.disabled = false; }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, t('save')) : null;
    wrap.appendChild(h('div', { class: 'content' }, [h('div', { class: 'sec' }, [h('span', null, t('language') + ' (UI)')]), lang, h('div', { class: 'xs mute mt' }, LANG === 'hinglish' ? 'Bills, reports, exports hamesha English.' : 'Bills, reports and exports are always English.'), h('div', { class: 'sec' }, [h('span', null, t('profile'))]), form, h('div', { class: 'field mt' }, [h('label', { class: 'lbl' }, 'Default bill template'), tmpl]), tbox, btn]));
    return wrap;
  };

  S.users = function () {
    var wrap = h('div'); wrap.appendChild(UI.topbar(t('users'), '', { back: '#/more', right: h('button', { class: 'pillbtn', onClick: function () { userForm(null); } }, '+ User') }));
    var list = h('div', { class: 'card pad0 list' }, UI.spinner()); wrap.appendChild(h('div', { class: 'content' }, list));
    API.call('users.list').then(function (rows) { list.innerHTML = ''; rows.forEach(function (u) { list.appendChild(h('div', { class: 'item click', onClick: function () { userForm(u); } }, [h('div', { class: 'avatar', style: { background: u.role === 'super_admin' ? '#111' : u.role === 'owner' ? 'var(--gold)' : 'var(--soft)', color: u.role === 'super_admin' ? 'var(--gold)' : '#111', borderRadius: '50%' } }, UI.initials(u.name)), h('div', { class: 'grow' }, [h('div', { class: 't' }, u.name), h('div', { class: 's' }, u.username + ' · ' + u.role + ' · ' + (u.permissions || []).length + ' perms')]), icon('chev')])); }); }).catch(function (e) { UI.toast(e.message, 'err'); });
    function userForm(u) {
      var PERMS = [['sale', 'Sale'], ['purchase', 'Purchase'], ['stock', 'Stock'], ['expense', 'Kharcha'], ['reports', 'Reports'], ['parties', 'Parties'], ['items', 'Items'], ['edit_own', LANG === 'hinglish' ? 'Apni entry edit' : 'Edit own'], ['edit_all', LANG === 'hinglish' ? 'Sabki entry edit' : 'Edit all'], ['delete', 'Cancel/Delete'], ['users', 'Users'], ['settings', 'Settings'], ['accounts', 'Accounts'], ['gst', 'GST & Locks']];
      var name = h('input', { value: u ? u.name : '' }), username = h('input', { value: u ? u.username : '', disabled: !!u, autocapitalize: 'none' }), pw = h('input', { type: 'password', placeholder: u ? (LANG === 'hinglish' ? 'Badalna ho to likho' : 'Leave blank to keep') : '' }), email = h('input', { value: u ? u.email || '' : '' });
      var roles = ['owner', 'staff', 'accountant']; if (API.state.user.role === 'super_admin') roles.unshift('super_admin');
      var roleSel = h('select', null, roles.map(function (r) { return h('option', { value: r, selected: u && u.role === r }, r); }));
      var perms = {}; (u ? u.permissions : ['sale', 'stock', 'parties', 'items', 'edit_own']).forEach(function (p) { perms[p] = true; });
      var pbox = h('div', { class: 'chips', style: { flexWrap: 'wrap' } }, PERMS.map(function (p) { return h('button', { class: 'chip' + (perms[p[0]] ? ' on' : ''), onClick: function () { perms[p[0]] = !perms[p[0]]; this.classList.toggle('on', perms[p[0]]); } }, p[1]); }));
      var active = h('input', { type: 'checkbox', checked: !u || u.active !== false, style: { flex: '0 0 20px' } });
      var btn = h('button', { class: 'btn gold', onClick: function () { btn.disabled = true; API.call('users.save', { id: u ? u.id : undefined, name: name.value, username: username.value, password: pw.value || undefined, email: email.value, role: roleSel.value, permissions: Object.keys(perms).filter(function (k) { return perms[k]; }), active: active.checked }).then(function () { UI.toast('✔', 'ok'); sh.close(); App.render(); }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, t('save'));
      var sh = UI.sheet(u ? u.name : '+ User', h('div', null, [h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('name')), name]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('username')), username])]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, t('password')), pw]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Email'), email])]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Role'), roleSel]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, LANG === 'hinglish' ? 'Kya-kya kar sakta hai (tick)' : 'Permissions'), pbox]), u ? h('label', { class: 'row mb' }, [active, h('span', null, 'Active')]) : null, btn]));
    }
    return wrap;
  };

  S.locks = function () {
    var wrap = h('div'); wrap.appendChild(UI.topbar(t('locks'), LANG === 'hinglish' ? 'Tick = us month ke bills freeze' : 'Tick = bills of that month freeze', { back: '#/more' }));
    var body = h('div', { class: 'content' }, UI.spinner()); wrap.appendChild(body);
    API.call('locks.list').then(function (rows) {
      body.innerHTML = '';
      var months = []; var d = new Date(); for (var i = 0; i < 6; i++) { months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')); d.setMonth(d.getMonth() - 1); }
      var idx = {}; rows.forEach(function (r) { idx[r.period] = r; });
      body.appendChild(h('div', { class: 'card pad0' }, h('table', { class: 'tbl' }, [h('tr', null, [h('th', null, 'Month'), h('th', null, 'GSTR-1 filed'), h('th', null, '2B reconciled'), h('th', null, 'Books closed')])].concat(months.map(function (mo) { var r = idx[mo] || {}; function cb(key) { var c = h('input', { type: 'checkbox', checked: String(r[key]) === 'true', style: { width: '22px', height: '22px' }, onChange: function () { var p = { period: mo }; p[key] = c.checked; API.call('locks.set', p).then(function () { UI.toast(mo + ' ' + key + (c.checked ? ' 🔒' : ' 🔓'), 'ok'); }).catch(function (e) { UI.toast(e.message, 'err'); c.checked = !c.checked; }); } }); return c; } return h('tr', null, [h('td', { class: 'b' }, mo), h('td', null, cb('gstr1_filed')), h('td', null, cb('b2_reconciled')), h('td', null, cb('books_closed'))]); })))));
      body.appendChild(h('div', { class: 'note mt small' }, LANG === 'hinglish' ? 'GSTR-1 tick → us month ki sales partner/staff edit nahi kar sakte (sirf Super Admin, reason ke saath). Tally XML export Phase 3 mein yahin aayega.' : 'GSTR-1 tick → that month\'s sales are frozen for partners/staff (Super Admin can edit with a reason). Tally XML export lands here in Phase 3.'));
    }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
    return wrap;
  };

  S.review = function () {
    var wrap = h('div'); wrap.appendChild(UI.topbar(t('review'), LANG === 'hinglish' ? 'Software ko yahan confidence nahi tha' : 'Items the software was unsure about', { back: '#/more' }));
    var body = h('div', { class: 'content' }, UI.spinner()); wrap.appendChild(body);
    API.call('review.list').then(function (rows) { body.innerHTML = ''; if (!rows.length) body.appendChild(h('div', { class: 'empty' }, '✔ ' + (LANG === 'hinglish' ? 'Kuch review nahi' : 'Nothing to review'))); rows.forEach(function (r) { body.appendChild(h('div', { class: 'card mb', style: { background: 'var(--gold-t)' } }, [h('div', { class: 'row', style: { alignItems: 'flex-start' } }, [h('div', { style: { flex: 1 } }, [h('div', { class: 'b' }, r.type), h('div', { class: 'small' }, r.message), r.suggestion ? h('div', { class: 'xs goldc mt' }, '→ ' + r.suggestion) : null, h('div', { class: 'xs mute' }, UI.fdt(r.ts))]), h('button', { class: 'btn sm black', style: { flex: '0 0 auto' }, onClick: function () { API.call('review.resolve', { id: r.id }).then(function () { App.render(); }); } }, 'OK')])])); }); }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
    return wrap;
  };

  S.audit = function () {
    var wrap = h('div'); wrap.appendChild(UI.topbar(t('audit'), LANG === 'hinglish' ? 'Kisne, kab, kya badla' : 'Who changed what, when', { back: '#/more' }));
    var body = h('div', { class: 'content' }, UI.spinner()); wrap.appendChild(body);
    API.call('audit.history', { limit: 150 }).then(function (rows) { body.innerHTML = ''; body.appendChild(h('div', { class: 'card pad0' }, h('table', { class: 'tbl' }, [h('tr', null, [h('th', null, 'When'), h('th', null, 'Who'), h('th', null, 'What'), h('th', null, 'Record')])].concat(rows.map(function (x) { return h('tr', null, [h('td', { class: 'xs mute', style: { whiteSpace: 'nowrap' } }, UI.fdt(x.ts)), h('td', { class: 'b' }, x.user), h('td', null, [h('span', { class: 'tag ' + (x.action === 'INSERT' ? 'g' : /DELETE|DENIED/.test(x.action) ? 'r' : /LOCK/.test(x.action) ? 'y' : 'b') }, x.action), x.changes && typeof x.changes === 'object' ? h('div', { class: 'xs mute' }, Object.keys(x.changes).slice(0, 4).map(function (k) { var c = x.changes[k]; return k + ': ' + (c && c.from !== undefined ? c.from + '→' + c.to : JSON.stringify(c)); }).join(' · ').slice(0, 160)) : null]), h('td', { class: 'xs' }, x.table + (x.version ? ' v' + x.version : ''))]); }))))); }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
    return wrap;
  };

  S.password = function () {
    var wrap = h('div'); wrap.appendChild(UI.topbar(t('change_pw'), '', { back: '#/more' }));
    var o = h('input', { type: 'password' }), n = h('input', { type: 'password' }), n2 = h('input', { type: 'password' });
    var btn = h('button', { class: 'btn gold', onClick: function () { if (n.value !== n2.value) return UI.toast('Match nahi', 'err'); btn.disabled = true; API.call('auth.changePassword', { old_password: o.value, new_password: n.value }).then(function () { UI.toast('✔', 'ok'); location.hash = '#/more'; }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, t('save'));
    wrap.appendChild(h('div', { class: 'content' }, [h('div', { class: 'card' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Old password'), o]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'New password'), n]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Repeat'), n2]), btn])]));
    return wrap;
  };

  S.phase2 = function (title) { return function () { var wrap = h('div'); wrap.appendChild(UI.topbar(title, '', { back: '#/home' })); wrap.appendChild(h('div', { class: 'content' }, h('div', { class: 'card center', style: { padding: '40px 16px' } }, [h('div', { style: { fontSize: '40px' } }, '🛠️'), h('div', { class: 'b mt' }, t('phase2')), h('div', { class: 'small mute' }, LANG === 'hinglish' ? 'Kharcha, partner capital, cash book — agle phase mein.' : 'Expenses, partner capital, cash book — next phase.')]))); wrap.appendChild(UI.tabbar('')); return wrap; }; };
})(window.Screens);
