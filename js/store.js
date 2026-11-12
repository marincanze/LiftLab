'use strict';
/* Persistence in localStorage: everything stays on the device. Export/import for backups. */
const Store = (() => {
  const KEY = 'liftlab.v1';
  const LB = 2.20462;
  const range = (a, b, s) => { const r = []; for (let x = a; x <= b + 1e-9; x += s) r.push(Math.round(x * 100) / 100); return r; };

  function makeEnv(name, type, units) {
    const lb = units === 'lb';
    const k = v => (lb ? v / LB : v);
    const gymLike = ['commercial', 'bodybuilding', 'powerlifting', 'studio'].includes(type);
    const plates = (lb ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25]).map(w => ({ w: k(w), q: gymLike ? (w >= 10 ? 8 : 4) : 4 }));
    const db = {
      commercial: lb ? range(5, 110, 5) : range(2, 50, 2), bodybuilding: lb ? range(5, 150, 5) : range(2, 70, 2), powerlifting: lb ? range(10, 120, 10) : range(5, 50, 5),
      studio: lb ? range(5, 60, 5) : range(2, 30, 2), home: lb ? range(10, 90, 10) : range(5, 40, 5), homeWorkout: lb ? [10, 20, 30] : [5, 10, 15], hotel: lb ? range(5, 60, 5) : range(2, 30, 2), none: []
    }[type] || [];
    const equip = (ENV_PRESETS[type] || []).slice();
    return {
      id: 'e' + Math.random().toString(36).slice(2, 9), name, type, rev: 1, equip,
      plates: equip.some(e => PLATE_EQUIP.has(e)) ? plates : [],
      bars: { barbell: k(lb ? 45 : 20), ezbar: k(lb ? 25 : 10), trapBar: k(lb ? 55 : 25), ssb: k(lb ? 55 : 25) },
      dumbbells: db.map(w => ({ w: k(w), q: 2 })),
      kettlebells: (type === 'none' || type === 'hotel') ? [] : (lb ? [18, 26, 35, 44, 53] : [8, 12, 16, 20, 24]).map(w => ({ w: k(w), q: 1 })),
      bands: DEFAULT_BANDS.map(b => ({ key: b[0], w: k(lb ? Math.round(b[1] * LB) : b[1]) })),
      micro: type === 'home' ? [{ w: k(lb ? 1.25 : 0.5), q: 4 }] : [],
      machines: {}, variants: {}, plateColors: true
    };
  }

  const blankProfile = () => ({
    program: null, recentDur: null, freq: null, category: null, intensity: null, duration: null,
    extra: null, extraFreq: null, extraIntensity: null, extraDuration: null, extraType: '',
    diet: null, sleepHours: null, sleepQuality: null, stress: null, activity: null, peds: null, illness: null
  });

  const defaults = () => {
    const gym = makeEnv('Gym', 'commercial', 'kg');
    const now = Date.now();
    return {
      v: 1, createdAt: now,
      settings: {
        lang: 'en', theme: 'dark', units: 'kg', lengthUnits: 'cm',
        name: '', sex: 'm', birthYear: null, bodyweight: 80, height: 178, bodyType: 'average',
        experience: '1-3y', lifter: 'hobbyist', goal: 'blend', e1rm: { squat: null, bench: null, deadlift: null }, wilks: null,
        lastDeloadWeeks: null, firstWeekDeload: false,
        routineType: 'recommended', workouts: [], musclesToTrain: DEFAULT_TRAIN.slice(), prio: [],
        rirTraining: true, warmups: true, mode: 'regular', consistency: 3, repRanges: ['5-10', '10-15', '15-20'],
        schedule: { daysPerWeek: 4, specificDays: false, days: [0, 2, 4, 6], cyclic: false, cycleOn: 3, cycleOff: 1, unlimitedTime: false, timePerDay: 60, perDayTime: {}, startDate: null, hour: 17, minute: 0 },
        profile: blankProfile(), injuries: [],
        envId: gym.id,
        prefs: { hideVideos: false, logBothSides: true, autoStart: false, showEstReps: true, prNotifications: true, suggestions: true, sound: true, notifications: true, tutorials: true,
          supersetStrategy: 'short', dropsetStrategy: 'never', restMode: 'min', fullscreen: false },
        onboarded: false, setupStep: 0, tours: {}, whatsNewSeen: null
      },
      envs: [gym], favorites: [], disliked: [], customEx: [], swaps: {}, exPrefs: {}, notes: {},
      rotation: 0, todayMin: null, nextAt: null, lastDeloadAt: null, firstDeloadDone: false,
      history: [], bwLog: [], measures: [], moved: {}, lastBackupAt: null, draft: null, active: null
    };
  };

  function merge(d, s) {
    const out = Object.assign(d, s || {});
    const ds = defaults();
    out.settings = Object.assign(ds.settings, (s && s.settings) || {});
    out.settings.profile = Object.assign(blankProfile(), out.settings.profile || {});
    out.settings.prefs = Object.assign(ds.settings.prefs, out.settings.prefs || {});
    out.settings.schedule = Object.assign(ds.settings.schedule, out.settings.schedule || {});
    out.settings.e1rm = Object.assign({ squat: null, bench: null, deadlift: null }, out.settings.e1rm || {});
    if (!out.envs || !out.envs.length) { const e = makeEnv('Gym', 'commercial', out.settings.units); out.envs = [e]; out.settings.envId = e.id; }
    out.envs.forEach(e => { e.bars = e.bars || {}; e.bands = e.bands || []; e.kettlebells = e.kettlebells || []; e.machines = e.machines || {}; e.variants = e.variants || {}; e.micro = e.micro || []; e.plates = e.plates || []; e.dumbbells = e.dumbbells || []; });
    ['favorites', 'disliked', 'customEx', 'history', 'bwLog', 'measures'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
    out.disliked = out.disliked.map(x => (typeof x === 'string' ? { exId: x, envId: null } : x));
    ['swaps', 'exPrefs', 'notes', 'moved'].forEach(k => { if (!out[k] || typeof out[k] !== 'object') out[k] = {}; });
    if (!out.createdAt) out.createdAt = Date.now();
    if (s && !s.darkDefault && out.settings.theme === 'light') out.settings.theme = 'dark';   // one-time switch to the dark default; the choice in the settings is kept afterwards
    out.darkDefault = true;
    return out;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return merge(defaults(), JSON.parse(raw));
    } catch (e) { console.warn('load failed', e); }
    return defaults();
  }
  function save(st) {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { console.warn('save failed', e); }
  }
  return { load, save, defaults, merge, makeEnv, blankProfile, KEY };
})();
