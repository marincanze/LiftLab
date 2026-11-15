'use strict';
/* ============================================================
 * Tabs: Home (dashboard), Calendar, Stats (charts with date ranges).
 * ============================================================ */
(function () {
  const { A, V, P, ui, t, esc, ICON } = App;
  const st = () => App.st;
  const S = () => App.st.settings;
  const E = Engine;
  const DAY = E.DAY;

  // ---------- helpers ----------
  function calibration() {
    const ids = new Set();
    E.routine(st()).forEach(w => E.buildPlan(st(), w, S().schedule.timePerDay || 60).forEach(it => ids.add(it.exId)));
    if (!ids.size) return 0;
    let n = 0; ids.forEach(id => { if (E.lastPerf(id, st().history)) n++; });
    return Math.round(100 * n / ids.size);
  }
  const weekStart = ts => { const d = new Date(E.dayStart(ts)); d.setDate(d.getDate() - E.weekday(ts)); return d.getTime(); };
  const inRange = (h, from, to) => h.date >= from && h.date <= to;

  // ---------- HOME ----------
  V.home = () => {
    const s = S(); const now = Date.now();
    const cal = calibration();
    const r = 44, c = 2 * Math.PI * r;
    const at = E.nextWorkoutAt(st(), now);
    const w = E.currentWorkout(st());
    const dl = E.deloadState(st(), now);
    const ws = weekStart(now);
    const weekHs = st().history.filter(h => h.date >= E.addDays(ws, -7) && h.date < ws);
    const prs = weekHs.reduce((a, h) => a + (h.prs || []).length, 0);
    const sets = weekHs.reduce((a, h) => a + h.items.reduce((b, i) => b + i.sets.length, 0), 0);
    const newVersion = s.whatsNewSeen !== RELEASE_NOTES[0].v;
    const learnKey = cal >= 80 ? 'learned' : (cal > 0 || st().history.length) ? 'learning' : 'fresh';
    const sc = s.schedule;
    const trained = new Set(st().history.map(h => E.dayStart(h.date)));
    const days = Array.from({ length: 7 }, (_, i) => { const ts = E.addDays(ws, i); return { ts, lbl: t('wd.' + i), done: trained.has(ts), plan: E.isTrainingDay(st(), ts), today: ts === E.dayStart(now) }; });
    return `${App.brand()}
      <h1 class="hello">${esc(s.name) || t('home.hello')}</h1>
      <p class="lead">${t('home.welcome')}</p>
      ${st().active ? `<button class="card glow row-between" data-a="tab" data-tab="train"><span><label>${t('home.active')}</label><b class="big" data-tick="elapsed"></b></span><span class="btn primary inline">${t('home.continue')}</span></button>` : ''}
      ${newVersion ? `<button class="card note-card row-between" data-a="seeWhatsNew"><span><b>${t('home.whatsNew')}</b><br><small class="muted">v${RELEASE_NOTES[0].v}</small></span>${ICON.gift}</button>` : ''}
      <div class="card ring-card" id="tour-learn"><div><h3 class="card-title">${t('home.' + learnKey + 'T')}</h3><p class="muted">${t('home.' + learnKey)}</p></div>
        <svg viewBox="0 0 110 110" width="112" height="112" class="ring"><circle cx="55" cy="55" r="${r}" class="ring-bg"/><circle cx="55" cy="55" r="${r}" class="ring-fg" stroke-dasharray="${c * Math.max(cal, 1) / 100} ${c}" transform="rotate(-90 55 55)"/><text x="55" y="63" text-anchor="middle" class="ring-txt">${cal}<tspan class="ring-pct">%</tspan></text></svg></div>
      <button class="card stat full" data-a="tab" data-tab="train" id="tour-nextw"><label>${t('home.nextWorkout')}</label><div class="row-between"><div class="title-lg">${w ? esc(App.workoutName(w)) : '—'}</div><div class="big hm" data-tick="nextIn">${App.nextInHtml(now)}</div></div><small class="muted">${App.fmtDateLong(at)} · ${App.fmtTime(at)}</small></button>
      <div class="card" id="tour-sched"><div class="row-between"><label>${t('home.schedule')}</label><button class="btn ghost inline" data-a="wizStep" data-step="${App.stepIdx('days')}">${t('edit')}</button></div>
        <div class="weekrow">${days.map(d => `<div class="wd ${d.done ? 'done' : d.plan ? 'plan' : ''} ${d.today ? 'today' : ''}"><small>${d.lbl}</small><span>${d.done ? ICON.check : d.plan ? '●' : '·'}</span></div>`).join('')}</div>
        <small class="muted">${sc.cyclic ? t('days.cycle', { on: sc.cycleOn, off: sc.cycleOff }) : t('home.daysPlanned', { n: sc.daysPerWeek })}${dl.deloading ? ` · <b class="warn">${t('home.deloading')}</b>` : ` · ${t('home.sinceDeload', { n: dl.weeksSince })}`}</small>
        <button class="btn ghost inline wk-link" data-a="go" data-page="weekPlan">${t('wk.title')} ${ICON.right}</button></div>
      ${deloadCard(dl)}${backupCard(now)}
      <div class="grid2">
        <button class="card stat" data-a="editBW"><label>${t('home.weight')}</label><div class="big">${App.fmtBW(s.bodyweight)}<small>${App.unitW()}</small></div><span class="edit">${ICON.edit}</span></button>
        <button class="card stat" data-a="wizStep" data-step="${App.stepIdx('days')}"><label>${t('home.perWeek')}</label><div class="big">${sc.cyclic ? sc.cycleOn + '/' + (sc.cycleOn + sc.cycleOff) : sc.daysPerWeek}<small>${sc.cyclic ? t('home.perCycle') : t('home.workouts')}</small></div><span class="edit">${ICON.edit}</span></button>
      </div>
      <div class="card"><label>${t('home.lastWeek')}</label><div class="grid3 mini"><div><div class="big">${weekHs.length}</div><small class="muted">${t('home.workouts')}</small></div><div><div class="big">${sets}</div><small class="muted">${t('st.sets')}</small></div><div><div class="big">${prs}</div><small class="muted">${t('home.prs')}</small></div></div></div>
      ${s.injuries.length ? `<button class="card inj-card" data-a="go" data-page="injuries"><span class="inj-ico">${ICON.bandage}</span><span><b>${t('home.inj')}</b><small>${t('home.injText')}</small></span>${ICON.right}</button>` : ''}
      ${App.completeness() < 100 ? `<button class="card inj-card prof" data-a="go" data-page="profile"><span class="inj-ico">${ICON.user}</span><span><b>${t('home.prof', { p: App.completeness() })}</b><small>${t('home.profText')}</small></span>${ICON.right}</button>` : ''}`;
  };
  // ---------- deload on demand ----------
  function deloadCard(dl) {
    if (dl.deloading) return `<div class="card note-card"><b>${t('w.deloadT')}</b><p>${t(dl.reason === 'first' ? 'w.deloadFirst' : 'w.deload')}</p>${dl.reason === 'need' ? `<button class="btn ghost inline" data-a="deloadEnd">${t('dl.end')}</button>` : ''}</div>`;
    if (!dl.suggest) return '';
    return `<div class="card note-card warn"><b>${t('dl.suggestT')}</b><p>${dl.suggest === 'fatigue' ? t('dl.fatigue', { a: dl.signal.stalled, b: dl.signal.tracked }) + (dl.signal.hard ? ' ' + t('dl.hard') : '') : t('dl.time', { n: dl.weeksSince })}</p>
      <div class="btn-row"><button class="btn secondary" data-a="deloadSnooze">${t('dl.later')}</button><button class="btn primary" data-a="deloadStart">${t('dl.start')}</button></div></div>`;
  }
  App.deloadCard = deloadCard;
  const replan = () => { st().draft = null; App.save(); App.keepScroll(App.render); };
  A.deloadStart = () => { const now = Date.now(); st().deloadUntil = now + 7 * DAY; st().lastDeloadAt = now + 7 * DAY; st().deloadSnoozeAt = null; replan(); };
  A.deloadEnd = () => { st().deloadUntil = null; st().lastDeloadAt = Date.now(); replan(); };
  A.deloadSnooze = () => { st().deloadSnoozeAt = Date.now() + 7 * DAY; replan(); };

  // ---------- backup reminder ----------
  function backupCard(now) {
    if (st().history.length < 3) return '';
    const last = Math.max(st().lastBackupAt || 0, st().backupSnoozeAt || 0) || st().history[0].date;
    if (now - last < 21 * DAY) return '';
    return `<div class="card note-card"><b>${t('bk.title')}</b><p>${t(st().lastBackupAt ? 'bk.text' : 'bk.never', { n: Math.floor((now - (st().lastBackupAt || 0)) / DAY), w: st().history.length })}</p>
      <div class="btn-row"><button class="btn secondary" data-a="backupLater">${t('dl.later')}</button><button class="btn primary" data-a="export">${t('data.export')}</button></div></div>`;
  }
  A.backupLater = () => { st().backupSnoozeAt = Date.now(); App.save(); App.keepScroll(App.render); };

  // ---------- WEEKLY PLAN ----------
  P.weekPlan = () => {
    const s = S(); const now = Date.now();
    const r = E.routine(st());
    const n = Math.max(1, Math.round(E.daysPerWeek(st())));
    const dl = E.deloadState(st(), now);
    const minutes = s.schedule.unlimitedTime ? 120 : (s.schedule.timePerDay || 60);
    const vol = {}; MUSCLES.forEach(m => vol[m] = 0);
    let total = 0;
    const cards = [];
    for (let k = 0; k < n && r.length; k++) {
      const w = r[(E.rotOf(st()) + k) % r.length];
      const items = E.buildPlan(st(), w, minutes, { deload: dl.deloading });
      const min = Math.round(E.estimate(items, s) / 60);
      items.forEach(it => { const ex = EX[it.exId]; vol[ex.m] += it.sets; total += it.sets; (ex.sec || []).forEach(m => { if (vol[m] != null) vol[m] += it.sets * 0.5; }); });
      cards.push(`<details class="card wkp-card" ${k === 0 ? 'open' : ''}><summary><span class="num">${k + 1}</span><span><b>${esc(App.workoutName(w))}</b><small class="muted">${items.length} ${t('wk.ex')} · ${items.reduce((a, i) => a + i.sets, 0)} ${t('st.sets')} · ${min} min</small></span></summary>
        ${items.map(it => `<button class="wk-row" data-a="info" data-id="${it.exId}"><span>${esc(App.exName(it.exId))}<small class="muted">${App.mName(it.m)}</small></span><b>${it.sets} × ${it.reps.join('–')}</b></button>`).join('')}</details>`);
    }
    const trained = new Set(s.musclesToTrain || DEFAULT_TRAIN);
    const low = MUSCLES.filter(m => trained.has(m) && MUSCLE_IMP[m] <= 2 && vol[m] < 6);
    return `${App.pageHead(t('wk.title'))}
      <p class="muted">${t('wk.intro', { n, t: minutes })}</p>
      ${deloadCard(dl)}
      ${wkCard()}
      ${cards.join('') || `<p class="muted">${t('w.noRoutine')}</p>`}
      <div class="card"><h3 class="card-title">${t('wk.volume')}</h3><p class="hint">${t('wk.volumeText', { n: total })}</p>${volumeBars(vol, trained)}
        ${low.length ? `<p class="warn-txt">${ICON.warn}<span>${t('wk.low')} ${low.map(App.mName).join(', ')}. ${t('wk.lowTip')}</span></p>` : ''}</div>
      <div class="btn-row"><button class="btn secondary" data-a="wizStep" data-step="${App.stepIdx('days')}">${t('wk.editDays')}</button><button class="btn secondary" data-a="wizStep" data-step="${App.stepIdx('routine')}">${t('w.editRoutine')}</button></div>
      ${dl.deloading ? '' : `<button class="btn ghost" data-a="deloadStart">${t('dl.startNow')}</button>`}`;
  };

  A.seeWhatsNew = () => { S().whatsNewSeen = RELEASE_NOTES[0].v; App.save(); App.go('whatsNew'); };
  A.editBW = () => {
    const lb = App.lbMode();
    App.numberSheet({ title: t('home.weight'), value: lb ? Math.round(S().bodyweight * E.LB * 10) / 10 : S().bodyweight, step: lb ? 0.5 : 0.1, min: 30, max: 400, unit: App.unitW(),
      onSave: v => { const kg = App.kgFrom(v); S().bodyweight = kg; st().bwLog.push({ date: Date.now(), kg }); st().draft = null; App.save(); App.render(); } });
  };
  A.afterRender = () => {
    if (!S().onboarded || ui.pages.length || st().active) return;
    if (ui.tab === 'home') App.startTour('app', [
      { sel: null, title: t('tour.app.t'), text: t('tour.app') },
      { sel: '[data-tab="home"]', title: t('tab.home'), text: t('tour.home') },
      { sel: '[data-tab="calendar"]', title: t('tab.calendar'), text: t('tour.calendar') },
      { sel: '[data-tab="train"]', title: t('tab.train'), text: t('tour.train') },
      { sel: '[data-tab="stats"]', title: t('tab.stats'), text: t('tour.stats') },
      { sel: '[data-tab="more"]', title: t('tab.more'), text: t('tour.more') },
      { sel: '#tour-nextw', title: t('home.nextWorkout'), text: t('tour.nextw') },
      { sel: '#tour-sched', title: t('home.schedule'), text: t('tour.sched') }
    ]);
    if (ui.tab === 'train') App.startTour('planner', [
      { sel: null, title: t('tab.train'), text: t('tour.planner') },
      { sel: '#tour-next', title: t('w.nextIn'), text: t('tour.pnext') },
      { sel: '#tour-time', title: t('w.time'), text: t('tour.ptime') },
      { sel: '#tour-env', title: t('w.env'), text: t('tour.penv') },
      { sel: '#tour-start', title: t('w.start'), text: t('tour.pstart') }
    ]);
    if (ui.tab === 'stats') App.startTour('stats', [{ sel: null, title: t('tab.stats'), text: t('tour.statsIntro') }]);
  };

  // ---------- CALENDAR ----------
  V.calendar = () => {
    const now = new Date();
    const m = ui.calM || { y: now.getFullYear(), m: now.getMonth() };
    ui.calM = m;
    const first = new Date(m.y, m.m, 1);
    const days = new Date(m.y, m.m + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const key = ts => E.dayStart(ts);
    const done = new Map();
    st().history.forEach(h => { const k = key(h.date); done.set(k, (done.get(k) || []).concat(h)); });
    const skipped = new Set((st().skipped || []).map(key));
    const todayK = key(now.getTime());
    const sel = ui.calSel || todayK;
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push('<span></span>');
    for (let d = 1; d <= days; d++) {
      const ts = new Date(m.y, m.m, d).getTime();
      const hs = done.get(ts);
      const plan = ts >= todayK && !hs && E.isTrainingDay(st(), ts) && ts >= E.dayStart(S().schedule.startDate || 0);
      cells.push(`<button class="cal-d ${hs ? 'done' : ''} ${plan ? 'plan' : ''} ${skipped.has(ts) ? 'skip' : ''} ${ts === todayK ? 'today' : ''} ${ts === sel ? 'sel' : ''}" data-a="calDay" data-ts="${ts}">${d}</button>`);
    }
    const selHs = done.get(sel) || [];
    const monthName = first.toLocaleDateString(S().lang === 'sl' ? 'sl-SI' : 'en-GB', { month: 'long', year: 'numeric' });
    return `<h1>${t('tab.calendar')}</h1>
      <div class="card">
        <div class="row-between cal-head"><button class="icon-btn circ" data-a="calMove" data-d="-1">${ICON.left}</button><b>${monthName}</b><button class="icon-btn circ" data-a="calMove" data-d="1">${ICON.right}</button></div>
        <div class="cal">${[0, 1, 2, 3, 4, 5, 6].map(i => `<span class="cal-w">${t('wd.' + i)}</span>`).join('')}${cells.join('')}</div>
        <div class="legend"><span><i class="dot done"></i>${t('cal.done')}</span><span><i class="dot plan"></i>${t('cal.planned')}</span><span><i class="dot skip"></i>${t('cal.skipped')}</span></div>
      </div>
      <h3 class="sec-h">${App.fmtDateLong(sel)}</h3>
      ${selHs.length ? selHs.map(h => histCard(h)).join('') : `<div class="card"><p class="muted">${sel >= todayK ? (E.isTrainingDay(st(), sel) ? t(movedIn(sel) ? 'cal.movedHere' : 'cal.scheduled', { d: movedIn(sel) ? App.fmtDate(+movedIn(sel)) : '' }) : (st().moved || {})[sel] ? t('cal.movedAway', { d: App.fmtDate(st().moved[sel]) }) : t('cal.notScheduled')) : t('cal.noEntries')}</p>
        ${sel >= todayK && E.isTrainingDay(st(), sel) ? `<div class="btn-row"><button class="btn secondary" data-a="calMoveOpen">${t('cal.move')}</button>${movedIn(sel) ? `<button class="btn secondary" data-a="calMoveUndo" data-k="${movedIn(sel)}">${t('cal.moveBack')}</button>` : `<button class="btn ghost" data-a="wizStep" data-step="${App.stepIdx('days')}">${t('cal.editSchedule')}</button>`}</div>` : ''}
        ${sel >= todayK && (st().moved || {})[sel] ? `<button class="btn secondary" data-a="calMoveUndo" data-k="${sel}">${t('cal.moveBack')}</button>` : ''}</div>`}
      ${E.weekStart(sel) >= E.weekStart(todayK) ? `${(st().weeks || {})[E.weekStart(sel)] ? `<p class="hint">${ICON.edit}<span><b>${t('wkx.adjusted')}</b> ${wkSummary(st().weeks[E.weekStart(sel)])}</span></p>` : ''}
        <button class="btn secondary" data-a="wkAdjust" data-wk="${E.weekStart(sel)}">${t('wkx.adjust')}</button>` : ''}`;
  };

  // ---------- ONE-OFF WEEK CHANGES (days and split for a single week, then back to the regular program) ----------
  const WK_TYPES = ['upperlower', 'fullbody', 'ppl', 'ulppl', 'fullpushpull', 'bodypart'];
  const wkRange = wk => `${App.fmtDate(wk)} – ${App.fmtDate(E.addDays(wk, 6))}`;
  const regularDays = wk => [0, 1, 2, 3, 4, 5, 6].filter(i => E.regularPlanned(st(), E.addDays(wk, i)));
  const wkSummary = ov => `${(ov.days || []).map(i => t('wd.' + i)).join(', ')}${ov.routineType ? ' · ' + t('rt.' + ov.routineType) : ''}`;
  function wkCard() {
    const cur = E.weekStart(Date.now());
    const list = [cur, E.addDays(cur, 7)].concat(Object.keys(st().weeks || {}).map(Number).filter(k => k > E.addDays(cur, 7)).sort((a, b) => a - b));
    return `<div class="card"><h3 class="card-title">${t('wkx.title')}</h3><p class="hint">${t('wkx.intro')}</p><div class="list">
      ${list.map(wk => { const ov = (st().weeks || {})[wk]; return `<button class="list-row ${ov ? 'on' : ''}" data-a="wkAdjust" data-wk="${wk}"><span><b>${wk === cur ? t('wkx.this') : wk === E.addDays(cur, 7) ? t('wkx.next') : t('wkx.week')} · ${wkRange(wk)}</b><small>${ov ? wkSummary(ov) : t('wkx.regular')}</small></span>${ICON.edit}</button>`; }).join('')}</div></div>`;
  }
  A.wkAdjust = d => {
    const wk = +d.wk; const ov = (st().weeks || {})[wk];
    ui.wk = { wk, days: (ov && ov.days ? ov.days : regularDays(wk)).slice(), type: (ov && ov.routineType) || '' };
    App.openSheet(wkSheet);
  };
  function wkSheet() {
    const w = ui.wk; const s = S();
    const rec = E.recommendedType(s, w.days.length);
    const usual = t('rt.' + (s.routineType === 'recommended' ? E.recommendedType(s) : s.routineType));
    const row = (v, label, sub) => `<button class="list-row ${w.type === v ? 'on' : ''}" data-a="wkType" data-v="${v}"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span><i class="rdot"></i></button>`;
    return `<div class="sheet-head"><h2>${t('wkx.sheet')}</h2><button class="icon-btn circ" data-a="closeSheet">${ICON.x}</button></div>
      <p class="muted small-p">${t('wkx.hint', { d: wkRange(w.wk) })}</p>
      <label>${t('wkx.days')} (${w.days.length})</label>
      <div class="daypick">${[0, 1, 2, 3, 4, 5, 6].map(i => `<button class="${w.days.includes(i) ? 'on' : ''}" data-a="wkDay" data-i="${i}">${t('wd.' + i)}</button>`).join('')}</div>
      <label class="mt">${t('wkx.split')}</label>
      <div class="list">${row('', t('wkx.usual'), usual)}${WK_TYPES.filter(v => E.routineValid(v, s)).map(v => row(v, t('rt.' + v), v === rec ? t('wkx.rec', { n: w.days.length }) : '')).join('')}</div>
      <button class="btn primary" data-a="wkSave">${t('save')}</button>
      ${(st().weeks || {})[w.wk] ? `<button class="btn secondary" data-a="wkReset">${t('wkx.reset')}</button>` : ''}`;
  }
  A.wkDay = d => { const w = ui.wk; const i = +d.i; const k = w.days.indexOf(i); if (k >= 0) w.days.splice(k, 1); else w.days.push(i); App.refreshSheet(); };
  A.wkType = d => { ui.wk.type = d.v || ''; App.refreshSheet(); };
  function wkApply(fn) {
    const weeks = st().weeks = st().weeks || {};
    fn(weeks);
    const old = E.addDays(E.weekStart(Date.now()), -56);
    Object.keys(weeks).forEach(k => { if (+k < old) delete weeks[k]; });
    st().nextAt = null; st().draft = null; st().todayMin = null;
    App.save(); App.closeSheet(); App.render();
  }
  A.wkSave = () => {
    const w = ui.wk;
    if (!w.days.length) { App.notice(t('notice'), t('days.needOne')); return; }
    const days = w.days.slice().sort((a, b) => a - b);
    wkApply(weeks => {
      const prev = weeks[w.wk];
      if (!w.type && JSON.stringify(days) === JSON.stringify(regularDays(w.wk))) delete weeks[w.wk];      // nothing differs from the regular program
      else weeks[w.wk] = { days, routineType: w.type || null, rot: prev && prev.routineType === (w.type || null) ? prev.rot || 0 : 0 };
    });
  };
  A.wkReset = () => wkApply(weeks => { delete weeks[ui.wk.wk]; });
  /** the originally planned day whose workout was moved onto `day`, if any */
  const movedIn = day => Object.keys(st().moved || {}).find(k => st().moved[k] === day);
  A.calMoveOpen = () => {
    const sel = ui.calSel || E.dayStart(Date.now());
    const today = E.dayStart(Date.now());
    const trained = new Set(st().history.map(h => E.dayStart(h.date)));
    const opts = [];
    for (let i = 0; i < 15 && opts.length < 10; i++) { const d = E.addDays(today, i); if (d !== sel && !E.isTrainingDay(st(), d) && !trained.has(d)) opts.push(d); }
    App.openSheet(() => `<h2>${t('cal.moveT')}</h2><p class="muted small-p">${t('cal.moveHint', { d: App.fmtDateLong(sel) })}</p>
      <div class="list">${opts.map(d => `<button class="list-row" data-a="calMoveTo" data-to="${d}"><span><b>${App.fmtDateLong(d)}</b></span>${ICON.right}</button>`).join('')}</div>
      <button class="btn secondary" data-a="closeSheet">${t('cancel')}</button>`);
  };
  A.calMoveTo = d => {
    const sel = ui.calSel || E.dayStart(Date.now()); const to = +d.to;
    const mv = st().moved = st().moved || {};
    const src = movedIn(sel) || sel;                 // moving an already moved workout keeps its original day as the key
    if (+src === to) delete mv[src]; else mv[src] = to;
    Object.keys(mv).forEach(k => { if (Math.max(+k, mv[k]) < E.addDays(Date.now(), -7)) delete mv[k]; });
    st().nextAt = null; st().draft = null; ui.calSel = to;
    App.save(); App.closeSheet(); App.render();
  };
  A.calMoveUndo = d => { const mv = st().moved || {}; const back = +d.k; delete mv[d.k]; st().nextAt = null; st().draft = null; ui.calSel = back; App.save(); App.render(); };
  A.calMove = d => { const m = ui.calM; const dt = new Date(m.y, m.m + (+d.d), 1); ui.calM = { y: dt.getFullYear(), m: dt.getMonth() }; App.render(); };
  A.calDay = d => { ui.calSel = +d.ts; App.keepScroll(App.render); };
  function histCard(h) {
    const min = Math.round((h.end - h.date - (h.paused || 0)) / 60000);
    const nSets = h.items.reduce((a, i) => a + i.sets.length, 0);
    const vol = h.items.reduce((a, i) => a + i.sets.reduce((b, x) => b + E.load(EX[i.exId] || { bw: 0 }, x.w, S().bodyweight) * x.reps, 0), 0);
    return `<div class="card">
      <div class="row-between"><div><b class="title-md">${esc(h.wname || '')}</b><div class="muted small">${App.fmtTime(h.date)} – ${App.fmtTime(h.end)} · ${min} min · ${esc(h.envName || '')}${h.deload ? ' · ' + t('home.deloading') : ''}</div></div><button class="icon-btn" data-a="delHist" data-id="${h.id}">${ICON.trash}</button></div>
      <div class="grid3 mini mt"><div><div class="big">${nSets}</div><small class="muted">${t('st.sets')}</small></div><div><div class="big">${App.fmtNum(Math.round(App.wVal(vol) / 100) / 10)}<small>t</small></div><small class="muted">${t('st.tonnage')}</small></div><div><div class="big">${h.difficulty ?? '—'}</div><small class="muted">${t('st.difficulty')}</small></div></div>
      ${(h.prs || []).length ? `<p class="acc small"><b>${t('home.prs')}:</b> ${h.prs.map(p => esc(App.exName(p.exId))).join(', ')}</p>` : ''}
      ${h.items.map(it => `<div class="hist-ex"><b>${esc(App.exName(it.exId))}</b>${it.variant ? ` <small class="muted">(${esc(it.variant)})</small>` : ''}${it.ss ? ` <small class="acc">${t('superset')}</small>` : ''}<div class="muted">${it.sets.map(x => `${App.fmtW(x.w, EX[it.exId])}×${x.repsR != null ? x.repsL + '/' + x.repsR : x.reps} @${x.rir}${x.drops ? ` (+${x.drops.length} ${t('drops')})` : ''}`).join(' · ')}</div>${it.note ? `<div class="exnote">${ICON.note} ${esc(it.note)}</div>` : ''}</div>`).join('')}
    </div>`;
  }
  App.histCard = histCard;
  A.delHist = async d => { if (await App.confirmDlg(t('delete'), t('st.deleteQ'), t('delete'), 'danger')) { st().history = st().history.filter(h => h.id !== d.id); st().draft = null; App.save(); App.render(); } };

  // ---------- STATS ----------
  const RANGES = ['1w', '1m', '3m', '6m', '1y', 'all'];
  function rangeBounds(r) {
    const to = Date.now();
    const from = { '1w': to - 7 * DAY, '1m': to - 30 * DAY, '3m': to - 91 * DAY, '6m': to - 182 * DAY, '1y': to - 365 * DAY, all: st().createdAt - DAY }[r] || 0;
    return [from, to];
  }
  function buckets(from, to, monthly) {
    const out = [];
    if (monthly) { const d = new Date(from); d.setDate(1); d.setHours(0, 0, 0, 0); while (d.getTime() <= to) { const s0 = d.getTime(); d.setMonth(d.getMonth() + 1); out.push({ from: s0, to: d.getTime() - 1, lbl: new Date(s0).toLocaleDateString(S().lang === 'sl' ? 'sl-SI' : 'en-GB', { month: 'short' }) }); } }
    else { let s0 = weekStart(from); while (s0 <= to) { out.push({ from: s0, to: E.addDays(s0, 7) - 1, lbl: new Date(s0).toLocaleDateString(S().lang === 'sl' ? 'sl-SI' : 'en-GB', { day: 'numeric', month: 'numeric' }) }); s0 = E.addDays(s0, 7); } }
    return out;
  }
  V.stats = () => {
    const s = S();
    const r = ui.statsRange || '1m';
    const [from, to] = rangeBounds(r);
    const hs = st().history.filter(h => inRange(h, from, to));
    const monthly = r === '6m' || r === '1y' || r === 'all';
    const bk = buckets(from, to, monthly);
    const perBucket = f => bk.map(b => ({ lbl: b.lbl, v: f(st().history.filter(h => inRange(h, b.from, b.to)), b) }));
    const weeks = Math.max(1, (to - from) / (7 * DAY));
    const planned = s.schedule.daysPerWeek;
    const consistency = perBucket((list, b) => Math.round(100 * Math.min(1, list.length / (monthly ? planned * 4.33 : planned))));
    const completed = perBucket(list => list.length);
    const prs = perBucket(list => list.reduce((a, h) => a + (h.prs || []).length, 0));
    const diff = perBucket(list => list.filter(h => h.difficulty != null).length ? Math.round(10 * list.filter(h => h.difficulty != null).reduce((a, h) => a + h.difficulty, 0) / list.filter(h => h.difficulty != null).length) / 10 : null);
    const vol = {}; MUSCLES.forEach(m => vol[m] = 0);
    hs.forEach(h => h.items.forEach(it => { const ex = EX[it.exId]; if (!ex) return; vol[ex.m] += it.sets.length; (ex.sec || []).forEach(m => { if (vol[m] != null) vol[m] += it.sets.length * 0.5; }); }));
    const perWeek = {}; MUSCLES.forEach(m => perWeek[m] = Math.round(vol[m] / weeks * 10) / 10);
    const exIds = [...new Set(st().history.flatMap(h => h.items.map(i => i.exId)))].filter(id => EX[id]);
    if (!ui.statsEx || !exIds.includes(ui.statsEx)) ui.statsEx = exIds[0] || null;
    let prog = `<p class="muted">${t('st.noData')}</p>`;
    if (ui.statsEx) {
      const ex = EX[ui.statsEx];
      const pts = st().history.filter(h => inRange(h, from, to)).map(h => { const it = h.items.find(i => i.exId === ui.statsEx && i.sets.length); return it ? { x: h.date, y: App.wVal(E.bestNormE1(ex, it.sets, s.bodyweight) - (ex.bw ? ex.bw * s.bodyweight : 0), App.unitsFor(ex)) } : null; }).filter(Boolean);
      prog = `<select class="inp" data-ch="statsEx">${exIds.map(id => `<option value="${id}" ${id === ui.statsEx ? 'selected' : ''}>${esc(App.exName(id))}</option>`).join('')}</select>
        <p class="hint">${t('st.e1Hint')}</p>${pts.length ? lineChart(pts, App.unitLbl(App.unitsFor(ex))) : `<p class="muted">${t('st.noRange')}</p>`}`;
    }
    const bwPts = st().bwLog.filter(b => b.date >= from && b.date <= to).map(b => ({ x: b.date, y: App.wVal(b.kg) }));
    const score = E.performanceScore(st(), from, to);
    const trained = new Set(s.musclesToTrain || DEFAULT_TRAIN);
    return `<h1>${t('tab.stats')}</h1>
      <div class="seg scroll">${RANGES.map(x => `<button class="${r === x ? 'on' : ''}" data-a="statsRange" data-r="${x}">${t('range.' + x)}</button>`).join('')}</div>
      <div class="card ring-card"><div><h3 class="card-title">${t('st.score')}</h3><p class="muted small">${t('st.scoreText', { r: t('rangeL.' + r) })}</p></div><div class="score">${score}</div></div>
      <div class="grid3"><div class="card stat"><label>${t('st.sessions')}</label><div class="big">${hs.length}</div></div><div class="card stat"><label>${t('st.sets')}</label><div class="big">${hs.reduce((a, h) => a + h.items.reduce((b, i) => b + i.sets.length, 0), 0)}</div></div><div class="card stat"><label>${t('home.prs')}</label><div class="big">${hs.reduce((a, h) => a + (h.prs || []).length, 0)}</div></div></div>
      <div class="card"><h3 class="card-title">${t('st.completed')}</h3><p class="hint">${t(monthly ? 'st.completedM' : 'st.completedW')}</p>${barChart(completed)}</div>
      <div class="card"><h3 class="card-title">${t('st.consistency')}</h3><p class="hint">${t('st.consistencyText')}</p>${barChart(consistency, '%')}</div>
      <div class="card"><h3 class="card-title">${t('st.prsChart')}</h3><p class="hint">${t(monthly ? 'st.prsM' : 'st.prsW')}</p>${barChart(prs)}</div>
      <div class="card"><h3 class="card-title">${t('st.volume')}</h3><p class="hint">${t('st.volumeText', { r: t('rangeL.' + r) })}</p>${volumeBars(perWeek, trained)}</div>
      <div class="card"><h3 class="card-title">${t('st.progress')}</h3>${prog}</div>
      <div class="card"><div class="row-between"><h3 class="card-title">${t('st.bw')}</h3><button class="btn ghost inline" data-a="editBW">${t('st.addBW')}</button></div><p class="hint">${t('st.bwText', { r: t('rangeL.' + r) })}</p>${bwPts.length ? lineChart(bwPts, App.unitW()) : `<p class="muted">${t('st.noBW')}</p>`}</div>
      ${measuresCard(from, to)}
      <div class="card"><h3 class="card-title">${t('st.difficulty')}</h3><p class="hint">${t('st.difficultyText', { r: t('rangeL.' + r) })}</p>${diff.some(d => d.v != null) ? barChart(diff.map(d => ({ lbl: d.lbl, v: d.v || 0 })), '', 10) : `<p class="muted">${t('st.noData')}</p>`}</div>
      <div class="card"><h3 class="card-title">${t('st.injuries')}</h3><p class="hint">${t('st.injuriesText')}</p><div class="big">${s.injuries.length}</div><small class="muted">${s.injuries.map(i => t('loc.' + i.loc)).join(', ') || t('inj.none')}</small></div>
      <div class="card"><h3 class="card-title">${t('st.history')}</h3>${hs.length ? hs.slice().reverse().slice(0, 30).map(h => `<button class="hist-row" data-a="histOpen" data-id="${h.id}"><span><b>${esc(h.wname || '')}</b><small>${App.fmtDate(h.date)} · ${Math.round((h.end - h.date) / 60000)} min · ${h.items.reduce((a, i) => a + i.sets.length, 0)} ${t('st.sets')}</small></span>${ICON.right}</button>`).join('') : `<p class="muted">${t('st.noData')}</p>`}</div>`;
  };
  A.statsRange = d => { ui.statsRange = d.r; App.keepScroll(App.render); };
  A.statsEx = (d, el) => { ui.statsEx = el.value; App.keepScroll(App.render); };
  A.histOpen = d => { const h = st().history.find(x => x.id === d.id); if (!h) return; App.openSheet(() => `<div class="sheet-head"><h2>${App.fmtDate(h.date)}</h2><button class="icon-btn circ" data-a="closeSheet">${ICON.x}</button></div>${histCard(h)}`); };

  // ---------- body measurements ----------
  const MEASURES = ['arm', 'chest', 'waist', 'hips', 'thigh', 'calf'];
  const inch = () => S().lengthUnits === 'in';
  const lenVal = cm => Math.round((inch() ? cm / 2.54 : cm) * 10) / 10;
  function measuresCard(from, to) {
    const log = st().measures || [];
    const key = MEASURES.includes(ui.measure) ? ui.measure : 'arm';
    const latest = k => { for (let i = log.length - 1; i >= 0; i--) if (log[i][k] != null) return log[i]; return null; };
    const first = k => log.find(x => x[k] != null);
    const pts = log.filter(x => x[key] != null && x.date >= from && x.date <= to).map(x => ({ x: x.date, y: lenVal(x[key]) }));
    const u = inch() ? 'in' : 'cm';
    return `<div class="card"><div class="row-between"><h3 class="card-title">${t('ms.title')}</h3><button class="btn ghost inline" data-a="measureOpen">${t('st.addBW')}</button></div><p class="hint">${t('ms.text')}</p>
      ${log.length ? `<div class="ms-grid">${MEASURES.map(k => { const l = latest(k), f = first(k); const diff = l && f && l !== f ? lenVal(l[k]) - lenVal(f[k]) : null;
        return `<button class="ms-cell ${k === key ? 'on' : ''}" data-a="measurePick" data-k="${k}"><label>${t('ms.' + k)}</label><b>${l ? App.fmtNum(lenVal(l[k])) : '—'}<small> ${l ? u : ''}</small></b>${diff != null ? `<small class="${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}">${diff > 0 ? '+' : ''}${App.fmtNum(Math.round(diff * 10) / 10)}</small>` : '<small>&nbsp;</small>'}</button>`; }).join('')}</div>
        ${pts.length > 1 ? lineChart(pts, u) : `<p class="muted small">${t('ms.oneMore')}</p>`}` : `<p class="muted">${t('ms.none')}</p>`}</div>`;
  }
  A.measurePick = d => { ui.measure = d.k; App.keepScroll(App.render); };
  A.measureOpen = () => {
    const log = st().measures || []; const last = log[log.length - 1] || {};
    const u = inch() ? 'in' : 'cm';
    App.openSheet(() => `<h2>${t('ms.title')}</h2><p class="muted small-p">${t('ms.hint')}</p>
      <div class="ms-form">${MEASURES.map(k => `<label>${t('ms.' + k)} (${u})<input class="inp" type="number" inputmode="decimal" step="0.1" min="0" data-ms="${k}" placeholder="${last[k] != null ? App.fmtNum(lenVal(last[k])) : ''}"></label>`).join('')}</div>
      <button class="btn primary" data-a="measureSave">${t('save')}</button><button class="btn secondary" data-a="closeSheet">${t('cancel')}</button>`);
  };
  A.measureSave = () => {
    const entry = { date: Date.now() };
    document.querySelectorAll('#sheet [data-ms]').forEach(el => { const v = Number(String(el.value).replace(',', '.')); if (v > 0 && v < 400) entry[el.dataset.ms] = Math.round((inch() ? v * 2.54 : v) * 10) / 10; });
    if (Object.keys(entry).length < 2) { App.closeSheet(); return; }
    st().measures = (st().measures || []).concat(entry);
    App.save(); App.closeSheet(); App.keepScroll(App.render);
  };

  function volumeBars(vol, trained) {
    const max = 24;
    return `<div class="vbars">${MUSCLES.filter(m => trained.has(m) || vol[m] > 0).map(m => { const v = vol[m]; const cls = v < 10 ? 'low' : v > 20 ? 'high' : 'ok';
      return `<div class="volrow"><span class="vlbl">${App.mName(m)}</span><div class="vtrack"><div class="vband" style="left:${10 / max * 100}%;width:${10 / max * 100}%"></div><div class="vfill ${cls}" style="width:${Math.min(100, v / max * 100)}%"></div></div><span class="vval">${App.fmtNum(Math.round(v * 10) / 10)}</span></div>`; }).join('')}</div>
      <p class="hint">${t('st.volumeHint')}</p>`;
  }
  function barChart(data, unit = '', fixedMax) {
    const W = 320, H = 140, P = 24;
    const max = fixedMax || Math.max(1, ...data.map(d => d.v || 0));
    const n = data.length; const bw = Math.max(4, (W - P - 8) / n - 4);
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">
      ${(max <= 1 ? [0, 1] : [0, 0.5, 1]).map(f => `<line x1="${P}" x2="${W - 4}" y1="${10 + (1 - f) * (H - 40)}" y2="${10 + (1 - f) * (H - 40)}" class="grid"/><text x="2" y="${14 + (1 - f) * (H - 40)}" class="axis">${Math.round(max * f)}${unit}</text>`).join('')}
      ${data.map((d, i) => { const x = P + 4 + i * ((W - P - 8) / n); const h = (d.v || 0) / max * (H - 40); return `<rect x="${x}" y="${H - 30 - h}" width="${bw}" height="${h}" rx="3" class="bar"/><text x="${x + bw / 2}" y="${H - 34 - h}" text-anchor="middle" class="axis val">${d.v ?? ''}</text>${n <= 14 || i % Math.ceil(n / 8) === 0 ? `<text x="${x + bw / 2}" y="${H - 14}" text-anchor="middle" class="axis">${d.lbl}</text>` : ''}`; }).join('')}
    </svg>`;
  }
  function lineChart(pts, unit) {
    if (!pts.length) return '';
    const W = 320, H = 150, Pd = 30;
    const ys = pts.map(p => p.y);
    let lo = Math.min(...ys), hi = Math.max(...ys);
    if (hi - lo < 1) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
    const x0 = pts[0].x, x1 = pts[pts.length - 1].x;
    const X = x => pts.length === 1 ? W / 2 : Pd + (x - x0) / (x1 - x0 || 1) * (W - Pd - 10);
    const Y = y => 10 + (1 - (y - lo) / (hi - lo)) * (H - 30);
    const line = pts.map(p => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
    const last = pts[pts.length - 1], first = pts[0]; const diff = last.y - first.y;
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">
      <line x1="${Pd}" x2="${W - 10}" y1="${Y(hi - pad)}" y2="${Y(hi - pad)}" class="grid"/><line x1="${Pd}" x2="${W - 10}" y1="${Y(lo + pad)}" y2="${Y(lo + pad)}" class="grid"/>
      <text x="2" y="${Y(hi - pad) + 4}" class="axis">${Math.round(hi - pad)}</text><text x="2" y="${Y(lo + pad) + 4}" class="axis">${Math.round(lo + pad)}</text>
      <polyline points="${line}" class="pl"/>${pts.map(p => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3.5" class="pt"><title>${App.fmtDate(p.x)}: ${App.fmtNum(Math.round(p.y * 10) / 10)} ${unit}</title></circle>`).join('')}
      <text x="${W - 10}" y="${H - 4}" text-anchor="end" class="axis">${pts.length > 1 ? (diff >= 0 ? '+' : '') + App.fmtNum(Math.round(diff * 10) / 10) + ' ' + unit : App.fmtNum(Math.round(last.y * 10) / 10) + ' ' + unit}</text></svg>`;
  }
})();
