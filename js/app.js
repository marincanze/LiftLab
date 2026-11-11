'use strict';
/* ============================================================
 * Core: state, i18n helpers, formatting, navigation, sheets, dialogs, tours, events, timers, theme.
 * Views/pages/actions are added by profile.js, settings.js, session.js, views.js.
 * ============================================================ */
const App = (() => {
  const A = {};      // actions (data-a="…")
  const V = {};      // tab views
  const P = {};      // stacked pages
  const ui = { tab: 'home', pages: [], expanded: -1, sheetFn: null, dlg: null, statsEx: null, openHist: null, tour: null };
  let st = Store.load();

  const save = () => Store.save(st);
  const S = () => st.settings;
  const t = (k, v) => I18N.t(S().lang, k, v);
  const $ = (q, r = document) => r.querySelector(q);
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- icons ----------
  const svg = (p, sz = 22) => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const ICON = {
    home: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>', 24),
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>', 24),
    train: svg('<path d="M6.5 6.5l11 11"/><path d="M4 9l5-5M15 20l5-5M2.5 11.5l2-2M19.5 14.5l2-2M9.5 2.5l-2 2M14.5 21.5l2-2"/>', 26),
    stats: svg('<path d="M4 19V5M4 19h16"/><path d="M8 15l4-5 3 3 5-7"/>', 24),
    more: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-width="3"/>', 24),
    dots: svg('<path d="M12 5h.01M12 12h.01M12 19h.01" stroke-width="3"/>'),
    heart: '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>',
    swap: svg('<path d="M4 9h15l-3-3M20 15H5l3 3"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>'),
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: svg('<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
    play: svg('<path d="M7 5l12 7-12 7z" fill="currentColor"/>'),
    pause: svg('<path d="M8 5v14M16 5v14" stroke-width="3"/>'),
    edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>', 18),
    target: svg('<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>', 16),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 16),
    check: svg('<path d="M5 12l5 5 9-10"/>'),
    x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    up: svg('<path d="M6 15l6-6 6 6"/>'),
    down: svg('<path d="M6 9l6 6 6-6"/>'),
    left: svg('<path d="M15 6l-6 6 6 6"/>'),
    right: svg('<path d="M9 6l6 6-6 6"/>'),
    back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    minus: svg('<path d="M5 12h14"/>'),
    grip: svg('<path d="M5 9h14M5 15h14"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 18),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.5M12 17h.01"/>', 18),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    bandage: svg('<rect x="2" y="8" width="20" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M10 10h.01M14 14h.01M10 14h.01M14 10h.01"/>'),
    building: svg('<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>'),
    sliders: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    db: svg('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
    book: svg('<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>'),
    thumbDown: svg('<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H6.3a2 2 0 0 0-2 1.7l-1.4 9A2 2 0 0 0 4.9 15zM17 2h3v11h-3"/>'),
    warn: svg('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>', 18),
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', 18),
    note: svg('<path d="M5 4h10l4 4v12H5z"/><path d="M14 4v5h5M8 13h8M8 17h5"/>'),
    history: svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5M12 8v4l3 2"/>'),
    link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    expand: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    collapse: svg('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
    sparkle: svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>', 18),
    chart: svg('<path d="M4 19V5M4 19h16"/><path d="M8 15l4-5 3 3 5-7"/>'),
    flag: svg('<path d="M5 21V4h11l-1.5 4L16 12H5"/>'),
    moon: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    gift: svg('<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 13h18M12 8c-2-4-6-4-6-1s4 1 6 1c2 0 6 2 6-1s-4-3-6 1z"/>'),
    bell: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    layers: svg('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/>'),
    bolt: svg('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', 18)
  };
  const LOGO = `<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><rect x="2" y="2" width="36" height="36" rx="10" fill="var(--acc)"/><path d="M11 27V13h3v11h6v3zM22 27l5-14h3l-5 14z" fill="#fff"/></svg>`;
  const brand = () => `<div class="brand">${LOGO}<span>LiftLab</span></div>`;

  // ---------- names & formatting ----------
  const exName = id => (EX[id] ? (EX[id].n[S().lang] || EX[id].n.en) : id);
  const mName = m => t('m.' + m);
  const eqName = e => t('eq.' + e);
  function workoutName(w) {
    if (!w) return '';
    if (w.name) return w.name;
    const base = t('preset.' + w.preset);
    const dup = Engine.routine(st).filter(x => !x.name && x.preset === w.preset).length > 1;
    return dup ? `${base} ${'ABCDEF'[w.v || 0]}` : base;
  }
  const fmtNum = v => String(+(+v).toFixed(2));
  const unitsFor = ex => (ex && Engine.exPref(st, ex.id).units) || S().units;
  const unitLbl = u => (u === 'lb' ? 'lbs' : 'kg');
  const unitW = () => unitLbl(S().units);
  const lbMode = () => S().units === 'lb';
  function wVal(kg, units) { const u = units || S().units; return u === 'lb' ? Math.round(kg * Engine.LB * 10) / 10 : Math.round(kg * 100) / 100; }
  function kgFrom(v, units) { return (units || S().units) === 'lb' ? v / Engine.LB : v; }
  function fmtW(kg, ex, entry) {
    const u = unitsFor(ex);
    if (ex && ex.load === 'band') {
      const b = bandFor(kg, ex);
      return b ? t('band.' + b.key) : fmtNum(wVal(kg, u)) + ' ' + unitLbl(u);
    }
    if (ex && ex.assist) return kg <= 0.001 ? t('bwOnly') : '−' + fmtNum(wVal(kg, u)) + ' ' + unitLbl(u);
    if (ex && ex.load === 'bw' && kg <= 0.001) return t('bwOnly');
    return (ex && ex.load === 'bw' ? '+' : '') + fmtNum(wVal(kg, u)) + ' ' + unitLbl(u);
  }
  function bandFor(kg, ex) {
    const en = Engine.env(st);
    const bands = (en && en.bands && en.bands.length) ? en.bands : DEFAULT_BANDS.map(b => ({ key: b[0], w: b[1] }));
    return bands.find(b => Math.abs(b.w - kg) < 1e-6) || null;
  }
  const fmtBW = kg => fmtNum(lbMode() ? Math.round(kg * Engine.LB * 10) / 10 : Math.round(kg * 100) / 100);
  const fmtH = cm => (S().lengthUnits === 'in' ? fmtNum(Math.round(cm / 2.54 * 10) / 10) + ' in' : Math.round(cm) + ' cm');
  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }
  const signedClock = sec => (sec < 0 ? '-' + fmtClock(-sec) : fmtClock(Math.ceil(sec)));
  const fmtHM = min => (min >= 60 ? `<span class="n">${Math.floor(min / 60)}</span><small>h</small>${min % 60 ? `<span class="n">${min % 60}</span><small>min</small>` : ''}` : `<span class="n">${min}</span><small>min</small>`);
  const rirStr = r => (r[0] === r[1] ? `${r[0]}` : `${r[0]} – ${r[1]}`);
  const locale = () => (S().lang === 'sl' ? 'sl-SI' : 'en-GB');
  const fmtDate = ts => new Date(ts).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtDateLong = ts => new Date(ts).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtTime = ts => new Date(ts).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const ytUrl = id => 'https://www.youtube.com/results?search_query=' + encodeURIComponent((EX[id] ? EX[id].n.en : id) + ' exercise technique');

  // ---------- small UI builders ----------
  const chip = (label, val, cls = '') => `<span class="chip ${cls}">${label ? `<b>${label}</b> ` : ''}${val}</span>`;
  function getPath(path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), st); }
  function setPath(path, v) {
    const ks = path.split('.');
    const last = ks.pop();
    const o = ks.reduce((o2, k) => (o2[k] = o2[k] || {}), st);
    o[last] = v;
  }
  function parseV(v) {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  }
  function seg(path, opts, cls = '') {
    const cur = getPath(path);
    return `<div class="seg ${cls}">${opts.map(([v, l]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-a="setv" data-p="${path}" data-v="${v}">${l}</button>`).join('')}</div>`;
  }
  const yesNo = path => seg(path, [[false, t('no')], [true, t('yes')]]);
  function radios(path, opts) {
    const cur = getPath(path);
    return `<div class="radios">${opts.map(([v, l, d]) => `<button class="radio-row ${String(cur) === String(v) ? 'on' : ''}" data-a="setv" data-p="${path}" data-v="${v}"><span><b>${l}</b>${d ? `<small>${d}</small>` : ''}</span><i class="rdot"></i></button>`).join('')}</div>`;
  }
  const hint = txt => `<p class="hint"><span class="qm">?</span><span>${txt}</span></p>`;
  const q = (txt, help) => `<h3 class="q">${txt}${help ? ` <button class="help-btn" data-a="help" data-k="${help}" aria-label="help">${ICON.help}</button>` : ''}</h3>`;
  const toggleRow = (path, label, sub) => `<button class="toggle-row" data-a="toggle" data-p="${path}"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span><i class="switch ${getPath(path) ? 'on' : ''}"><i></i></i></button>`;
  function pageHead(title, opts = {}) {
    return `<div class="page-head"><button class="icon-btn circ" data-a="${opts.back || 'back'}" aria-label="${t('back')}">${ICON.back}</button><h1>${title}</h1>${opts.right || ''}</div>`;
  }
  const menuRow = (icon, title, sub, page, extra = '') => `<button class="menu-row" data-a="go" data-page="${page}" ${extra}><span class="mi">${icon}</span><span><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>${ICON.right}</button>`;

  // ---------- navigation ----------
  function go(name, args) { ui.pages.push({ name, args: args || {} }); render(); window.scrollTo({ top: 0 }); }
  function back() { ui.pages.pop(); render(); window.scrollTo({ top: 0 }); }
  function applyTheme() {
    const th = S().theme || 'system';
    const dark = th === 'dark' || (th === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = dark ? '#0f1419' : '#f5f7fa';
  }
  function render() {
    document.documentElement.lang = S().lang;
    applyTheme();
    const main = $('#main');
    const nav = $('#nav');
    if (!S().onboarded && !ui.pages.length) ui.pages.push({ name: 'welcome', args: {} });
    const top = ui.pages[ui.pages.length - 1];
    let html;
    if (top) {
      html = P[top.name] ? P[top.name](top.args) : '';
      nav.hidden = !!(P[top.name] && P[top.name].noNav) || !S().onboarded;
    } else { html = V[ui.tab](); nav.hidden = false; }
    main.innerHTML = html;
    main.className = top ? 'page-' + top.name : 'tab-' + ui.tab;
    if (!nav.hidden) renderNav();
    tick();
    if (A.afterRender) A.afterRender();
  }
  function renderNav() {
    const active = ui.pages.length ? (ui.pages[0].fromTab || 'more') : ui.tab;
    const tabs = [['home', 'home'], ['calendar', 'calendar'], ['train', 'train'], ['stats', 'stats'], ['more', 'more']];
    $('#nav').innerHTML = tabs.map(([k, ic]) =>
      `<button class="nav-btn ${active === k ? 'on' : ''}" data-a="tab" data-tab="${k}" aria-label="${t('tab.' + k)}">
        ${ICON[ic]}<span>${k === 'train' && st.active ? `<b data-tick="elapsed"></b>` : t('tab.' + k)}</span></button>`).join('');
  }

  // ---------- sheets & dialogs ----------
  function openSheet(fn, cls = '') {
    ui.sheetFn = fn;
    $('#sheet').innerHTML = `<div class="backdrop" data-a="closeSheet"></div><div class="sheet ${cls}" role="dialog"><div class="grab"></div><div id="sheetBody">${fn()}</div></div>`;
    $('#sheet').hidden = false;
    document.body.classList.add('noscroll');
  }
  function refreshSheet() {
    if (!ui.sheetFn) return;
    const body = $('#sheetBody');
    if (!body) return;
    const sc = body.parentElement.scrollTop;
    const focused = document.activeElement && document.activeElement.id;
    body.innerHTML = ui.sheetFn();
    body.parentElement.scrollTop = sc;
    if (focused) { const f = document.getElementById(focused); if (f) { f.focus(); if (f.setSelectionRange && typeof f.value === 'string') { const n = f.value.length; try { f.setSelectionRange(n, n); } catch (e) { /* ignore */ } } } }
  }
  function closeSheet() {
    ui.sheetFn = null;
    $('#sheet').hidden = true;
    $('#sheet').innerHTML = '';
    if ($('#modal').hidden) document.body.classList.remove('noscroll');
  }
  function dialog({ title, body, buttons, cancel = true, cls = '' }) {
    return new Promise(res => {
      ui.dlg = { res, cancel };
      $('#modal').innerHTML = `<div class="backdrop" data-dlg="__cancel"></div>
        <div class="dialog ${cls}" role="alertdialog">${cancel ? `<button class="dlg-x" data-dlg="__cancel" aria-label="close">${ICON.x}</button>` : ''}<h2>${title}</h2><div class="dlg-body">${body}</div>
        <div class="dlg-btns">${buttons.map(b => `<button class="btn ${b.cls || 'secondary'}" data-dlg="${b.v}">${b.label}</button>`).join('')}</div></div>`;
      $('#modal').hidden = false;
      document.body.classList.add('noscroll');
    });
  }
  function closeDialog(v) {
    if (!ui.dlg) return;
    const d = ui.dlg;
    if (v === '__cancel' && !d.cancel) return;
    ui.dlg = null;
    $('#modal').hidden = true;
    $('#modal').innerHTML = '';
    if ($('#sheet').hidden) document.body.classList.remove('noscroll');
    d.res(v === '__cancel' ? null : v);
  }
  const confirmDlg = (title, body, okLabel, okCls = 'primary') =>
    dialog({ title, body: `<p>${body}</p>`, buttons: [{ label: okLabel, v: 'yes', cls: okCls }, { label: t('cancel'), v: 'no' }] }).then(v => v === 'yes');
  const notice = (title, body, label) => dialog({ title, body: `<p>${body}</p>`, buttons: [{ label: label || t('gotIt'), v: 'ok', cls: 'primary' }] });

  function numberSheet({ title, value, step, min, max, unit, onSave, extra }) {
    ui.num = { value, step, min, max, unit, onSave, title };
    openSheet(() => {
      const n = ui.num;
      return `<h2>${n.title}</h2>
        <div class="stepper big-step"><button data-a="numStep" data-d="-1">${ICON.minus}</button>
        <input class="inp num" id="numInput" type="number" inputmode="decimal" value="${fmtNum(n.value)}" step="${n.step}"><span class="unit">${n.unit}</span>
        <button data-a="numStep" data-d="1">${ICON.plus}</button></div>
        ${extra || ''}
        <button class="btn primary" data-a="numSave">${t('save')}</button>
        <button class="btn secondary" data-a="closeSheet">${t('cancel')}</button>`;
    });
  }
  function textSheet({ title, label, value, onSave, placeholder, multiline }) {
    ui.txt = { onSave };
    openSheet(() => `<h2>${title}</h2>
      ${label ? `<label>${label}</label>` : ''}${multiline ? `<textarea class="inp" id="txtInput" rows="4" maxlength="2000" placeholder="${esc(placeholder || '')}">${esc(value || '')}</textarea>` : `<input class="inp" id="txtInput" value="${esc(value || '')}" placeholder="${esc(placeholder || '')}" maxlength="80">`}
      <button class="btn primary" data-a="txtSave">${t('save')}</button>
      <button class="btn secondary" data-a="closeSheet">${t('cancel')}</button>`);
    setTimeout(() => { const i = $('#txtInput'); if (i) i.focus(); }, 50);
  }

  // ---------- tours ----------
  function startTour(key, steps) {
    if (S().tours[key]) return;
    ui.tour = { key, steps, i: 0 };
    showTour();
  }
  function showTour() {
    let box = document.getElementById('tour');
    const tr = ui.tour;
    if (!tr || tr.i >= tr.steps.length) { if (box) box.remove(); if (tr) { S().tours[tr.key] = true; save(); } ui.tour = null; return; }
    const step = tr.steps[tr.i];
    const el = step.sel ? document.querySelector(step.sel) : null;
    if (step.sel && !el) { tr.i++; showTour(); return; }
    if (!box) { box = document.createElement('div'); box.id = 'tour'; document.body.appendChild(box); }
    let hole = '', pos = 'top:50%;transform:translateY(-50%)';
    if (el) {
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      hole = `<div class="tour-hole" style="left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px"></div>`;
      pos = r.bottom + 230 < window.innerHeight ? `top:${r.bottom + 14}px` : `bottom:${window.innerHeight - r.top + 14}px`;
    }
    box.innerHTML = `${hole}<div class="tour-tip" style="${pos}">
        <button class="dlg-x" data-a="tourClose">${ICON.x}</button>
        <small class="muted">${tr.i + 1} / ${tr.steps.length}</small>
        <h3>${step.title}</h3><p>${step.text}</p>
        <div class="btn-row"><button class="btn secondary" data-a="tourBack" ${tr.i === 0 ? 'disabled' : ''}>${t('back')}</button><button class="btn primary" data-a="tourNext">${tr.i === tr.steps.length - 1 ? t('done') : t('next')}</button></div>
      </div>`;
  }
  Object.assign(A, {
    tourNext() { if (ui.tour) { ui.tour.i++; showTour(); } },
    tourBack() { if (ui.tour) { ui.tour.i = Math.max(0, ui.tour.i - 1); showTour(); } },
    async tourClose() { if (!ui.tour) return; if (await confirmDlg(t('tour.exit'), t('tour.exitQ'), t('tour.exitBtn'))) { ui.tour.i = ui.tour.steps.length; showTour(); } }
  });

  // ---------- audio / vibration / wake lock / notifications ----------
  let actx = null;
  function unlockAudio() { if (actx) return; try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
  function beep(kind = 'rest') {
    if (!actx || !S().prefs.sound) return;
    try {
      if (actx.state === 'suspended') actx.resume();
      const seq = kind === 'pr' ? [[0, 660], [0.15, 880], [0.3, 1100], [0.45, 1320]] : [[0, 880], [0.25, 880], [0.5, 1320]];
      seq.forEach(([d, f]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, actx.currentTime + d);
        g.gain.exponentialRampToValueAtTime(0.35, actx.currentTime + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d + 0.18);
        o.connect(g).connect(actx.destination);
        o.start(actx.currentTime + d); o.stop(actx.currentTime + d + 0.2);
      });
    } catch (e) { /* ignore */ }
  }
  function alertUser(msg, kind) {
    beep(kind);
    if (navigator.vibrate) navigator.vibrate(kind === 'pr' ? [120, 60, 120, 60, 300] : [250, 120, 250, 120, 400]);
    if (S().prefs.notifications && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try { new Notification('LiftLab', { body: msg, tag: 'liftlab' }); } catch (e) { /* ignore */ }
    }
  }
  function requestNotifications() {
    if ('Notification' in window && Notification.permission === 'default') { try { Notification.requestPermission(); } catch (e) { /* ignore */ } }
  }
  let wakeLock = null;
  async function requestWakeLock() { try { if ('wakeLock' in navigator && st.active) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { wakeLock = null; } }
  function releaseWakeLock() { try { wakeLock && wakeLock.release(); } catch (e) { /* ignore */ } wakeLock = null; }

  // ---------- timers ----------
  const tickers = [];
  function tick() { const now = Date.now(); tickers.forEach(f => { try { f(now); } catch (e) { console.warn(e); } }); }

  // ---------- core actions ----------
  Object.assign(A, {
    tab(d) { ui.pages = []; ui.tab = d.tab; ui.expanded = -1; render(); window.scrollTo({ top: 0 }); },
    back() { back(); },
    go(d) { go(d.page, Object.assign({}, d)); },
    setv(d) {
      setPath(d.p, parseV(d.v));
      if (A.afterSet) A.afterSet(d.p, parseV(d.v));
      save(); keepScroll(render);
    },
    toggle(d) { setPath(d.p, !getPath(d.p)); if (A.afterSet) A.afterSet(d.p, getPath(d.p)); save(); keepScroll(render); },
    closeSheet() { closeSheet(); },
    numStep(d) {
      const n = ui.num;
      const inp = $('#numInput');
      if (inp) n.value = Number(String(inp.value).replace(',', '.')) || n.value;
      n.value = Math.min(n.max, Math.max(n.min, Math.round((n.value + (+d.d) * n.step) * 100) / 100));
      refreshSheet();
    },
    numSave() {
      const n = ui.num;
      const inp = $('#numInput');
      let v = inp ? Number(String(inp.value).replace(',', '.')) : n.value;
      if (!isFinite(v)) v = n.value;
      v = Math.min(n.max, Math.max(n.min, v));
      closeSheet();
      n.onSave(v);
    },
    txtSave() { const v = (($('#txtInput') || {}).value || '').trim(); closeSheet(); ui.txt.onSave(v); },
    help(d) { notice(t('help.' + d.k + '.t'), t('help.' + d.k), t('close')); }
  });
  function keepScroll(fn) { const y = window.scrollY; fn(); window.scrollTo(0, y); }

  // ---------- events ----------
  document.addEventListener('click', e => {
    unlockAudio();
    const dl = e.target.closest('[data-dlg]');
    if (dl) { e.preventDefault(); closeDialog(dl.dataset.dlg); return; }
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.a];
    if (!fn) { console.warn('no action', el.dataset.a); return; }
    if (el.tagName !== 'A') e.preventDefault();
    fn(el.dataset, el, e);
  });
  document.addEventListener('change', e => { const el = e.target; if (el.dataset.ch && A[el.dataset.ch]) A[el.dataset.ch](el.dataset, el, e); });
  document.addEventListener('input', e => { const el = e.target; if (el.dataset.in && A[el.dataset.in]) A[el.dataset.in](el.dataset, el, e); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#modal').hidden) closeDialog('__cancel'); else if (!$('#sheet').hidden) closeSheet(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && st.active) { requestWakeLock(); tick(); } });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  setInterval(tick, 1000);

  return {
    get st() { return st; }, set st(v) { st = v; },
    A, V, P, ui, save, S, t, $, esc, ICON, LOGO, brand,
    exName, mName, eqName, workoutName, fmtNum, unitsFor, unitLbl, unitW, lbMode, wVal, kgFrom, fmtW, bandFor, fmtBW, fmtH, fmtClock, signedClock, fmtHM, rirStr, fmtDate, fmtDateLong, fmtTime, ytUrl,
    chip, seg, yesNo, radios, hint, q, toggleRow, pageHead, menuRow, getPath, setPath, parseV, keepScroll,
    go, back, render, applyTheme, openSheet, refreshSheet, closeSheet, dialog, closeDialog, confirmDlg, notice, numberSheet, textSheet,
    startTour, beep, alertUser, requestNotifications, requestWakeLock, releaseWakeLock, tickers, tick
  };
})();
