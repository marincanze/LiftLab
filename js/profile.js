'use strict';
/* ============================================================
 * Profile setup: welcome, step-by-step questionnaire, routine & custom workouts,
 * specialisation, schedule, injuries (body map list), profile summary.
 * ============================================================ */
(function () {
  const { A, P, ui, t, esc, ICON, q, hint } = App;
  const st = () => App.st;
  const S = () => App.st.settings;
  const Pr = () => App.st.settings.profile;
  const dirty = () => { App.st.draft = null; Engine.clearCache(); };

  const STEPS = [
    { id: 'personal', cat: 'personal', sub: 'personal' },
    { id: 'experience', cat: 'training', sub: 'experience' },
    { id: 'competitive', cat: 'training', sub: 'competitive' },
    { id: 'muscles', cat: 'training', sub: 'bodyParts' },
    { id: 'prio', cat: 'training', sub: 'prio' },
    { id: 'rir', cat: 'training', sub: 'rir' },
    { id: 'mode', cat: 'training', sub: 'mode' },
    { id: 'consistency', cat: 'training', sub: 'consistency' },
    { id: 'repRanges', cat: 'training', sub: 'repRanges' },
    { id: 'days', cat: 'training', sub: 'days' },
    { id: 'routine', cat: 'training', sub: 'routine' },
    { id: 'program', cat: 'recent', sub: 'program' },
    { id: 'recent', cat: 'recent', sub: 'recent' },
    { id: 'exercise', cat: 'recent', sub: 'exercise' },
    { id: 'diet', cat: 'lifestyle', sub: 'diet' },
    { id: 'sleep', cat: 'lifestyle', sub: 'sleep' },
    { id: 'health', cat: 'health', sub: 'physical' },
    { id: 'injuries', cat: 'health', sub: 'injuries' },
    { id: 'env', cat: 'envs', sub: null }
  ];
  App.STEPS = STEPS;
  const stepIdx = id => STEPS.findIndex(x => x.id === id);
  App.stepIdx = stepIdx;

  function completeness() {
    const p = Pr(), s = S();
    const q2 = [s.name, s.birthYear, p.program, p.recentDur, p.freq, p.category, p.intensity, p.duration, p.extra,
      p.extra === 'yes' ? p.extraFreq : 0, p.diet, p.sleepHours, p.sleepQuality, p.stress, p.activity, p.peds, p.illness, s.lifter, s.goal];
    const answered = q2.filter(x => x !== null && x !== undefined && x !== '').length + 10;
    return Math.round(100 * answered / (q2.length + 10));
  }
  App.completeness = completeness;

  // ---------- welcome ----------
  P.welcome = () => `<div class="welcome">
      ${App.brand()}
      <h1 class="hello">${t('wel.title')}</h1>
      <p class="lead">${t('wel.text')}</p>
      <div class="card"><label>${t('set.lang')}</label>${App.seg('settings.lang', [['sl', 'Slovenščina'], ['en', 'English']])}</div>
      <ul class="wel-list">${['wel.p1', 'wel.p2', 'wel.p3', 'wel.p4'].map(k => `<li>${ICON.check}<span>${t(k)}</span></li>`).join('')}</ul>
      <p class="hint">${t('wel.offline')}</p>
      <button class="btn primary big-btn" data-a="startWizard">${t('wel.start')}</button>
    </div>`;
  P.welcome.noNav = true;
  A.startWizard = () => { ui.pages = [{ name: 'wizard', args: { step: 0, onboarding: true } }]; App.render(); window.scrollTo({ top: 0 }); };

  // ---------- wizard shell ----------
  P.wizard = args => {
    const i = args.step;
    const step = STEPS[i];
    const pct = completeness();
    const crumb = `${t('cat.' + step.cat)}${step.sub ? ` / <b>${t('sub.' + step.sub)}</b>` : ''}`;
    return `<div class="wiz">
      <div class="wiz-top">${App.brand()}<span class="muted small">${i + 1}/${STEPS.length}</span></div>
      <div class="wiz-meta"><span>${pct}%</span><span>${crumb}</span></div>
      <div class="wiz-bar"><span style="width:${pct}%"></span></div>
      <div class="wiz-body">${STEP[step.id]()}</div>
    </div>
    <div class="wiz-foot">
      <button class="sq-btn" data-a="wizPrev" ${i === 0 ? 'disabled' : ''} aria-label="${t('back')}">${ICON.left}</button>
      <button class="btn primary" data-a="wizExit">${args.onboarding ? (i === STEPS.length - 1 ? t('finish') : t('saveExit')) : t('saveExit')}</button>
      <button class="sq-btn" data-a="wizNext" ${i === STEPS.length - 1 ? 'disabled' : ''} aria-label="${t('next')}">${ICON.right}</button>
    </div>`;
  };
  P.wizard.noNav = true;
  const wizArgs = () => ui.pages[ui.pages.length - 1].args;
  A.wizPrev = () => { const a = wizArgs(); if (a.step > 0) { a.step--; App.render(); window.scrollTo({ top: 0 }); } };
  A.wizNext = () => {
    const a = wizArgs();
    if (!validate(a.step)) return;
    if (a.step < STEPS.length - 1) { a.step++; S().setupStep = Math.max(S().setupStep || 0, a.step); App.save(); App.render(); window.scrollTo({ top: 0 }); }
  };
  A.wizExit = async () => {
    const a = wizArgs();
    if (!validate(a.step)) return;
    dirty();
    if (a.onboarding || !S().onboarded) {
      if (a.step < STEPS.length - 1 && !(await App.confirmDlg(t('wiz.earlyT'), t('wiz.early'), t('wiz.earlyBtn')))) return;
      S().onboarded = true;
      if (!st().bwLog.length) st().bwLog.push({ date: Date.now(), kg: S().bodyweight });
      if (!S().schedule.startDate) S().schedule.startDate = Date.now();
      App.requestNotifications();
      App.save();
      ui.pages = []; ui.tab = 'home';
      App.render(); window.scrollTo({ top: 0 });
      await App.notice(t('wiz.doneT'), t('wiz.done'));
    } else { App.save(); App.back(); }
  };
  function validate(i) {
    const id = STEPS[i].id;
    const s = S();
    if (id === 'routine' && !Engine.routineValid(s.routineType, s)) { App.notice(t('notice'), t('rt.invalid')); return false; }
    if (id === 'muscles' && !(s.musclesToTrain || []).length) { App.notice(t('notice'), t('mg.needOne')); return false; }
    if (id === 'repRanges' && !(s.repRanges || []).length) { App.notice(t('notice'), t('rr.needOne')); return false; }
    if (id === 'days' && s.schedule.specificDays && !(s.schedule.days || []).length) { App.notice(t('notice'), t('days.needOne')); return false; }
    if (id === 'env' && !st().envs.length) { App.notice(t('notice'), t('env.needOne')); return false; }
    return true;
  }

  // ---------- steps ----------
  const STEP = {};
  STEP.personal = () => {
    const s = S();
    const yrs = []; const y0 = new Date().getFullYear(); for (let y = y0 - 14; y >= y0 - 90; y--) yrs.push(y);
    return `${q(t('p.name'))}<input class="inp" value="${esc(s.name)}" data-in="setName" placeholder="${t('p.namePh')}" maxlength="40">
      ${q(t('p.birth'))}<select class="inp" data-ch="setBirth"><option value="">—</option>${yrs.map(y => `<option value="${y}" ${s.birthYear === y ? 'selected' : ''}>${y}</option>`).join('')}</select>
      ${hint(t('p.age'))}
      ${q(t('p.sex'))}${App.seg('settings.sex', [['m', t('sex.m')], ['f', t('sex.f')]])}
      ${hint(t('p.sexHint'))}
      ${q(t('p.units'))}<div class="grid2">${App.seg('settings.units', [['kg', 'kg'], ['lb', 'lbs']])}${App.seg('settings.lengthUnits', [['cm', 'cm'], ['in', 'in']])}</div>
      ${q(t('p.weight') + ` (${App.unitW()})`)}<input class="inp" type="number" inputmode="decimal" step="0.1" value="${App.fmtBW(s.bodyweight)}" data-ch="setBW">
      ${q(t('p.height') + ` (${s.lengthUnits})`)}<input class="inp" type="number" inputmode="decimal" step="0.5" value="${s.lengthUnits === 'in' ? Math.round(s.height / 2.54 * 10) / 10 : Math.round(s.height)}" data-ch="setHeight">
      ${q(t('p.bodyType'))}${App.seg('settings.bodyType', [['lean', t('bt.lean')], ['average', t('bt.average')], ['muscular', t('bt.muscular')]])}
      ${hint(t('p.bodyTypeHint'))}
      ${q(t('set.lang'))}${App.seg('settings.lang', [['sl', 'Slovenščina'], ['en', 'English']])}`;
  };
  A.setName = (d, el) => { S().name = el.value; App.save(); };
  A.setBirth = (d, el) => { S().birthYear = el.value ? Number(el.value) : null; App.save(); };
  A.setBW = (d, el) => { const v = Number(String(el.value).replace(',', '.')); if (v > 20) { S().bodyweight = App.kgFrom(v); st().bwLog.push({ date: Date.now(), kg: S().bodyweight }); dirty(); App.save(); } };
  A.setHeight = (d, el) => { const v = Number(String(el.value).replace(',', '.')); if (v > 50) { S().height = S().lengthUnits === 'in' ? v * 2.54 : v; App.save(); } };

  STEP.experience = () => {
    const s = S();
    return `${q(t('x.years'), 'experience')}
      ${App.radios('settings.experience', [['0-6m', '0 – 6 ' + t('months')], ['6-12m', '6 – 12 ' + t('months')], ['1-3y', '1 – 3 ' + t('years')], ['3-6y', '3 – 6 ' + t('years')], ['6-12y', '6 – 12 ' + t('years')], ['12y+', '12+ ' + t('years')]])}
      ${q(t('x.goal'))}${App.radios('settings.goal', [['muscle', t('goal.muscle')], ['strength', t('goal.strength')], ['blend', t('goal.blend')]])}
      ${q(t('x.deload'), 'deload')}
      <div class="stepper"><button data-a="deloadStep" data-d="-1">${ICON.minus}</button><div class="val">${s.lastDeloadWeeks == null ? t('x.deloadUnknown') : t('x.weeksAgo', { n: s.lastDeloadWeeks })}</div><button data-a="deloadStep" data-d="1">${ICON.plus}</button></div>
      ${q(t('x.firstDeload'))}${App.yesNo('settings.firstWeekDeload')}`;
  };
  A.deloadStep = d => { const s = S(); const cur = s.lastDeloadWeeks == null ? -1 : s.lastDeloadWeeks; const n = Math.max(-1, Math.min(52, cur + (+d.d))); s.lastDeloadWeeks = n < 0 ? null : n; App.save(); App.keepScroll(App.render); };

  STEP.competitive = () => {
    const s = S();
    const comp = s.lifter !== 'hobbyist';
    const lift = k => `<div><label>${t('x.' + k)} (${App.unitW()})</label><input class="inp" type="number" inputmode="decimal" value="${s.e1rm[k] ? App.fmtNum(App.wVal(s.e1rm[k])) : ''}" data-ch="setE1" data-k="${k}" placeholder="—"></div>`;
    return `${q(t('x.lifter'))}${App.radios('settings.lifter', [['hobbyist', t('lifter.hobbyist'), t('lifter.hobbyist.d')], ['bodybuilder', t('lifter.bodybuilder'), t('lifter.bodybuilder.d')], ['powerlifter', t('lifter.powerlifter'), t('lifter.powerlifter.d')]])}
      ${comp ? `${q(t('x.lifts'), 'e1rm')}<div class="grid3">${lift('squat')}${lift('bench')}${lift('deadlift')}</div>
      ${s.lifter === 'powerlifter' ? `${q(t('x.wilks'), 'wilks')}<input class="inp" type="number" inputmode="decimal" value="${s.wilks || ''}" data-ch="setWilks" placeholder="—">` : ''}` : hint(t('x.liftsHint'))}`;
  };
  A.setE1 = (d, el) => { const v = Number(String(el.value).replace(',', '.')); S().e1rm[d.k] = v > 0 ? App.kgFrom(v) : null; dirty(); App.save(); };
  A.setWilks = (d, el) => { const v = Number(el.value); S().wilks = v > 0 ? v : null; App.save(); };

  STEP.routine = () => {
    const s = S();
    const rec = Engine.recommendedType(s);
    const sc = s.schedule;
    const days = sc.cyclic ? Math.round(7 * (sc.cycleOn || 1) / ((sc.cycleOn || 1) + (sc.cycleOff || 0)) * 10) / 10 : (sc.specificDays && sc.days && sc.days.length ? sc.days.length : sc.daysPerWeek);
    const why = (s.prio || []).length ? 'prio' : days <= 3 ? 'd3' : days <= 4 ? 'd4' : days <= 5 ? 'd5' : 'd6';
    const recCard = `<div class="card note-card rec-card"><small class="muted">${t('rt.recFor')}</small><b class="title-md">${t('rt.' + rec)}</b>
        <div class="chips">${App.chip('', t('goal.' + s.goal))}${App.chip('', t('rt.recDays', { n: App.fmtNum(days) }))}${App.chip('', sc.unlimitedTime ? t('rt.recNoLimit') : t('rt.recTime', { n: sc.timePerDay }))}${(s.prio || []).slice(0, 2).map(m => App.chip('', App.mName(m))).join('')}</div>
        <p>${t('rt.why.' + why, { n: App.fmtNum(days) })}${!sc.unlimitedTime && sc.timePerDay <= 40 ? ' ' + t('rt.why.short') : ''}</p>
        ${s.routineType === 'recommended' ? `<small class="ok-txt">${t('rt.recOn')}</small>` : `<button class="btn primary inline" data-a="pickRoutine" data-v="recommended">${t('rt.recUse')}</button>`}</div>`;
    return `${q(t('rt.q'))}${hint(t('rt.hint'))}${recCard}
      ${ROUTINE_ORDER.map(v => { const ok = Engine.routineValid(v, s); return `<button class="radio-row ${s.routineType === v ? 'on' : ''}" data-a="pickRoutine" data-v="${v}" ${ok ? '' : 'disabled'}><span><b>${t('rt.' + v)}${v === 'recommended' ? ` → ${t('rt.' + rec)}` : ''}</b><small>${t('rt.' + v + '.d')}</small></span><i class="rdot"></i></button>`; }).join('')}
      ${s.routineType === 'custom' ? customRoutineHtml() : ''}
      ${Engine.unusedMuscles(st()).length ? `<p class="warn-txt">${ICON.warn}<span>${t('rt.unused')} ${Engine.unusedMuscles(st()).map(App.mName).join(', ')}.</span></p>` : ''}
      ${Engine.routine(st()).some(w => !w.muscles.length) ? `<p class="warn-txt">${ICON.warn}<span>${t('rt.emptyDays')}</span></p>` : ''}`;
  };
  function customRoutineHtml() {
    const s = S();
    return `<h3 class="q">${t('sp.create')}</h3>${hint(t('sp.hint'))}
      <div class="wk-list">${s.workouts.map((w, i) => `<div class="wk-card"><div><small>${t('sp.groups', { n: w.muscles.length })}</small><div class="wk-name">${esc(App.workoutName(w))}</div></div>
        <button class="icon-btn circ" data-a="editWorkout" data-i="${i}" aria-label="edit">${ICON.edit}</button><button class="icon-btn circ danger" data-a="delWorkout" data-i="${i}" aria-label="delete">${ICON.x}</button></div>`).join('')}</div>
      <button class="btn secondary" data-a="editWorkout" data-i="-1">+ ${t('sp.add')}</button>`;
  }
  A.pickRoutine = async d => {
    const s = S();
    if (d.v === 'custom' && !s.workouts.length) {
      const type = s.routineType === 'recommended' ? Engine.recommendedType(s) : (s.routineType === 'custom' ? 'upperlower' : s.routineType);
      s.workouts = Engine.templateWorkouts(type, s).map(w => ({ id: 'w' + Engine.uid(), preset: w.preset, name: App.workoutName(w), muscles: w.muscles.slice(), v: w.v }));
    }
    s.routineType = d.v;
    st().rotation = 0; dirty(); App.save(); App.keepScroll(App.render);
  };
  A.delWorkout = async d => {
    const s = S();
    if (!(await App.confirmDlg(t('delete'), t('sp.delQ', { n: esc(App.workoutName(s.workouts[+d.i])) }), t('delete'), 'danger'))) return;
    s.workouts.splice(+d.i, 1); dirty(); App.save(); App.render();
  };
  A.editWorkout = d => {
    const i = +d.i;
    const w = i >= 0 ? S().workouts[i] : null;
    ui.wedit = { i, name: w ? App.workoutName(w) : '', muscles: new Set(w ? w.muscles : []) };
    App.go('workoutEdit');
  };
  P.workoutEdit = () => {
    const e = ui.wedit;
    const train = new Set(S().musclesToTrain || DEFAULT_TRAIN);
    return `<div class="wedit">
      <label class="req">${t('we.name')} *</label><input class="inp" id="wName" value="${esc(e.name)}" data-in="weName" maxlength="40">
      <h3 class="q">${t('we.presets')}</h3>
      <div class="preset-grid">${PRESET_ORDER.map(k => `<button class="btn secondary pbtn ${k === 'fullBody' ? 'wide' : ''}" data-a="wePreset" data-k="${k}">${t('preset.' + k)}</button>`).join('')}</div>
      ${MUSCLE_GROUPS.map(([g, ms]) => `<h3 class="q">${t('mg.' + g)}</h3>${ms.map(m => `<button class="check-row ${e.muscles.has(m) ? 'on' : ''} ${train.has(m) ? '' : 'dim'}" data-a="weToggle" data-m="${m}"><span>${App.mName(m)}${train.has(m) ? '' : ` <small>(${t('we.notTrained')})</small>`}</span><i class="cbox">${e.muscles.has(m) ? ICON.check : ''}</i></button>`).join('')}`).join('')}
    </div>
    <div class="wiz-foot col"><button class="btn primary" data-a="weConfirm">${t('confirm')}</button><button class="btn secondary" data-a="back">${t('cancel')}</button></div>`;
  };
  P.workoutEdit.noNav = true;
  A.weName = (d, el) => { ui.wedit.name = el.value; };
  A.wePreset = d => { ui.wedit.muscles = new Set(PRESETS[d.k]); if (!ui.wedit.name) ui.wedit.name = t('preset.' + d.k); App.keepScroll(App.render); };
  A.weToggle = d => { const ms = ui.wedit.muscles; if (ms.has(d.m)) ms.delete(d.m); else ms.add(d.m); App.keepScroll(App.render); };
  A.weConfirm = () => {
    const e = ui.wedit;
    const name = (e.name || '').trim();
    if (!name) { App.notice(t('notice'), t('we.needName')); return; }
    if (!e.muscles.size) { App.notice(t('notice'), t('we.needMuscle')); return; }
    const s = S();
    const muscles = MUSCLES.filter(m => e.muscles.has(m));
    if (e.i >= 0) Object.assign(s.workouts[e.i], { name, muscles });
    else s.workouts.push({ id: 'w' + Engine.uid(), preset: 'fullBody', name, muscles, v: 0 });
    s.routineType = 'custom';
    dirty(); App.save(); App.back();
  };

  STEP.muscles = () => {
    const s = S();
    const sel = new Set(s.musclesToTrain || []);
    return `${q(t('mg.q'))}${hint(t('mg.hint'))}
      <div class="row-between"><button class="btn ghost inline" data-a="mgRestore">${t('mg.restore')}</button><button class="btn ghost inline" data-a="mgClear">${t('clearAll')}</button></div>
      ${MUSCLE_GROUPS.map(([g, ms]) => `<h3 class="q">${t('mg.' + g)}</h3>${ms.map(m => `<button class="check-row ${sel.has(m) ? 'on' : ''}" data-a="mgToggle" data-m="${m}"><span>${App.mName(m)}</span><i class="cbox">${sel.has(m) ? ICON.check : ''}</i></button>`).join('')}`).join('')}
      <p class="muted small-p mt">${t('mg.selected', { n: sel.size })}</p>`;
  };
  A.mgToggle = d => {
    const s = S(); const arr = s.musclesToTrain = s.musclesToTrain || [];
    const i = arr.indexOf(d.m); if (i >= 0) arr.splice(i, 1); else arr.push(d.m);
    s.prio = (s.prio || []).filter(m => arr.includes(m));
    dirty(); App.save(); App.keepScroll(App.render);
  };
  A.mgRestore = async () => { if (await App.confirmDlg(t('mg.restore'), t('mg.restoreQ'), t('confirm'))) { S().musclesToTrain = DEFAULT_TRAIN.slice(); dirty(); App.save(); App.render(); } };
  A.mgClear = async () => { if (await App.confirmDlg(t('clearAll'), t('mg.clearQ'), t('clearAll'), 'danger')) { S().musclesToTrain = []; S().prio = []; dirty(); App.save(); App.render(); } };

  // ---------- prioritisation ----------
  STEP.prio = () => prioHtml();
  function prioHtml() {
    const s = S();
    const pr = s.prio || [];
    const train = s.musclesToTrain || DEFAULT_TRAIN;
    const rest = train.filter(m => !pr.includes(m));
    return `${q(t('pr.q'), 'prio')}<p class="muted small-p">${t('pr.intro')}</p>
      <h3 class="q">${t('pr.spec')}</h3>
      <div class="dlist" id="prioList">${pr.length ? pr.map((m, i) => `<div class="drow"><span class="rank">${i + 1}</span><span class="dname acc">${App.mName(m)}</span>
          <button class="icon-btn sm" data-a="prioDel" data-m="${m}" aria-label="remove">${ICON.x}</button><span class="handle" data-handle="${i}">${ICON.grip}</span></div>`).join('') : `<p class="muted">${t('pr.none')}</p>`}</div>
      <h3 class="q">${t('pr.notSpec')}</h3>
      <div class="dlist">${rest.map(m => `<button class="drow add" data-a="prioAdd" data-m="${m}" ${pr.length >= 5 ? 'disabled' : ''}><span class="dname">${App.mName(m)}</span>${ICON.plus}</button>`).join('')}</div>`;
  }
  App.prioHtml = prioHtml;
  A.prioAdd = d => { (S().prio = S().prio || []).push(d.m); dirty(); App.save(); App.keepScroll(App.render); };
  A.prioDel = d => { S().prio = S().prio.filter(m => m !== d.m); dirty(); App.save(); App.keepScroll(App.render); };
  let drag = null;
  document.addEventListener('pointerdown', e => {
    const h = e.target.closest('[data-handle]');
    if (!h) return;
    const row = h.closest('.drow');
    const rows = [...h.closest('.dlist').querySelectorAll('.drow')];
    drag = { from: +h.dataset.handle, row, rows, startY: e.clientY, h: row.getBoundingClientRect().height + 6, to: +h.dataset.handle };
    row.classList.add('dragging');
    try { h.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    e.preventDefault();
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    drag.row.style.transform = `translateY(${dy}px)`;
    drag.to = Math.max(0, Math.min(drag.rows.length - 1, drag.from + Math.round(dy / drag.h)));
    drag.rows.forEach((r, i) => {
      if (r === drag.row) return;
      let off = 0;
      if (drag.from < drag.to && i > drag.from && i <= drag.to) off = -drag.h;
      if (drag.from > drag.to && i < drag.from && i >= drag.to) off = drag.h;
      r.style.transform = off ? `translateY(${off}px)` : '';
    });
  });
  document.addEventListener('pointerup', () => {
    if (!drag) return;
    const { from, to } = drag; drag = null;
    if (from !== to) { const pr = S().prio; const [m] = pr.splice(from, 1); pr.splice(to, 0, m); dirty(); App.save(); }
    App.keepScroll(App.render);
  });

  STEP.rir = () => `${q(t('rir.q'), 'rir')}<div class="seg">${[[false, t('no')], [true, t('yes')]].map(([v, l]) => `<button class="${S().rirTraining === v ? 'on' : ''}" data-a="setRir" data-v="${v}">${l}</button>`).join('')}</div>
      ${hint(S().rirTraining ? t('rir.yesHint') : t('rir.noHint'))}
      ${q(t('wu.q'))}${App.yesNo('settings.warmups')}${hint(S().warmups ? t('wu.yesHint') : t('wu.noHint'))}`;
  A.setRir = async d => {
    const v = d.v === 'true';
    if (!v && S().rirTraining) {
      const ok = await App.dialog({ title: t('warn.title'), body: `<p>${t('warn.failure')}</p>`, cls: 'warn-dlg', buttons: [{ label: t('understand'), v: 'ok', cls: 'primary' }, { label: t('cancel'), v: 'no' }] });
      if (ok !== 'ok') return;
    }
    S().rirTraining = v; dirty(); App.save(); App.keepScroll(App.render);
  };

  STEP.mode = () => `${q(t('mode.q'))}${App.radios('settings.mode', [['regular', t('mode.regular'), t('mode.regular.d')], ['easy', t('mode.easy'), t('mode.easy.d')]])}`;
  STEP.consistency = () => `${q(t('con.q'))}${App.seg('settings.consistency', [1, 2, 3, 4, 5].map(v => [v, v]))}<p class="center muted seg-label">${t('con.' + (S().consistency || 3))}</p>${hint(t('con.hint'))}`;
  STEP.repRanges = () => {
    const sel = new Set(S().repRanges || []);
    return `${q(t('rr.q'), 'repRange')}${hint(t('rr.hint'))}
      ${REP_RANGES.map(r => { const k = r.join('-'); return `<button class="check-row ${sel.has(k) ? 'on' : ''}" data-a="rrToggle" data-k="${k}"><span>${r[0]} – ${r[1]} ${t('reps')}<small>${t('rr.' + k)}</small></span><i class="cbox">${sel.has(k) ? ICON.check : ''}</i></button>`; }).join('')}`;
  };
  A.rrToggle = d => { const s = S(); const arr = s.repRanges = s.repRanges || []; const i = arr.indexOf(d.k); if (i >= 0) arr.splice(i, 1); else arr.push(d.k); dirty(); App.save(); App.keepScroll(App.render); };

  // ---------- days & time ----------
  STEP.days = () => daysHtml();
  function daysHtml() {
    const sc = S().schedule;
    const dn = [0, 1, 2, 3, 4, 5, 6].map(i => t('wd.' + i));
    const pad = n => String(n).padStart(2, '0');
    const start = sc.startDate ? new Date(sc.startDate) : null;
    const startVal = start ? `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}` : '';
    return `${q(t('days.cyclic'))}${App.yesNo('settings.schedule.cyclic')}${hint(t('days.cyclicHint'))}
      ${sc.cyclic ? `<div class="grid2"><div>${q(t('days.on'))}${App.seg('settings.schedule.cycleOn', [1, 2, 3, 4, 5].map(v => [v, v]))}</div><div>${q(t('days.off'))}${App.seg('settings.schedule.cycleOff', [1, 2, 3].map(v => [v, v]))}</div></div>`
        : `${q(t('days.perWeek'))}${App.seg('settings.schedule.daysPerWeek', [1, 2, 3, 4, 5, 6, 7].map(d => [d, d]))}
      ${hint(t('days.recHint', { s: t('rt.' + Engine.recommendedType(S())) }))}
      ${q(t('days.specific'))}${App.yesNo('settings.schedule.specificDays')}
      ${sc.specificDays ? `<div class="daypick">${dn.map((n, i) => `<button class="${(sc.days || []).includes(i) ? 'on' : ''}" data-a="dayToggle" data-i="${i}">${n}</button>`).join('')}</div>` : ''}`}
      ${q(t('days.time'))}${App.seg('settings.schedule.unlimitedTime', [[false, t('days.limited')], [true, t('days.unlimited')]])}
      ${sc.unlimitedTime ? '' : (sc.specificDays && !sc.cyclic ? `<div class="list mt">${(sc.days || []).slice().sort().map(i => `<div class="list-row"><span><b>${dn[i]}</b></span><div class="stepper sm"><button data-a="dayTime" data-i="${i}" data-d="-5">${ICON.minus}</button><div class="val">${sc.perDayTime[i] ?? sc.timePerDay} min</div><button data-a="dayTime" data-i="${i}" data-d="5">${ICON.plus}</button></div></div>`).join('')}</div>`
        : `<div class="range-val"><b id="minLbl">${sc.timePerDay} min</b></div><input class="range" type="range" min="15" max="180" step="5" value="${sc.timePerDay}" data-in="minLive" data-ch="minSet">`)}
      ${hint(t('days.timeHint'))}
      ${q(t('days.start'))}<input class="inp" type="date" value="${startVal}" data-ch="startDate">
      ${q(t('days.hour'))}<input class="inp" type="time" value="${pad(sc.hour ?? 17)}:${pad(sc.minute ?? 0)}" data-ch="startHour">`;
  }
  App.daysHtml = daysHtml;
  A.dayToggle = d => { const sc = S().schedule; sc.days = sc.days || []; const i = +d.i; const k = sc.days.indexOf(i); if (k >= 0) sc.days.splice(k, 1); else sc.days.push(i); sc.daysPerWeek = Math.max(1, sc.days.length); dirty(); App.save(); App.keepScroll(App.render); };
  A.dayTime = d => { const sc = S().schedule; const cur = sc.perDayTime[d.i] ?? sc.timePerDay; sc.perDayTime[d.i] = Math.max(15, Math.min(180, cur + (+d.d))); dirty(); App.save(); App.keepScroll(App.render); };
  A.minLive = (d, el) => { const l = document.getElementById('minLbl'); if (l) l.textContent = el.value + ' min'; };
  A.minSet = (d, el) => { S().schedule.timePerDay = Number(el.value); dirty(); App.save(); };
  A.startDate = (d, el) => { S().schedule.startDate = el.value ? new Date(el.value + 'T12:00').getTime() : null; st().nextAt = null; App.save(); };
  A.startHour = (d, el) => { const [h, m] = (el.value || '17:00').split(':').map(Number); S().schedule.hour = h; S().schedule.minute = m; st().nextAt = null; App.save(); };

  STEP.program = () => {
    const p = Pr();
    const qtxt = (ui.progQ || '').toLowerCase();
    const lang = S().lang;
    const list = PROGRAMS.filter(x => !qtxt || x[1].toLowerCase().includes(qtxt) || x[2].toLowerCase().includes(qtxt));
    return `${q(t('prog.q'))}
      <div class="search"><span>${ICON.search}</span><input class="inp" id="progSearch" placeholder="${t('prog.search')}" value="${esc(ui.progQ || '')}" data-in="progQ"></div>
      ${hint(t('prog.hint'))}
      <div class="radios">${list.map(x => `<button class="radio-row ${p.program === x[0] ? 'on' : ''}" data-a="setv" data-p="settings.profile.program" data-v="${x[0]}"><span><b>${lang === 'sl' ? x[2] : x[1]}</b></span><i class="rdot"></i></button>`).join('')}</div>
      <button class="btn ${p.program === 'none' ? 'primary' : 'secondary'}" data-a="setv" data-p="settings.profile.program" data-v="none">${t('prog.none')}</button>`;
  };
  A.progQ = (d, el) => { ui.progQ = el.value; App.keepScroll(App.render); const i = document.getElementById('progSearch'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } };

  STEP.recent = () => `${q(t('rec.dur'))}${hint(t('rec.durHint'))}${App.radios('settings.profile.recentDur', ['none', 'lt1', '1-2', '2-4', '4-6', '6-12', 'gt12'].map(v => [v, t('rec.dur.' + v)]))}
      ${q(t('rec.freq'))}${App.radios('settings.profile.freq', ['1', '2-3', '4-5', '6-7'].map(v => [v, t('freq.' + v)]))}
      ${q(t('rec.cat'))}${App.radios('settings.profile.category', ['upper', 'lower', 'balanced', 'full'].map(v => [v, t('cat2.' + v)]))}
      ${q(t('rec.int'))}${App.seg('settings.profile.intensity', [1, 2, 3, 4, 5].map(v => [v, v]))}<p class="center muted seg-label">${Pr().intensity ? t('int.' + Pr().intensity) : '—'}</p>
      ${q(t('rec.durS'))}${App.radios('settings.profile.duration', ['lt20', '20-40', '40-60', '60-120', 'gt120'].map(v => [v, t('dur.' + v)]))}`;

  STEP.exercise = () => {
    const p = Pr();
    return `${q(t('ex.q'))}${App.seg('settings.profile.extra', [['no', t('no')], ['yes', t('yes')]])}${hint(t('ex.hint'))}
      ${p.extra === 'yes' ? `${q(t('ex.type'))}<input class="inp" value="${esc(p.extraType || '')}" data-in="extraType" placeholder="${t('ex.typePh')}" maxlength="40">
        ${q(t('ex.often'))}${App.radios('settings.profile.extraFreq', [0, 1, 2, 3].map(v => [v, t('exf.' + v)]))}
        ${q(t('ex.intensity'))}${App.seg('settings.profile.extraIntensity', [1, 2, 3, 4, 5].map(v => [v, v]))}<p class="center muted seg-label">${p.extraIntensity ? t('int.' + p.extraIntensity) : '—'}</p>
        ${q(t('ex.duration'))}${App.radios('settings.profile.extraDuration', ['lt20', '20-40', '40-60', '60-120', 'gt120'].map(v => [v, t('dur.' + v)]))}` : ''}`;
  };
  A.extraType = (d, el) => { Pr().extraType = el.value; App.save(); };

  STEP.diet = () => `${q(t('diet.q'))}${App.radios('settings.profile.diet', ['gain', 'maintain', 'lose'].map(v => [v, t('diet.' + v)]))}`;
  STEP.sleep = () => {
    const p = Pr();
    const faces = ['😫', '😟', '😐', '🙂', '😄'];
    return `${q(t('sleep.hours'))}${App.radios('settings.profile.sleepHours', ['lt6', '6-8', 'gt8'].map(v => [v, t('sleepH.' + v)]))}
      ${q(t('sleep.q'))}<div class="seg faces">${faces.map((f, i) => `<button class="${p.sleepQuality === i ? 'on' : ''}" data-a="setv" data-p="settings.profile.sleepQuality" data-v="${i}">${f}</button>`).join('')}</div>
      <p class="center muted seg-label">${p.sleepQuality == null ? '—' : t('sleepL.' + p.sleepQuality)}</p>${hint(t('sleep.hint'))}
      ${q(t('stress.q'))}<div class="seg faces">${faces.map((f, i) => `<button class="${p.stress === (4 - i) ? 'on' : ''}" data-a="setv" data-p="settings.profile.stress" data-v="${4 - i}">${f}</button>`).join('')}</div>
      <p class="center muted seg-label">${p.stress == null ? '—' : t('stressL.' + p.stress)}</p>${hint(t('stress.hint'))}`;
  };
  STEP.health = () => {
    const p = Pr();
    return `${q(t('hl.act'))}${App.seg('settings.profile.activity', [1, 2, 3, 4, 5].map(v => [v, v]))}<p class="center muted seg-label">${p.activity ? t('act.' + p.activity) : '—'}</p>${hint(t('hl.actHint'))}
      ${q(t('hl.peds'))}${App.seg('settings.profile.peds', [['yes', t('yes')], ['no', t('no')], ['na', t('wontSay')]])}${hint(t('hl.pedsHint'))}
      ${q(t('hl.ill'))}${App.seg('settings.profile.illness', [['no', t('no')], ['yes', t('yes')]])}${hint(t('hl.illHint'))}`;
  };
  STEP.injuries = () => `${q(t('inj.q'))}${hint(t('inj.hint'))}${App.injuryListHtml()}`;
  STEP.env = () => `${q(t('env.q'))}${hint(t('env.hint'))}${App.envListHtml()}`;

  // ---------- profile summary ----------
  P.profile = () => {
    const s = S(), p = Pr();
    const pct = completeness();
    const v = x => (x === null || x === undefined || x === '' ? `<span class="muted">${t('notSet')}</span>` : x);
    const row = (label, val, step) => `<button class="sum-row" data-a="wizStep" data-step="${step}"><span><b>${label}</b><small>${val}</small></span>${ICON.right}</button>`;
    const prog = PROGRAMS.find(x => x[0] === p.program);
    const sc = s.schedule;
    const lang = s.lang;
    return `${App.pageHead(t('prof.title'))}
      <div class="wiz-bar big"><span style="width:${pct}%"></span><em>${t('prof.complete', { p: pct })}</em></div>
      <h3 class="sec-h">${t('cat.personal')}</h3>
      ${row(t('p.name'), v(esc(s.name)), stepIdx('personal'))}
      ${row(t('prof.ageSex'), `${s.birthYear ? new Date().getFullYear() - s.birthYear : '—'} · ${t('sex.' + s.sex)}`, stepIdx('personal'))}
      ${row(t('prof.wh'), `${App.fmtBW(s.bodyweight)} ${App.unitW()} · ${App.fmtH(s.height)}`, stepIdx('personal'))}
      <h3 class="sec-h">${t('cat.training')}</h3>
      ${row(t('sub.experience'), t('exp.' + s.experience) + ' · ' + t('goal.' + s.goal), stepIdx('experience'))}
      ${row(t('sub.competitive'), t('lifter.' + s.lifter), stepIdx('competitive'))}
      ${row(t('sub.routine'), t('rt.' + s.routineType) + ' · ' + Engine.routine(st()).length + ' ' + t('prof.workouts'), stepIdx('routine'))}
      ${row(t('sub.bodyParts'), (s.musclesToTrain || []).length + ' ' + t('prof.groups'), stepIdx('muscles'))}
      ${row(t('sub.prio'), s.prio.length ? s.prio.map(App.mName).join(', ') : t('pr.none'), stepIdx('prio'))}
      ${row(t('sub.rir'), (s.rirTraining ? t('yes') : t('no')) + ' · ' + t('prof.warmups') + ': ' + (s.warmups ? t('yes') : t('no')), stepIdx('rir'))}
      ${row(t('sub.mode'), t('mode.' + s.mode), stepIdx('mode'))}
      ${row(t('sub.consistency'), t('con.' + (s.consistency || 3)), stepIdx('consistency'))}
      ${row(t('sub.repRanges'), (s.repRanges || []).join(', '), stepIdx('repRanges'))}
      ${row(t('sub.days'), sc.cyclic ? t('days.cycle', { on: sc.cycleOn, off: sc.cycleOff }) : `${sc.daysPerWeek} ${t('prof.perWeek')} · ${sc.unlimitedTime ? t('days.unlimited') : sc.timePerDay + ' min'}`, stepIdx('days'))}
      <h3 class="sec-h">${t('cat.recent')}</h3>
      ${row(t('sub.program'), v(p.program === 'none' ? t('prog.noneShort') : prog && (lang === 'sl' ? prog[2] : prog[1])), stepIdx('program'))}
      ${row(t('prof.recentDur'), v(p.recentDur && t('rec.dur.' + p.recentDur)), stepIdx('recent'))}
      ${row(t('prof.freq'), v(p.freq && t('freq.' + p.freq)), stepIdx('recent'))}
      ${row(t('prof.category'), v(p.category && t('cat2.' + p.category)), stepIdx('recent'))}
      ${row(t('prof.intensity'), v(p.intensity && t('int.' + p.intensity)), stepIdx('recent'))}
      ${row(t('prof.duration'), v(p.duration && t('dur.' + p.duration)), stepIdx('recent'))}
      ${row(t('prof.extra'), v(p.extra && (p.extra === 'yes' ? t('yes') + (p.extraType ? ' · ' + esc(p.extraType) : '') : t('no'))), stepIdx('exercise'))}
      <h3 class="sec-h">${t('cat.lifestyle')}</h3>
      ${row(t('sub.diet'), v(p.diet && t('diet.' + p.diet)), stepIdx('diet'))}
      ${row(t('prof.sleep'), v(p.sleepHours && t('sleepH.' + p.sleepHours)) + (p.sleepQuality != null ? ' · ' + t('sleepL.' + p.sleepQuality) : ''), stepIdx('sleep'))}
      ${row(t('prof.stress'), v(p.stress != null && t('stressL.' + p.stress)), stepIdx('sleep'))}
      <h3 class="sec-h">${t('cat.health')}</h3>
      ${row(t('prof.activity'), v(p.activity && t('act.' + p.activity)), stepIdx('health'))}
      ${row(t('prof.peds'), v(p.peds && ({ yes: t('yes'), no: t('no'), na: t('wontSay') }[p.peds])), stepIdx('health'))}
      ${row(t('prof.illness'), v(p.illness && (p.illness === 'yes' ? t('yes') : t('no'))), stepIdx('health'))}
      ${row(t('sub.injuries'), s.injuries.length ? s.injuries.map(i => t('loc.' + i.loc)).join(', ') : t('inj.none'), stepIdx('injuries'))}
      <h3 class="sec-h">${t('cat.envs')}</h3>
      ${row(t('cat.envs'), st().envs.map(e => esc(e.name)).join(', '), stepIdx('env'))}
      <button class="btn secondary mt" data-a="randomProfile">${t('prof.random')}</button>`;
  };
  A.wizStep = d => App.go('wizard', { step: +d.step });
  A.randomProfile = async () => {
    if (!(await App.confirmDlg(t('prof.random'), t('prof.randomQ'), t('confirm')))) return;
    const p = Pr(); const pick = a => a[Math.floor(Math.random() * a.length)];
    Object.assign(p, { program: pick(PROGRAMS)[0], recentDur: pick(['lt1', '1-2', '2-4', '4-6', '6-12', 'gt12']), freq: pick(['2-3', '4-5']), category: pick(['upper', 'lower', 'balanced', 'full']), intensity: pick([2, 3, 4]), duration: pick(['20-40', '40-60', '60-120']),
      extra: pick(['yes', 'no']), extraFreq: pick([0, 1, 2]), extraIntensity: pick([2, 3]), extraDuration: '20-40', extraType: 'running', diet: pick(['gain', 'maintain', 'lose']), sleepHours: pick(['lt6', '6-8', 'gt8']), sleepQuality: pick([1, 2, 3, 4]), stress: pick([0, 1, 2]), activity: pick([2, 3, 4]), peds: 'no', illness: 'no' });
    dirty(); App.save(); App.render();
  };
})();
