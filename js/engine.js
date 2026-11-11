'use strict';
/*
 * Training engine: routines & schedule, deloads, plan generation that fits a time budget,
 * supersets & drop sets, equipment-aware weight rounding, strength model, predictions, suggestions, scores.
 */
const Engine = (() => {
  const LB = 2.20462;
  const FATIGUE = 0.025;
  const DAY = 864e5;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const uid = () => Math.random().toString(36).slice(2, 9);

  // ================= ROUTINE =================
  function recommendedType(s) {
    const d = s.schedule.daysPerWeek;
    if ((s.prio || []).length) return 'fullbody';
    if (d <= 3) return 'fullbody';
    if (d === 4) return 'upperlower';
    if (d === 5) return 'ulppl';
    return 'ppl';
  }
  function templateWorkouts(type, s) {
    let list;
    if (type === 'ulppl') list = [['upper', 0], ['lower', 0], ['push', 0], ['pull', 0], ['legs', 0]];
    else list = ROUTINES[type] || ROUTINES.upperlower;
    const train = new Set(s.musclesToTrain && s.musclesToTrain.length ? s.musclesToTrain : DEFAULT_TRAIN);
    const out = list.map(([key, v]) => ({ id: 'w' + key + v, preset: key, name: null, muscles: PRESETS[key].filter(m => train.has(m)), v }));
    return out.filter(w => w.muscles.length);
  }
  function routine(st) {
    const s = st.settings;
    if (s.routineType === 'custom') return s.workouts.filter(w => w.muscles.length);
    const type = s.routineType === 'recommended' ? recommendedType(s) : s.routineType;
    return templateWorkouts(type, s);
  }
  const currentWorkout = st => { const r = routine(st); return r.length ? r[st.rotation % r.length] : null; };
  function unusedMuscles(st) {
    const s = st.settings;
    const used = new Set(routine(st).flatMap(w => w.muscles));
    const train = s.musclesToTrain && s.musclesToTrain.length ? s.musclesToTrain : DEFAULT_TRAIN;
    return train.filter(m => !used.has(m));
  }
  function routineValid(type, s) {
    if (type === 'custom') return s.workouts.length > 0 && s.workouts.every(w => w.muscles.length);
    const ws = templateWorkouts(type === 'recommended' ? recommendedType(s) : type, s);
    return ws.length > 0;
  }

  // ================= SCHEDULE =================
  const dayStart = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const addDays = (ts, n) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d.getTime(); };   // safe across daylight saving changes
  const weekday = ts => (new Date(ts).getDay() + 6) % 7;     // 0 = Monday
  function trainedDays(st) { return new Set(st.history.map(h => dayStart(h.date))); }
  /** is `ts` a planned training day according to the schedule */
  function isTrainingDay(st, ts) {
    const sc = st.settings.schedule;
    const d0 = dayStart(ts);
    if (sc.cyclic) {
      const start = dayStart(sc.startDate || st.createdAt || Date.now());
      const n = Math.round((d0 - start) / DAY);
      const cycle = (sc.cycleOn || 1) + (sc.cycleOff || 0);
      return ((n % cycle) + cycle) % cycle < (sc.cycleOn || 1);
    }
    if (sc.specificDays && sc.days && sc.days.length) return sc.days.includes(weekday(d0));
    const pattern = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] }[clamp(sc.daysPerWeek || 4, 1, 7)];
    return pattern.includes(weekday(d0));
  }
  /** next planned workout timestamp (after the last completed workout) */
  function nextWorkoutAt(st, now) {
    if (st.nextAt) return st.nextAt;
    const sc = st.settings.schedule;
    const last = st.history.length ? st.history[st.history.length - 1].date : null;
    const trained = trainedDays(st);
    let candidate = last ? addDays(last, 1) : Math.max(dayStart(now), dayStart(sc.startDate || now));
    if (sc.startDate && candidate < dayStart(sc.startDate)) candidate = dayStart(sc.startDate);
    for (let i = 0; i < 60; i++) {
      if (isTrainingDay(st, candidate) && !trained.has(candidate)) break;
      candidate = addDays(candidate, 1);
    }
    const hour = sc.hour != null ? sc.hour : (last ? new Date(last).getHours() : 17);
    const minute = sc.minute != null ? sc.minute : (last ? new Date(last).getMinutes() : 0);
    const at = candidate + hour * 3600e3 + minute * 60e3;
    return at;
  }
  function budgetFor(st, ts) {
    const sc = st.settings.schedule;
    if (sc.unlimitedTime) return 120;
    if (sc.specificDays && sc.perDayTime && sc.perDayTime[weekday(ts)] != null) return sc.perDayTime[weekday(ts)];
    return sc.timePerDay || 60;
  }
  function consecutiveTrained(st, now) {
    const trained = trainedDays(st);
    let n = 0, d = addDays(now, -1);
    if (trained.has(dayStart(now))) { n++; }
    while (trained.has(d)) { n++; d = addDays(d, -1); }
    return n;
  }
  /** recovery day: trained more consecutive days than the schedule allows */
  function restRecommended(st, now) {
    const sc = st.settings.schedule;
    const n = consecutiveTrained(st, now);
    const maxRun = sc.cyclic ? (sc.cycleOn || 1) : Math.min(6, Math.max(2, sc.daysPerWeek + 1));
    return n >= maxRun && n > 0;
  }

  // ================= DELOAD =================
  function deloadState(st, now) {
    const s = st.settings;
    const interval = s.experience === '0-6m' || s.experience === '6-12m' ? 8 : 6;   // weeks
    const start = st.createdAt || now;
    let lastDeload = st.lastDeloadAt || (s.lastDeloadWeeks != null ? start - s.lastDeloadWeeks * 7 * DAY : start);
    if (s.firstWeekDeload && !st.firstDeloadDone) {
      if (now - start < 7 * DAY) return { deloading: true, weeksSince: 0, nextIn: interval, reason: 'first' };
    }
    const weeks = (now - lastDeload) / (7 * DAY);
    if (weeks >= interval && weeks < interval + 1) return { deloading: true, weeksSince: Math.floor(weeks), nextIn: 0 };
    if (weeks >= interval + 1) { st.lastDeloadAt = now; return { deloading: false, weeksSince: 0, nextIn: interval }; }
    return { deloading: false, weeksSince: Math.floor(weeks), nextIn: Math.max(0, Math.ceil(interval - weeks)) };
  }

  // ================= PROFILE FACTORS =================
  function recovery(s) {
    const p = s.profile || {};
    let f = 1;
    if (p.sleepHours === 'lt6') f -= 0.1; else if (p.sleepHours === 'gt8') f += 0.03;
    if (p.sleepQuality != null) f += p.sleepQuality <= 1 ? -0.1 : p.sleepQuality === 2 ? -0.04 : 0;
    if (p.stress != null) f += p.stress >= 3 ? -0.1 : p.stress === 2 ? -0.05 : 0;
    if (p.illness === 'yes') f -= 0.3;
    if (p.diet === 'lose') f -= 0.1; else if (p.diet === 'gain') f += 0.05;
    if (p.peds === 'yes') f += 0.15;
    if (p.extra === 'yes') { if (p.extraFreq >= 2) f -= 0.08; if (p.extraIntensity >= 3) f -= 0.05; }
    if (p.activity >= 4) f -= 0.05;
    if (p.recentDur === 'none') f -= 0.15; else if (p.recentDur === 'lt1') f -= 0.08;
    if (s.lifter === 'bodybuilder' || s.lifter === 'powerlifter') f += 0.1;
    if (s.mode === 'easy') f -= 0.25;
    const sev = { veryMild: 0.02, mild: 0.04, moderate: 0.08, severe: 0.12, verySevere: 0.15 };
    (s.injuries || []).forEach(i => { f -= sev[i.severity] || 0.05; });
    return clamp(f, 0.45, 1.3);
  }
  const level = s => ({ '0-6m': 'beginner', '6-12m': 'beginner', '1-3y': 'intermediate', '3-6y': 'advanced', '6-12y': 'advanced', '12y+': 'advanced' }[s.experience] || 'intermediate');

  // ================= ENVIRONMENT & AVAILABILITY =================
  function env(st) { return st.envs.find(e => e.id === st.settings.envId) || st.envs[0]; }
  function available(ex, en) {
    if (!en) return true;
    return (ex.req || []).every(g => g.some(e => en.equip.includes(e)));
  }
  const LOC_CODE = Object.fromEntries(INJURY_LOCS);
  function injury(ex, s) {
    let worst = null;
    (s.injuries || []).forEach(inj => {
      const code = LOC_CODE[inj.loc];
      if (code && (ex.j || '').includes(code)) {
        if (inj.severity === 'veryMild' || inj.severity === 'mild') worst = worst || 'mild';
        else worst = 'block';
      }
    });
    return worst;
  }
  function disliked(st, exId) {
    const en = env(st);
    return st.disliked.some(d => d.exId === exId && (!d.envId || (en && d.envId === en.id)));
  }
  function score(ex, st) {
    const s = st.settings;
    let sc = ex.ev * 2 + (3 - ex.setup) * 1.2;
    if (st.favorites.includes(ex.id)) sc += 4;
    const lv = level(s);
    if (lv === 'beginner' && ex.type === 'heavy') sc -= 1.5;
    if (lv === 'beginner' && (ex.load === 'machine' || ex.load === 'cable')) sc += 0.5;
    if (s.goal === 'strength' && ex.load === 'barbell' && ex.type === 'heavy') sc += 2;
    if (s.goal === 'muscle' && ex.load === 'band') sc -= 1;
    if (ex.load === 'band') sc -= 1.5;
    if (injury(ex, s) === 'mild') sc -= 3;
    if (ex.custom) sc += 1;
    const lp = lastPerf(ex.id, st.history);
    if (lp && s.consistency >= 4) sc += 1.5;
    return sc;
  }
  function ranked(m, st) {
    const en = env(st);
    return EXERCISES.filter(e => e.m === m).map(e => ({ ex: e, avail: available(e, en), inj: injury(e, st.settings), dis: disliked(st, e.id), sc: score(e, st) })).sort((a, b) => b.sc - a.sc);
  }
  function candidates(m, st) {
    const r = ranked(m, st).filter(o => o.avail && o.inj !== 'block');
    const pref = r.filter(o => !o.dis);
    return pref.map(o => o.ex);
  }
  function pick(st, key, m, v, used) {
    const sw = key && st.swaps[key];
    if (sw && EX[sw] && available(EX[sw], env(st)) && !used.has(sw) && injury(EX[sw], st.settings) !== 'block') return sw;
    const c = candidates(m, st).filter(e => !used.has(e.id));
    if (!c.length) return null;
    const span = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 }[st.settings.consistency || 3];
    return c[v % Math.min(span, c.length)].id;
  }
  function variantFor(st, w) {
    const c = st.settings.consistency || 3;
    const v = w.v || 0;
    const cycles = Math.floor(st.history.length / Math.max(1, routine(st).length));
    if (c >= 5) return 0;
    if (c === 4) return v;
    if (c === 3) return v + Math.floor(cycles / 3);
    if (c === 2) return v + Math.floor(cycles / 2);
    return v + cycles;
  }

  // ================= PRESCRIPTIONS =================
  function restFor(ex, s) {
    const base = { heavy: 120, compound: 90, iso: 75 }[ex.type];
    return s.prefs.restMode === 'std' ? base + 45 : base;
  }
  const minRest = ex => ({ heavy: 90, compound: 75, iso: 60 }[ex.type]);
  function rirFor(ex, s, deload) {
    if (s.rirTraining === false) return deload ? [2, 2] : [0, 0];
    const tbl = {
      beginner: { heavy: [3, 2], compound: [3, 1], iso: [2, 1] },
      intermediate: { heavy: [2, 1], compound: [2, 0], iso: [1, 0] },
      advanced: { heavy: [2, 0], compound: [1, 0], iso: [1, 0] }
    };
    const r = tbl[level(s)][ex.type].slice();
    if (s.goal === 'strength' && ex.type === 'heavy') r[1] = Math.max(1, r[1]);
    if (s.mode === 'easy') { r[0] += 1; r[1] += 1; }
    if (deload) { r[0] += 2; r[1] += 2; }
    return r;
  }
  /** map the exercise's natural rep range onto the user's enabled rep ranges */
  function repRangeFor(ex, s) {
    const enabled = (s.repRanges && s.repRanges.length ? s.repRanges : REP_RANGES.map(r => r.join('-'))).map(k => k.split('-').map(Number));
    let want = ex.reps.slice();
    if (s.goal === 'strength' && ex.type === 'heavy') want = [5, 10];
    if (s.goal === 'muscle' && ex.type === 'heavy' && want[0] < 6) want = [6, 10];
    const mid = (want[0] + want[1]) / 2;
    let best = enabled[0], bd = Infinity;
    enabled.forEach(r => { const d = Math.abs((r[0] + r[1]) / 2 - mid); if (d < bd) { bd = d; best = r; } });
    return best.slice();
  }
  const prioRank = (s, m) => (s.prio || []).indexOf(m);
  const maxSets = (s, rank) => (level(s) === 'beginner' ? 3 : 4) + (rank === 0 ? 1 : 0);
  const setDur = ex => (ex.uni ? 2 : 1) * 40;
  const transition = ex => 40 + ex.setup * 20;
  function warmupCount(ex, warm, s, idx) {
    if (!s.warmups) return 0;
    if (warm.has(ex.m)) return 0;
    if (ex.load === 'band') return 1;
    if (idx === 0 || ex.type !== 'iso') return 2;
    return 1;
  }
  function estimate(items, s) {
    let total = 0;
    const warm = new Set();
    const ssSeen = new Set();
    items.forEach((it, i) => {
      const ex = EX[it.exId];
      if (!ex) return;
      const wu = warmupCount(ex, warm, s, i);
      it.wu = wu;
      warm.add(ex.m); (ex.sec || []).forEach(m => warm.add(m));
      let rest = Math.max(0, it.sets - 1) * (it.rest || restFor(ex, s));
      if (it.ss) { if (ssSeen.has(it.ss)) rest = 0; else { ssSeen.add(it.ss); rest *= 0.6; } }
      const drops = (it.drops || 0) * it.sets * 20;
      const sec = transition(ex) + wu * 50 + it.sets * setDur(ex) + rest + drops;
      it.estSec = sec;
      total += sec;
    });
    return total;
  }
  function baseSets(s, m, extra, deload) {
    const rank = prioRank(s, m);
    let n = level(s) === 'beginner' ? 2 : 3;
    if (MUSCLE_IMP[m] === 3) n -= 1;
    if (rank === 0) n += 2; else if (rank > 0) n += 1;
    if (extra) n -= 1;
    n = Math.round(n * recovery(s) * (deload ? 0.6 : 1));
    return clamp(n, 1, maxSets(s, rank));
  }
  const muscleSets = (items, m) => items.filter(i => i.m === m).reduce((a, i) => a + i.sets, 0);

  function fit(items, st, wid, budget, used, deload) {
    const s = st.settings;
    const est = () => estimate(items, s);
    const idx = arr => arr.map((it, i) => ({ it, i }));
    const worst = arr => arr.sort((a, b) => (b.it.imp - a.it.imp) || (b.i - a.i))[0];
    let guard = 300;
    const drop = c => { items.splice(c.i, 1); used.delete(c.it.exId); if (c.it.ss) items.forEach(x => { if (x.ss === c.it.ss) delete x.ss; }); };
    while (est() > budget && guard--) {
      let c = worst(idx(items).filter(o => o.it.imp >= 2 && o.it.sets > 2));
      if (c) { c.it.sets--; continue; }
      c = worst(idx(items).filter(o => o.it.imp >= 3));
      if (c && items.length > 3) { drop(c); continue; }
      c = worst(idx(items).filter(o => o.it.imp >= 2));
      if (c && items.length > 4) { drop(c); continue; }
      c = worst(idx(items).filter(o => o.it.sets > 2));
      if (c) { c.it.sets--; continue; }
      if (items.length > 3) { c = worst(idx(items)); drop(c); continue; }
      c = worst(idx(items).filter(o => o.it.sets > 1));
      if (c) { c.it.sets--; continue; }
      if (items.length > 1) { c = worst(idx(items)); items.splice(c.i, 1); used.delete(c.it.exId); continue; }
      break;
    }
    if (deload) return;
    const frozen = new Set();
    guard = 300;
    while (guard--) {
      const cand = idx(items)
        .filter(o => !frozen.has(o.it) && o.it.sets < maxSets(s, prioRank(s, o.it.m)) && muscleSets(items, o.it.m) < (prioRank(s, o.it.m) === 0 ? 10 : 8))
        .sort((a, b) => (a.it.sets + a.it.imp) - (b.it.sets + b.it.imp) || (a.it.imp - b.it.imp) || (a.i - b.i))[0];
      if (cand) {
        cand.it.sets++;
        if (est() > budget) { cand.it.sets--; frozen.add(cand.it); }
        continue;
      }
      const core = [...new Set(items.filter(i => i.imp === 1).map(i => i.m))].filter(m => muscleSets(items, m) < 7 && !items.some(i => i.m === m && i.key && i.key.includes(':e:')));
      let added = false;
      for (const m of core) {
        const key = `${wid}:e:${m}`;
        const id = pick(st, key, m, 0, used);
        if (!id) continue;
        let pos = 0;
        items.forEach((i, k) => { if (i.m === m) pos = k + 1; });
        const it = { exId: id, m, key, imp: 2, extra: true, sets: 2, rest: restFor(EX[id], s) };
        items.splice(pos, 0, it);
        if (est() <= budget) { used.add(id); added = true; break; }
        items.splice(pos, 1);
      }
      if (!added) break;
    }
  }

  /** pair compatible exercises into supersets (non-overlapping muscles, antagonists preferred) */
  function applySupersets(items, strategy, over) {
    items.forEach(it => { delete it.ss; });
    if (strategy === 'never' || items.length < 2) return;
    if (strategy === 'short' && !over) return;
    const pairs = [['upperChest', 'upperBack'], ['lowerChest', 'lats'], ['biceps', 'triceps'], ['quads', 'hamstrings'], ['frontDelts', 'rearDelts'], ['sideDelts', 'rearDelts'], ['abs', 'erectors'], ['gluteMax', 'abs'], ['calves', 'abs'], ['adductors', 'gluteMed']];
    let g = 1;
    const taken = new Set();
    pairs.forEach(([a, b]) => {
      const ia = items.findIndex(it => it.m === a && !taken.has(it) && EX[it.exId].type !== 'heavy');
      const ib = items.findIndex(it => it.m === b && !taken.has(it) && EX[it.exId].type !== 'heavy');
      if (ia < 0 || ib < 0) return;
      const id = 'ss' + g++;
      items[ia].ss = id; items[ib].ss = id;
      taken.add(items[ia]); taken.add(items[ib]);
      // keep superset partners adjacent
      const [lo, hi] = ia < ib ? [ia, ib] : [ib, ia];
      const [moved] = items.splice(hi, 1);
      items.splice(lo + 1, 0, moved);
    });
  }
  /** add drop sets to isolation exercises */
  function applyDropsets(items, strategy, over) {
    items.forEach(it => { it.drops = 0; });
    if (strategy === 'never') return;
    if (strategy === 'short' && !over) return;
    items.forEach(it => { const ex = EX[it.exId]; if (ex.type === 'iso' && ex.load !== 'bw' && ex.load !== 'band') it.drops = 2; });
  }

  function buildPlan(st, w, minutes, opts = {}) {
    const s = st.settings;
    const deload = !!opts.deload;
    const prio = s.prio || [];
    const rank = m => { const r = prio.indexOf(m); return r < 0 ? 99 : r; };
    const ms = w.muscles.slice();
    prio.slice(0, 3).forEach(m => { if (!ms.includes(m) && MUSCLE_IMP[m] >= 2 && (s.musclesToTrain || DEFAULT_TRAIN).includes(m)) ms.push(m); });
    ms.sort((a, b) => (rank(a) - rank(b)) || (MUSCLE_ORDER.indexOf(a) - MUSCLE_ORDER.indexOf(b)));
    const v = variantFor(st, w);
    const used = new Set();
    const items = [];
    ms.forEach(m => {
      const key = `${w.id}:${m}`;
      const id = pick(st, key, m, v, used);
      if (!id) return;
      used.add(id);
      const imp = rank(m) < 99 ? 1 : (w.muscles.includes(m) ? MUSCLE_IMP[m] : 2);
      items.push({ exId: id, m, key, imp, extra: false, sets: baseSets(s, m, false, deload), rest: restFor(EX[id], s) });
    });
    const full = estimate(items, s);
    const over = full > minutes * 60 * 1.05 && minutes <= 75;
    applySupersets(items, s.prefs.supersetStrategy || 'short', over);
    applyDropsets(items, s.prefs.dropsetStrategy || 'never', over);
    fit(items, st, w.id, minutes * 60, used, deload);
    items.forEach(it => finalize(it, st, deload));
    estimate(items, s);
    return items;
  }

  function finalize(it, st, deload) {
    const ex = EX[it.exId];
    const s = st.settings;
    it.m = ex.m;
    it.reps = repRangeFor(ex, s);
    it.rir = rirFor(ex, s, deload);
    it.rest = restFor(ex, s);
    const pref = exPref(st, ex.id);
    const vars = variantsFor(ex, st);
    if (pref.variant && vars.includes(pref.variant)) it.variant = pref.variant;
    if (it.variant && !vars.includes(it.variant)) it.variant = null;
    if (!it.variant && vars.length) it.variant = vars[0];
    const b = baseE1(ex, st, it.variant);
    it.calib = b.calib;
    it.e1 = b.e1;
    it.weight = startWeight(ex, st, it, b);
    if (it.drops == null) it.drops = 0;
    return it;
  }
  function exPref(st, exId) {
    const en = env(st);
    return ((st.exPrefs || {})[en ? en.id : '_'] || {})[exId] || {};
  }
  function setExPref(st, exId, patch) {
    const en = env(st);
    const key = en ? en.id : '_';
    st.exPrefs = st.exPrefs || {};
    st.exPrefs[key] = st.exPrefs[key] || {};
    st.exPrefs[key][exId] = Object.assign({}, st.exPrefs[key][exId] || {}, patch);
    clearCache();
  }

  // ================= EQUIPMENT VARIANTS =================
  function primaryEquip(ex, en, prefEquip) {
    if (prefEquip && en && en.equip.includes(prefEquip) && (ex.req || []).some(g => g.includes(prefEquip))) return prefEquip;
    for (const g of ex.req || []) for (const e of g) if ((PLATE_EQUIP.has(e) || STACK_EQUIP.has(e)) && (!en || en.equip.includes(e))) return e;
    return null;
  }
  /** equipment alternatives the user can pick for an exercise in the current environment */
  function equipOptions(ex, st) {
    const en = env(st);
    const out = [];
    (ex.req || []).forEach(g => { if (g.length > 1) g.forEach(e => { if (en.equip.includes(e) && !out.includes(e)) out.push(e); }); });
    return out;
  }
  function variantsFor(ex, st) {
    const en = env(st);
    const eq = primaryEquip(ex, en, exPref(st, ex.id).equip);
    return eq && en && en.variants && en.variants[eq] ? en.variants[eq] : [];
  }

  // ================= STRENGTH MODEL =================
  const load = (ex, w, bw) => (ex.bw ? ex.bw * bw : 0) + (ex.assist ? -w : w);
  const e1rm = (L, reps, rir) => L * (1 + (reps + rir) / 30);
  const loadFor = (E, reps, rir) => E / (1 + (reps + rir) / 30);
  function repsAt(E, L, rir) {
    if (!(L > 0)) return 0;
    return Math.max(0, Math.floor(30 * (E / L - 1) - rir + 1e-9));
  }
  function lastPerf(exId, history, variant) {
    for (let i = history.length - 1; i >= 0; i--) {
      const it = history[i].items.find(x => x.exId === exId && x.sets.length && (!variant || !x.variant || x.variant === variant));
      if (it) return { date: history[i].date, sets: it.sets, variant: it.variant, envId: history[i].envId };
    }
    return null;
  }
  function bestNormE1(ex, sets, bw) {
    const vals = sets.map((x, k) => e1rm(load(ex, x.w, bw), x.reps, x.rir) / (1 - FATIGUE * Math.min(k, 6)));
    return Math.max(...vals);
  }
  function initialE1(ex, s) {
    const expF = { '0-6m': 0.6, '6-12m': 0.75, '1-3y': 1, '3-6y': 1.2, '6-12y': 1.3, '12y+': 1.35 }[s.experience] || 1;
    const fem = s.sex === 'f' ? (LOWER_MUSCLES.has(ex.m) ? 0.75 : 0.55) : 1;
    const known = s.e1rm || {};
    const bw = s.bodyweight;
    if (ex.bw) {
      const rtf = (ex.rtf || 10) * ({ beginner: 0.5, intermediate: 1, advanced: 1.5 }[level(s)]) * fem;
      if (ex.assist) return ex.bw * bw * (1 + Math.max(2, rtf - 4) / 30);
      return ex.bw * bw * (1 + rtf / 30);
    }
    if (ex.load === 'band') return 17 * expF * fem;
    // scale from known lifts when available
    if (known.squat > 0 && ['quads', 'gluteMax', 'adductors'].includes(ex.m)) return known.squat * (ex.r / 1.3);
    if (known.bench > 0 && ['lowerChest', 'upperChest', 'triceps', 'frontDelts'].includes(ex.m)) return known.bench * (ex.r / 1.0);
    if (known.deadlift > 0 && ['hamstrings', 'erectors', 'upperBack', 'lats', 'upperTraps'].includes(ex.m)) return known.deadlift * (ex.r / 1.6);
    return bw * (ex.r || 0.3) * expF * fem;
  }
  function baseE1(ex, st, variant) {
    const s = st.settings;
    const lp = lastPerf(ex.id, st.history, variant);
    if (lp) return { e1: bestNormE1(ex, lp.sets, s.bodyweight), calib: false };
    return { e1: initialE1(ex, s) * 0.92, calib: true };
  }

  // ================= ACHIEVABLE WEIGHTS =================
  const cache = new Map();
  function clearCache() { cache.clear(); }
  function sums(plates, pairs, max) {
    let set = new Set([0]);
    for (const p of plates || []) {
      const n = p.q === -1 ? 12 : (pairs ? Math.floor(p.q / 2) : p.q);
      const u = Math.round(p.w * 1000);
      const next = new Set(set);
      let cur = [...set];
      for (let k = 0; k < n; k++) {
        cur = cur.map(x => x + u).filter(x => x <= max * 1000);
        cur.forEach(x => next.add(x));
      }
      set = next;
      if (set.size > 6000) break;
    }
    return [...set].map(x => x / 1000);
  }
  function fromRanges(ranges, base) {
    const out = [];
    (ranges || []).forEach(([lo, hi, inc]) => { for (let w = lo; w <= hi + 1e-9; w += inc) out.push(Math.round((w + (base || 0)) * 1000) / 1000); });
    return out;
  }
  function stackInc(ex, units) { return units === 'lb' ? (ex.inc <= 1.25 ? 2.5 : 5) / LB : ex.inc; }
  function machineCfg(en, eq) { return Object.assign({}, MACHINE_DEFAULTS[eq] || { loading: 'stack', base: 0 }, (en && en.machines && en.machines[eq]) || {}); }
  function barWeightFor(ex, en) {
    const bars = (en && en.bars) || {};
    if (ex.bar === 'ez') return bars.ezbar ?? BAR_WEIGHTS.ezbar;
    if (ex.bar === 'trap' && en && en.equip.includes('trapBar')) return bars.trapBar ?? BAR_WEIGHTS.trapBar;
    if (ex.bar === 'ssb' && en && en.equip.includes('ssb')) return bars.ssb ?? BAR_WEIGHTS.ssb;
    if (ex.bar === 'landmine' || ex.bar === 'tbar') return 0;
    return bars.barbell ?? BAR_WEIGHTS.barbell;
  }
  function achievable(ex, st) {
    const en = env(st);
    const s = st.settings;
    const pref = exPref(st, ex.id);
    const units = pref.units || s.units;
    const key = [ex.id, en && en.id, en && en.rev, units, pref.increment || '', pref.equip || ''].join('|');
    if (cache.has(key)) return cache.get(key);
    let list = [];
    const steps = (base, inc, n) => Array.from({ length: n + 1 }, (_, k) => Math.round((base + k * inc) * 1000) / 1000);
    const inc = pref.increment || stackInc(ex, units);
    if (pref.increment) list = steps(0, pref.increment, 200);
    else if (ex.load === 'band') list = ((en && en.bands) || DEFAULT_BANDS.map(b => ({ key: b[0], w: b[1] }))).map(b => b.w);
    else if (ex.assist) {
      const eq = primaryEquip(ex, en, pref.equip);
      const cfg = machineCfg(en, eq || 'assistMachine');
      list = cfg.ranges ? fromRanges(cfg.ranges, 0) : steps(0, inc, 40);
      if (!en || !en.equip.includes('assistMachine')) list = ((en && en.bands) || DEFAULT_BANDS.map(b => ({ w: b[1] }))).map(b => b.w).concat([0]);
    }
    else if (ex.load === 'bw') list = steps(0, inc, 60);
    else if (ex.load === 'dumbbell' && en && en.dumbbells && en.dumbbells.length) {
      const micro = sums((en.micro || []).map(m => ({ w: m.w, q: m.q === -1 ? 8 : m.q })), true, 10);
      en.dumbbells.filter(d => d.q >= (ex.uni ? 1 : 2) || d.q === -1).forEach(d => micro.forEach(m => list.push(d.w + m)));
    } else if (ex.load === 'barbell' && en && en.plates && en.plates.length) {
      const bar = barWeightFor(ex, en);
      const one = ex.bar === 'landmine' || ex.bar === 'tbar';
      sums(en.plates, !one, 300).forEach(sd => list.push(bar + (one ? 1 : 2) * sd));
    } else if (ex.load === 'machine' || ex.load === 'cable') {
      const eq = primaryEquip(ex, en, pref.equip);
      const cfg = machineCfg(en, eq);
      if (cfg.loading === 'plates' && en && en.plates && en.plates.length) {
        const both = cfg.sides !== 'one';
        sums(en.plates, both, 300).forEach(sd => list.push((cfg.base || 0) + (both ? 2 : 1) * sd));
      } else if (cfg.ranges && cfg.ranges.length) list = fromRanges(cfg.ranges, cfg.base);
      else list = steps(cfg.base || 0, cfg.inc || inc, 100);
    } else list = steps(0, inc, 120);
    list = [...new Set(list.map(x => Math.round(x * 1000) / 1000))].sort((a, b) => a - b);
    if (!list.length) list = steps(0, inc, 120);
    cache.set(key, list);
    return list;
  }
  function roundW(kg, ex, st, mode = 'down') {
    const list = achievable(ex, st);
    const min = (ex.load === 'bw' || ex.assist) ? list[0] : (list.find(x => x > 0) ?? list[0]);
    if (mode === 'nearest') {
      let best = list[0];
      list.forEach(x => { if (Math.abs(x - kg) < Math.abs(best - kg)) best = x; });
      return Math.max(best, min);
    }
    let r = min;
    for (const x of list) { if (x <= kg + 1e-6) r = x; else break; }
    return Math.max(r, min);
  }
  function stepW(kg, ex, st, dir) {
    const list = achievable(ex, st);
    if (dir > 0) return list.find(x => x > kg + 1e-6) ?? list[list.length - 1];
    let r = list[0];
    for (const x of list) { if (x < kg - 1e-6) r = x; else break; }
    return r;
  }
  function plateBreakdown(total, bar, plates, perSide = true) {
    let side = perSide ? (total - bar) / 2 : total - bar;
    const out = [];
    const inv = (plates || []).map(p => ({ w: p.w, n: p.q === -1 ? 20 : (perSide ? Math.floor(p.q / 2) : p.q) })).sort((a, b) => b.w - a.w);
    for (const p of inv) while (p.n > 0 && side >= p.w - 1e-6) { out.push(p.w); side -= p.w; p.n--; }
    return out;
  }

  // ================= PER-SET LOGIC =================
  function rirTarget(item, k) {
    const [hi, lo] = item.rir;
    const n = item.sets;
    if (n <= 1) return lo;
    return Math.round(hi - (hi - lo) * Math.min(k, n - 1) / (n - 1));
  }
  const midReps = item => Math.round((item.reps[0] + item.reps[1]) / 2);
  function bestWeight(E, item, ex, st, rir) {
    const s = st.settings;
    const bwPart = ex.bw ? ex.bw * s.bodyweight : 0;
    const [lo, hi] = item.reps;
    const mid = midReps(item);
    const list = achievable(ex, st).filter(x => ex.load === 'bw' || ex.assist || x > 0);
    let best = null, bestScore = Infinity;
    for (const x of list) {
      const L = ex.assist ? bwPart - x : bwPart + x;
      const r = repsAt(E, L, rir);
      const sc = (r < lo || r > hi ? 100 : 0) + Math.abs(r - mid) + (r > mid ? 0.1 : 0);
      if (sc < bestScore) { bestScore = sc; best = x; }
    }
    if (best == null) {
      const ideal = ex.assist ? Math.max(0, bwPart - loadFor(E, mid, rir)) : Math.max(0, loadFor(E, mid, rir) - bwPart);
      return roundW(ideal, ex, st, 'nearest');
    }
    return best;
  }
  const startWeight = (ex, st, item, b) => bestWeight(b.e1, item, ex, st, rirTarget(item, 0));
  function liveE1(item, ex, s) {
    const n = item.logged.length;
    if (n) { const l = item.logged[n - 1]; return e1rm(load(ex, l.w, s.bodyweight), l.reps, l.rir) * (1 - FATIGUE); }
    return item.e1;
  }
  const predict = (item, ex, s, w) => repsAt(liveE1(item, ex, s), load(ex, w, s.bodyweight), rirTarget(item, item.logged.length));
  /** quick tip after a logged set */
  function suggestion(item, ex, st) {
    const s = st.settings;
    const k = item.logged.length;
    if (k >= item.sets || k === 0) return null;
    const last = item.logged[k - 1];
    const E = e1rm(load(ex, last.w, s.bodyweight), last.reps, last.rir) * (1 - FATIGUE);
    const rirN = rirTarget(item, k);
    const w = item.weight;
    const pred = repsAt(E, load(ex, w, s.bodyweight), rirN);
    const [lo, hi] = item.reps;
    const targetRir = rirTarget(item, k - 1);
    if (last.rir >= targetRir + 3 && last.reps >= lo) {
      let nw = bestWeight(E, item, ex, st, rirN);
      if (nw === w) nw = stepW(w, ex, st, ex.assist ? -1 : 1);
      return { type: 'rirHigh', w: nw, newPred: repsAt(E, load(ex, nw, s.bodyweight), rirN) };
    }
    if (pred > hi) {
      let nw = bestWeight(E, item, ex, st, rirN);
      if (ex.assist ? nw >= w - 1e-6 : nw <= w + 1e-6) nw = stepW(w, ex, st, ex.assist ? -1 : 1);
      if (nw === w) return null;
      return { type: 'more', w: nw, newPred: repsAt(E, load(ex, nw, s.bodyweight), rirN) };
    }
    if (pred < lo) {
      let nw = bestWeight(E, item, ex, st, rirN);
      if (ex.assist ? nw <= w + 1e-6 : nw >= w - 1e-6) nw = stepW(w, ex, st, ex.assist ? 1 : -1);
      if (nw === w) return { type: 'tough', w: null, newPred: pred };
      return { type: 'less', w: nw, newPred: repsAt(E, load(ex, nw, s.bodyweight), rirN) };
    }
    return null;
  }
  /** drop set weights after a working set */
  function dropWeights(item, ex, st, count) {
    const out = [];
    let w = item.weight;
    for (let i = 0; i < count; i++) {
      const target = ex.assist ? w * 1.3 + 2 : w * 0.78;
      let nw = roundW(target, ex, st, ex.assist ? 'nearest' : 'down');
      if (!ex.assist && nw >= w - 1e-6) nw = stepW(w, ex, st, -1);
      if (ex.assist && nw <= w + 1e-6) nw = stepW(w, ex, st, 1);
      out.push(nw); w = nw;
    }
    return out;
  }
  function warmupSets(ex, w, count, st) {
    if (!count) return [];
    if (ex.load === 'band' || ex.assist) return count >= 2 ? [{ reps: 8, w: null, band: true }, { reps: 3, w: null, band: true }] : [{ reps: 6, w: null, band: true }];
    if (ex.load === 'bw' && w <= 0) return count >= 2 ? [{ reps: 8, w: 0 }, { reps: 2, w: 0 }] : [{ reps: 5, w: 0 }];
    const w1 = roundW(w * 0.5, ex, st, 'down');
    if (count < 2) return [{ reps: 6, w: w1 }];
    const w2 = roundW(Math.min(w, w1 * 2), ex, st, 'down');
    return [{ reps: 8, w: w1 }, { reps: 2, w: w2 }];
  }
  const kcal = (minutes, bw) => Math.round(5 * 3.5 * bw / 200 * minutes);

  // ================= RECORDS & SCORES =================
  function recordCheck(ex, sets, history, bw) {
    const prev = history.map(h => h.items.find(i => i.exId === ex.id && i.sets.length)).filter(Boolean);
    if (!prev.length) return null;
    const allPrev = prev.flatMap(p => p.sets);
    const bestE1 = Math.max(...prev.map(p => bestNormE1(ex, p.sets, bw)));
    const nowE1 = bestNormE1(ex, sets, bw);
    if (nowE1 <= bestE1 * 1.005) return null;
    const maxW = Math.max(...allPrev.map(x => load(ex, x.w, bw)));
    const maxR = Math.max(...allPrev.map(x => x.reps));
    const moreW = sets.some(x => load(ex, x.w, bw) > maxW + 1e-6);
    const moreR = sets.some(x => x.reps > maxR);
    return { type: moreW && moreR ? 'both' : moreW ? 'weight' : moreR ? 'reps' : 'e1rm', e1: nowE1 };
  }
  function performanceScore(st, from, to) {
    const hs = st.history.filter(h => h.date >= from && h.date <= to);
    const weeks = Math.max(1, (to - from) / (7 * DAY));
    const planned = st.settings.schedule.daysPerWeek * weeks;
    const consistency = clamp(hs.length / Math.max(1, planned), 0, 1);
    let prs = 0, effort = 0, n = 0;
    hs.forEach(h => { prs += (h.prs || []).length; h.items.forEach(it => it.sets.forEach(x => { effort += clamp(1 - x.rir / 5, 0, 1); n++; })); });
    const effortScore = n ? effort / n : 0;
    const prScore = clamp(prs / Math.max(1, hs.length * 2), 0, 1);
    return Math.round(100 * (0.5 * consistency + 0.3 * effortScore + 0.2 * prScore));
  }

  return {
    LB, FATIGUE, DAY, addDays, uid, clamp, level, recommendedType, templateWorkouts, routine, currentWorkout, unusedMuscles, routineValid,
    dayStart, weekday, isTrainingDay, nextWorkoutAt, budgetFor, consecutiveTrained, restRecommended, deloadState, recovery,
    env, available, injury, disliked, score, ranked, candidates, restFor, minRest, rirFor, repRangeFor, setDur, transition, warmupCount, estimate, baseSets,
    buildPlan, finalize, exPref, setExPref, variantsFor, primaryEquip, equipOptions, machineCfg, barWeightFor,
    load, e1rm, loadFor, repsAt, lastPerf, bestNormE1, baseE1, initialE1, clearCache, achievable, roundW, stepW, plateBreakdown,
    rirTarget, midReps, bestWeight, liveE1, predict, suggestion, dropWeights, warmupSets, kcal, recordCheck, performanceScore
  };
})();
