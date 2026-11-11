'use strict';
/* ============================================================
 * Train tab: workout planner (preview) and the active workout:
 *   prepare → warm-up → perform set → log set → rest → next set … with supersets, drop sets, bands, assisted exercises,
 *   quick tips, plate calculator, notes, history, full-screen mode, pause/resume, extend, skip, re-plan, feedback & records.
 * ============================================================ */
(function () {
  const { A, V, P, ui, t, esc, ICON, hint } = App;
  const st = () => App.st;
  const S = () => App.st.settings;
  const E = Engine;
  const chip = App.chip;

  App.registerCustom = () => { (st().customEx || []).forEach(e => { if (!EX[e.id]) { EXERCISES.push(e); EX[e.id] = e; } }); };

  // ================= DRAFT =================
  const todayMin = () => st().todayMin || E.budgetFor(st(), E.nextWorkoutAt(st(), Date.now()));
  function draftSig(w, minutes, deload) {
    const s = S();
    return JSON.stringify([w.id, w.muscles, minutes, deload, s.envId, s.experience, s.units, s.prio, s.prefs.restMode, s.prefs.supersetStrategy, s.prefs.dropsetStrategy, s.warmups, s.rirTraining, s.mode,
      s.consistency, s.repRanges, s.goal, s.bodyweight, s.sex, s.injuries, s.profile, st().history.length, st().disliked, st().customEx.length, E.env(st()).rev]);
  }
  function getDraft(force) {
    const w = E.currentWorkout(st());
    if (!w) return { items: [], wid: null, minutes: todayMin() };
    const minutes = todayMin();
    const deload = E.deloadState(st(), Date.now()).deloading;
    const sig = draftSig(w, minutes, deload);
    if (force || !st().draft || st().draft.sig !== sig) {
      st().draft = { sig, wid: w.id, minutes, deload, items: E.buildPlan(st(), w, minutes, { deload }) };
      App.save();
    }
    return st().draft;
  }
  App.getDraft = getDraft;

  function nextInHtml(now) {
    const at = E.nextWorkoutAt(st(), now);
    if (!at || at <= now) return `<span class="n">${t('now')}</span>`;
    let m = Math.round((at - now) / 60000);
    const d = Math.floor(m / 1440); m -= d * 1440;
    const h = Math.floor(m / 60); m -= h * 60;
    return d ? `<span class="n">${d}</span><small>d</small><span class="n">${h}</span><small>h</small>` : `<span class="n">${h}</span><small>h</small><span class="n">${m}</span><small>min</small>`;
  }
  App.nextInHtml = nextInHtml;

  // ================= CARD PARTS =================
  function exChips(it, ex, i) {
    const out = [chip(t('c.sets'), it.sets + (ex.uni ? ' ' + t('perSide') : '')), chip('RIR', App.rirStr(it.rir)), chip(t('c.reps'), it.reps.join(' – '))];
    if (!(ex.load === 'bw' && it.weight <= 0 && !ex.assist)) out.push(`<button class="chip wchip" data-a="weightTap" data-i="${i}"><b>${t('c.weight')}</b> ${App.fmtW(it.weight, ex)}</button>`);
    out.push(chip('', ICON.target + ' ' + App.mName(ex.m), 'muscle'));
    out.push(chip('', ICON.clock + ' ' + Math.max(1, Math.round((it.estSec || 0) / 60)) + ' min', 'muscle'));
    if (it.ss) out.push(chip('', ICON.link + ' ' + t('superset'), 'ss'));
    if (it.drops) out.push(chip('', ICON.layers + ' ' + t('dropsN', { n: it.drops }), 'ss'));
    if (it.variant) out.push(`<button class="chip var" data-a="pickVariant" data-i="${i}">${ICON.building} ${esc(it.variant)}</button>`);
    return out.join('');
  }
  function videoArea(i, ex, canSwap) {
    const note = noteFor(ex.id);
    const tools = `${canSwap ? `<button class="round sm" data-a="swap" data-i="${i}" aria-label="${t('swap')}">${ICON.swap}</button>` : ''}<button class="round sm" data-a="info" data-id="${ex.id}" aria-label="${t('info')}">${ICON.info}</button>`;
    const noteHtml = note ? `<p class="exnote">${ICON.note} ${esc(note)}</p>` : '';
    if (S().prefs.hideVideos) return `<div class="vbar"><button class="round sm" data-a="toggleVideo" aria-label="${t('video.show')}">${ICON.eye}</button><span class="vlbl">${t('video.hidden')}</span>${tools}</div>${noteHtml}`;
    return `<div class="vbox"><button class="round sm tl" data-a="toggleVideo" aria-label="${t('video.hide')}">${ICON.eyeOff}</button><div class="vtools">${tools}</div>
        <a class="vplay" href="${App.ytUrl(ex.id)}" target="_blank" rel="noopener"><span class="play">${ICON.play}</span><span>${t('video.watch')}</span></a></div>${noteHtml}`;
  }
  function cardHead(it, i, ex, opts) {
    const fav = st().favorites.includes(ex.id);
    return `<div class="ex-head" data-a="expand" data-i="${i}">
        <span class="num ${opts.done ? 'ok' : ''}">${opts.done ? ICON.check : i + 1}</span>
        <h3>${esc(App.exName(ex.id))}${ex.custom ? ` <small class="muted">(${t('cust.short')})</small>` : ''}</h3>
        ${fav ? `<span class="heart">${ICON.heart}</span>` : ''}
        <button class="icon-btn" data-a="exMenu" data-i="${i}" aria-label="menu">${ICON.dots}</button>
      </div>`;
  }
  A.toggleVideo = () => { S().prefs.hideVideos = !S().prefs.hideVideos; App.save(); App.keepScroll(App.render); };
  A.expand = d => { const i = +d.i; ui.expanded = ui.expanded === i ? -1 : i; App.keepScroll(App.render); };
  A.weightTap = d => {
    const list = listRef(); const it = list[+d.i]; const ex = EX[it.exId];
    if (!st().active) return;
    ui.log = { i: +d.i, k: -1, w: it.weight, reps: 0, repsR: 0, rir: 0, note: '', backPhase: it.phase, weightOnly: true };
    if (ex.load === 'barbell' || plateMachine(ex)) A.plateCalc();
    else App.notice(t('notice'), t('w.weightTapHint'));
  };

  // ================= PLANNER (TRAIN TAB) =================
  function viewDraft() {
    const s = S();
    const w = E.currentWorkout(st());
    const now = Date.now();
    if (!w) return `<h1>${t('tab.train')}</h1><p class="warn-txt">${ICON.warn}<span>${t('w.noRoutine')}</span></p><button class="btn primary" data-a="wizStep" data-step="${App.stepIdx('routine')}">${t('w.editRoutine')}</button>`;
    const d = getDraft();
    const sec = E.estimate(d.items, s);
    const min = Math.round(sec / 60);
    const env = E.env(st());
    const at = E.nextWorkoutAt(st(), now);
    const early = at - now > 6 * 3600e3;
    const rest = E.restRecommended(st(), now);
    const dl = E.deloadState(st(), now);
    d.items.forEach((it, i) => { it._i = i; });
    return `<div class="row-between"><h1>${t('tab.train')}</h1><button class="icon-btn circ" data-a="replan" aria-label="replan">${ICON.sparkle}</button></div>
      <div class="card stat" data-a="editNext" id="tour-next"><label>${t('w.nextIn')}</label><div class="big hm" data-tick="nextIn">${nextInHtml(now)}</div><small class="muted">${App.fmtDateLong(at)} · ${App.fmtTime(at)}</small><span class="edit">${ICON.edit}</span></div>
      ${dl.deloading ? `<div class="card note-card"><b>${t('w.deloadT')}</b><p>${t('w.deload')}</p></div>` : ''}
      ${rest ? `<div class="card note-card warn"><b>${t('w.restT')}</b><p>${t('w.rest')}</p></div>` : ''}
      <div class="grid2">
        <div class="card stat" data-a="pickWorkout"><label>${t('w.workout')}</label><div class="title-lg">${esc(App.workoutName(w))}</div><span class="edit">${ICON.edit}</span></div>
        <div class="card stat" data-a="editTime" id="tour-time"><label>${t('w.time')}</label><div class="big hm">${App.fmtHM(d.minutes)}</div><span class="edit">${ICON.edit}</span></div>
      </div>
      <div class="card stat" data-a="pickEnv" id="tour-env"><label>${t('w.env')}</label><div class="title-md">${esc(env.name)}</div><span class="edit">${ICON.edit}</span></div>
      <div class="grid2">
        <div class="card stat"><label>${t('w.estDur')}</label><div class="big ${min > d.minutes + 2 ? 'warn' : ''}">${min}<small>min</small></div></div>
        <div class="card stat"><label>${t('w.kcal')}</label><div class="big">${E.kcal(min, s.bodyweight)}<small>kcal</small></div></div>
      </div>
      ${early ? `<p class="hint">${ICON.clock}<span>${t('w.early')}</span></p>` : ''}
      <button class="btn primary big-btn" data-a="startSession" id="tour-start">${t('w.start')}</button>
      ${d.items.some(it => it.calib) ? `<p class="hint calib">${t('w.calib')}</p>` : ''}
      <h3 class="sec-h">${t('w.preview')}</h3>
      ${d.items.length ? d.items.map((it, i) => draftCard(it, i)).join('') : `<p class="center muted">${t('w.empty')}</p>`}
      <p class="center muted">${t('w.notEnough')} <a href="#" data-a="extend" class="link">${t('w.extend')}</a></p>
      <div class="btn-row"><button class="btn secondary" data-a="addExercise">${t('w.add')}</button><button class="btn secondary" data-a="reorder">${t('w.reorder')}</button></div>
      <button class="btn warn" data-a="skipSession">${t('w.skip')}</button>`;
  }
  function draftCard(it, i) {
    const ex = EX[it.exId];
    const open = ui.expanded === i;
    return `<div class="card ex ${open ? 'open' : ''} ${it.ss ? 'ss-' + it.ss : ''}">${cardHead(it, i, ex, {})}<div class="chips">${exChips(it, ex, i)}</div>${open ? videoArea(i, ex, true) : ''}</div>`;
  }
  V.train = () => (st().active ? (ui.focus ? viewFocus() : viewActive()) : viewDraft());

  // ================= ACTIVE SESSION =================
  const elapsedMs = (a, now) => (a.pausedAt ? a.pausedAt : now) - a.start - (a.pausedTotal || 0);
  function remainingWork(a, now) {
    let total = 0;
    a.items.forEach((it, i) => {
      if (it.status === 'done') return;
      const ex = EX[it.exId];
      const left = Math.max(0, it.sets - it.logged.length);
      const work = left * E.setDur(ex) + Math.max(0, left - 1) * it.rest + (it.drops || 0) * 20;
      if (i !== a.cur) { total += E.transition(ex) + (it.wu || 0) * 50 + work; return; }
      if (it.phase === 'prepare') total += (it.wu || 0) * 50 + work;
      else if (it.phase === 'warmup') total += Math.max(0, (a.warmEnd - now) / 1000) + 60 + work;
      else if (it.phase === 'perform') total += Math.max(0, E.setDur(ex) - (now - a.phaseStart) / 1000) + Math.max(0, left - 1) * (E.setDur(ex) + it.rest);
      else if (it.phase === 'log' || it.phase === 'drops') total += 20 + Math.max(0, left - 1) * (E.setDur(ex) + it.rest);
      else if (it.phase === 'rest') total += Math.max(0, (a.restEnd - now) / 1000) + left * E.setDur(ex) + Math.max(0, left - 1) * it.rest;
    });
    return total;
  }
  const predictedEnd = (a, now) => now + remainingWork(a, now) * 1000;
  function nextRest(a, it) {
    const ex = EX[it.exId];
    const now = Date.now();
    const left = a.budgetMin * 60 - elapsedMs(a, now) / 1000;
    const remaining = remainingWork(a, now) + it.rest;
    if (remaining <= left) return it.rest;
    const over = remaining - left;
    const restsLeft = a.items.reduce((acc, x) => acc + (x.status === 'done' ? 0 : Math.max(0, x.sets - x.logged.length)), 0) || 1;
    return Math.round(Math.max(E.minRest(ex), it.rest - over / restsLeft));
  }

  function viewActive() {
    const a = st().active;
    const allDone = a.items.every(it => it.status === 'done');
    a.items.forEach((it, i) => { it._i = i; });
    const now = Date.now();
    return `<div class="pet-row"><div><label>${t('a.endTime')}</label><span class="pill ${predictedEnd(a, now) > a.start + a.budgetMin * 60000 + 60000 ? 'late' : ''}" id="tour-end" data-tick="endAt">${App.fmtTime(predictedEnd(a, now))}</span></div>
        <div class="pet-tools"><button class="icon-btn circ" data-a="pauseToggle" aria-label="pause">${a.pausedAt ? ICON.play : ICON.pause}</button><button class="icon-btn circ" data-a="focusMode" aria-label="fullscreen">${ICON.expand}</button></div></div>
      ${a.pausedAt ? `<div class="card note-card warn"><b>${t('a.paused')}</b><p>${t('a.pausedText')}</p></div>` : ''}
      ${a.items.map((it, i) => activeCard(it, i)).join('')}
      ${allDone ? `<div class="card glow center"><h3 class="card-title">${t('a.allDone')}</h3><button class="btn primary" data-a="finishSession">${t('a.save')}</button></div>` : ''}
      <div class="btn-row"><button class="btn secondary" data-a="addExercise" id="tour-add">${t('w.add')}</button><button class="btn secondary" data-a="extendActive" id="tour-extend">${t('w.extendBtn')}</button></div>
      <button class="btn secondary" data-a="endSession" id="tour-endw">${t('a.end')}</button>
      <button class="btn warn" data-a="cancelSession" id="tour-cancel">${t('a.cancel')}</button>`;
  }
  function viewFocus() {
    const a = st().active;
    const i = a.cur >= 0 ? a.cur : a.items.findIndex(x => x.status !== 'done');
    a.items.forEach((it, k) => { it._i = k; });
    const prev = [...a.items.keys()].filter(k => k < i).pop();
    const next = a.items.findIndex((x, k) => k > i);
    return `<div class="pet-row"><div><label>${t('a.endTime')}</label><span class="pill" data-tick="endAt">${App.fmtTime(predictedEnd(a, Date.now()))}</span></div>
        <div class="pet-tools"><button class="icon-btn circ" data-a="pauseToggle">${a.pausedAt ? ICON.play : ICON.pause}</button><button class="icon-btn circ" data-a="focusMode">${ICON.collapse}</button></div></div>
      <div class="focus-nav"><button class="btn ghost inline" data-a="focusGo" data-i="${prev ?? -1}" ${prev == null ? 'disabled' : ''}>${ICON.left} ${t('a.prevEx')}</button><span class="muted">${i + 1} / ${a.items.length}</span><button class="btn ghost inline" data-a="focusGo" data-i="${next}" ${next < 0 ? 'disabled' : ''}>${t('a.nextEx')} ${ICON.right}</button></div>
      ${i >= 0 ? activeCard(a.items[i], i, true) : ''}
      ${a.items.every(it => it.status === 'done') ? `<div class="card glow center"><h3 class="card-title">${t('a.allDone')}</h3><button class="btn primary" data-a="finishSession">${t('a.save')}</button></div>` : ''}`;
  }
  A.focusMode = () => { ui.focus = !ui.focus; S().prefs.fullscreen = ui.focus; App.save(); App.render(); window.scrollTo(0, 0); };
  A.focusGo = d => { const i = +d.i; if (i < 0) return; const a = st().active; if (a.items[i].status !== 'done' && a.items[i].status !== 'active') setCurrent(i); else if (a.items[i].status === 'done') { ui.expanded = i; a.cur = i; } App.save(); App.render(); };

  function setsTable(it, i, ex) {
    if (!it.logged.length) return '';
    return `<table class="sets"><thead><tr><th>${t('a.set')}</th><th>${t('c.reps')}</th><th>RIR</th><th>${t('c.weight')}</th><th></th></tr></thead><tbody>
      ${it.logged.map((l, k) => `<tr><td>${k + 1}</td><td>${l.repsR != null ? `${l.repsL}/${l.repsR}` : l.reps}</td><td>${l.rir}</td><td>${App.fmtW(l.w, ex)}${l.drops && l.drops.length ? `<small class="muted"> +${l.drops.map(x => `${App.fmtNum(App.wVal(x.w, App.unitsFor(ex)))}×${x.reps}`).join(', ')}</small>` : ''}</td>
        <td><button class="icon-btn sm" data-a="editSet" data-i="${i}" data-k="${k}" aria-label="edit">${ICON.edit}</button></td></tr>`).join('')}</tbody></table>`;
  }
  function activeCard(it, i, focus) {
    const a = st().active;
    const ex = EX[it.exId];
    const cur = i === a.cur && it.status === 'active';
    const done = it.status === 'done';
    const open = focus || cur || ui.expanded === i;
    let body = '';
    if (open) {
      if (!(cur && (it.phase === 'log' || it.phase === 'drops'))) body += videoArea(i, ex, !it.logged.length && !done);
      body += setsTable(it, i, ex);
      if (!cur) {
        if (done) body += `<div class="btn-row"><button class="btn ghost" data-a="reopen" data-i="${i}">${t('a.addSet')}</button>${it.drops ? '' : `<button class="btn ghost" data-a="addDropsNow" data-i="${i}">${t('a.addDrops')}</button>`}</div>`;
        else body += `<button class="btn primary" data-a="startEx" data-i="${i}">${t('a.startEx')}</button>`;
      } else body += phasePanel(it, i, ex);
    }
    return `<div class="card ex ${cur ? 'glow' : ''} ${done ? 'done' : ''} ${it.ss ? 'ss-' + it.ss : ''}" id="ex-${i}">${cardHead(it, i, ex, { done })}<div class="chips">${exChips(it, ex, i)}</div>${body}</div>`;
  }
  function phasePanel(it, i, ex) {
    const s = S();
    const k = it.logged.length;
    const rirT = E.rirTarget(it, k);
    const est = S().prefs.showEstReps;
    const wBlock = `<div><label>${ex.load === 'band' ? t('a.band') : ex.assist ? t('a.assist') : t('c.weight')}</label><div class="big wv" data-a="weightTap" data-i="${i}">${App.fmtW(it.weight, ex)}</div>
            <div class="wbtns"><button data-a="wStep" data-i="${i}" data-d="-1">${ICON.minus}</button><button data-a="wStep" data-i="${i}" data-d="1">${ICON.plus}</button></div></div>`;
    if (it.phase === 'prepare') return `<div class="panel one"><div><label>${t('a.prepare')}</label><div class="timer" data-tick="since"></div></div></div>
        <button class="btn primary" id="tour-startex" data-a="${it.wu && s.warmups ? 'startWarmup' : 'startFirst'}" data-i="${i}">${it.wu && s.warmups ? t('a.startWarmup') : t('a.startFirst')}</button>`;
    if (it.phase === 'warmup') {
      const wu = it.warmups;
      const wtxt = w => (w.band ? t('a.bandLight') : ex.load === 'bw' && w.w <= 0 ? '' : App.fmtW(w.w, ex));
      return `<div class="panel" id="tour-rec">
          <div><label>${t('a.warmup')}</label><div class="timer" data-tick="warm"></div></div>
          <div>${wu.map((w, n) => `<label>${t('a.wuSet' + (n + 1))}</label><div class="big">${w.reps} ${t('reps')}${wtxt(w) ? ` <small>${wtxt(w)}</small>` : ''}</div>`).join('')}</div></div>
        ${hint(wu.length >= 2 && !wu[0].band && !(ex.load === 'bw' && wu[0].w <= 0) ? t('a.wuHint2', { a: App.fmtW(wu[0].w, ex), b: App.fmtW(wu[1].w, ex) }) : wu[0] && wu[0].band ? t('a.wuHintBand') : wu.length >= 2 ? t('a.wuHintBw') : t('a.wuHint1', { a: App.fmtW((wu[0] || {}).w || 0, ex) }))}
        <div class="btn-row"><button class="btn secondary" data-a="finishEx" data-i="${i}">${t('a.finish')}</button><button class="btn primary" data-a="startFirst" data-i="${i}">${t('a.startFirst')}</button></div>`;
    }
    if (it.phase === 'perform') {
      const pred = E.predict(it, ex, s, it.weight);
      return `<div class="panel p3" id="tour-rec">
          <div><label>${t('a.perform')}</label><div class="timer" data-tick="since"></div></div>
          <div><label>RIR</label><div class="big">${rirT}</div></div>${wBlock}
          <div><label>${t('a.set')}</label><div class="big">${k + 1}<small>/${it.sets}</small></div></div>
          <div><label>${t('c.reps')}</label><div class="big">${it.reps.join(' – ')}</div></div>
          ${est ? `<div><label>${t('a.estReps')}</label><div class="big ${pred < it.reps[0] || pred > it.reps[1] ? 'warn' : ''}">${pred}</div></div>` : '<div></div>'}</div>
        <div class="btn-row"><button class="btn secondary" data-a="finishEx" data-i="${i}">${t('a.finish')}</button><button class="btn primary" id="tour-log" data-a="logSet" data-i="${i}">${t('a.logSet')}</button></div>`;
    }
    if (it.phase === 'log') return logForm(it, i, ex);
    if (it.phase === 'drops') return dropsForm(it, i, ex);
    if (it.phase === 'rest') {
      const pred = E.predict(it, ex, s, it.weight);
      const partner = partnerOf(it);
      return `<div class="panel p3" id="tour-rest">
          <div><label data-tick="restLabel">${t('restNow')}</label><div class="timer" data-tick="rest"></div></div>
          <div><label>RIR</label><div class="big">${rirT}</div></div>${wBlock}
          <div><label>${t('a.set')}</label><div class="big">${k + 1}<small>/${it.sets}</small></div></div>
          ${est ? `<div><label>${t('a.estReps')}</label><div class="big ${pred < it.reps[0] || pred > it.reps[1] ? 'warn' : ''}">${pred}</div></div>` : '<div></div>'}
          ${partner ? `<div><label>${t('superset')}</label><div class="muted small">${esc(App.exName(partner.exId))}</div></div>` : '<div></div>'}</div>
        <div class="btn-row"><button class="btn secondary" data-a="finishEx" data-i="${i}">${t('a.finish')}</button><button class="btn primary" data-a="nextSet" data-i="${i}">${t('a.nextSet')}</button></div>`;
    }
    return '';
  }
  function bandChips(ex, cur, act) {
    const en = E.env(st());
    const bands = (en.bands && en.bands.length) ? en.bands : DEFAULT_BANDS.map(b => ({ key: b[0], w: b[1] }));
    return `<div class="chips sel">${bands.map(b => `<button class="chip ${Math.abs(b.w - cur) < 1e-6 ? 'on' : ''}" data-a="${act}" data-w="${b.w}">${t('band.' + b.key)}</button>`).join('')}${ex.assist ? `<button class="chip ${cur <= 0 ? 'on' : ''}" data-a="${act}" data-w="0">${t('a.noAssist')}</button>` : ''}</div>`;
  }
  function logForm(it, i, ex) {
    const L = ui.log;
    const split = ex.uni && !S().prefs.logBothSides;
    const plateable = ex.load === 'barbell' || plateMachine(ex);
    const u = App.unitsFor(ex);
    const stepper = (act, val, unit, extra = '') => `<div class="stepper"><button data-a="${act}" data-d="-1" ${extra}>${ICON.minus}</button><div class="val">${val} <small>${unit}</small></div><button data-a="${act}" data-d="1" ${extra}>${ICON.plus}</button></div>`;
    const bandMode = ex.load === 'band' || (ex.assist && !E.env(st()).equip.includes('assistMachine'));
    return `<div class="logform" id="tour-logform"><h4>${t('a.logTitle')}</h4>
      <label>${split ? t('a.repsL') : t('a.repsDone')}</label>${stepper('logR', L.reps, t('reps'), 'data-s="L"')}
      ${split ? `<label>${t('a.repsR')}</label>${stepper('logR', L.repsR, t('reps'), 'data-s="R"')}` : ''}
      <label>${t('a.rirQ')} <button class="help-btn" data-a="help" data-k="rir">${ICON.help}</button></label>${stepper('logRir', L.rir, 'RIR')}
      ${bandMode ? `<label>${ex.assist ? t('a.whichBandAssist') : t('a.whichBand')}</label>${bandChips(ex, L.w, 'logBand')}`
        : `<label>${ex.assist ? t('a.assist') : ex.load === 'bw' ? t('a.extraWeight') : t('c.weight')}</label>${stepper('logW', App.fmtNum(App.wVal(L.w, u)), App.unitLbl(u))}`}
      ${plateable ? `<button class="btn ghost inline" data-a="plateCalc">${t('pc.btn')}</button>` : ''}
      <label class="mt">${t('a.notes')}</label><textarea class="inp notes" maxlength="2000" data-in="logNote" rows="2" placeholder="${t('a.notePh')}">${esc(L.note || '')}</textarea>
      <div class="btn-row"><button class="btn secondary" data-a="logCancel">${t('cancel')}</button><button class="btn primary" data-a="commitSet">${t('save')}</button></div></div>`;
  }
  function dropsForm(it, i, ex) {
    const D = ui.drops;
    const u = App.unitsFor(ex);
    return `<div class="logform"><h4>${t('a.dropsTitle')}</h4><p class="muted small-p">${t('a.dropsIntro')}</p>
      ${D.list.map((d, k) => `<div class="drop-row"><span><b>${t('a.drop' + (k + 1))}</b><small>${App.fmtW(d.w, ex)}</small></span>
        <div class="stepper sm"><button data-a="dropStep" data-k="${k}" data-d="-1">${ICON.minus}</button><div class="val">${d.reps} ${t('reps')}</div><button data-a="dropStep" data-k="${k}" data-d="1">${ICON.plus}</button></div>
        <button class="icon-btn" data-a="dropDel" data-k="${k}">${ICON.x}</button></div>`).join('')}
      ${D.list.length < 4 ? `<button class="btn ghost inline" data-a="dropAdd">+ ${t('a.addDrop')}</button>` : ''}
      <div class="btn-row"><button class="btn secondary" data-a="dropsSkip">${t('a.skipDrops')}</button><button class="btn primary" data-a="dropsSave">${t('save')}</button></div></div>`;
  }
  function plateMachine(ex) {
    if (ex.load !== 'machine' && ex.load !== 'cable') return null;
    const en = E.env(st());
    const eq = E.primaryEquip(ex, en, E.exPref(st(), ex.id).equip);
    if (!eq) return null;
    const cfg = E.machineCfg(en, eq);
    return cfg.loading === 'plates' ? cfg : null;
  }
  const partnerOf = it => (it.ss ? st().active.items.find(x => x !== it && x.ss === it.ss && x.status !== 'done') : null);
  const noteFor = exId => ((st().notes[E.env(st()).id] || {})[exId] || '');

  // ================= PLANNER ACTIONS =================
  const listRef = () => (st().active ? st().active.items : getDraft().items);
  A.replan = async () => { if (await App.confirmDlg(t('w.replan'), t('w.replanQ'), t('w.replan'))) { getDraft(true); ui.expanded = -1; App.render(); } };
  A.editNext = () => {
    const at = E.nextWorkoutAt(st(), Date.now());
    const pad = n => String(n).padStart(2, '0');
    const d = new Date(at && at > Date.now() ? at : Date.now() + 3600e3);
    const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    App.openSheet(() => `<h2>${t('w.nextTitle')}</h2><p class="muted small-p">${t('w.nextHint')}</p><input class="inp" type="datetime-local" id="nextInput" value="${val}">
      <button class="btn primary" data-a="nextSave">${t('save')}</button><button class="btn secondary" data-a="nextNow">${t('w.nextNow')}</button>
      <button class="btn ghost" data-a="wizStep" data-step="${App.stepIdx('days')}">${t('w.editSchedule')}</button>`);
  };
  A.nextSave = () => { const v = App.$('#nextInput').value; if (v) st().nextAt = new Date(v).getTime(); st().todayMin = null; App.save(); App.closeSheet(); App.render(); };
  A.nextNow = () => { st().nextAt = Date.now() - 1000; App.save(); App.closeSheet(); App.render(); };
  A.pickWorkout = () => {
    const r = E.routine(st());
    App.openSheet(() => `<h2>${t('w.pickDay')}</h2><div class="list">${r.map((w, i) => `<button class="list-row ${i === st().rotation % r.length ? 'on' : ''}" data-a="setNext" data-i="${i}"><span><b>${esc(App.workoutName(w))}</b><small>${w.muscles.map(App.mName).join(', ')}</small></span><i class="rdot"></i></button>`).join('')}</div>
      <button class="btn secondary" data-a="wizStep" data-step="${App.stepIdx('routine')}">${t('w.editRoutine')}</button>`);
  };
  A.setNext = d => { st().rotation = +d.i; st().draft = null; App.save(); App.closeSheet(); App.render(); };
  A.pickEnv = () => App.openSheet(() => `<h2>${t('w.env')}</h2><p class="muted small-p">${t('w.envHint')}</p><div class="list">${st().envs.map(e => `<button class="list-row ${S().envId === e.id ? 'on' : ''}" data-a="setEnv" data-id="${e.id}"><span><b>${esc(e.name)}</b><small>${t('env.pieces', { n: e.equip.length })}</small></span><i class="rdot"></i></button>`).join('')}</div>
      <button class="btn secondary" data-a="manageEnvs">${t('env.manage')}</button>`);
  A.manageEnvs = () => { App.closeSheet(); App.go('envs'); };
  A.setEnv = d => { S().envId = d.id; st().draft = null; E.clearCache(); App.save(); App.closeSheet(); App.render(); };
  A.editTime = () => App.numberSheet({ title: t('w.timeTitle'), value: todayMin(), step: 5, min: 15, max: 180, unit: 'min', onSave: v => { st().todayMin = Math.round(v / 5) * 5; App.save(); App.render(); } });
  A.extend = async () => {
    if (!(await App.confirmDlg(t('w.extendT'), t('w.extendQ'), t('w.extendBtn')))) return;
    st().todayMin = Math.min(180, todayMin() + 10); App.save(); App.render();
  };
  A.extendActive = async () => {
    if (!(await App.confirmDlg(t('w.extendT'), t('w.extendQ'), t('w.extendBtn')))) return;
    const a = st().active; a.budgetMin += 10;
    const w = E.routine(st()).find(x => x.id === a.wid) || E.currentWorkout(st());
    const plan = E.buildPlan(st(), w, a.budgetMin + 10);
    const have = new Set(a.items.map(x => x.exId));
    let added = 0;
    plan.filter(x => !have.has(x.exId)).slice(0, 2).forEach(it => { a.items.push(toActiveItem(it, warmSet(a.items.length), a.items.length)); added++; });
    if (!added) { const m = w.muscles[Math.floor(Math.random() * w.muscles.length)]; const c = E.candidates(m, st()).filter(e => !have.has(e.id))[0]; if (c) { const it = E.finalize({ exId: c.id, m, key: null, imp: 2, extra: true, sets: 2, rest: E.restFor(c, S()) }, st()); a.items.push(toActiveItem(it, warmSet(a.items.length), a.items.length)); } }
    if (a.cur < 0) { const n = a.items.findIndex(x => x.status === 'pending'); if (n >= 0) setCurrent(n); }
    E.estimate(a.items, S()); App.save(); App.render();
  };
  A.skipSession = async () => {
    if (!(await App.confirmDlg(t('w.skip'), t('w.skipQ'), t('w.skip'), 'warn'))) return;
    st().rotation++; st().draft = null; st().todayMin = null; st().nextAt = null;
    st().skipped = st().skipped || []; st().skipped.push(Date.now());
    App.save(); App.render();
  };
  A.reorder = () => { ui.reorder = true; App.openSheet(reorderSheet); };
  function reorderSheet() {
    const list = listRef();
    return `<div class="sheet-head"><h2>${t('w.reorder')}</h2><button class="icon-btn circ" data-a="closeSheet">${ICON.x}</button></div><p class="muted small-p">${t('w.reorderHint')}</p>
      <div class="list">${list.map((it, i) => `<div class="list-row ${st().active && list[i].status !== 'pending' ? 'dim' : ''}"><span class="num sm">${i + 1}</span><span><b>${esc(App.exName(it.exId))}</b></span>
        <button class="icon-btn" data-a="moveQ" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button><button class="icon-btn" data-a="moveQ" data-i="${i}" data-d="1" ${i === list.length - 1 ? 'disabled' : ''}>${ICON.down}</button></div>`).join('')}</div>
      <button class="btn primary" data-a="closeSheet">${t('done')}</button>`;
  }
  A.moveQ = d => { moveItem(+d.i, +d.d); App.refreshSheet(); App.keepScroll(App.render); };
  function moveItem(i, dir) {
    const list = listRef(); const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const a = st().active;
    if (a && (list[i].status !== 'pending' || list[j].status !== 'pending')) return;
    [list[i], list[j]] = [list[j], list[i]];
    if (a) { if (a.cur === i) a.cur = j; else if (a.cur === j) a.cur = i; }
    E.estimate(list, S()); App.save();
  }

  // ----- exercise context menu -----
  A.exMenu = d => { ui.menuI = +d.i; App.openSheet(exMenuSheet); };
  function exMenuSheet() {
    const i = ui.menuI;
    const list = listRef(); const it = list[i]; const ex = EX[it.exId];
    const fav = st().favorites.includes(ex.id);
    const active = !!st().active;
    const locked = active && it.logged && it.logged.length;
    const pref = E.exPref(st(), ex.id);
    const eqOpts = E.equipOptions(ex, st());
    const row = (act, icon, label, extra = '') => `<button class="list-row" data-a="${act}" data-i="${i}" ${extra}>${icon}<span><b>${label}</b></span></button>`;
    return `<h2>${esc(App.exName(ex.id))}</h2>
      <label>${t('c.sets')}</label><div class="stepper"><button data-a="setsStep" data-i="${i}" data-d="-1">${ICON.minus}</button><div class="val big">${it.sets}</div><button data-a="setsStep" data-i="${i}" data-d="1">${ICON.plus}</button></div>
      <div class="list">
        ${locked ? '' : row('swap', ICON.swap, t('swap.title'))}
        ${row('info', ICON.info, t('info'), `data-id="${ex.id}"`)}
        ${row('exHistory', ICON.history, t('menu.history'), `data-id="${ex.id}"`)}
        ${row('exNote', ICON.note, t('menu.note'), `data-id="${ex.id}"`)}
        ${row('fav', ICON.heart, fav ? t('menu.unfav') : t('menu.fav'), `data-id="${ex.id}"`)}
        ${it.ss ? row('removeSS', ICON.link, t('menu.removeSS')) : row('createSS', ICON.link, t('menu.createSS'))}
        ${it.drops ? row('removeDrops', ICON.layers, t('menu.removeDrops')) : row('addDrops', ICON.layers, t('menu.addDrops'))}
        ${E.variantsFor(ex, st()).length ? row('pickVariant', ICON.building, t('menu.variant')) : ''}
        ${eqOpts.length > 1 ? row('changeEquip', ICON.sliders, t('menu.equip')) : ''}
        ${ex.load !== 'band' ? row('changeUnits', ICON.globe, t('menu.units') + ` (${App.unitLbl(pref.units || S().units)})`) : ''}
        ${ex.load !== 'band' && ex.load !== 'bw' ? row('customInc', ICON.plus, t('menu.increment') + (pref.increment ? ` (${App.fmtNum(App.wVal(pref.increment, pref.units))})` : '')) : ''}
        ${row('moveQ', ICON.up, t('menu.up'), `data-d="-1" ${i === 0 ? 'disabled' : ''}`)}
        ${row('moveQ', ICON.down, t('menu.down'), `data-d="1" ${i === list.length - 1 ? 'disabled' : ''}`)}
        ${row('dislike', ICON.thumbDown, t('menu.dislike'))}
        ${locked ? '' : `<button class="list-row danger" data-a="removeEx" data-i="${i}">${ICON.x}<span><b>${t('menu.remove')}</b></span></button>`}
      </div>`;
  }
  A.fav = d => { const f = st().favorites; const k = f.indexOf(d.id); if (k >= 0) f.splice(k, 1); else f.push(d.id); App.save(); App.closeSheet(); App.keepScroll(App.render); };
  A.dislike = async d => {
    const it = listRef()[+d.i]; App.closeSheet();
    const v = await App.dialog({ title: t('dis.title'), body: `<p>${t('dis.q', { n: esc(App.exName(it.exId)) })}</p>`, buttons: [{ label: t('dis.thisEnv'), v: 'env', cls: 'primary' }, { label: t('dis.everywhere'), v: 'all' }, { label: t('cancel'), v: 'no' }] });
    if (!v || v === 'no') return;
    st().disliked.push({ exId: it.exId, envId: v === 'env' ? E.env(st()).id : null });
    if (it.key) delete st().swaps[it.key];
    const alt = E.candidates(it.m, st()).filter(e => !listRef().some(x => x.exId === e.id))[0];
    if (alt && !(st().active && it.logged && it.logged.length)) { it.exId = alt.id; it.variant = null; E.finalize(it, st()); if (st().active) Object.assign(it, toActiveItem(it, warmSet(+d.i), +d.i), { status: it.status, phase: it.status === 'active' ? 'prepare' : it.phase }); App.notice(t('notice'), t('dis.replaced', { n: esc(App.exName(alt.id)) })); }
    else App.notice(t('notice'), t('dis.noAlt'));
    E.estimate(listRef(), S()); App.save(); App.render();
  };
  A.setsStep = d => { const list = listRef(); const it = list[+d.i]; it.sets = Math.max(Math.max(1, it.logged ? it.logged.length : 1), Math.min(8, it.sets + (+d.d))); E.estimate(list, S()); App.save(); App.refreshSheet(); App.keepScroll(App.render); };
  A.removeEx = d => {
    const list = listRef(); const i = +d.i; const a = st().active;
    if (a && list[i].logged.length) { App.closeSheet(); return; }
    const ss = list[i].ss;
    list.splice(i, 1);
    if (ss) list.forEach(x => { if (x.ss === ss) delete x.ss; });
    if (a) { if (a.cur === i) { a.cur = -1; const n = list.findIndex(x => x.status === 'pending'); if (n >= 0) setCurrent(n); } else if (a.cur > i) a.cur--; }
    E.estimate(list, S()); App.save(); App.closeSheet(); App.render();
  };
  A.exNote = d => {
    const envId = E.env(st()).id;
    App.textSheet({ title: t('menu.note'), label: t('a.noteFor', { n: esc(App.exName(d.id)) }), value: noteFor(d.id), multiline: true, placeholder: t('a.notePh'), onSave: v => { st().notes[envId] = st().notes[envId] || {}; if (v) st().notes[envId][d.id] = v; else delete st().notes[envId][d.id]; App.save(); App.render(); } });
  };
  A.exHistory = d => {
    const ex = EX[d.id];
    const rows = st().history.map(h => ({ h, it: h.items.find(x => x.exId === d.id && x.sets.length) })).filter(x => x.it).reverse();
    App.openSheet(() => `<div class="sheet-head"><h2>${esc(App.exName(d.id))}</h2><button class="icon-btn circ" data-a="closeSheet">${ICON.x}</button></div><p class="muted small-p">${t('menu.history')}</p>
      ${rows.length ? rows.map(({ h, it }) => `<div class="hist-ex"><b>${App.fmtDate(h.date)}</b> <small class="muted">${esc(h.envName || '')}${it.variant ? ' · ' + esc(it.variant) : ''}</small><div class="muted">${it.sets.map(x => `${App.fmtW(x.w, ex)}×${x.repsR != null ? x.repsL + '/' + x.repsR : x.reps} @${x.rir}`).join(' · ')}</div>${it.note ? `<div class="exnote">${ICON.note} ${esc(it.note)}</div>` : ''}</div>`).join('') : `<p class="muted">${t('st.noRecord')}</p>`}
      <button class="btn secondary mt" data-a="exChart" data-id="${d.id}">${t('menu.chart')}</button>`);
  };
  A.exChart = d => { App.closeSheet(); ui.statsEx = d.id; ui.pages = []; ui.tab = 'stats'; App.render(); };
  A.createSS = d => {
    const list = listRef(); const i = +d.i;
    const opts = list.map((x, k) => ({ x, k })).filter(o => o.k !== i && !o.x.ss && (!st().active || o.x.status !== 'done'));
    App.openSheet(() => `<h2>${t('ss.title')}</h2><p class="muted small-p">${t('ss.pick')}</p><div class="list">${opts.map(o => `<button class="list-row" data-a="doSS" data-i="${i}" data-j="${o.k}"><span><b>${esc(App.exName(o.x.exId))}</b><small>${App.mName(o.x.m)}${o.x.m === list[i].m ? ' · ' + t('ss.sameMuscle') : ''}</small></span></button>`).join('') || `<p class="muted">${t('ss.none')}</p>`}</div>`);
  };
  A.doSS = d => {
    const list = listRef(); const i = +d.i, j = +d.j;
    const id = 'ss' + E.uid();
    list[i].ss = id; list[j].ss = id;
    const [lo, hi] = i < j ? [i, j] : [j, i];
    if (!(st().active && (list[lo].status !== 'pending' || list[hi].status !== 'pending'))) { const [m] = list.splice(hi, 1); list.splice(lo + 1, 0, m); }
    if (st().active) { const a = st().active; a.cur = a.items.findIndex(x => x.status === 'active'); }
    E.estimate(list, S()); App.save(); App.closeSheet(); App.render();
  };
  A.removeSS = d => { const list = listRef(); const ss = list[+d.i].ss; list.forEach(x => { if (x.ss === ss) delete x.ss; }); E.estimate(list, S()); App.save(); App.closeSheet(); App.render(); };
  A.addDrops = d => { const list = listRef(); list[+d.i].drops = 2; E.estimate(list, S()); App.save(); App.closeSheet(); App.render(); };
  A.removeDrops = d => { const list = listRef(); list[+d.i].drops = 0; E.estimate(list, S()); App.save(); App.closeSheet(); App.render(); };
  A.addDropsNow = d => { const a = st().active; const it = a.items[+d.i]; it.drops = 2; setCurrent(+d.i); it.phase = 'drops'; ui.drops = { i: +d.i, list: E.dropWeights(it, EX[it.exId], st(), 2).map(w => ({ w, reps: 0 })) }; App.save(); App.render(); };
  A.changeEquip = d => {
    const it = listRef()[+d.i]; const ex = EX[it.exId];
    const cur = E.exPref(st(), ex.id).equip || E.primaryEquip(ex, E.env(st()));
    App.openSheet(() => `<h2>${t('menu.equip')}</h2><p class="muted small-p">${t('menu.equipHint')}</p><div class="list">${E.equipOptions(ex, st()).map(e => `<button class="list-row ${cur === e ? 'on' : ''}" data-a="setEquip" data-i="${d.i}" data-e="${e}"><span><b>${App.eqName(e)}</b></span><i class="rdot"></i></button>`).join('')}</div>`);
  };
  A.setEquip = d => { const it = listRef()[+d.i]; E.setExPref(st(), it.exId, { equip: d.e, variant: null }); it.variant = null; refreshWeight(it); App.save(); App.closeSheet(); App.render(); };
  A.changeUnits = d => {
    const it = listRef()[+d.i]; const cur = E.exPref(st(), it.exId).units || S().units;
    App.openSheet(() => `<h2>${t('menu.units')}</h2><p class="muted small-p">${t('menu.unitsHint')}</p><div class="list">${['kg', 'lb'].map(u => `<button class="list-row ${cur === u ? 'on' : ''}" data-a="setUnits" data-i="${d.i}" data-u="${u}"><span><b>${App.unitLbl(u)}</b></span><i class="rdot"></i></button>`).join('')}</div>`);
  };
  A.setUnits = d => { const it = listRef()[+d.i]; E.setExPref(st(), it.exId, { units: d.u }); refreshWeight(it); App.save(); App.closeSheet(); App.render(); };
  A.customInc = d => {
    const it = listRef()[+d.i]; const ex = EX[it.exId]; const pref = E.exPref(st(), ex.id); const u = pref.units || S().units;
    App.numberSheet({ title: t('menu.increment'), value: pref.increment ? App.wVal(pref.increment, u) : (u === 'lb' ? 5 : 2.5), step: u === 'lb' ? 0.5 : 0.25, min: 0.25, max: 50, unit: App.unitLbl(u),
      extra: `<p class="hint">${t('menu.incrementHint')}</p><button class="btn ghost" data-a="clearInc" data-i="${d.i}">${t('menu.incrementClear')}</button>`,
      onSave: v => { E.setExPref(st(), ex.id, { increment: App.kgFrom(v, u) }); refreshWeight(it); App.save(); App.render(); } });
  };
  A.clearInc = d => { const it = listRef()[+d.i]; E.setExPref(st(), it.exId, { increment: null }); refreshWeight(it); App.save(); App.closeSheet(); App.render(); };
  function refreshWeight(it) {
    const ex = EX[it.exId];
    if (it.logged && it.logged.length) { it.weight = E.roundW(it.weight, ex, st(), 'nearest'); return; }
    const b = E.baseE1(ex, st(), it.variant); it.e1 = b.e1; it.calib = b.calib; it.weight = E.bestWeight(b.e1, it, ex, st(), E.rirTarget(it, 0));
    if (it.warmups) it.warmups = E.warmupSets(ex, it.weight, it.wu, st());
  }

  // ----- exercise picker, add, swap -----
  App.exercisePicker = opts => {
    ui.pick = Object.assign({ q: '', m: null }, opts);
    App.openSheet(() => {
      const p = ui.pick; const qq = p.q.toLowerCase();
      let list = EXERCISES.filter(e => (!p.m || e.m === p.m) && (!qq || e.n.en.toLowerCase().includes(qq) || e.n.sl.toLowerCase().includes(qq) || App.mName(e.m).toLowerCase().includes(qq)));
      list = list.map(e => ({ e, sc: E.score(e, st()), av: E.available(e, E.env(st())) })).sort((a, b) => (b.av - a.av) || (b.sc - a.sc));
      return `<div class="sheet-head"><h2>${p.title}</h2><button class="icon-btn circ" data-a="closeSheet">${ICON.x}</button></div>
        <div class="search"><span>${ICON.search}</span><input class="inp" id="pickQ" placeholder="${t('swap.searchBody')}" value="${esc(p.q)}" data-in="pickQ"></div>
        <div class="chips sel">${MUSCLES.map(x => `<button class="chip ${p.m === x ? 'on' : ''}" data-a="pickM" data-m="${x}">${App.mName(x)}</button>`).join('')}</div>
        <p class="muted small-p">${t('swap.sortedEquip')}</p>
        <div class="list">${list.slice(0, 80).map(({ e, av }) => `<button class="list-row" data-a="pickDo" data-id="${e.id}" ${p.disabled && p.disabled(e.id) ? 'disabled' : ''}>
          <span class="lg ${av ? 'rec' : 'miss'}">${av ? '●' : '⊘'}</span><span><b>${esc(App.exName(e.id))}</b><small>${App.mName(e.m)}${av ? '' : ' · ' + t('swap.missing')}${e.custom ? ' · ' + t('cust.short') : ''}</small></span></button>`).join('') || `<p class="muted">${t('swap.noRes')}</p>`}</div>
        ${p.allowCustom ? `<p class="center muted small-p mt">${t('swap.cantFind')}</p><button class="btn secondary" data-a="custAddFromPick">${t('cust.add')}</button>` : ''}`;
    });
  };
  A.pickQ = (d, el) => { ui.pick.q = el.value; App.refreshSheet(); };
  A.pickM = d => { ui.pick.m = ui.pick.m === d.m ? null : d.m; App.refreshSheet(); };
  A.pickDo = d => ui.pick.onPick(d.id);
  A.custAddFromPick = () => { App.closeSheet(); A.custAdd(); };
  A.addExercise = () => {
    const list = listRef();
    App.exercisePicker({ title: t('w.add'), allowCustom: true, disabled: id => list.some(x => x.exId === id), onPick: id => {
      const ex = EX[id];
      const it = E.finalize({ exId: id, m: ex.m, key: null, imp: 2, extra: false, sets: E.baseSets(S(), ex.m, false), rest: E.restFor(ex, S()) }, st());
      if (st().active) { const a = st().active; list.push(toActiveItem(it, warmSet(list.length), list.length)); if (a.cur < 0) setCurrent(list.length - 1); } else list.push(it);
      E.estimate(list, S()); App.save(); App.closeSheet(); App.render();
    } });
  };
  A.swap = d => { ui.sw = { i: +d.i, q: '' }; App.openSheet(swapSheet); };
  function swapSheet() {
    const list = listRef(); const it = list[ui.sw.i]; const qq = ui.sw.q.toLowerCase();
    const inPlan = new Set(list.map(x => x.exId));
    let rows;
    if (qq) rows = EXERCISES.filter(e => e.n.en.toLowerCase().includes(qq) || e.n.sl.toLowerCase().includes(qq)).map(e => ({ ex: e, avail: E.available(e, E.env(st())), inj: E.injury(e, S()), sc: E.score(e, st()) })).sort((a, b) => b.sc - a.sc);
    else rows = E.ranked(it.m, st());
    const recIds = new Set(rows.filter(r => r.avail && r.inj !== 'block' && r.ex.m === it.m && !r.dis).slice(0, 3).map(r => r.ex.id));
    const icon = r => r.ex.custom ? `<span class="lg cust">${ICON.edit}</span>` : (!r.avail || r.inj === 'block') ? `<span class="lg miss">⊘</span>` : (r.ex.reps[0] > it.reps[1] || r.ex.reps[1] < it.reps[0]) ? `<span class="lg rep">${ICON.warn}</span>` : recIds.has(r.ex.id) ? `<span class="lg rec">●</span>` : `<span class="lg"></span>`;
    return `<div class="search"><span>${ICON.search}</span><input class="inp" id="swapQ" placeholder="${t('swap.search')}" value="${esc(ui.sw.q)}" data-in="swapQ"></div>
      <div class="legend"><span><span class="lg rec">●</span>${t('swap.rec')}</span><span><span class="lg miss">⊘</span>${t('swap.missing')}</span><span><span class="lg rep">${ICON.warn}</span>${t('swap.rep')}</span><span><span class="lg cust">${ICON.edit}</span>${t('swap.custom')}</span></div>
      <p class="muted small-p">${t('swap.sorted')}</p>
      <div class="list">${rows.map(r => `<button class="list-row sw ${r.ex.id === it.exId ? 'on' : ''}" data-a="doSwap" data-id="${r.ex.id}" ${inPlan.has(r.ex.id) && r.ex.id !== it.exId ? 'disabled' : ''}>${icon(r)}<span><b>${esc(App.exName(r.ex.id))}</b>${qq ? `<small>${App.mName(r.ex.m)}</small>` : ''}</span><i class="rdot"></i></button>`).join('') || `<p class="muted">${t('swap.noRes')}</p>`}</div>
      <p class="center muted small-p mt">${t('swap.cantFind')}</p><button class="btn secondary" data-a="custAddFromPick">${t('cust.add')}</button>`;
  }
  A.swapQ = (d, el) => { ui.sw.q = el.value; App.refreshSheet(); };
  A.doSwap = d => {
    const i = ui.sw.i; const list = listRef(); const it = list[i];
    if (it.key) st().swaps[it.key] = d.id;
    it.exId = d.id; it.variant = null; E.finalize(it, st());
    if (st().active) { const n = toActiveItem(it, warmSet(i), i); Object.assign(it, n, { status: it.status, phase: it.status === 'active' ? 'prepare' : it.phase }); }
    E.estimate(list, S()); App.save(); App.closeSheet(); App.render();
  };
  A.pickVariant = d => {
    const it = listRef()[+d.i]; const vars = E.variantsFor(EX[it.exId], st());
    App.openSheet(() => `<h2>${t('var.pick')}</h2><div class="list">${vars.map(v => `<button class="list-row ${it.variant === v ? 'on' : ''}" data-a="setVariant" data-i="${d.i}" data-v="${esc(v)}"><span><b>${esc(v)}</b></span><i class="rdot"></i></button>`).join('')}</div>`);
  };
  A.setVariant = d => { const it = listRef()[+d.i]; it.variant = d.v; E.setExPref(st(), it.exId, { variant: d.v }); refreshWeight(it); App.save(); App.closeSheet(); App.render(); };

  // ----- exercise info -----
  A.info = d => {
    const ex = EX[d.id]; const s = S(); const lang = s.lang;
    const lp = E.lastPerf(ex.id, st().history);
    const rir = E.rirFor(ex, s);
    const steps = [t('guide.' + ex.load), ex.cue ? ex.cue[lang] : (ex.desc || null), t('guide.tempo'), t('guide.rir', { r: App.rirStr(rir) }), ex.uni ? t('guide.uni') : null].filter(Boolean);
    const reqHtml = ex.req.length ? ex.req.map(g => g.map(e => `<span class="chip eq">${App.eqName(e)}</span>`).join(`<span class="or">${t('or')}</span>`)).join('<span class="and">+</span>') : `<span class="chip eq">${t('eq.none')}</span>`;
    const prev = st().history.map(h => h.items.find(i => i.exId === ex.id && i.sets.length)).filter(Boolean);
    const best = prev.length ? Math.max(...prev.map(p => E.bestNormE1(ex, p.sets, s.bodyweight))) : null;
    App.openSheet(() => `<div class="sheet-head"><h2>${esc(App.exName(ex.id))}</h2><button class="icon-btn circ" data-a="closeSheet">${ICON.x}</button></div>
      ${ex.custom ? '' : `<a class="vbox static" href="${App.ytUrl(ex.id)}" target="_blank" rel="noopener"><span class="play">${ICON.play}</span><span>${t('video.watch')}</span></a>`}
      <div class="chips">${chip('', ICON.target + ' ' + App.mName(ex.m), 'muscle')}${(ex.sec || []).map(m => chip('', App.mName(m))).join('')}</div>
      <details class="acc" open><summary>${t('info.equip')}</summary><div class="req">${reqHtml}</div></details>
      <details class="acc" open><summary>${t('info.guide')}</summary><ol class="steps">${steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol></details>
      <div class="info-grid"><div><label>${t('c.reps')}</label><b>${E.repRangeFor(ex, s).join('–')}</b></div><div><label>RIR</label><b>${App.rirStr(rir)}</b></div><div><label>${t('info.rest')}</label><b>${E.restFor(ex, s)} s</b></div>
        <div><label>${t('info.evidence')}</label><b class="acc">${'★'.repeat(ex.ev)}${'☆'.repeat(5 - ex.ev)}</b></div><div><label>${t('setup')}</label><b>${'⚡'.repeat(4 - ex.setup)}</b></div><div><label>${t('info.uni')}</label><b>${ex.uni ? t('yes') : t('no')}</b></div></div>
      ${best ? `<p class="muted small-p">${t('info.e1rm')}: <b>${App.fmtNum(App.wVal(best - (ex.bw ? ex.bw * s.bodyweight : 0)))} ${App.unitW()}</b></p>` : ''}
      ${ex.notes.length ? `<details class="acc"><summary>${t('info.why')}</summary>${ex.notes.map(n => `<p class="note">${NOTES[n][lang]}</p>`).join('')}</details>` : ''}
      ${ex.load === 'dumbbell' ? `<p class="hint">${t('info.perDb')}</p>` : ''}${ex.load === 'bw' && !ex.assist ? `<p class="hint">${t('info.bw')}</p>` : ''}${ex.assist ? `<p class="hint">${t('info.assist')}</p>` : ''}
      ${lp ? `<h3 class="q">${t('st.last')}</h3><p class="muted">${App.fmtDate(lp.date)}: ${lp.sets.map(x => `${App.fmtW(x.w, ex)}×${x.reps} @${x.rir}`).join(', ')}</p>` : ''}
      <div class="btn-row"><button class="btn secondary" data-a="exHistory" data-id="${ex.id}">${t('menu.history')}</button><button class="btn secondary" data-a="exNote" data-id="${ex.id}">${t('menu.note')}</button></div>`);
  };

  // ================= SESSION LOGIC =================
  function warmSet(upto) { const warm = new Set(); listRef().slice(0, upto).forEach(x => { const e = EX[x.exId]; warm.add(e.m); (e.sec || []).forEach(m => warm.add(m)); }); return warm; }
  function toActiveItem(it, warm, idx) {
    const ex = EX[it.exId]; const s = S();
    const wu = E.warmupCount(ex, warm, s, idx);
    warm.add(ex.m); (ex.sec || []).forEach(m => warm.add(m));
    const b = E.baseE1(ex, st(), it.variant);
    return Object.assign({}, it, { wu, e1: b.e1, calib: b.calib, warmups: E.warmupSets(ex, it.weight, wu, st()), logged: [], status: 'pending', phase: 'prepare' });
  }
  function setCurrent(i) {
    const a = st().active;
    const prev = a.items[a.cur];
    if (prev && prev.status === 'active' && a.cur !== i) prev.status = prev.logged.length >= prev.sets ? 'done' : 'pending';
    const it = a.items[i];
    it.status = 'active'; a.cur = i; a.phaseStart = Date.now(); a.restEnd = null; a.warmEnd = null; a.beeped = true;
    it.phase = it.logged.length ? 'rest' : 'prepare';
    if (it.phase === 'rest') a.restEnd = Date.now();
    ui.log = null;
  }
  A.startSession = async () => {
    const d = getDraft();
    if (!d.items.length) return;
    const now = Date.now();
    if (E.restRecommended(st(), now) && !(await App.confirmDlg(t('w.restT'), t('w.restQ'), t('w.start')))) return;
    const warm = new Set();
    const items = d.items.map((it, i) => toActiveItem(it, warm, i));
    const w = E.currentWorkout(st());
    st().active = { id: 's' + now, wid: w.id, wname: App.workoutName(w), envId: E.env(st()).id, envName: E.env(st()).name, start: now, budgetMin: d.minutes, items, cur: -1, phaseStart: now, restEnd: null, warmEnd: null, beeped: true, pausedAt: null, pausedTotal: 0, deload: !!d.deload };
    setCurrent(0);
    ui.expanded = -1; ui.focus = !!S().prefs.fullscreen;
    App.save(); App.requestWakeLock(); App.render(); window.scrollTo({ top: 0 });
    setTimeout(() => App.startTour('workout', [
      { sel: '#tour-end', title: t('tour.end.t'), text: t('tour.end') },
      { sel: '#ex-0', title: t('tour.card.t'), text: t('tour.card') },
      { sel: '#tour-startex', title: t('tour.start.t'), text: t('tour.start') },
      { sel: '#tour-add', title: t('tour.add.t'), text: t('tour.add') },
      { sel: '#tour-extend', title: t('tour.extend.t'), text: t('tour.extend') },
      { sel: '#tour-endw', title: t('tour.endw.t'), text: t('tour.endw') },
      { sel: '#tour-cancel', title: t('tour.cancel.t'), text: t('tour.cancel') }
    ]), 300);
  };
  A.startEx = d => { const i = +d.i; setCurrent(i); const it = st().active.items[i]; if (it.wu && S().warmups) startWarmup(i); else { it.phase = 'perform'; st().active.phaseStart = Date.now(); } ui.expanded = -1; App.save(); App.render(); scrollToCard(i); };
  function startWarmup(i) { const a = st().active; const it = a.items[i]; it.phase = 'warmup'; a.phaseStart = Date.now(); a.warmEnd = Date.now() + Math.max(1, it.warmups.length) * 60000; a.beeped = false; }
  A.startWarmup = d => { startWarmup(+d.i); App.save(); App.keepScroll(App.render); setTimeout(() => App.startTour('workoutRec', [{ sel: '#tour-rec', title: t('tour.rec.t'), text: t('tour.rec') }]), 200); };
  A.startFirst = d => { const a = st().active; const it = a.items[+d.i]; it.phase = 'perform'; a.phaseStart = Date.now(); a.warmEnd = null; a.beeped = true; App.save(); App.keepScroll(App.render); setTimeout(() => App.startTour('workoutLog', [{ sel: '#tour-log', title: t('tour.log.t'), text: t('tour.log') }]), 200); };
  A.nextSet = d => { const a = st().active; a.items[+d.i].phase = 'perform'; a.phaseStart = Date.now(); a.restEnd = null; a.beeped = true; App.save(); App.keepScroll(App.render); };
  A.wStep = d => { const it = st().active.items[+d.i]; it.weight = E.stepW(it.weight, EX[it.exId], st(), +d.d); App.save(); App.keepScroll(App.render); };
  A.logSet = d => {
    const a = st().active; const i = +d.i; const it = a.items[i]; const ex = EX[it.exId];
    const pred = Math.max(1, E.predict(it, ex, S(), it.weight));
    ui.log = { i, k: -1, w: it.weight, reps: pred, repsR: pred, rir: E.rirTarget(it, it.logged.length), note: '', backPhase: it.phase };
    it.phase = 'log'; App.save(); App.keepScroll(App.render);
    setTimeout(() => App.startTour('workoutForm', [{ sel: '#tour-logform', title: t('tour.form.t'), text: t('tour.form') }]), 200);
  };
  A.editSet = d => {
    const a = st().active; const i = +d.i, k = +d.k; const it = a.items[i]; const l = it.logged[k];
    if (i !== a.cur) setCurrent(i);
    ui.log = { i, k, w: l.w, reps: l.repsL != null ? l.repsL : l.reps, repsR: l.repsR != null ? l.repsR : l.reps, rir: l.rir, note: l.note || '', backPhase: it.phase };
    it.status = 'active'; it.phase = 'log'; App.keepScroll(App.render);
  };
  A.logR = (d, el) => { const key = el.dataset.s === 'R' ? 'repsR' : 'reps'; ui.log[key] = Math.max(0, ui.log[key] + (+d.d)); App.keepScroll(App.render); };
  A.logRir = d => { ui.log.rir = Math.max(0, Math.min(10, ui.log.rir + (+d.d))); App.keepScroll(App.render); };
  A.logW = d => { const it = st().active.items[ui.log.i]; ui.log.w = E.stepW(ui.log.w, EX[it.exId], st(), +d.d); App.keepScroll(App.render); };
  A.logBand = d => { ui.log.w = +d.w; App.keepScroll(App.render); };
  A.logNote = (d, el) => { ui.log.note = el.value; };
  A.logCancel = () => {
    const it = st().active.items[ui.log.i];
    it.phase = ui.log.backPhase === 'log' ? 'perform' : (ui.log.backPhase || 'perform');
    if (it.logged.length >= it.sets && ui.log.k >= 0) it.status = 'done';
    ui.log = null; App.save(); App.keepScroll(App.render);
  };
  A.commitSet = async () => {
    const a = st().active; const L = ui.log; const it = a.items[L.i]; const ex = EX[it.exId];
    const split = ex.uni && !S().prefs.logBothSides;
    const entry = { w: L.w, reps: split ? Math.min(L.reps, L.repsR) : L.reps, rir: L.rir, t: Date.now() };
    if (split) { entry.repsL = L.reps; entry.repsR = L.repsR; }
    if (L.note) entry.note = L.note;
    const editing = L.k >= 0;
    if (editing) it.logged[L.k] = Object.assign(it.logged[L.k], entry); else it.logged.push(entry);
    it.weight = L.w; ui.log = null;
    if (editing) {
      if (it.logged.length >= it.sets) { it.status = 'done'; it.phase = 'done'; const nx = a.items.findIndex(x => x.status === 'pending'); if (nx >= 0 && a.cur === L.i) setCurrent(nx); }
      else it.phase = L.backPhase === 'log' ? 'rest' : L.backPhase;
      App.save(); App.keepScroll(App.render); return;
    }
    const last = it.logged.length >= it.sets;
    if (last && it.drops) {
      it.phase = 'drops'; ui.drops = { i: L.i, list: E.dropWeights(it, ex, st(), it.drops).map(w => ({ w, reps: 0 })) };
      App.save(); App.keepScroll(App.render); return;
    }
    if (last) { completeExercise(L.i); App.save(); App.render(); return; }
    afterSet(L.i);
    App.save(); App.keepScroll(App.render);
    setTimeout(() => App.startTour('workoutRest', [{ sel: '#tour-rest', title: t('tour.rest.t'), text: t('tour.rest') }]), 200);
    if (!S().prefs.suggestions) return;
    const sg = E.suggestion(it, ex, st());
    if (!sg) return;
    const msg = t('sg.' + sg.type, { w: sg.w != null ? App.fmtW(sg.w, ex) : '', lo: it.reps[0], hi: it.reps[1], p: sg.newPred });
    if (sg.type === 'tough') { App.notice(t('sg.title'), msg); return; }
    const v = await App.dialog({ title: t('sg.title'), body: `<p>${msg}</p>`, cancel: true, buttons: [{ label: t('sg.accept'), v: 'accept', cls: 'primary' }, { label: t('sg.reject'), v: 'reject' }, { label: t('sg.never'), v: 'never', cls: 'warn' }] });
    if (v === 'accept') it.weight = sg.w;
    if (v === 'never') S().prefs.suggestions = false;
    App.save(); App.keepScroll(App.render);
  };
  /** after a working set (not the last): rest, or switch to the superset partner */
  function afterSet(i) {
    const a = st().active; const it = a.items[i];
    const partner = partnerOf(it);
    if (partner && partner.logged.length < it.logged.length) {
      setCurrent(a.items.indexOf(partner));
      if (!partner.logged.length && partner.wu && S().warmups) startWarmup(a.cur); else { partner.phase = 'perform'; a.phaseStart = Date.now(); }
      scrollToCard(a.cur); return;
    }
    it.phase = 'rest'; a.restEnd = Date.now() + nextRest(a, it) * 1000; a.beeped = false;
  }
  A.dropStep = d => { const x = ui.drops.list[+d.k]; x.reps = Math.max(0, x.reps + (+d.d)); App.keepScroll(App.render); };
  A.dropDel = d => { ui.drops.list.splice(+d.k, 1); App.keepScroll(App.render); };
  A.dropAdd = () => { const it = st().active.items[ui.drops.i]; const ex = EX[it.exId]; const lastW = ui.drops.list.length ? ui.drops.list[ui.drops.list.length - 1].w : it.weight; const fake = Object.assign({}, it, { weight: lastW }); ui.drops.list.push({ w: E.dropWeights(fake, ex, st(), 1)[0], reps: 0 }); App.keepScroll(App.render); };
  A.dropsSkip = () => { const i = ui.drops.i; ui.drops = null; completeExercise(i); App.save(); App.render(); };
  A.dropsSave = () => {
    const a = st().active; const i = ui.drops.i; const it = a.items[i];
    const drops = ui.drops.list.filter(x => x.reps > 0);
    if (it.logged.length) it.logged[it.logged.length - 1].drops = drops;
    ui.drops = null; completeExercise(i); App.save(); App.render();
  };
  function completeExercise(i) {
    const a = st().active; const it = a.items[i];
    it.status = 'done'; it.phase = 'done';
    const partner = partnerOf(it);
    let next = partner ? a.items.indexOf(partner) : a.items.findIndex((x, k) => k > i && x.status === 'pending');
    if (next < 0) next = a.items.findIndex(x => x.status === 'pending');
    if (next >= 0) {
      setCurrent(next); ui.expanded = -1;
      if (partner && partner.logged.length) { partner.phase = 'rest'; a.restEnd = Date.now() + nextRest(a, partner) * 1000; a.beeped = false; }
      scrollToCard(next);
    } else { a.cur = -1; a.restEnd = null; }
  }
  function scrollToCard(i) { setTimeout(() => { const el = document.getElementById('ex-' + i); if (el && !ui.focus) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); }
  A.finishEx = async d => {
    const it = st().active.items[+d.i];
    if (it.logged.length < it.sets && !(await App.confirmDlg(t('a.finishT'), t('a.finishQ'), t('a.finish')))) return;
    completeExercise(+d.i); App.save(); App.render();
  };
  A.reopen = d => { const i = +d.i; const it = st().active.items[i]; it.sets = Math.max(it.sets, it.logged.length + 1); setCurrent(i); it.phase = 'perform'; st().active.phaseStart = Date.now(); App.save(); App.render(); };
  A.pauseToggle = () => {
    const a = st().active; const now = Date.now();
    if (a.pausedAt) { const d = now - a.pausedAt; a.pausedTotal = (a.pausedTotal || 0) + d; ['restEnd', 'warmEnd', 'phaseStart'].forEach(k => { if (a[k]) a[k] += d; }); a.pausedAt = null; }
    else a.pausedAt = now;
    App.save(); App.keepScroll(App.render);
  };
  A.endSession = async () => {
    const a = st().active;
    const left = a.items.some(it => it.status !== 'done');
    if (left && !(await App.confirmDlg(t('a.end'), t('a.endQ'), t('a.endBtn')))) return;
    finishSession();
  };
  A.cancelSession = async () => {
    const hasSets = st().active.items.some(it => it.logged.length);
    if (await App.confirmDlg(t('a.cancel'), hasSets ? t('a.cancelQ') : t('a.cancelQ2'), t('a.cancel'), 'danger')) { st().active = null; ui.log = null; ui.focus = false; App.save(); App.releaseWakeLock(); App.render(); }
  };
  A.finishSession = () => finishSession();
  async function finishSession() {
    const a = st().active; const s = S();
    const items = a.items.filter(it => it.logged.length).map(it => ({ exId: it.exId, variant: it.variant || null, ss: it.ss || null, note: noteFor(it.exId) || undefined,
      sets: it.logged.map(l => { const o = { w: l.w, reps: l.reps, rir: l.rir }; if (l.repsR != null) { o.repsL = l.repsL; o.repsR = l.repsR; } if (l.note) o.note = l.note; if (l.drops && l.drops.length) o.drops = l.drops; return o; }) }));
    if (!items.length) { if (await App.confirmDlg(t('a.end'), t('a.discard'), t('a.discardBtn'), 'danger')) { st().active = null; ui.focus = false; App.save(); App.releaseWakeLock(); App.render(); } return; }
    // difficulty rating
    ui.diff = 5;
    const rated = await App.dialog({ title: t('fb.diffT'), body: `<p>${t('fb.diff')}</p><div class="diff"><input class="range" type="range" min="0" max="10" step="1" value="5" data-in="diffLive"><div class="row-between"><small>0 · ${t('fb.easy')}</small><b id="diffVal">5</b><small>10 · ${t('fb.hard')}</small></div></div>`, cancel: false, buttons: [{ label: t('save'), v: 'ok', cls: 'primary' }, { label: t('skip'), v: 'skip' }] });
    const difficulty = rated === 'ok' ? ui.diff : null;
    const prs = [];
    items.forEach(it => { const ex = EX[it.exId]; const r = E.recordCheck(ex, it.sets, st().history, s.bodyweight); if (r) prs.push({ exId: it.exId, type: r.type }); });
    const end = Date.now();
    const nSets = items.reduce((x, i) => x + i.sets.length, 0);
    const min = Math.round((end - a.start - (a.pausedTotal || 0)) / 60000);
    st().history.push({ id: a.id, date: a.start, end, wid: a.wid, wname: a.wname, envId: a.envId, envName: a.envName, budgetMin: a.budgetMin, items, prs, difficulty, deload: a.deload, paused: a.pausedTotal || 0 });
    if (a.deload && !st().firstDeloadDone) { st().firstDeloadDone = true; st().lastDeloadAt = a.start; }
    const r = E.routine(st()); const idx = r.findIndex(w => w.id === a.wid);
    st().rotation = idx >= 0 ? idx + 1 : st().rotation + 1;
    st().active = null; st().draft = null; st().todayMin = null; st().nextAt = null; ui.log = null; ui.focus = false;
    App.save(); App.releaseWakeLock();
    ui.pages = []; ui.tab = 'home'; App.render();
    if (prs.length && s.prefs.prNotifications) { App.alertUser(t('pr.title'), 'pr'); await App.dialog({ title: t('pr.title'), cls: 'pr-dlg', body: `<p>${t('pr.text')}</p><ul class="notes">${prs.map(p => `<li><b>${esc(App.exName(p.exId))}</b> — ${t('pr.' + p.type)}</li>`).join('')}</ul>`, buttons: [{ label: t('gotIt'), v: 'ok', cls: 'primary' }] }); }
    await App.dialog({ title: t('sum.title'), body: `<div class="grid3 sum"><div><label>${t('sum.time')}</label><div class="big">${min}<small>min</small></div></div><div><label>${t('st.sets')}</label><div class="big">${nSets}</div></div><div><label>${t('sum.kcal')}</label><div class="big">${E.kcal(min, s.bodyweight)}</div></div></div>
        <p>${t('sum.noPr')}</p><p class="hint">${t('sum.next', { d: esc(App.workoutName(r[st().rotation % r.length])) })}</p>`, buttons: [{ label: t('close'), v: 'ok', cls: 'primary' }] });
    const inj = await App.dialog({ title: t('inj.wasT'), body: `<p>${t('inj.was')}</p>`, buttons: [{ label: t('no'), v: 'no', cls: 'primary' }, { label: t('inj.update'), v: 'yes' }] });
    if (inj === 'yes') App.go('injuries');
  }
  A.diffLive = (d, el) => { ui.diff = +el.value; const v = document.getElementById('diffVal'); if (v) v.textContent = el.value; };

  // ================= PLATE CALCULATOR =================
  A.plateCalc = () => {
    const a = st().active; const it = a.items[ui.log.i]; const ex = EX[it.exId];
    const en = E.env(st());
    const mach = plateMachine(ex);
    const bar = mach ? (mach.base || 0) : E.barWeightFor(ex, en);
    const perSide = mach ? mach.sides !== 'one' : !(ex.bar === 'landmine' || ex.bar === 'tbar');
    const loaded = E.plateBreakdown(ui.log.w, bar, en.plates, perSide);
    ui.pc = { bar, perSide, loaded, mach: !!mach, colors: en.plateColors !== false };
    App.openSheet(pcSheet, 'pc');
  };
  const PLATE_COLOR = w => { const lb = App.lbMode(); const kg = w; if (lb) { const l = Math.round(kg * Engine.LB); return l >= 45 ? '#2563eb' : l >= 35 ? '#eab308' : l >= 25 ? '#16a34a' : l >= 10 ? '#111827' : '#6b7280'; } return kg >= 25 ? '#dc2626' : kg >= 20 ? '#2563eb' : kg >= 15 ? '#eab308' : kg >= 10 ? '#16a34a' : kg >= 5 ? '#f8fafc' : '#6b7280'; };
  function pcSheet() {
    const pc = ui.pc; const en = E.env(st());
    const sum = pc.loaded.reduce((x, w) => x + w, 0);
    const total = pc.bar + (pc.perSide ? 2 : 1) * sum;
    const used = w => pc.loaded.filter(x => Math.abs(x - w) < 1e-6).length;
    const avail = p => (p.q === -1 ? 99 : (pc.perSide ? Math.floor(p.q / 2) : p.q)) - used(p.w);
    const plates = (en.plates || []).slice().sort((x, y) => x.w - y.w);
    const maxW = Math.max(...plates.map(p => p.w), 20);
    const fmt = w => App.fmtNum(App.wVal(w));
    const sorted = pc.loaded.map((w, k) => ({ w, k })).sort((x, y) => y.w - x.w);
    const col = w => (pc.colors ? `style="background:${PLATE_COLOR(w)};color:${['#f8fafc', '#eab308'].includes(PLATE_COLOR(w)) ? '#111' : '#fff'}"` : '');
    return `<div class="sheet-head"><h2>${t('pc.title')}</h2><button class="icon-btn circ" data-a="pcExit">${ICON.x}</button></div>
      <p><b>${t('pc.total')}: ${fmt(total)} ${App.unitW()}</b><br><small class="muted">${pc.mach ? t('pc.base') : t('pc.bar')} ${fmt(pc.bar)} ${App.unitW()} + ${fmt(sum)} ${App.unitW()} ${pc.perSide ? t('pc.perSide') : t('pc.oneSide')}</small></p>
      ${plates.length ? '' : `<p class="warn-txt">${ICON.warn}<span>${t('pc.noPlates')}</span></p>`}
      <div class="barbell"><div class="sleeve"></div><div class="loaded">${sorted.map(({ w, k }) => `<button class="plate-on" ${col(w)} style="${pc.colors ? `background:${PLATE_COLOR(w)};` : ''}height:${34 + 56 * w / maxW}px" data-a="pcRemove" data-k="${k}">${fmt(w)}</button>`).join('')}</div></div>
      ${hint(pc.perSide ? t('pc.hint') : t('pc.hintOne'))}
      <label>${t('pc.plates')}</label>
      <div class="plates">${plates.map(p => `<button class="plate ${used(p.w) ? 'on' : ''}" ${pc.colors ? `style="border-color:${PLATE_COLOR(p.w)}"` : ''} data-a="pcAdd" data-w="${p.w}" ${avail(p) <= 0 ? 'disabled' : ''}>${fmt(p.w)}</button>`).join('')}</div>
      <div class="pc-btns"><button class="btn ghost inline" data-a="invOpenFromPc">${t('pc.edit')}</button><button class="btn ghost inline" data-a="pcClear">${t('pc.clear')}</button></div>
      <button class="btn primary mt" data-a="pcExit">${t('pc.exit')}</button>`;
  }
  A.pcAdd = d => { ui.pc.loaded.push(+d.w); App.refreshSheet(); };
  A.pcRemove = d => { ui.pc.loaded.splice(+d.k, 1); App.refreshSheet(); };
  A.pcClear = () => { ui.pc.loaded = []; App.refreshSheet(); };
  A.pcExit = () => {
    const pc = ui.pc; const total = Math.round((pc.bar + (pc.perSide ? 2 : 1) * pc.loaded.reduce((x, w) => x + w, 0)) * 1000) / 1000;
    if (ui.log && ui.log.weightOnly) { const it = st().active.items[ui.log.i]; it.weight = total; ui.log = null; }
    else if (ui.log) ui.log.w = total;
    App.closeSheet(); App.keepScroll(App.render);
  };
  A.invOpenFromPc = () => { App.closeSheet(); A.invOpen({ id: E.env(st()).id, k: 'plates' }); };

  // ================= TICKER =================
  App.tickers.push(now => {
    const a = st().active;
    document.querySelectorAll('[data-tick]').forEach(el => {
      const k = el.dataset.tick;
      if (k === 'nextIn') { el.innerHTML = nextInHtml(now); return; }
      if (!a) return;
      const eff = a.pausedAt ? a.pausedAt : now;
      if (k === 'elapsed') el.textContent = App.fmtClock(elapsedMs(a, now) / 1000);
      else if (k === 'since') el.textContent = App.fmtClock((eff - (a.phaseStart || eff)) / 1000);
      else if (k === 'warm') { const r = (a.warmEnd - eff) / 1000; el.textContent = App.signedClock(r); el.classList.toggle('over', r < 0); }
      else if (k === 'rest') { if (a.restEnd == null) { el.textContent = '00:00'; return; } const r = (a.restEnd - eff) / 1000; el.textContent = App.signedClock(r); el.classList.toggle('over', r <= 0); }
      else if (k === 'restLabel') el.textContent = a.restEnd && a.restEnd > eff ? t('restNow') : t('goNow');
      else if (k === 'endAt') { const end = predictedEnd(a, eff); el.textContent = App.fmtTime(end); el.classList.toggle('late', end > a.start + a.budgetMin * 60000 + 60000); }
    });
    if (!a || a.cur < 0 || a.pausedAt) return;
    const it = a.items[a.cur]; if (!it) return;
    if (it.phase === 'rest' && a.restEnd && !a.beeped && now >= a.restEnd) {
      a.beeped = true; App.alertUser(t('goNow'));
      if (S().prefs.autoStart) { it.phase = 'perform'; a.phaseStart = now; a.restEnd = null; App.save(); App.keepScroll(App.render); } else App.save();
    }
    if (it.phase === 'warmup' && a.warmEnd && !a.beeped && now >= a.warmEnd) {
      a.beeped = true; App.alertUser(t('a.wuDone'));
      if (S().prefs.autoStart) { it.phase = 'perform'; a.phaseStart = now; a.warmEnd = null; App.save(); App.keepScroll(App.render); } else App.save();
    }
  });
})();
