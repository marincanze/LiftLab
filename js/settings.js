'use strict';
/* ============================================================
 * "More" menu: profile, injuries, training environments (equipment, inventories, machines, variants),
 * workout preferences, training preferences, dis-preferred & custom exercises, language/theme, data, help, what's new.
 * ============================================================ */
(function () {
  const { A, V, P, ui, t, esc, ICON, q, hint } = App;
  const S = () => App.st.settings;
  const st = () => App.st;
  const dirty = () => { App.st.draft = null; Engine.clearCache(); App.save(); };

  // ---------- More menu ----------
  V.more = () => `<h1>${t('tab.more')}</h1>
      <p class="muted">${t('more.intro')}</p>
      <div class="menu">
        ${App.menuRow(ICON.user, t('menu.profile'), t('menu.profile.d'), 'profile')}
        ${App.menuRow(ICON.bandage, t('menu.injuries'), t('menu.injuries.d'), 'injuries')}
        ${App.menuRow(ICON.building, t('menu.envs'), t('menu.envs.d'), 'envs')}
        ${App.menuRow(ICON.sliders, t('menu.prefs'), t('menu.prefs.d'), 'prefs')}
        ${App.menuRow(ICON.flag, t('menu.training'), t('menu.training.d'), 'trainingPrefs')}
        ${App.menuRow(ICON.globe, t('menu.app'), t('menu.app.d'), 'appSettings')}
        ${App.menuRow(ICON.db, t('menu.data'), t('menu.data.d'), 'data')}
        ${App.menuRow(ICON.book, t('menu.help'), t('menu.help.d'), 'help')}
        ${App.menuRow(ICON.gift, t('menu.whatsNew'), t('menu.whatsNew.d'), 'whatsNew')}
        ${App.menuRow(ICON.mail, t('menu.feedback'), t('menu.feedback.d'), 'feedback')}
      </div>
      <p class="center muted small">LiftLab · v${RELEASE_NOTES[0].v} · ${t('more.offline')}</p>`;

  // ---------- Workout preferences ----------
  P.prefs = () => `${App.pageHead(t('menu.prefs'))}
    ${App.toggleRow('settings.prefs.hideVideos', t('pref.hideVideos'))}
    ${App.toggleRow('settings.prefs.logBothSides', t('pref.bothSides'))}
    ${App.toggleRow('settings.prefs.autoStart', t('pref.autoStart'), t('pref.autoStart.d'))}
    ${App.toggleRow('settings.prefs.showEstReps', t('pref.showEst'))}
    ${App.toggleRow('settings.prefs.prNotifications', t('pref.prNotif'))}
    ${App.toggleRow('settings.prefs.suggestions', t('pref.suggestions'))}
    ${App.toggleRow('settings.prefs.sound', t('pref.sound'))}
    ${App.toggleRow('settings.prefs.notifications', t('pref.notifications'), t('pref.notifications.d'))}
    ${App.toggleRow('settings.prefs.fullscreen', t('pref.fullscreen'), t('pref.fullscreen.d'))}
    ${q(t('pref.superset'), 'superset')}${App.seg('settings.prefs.supersetStrategy', [['never', t('strat.never')], ['short', t('strat.short')], ['always', t('strat.always')]])}
    ${q(t('pref.dropset'), 'dropset')}${App.seg('settings.prefs.dropsetStrategy', [['never', t('strat.never')], ['short', t('strat.short')], ['always', t('strat.always')]])}
    ${q(t('pref.rest'))}${App.seg('settings.prefs.restMode', [['min', t('rest.min')], ['std', t('rest.std')]])}${hint(t('rest.hint'))}
    ${q(t('sub.repRanges'))}<button class="menu-row" data-a="wizStep" data-step="${App.stepIdx('repRanges')}"><span><b>${(S().repRanges || []).join(', ')}</b><small>${t('rr.q')}</small></span>${ICON.right}</button>
    <h3 class="q">${t('pref.other')}</h3>
    ${App.menuRow(ICON.thumbDown, t('dis.title'), t('dis.sub'), 'disliked')}
    ${App.menuRow(ICON.plus, t('cust.title'), t('cust.sub'), 'customEx')}
    <button class="btn secondary mt" data-a="clearExPrefs">${t('pref.clearEq')}</button>
    <p class="hint">${t('pref.clearEq.d')}</p>
    <button class="btn secondary" data-a="clearTours">${t('pref.clearTours')}</button>
    <p class="hint">${t('pref.applyNext')}</p>`;
  A.afterSet = (path, v) => {
    if (path.startsWith('settings.') && !path.startsWith('settings.theme') && !path.startsWith('settings.prefs.hideVideos') && !path.startsWith('settings.prefs.sound')) st().draft = null;
    if (path === 'settings.units' || path === 'settings.envId') Engine.clearCache();
    if (path === 'settings.schedule.specificDays' && v && !(S().schedule.days || []).length) S().schedule.days = [0, 2, 4];
    if (path === 'settings.schedule.specificDays' || path === 'settings.schedule.cyclic') st().nextAt = null;
  };
  A.clearExPrefs = async () => { if (await App.confirmDlg(t('pref.clearEq'), t('pref.clearEqQ'), t('confirm'))) { st().exPrefs = {}; dirty(); App.render(); } };
  A.clearTours = () => { S().tours = {}; App.save(); App.notice(t('notice'), t('pref.toursCleared')); };

  // ---------- Training preferences ----------
  P.trainingPrefs = () => {
    const s = S();
    const row = (label, val, step) => `<button class="sum-row" data-a="wizStep" data-step="${step}"><span><b>${label}</b><small>${val}</small></span>${ICON.right}</button>`;
    const sc = s.schedule;
    return `${App.pageHead(t('menu.training'))}
      ${row(t('sub.routine'), t('rt.' + s.routineType), App.stepIdx('routine'))}
      ${row(t('sub.bodyParts'), (s.musclesToTrain || []).map(App.mName).join(', '), App.stepIdx('muscles'))}
      ${row(t('sub.prio'), s.prio.length ? s.prio.map(App.mName).join(', ') : t('pr.none'), App.stepIdx('prio'))}
      ${row(t('sub.rir'), (s.rirTraining ? t('yes') : t('no')), App.stepIdx('rir'))}
      ${row(t('sub.mode'), t('mode.' + s.mode), App.stepIdx('mode'))}
      ${row(t('sub.consistency'), t('con.' + (s.consistency || 3)), App.stepIdx('consistency'))}
      ${row(t('sub.repRanges'), (s.repRanges || []).join(', '), App.stepIdx('repRanges'))}
      ${row(t('sub.days'), sc.cyclic ? t('days.cycle', { on: sc.cycleOn, off: sc.cycleOff }) : `${sc.daysPerWeek} ${t('prof.perWeek')}`, App.stepIdx('days'))}
      ${row(t('x.deload'), s.lastDeloadWeeks == null ? t('x.deloadUnknown') : t('x.weeksAgo', { n: s.lastDeloadWeeks }), App.stepIdx('experience'))}`;
  };

  // ---------- Dis-preferred exercises ----------
  P.disliked = () => {
    const list = st().disliked.filter(d => EX[d.exId]);
    return `${App.pageHead(t('dis.title'))}${hint(t('dis.hint'))}
      ${list.length ? `<div class="list">${list.map((d, i) => `<div class="list-row"><span><b>${esc(App.exName(d.exId))}</b><small>${App.mName(EX[d.exId].m)}${d.envId ? ' · ' + esc((st().envs.find(e => e.id === d.envId) || {}).name || '') : ' · ' + t('dis.allEnvs')}</small></span><button class="icon-btn" data-a="disDel" data-i="${i}" aria-label="remove">${ICON.x}</button></div>`).join('')}</div>` : `<p class="center muted mt">${t('dis.none')}</p>`}
      <button class="btn secondary mt" data-a="disAdd">+ ${t('dis.add')}</button>`;
  };
  A.disDel = d => { st().disliked.splice(+d.i, 1); dirty(); App.render(); };
  A.disAdd = () => App.exercisePicker({ title: t('dis.add'), disabled: id => st().disliked.some(x => x.exId === id && !x.envId), onPick: id => { st().disliked.push({ exId: id, envId: null }); dirty(); App.closeSheet(); App.render(); } });

  // ---------- Custom exercises ----------
  P.customEx = () => {
    const list = st().customEx;
    return `${App.pageHead(t('cust.title'))}${hint(t('cust.hint'))}
      ${list.length ? `<div class="list">${list.map(e => `<div class="list-row"><span><b>${esc(e.n.en)}</b><small>${App.mName(e.m)} · ${e.reps.join('–')} · ${t('load.' + e.load)}</small></span><button class="icon-btn" data-a="custEdit" data-id="${e.id}" aria-label="edit">${ICON.edit}</button><button class="icon-btn" data-a="custDel" data-id="${e.id}" aria-label="remove">${ICON.x}</button></div>`).join('')}</div>` : `<p class="center muted mt">${t('cust.none')}</p>`}
      <button class="btn secondary mt" data-a="custAdd">+ ${t('cust.add')}</button>`;
  };
  A.custDel = async d => {
    if (!(await App.confirmDlg(t('delete'), t('cust.delQ'), t('delete'), 'danger'))) return;
    st().customEx = st().customEx.filter(e => e.id !== d.id);
    const i = EXERCISES.findIndex(e => e.id === d.id); if (i >= 0) EXERCISES.splice(i, 1); delete EX[d.id];
    dirty(); App.render();
  };
  A.custAdd = () => { ui.cust = { id: null, name: '', m: 'biceps', load: 'machine', multi: false, bw: false, uni: false, lo: 8, hi: 12, note: '' }; App.openSheet(custSheet); };
  A.custEdit = d => {
    const e = st().customEx.find(x => x.id === d.id); if (!e) return;
    ui.cust = { id: e.id, name: e.n.en, m: e.m, load: e.bw ? 'bw' : e.load, multi: e.multi, bw: !!e.bw, uni: e.uni, lo: e.reps[0], hi: e.reps[1], note: e.desc || '' };
    App.openSheet(custSheet);
  };
  function custSheet() {
    const c = ui.cust;
    const segc = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(c[k]) === String(v) ? 'on' : ''}" data-a="custSet" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    return `<h2>${c.id ? t('cust.edit') : t('cust.add')}</h2><p class="muted">${t('cust.intro')}</p>
      <label>${t('cust.name')} *</label><input class="inp" id="custName" value="${esc(c.name)}" data-in="custName" maxlength="50" placeholder="${t('cust.namePh')}">
      <label class="mt">${t('cust.muscle')}</label><select class="inp" data-ch="custMuscle">${MUSCLES.map(m => `<option value="${m}" ${c.m === m ? 'selected' : ''}>${App.mName(m)}</option>`).join('')}</select>
      <label class="mt">${t('cust.bw')}</label>${segc('bw', [[false, t('no')], [true, t('yes')]])}${hint(t('cust.bwHint'))}
      ${c.bw ? '' : `<label class="mt">${t('cust.load')}</label>${segc('load', [['machine', t('load.machine')], ['cable', t('load.cable')], ['dumbbell', t('load.dumbbell')], ['barbell', t('load.barbell')], ['band', t('load.band')]])}`}
      <label class="mt">${t('cust.multi')}</label>${segc('multi', [[false, t('no')], [true, t('yes')]])}${hint(t('cust.multiHint'))}
      <label class="mt">${t('cust.uni')}</label>${segc('uni', [[false, t('no')], [true, t('yes')]])}${hint(t('cust.uniHint'))}
      <label class="mt">${t('c.reps')}: <b>${c.lo} – ${c.hi}</b></label>
      <div class="grid2"><div class="stepper sm"><button data-a="custSet" data-k="lo" data-v="${Math.max(1, c.lo - 1)}">${ICON.minus}</button><div class="val">${c.lo}</div><button data-a="custSet" data-k="lo" data-v="${Math.min(c.hi, c.lo + 1)}">${ICON.plus}</button></div>
      <div class="stepper sm"><button data-a="custSet" data-k="hi" data-v="${Math.max(c.lo, c.hi - 1)}">${ICON.minus}</button><div class="val">${c.hi}</div><button data-a="custSet" data-k="hi" data-v="${Math.min(40, c.hi + 1)}">${ICON.plus}</button></div></div>
      <label class="mt">${t('cust.notes')}</label><textarea class="inp" rows="2" data-in="custNote" maxlength="500">${esc(c.note)}</textarea>
      <button class="btn primary" data-a="custSave">${t('save')}</button><button class="btn secondary" data-a="closeSheet">${t('cancel')}</button>`;
  }
  A.custName = (d, el) => { ui.cust.name = el.value; };
  A.custNote = (d, el) => { ui.cust.note = el.value; };
  A.custMuscle = (d, el) => { ui.cust.m = el.value; };
  A.custSet = d => { ui.cust[d.k] = App.parseV(d.v); App.refreshSheet(); };
  A.custSave = () => {
    const c = ui.cust;
    if (!c.name.trim()) { App.notice(t('notice'), t('we.needName')); return; }
    const load = c.bw ? 'bw' : c.load;
    const ex = { id: c.id || ('c_' + Engine.uid()), n: { en: c.name.trim(), sl: c.name.trim() }, m: c.m, sec: [], req: load === 'band' ? [['bands']] : [], load, type: c.multi ? 'compound' : 'iso',
      setup: 1, ev: 3, reps: [c.lo, c.hi], r: c.multi ? 0.7 : 0.3, inc: load === 'dumbbell' ? 2 : 2.5, j: '', notes: [], uni: !!c.uni, multi: !!c.multi, custom: true, desc: c.note };
    if (c.bw) { ex.bw = 0.6; ex.rtf = 12; }
    const i = st().customEx.findIndex(x => x.id === ex.id);
    if (i >= 0) { st().customEx[i] = ex; const k = EXERCISES.findIndex(x => x.id === ex.id); if (k >= 0) EXERCISES[k] = ex; } else { st().customEx.push(ex); EXERCISES.push(ex); }
    EX[ex.id] = ex;
    dirty(); App.closeSheet(); App.render();
  };

  // ---------- Injuries ----------
  App.injuryListHtml = () => {
    const inj = S().injuries;
    return `${inj.length ? `<div class="list">${inj.map((x, i) => `<div class="list-row"><span><b>${t('loc.' + x.loc)}</b><small>${t('sev.' + x.severity)}</small></span><button class="icon-btn" data-a="injEditSev" data-i="${i}" aria-label="edit">${ICON.edit}</button><button class="icon-btn" data-a="injDel" data-i="${i}" aria-label="remove">${ICON.x}</button></div>`).join('')}</div>`
      : `<p class="center muted">${t('inj.none')}</p>`}
      <div class="btn-row"><button class="btn secondary" data-a="injAdd">+ ${t('inj.add')}</button>${inj.length ? `<button class="btn ghost" data-a="injClear">${t('inj.clear')}</button>` : ''}</div>`;
  };
  P.injuries = () => `${App.pageHead(t('menu.injuries'))}${hint(t('inj.hint'))}${App.injuryListHtml()}`;
  A.injDel = d => { S().injuries.splice(+d.i, 1); dirty(); App.keepScroll(App.render); };
  A.injClear = async () => { if (await App.confirmDlg(t('inj.clear'), t('inj.clearQ'), t('clearAll'), 'danger')) { S().injuries = []; dirty(); App.render(); } };
  A.injAdd = () => { ui.inj = { loc: null, severity: 'mild', q: '' }; App.openSheet(injSheet); };
  A.injEditSev = d => { const x = S().injuries[+d.i]; ui.inj = { loc: x.loc, severity: x.severity, q: '', edit: +d.i }; App.openSheet(injSheet); };
  function injSheet() {
    const inj = ui.inj;
    const qq = (inj.q || '').toLowerCase();
    const locs = INJURY_LOCS.map(l => l[0]).filter(l => !qq || t('loc.' + l).toLowerCase().includes(qq));
    if (inj.loc) return `<h2>${t('loc.' + inj.loc)}</h2><label>${t('inj.sev')}</label>
      <div class="radios">${SEVERITIES.map(v => `<button class="radio-row ${inj.severity === v ? 'on' : ''}" data-a="injSet" data-k="severity" data-v="${v}"><span><b>${t('sev.' + v)}</b></span><i class="rdot"></i></button>`).join('')}</div>
      ${hint(t('sev.' + inj.severity + '.d'))}
      <button class="btn primary" data-a="injSave">${t('save')}</button><button class="btn secondary" data-a="${inj.edit != null ? 'closeSheet' : 'injBackLoc'}">${inj.edit != null ? t('cancel') : t('back')}</button>`;
    return `<h2>${t('inj.loc')}</h2>
      <div class="search"><span>${ICON.search}</span><input class="inp" id="injQ" placeholder="${t('inj.search')}" value="${esc(inj.q)}" data-in="injQ"></div>
      <div class="bodymap">${locs.map(l => `<button class="chip ${S().injuries.some(x => x.loc === l) ? 'on' : ''}" data-a="injSet" data-k="loc" data-v="${l}">${t('loc.' + l)}</button>`).join('')}</div>`;
  }
  A.injQ = (d, el) => { ui.inj.q = el.value; App.refreshSheet(); };
  A.injSet = d => { ui.inj[d.k] = d.v; App.refreshSheet(); };
  A.injBackLoc = () => { ui.inj.loc = null; App.refreshSheet(); };
  A.injSave = () => {
    const inj = S().injuries;
    const ex = inj.find(x => x.loc === ui.inj.loc);
    if (ex) ex.severity = ui.inj.severity; else inj.push({ loc: ui.inj.loc, severity: ui.inj.severity });
    dirty(); App.closeSheet(); App.render();
  };

  // ---------- Training environments ----------
  App.envListHtml = () => {
    const envs = st().envs;
    return `<div class="wk-list">${envs.map(e => `<div class="wk-card ${e.id === S().envId ? 'active' : ''}" data-a="envActivate" data-id="${e.id}">
        <div><small>${t('env.pieces', { n: e.equip.length })}${e.id === S().envId ? ` · <span class="acc">${t('env.active')}</span>` : ''}</small><div class="wk-name">${esc(e.name)}</div><small class="muted">${t('envt.' + (e.type || 'commercial'))}</small></div>
        <button class="icon-btn circ" data-a="go" data-page="envEdit" data-id="${e.id}" aria-label="edit">${ICON.edit}</button>
        ${envs.length > 1 ? `<button class="icon-btn circ danger" data-a="envDel" data-id="${e.id}" aria-label="delete">${ICON.x}</button>` : ''}
      </div>`).join('')}</div>
      <button class="btn secondary" data-a="envAdd">+ ${t('env.add')}</button>`;
  };
  P.envs = () => `${App.pageHead(t('menu.envs'))}${hint(t('env.hint'))}${App.envListHtml()}`;
  A.envActivate = (d, el, e) => { if (e && e.target.closest('button')) return; S().envId = d.id; dirty(); App.render(); };
  A.envDel = async d => {
    const env = st().envs.find(e => e.id === d.id);
    if (!(await App.confirmDlg(t('delete'), t('env.delQ', { n: esc(env.name) }), t('delete'), 'danger'))) return;
    st().envs = st().envs.filter(e => e.id !== d.id);
    if (S().envId === d.id) S().envId = st().envs[0].id;
    dirty(); App.render();
  };
  A.envAdd = () => { ui.newEnv = { name: '', type: 'commercial' }; App.openSheet(newEnvSheet); };
  function newEnvSheet() {
    const n = ui.newEnv;
    return `<h2>${t('env.add')}</h2><p class="muted">${t('env.addIntro')}</p>
      <label>${t('env.name')} *</label><input class="inp" id="envName" value="${esc(n.name)}" data-in="envName" maxlength="40" placeholder="${t('env.namePh')}">
      <label class="mt">${t('env.type')}</label>
      <div class="radios">${ENV_TYPES.map(p => `<button class="radio-row ${n.type === p ? 'on' : ''}" data-a="envType" data-v="${p}"><span><b>${t('envt.' + p)}</b><small>${t('env.pieces', { n: (ENV_PRESETS[p] || []).length })}</small></span><i class="rdot"></i></button>`).join('')}</div>
      <button class="btn primary" data-a="envCreate">${t('continue')}</button><button class="btn secondary" data-a="closeSheet">${t('cancel')}</button>`;
  }
  A.envName = (d, el) => { ui.newEnv.name = el.value; };
  A.envType = d => { ui.newEnv.type = d.v; App.refreshSheet(); };
  A.envCreate = async () => {
    const n = ui.newEnv;
    const name = n.name.trim() || t('envt.' + n.type);
    if (st().envs.some(e => e.name.toLowerCase() === name.toLowerCase())) { App.notice(t('notice'), t('env.dupName')); return; }
    const e = Store.makeEnv(name, n.type, S().units);
    st().envs.push(e);
    S().envId = e.id;
    dirty(); App.closeSheet();
    App.go('envEdit', { id: e.id });
    await App.notice(t('notice'), n.type === 'none' ? t('env.noneNotice') : t('env.notice'));
  };
  const envById = id => st().envs.find(e => e.id === id);
  const bump = e => { e.rev = (e.rev || 0) + 1; dirty(); };

  P.envEdit = args => {
    const e = envById(args.id);
    if (!e) return App.pageHead('');
    const cnt = arr => (arr || []).reduce((a, x) => a + (x.q === -1 ? 1 : x.q), 0);
    const wl = w => App.fmtNum(App.wVal(w));
    const hasPlates = e.equip.some(x => PLATE_EQUIP.has(x));
    const qq = (ui.eqQ || '').toLowerCase();
    return `${App.pageHead(esc(e.name), { right: `<button class="icon-btn circ" data-a="envRename" data-id="${e.id}" aria-label="rename">${ICON.edit}</button>` })}
      <p class="muted">${t('envt.' + (e.type || 'commercial'))} · ${t('env.pieces', { n: e.equip.length })}</p>
      <h3 class="sec-h">${t('inv.title')}</h3>
      ${hasPlates ? `<button class="menu-row" data-a="invOpen" data-id="${e.id}" data-k="plates"><span><b>${t('inv.plates')}</b><small>${e.plates.length ? e.plates.map(p => wl(p.w)).join(', ') + ' ' + App.unitW() : t('inv.empty')}</small></span>${ICON.right}</button>
      <button class="menu-row" data-a="barsOpen" data-id="${e.id}"><span><b>${t('inv.bars')}</b><small>${['barbell', 'ezbar', 'trapBar', 'ssb'].filter(b => e.equip.includes(b)).map(b => `${App.eqName(b)} ${wl(e.bars[b] ?? BAR_WEIGHTS[b])}`).join(', ') || t('inv.empty')}</small></span>${ICON.right}</button>` : ''}
      ${e.equip.includes('dumbbell') ? `<button class="menu-row" data-a="invOpen" data-id="${e.id}" data-k="dumbbells"><span><b>${t('inv.dumbbells')}</b><small>${e.dumbbells.length ? `${wl(e.dumbbells[0].w)} – ${wl(e.dumbbells[e.dumbbells.length - 1].w)} ${App.unitW()} · ${cnt(e.dumbbells)} ${t('inv.pcs')}` : t('inv.empty')}</small></span>${ICON.right}</button>` : ''}
      ${e.equip.includes('kettlebell') ? `<button class="menu-row" data-a="invOpen" data-id="${e.id}" data-k="kettlebells"><span><b>${t('inv.kettlebells')}</b><small>${e.kettlebells.length ? e.kettlebells.map(k => wl(k.w)).join(', ') + ' ' + App.unitW() : t('inv.empty')}</small></span>${ICON.right}</button>` : ''}
      ${e.equip.includes('bands') ? `<button class="menu-row" data-a="bandsOpen" data-id="${e.id}"><span><b>${t('inv.bands')}</b><small>${e.bands.map(b => t('band.' + b.key)).join(', ')}</small></span>${ICON.right}</button>` : ''}
      <h3 class="sec-h">${t('env.equipment')}</h3>
      <div class="search"><span>${ICON.search}</span><input class="inp" id="eqSearch" placeholder="${t('env.search')}" value="${esc(ui.eqQ || '')}" data-in="eqQ"></div>
      ${EQUIP_GROUPS.map(([g, list]) => { const items = list.filter(eq => !qq || App.eqName(eq).toLowerCase().includes(qq)); if (!items.length) return ''; return `<h3 class="q">${t('eqg.' + g)}</h3>
        ${items.map(eq => { const on = e.equip.includes(eq); const vars = (e.variants || {})[eq] || []; const conf = PLATE_EQUIP.has(eq) && !['barbell', 'ezbar', 'trapBar', 'ssb'].includes(eq) || STACK_EQUIP.has(eq);
          return `<div class="check-line"><button class="check-row ${on ? 'on' : ''}" data-a="envToggle" data-id="${e.id}" data-eq="${eq}"><span>${App.eqName(eq)}${vars.length ? `<small>${vars.map(esc).join(', ')}</small>` : ''}</span><i class="cbox">${on ? ICON.check : ''}</i></button>
            ${on && conf ? `<button class="btn ghost inline" data-a="machOpen" data-id="${e.id}" data-eq="${eq}">${t('env.configure')}</button>` : ''}</div>`; }).join('')}`; }).join('')}
      ${e.equip.length ? '' : `<p class="warn-txt">${ICON.warn}<span>${t('env.noEquip')}</span></p>`}`;
  };
  A.eqQ = (d, el) => { ui.eqQ = el.value; App.keepScroll(App.render); const i = document.getElementById('eqSearch'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } };
  A.envRename = d => { const e = envById(d.id); App.textSheet({ title: t('env.rename'), label: t('env.name'), value: e.name, onSave: v => { if (v) { e.name = v; App.save(); App.render(); } } }); };
  A.envToggle = d => {
    const e = envById(d.id);
    const i = e.equip.indexOf(d.eq);
    if (i >= 0) e.equip.splice(i, 1); else e.equip.push(d.eq);
    if (i < 0 && PLATE_EQUIP.has(d.eq) && !e.plates.length) e.plates = Store.makeEnv('x', 'commercial', S().units).plates;
    bump(e); App.keepScroll(App.render);
  };

  // ----- machine configuration: loading type, base weight, weight ranges, variants -----
  A.machOpen = d => {
    const e = envById(d.id);
    const cur = Engine.machineCfg(e, d.eq);
    if (!cur.ranges) cur.ranges = [[App.kgFrom(App.lbMode() ? 10 : 5), App.kgFrom(App.lbMode() ? 200 : 100), App.kgFrom(App.lbMode() ? 10 : 5)]];
    ui.mach = { id: d.id, eq: d.eq, cfg: JSON.parse(JSON.stringify(cur)) };
    App.openSheet(machSheet);
  };
  function machSheet() {
    const m = ui.mach, c = m.cfg;
    const e = envById(m.id);
    const vars = (e.variants || {})[m.eq] || [];
    const segm = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${c[k] === v ? 'on' : ''}" data-a="machSet" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const wl = w => App.fmtNum(App.wVal(w));
    const canPlates = PLATE_EQUIP.has(m.eq) || m.eq === 'assistMachine' || true;
    return `<div class="sheet-head"><h2>${t('mach.title')}</h2><button class="icon-btn circ" data-a="closeSheet">${ICON.x}</button></div>
      <p class="muted">${App.eqName(m.eq)}</p>
      <label>${t('mach.loading')}</label>${canPlates ? segm('loading', [['plates', t('mach.plates')], ['stack', t('mach.stacks')]]) : ''}
      ${c.loading === 'plates' ? `<label class="mt">${t('mach.sides')}</label>${segm('sides', [['both', t('mach.both')], ['one', t('mach.one')]])}
        <label class="mt">${t('mach.base')}</label><div class="stepper"><button data-a="machStep" data-k="base" data-d="-1">${ICON.minus}</button><div class="val">${wl(c.base || 0)} <small>${App.unitW()}</small></div><button data-a="machStep" data-k="base" data-d="1">${ICON.plus}</button></div>
        ${hint(t('mach.platesHint'))}<button class="btn secondary" data-a="invOpen" data-id="${m.id}" data-k="plates">${t('mach.editPlates')}</button>`
        : `<label class="mt">${t('mach.ranges')}</label>${hint(t('mach.rangesHint'))}
        <div class="list">${(c.ranges || []).map((r, i) => `<div class="list-row"><span><b>${wl(r[0])} – ${wl(r[1])} ${App.unitW()}</b><small>${t('mach.inc')}: ${wl(r[2])} ${App.unitW()}</small></span><button class="icon-btn" data-a="rangeEdit" data-i="${i}">${ICON.edit}</button><button class="icon-btn" data-a="rangeDel" data-i="${i}">${ICON.x}</button></div>`).join('')}</div>
        <button class="btn secondary" data-a="rangeAdd">+ ${t('mach.addRange')}</button>`}
      <h3 class="q">${t('var.title')}</h3>${hint(t('var.hint'))}
      ${vars.map((v, i) => `<div class="var-row"><b>${esc(v)}</b><div><button class="btn ghost inline" data-a="varRename" data-i="${i}">${t('var.rename')}</button><button class="icon-btn" data-a="varDel" data-i="${i}">${ICON.trash}</button></div></div>`).join('') || `<p class="muted small-p">${t('var.none')}</p>`}
      <button class="btn secondary" data-a="varAdd">+ ${t('var.add')}</button>
      <button class="btn primary" data-a="machSave">${t('save')}</button>`;
  }
  A.machSet = d => { ui.mach.cfg[d.k] = d.v; App.refreshSheet(); };
  A.machStep = d => { const c = ui.mach.cfg; const step = App.kgFrom(App.lbMode() ? 5 : 2.5); c[d.k] = Math.max(0, Math.round(((c[d.k] || 0) + (+d.d) * step) * 1000) / 1000); App.refreshSheet(); };
  A.machSave = () => {
    const m = ui.mach; const e = envById(m.id);
    if (m.cfg.loading === 'stack') { const rs = m.cfg.ranges || []; for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (rs[i][0] <= rs[j][1] && rs[j][0] <= rs[i][1]) { App.notice(t('notice'), t('mach.overlap')); return; } }
    e.machines[m.eq] = m.cfg; bump(e); App.closeSheet(); App.render();
  };
  A.rangeAdd = () => { const rs = ui.mach.cfg.ranges = ui.mach.cfg.ranges || []; const last = rs[rs.length - 1]; const inc = App.kgFrom(App.lbMode() ? 10 : 5); rs.push([last ? last[1] + inc : inc, (last ? last[1] : 0) + 20 * inc, inc]); ui.mach.rangeEdit = rs.length - 1; App.openSheet(rangeSheet); };
  A.rangeEdit = d => { ui.mach.rangeEdit = +d.i; App.openSheet(rangeSheet); };
  A.rangeDel = d => { ui.mach.cfg.ranges.splice(+d.i, 1); App.refreshSheet(); };
  function rangeSheet() {
    const r = ui.mach.cfg.ranges[ui.mach.rangeEdit];
    const wl = w => App.fmtNum(App.wVal(w));
    const row = (k, label) => `<label class="mt">${label}</label><div class="stepper"><button data-a="rangeStep" data-k="${k}" data-d="-1">${ICON.minus}</button><div class="val">${wl(r[k])} <small>${App.unitW()}</small></div><button data-a="rangeStep" data-k="${k}" data-d="1">${ICON.plus}</button></div>`;
    return `<h2>${t('mach.range')}</h2>${row(0, t('mach.min'))}${row(1, t('mach.max'))}${row(2, t('mach.inc'))}
      <button class="btn primary" data-a="rangeDone">${t('done')}</button>`;
  }
  A.rangeStep = d => { const r = ui.mach.cfg.ranges[ui.mach.rangeEdit]; const step = App.kgFrom(App.lbMode() ? (d.k === '2' ? 1 : 5) : (d.k === '2' ? 0.5 : 2.5)); const k = +d.k; r[k] = Math.max(k === 2 ? step : 0, Math.round((r[k] + (+d.d) * step) * 1000) / 1000); if (k === 0 && r[0] > r[1]) r[1] = r[0]; if (k === 1 && r[1] < r[0]) r[0] = r[1]; App.refreshSheet(); };
  A.rangeDone = () => App.openSheet(machSheet);
  A.varAdd = () => { const m = ui.mach; App.textSheet({ title: t('var.add'), label: t('var.name'), placeholder: t('var.ph'), onSave: v => { const e = envById(m.id); if (v) { (e.variants[m.eq] = e.variants[m.eq] || []).push(v); bump(e); } ui.mach = m; App.openSheet(machSheet); } }); };
  A.varRename = d => { const m = ui.mach; const e = envById(m.id); App.textSheet({ title: t('var.rename'), label: t('var.name'), value: e.variants[m.eq][+d.i], onSave: v => { if (v) { e.variants[m.eq][+d.i] = v; bump(e); } ui.mach = m; App.openSheet(machSheet); } }); };
  A.varDel = d => { const m = ui.mach; const e = envById(m.id); e.variants[m.eq].splice(+d.i, 1); bump(e); App.refreshSheet(); };

  // ----- bars -----
  A.barsOpen = d => { ui.bars = { id: d.id }; App.openSheet(barsSheet); };
  function barsSheet() {
    const e = envById(ui.bars.id);
    const wl = w => App.fmtNum(App.wVal(w));
    return `<div class="sheet-head"><h2>${t('inv.bars')}</h2><button class="icon-btn circ" data-a="closeSheet">${ICON.x}</button></div>${hint(t('inv.barsHint'))}
      ${['barbell', 'ezbar', 'trapBar', 'ssb'].filter(b => e.equip.includes(b)).map(b => `<label class="mt">${App.eqName(b)}</label><div class="stepper"><button data-a="barStep" data-b="${b}" data-d="-1">${ICON.minus}</button><div class="val">${wl(e.bars[b] ?? BAR_WEIGHTS[b])} <small>${App.unitW()}</small></div><button data-a="barStep" data-b="${b}" data-d="1">${ICON.plus}</button></div>`).join('')}
      <button class="btn primary" data-a="closeSheet">${t('done')}</button>`;
  }
  A.barStep = d => { const e = envById(ui.bars.id); const step = App.kgFrom(App.lbMode() ? 5 : 2.5); const cur = e.bars[d.b] ?? BAR_WEIGHTS[d.b]; e.bars[d.b] = Math.max(0, Math.round((cur + (+d.d) * step) * 1000) / 1000); bump(e); App.refreshSheet(); };

  // ----- bands -----
  A.bandsOpen = d => { ui.bandsEnv = d.id; App.openSheet(bandsSheet); };
  function bandsSheet() {
    const e = envById(ui.bandsEnv);
    const wl = w => App.fmtNum(App.wVal(w));
    return `<div class="sheet-head"><h2>${t('inv.bands')}</h2><button class="icon-btn circ" data-a="closeSheet">${ICON.x}</button></div>${hint(t('inv.bandsHint'))}
      ${e.bands.map((b, i) => `<div class="list-row"><span><b>${t('band.' + b.key)}</b></span><div class="stepper sm"><button data-a="bandStep" data-i="${i}" data-d="-1">${ICON.minus}</button><div class="val">${wl(b.w)} ${App.unitW()}</div><button data-a="bandStep" data-i="${i}" data-d="1">${ICON.plus}</button></div><button class="icon-btn" data-a="bandDel" data-i="${i}">${ICON.x}</button></div>`).join('')}
      <div class="chips sel mt">${DEFAULT_BANDS.filter(b => !e.bands.some(x => x.key === b[0])).map(b => `<button class="chip" data-a="bandAdd" data-k="${b[0]}">+ ${t('band.' + b[0])}</button>`).join('')}</div>
      <button class="btn primary mt" data-a="closeSheet">${t('done')}</button>`;
  }
  A.bandStep = d => { const e = envById(ui.bandsEnv); const b = e.bands[+d.i]; b.w = Math.max(1, Math.round((b.w + (+d.d) * App.kgFrom(App.lbMode() ? 2 : 1)) * 100) / 100); bump(e); App.refreshSheet(); };
  A.bandDel = d => { const e = envById(ui.bandsEnv); e.bands.splice(+d.i, 1); bump(e); App.refreshSheet(); };
  A.bandAdd = d => { const e = envById(ui.bandsEnv); const def = DEFAULT_BANDS.find(b => b[0] === d.k); e.bands.push({ key: def[0], w: App.kgFrom(App.lbMode() ? Math.round(def[1] * Engine.LB) : def[1]) }); e.bands.sort((a, b) => a.w - b.w); bump(e); App.refreshSheet(); };

  // ----- plates / dumbbells / kettlebells inventory -----
  A.invOpen = d => { ui.inv = { id: d.id, kind: d.k, edit: null }; App.openSheet(invSheet); };
  function invSheet() {
    const iv = ui.inv;
    const e = envById(iv.id);
    if (iv.edit) return invEditSheet();
    const items = e[iv.kind] || [];
    const sorted = items.map((x, i) => ({ x, i })).sort((a, b) => a.x.w - b.x.w);
    const qty = qv => (qv === -1 ? '∞' : qv);
    const rows = list => list.map(({ x, i }) => `<div class="inv-row"><b>${App.fmtNum(App.wVal(x.w))} ${App.unitW()}</b><small>${t('inv.qty')}: ${qty(x.q)}</small>
        <button class="icon-btn" data-a="invEdit" data-list="${iv.kind}" data-i="${i}">${ICON.edit}</button><button class="icon-btn" data-a="invDel" data-list="${iv.kind}" data-i="${i}">${ICON.x}</button></div>`).join('');
    const micro = iv.kind === 'dumbbells' ? (e.micro || []).map((x, i) => ({ x, i })) : [];
    return `<div class="sheet-head"><h2>${t('inv.' + iv.kind + 'T')}</h2><button class="icon-btn circ" data-a="closeSheet">${ICON.x}</button></div>
      ${App.seg('settings.units', [['kg', 'kg'], ['lb', 'lb']]).replace(/data-a="setv"/g, 'data-a="invUnits"')}
      ${iv.kind === 'plates' ? App.toggleRow('envPlateColors.' + iv.id, t('inv.colors')) : ''}
      <label class="mt">${t('inv.items')}</label>
      <div class="inv-list">${rows(sorted) || `<p class="muted">${t('inv.empty')}</p>`}</div>
      <button class="btn secondary" data-a="invAddItem" data-list="${iv.kind}">+ ${t('inv.addItem')}</button>
      ${iv.kind === 'dumbbells' ? `<label class="mt">${t('inv.small')} <button class="help-btn" data-a="help" data-k="micro">${ICON.help}</button></label><div class="inv-list">${rows(micro) || `<p class="muted">${t('inv.empty')}</p>`}</div><button class="btn secondary" data-a="invAddItem" data-list="micro">+ ${t('inv.addSmall')}</button>` : ''}
      <button class="btn ghost mt" data-a="invReset">${t('inv.reset')}</button>
      <button class="btn primary" data-a="closeSheet">${t('save')}</button>`;
  }
  function invEditSheet() {
    const ed = ui.inv.edit;
    return `<div class="sheet-head"><h2>${ed.isNew ? t('inv.addItem') : t('inv.editItem')}</h2><button class="icon-btn circ" data-a="invEditCancel">${ICON.x}</button></div>
      <label>${t('c.weight')} (${App.unitW()})</label>
      <div class="stepper"><button data-a="invStep" data-k="w" data-d="-1">${ICON.minus}</button><input class="inp num" id="invW" type="number" inputmode="decimal" step="0.25" value="${App.fmtNum(App.wVal(ed.w))}" data-ch="invW"><button data-a="invStep" data-k="w" data-d="1">${ICON.plus}</button></div>
      <label>${t('inv.qty')}</label>
      <div class="stepper"><button data-a="invStep" data-k="q" data-d="-1">${ICON.minus}</button><div class="val">${ed.q === -1 ? '∞' : ed.q}</div><button data-a="invStep" data-k="q" data-d="1">${ICON.plus}</button><button class="inf ${ed.q === -1 ? 'on' : ''}" data-a="invInf">∞</button></div>
      ${hint(t('inv.qtyHint'))}
      <button class="btn primary" data-a="invEditSave">${t('save')}</button><button class="btn secondary" data-a="invEditCancel">${t('cancel')}</button>`;
  }
  A.invUnits = d => { S().units = d.v; dirty(); App.refreshSheet(); App.render(); };
  A.invEdit = d => { const e = envById(ui.inv.id); const it = e[d.list][+d.i]; ui.inv.edit = { list: d.list, i: +d.i, w: it.w, q: it.q }; App.refreshSheet(); };
  A.invAddItem = d => {
    const lb = App.lbMode();
    const w = d.list === 'micro' ? (lb ? 1.25 : 0.5) : d.list === 'kettlebells' ? (lb ? 35 : 16) : (lb ? 10 : 5);
    ui.inv.edit = { list: d.list, i: -1, w: App.kgFrom(w), q: d.list === 'plates' ? 2 : d.list === 'micro' ? 4 : d.list === 'kettlebells' ? 1 : 2, isNew: true };
    App.refreshSheet();
  };
  A.invW = (d, el) => { const v = Number(String(el.value).replace(',', '.')); if (v > 0) ui.inv.edit.w = App.kgFrom(v); };
  A.invStep = d => {
    const ed = ui.inv.edit;
    if (d.k === 'w') { const inp = document.getElementById('invW'); if (inp) { const v = Number(String(inp.value).replace(',', '.')); if (v > 0) ed.w = App.kgFrom(v); } const step = App.kgFrom(App.lbMode() ? (ed.list === 'micro' ? 0.25 : 2.5) : (ed.list === 'micro' ? 0.25 : ed.list === 'plates' ? 1.25 : 0.5)); ed.w = Math.max(step, Math.round((ed.w + (+d.d) * step) * 10000) / 10000); }
    else { if (ed.q === -1) ed.q = 2; ed.q = Math.max(1, ed.q + (+d.d)); }
    App.refreshSheet();
  };
  A.invInf = () => { const ed = ui.inv.edit; ed.q = ed.q === -1 ? 2 : -1; App.refreshSheet(); };
  A.invEditCancel = () => { ui.inv.edit = null; App.refreshSheet(); };
  A.invEditSave = () => {
    const ed = ui.inv.edit; const e = envById(ui.inv.id);
    const inp = document.getElementById('invW'); if (inp) { const v = Number(String(inp.value).replace(',', '.')); if (v > 0) ed.w = App.kgFrom(v); }
    e[ed.list] = e[ed.list] || [];
    const existing = e[ed.list].findIndex((x, i) => Math.abs(x.w - ed.w) < 1e-6 && i !== ed.i);
    if (ed.i >= 0 && existing >= 0) { e[ed.list][existing].q = ed.q; e[ed.list].splice(ed.i, 1); }
    else if (ed.i >= 0) e[ed.list][ed.i] = { w: ed.w, q: ed.q }; else if (existing >= 0) e[ed.list][existing].q = ed.q; else e[ed.list].push({ w: ed.w, q: ed.q });
    e[ed.list].sort((a, b) => a.w - b.w);
    ui.inv.edit = null; bump(e); App.refreshSheet(); App.render();
  };
  A.invDel = d => { const e = envById(ui.inv.id); e[d.list].splice(+d.i, 1); bump(e); App.refreshSheet(); App.render(); };
  A.invReset = () => { const e = envById(ui.inv.id); const fresh = Store.makeEnv(e.name, e.type || 'commercial', S().units); e[ui.inv.kind] = fresh[ui.inv.kind]; if (ui.inv.kind === 'dumbbells') e.micro = fresh.micro; bump(e); App.refreshSheet(); App.render(); };
  // plate colours toggle is stored on the environment
  const origGetPath = App.getPath;
  A.toggle = d => {
    if (d.p.startsWith('envPlateColors.')) { const e = envById(d.p.split('.')[1]); e.plateColors = !e.plateColors; bump(e); App.refreshSheet(); return; }
    App.setPath(d.p, !origGetPath(d.p)); if (A.afterSet) A.afterSet(d.p, origGetPath(d.p)); App.save(); App.keepScroll(App.render);
  };
  const origToggleRow = App.toggleRow;
  App.toggleRow = (path, label, sub) => {
    if (path.startsWith('envPlateColors.')) { const e = envById(path.split('.')[1]); return `<button class="toggle-row" data-a="toggle" data-p="${path}"><span><b>${label}</b></span><i class="switch ${e && e.plateColors ? 'on' : ''}"><i></i></i></button>`; }
    return origToggleRow(path, label, sub);
  };

  // ---------- App settings ----------
  P.appSettings = () => `${App.pageHead(t('menu.app'))}
    ${q(t('set.lang'))}${App.seg('settings.lang', [['sl', 'Slovenščina'], ['en', 'English']])}${hint(t('set.langHint'))}
    ${q(t('set.theme'))}${App.seg('settings.theme', [['system', t('theme.system')], ['light', t('theme.light')], ['dark', t('theme.dark')]])}
    ${q(t('set.units'))}${App.seg('settings.units', [['kg', 'kg'], ['lb', 'lbs']])}${hint(t('units.hint'))}
    ${q(t('set.lengthUnits'))}${App.seg('settings.lengthUnits', [['cm', 'cm'], ['in', 'in']])}
    ${q(t('set.notifPerm'))}<button class="btn secondary" data-a="askNotif">${t('set.notifBtn')}</button>${hint(t('set.notifHint'))}`;
  A.askNotif = () => { if (!('Notification' in window)) { App.notice(t('notice'), t('set.notifNA')); return; } Notification.requestPermission().then(p => App.notice(t('notice'), p === 'granted' ? t('set.notifOk') : t('set.notifDenied'))); };

  // ---------- Data ----------
  P.data = () => `${App.pageHead(t('menu.data'))}${hint(t('data.hint'))}
    <h3 class="sec-h">${t('data.backup')}</h3>
    <button class="btn secondary" data-a="export">${t('data.export')}</button>
    <label class="btn secondary file-btn">${t('data.import')}<input type="file" accept="application/json,.json" data-ch="importFile" hidden></label>
    <button class="btn secondary" data-a="copyData">${t('data.copy')}</button>${hint(t('data.copyHint'))}
    <h3 class="sec-h">${t('data.danger')}</h3>
    <button class="btn danger" data-a="clearHistory">${t('data.clearHistory')}</button>
    <button class="btn danger" data-a="reset">${t('data.reset')}</button>`;
  A.export = () => {
    const blob = new Blob([JSON.stringify(st(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'liftlab-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  A.copyData = async () => {
    if (!(await App.confirmDlg(t('data.copy'), t('data.copyQ'), t('confirm')))) return;
    try { await navigator.clipboard.writeText(JSON.stringify(st())); App.notice(t('notice'), t('data.copied')); } catch (e) { App.notice(t('notice'), t('data.copyFail')); }
  };
  A.importFile = (d, el) => {
    const file = el.files && el.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const data = JSON.parse(r.result);
        if (!data || !data.settings || !Array.isArray(data.history)) throw new Error('format');
        if (await App.confirmDlg(t('data.import'), t('data.importQ', { n: data.history.length }), t('data.import'))) {
          App.st = Store.merge(Store.defaults(), data); App.registerCustom(); Engine.clearCache(); App.save(); ui.pages = []; App.render();
        }
      } catch (err) { App.notice(t('data.import'), t('data.importErr'), t('close')); }
    };
    r.readAsText(file);
  };
  A.clearHistory = async () => { if (await App.confirmDlg(t('data.clearHistory'), t('data.clearHistoryQ'), t('delete'), 'danger')) { st().history = []; st().bwLog = st().bwLog.slice(-1); st().draft = null; App.save(); App.render(); } };
  A.reset = async () => {
    if (await App.confirmDlg(t('data.reset'), t('data.resetQ'), t('data.reset'), 'danger')) {
      localStorage.removeItem(Store.KEY); App.st = Store.load(); Engine.clearCache(); ui.pages = []; ui.tab = 'home'; App.render();
    }
  };

  // ---------- Help, what's new, feedback ----------
  P.help = () => {
    const lang = S().lang;
    return `${App.pageHead(t('menu.help'))}
      <h3 class="sec-h">${t('help.faq')}</h3>${I18N.faq[lang].map(([h, p]) => `<details class="sci"><summary>${h}</summary><p>${p}</p></details>`).join('')}
      <h3 class="sec-h">${t('help.terms')}</h3>${I18N.terms[lang].map(([h, p]) => `<details class="sci"><summary>${h}</summary><p>${p}</p></details>`).join('')}
      <h3 class="sec-h">${t('sci.title')}</h3>${I18N.science[lang].map(([h, p]) => `<details class="sci"><summary>${h}</summary><p>${p}</p></details>`).join('')}
      <button class="btn secondary mt" data-a="clearTours">${t('help.tour')}</button>`;
  };
  P.whatsNew = () => `${App.pageHead(t('menu.whatsNew'))}${RELEASE_NOTES.map(r => `<div class="card"><h3 class="card-title">v${r.v} <small class="muted">${r.date}</small></h3><ul class="notes">${r[S().lang].map(x => `<li>${x}</li>`).join('')}</ul></div>`).join('')}`;
  P.feedback = () => `${App.pageHead(t('menu.feedback'))}<p class="muted">${t('fb.intro')}</p>
    <label>${t('fb.type')}</label>${App.seg('feedbackType', [['bug', t('fb.bug')], ['idea', t('fb.idea')], ['other', t('fb.other')]]).replace(/data-a="setv"/g, 'data-a="fbType"')}
    <label class="mt">${t('fb.text')}</label><textarea class="inp" id="fbText" rows="5" maxlength="2000" placeholder="${t('fb.ph')}">${esc(ui.fbText || '')}</textarea>
    <button class="btn primary" data-a="fbSend">${t('fb.send')}</button>${hint(t('fb.hint'))}
    ${st().feedback && st().feedback.length ? `<h3 class="sec-h">${t('fb.saved')}</h3>${st().feedback.slice().reverse().map(f => `<div class="card"><small class="muted">${App.fmtDate(f.date)} · ${t('fb.' + f.type)}</small><p>${esc(f.text)}</p></div>`).join('')}` : ''}`;
  A.fbType = d => { ui.fbType = d.v; App.keepScroll(App.render); };
  A.fbSend = () => {
    const txt = ((document.getElementById('fbText') || {}).value || '').trim();
    if (txt.length < 8) { App.notice(t('notice'), t('fb.short')); return; }
    st().feedback = st().feedback || []; st().feedback.push({ date: Date.now(), type: ui.fbType || 'other', text: txt }); App.save();
    const body = encodeURIComponent(`[LiftLab ${t('fb.' + (ui.fbType || 'other'))}]\n\n${txt}\n\n— v${RELEASE_NOTES[0].v}`);
    ui.fbText = '';
    window.location.href = `mailto:?subject=${encodeURIComponent('LiftLab feedback')}&body=${body}`;
    App.render(); App.notice(t('notice'), t('fb.savedNotice'));
  };
})();
