/* Screens part 3: Kharcha (expenses), Accounts hub, Lena-Dena (outstanding) */
(function (S) {
  var h = UI.h, icon = UI.icon, money = UI.money;
  var L = function (hi, en) { return LANG === 'hinglish' ? hi : en; };
  S.L = L;
  function monthRange() { var t = UI.today(); return { from: t.slice(0, 8) + '01', to: t }; }
  function ledgerPicker(kinds, onPick, title) {
    API.call('ledgers.list').then(function (ls) {
      var rows = ls.filter(function (l) { return kinds.indexOf(l.kind) >= 0; });
      var sh = UI.sheet(title || L('Kahan se', 'From'), h('div', { class: 'card pad0 list' }, rows.map(function (l) { return h('div', { class: 'item click', onClick: function () { sh.close(); onPick(l); } }, [h('div', { class: 'avatar', style: { background: l.kind === 'Cash' ? 'var(--green-t)' : l.kind === 'Capital' ? 'var(--gold-t)' : 'var(--blue-t)', color: l.kind === 'Cash' ? 'var(--green)' : l.kind === 'Capital' ? 'var(--gold-d)' : 'var(--blue)' } }, icon(l.kind === 'Cash' ? 'wallet' : l.kind === 'Capital' ? 'users' : 'bank', 18)), h('div', { class: 'grow' }, [h('div', { class: 't' }, l.name + (l.is_personal === true || l.is_personal === 'true' ? ' · personal' : '')), h('div', { class: 's' }, l.kind)]), h('div', { class: 'amt' }, money(l.kind === 'Capital' || l.kind === 'Loan' ? -l.balance : l.balance, true))]); })));
    });
  }
  S.ledgerPicker = ledgerPicker;

  // ---------------- KHARCHA ----------------
  S.expense = function () {
    var wrap = h('div'), r = monthRange();
    wrap.appendChild(UI.topbar(t('expense'), L('Is mahine', 'This month'), { back: '#/home', right: h('button', { class: 'pillbtn', onClick: function () { expenseSheet(function () { App.render(); }); } }, '+ ' + t('expense')) }));
    var body = h('div', { class: 'content' }, UI.spinner()); wrap.appendChild(body); wrap.appendChild(UI.tabbar(''));
    API.call('expenses.list', r).then(function (rows) {
      body.innerHTML = '';
      var tot = rows.reduce(function (a, e) { return a + Number(e.amount); }, 0);
      var byCat = {}; rows.forEach(function (e) { byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount); });
      body.appendChild(h('div', { class: 'kpis' }, [h('div', { class: 'kpi' }, [h('div', { class: 'k' }, L('Kul kharcha', 'Total')), h('div', { class: 'v g' }, UI.short(tot))]), h('div', { class: 'kpi' }, [h('div', { class: 'k' }, L('Entries', 'Entries')), h('div', { class: 'v' }, rows.length)]), h('div', { class: 'kpi' }, [h('div', { class: 'k' }, L('Sabse bada', 'Largest')), h('div', { class: 'v', style: { fontSize: '13px' } }, Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; })[0] || '—')])]));
      body.appendChild(h('button', { class: 'bigbtn mt', style: { width: '100%', border: 0, textAlign: 'left' }, onClick: function () { expenseSheet(function () { App.render(); }); } }, [h('div', { class: 'ic' }, icon('plus', 26)), h('div', null, [h('div', { class: 't' }, L('Kharcha likho', 'Add expense')), h('div', { class: 's' }, L('Rent · Salary · Bijli · Chai · kuch bhi', 'Rent · Salary · Power · Tea · anything'))])]));
      body.appendChild(h('div', { class: 'sec' }, [h('span', null, L('Entries', 'Entries')), h('a', { href: '#/accounts', class: 'goldc', style: { textTransform: 'none', letterSpacing: 0 } }, L('Accounts →', 'Accounts →'))]));
      var list = h('div', { class: 'card pad0 list' });
      if (!rows.length) list.appendChild(h('div', { class: 'empty' }, L('Is mahine koi kharcha nahi', 'No expenses this month')));
      rows.forEach(function (e) { list.appendChild(h('div', { class: 'item click', onClick: function () { if (!API.can('edit_all') && e.created_by !== API.state.user.id) return; UI.confirm(L('Yeh kharcha hatana hai?', 'Remove this expense?') + ' ' + e.category + ' ' + money(e.amount, true), t('remove')).then(function (ok) { if (ok) API.call('expenses.cancel', { id: e.id, reason: 'user' }).then(function () { App.render(); }).catch(function (er) { UI.toast(er.message, 'err'); }); }); } }, [h('div', { class: 'avatar', style: { background: 'var(--red-t)', color: 'var(--red)' } }, icon('wallet', 18)), h('div', { class: 'grow' }, [h('div', { class: 't' }, e.category), h('div', { class: 's' }, UI.fdate(e.date) + ' · ' + e.paid_from + (e.notes ? ' · ' + e.notes : ''))]), h('div', { class: 'amt' }, money(e.amount, true))])); });
      body.appendChild(list);
    }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
    return wrap;
  };
  function expenseSheet(done) {
    var amt = h('input', { inputmode: 'numeric', placeholder: '0', style: { fontSize: '26px', fontWeight: 800, height: '60px', textAlign: 'center' } });
    var notes = h('input', { placeholder: L('Kis liye (optional)', 'What for (optional)') });
    var dateInp = h('input', { type: 'date', value: UI.today() });
    var head = null, from = null;
    var headBox = h('div', { class: 'chips', style: { flexWrap: 'wrap' } }), fromBtn = h('button', { class: 'btn ghost', style: { justifyContent: 'space-between' } });
    function setFrom(l) { from = l; fromBtn.innerHTML = ''; fromBtn.appendChild(h('span', null, L('Kahan se: ', 'From: ') + (l ? l.name : 'Cash in Hand'))); fromBtn.appendChild(icon('down', 18)); }
    fromBtn.addEventListener('click', function () { ledgerPicker(['Cash', 'Bank', 'Capital'], setFrom, L('Kahan se diya?', 'Paid from?')); });
    setFrom(null);
    API.call('ledgers.list', { kind: 'Expense' }).then(function (ls) {
      ls.forEach(function (l) { headBox.appendChild(h('button', { class: 'chip', onClick: function () { head = l; Array.from(headBox.children).forEach(function (x) { x.classList.remove('on'); }); this.classList.add('on'); } }, l.name)); });
      headBox.appendChild(h('button', { class: 'chip dash', onClick: function () { UI.prompt(L('Naya kharcha head', 'New expense head'), L('Naam (jaise Chai-paani)', 'Name')).then(function (v) { if (!v) return; head = { id: '', name: v, isNew: true }; var c = h('button', { class: 'chip on' }, v); headBox.insertBefore(c, headBox.lastChild); Array.from(headBox.children).forEach(function (x) { if (x !== c) x.classList.remove('on'); }); }); } }, '+ ' + L('naya', 'new')));
    });
    var btn = h('button', { class: 'btn gold', onClick: function () {
      if (!head) return UI.toast(L('Kis cheez ka kharcha?', 'Which head?'), 'err'); if (!UI.num(amt.value)) return UI.toast('₹', 'err');
      btn.disabled = true;
      API.call('expenses.add', { date: dateInp.value, ledger_id: head.isNew ? undefined : head.id, category: head.isNew ? head.name : undefined, amount: UI.num(amt.value), paid_from_ledger_id: from ? from.id : undefined, notes: notes.value }).then(function () { UI.toast('✔ ' + money(UI.num(amt.value), true) + ' ' + head.name, 'ok'); sh.close(); done(); }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; });
    } }, t('save'));
    var sh = UI.sheet(L('Kharcha likho', 'Add expense'), h('div', null, [h('div', { class: 'field' }, [h('label', { class: 'lbl center' }, '₹'), amt]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, L('Kis cheez ka', 'Head')), headBox]), h('div', { class: 'field' }, fromBtn), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, L('Kab', 'Date')), dateInp]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, L('Note', 'Note')), notes])]), h('div', { class: 'xs mute mb' }, L('Partner ki jeb se diya? "Kahan se" mein partner ka account chuno — uska capital apne aap badh jayega.', 'Paid from a partner\'s pocket? Pick their account under "From" — capital adjusts automatically.')), btn]));
    setTimeout(function () { amt.focus(); }, 60);
  }
  S.expenseSheet = expenseSheet;

  // ---------------- ACCOUNTS HUB ----------------
  S.accounts = function () {
    var wrap = h('div'); wrap.appendChild(UI.topbar(L('Accounts', 'Accounts'), L('Cash · Bank · Partner · Loan', 'Cash · Bank · Partners · Loans'), { back: '#/more' }));
    var body = h('div', { class: 'content' }, UI.spinner()); wrap.appendChild(body); wrap.appendChild(UI.tabbar(''));
    API.call('ledgers.list').then(function (ls) {
      body.innerHTML = '';
      var cash = ls.filter(function (l) { return l.kind === 'Cash'; }), banks = ls.filter(function (l) { return l.kind === 'Bank'; }), caps = ls.filter(function (l) { return l.kind === 'Capital'; }), loans = ls.filter(function (l) { return l.kind === 'Loan' || l.kind === 'Asset'; });
      var sum = function (arr) { return arr.reduce(function (a, l) { return a + Number(l.balance); }, 0); };
      body.appendChild(h('div', { class: 'kpis' }, [h('a', { class: 'kpi', href: '#/book/' + (cash[0] ? cash[0].id : '') }, [h('div', { class: 'k' }, t('cash_in_hand')), h('div', { class: 'v g' }, UI.short(sum(cash))), h('div', { class: 's' }, L('cash book →', 'cash book →'))]), h('div', { class: 'kpi' }, [h('div', { class: 'k' }, 'Bank'), h('div', { class: 'v' }, UI.short(sum(banks.filter(function (b) { return !(b.is_personal === true || b.is_personal === 'true'); })))), h('div', { class: 's' }, banks.length + ' a/c')]), h('div', { class: 'kpi' }, [h('div', { class: 'k' }, L('Partner capital', 'Partner capital')), h('div', { class: 'v' }, UI.short(-sum(caps))), h('div', { class: 's' }, caps.length + ' partners')])]));
      var actions = [
        [L('Cash ↔ Bank', 'Cash ↔ Bank'), L('deposit / withdraw', 'deposit / withdraw'), 'bank', function () { contraSheet(ls); }],
        [L('Partner paisa', 'Partner money'), L('daala / nikaala', 'introduce / withdraw'), 'users', function () { partnerSheet(ls); }],
        [L('Loan', 'Loan'), L('liya / diya / EMI', 'taken / given / EMI'), 'card', function () { loanSheet(ls); }],
        [L('Cash milao', 'Cash close'), L('gin ke milao', 'count & match'), 'check', function () { cashCloseSheet(cash[0]); }],
        [L('Kharcha', 'Expense'), L('paisa gaya', 'money out'), 'wallet', function () { expenseSheet(function () { App.render(); }); }],
        [L('Naya account', 'New account'), L('bank / partner / loan / head', 'bank / partner / loan / head'), 'plus', function () { ledgerForm(null, function () { App.render(); }); }]
      ];
      body.appendChild(h('div', { class: 'tiles' }, actions.map(function (a) { return h('button', { class: 'tile', style: { textAlign: 'left', cursor: 'pointer' }, onClick: a[3] }, [h('div', { class: 'ic', style: { background: 'var(--gold-t)', color: 'var(--gold-d)' } }, icon(a[2])), h('div', { class: 't' }, a[0]), h('div', { class: 's' }, a[1])]); })));
      function section(title, arr, flip) { if (!arr.length) return; body.appendChild(h('div', { class: 'sec' }, [h('span', null, title)])); body.appendChild(h('div', { class: 'card pad0 list' }, arr.map(function (l) { return h('a', { href: '#/book/' + l.id, class: 'item click' }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, l.name + (l.is_personal === true || l.is_personal === 'true' ? ' · personal' : '')), h('div', { class: 's' }, l.tally_name !== l.name ? 'Tally: ' + l.tally_name : l.group)]), h('div', { class: 'amt' + ((flip ? -l.balance : l.balance) < 0 ? ' red' : '') }, money(flip ? -l.balance : l.balance, true)), icon('chev')]); }))); }
      section(L('Cash & Bank', 'Cash & Bank'), cash.concat(banks));
      section(L('Partners (capital)', 'Partners (capital)'), caps, true);
      section(L('Loans', 'Loans'), loans, true);
      body.appendChild(h('div', { class: 'row mt' }, [h('a', { class: 'btn ghost', href: '#/ledgers' }, L('Sab ledgers & Tally naam', 'All ledgers & Tally names')), h('a', { class: 'btn ghost', href: '#/reports' }, 'P&L')]));
    }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
    return wrap;
  };
  function pick(ls, kinds, label, onChange) {
    var sel = h('select', null, [h('option', { value: '' }, label)].concat(ls.filter(function (l) { return kinds.indexOf(l.kind) >= 0; }).map(function (l) { return h('option', { value: l.id }, l.name + ' (' + money(['Capital', 'Loan'].indexOf(l.kind) >= 0 ? -l.balance : l.balance, true) + ')'); })));
    if (onChange) sel.addEventListener('change', onChange); return sel;
  }
  function contraSheet(ls) {
    var from = pick(ls, ['Cash', 'Bank'], L('Kahan se', 'From')), to = pick(ls, ['Cash', 'Bank'], L('Kahan', 'To')), amt = h('input', { inputmode: 'numeric' }), notes = h('input', { placeholder: 'Note' });
    var btn = h('button', { class: 'btn gold', onClick: function () { if (!from.value || !to.value || from.value === to.value || !UI.num(amt.value)) return UI.toast(L('Dono account aur amount', 'Both accounts and amount'), 'err'); btn.disabled = true; API.call('accounts.contra', { from_ledger_id: from.value, to_ledger_id: to.value, amount: UI.num(amt.value), notes: notes.value }).then(function (r) { UI.toast('✔ ' + r.ref_no, 'ok'); sh.close(); App.render(); }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, t('save'));
    var sh = UI.sheet(L('Cash ↔ Bank', 'Cash ↔ Bank'), h('div', null, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, L('Kahan se', 'From')), from]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, L('Kahan', 'To')), to]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, '₹'), amt]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Note'), notes])]), btn]));
  }
  function partnerSheet(ls) {
    var type = 'introduce';
    var chips = h('div', { class: 'chips' }, [['introduce', L('Partner ne paisa daala', 'Partner put money in')], ['withdraw', L('Partner ne nikaala', 'Partner took out')]].map(function (c) { return h('button', { class: 'chip' + (type === c[0] ? ' on' : ''), onClick: function () { type = c[0]; Array.from(chips.children).forEach(function (x) { x.classList.remove('on'); }); this.classList.add('on'); } }, c[1]); }));
    var cap = pick(ls, ['Capital'], L('Kaunsa partner', 'Which partner')), via = pick(ls, ['Cash', 'Bank'], L('Cash / Bank', 'Cash / Bank')), amt = h('input', { inputmode: 'numeric' }), notes = h('input', { placeholder: 'Note' });
    var btn = h('button', { class: 'btn gold', onClick: function () { if (!cap.value || !UI.num(amt.value)) return UI.toast(L('Partner aur amount', 'Partner and amount'), 'err'); btn.disabled = true; API.call('accounts.partner', { type: type, partner_ledger_id: cap.value, via_ledger_id: via.value || undefined, amount: UI.num(amt.value), notes: notes.value }).then(function (r) { UI.toast('✔ ' + r.ref_no, 'ok'); sh.close(); App.render(); }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, t('save'));
    var sh = UI.sheet(L('Partner paisa', 'Partner money'), h('div', null, [chips, h('div', { class: 'field mt' }, [h('label', { class: 'lbl' }, 'Partner'), cap]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, L('Kahan se / kahan', 'Via')), via]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, '₹'), amt]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Note'), notes])]), ls.filter(function (l) { return l.kind === 'Capital'; }).length ? null : h('div', { class: 'note mb' }, L('Pehle "Naya account" se partner ka capital account banao.', 'Create a partner capital account first via "New account".')), btn]));
  }
  function loanSheet(ls) {
    var type = 'taken';
    var chips = h('div', { class: 'chips' }, [['taken', L('Loan liya', 'Loan taken')], ['repaid', L('EMI / wapas diya', 'EMI / repaid')], ['given', L('Kisi ko diya', 'Lent to someone')], ['received_back', L('Wapas mila', 'Got back')]].map(function (c) { return h('button', { class: 'chip' + (type === c[0] ? ' on' : ''), onClick: function () { type = c[0]; Array.from(chips.children).forEach(function (x) { x.classList.remove('on'); }); this.classList.add('on'); } }, c[1]); }));
    var loan = pick(ls, ['Loan', 'Asset'], L('Loan account (ya neeche naya naam)', 'Loan account (or new name below)')), lender = h('input', { placeholder: L('Naya: lender / vyakti ka naam', 'New: lender name') }), via = pick(ls, ['Cash', 'Bank'], 'Cash / Bank'), amt = h('input', { inputmode: 'numeric', placeholder: L('Principal', 'Principal') }), interest = h('input', { inputmode: 'numeric', placeholder: L('Interest (optional)', 'Interest (optional)') }), notes = h('input', { placeholder: 'Note' });
    var btn = h('button', { class: 'btn gold', onClick: function () { if ((!loan.value && !lender.value.trim()) || (!UI.num(amt.value) && !UI.num(interest.value))) return UI.toast(L('Loan aur amount', 'Loan and amount'), 'err'); btn.disabled = true; API.call('accounts.loan', { type: type, loan_ledger_id: loan.value || undefined, lender_name: lender.value.trim(), via_ledger_id: via.value || undefined, amount: UI.num(amt.value), interest: UI.num(interest.value), notes: notes.value }).then(function (r) { UI.toast('✔ ' + r.ref_no, 'ok'); sh.close(); App.render(); }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, t('save'));
    var sh = UI.sheet('Loan', h('div', null, [chips, h('div', { class: 'field mt' }, [h('label', { class: 'lbl' }, 'Loan'), loan, h('div', { class: 'mt' }, lender)]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Cash / Bank'), via]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, '₹'), amt]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, L('Byaj', 'Interest')), interest])]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Note'), notes]), btn]));
  }
  function cashCloseSheet(cashLedger) {
    var counted = h('input', { inputmode: 'numeric', placeholder: L('Gina hua cash', 'Counted cash'), style: { fontSize: '24px', fontWeight: 800, height: '60px', textAlign: 'center' } });
    var res = h('div', { class: 'note hide' });
    var post = h('input', { type: 'checkbox' });
    var btn = h('button', { class: 'btn gold', onClick: function () { btn.disabled = true; API.call('accounts.cashClose', { counted: UI.num(counted.value), post_difference: post.checked }).then(function (r) { res.classList.remove('hide'); res.className = 'note ' + (Math.abs(r.difference) < 1 ? 'green' : 'red'); res.textContent = L('Book: ', 'Book: ') + money(r.book, true) + ' · ' + L('Gina: ', 'Counted: ') + money(r.counted, true) + ' · ' + L('Fark: ', 'Diff: ') + money(r.difference, true) + (post.checked && Math.abs(r.difference) >= 1 ? ' (entry ban gayi)' : ''); btn.disabled = false; }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, L('Milao', 'Match'));
    var sh = UI.sheet(L('Cash milao', 'Cash close'), h('div', null, [h('div', { class: 'small mute mb' }, L('Book ke hisaab se cash: ', 'Cash as per books: ') + money(cashLedger ? cashLedger.balance : 0, true)), h('div', { class: 'field' }, counted), h('label', { class: 'row small mb' }, [post, h('span', null, L('Fark ho to entry bana do (Cash Difference)', 'Post difference as an entry'))]), res, btn]));
    setTimeout(function () { counted.focus(); }, 60);
  }
  function ledgerForm(l, done) {
    var kind = l ? l.kind : 'Bank';
    var kinds = [['Bank', 'Bank A/c'], ['Capital', L('Partner capital', 'Partner capital')], ['Loan', 'Loan'], ['Expense', L('Kharcha head', 'Expense head')], ['Income', L('Income', 'Income')]];
    var chips = h('div', { class: 'chips', style: { flexWrap: 'wrap' } }, kinds.map(function (k) { return h('button', { class: 'chip' + (kind === k[0] ? ' on' : ''), disabled: !!l, onClick: function () { kind = k[0]; Array.from(chips.children).forEach(function (x) { x.classList.remove('on'); }); this.classList.add('on'); } }, k[1]); }));
    var name = h('input', { value: l ? l.name : '', placeholder: L('Naam', 'Name') }), tally = h('input', { value: l ? l.tally_name : '', placeholder: L('Tally mein naam (khaali = same)', 'Name in Tally (blank = same)') }), parent = h('input', { value: l ? l.tally_parent : '', placeholder: L('Tally group (auto)', 'Tally group (auto)') }), ob = h('input', { value: l ? l.opening_balance : '', inputmode: 'numeric', placeholder: L('Opening balance', 'Opening balance') }), personal = h('input', { type: 'checkbox', checked: l ? (l.is_personal === true || l.is_personal === 'true') : false });
    var userSel = h('select', null, [h('option', { value: '' }, L('Kis partner ka (optional)', 'Which partner (optional)'))]);
    if (API.can('users')) API.call('users.list').then(function (us) { us.forEach(function (u) { userSel.appendChild(h('option', { value: u.id, selected: l && l.user_id === u.id }, u.name)); }); });
    var btn = h('button', { class: 'btn gold', onClick: function () { if (!name.value.trim()) return UI.toast(L('Naam', 'Name'), 'err'); btn.disabled = true; API.call('ledgers.save', { id: l ? l.id : undefined, name: name.value.trim(), kind: kind, tally_name: tally.value.trim() || name.value.trim(), tally_parent: parent.value.trim() || undefined, opening_balance: UI.num(ob.value), is_personal: personal.checked, user_id: userSel.value }).then(function () { UI.toast('✔', 'ok'); sh.close(); done(); }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, t('save'));
    var sh = UI.sheet(l ? l.name : L('Naya account', 'New account'), h('div', null, [chips, h('div', { class: 'field mt' }, [h('label', { class: 'lbl' }, L('Naam', 'Name')), name]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Tally name'), tally]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Tally group'), parent])]), h('div', { class: 'grid2' }, [h('div', { class: 'field' }, [h('label', { class: 'lbl' }, L('Opening', 'Opening')), ob]), h('div', { class: 'field' }, [h('label', { class: 'lbl' }, 'Partner'), userSel])]), h('label', { class: 'row small mb' }, [personal, h('span', null, L('Partner ka personal account (shop ka paisa isme aa-ja sakta hai)', 'Partner\'s personal account (shop money may pass through)'))]), btn]));
  }
  S.ledgerForm = ledgerForm;

  S.ledgers = function () {
    var wrap = h('div'); wrap.appendChild(UI.topbar(L('Ledgers & Tally naam', 'Ledgers & Tally names'), '', { back: '#/accounts', right: h('button', { class: 'pillbtn', onClick: function () { ledgerForm(null, function () { App.render(); }); } }, '+') }));
    var body = h('div', { class: 'content' }, UI.spinner()); wrap.appendChild(body);
    API.call('ledgers.list').then(function (ls) {
      body.innerHTML = '';
      var groups = {}; ls.forEach(function (l) { (groups[l.group] = groups[l.group] || []).push(l); });
      Object.keys(groups).sort().forEach(function (g) { body.appendChild(h('div', { class: 'sec' }, [h('span', null, g)])); body.appendChild(h('div', { class: 'card pad0 list' }, groups[g].map(function (l) { return h('div', { class: 'item click', onClick: function () { if (API.can('accounts')) ledgerForm(l, function () { App.render(); }); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, l.name), h('div', { class: 's' }, (l.tally_name !== l.name ? 'Tally: ' + l.tally_name + ' · ' : '') + l.kind)]), h('div', { class: 'amt' }, l.kind === 'Tax' ? money(Math.abs(l.balance), true) + (l.balance > 0 ? ' Dr' : l.balance < 0 ? ' Cr' : '') : money(['Capital', 'Loan', 'Creditor', 'Sales', 'Income'].indexOf(l.kind) >= 0 ? -l.balance : l.balance, true))]); }))); });
    });
    return wrap;
  };

  S.book = function (params) {
    var wrap = h('div'), id = params.id, r = monthRange();
    var from = h('input', { type: 'date', value: r.from, style: { height: '40px', fontSize: '13px' } }), to = h('input', { type: 'date', value: r.to, style: { height: '40px', fontSize: '13px' } });
    var title = h('div', { class: 'title' }, '…');
    wrap.appendChild(UI.topbar('', '', { back: '#/accounts', extra: h('div', { class: 'row' }, [from, to]) }));
    wrap.querySelector('.top .title').replaceWith(title);
    var body = h('div', { class: 'content' }, UI.spinner()); wrap.appendChild(body);
    function load() {
      API.call('accounts.book', { ledger_id: id, from: from.value, to: to.value }).then(function (b) {
        title.textContent = b.ledger.name; body.innerHTML = '';
        body.appendChild(h('div', { class: 'kpis' }, [h('div', { class: 'kpi' }, [h('div', { class: 'k' }, L('Shuru', 'Opening')), h('div', { class: 'v' }, UI.short(b.opening))]), h('div', { class: 'kpi' }, [h('div', { class: 'k' }, L('Aaya / Gaya', 'In / Out')), h('div', { class: 'v', style: { fontSize: '14px' } }, '+' + UI.short(b.total_in) + ' / −' + UI.short(b.total_out))]), h('div', { class: 'kpi' }, [h('div', { class: 'k' }, L('Ab', 'Closing')), h('div', { class: 'v g' }, UI.short(b.closing))])]));
        var tbl = h('table', { class: 'tbl' }, [h('tr', null, [h('th', null, L('Kab', 'Date')), h('th', null, L('Kya', 'What')), h('th', { class: 'r' }, L('Aaya', 'In')), h('th', { class: 'r' }, L('Gaya', 'Out')), h('th', { class: 'r' }, 'Bal')])].concat(b.rows.map(function (x) { return h('tr', null, [h('td', { class: 'xs mute', style: { whiteSpace: 'nowrap' } }, UI.fdate(x.date).slice(0, 6)), h('td', null, [h('div', { class: 'small' }, x.narration || x.ref_type), h('div', { class: 'xs mute' }, x.ref_no)]), h('td', { class: 'r green' }, x.in ? money(x.in, true) : ''), h('td', { class: 'r red' }, x.out ? money(x.out, true) : ''), h('td', { class: 'r b' }, money(x.balance, true))]); })));
        body.appendChild(h('div', { class: 'card pad0', style: { overflowX: 'auto' } }, b.rows.length ? tbl : h('div', { class: 'empty' }, t('no_match'))));
      }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
    }
    from.addEventListener('change', load); to.addEventListener('change', load); load();
    return wrap;
  };

  // ---------------- LENA-DENA (OUTSTANDING) ----------------
  S.pending = function (params) {
    var side = params.side || 'Receivable', wrap = h('div');
    var chips = h('div', { class: 'chips' }, [['Receivable', L('Lena hai (customers)', 'To receive')], ['Payable', L('Dena hai (suppliers)', 'To pay')], ['Finance', L('Finance DA baaki', 'Finance DA pending')]].map(function (c) { return h('a', { href: '#/pending?side=' + c[0], class: 'chip' + (side === c[0] ? ' on' : ''), style: side === c[0] ? { background: 'var(--gold)', color: '#111', borderColor: 'var(--gold)' } : { background: '#222', color: '#ddd', borderColor: '#222' } }, c[1]); }));
    wrap.appendChild(UI.topbar(L('Lena / Dena', 'Outstanding'), L('bill-wise · party-wise', 'bill-wise · party-wise'), { back: '#/home', extra: chips }));
    var body = h('div', { class: 'content' }, UI.spinner()); wrap.appendChild(body); wrap.appendChild(UI.tabbar(''));
    if (side === 'Finance') {
      API.call('sales.pending').then(function (r) {
        body.innerHTML = '';
        var rows = r.rows.filter(function (x) { return x.kind === 'DA'; });
        body.appendChild(h('div', { class: 'kpis' }, Object.keys(r.byMode).filter(function (k) { return k !== 'Udhar'; }).slice(0, 3).map(function (k) { return h('div', { class: 'kpi' }, [h('div', { class: 'k' }, k), h('div', { class: 'v g' }, UI.short(r.byMode[k]))]); })));
        body.appendChild(h('div', { class: 'sec' }, [h('span', null, rows.length + ' DA'), h('span', null, money(rows.reduce(function (a, x) { return a + x.amount; }, 0), true))]));
        var list = h('div', { class: 'card pad0 list' });
        if (!rows.length) list.appendChild(h('div', { class: 'empty' }, '🎉 ' + L('Sab DA aa gaya', 'All DA received')));
        rows.forEach(function (x) { list.appendChild(h('div', { class: 'item' }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, x.customer + ' · ' + x.bill_no), h('div', { class: 's' }, x.mode + ' · ' + UI.fdate(x.date) + ' · ' + x.days + ' ' + t('days') + (x.ref_no ? ' · ' + x.ref_no : ''))]), h('div', { class: 'amt' + (x.days > 14 ? ' red' : '') }, money(x.amount, true)), API.can('sale') ? h('button', { class: 'btn sm black', onClick: function () { UI.prompt(L('DA aa gaya — bank mein', 'DA received in bank'), L('UTR / ref (optional)', 'UTR / ref')).then(function (ref) { if (ref === null) return; API.call('sales.markReceived', { ids: [x.id], ref_no: ref }).then(function () { UI.toast('✔', 'ok'); App.render(); }).catch(function (e) { UI.toast(e.message, 'err'); }); }); } }, '✓') : null])); });
        body.appendChild(list);
      }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
      return wrap;
    }
    API.call('outstanding.list', { side: side }).then(function (r) {
      body.innerHTML = '';
      var b = r.parties.reduce(function (a, p) { a.b0 += p.b0; a.b8 += p.b8; a.b31 += p.b31; a.b61 += p.b61; return a; }, { b0: 0, b8: 0, b31: 0, b61: 0 });
      body.appendChild(h('div', { class: 'kpis' }, [h('div', { class: 'kpi' }, [h('div', { class: 'k' }, side === 'Receivable' ? L('Kul lena', 'Total due') : L('Kul dena', 'Total payable')), h('div', { class: 'v g' }, UI.short(r.total)), h('div', { class: 's' }, r.parties.length + ' parties')]), h('div', { class: 'kpi' }, [h('div', { class: 'k' }, '0–30 ' + t('days')), h('div', { class: 'v' }, UI.short(b.b0 + b.b8))]), h('div', { class: 'kpi' }, [h('div', { class: 'k' }, '30+ ' + t('days')), h('div', { class: 'v', style: { color: '#ff8a80' } }, UI.short(b.b31 + b.b61))])]));
      body.appendChild(h('div', { class: 'row mt' }, [h('button', { class: 'btn gold', onClick: function () { settleSheet(side, null, function () { App.render(); }); } }, side === 'Receivable' ? L('Paisa aaya', 'Money received') : L('Paisa diya', 'Money paid'))]));
      body.appendChild(h('div', { class: 'sec' }, [h('span', null, L('Party-wise · tap → bill-wise', 'By party · tap → bills')), h('span', null, L('ageing', 'ageing'))]));
      var list = h('div', { class: 'card pad0 list' });
      if (!r.parties.length) list.appendChild(h('div', { class: 'empty' }, '🎉 ' + L('Kuch baaki nahi', 'Nothing pending')));
      r.parties.forEach(function (p) { list.appendChild(h('div', { class: 'item click', onClick: function () { partySheet(p.party_id, side); } }, [h('div', { class: 'avatar', style: { background: 'var(--blue-t)', color: 'var(--blue)', borderRadius: '50%' } }, UI.initials(p.name)), h('div', { class: 'grow' }, [h('div', { class: 't' }, p.name), h('div', { class: 's' }, p.bills + ' bills' + (p.on_account ? ' · on account ' + money(p.on_account, true) : '') + (p.b61 ? ' · ' : '') , p.b61 ? h('span', { class: 'red b' }, '60+ ' + money(p.b61, true)) : null)]), h('div', { class: 'amt' }, [money(p.net, true), h('div', { class: 's' }, p.oldest ? L('se ', 'since ') + UI.fdate(p.oldest) : '')]), icon('chev')])); });
      body.appendChild(list);
      if (side === 'Receivable' && r.finance_pending && Object.keys(r.finance_pending).length) body.appendChild(h('a', { href: '#/pending?side=Finance', class: 'note mt small', style: { display: 'block' } }, L('Finance companies se aana: ', 'Due from finance cos: ') + Object.keys(r.finance_pending).map(function (k) { return k + ' ' + money(r.finance_pending[k], true); }).join(' · ') + ' →'));
    }).catch(function (e) { body.innerHTML = ''; UI.toast(e.message, 'err'); });
    return wrap;
  };
  function partySheet(partyId, side) {
    var body = h('div', null, UI.spinner()); var sh = UI.sheet(L('Bill-wise', 'Bill-wise'), body);
    API.call('outstanding.party', { party_id: partyId }).then(function (ps) {
      body.innerHTML = '';
      body.appendChild(h('div', { class: 'row mb' }, [h('div', null, [h('div', { style: { fontSize: '18px', fontWeight: 800 } }, ps.party.name), h('div', { class: 'small mute' }, ps.party.mobile || '')]), h('div', { class: 'right' }, [h('div', { class: 'xs mute' }, side === 'Receivable' ? L('Lena', 'Due') : L('Dena', 'Payable')), h('div', { style: { fontSize: '18px', fontWeight: 800 } }, money(side === 'Receivable' ? ps.receivable : ps.payable, true))])]));
      var bills = ps.bills.filter(function (b) { return b.side === side; });
      body.appendChild(h('div', { class: 'card pad0 list' }, bills.length ? bills.map(function (b) { return h('div', { class: 'item' }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, b.bill_no), h('div', { class: 's' }, UI.fdate(b.date) + ' · ' + b.days + ' ' + t('days') + ' · ' + L('bill ', 'bill ') + money(b.amount, true) + (b.adjusted ? ' · ' + L('mila ', 'adjusted ') + money(b.adjusted, true) : ''))]), h('div', { class: 'amt' + (b.days > 30 ? ' red' : '') }, money(b.pending, true))]); }) : h('div', { class: 'empty' }, L('Koi bill baaki nahi', 'No bills pending'))));
      var onAcc = ps.on_account.filter(function (a) { return a.side === side; });
      if (onAcc.length) body.appendChild(h('div', { class: 'note mt small' }, L('On account (kisi bill par nahi laga): ', 'On account (not adjusted): ') + money(onAcc.reduce(function (a, x) { return a + Number(x.amount); }, 0), true) + ' — ' + L('neeche payment par tap karke adjust karo', 'tap a payment below to adjust')));
      if (ps.payments.length) { body.appendChild(h('div', { class: 'sec' }, [h('span', null, L('Payments', 'Payments'))])); body.appendChild(h('div', { class: 'card pad0 list' }, ps.payments.slice(-10).reverse().map(function (p) { return h('div', { class: 'item click', onClick: function () { if (API.can('accounts')) reallocateSheet(p, ps, side, function () { sh.close(); App.render(); }); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, p.ref_id + ' · ' + p.mode_name), h('div', { class: 's' }, UI.fdate(p.date) + (p.notes ? ' · ' + p.notes : ''))]), h('div', { class: 'amt' }, money(p.amount, true)), API.can('accounts') ? icon('edit', 16) : null]); }))); }
      body.appendChild(h('button', { class: 'btn ghost mt', onClick: function () { sh.close(); S.noteSheet({ side: side === 'Receivable' ? 'customer' : 'supplier', party: { id: ps.party.id, name: ps.party.name } }); } }, side === 'Receivable' ? L('Credit note / discount do', 'Credit note / discount') : L('Debit note / discount lo', 'Debit note / discount')));
      body.appendChild(h('div', { class: 'grid2 mt' }, [h('button', { class: 'btn gold', onClick: function () { sh.close(); settleSheet(side, ps.party, function () { App.render(); }); } }, side === 'Receivable' ? L('Paisa aaya', 'Received') : L('Paisa diya', 'Paid')), ps.party.mobile && side === 'Receivable' ? h('a', { class: 'btn ghost', target: '_blank', rel: 'noopener', href: 'https://wa.me/91' + ps.party.mobile + '?text=' + encodeURIComponent('Namaste ' + ps.party.name + ' ji, ' + (API.state.settings.shop_name || '') + ' se. Aapka ₹' + Math.round(ps.receivable) + ' baaki hai (' + bills.map(function (b) { return b.bill_no; }).join(', ') + '). Kripya jald bhugtan karein. Dhanyavaad!') }, [icon('share', 18), L('Reminder', 'Reminder')]) : null]));
    }).catch(function (e) { body.innerHTML = ''; body.appendChild(h('div', { class: 'empty red' }, e.message)); });
  }
  function settleSheet(side, party, done) {
    var m = API.state.masters;
    var partyBox = h('div'), chosen = party || null, bills = [], allocInputs = {};
    var q = h('input', { placeholder: L('Party khojo…', 'Search party…') }), hits = h('div', { class: 'card pad0 list hide' });
    var billsBox = h('div');
    function showParty() { partyBox.innerHTML = ''; if (!chosen) { partyBox.appendChild(q); partyBox.appendChild(hits); return; } partyBox.appendChild(h('div', { class: 'userbox' }, [h('div', { class: 'avatar', style: { background: 'var(--blue-t)', color: 'var(--blue)', borderRadius: '50%' } }, UI.initials(chosen.name)), h('div', { style: { flex: 1 } }, [h('div', { class: 'b' }, chosen.name), h('div', { class: 'small mute' }, chosen.mobile || '')]), h('button', { class: 'goldc b small', onClick: function () { chosen = null; bills = []; billsBox.innerHTML = ''; showParty(); } }, t('change_user'))])); API.call('outstanding.party', { party_id: chosen.id }).then(function (ps) { bills = ps.bills.filter(function (b) { return b.side === side; }); renderBills(); }); }
    function renderBills() { billsBox.innerHTML = ''; if (!bills.length) return; billsBox.appendChild(h('div', { class: 'sec' }, [h('span', null, L('Kis bill par lagana (khaali = pehle purana)', 'Adjust against (blank = oldest first)'))])); bills.forEach(function (b) { var inp = h('input', { inputmode: 'numeric', placeholder: money(b.pending, true), class: 'amt', style: { width: '110px', textAlign: 'right', height: '40px' } }); allocInputs[b.bill_id] = inp; billsBox.appendChild(h('div', { class: 'payrow' }, [h('div', { class: 'grow' }, [h('div', { class: 'b small' }, b.bill_no), h('div', { class: 'xs mute' }, UI.fdate(b.date) + ' · ' + b.days + 'd · ' + money(b.pending, true))]), inp])); }); }
    q.addEventListener('input', function () { var text = q.value.trim().toLowerCase(); hits.innerHTML = ''; if (text.length < 2) { hits.classList.add('hide'); return; } m.parties.filter(function (p) { return (side === 'Payable' ? p.type !== 'Customer' : p.type !== 'Supplier') && (p.name + ' ' + p.mobile).toLowerCase().indexOf(text) >= 0; }).slice(0, 6).forEach(function (p) { hits.appendChild(h('div', { class: 'item click', onClick: function () { chosen = p; showParty(); } }, [h('div', { class: 'grow' }, [h('div', { class: 't' }, p.name), h('div', { class: 's' }, p.mobile || '')])])); }); hits.classList.remove('hide'); });
    showParty();
    var modes = m.paymentModes.filter(function (x) { return ['Cash', 'Bank', 'Card'].indexOf(x.kind) >= 0; }), modeId = modes[0] ? modes[0].id : '';
    var modeChips = h('div', { class: 'chips' }, modes.map(function (mo, i) { return h('button', { class: 'chip' + (i === 0 ? ' on' : ''), onClick: function () { modeId = mo.id; Array.from(modeChips.children).forEach(function (x) { x.classList.remove('on'); }); this.classList.add('on'); } }, mo.name); }));
    var amt = h('input', { inputmode: 'numeric', placeholder: '0', style: { fontSize: '24px', fontWeight: 800, height: '58px', textAlign: 'center' } }), ref = h('input', { placeholder: L('UTR / ref / note (optional)', 'Ref / note') });
    var btn = h('button', { class: 'btn gold', onClick: function () { if (!chosen) return UI.toast(L('Party chuno', 'Pick party'), 'err'); if (!UI.num(amt.value)) return UI.toast('₹', 'err'); var allocs = []; Object.keys(allocInputs).forEach(function (bid) { var v = UI.num(allocInputs[bid].value); if (v > 0) allocs.push({ bill_id: bid, amount: v }); }); btn.disabled = true; API.call('outstanding.settle', { side: side, party_id: chosen.id, mode_id: modeId, amount: UI.num(amt.value), allocations: allocs, auto: !allocs.length, notes: ref.value }).then(function (r) { UI.toast('✔ ' + r.ref_no + ' · ' + r.allocations.map(function (a) { return a.ref_type + (a.bill_no ? ' ' + a.bill_no : ''); }).join(', '), 'ok', 4000); sh.close(); done(); }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, t('save'));
    var sh = UI.sheet(side === 'Receivable' ? L('Paisa aaya', 'Money received') : L('Paisa diya', 'Money paid'), h('div', null, [partyBox, h('div', { class: 'field mt' }, amt), modeChips, h('div', { class: 'field mt' }, ref), billsBox, h('div', { class: 'mt' }), btn]));
    if (!chosen) setTimeout(function () { q.focus(); }, 60);
  }
  S.settleSheet = settleSheet;
  function reallocateSheet(pay, ps, side, done) {
    var bills = ps.bills.filter(function (b) { return b.side === side; }).concat([]);
    API.call('outstanding.party', { party_id: ps.party.id, include_settled: true }).then(function (full) {
      var all = full.bills.filter(function (b) { return b.side === side; });
      var inputs = {};
      var rows = all.map(function (b) { var inp = h('input', { inputmode: 'numeric', class: 'amt', style: { width: '110px', textAlign: 'right', height: '40px' }, placeholder: '0' }); inputs[b.bill_id] = inp; return h('div', { class: 'payrow' }, [h('div', { class: 'grow' }, [h('div', { class: 'b small' }, b.bill_no), h('div', { class: 'xs mute' }, UI.fdate(b.date) + ' · bill ' + money(b.amount, true) + ' · pending ' + money(b.pending, true))]), inp]); });
      var btn = h('button', { class: 'btn gold', onClick: function () { var allocs = []; Object.keys(inputs).forEach(function (bid) { var v = UI.num(inputs[bid].value); if (v > 0) allocs.push({ bill_id: bid, amount: v }); }); btn.disabled = true; API.call('outstanding.reallocate', { payment_id: pay.id, allocations: allocs }).then(function () { UI.toast('✔', 'ok'); sh.close(); done(); }).catch(function (e) { UI.toast(e.message, 'err'); btn.disabled = false; }); } }, L('Adjust karo', 'Adjust'));
      var del = API.can('delete') ? h('button', { class: 'btn red mt', onClick: function () { UI.prompt(L('Payment cancel', 'Cancel payment'), t('reason')).then(function (r) { if (r === null) return; API.call('outstanding.cancel', { id: pay.id, reason: r }).then(function () { UI.toast('✔', 'ok'); sh.close(); done(); }).catch(function (e) { UI.toast(e.message, 'err'); }); }); } }, L('Payment cancel karo', 'Cancel payment')) : null;
      var sh = UI.sheet(pay.ref_id + ' · ' + money(pay.amount, true), h('div', null, [h('div', { class: 'small mute mb' }, L('Yeh payment kis-kis bill par lagana hai? Baaki On Account rahega.', 'Adjust this payment against bills; the rest stays On Account.')), h('div', null, rows), btn, del]));
    });
  }
})(window.Screens);
