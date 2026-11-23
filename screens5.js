/* Screens part 5: Credit / Debit notes for any reason (return, rate difference, discount, damage, other) + notes list */
(function (S) {
  var h = UI.h, icon = UI.icon, money = UI.money, L = S.L;
  var KINDS = [['Return', 'Maal wapas', 'Goods return', 'stock wapas aata hai'], ['RateDiff', 'Rate difference', 'Rate difference', 'bill ke baad rate kam/zyada tay hua'], ['Discount', 'Discount', 'Discount', 'settlement / payment discount (GST nahi)'], ['Damage', 'Damage / shortage', 'Damage / shortage', 'kharab ya kam maal ka claim'], ['Other', 'Kuch aur', 'Other', 'koi bhi adjustment']];
  S.NOTE_KINDS = KINDS;

  /**
   * noteSheet({ side:'customer'|'supplier', ref: sale/purchase doc (optional), g: full get() result (optional), party: {id,name} (optional), parentSheet })
   */
  S.noteSheet = function (o) {
    var side = o.side, isCust = side === 'customer', ref = o.ref || null, party = o.party || (ref ? { id: isCust ? ref.party_id : ref.supplier_id, name: isCust ? ref.cust_name : ref.supplier_name } : null);
    var kind = ref ? 'Return' : 'RateDiff';
    var body = h('div');
    var title = isCust ? L('Credit note (customer ko)', 'Credit note (to customer)') : L('Debit note (supplier ko)', 'Debit note (to supplier)');
    var sh = UI.sheet(title, body);
    var kindBox = h('div', { class: 'chips', style: { flexWrap: 'wrap' } }), hint = h('div', { class: 'xs mute mb' });
    var form = h('div');
    function renderKinds() { kindBox.innerHTML = ''; KINDS.forEach(function (k) { if (k[0] === 'Return' && !ref) return; kindBox.appendChild(h('button', { class: 'chip' + (kind === k[0] ? ' on' : ''), onClick: function () { kind = k[0]; renderKinds(); renderForm(); } }, L(k[1], k[2]))); }); var kk = KINDS.filter(function (k) { return k[0] === kind; })[0]; hint.textContent = kk ? kk[3] : ''; }
    var m = API.state.masters, modes = m.paymentModes.filter(function (x) { return ['Cash', 'Bank', 'Card'].indexOf(x.kind) >= 0; });
    function renderForm() {
      form.innerHTML = '';
      if (kind === 'Return') {
        if (isCust) { form.appendChild(h('button', { class: 'btn ghost', onClick: function () { sh.close(); S.returnSheet(o.g, o.parentSheet || { close: function () { } }); } }, L('Items chuno → credit note', 'Pick items → credit note'))); }
        else { var units = ((o.g && o.g.units) || []).filter(function (u) { return u.status === 'In Stock'; }); form.appendChild(h('button', { class: 'btn ghost', disabled: !units.length, onClick: function () { sh.close(); S.debitNoteReturn(ref, units, o.parentSheet || { close: function () { } }); } }, units.length ? L('Phones chuno → debit note', 'Pick units → debit note') : L('Is bill ka koi phone stock mein nahi', 'No units of this bill in stock'))); }
        return;
      }
      var amt = h('input', { inputmode: 'numeric', placeholder: '0', style: { fontSize: '24px', fontWeight: 800, height: '58px', textAlign: 'center' } });
      var gstOn = kind !== 'Discount' && (!ref || isCust || ref.type === 'GST');
      var gst = h('input', { type: 'checkbox', checked: gstOn, style: { flex: '0 0 20px' } });
      var reason = h('input', { placeholder: L('Kyun (bill par chhapega)', 'Reason (printed on note)') });
      var settleAmt = h('input', { inputmode: 'numeric', placeholder: '0' }), modeId = modes[0] ? modes[0].id : '';
      var modeChips = h('div', { class: 'chips' }, modes.map(function (mo, i) { return h('button', { class: 'chip' + (i === 0 ? ' on' : ''), onClick: function () { modeId = mo.id; Array.from(modeChips.children).forEach(function (x) { x.classList.remove('on'); }); this.classList.add('on'); } }, mo.name); }));
      var partyBox = h('div');
      function showParty() { partyBox.innerHTML = ''; if (party) { partyBox.appendChild(h('div', { class: 'userbox' }, [h('div', { class: 'avatar', style: { background: 'var(--blue-t)', color: 'var(--blue)', borderRadius: '50%' } }, UI.initials(party.name)), h('div', { style: { flex: 1 } }, [h('div', { class: 'b' }, party.name), h('div', { class: 'small mute' }, ref ? (L('Bill ', 'Bill ') + (ref.bill_no || ref.pur_no) + (ref.pending > 0 ? ' · ' + L('baaki ', 'pending ') + money(ref.pending, true) : '')) : L('Kisi bill se nahi — on account', 'No bill — on account'))]), ref ? null : h('button', { class: 'goldc b small', onClick: function () { party = null; showParty(); } }, t('change_user'))])); return; }
        var q = h('input', { placeholder: L('Party khojo…', 'Search party…') }), hits = h('div', { class: 'card pad0 list' });
        q.addEventListener('input', function () { var text = q.value.trim().toLowerCase(); hits.innerHTML = ''; if (text.length < 2) return; m.parties.filter(function (p) { return (isCust ? p.type !== 'Supplier' : p.type !== 'Customer') && (p.name + ' ' + p.mobile).toLowerCase().indexOf(text) >= 0; }).slice(0, 6).forEach(function (p) { hits.appendChild(h('div', { class: 'item click', onClick: function () { party = p; showParty(); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, p.name), h('div', { class: 's' }, p.mobile || '')])])); }); });
        partyBox.appendChild(q); partyBox.appendChild(hits); setTimeout(function () { q.focus(); }, 50);
      }
      showParty();
      var btn = h('button', { class: 'btn gold', onClick: function () {
        if (!party) return UI.toast(L('Party chuno', 'Pick party'), 'err'); if (!UI.num(amt.value)) return UI.toast('₹', 'err');
        btn.disabled = true;
        API.call('notes.create', { side: side, kind: kind, ref_id: ref ? ref.id : undefined, party_id: party.id, amount: UI.num(amt.value), gst_applicable: gst.checked, reason: reason.value, settlement: UI.num(settleAmt.value) ? { mode_id: modeId, amount: UI.num(settleAmt.value) } : null })
          .then(function (r) { var doc = r.credit_note || r.debit_note; UI.toast('✔ ' + (doc.bill_no || doc.pur_no) + ' · ' + money(doc.total, true), 'ok', 4000); sh.close(); if (o.parentSheet) o.parentSheet.close(); App.render(); if (isCust) S.billSheet(doc.id); else S.purchaseSheet(doc.id); })
          .catch(function (e) { UI.toast(e.message, 'err', 6000); btn.disabled = false; });
      } }, isCust ? L('Credit note banao', 'Create credit note') : L('Debit note banao', 'Create debit note'));
      form.appendChild(partyBox);
      form.appendChild(h('div', { class: 'field mt' }, [h('label', { class: 'lbl center' }, L('Kitne ka (₹, GST sahit agar GST hai)', 'Amount (₹, incl. GST if applicable)')), amt]));
      form.appendChild(h('label', { class: 'row small mb' }, [gst, h('span', null, L('GST lagega (tax bhi adjust hoga)', 'GST applies (tax adjusts too)'))]));
      form.appendChild(h('div', { class: 'field' }, reason));
      form.appendChild(h('div', { class: 'sec' }, [h('span', null, isCust ? L('Cash wapas diya? (optional)', 'Refunded in cash? (optional)') : L('Supplier ne paisa wapas diya? (optional)', 'Supplier paid back? (optional)'))]));
      form.appendChild(h('div', { class: 'row mb' }, [settleAmt, h('div', { style: { flex: 2 } }, modeChips)]));
      form.appendChild(h('div', { class: 'note xs mb' }, ref ? L('Pehle is bill ke baaki se adjust hoga, baaki ' + (isCust ? 'customer' : 'supplier') + ' ke account mein (on account) rahega.', 'Adjusts against this bill\'s pending first; the rest stays on account.') : L('Party ke account mein on account jayega — baad mein kisi bhi bill par adjust kar sakte ho (Lena/Dena).', 'Goes on account — adjust against any bill later (Outstanding).')));
      form.appendChild(btn);
      setTimeout(function () { amt.focus(); }, 60);
    }
    renderKinds(); renderForm();
    body.appendChild(kindBox); body.appendChild(hint); body.appendChild(form);
    return sh;
  };

  S.debitNoteReturn = function (p, units, parent) {
    var picked = {};
    var list = h('div', { class: 'card pad0 list mb' }, units.map(function (u) { var cb = h('input', { type: 'checkbox', style: { flex: '0 0 20px' }, onChange: function () { picked[u.id] = cb.checked; } }); return h('label', { class: 'item', style: { minHeight: '48px' } }, [cb, h('div', { class: 'grow' }, [h('div', { class: 't' }, u.full_name || u.variant_id), h('div', { class: 's' }, 'IMEI ' + u.imei1 + ' · ' + money(u.landing_cost, true))])]); }));
    var reason = h('input', { placeholder: t('reason') });
    var btn = h('button', { class: 'btn red', onClick: function () { var ids = Object.keys(picked).filter(function (k) { return picked[k]; }); if (!ids.length) return UI.toast(L('Phone chuno', 'Pick units'), 'err'); btn.disabled = true; API.call('notes.create', { side: 'supplier', kind: 'Return', ref_id: p.id, unit_ids: ids, reason: reason.value }).then(function (r) { UI.toast('✔ ' + r.debit_note.pur_no + ' ' + money(r.debit_note.total, true), 'ok'); sh.close(); parent.close(); App.render(); S.purchaseSheet(r.debit_note.id); }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, L('Debit note banao', 'Create debit note'));
    var sh = UI.sheet(L('Supplier ko maal wapas', 'Return goods to supplier'), h('div', null, [list, h('div', { class: 'field' }, reason), btn]));
  };

  S.notes = function () {
    var wrap = h('div'); wrap.appendChild(UI.topbar(L('Credit / Debit notes', 'Credit / Debit notes'), L('wapas · rate diff · discount · damage', 'return · rate diff · discount · damage'), { back: '#/more', right: h('button', { class: 'pillbtn', onClick: function () { var s2 = UI.sheet(L('Kisko?', 'For whom?'), h('div', { class: 'grid2' }, [h('button', { class: 'btn gold', onClick: function () { s2.close(); S.noteSheet({ side: 'customer' }); } }, L('Customer (credit note)', 'Customer (credit note)')), h('button', { class: 'btn black', onClick: function () { s2.close(); S.noteSheet({ side: 'supplier' }); } }, L('Supplier (debit note)', 'Supplier (debit note)'))])); } }, '+ Note') }));
    var body = h('div', { class: 'content' }, UI.spinner()); wrap.appendChild(body); wrap.appendChild(UI.tabbar(''));
    API.call('notes.list', {}).then(function (rows) {
      body.innerHTML = '';
      body.appendChild(h('div', { class: 'note small mb' }, L('Koi bhi adjustment yahin se — accountant ko phone karne ki zaroorat nahi. Note bante hi party ka hisaab, GST aur Tally sab update.', 'Any adjustment from here — no need to call the accountant. Party balance, GST and Tally update instantly.')));
      var list = h('div', { class: 'card pad0 list' });
      if (!rows.length) list.appendChild(h('div', { class: 'empty' }, L('Abhi koi note nahi', 'No notes yet')));
      rows.forEach(function (n) { var kk = KINDS.filter(function (k) { return k[0] === n.kind; })[0]; list.appendChild(h('div', { class: 'item click', onClick: function () { if (n.side === 'customer') S.billSheet(n.id); else S.purchaseSheet(n.id); } }, [h('div', { class: 'avatar', style: { background: n.side === 'customer' ? 'var(--green-t)' : 'var(--red-t)', color: n.side === 'customer' ? 'var(--green)' : 'var(--red)' } }, n.side === 'customer' ? 'CN' : 'DN'), h('div', { class: 'grow' }, [h('div', { class: 't' }, n.no + ' · ' + n.party), h('div', { class: 's' }, (kk ? L(kk[1], kk[2]) : n.kind) + (n.ref_no ? ' · ' + n.ref_no : '') + ' · ' + UI.fdate(n.date) + (n.status === 'Cancelled' ? ' · CANCELLED' : ''))]), h('div', { class: 'amt' }, money(n.amount, true))])); });
      body.appendChild(list);
    }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
    return wrap;
  };
})(window.Screens);
