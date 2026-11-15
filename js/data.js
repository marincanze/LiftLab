'use strict';
/* ============================================================
 * Static data: muscle groups, equipment, routine presets, exercises, programs.
 * ============================================================ */

/* ---- Muscle groups, grouped by body region (24 groups) ---- */
const MUSCLE_GROUPS = [
  ['arms', ['biceps', 'triceps', 'forearmFlexors', 'forearmExtensors']],
  ['core', ['abs', 'obliques', 'erectors']],
  ['back', ['upperBack', 'lats', 'upperTraps']],
  ['shoulders', ['frontDelts', 'sideDelts', 'rearDelts', 'neckFlexors', 'neckExtensors']],
  ['legs', ['calves', 'adductors', 'hamstrings', 'quads', 'tibialis']],
  ['glutes', ['gluteMax', 'gluteMed']],
  ['chest', ['upperChest', 'lowerChest']]
];
const MUSCLES = MUSCLE_GROUPS.flatMap(g => g[1]);
/* 1 = large muscle (trained first, cut last) … 3 = small accessory */
const MUSCLE_IMP = {
  quads: 1, hamstrings: 1, gluteMax: 1, upperChest: 1, lowerChest: 1, lats: 1, upperBack: 1,
  sideDelts: 2, rearDelts: 2, biceps: 2, triceps: 2, calves: 2, adductors: 2, abs: 2,
  frontDelts: 3, upperTraps: 3, gluteMed: 3, obliques: 3, erectors: 3, forearmFlexors: 3, forearmExtensors: 3, neckFlexors: 3, neckExtensors: 3, tibialis: 3
};
const MUSCLE_ORDER = ['quads', 'lowerChest', 'lats', 'hamstrings', 'upperChest', 'upperBack', 'gluteMax', 'sideDelts', 'frontDelts',
  'triceps', 'biceps', 'rearDelts', 'adductors', 'gluteMed', 'calves', 'upperTraps', 'abs', 'obliques', 'erectors', 'forearmFlexors', 'forearmExtensors', 'neckFlexors', 'neckExtensors', 'tibialis'];
const LOWER_MUSCLES = new Set(['quads', 'hamstrings', 'gluteMax', 'gluteMed', 'adductors', 'calves', 'tibialis']);
/* default muscle groups trained when the user does not customise */
const DEFAULT_TRAIN = ['biceps', 'triceps', 'abs', 'upperBack', 'lats', 'upperTraps', 'frontDelts', 'sideDelts', 'rearDelts', 'calves', 'adductors', 'hamstrings', 'quads', 'gluteMax', 'gluteMed', 'upperChest', 'lowerChest'];

/* ---- Workout presets (muscle lists) ---- */
const PRESETS = {
  push: ['upperChest', 'lowerChest', 'frontDelts', 'sideDelts', 'triceps'],
  pull: ['upperBack', 'lats', 'upperTraps', 'rearDelts', 'biceps', 'forearmFlexors'],
  legs: ['quads', 'hamstrings', 'gluteMax', 'gluteMed', 'adductors', 'calves', 'abs'],
  upper: ['upperChest', 'lowerChest', 'upperBack', 'lats', 'frontDelts', 'sideDelts', 'rearDelts', 'biceps', 'triceps'],
  lower: ['quads', 'hamstrings', 'gluteMax', 'gluteMed', 'adductors', 'calves', 'abs', 'obliques', 'erectors'],
  fullPush: ['upperChest', 'lowerChest', 'frontDelts', 'sideDelts', 'triceps', 'quads', 'calves', 'abs'],
  fullPull: ['upperBack', 'lats', 'rearDelts', 'biceps', 'hamstrings', 'gluteMax', 'upperTraps'],
  fullBody: ['quads', 'hamstrings', 'gluteMax', 'upperChest', 'lowerChest', 'lats', 'upperBack', 'sideDelts', 'rearDelts', 'biceps', 'triceps', 'calves', 'abs'],
  chest: ['upperChest', 'lowerChest', 'frontDelts', 'triceps'],
  back: ['lats', 'upperBack', 'upperTraps', 'rearDelts', 'biceps'],
  shouldersArms: ['sideDelts', 'frontDelts', 'rearDelts', 'biceps', 'triceps', 'forearmFlexors'],
  coreCalves: ['abs', 'obliques', 'erectors', 'calves', 'neckFlexors']
};
const PRESET_ORDER = ['push', 'pull', 'legs', 'upper', 'lower', 'fullPush', 'fullPull', 'fullBody'];
/* Routine templates → list of [preset, variant] */
const ROUTINES = {
  upperlower: [['upper', 0], ['lower', 0], ['upper', 1], ['lower', 1]],
  fullbody: [['fullBody', 0], ['fullBody', 1], ['fullBody', 2]],
  ppl: [['push', 0], ['pull', 0], ['legs', 0]],
  fullpushpull: [['fullPush', 0], ['fullPull', 0]],
  bodypart: [['chest', 0], ['back', 0], ['legs', 0], ['shouldersArms', 0], ['coreCalves', 0]]
};
const ROUTINE_ORDER = ['recommended', 'upperlower', 'fullbody', 'ppl', 'fullpushpull', 'bodypart', 'custom'];
const REP_RANGES = [[5, 10], [10, 15], [15, 20], [20, 30]];

/* ---- Equipment ---- */
const EQUIP_GROUPS = [
  ['free', ['barbell', 'ezbar', 'trapBar', 'ssb', 'dumbbell', 'kettlebell', 'bands', 'dipBelt', 'medBall']],
  ['benches', ['flatBench', 'adjBench', 'rack', 'pullupBar', 'dipStation', 'preacherBench', 'ghd', 'backExtBench', 'landmine', 'box']],
  ['cables', ['cable', 'latPulldown', 'cableRow', 'crossover']],
  ['plateLoaded', ['legPress', 'hackSquat', 'smith', 'plChestPress', 'plRow', 'tbar']],
  ['machines', ['chestPress', 'pecDeck', 'shoulderPress', 'lateralRaise', 'rowMachine', 'preacherMachine', 'legExt', 'seatedCurl', 'lyingCurl',
    'hipAbd', 'hipAdd', 'calfStanding', 'calfSeated', 'abCrunch', 'assistMachine', 'gluteKickback', 'hipThrustMachine']],
  ['other', ['abWheel', 'trx']]
];
const EQUIPMENT = EQUIP_GROUPS.flatMap(g => g[1]);
/* equipment whose weight comes from an inventory or stack (shown with a "Configure" button) */
const PLATE_EQUIP = new Set(['barbell', 'ezbar', 'trapBar', 'ssb', 'legPress', 'hackSquat', 'smith', 'plChestPress', 'plRow', 'tbar', 'landmine']);
const STACK_EQUIP = new Set(['cable', 'latPulldown', 'cableRow', 'crossover', 'chestPress', 'pecDeck', 'shoulderPress', 'lateralRaise', 'rowMachine', 'preacherMachine',
  'legExt', 'seatedCurl', 'lyingCurl', 'hipAbd', 'hipAdd', 'calfStanding', 'calfSeated', 'abCrunch', 'assistMachine', 'gluteKickback', 'hipThrustMachine']);
const MACHINE_DEFAULTS = {
  legPress: { loading: 'plates', sides: 'both', base: 0 }, hackSquat: { loading: 'plates', sides: 'both', base: 0 }, smith: { loading: 'plates', sides: 'both', base: 0 },
  plChestPress: { loading: 'plates', sides: 'both', base: 0 }, plRow: { loading: 'plates', sides: 'both', base: 0 }, tbar: { loading: 'plates', sides: 'one', base: 0 },
  landmine: { loading: 'plates', sides: 'one', base: 0 }, calfStanding: { loading: 'stack', base: 0, ranges: [[5, 150, 5]] }
};
const BAR_WEIGHTS = { barbell: 20, ezbar: 10, trapBar: 25, ssb: 25 };
const ENV_PRESETS = {
  commercial: EQUIPMENT.filter(e => !['trapBar', 'ssb', 'ghd', 'landmine', 'trx', 'medBall'].includes(e)),
  bodybuilding: EQUIPMENT.slice(),
  powerlifting: ['barbell', 'ezbar', 'trapBar', 'ssb', 'dumbbell', 'kettlebell', 'bands', 'dipBelt', 'flatBench', 'adjBench', 'rack', 'pullupBar', 'dipStation', 'ghd', 'backExtBench', 'landmine', 'box', 'cable', 'latPulldown', 'legPress', 'legExt', 'lyingCurl'],
  studio: ['dumbbell', 'kettlebell', 'bands', 'adjBench', 'pullupBar', 'cable', 'smith', 'legPress', 'chestPress', 'rowMachine', 'legExt', 'seatedCurl', 'medBall', 'trx', 'box'],
  home: ['barbell', 'ezbar', 'dumbbell', 'kettlebell', 'bands', 'adjBench', 'rack', 'pullupBar', 'dipStation', 'dipBelt'],
  homeWorkout: ['dumbbell', 'bands', 'pullupBar', 'abWheel'],
  hotel: ['dumbbell', 'adjBench', 'cable', 'smith', 'chestPress', 'legPress'],
  none: []
};
const ENV_TYPES = ['commercial', 'bodybuilding', 'powerlifting', 'studio', 'home', 'homeWorkout', 'hotel', 'none'];
const DEFAULT_BANDS = [['xlight', 5], ['light', 10], ['medium', 18], ['heavy', 28], ['xheavy', 40]];   // [key, kg resistance]

/* ---- Injury locations (body map) → joint codes used by exercises ---- */
const INJURY_LOCS = [
  ['neck', 'N'], ['leftShoulder', 'S'], ['rightShoulder', 'S'], ['leftShoulderBlade', 'T'], ['rightShoulderBlade', 'T'], ['leftChest', 'C'], ['rightChest', 'C'],
  ['leftUpperArm', 'S'], ['rightUpperArm', 'S'], ['leftElbow', 'E'], ['rightElbow', 'E'], ['leftForearm', 'E'], ['rightForearm', 'E'],
  ['leftWrist', 'W'], ['rightWrist', 'W'], ['leftHand', 'W'], ['rightHand', 'W'], ['upperBack', 'T'], ['lowerBack', 'B'],
  ['leftHip', 'H'], ['rightHip', 'H'], ['leftGroin', 'H'], ['rightGroin', 'H'], ['leftButtock', 'H'], ['rightButtock', 'H'],
  ['leftThigh', 'K'], ['rightThigh', 'K'], ['leftKnee', 'K'], ['rightKnee', 'K'], ['leftShin', 'A'], ['rightShin', 'A'],
  ['leftLowerLeg', 'A'], ['rightLowerLeg', 'A'], ['leftAnkle', 'A'], ['rightAnkle', 'A'], ['leftFoot', 'A'], ['rightFoot', 'A']
];
const SEVERITIES = ['veryMild', 'mild', 'moderate', 'severe', 'verySevere'];

/* Training programs offered in "Recent training / program" */
const PROGRAMS = [
  ['ppl', 'Push / Pull / Legs', 'Potisk / Poteg / Noge'], ['ul', 'Upper / Lower (4 days)', 'Zgornji / spodnji (4 dni)'],
  ['fb3', 'Full body 3× per week', 'Celo telo 3× tedensko'], ['bro', 'Bro split (one body part per day)', 'Bro split (en del telesa na dan)'],
  ['5x5', 'Strength 5×5', 'Moč 5×5'], ['531', '5/3/1', '5/3/1'], ['pl', 'Powerlifting program', 'Powerlifting program'],
  ['hyp', 'Evidence-based hypertrophy program', 'Znanstveno podprt hipertrofijski program'], ['cal', 'Calisthenics / bodyweight', 'Kalistenika / lastna teža'],
  ['cf', 'CrossFit / functional training', 'CrossFit / funkcionalni trening'], ['beg', 'Beginner program', 'Program za začetnike'], ['coach', 'Program from a coach', 'Program trenerja']
];

/* ------------------------------------------------------------
 * Exercises
 *  req   'a+b' = needs a AND b, 'a|b' = a OR b          load  barbell | dumbbell | machine | cable | bw | band
 *  type  heavy | compound | iso                           setup 1 fastest … 3 slowest;  ev 1–5 evidence score
 *  reps  natural rep range                                r     e1RM / bodyweight (intermediate male);  inc  smallest step (kg)
 *  j     joints stressed: N neck S shoulder T upper back/scapula C chest E elbow W wrist B low back H hip K knee A ankle
 *  bw    fraction of bodyweight moved (bodyweight moves)  rtf   reps to failure with bodyweight (intermediate)
 *  assist true = load is assistance (subtracted)          uni   unilateral   bar 'ez' | 'trap' | 'ssb'   multi  multi-joint
 * ------------------------------------------------------------ */
const EXERCISES = [];
function X(id, en, sl, m, sec, req, load, type, setup, ev, reps, r, inc, j, o = {}) {
  const groups = req ? req.split('+').map(g => g.split('|')) : [];
  EXERCISES.push(Object.assign({ id, n: { en, sl }, m, sec, req: groups, load, type, setup, ev, reps, r, inc, j, notes: [], uni: false, multi: type !== 'iso' }, o));
}
const cue = (en, sl) => ({ en, sl });

// ----- UPPER CHEST -----
X('incline_db', 'Incline Dumbbell Bench Press', 'Potisk z ročkami na poševni klopi', 'upperChest', ['lowerChest', 'frontDelts', 'triceps'], 'dumbbell+adjBench', 'dumbbell', 'compound', 2, 5, [8, 12], 0.32, 2, 'SEC', { notes: ['stretch', 'compound'], cue: cue('Bench at ~30°, lower the dumbbells deep to the upper chest, press up and slightly in.', 'Klop na ~30°, ročke spusti globoko do zgornjega dela prsi, potisni gor in rahlo skupaj.') });
X('incline_machine', 'Incline Machine Chest Press', 'Poševni prsni potisk na napravi', 'upperChest', ['lowerChest', 'frontDelts', 'triceps'], 'chestPress|plChestPress', 'machine', 'compound', 1, 4, [8, 12], 0.7, 2.5, 'SEC', { notes: ['stable', 'compound'], cue: cue('Seat so the handles start at upper-chest height, shoulder blades back.', 'Sedež nastavi tako, da so ročaji v višini zgornjega dela prsi, lopatice nazaj.') });
X('smith_incline', 'Smith Machine Incline Press', 'Poševni potisk na Smith napravi', 'upperChest', ['frontDelts', 'triceps'], 'smith+adjBench', 'machine', 'compound', 2, 4, [6, 12], 0.8, 2.5, 'SEC', { notes: ['stable', 'compound'], cue: cue('Bench at 30°, bar touches the upper chest.', 'Klop na 30°, palica se dotakne zgornjega dela prsi.') });
X('incline_bb', 'Incline Barbell Bench Press', 'Poševni potisk s palico', 'upperChest', ['frontDelts', 'triceps'], 'barbell+adjBench+rack', 'barbell', 'heavy', 3, 4, [5, 10], 0.8, 2.5, 'SEC', { notes: ['compound'], cue: cue('Bench at 30°, feet planted, bar to the upper chest, use safeties.', 'Klop na 30°, stopala na tleh, palica do zgornjega dela prsi, uporabi varovala.') });
X('landmine_press', 'Landmine Press', 'Potisk z landmine', 'upperChest', ['frontDelts', 'triceps'], 'landmine+barbell', 'barbell', 'compound', 2, 3, [8, 12], 0.4, 2.5, 'SEC', { uni: true, bar: 'landmine', cue: cue('Half-kneeling, press the bar up and forward.', 'Polkleče, palico potisni gor in naprej.') });
X('low_high_fly', 'Low-to-High Cable Fly', 'Razpiranje na kablih od spodaj navzgor', 'upperChest', [], 'cable|crossover', 'cable', 'iso', 2, 4, [10, 15], 0.2, 2.5, 'SC', { notes: ['tension', 'stretch'], cue: cue('Cables low, sweep up to chin height, feel the stretch at the bottom.', 'Kabla spodaj, zamahni gor do višine brade, začuti razteg spodaj.') });
X('decline_pushup', 'Feet-Elevated Push-Up', 'Sklece z nogami na povišanem', 'upperChest', ['frontDelts', 'triceps'], 'flatBench|adjBench|box', 'bw', 'compound', 1, 3, [8, 20], 0, 2.5, 'SEWC', { bw: 0.7, rtf: 16, notes: ['compound'], cue: cue('Feet on a bench, body straight, chest to the floor.', 'Noge na klopi, telo ravno, prsi do tal.') });
X('band_incline_press', 'Band Incline Press', 'Poševni potisk z elastiko', 'upperChest', ['frontDelts', 'triceps'], 'bands', 'band', 'compound', 1, 2, [12, 20], 0, 0, 'SEC', { cue: cue('Band anchored low behind you, press up and forward.', 'Elastika pritrjena nizko za tabo, potisni gor in naprej.') });

// ----- LOWER / MID CHEST -----
X('machine_press', 'Machine Chest Press', 'Prsni potisk na napravi', 'lowerChest', ['upperChest', 'triceps', 'frontDelts'], 'chestPress|plChestPress', 'machine', 'compound', 1, 4, [6, 12], 0.85, 2.5, 'SEC', { notes: ['stable', 'compound'], cue: cue('Handles at mid-chest, shoulder blades pinched, control the stretch.', 'Ročaji v višini sredine prsi, lopatice skupaj, kontroliran razteg.') });
X('db_bench', 'Flat Dumbbell Bench Press', 'Potisk z ročkami na ravni klopi', 'lowerChest', ['upperChest', 'triceps', 'frontDelts'], 'dumbbell+flatBench|adjBench', 'dumbbell', 'compound', 2, 4, [6, 12], 0.36, 2, 'SEC', { notes: ['stretch', 'compound'], cue: cue('Deep stretch at the bottom, elbows about 45°.', 'Globok razteg spodaj, komolci približno 45°.') });
X('bb_bench', 'Barbell Bench Press', 'Potisk s palico na klopi', 'lowerChest', ['upperChest', 'triceps', 'frontDelts'], 'barbell+flatBench|adjBench+rack', 'barbell', 'heavy', 3, 4, [5, 10], 1.0, 2.5, 'SEWC', { notes: ['compound'], cue: cue('Feet planted, bar to the lower chest, always use safeties.', 'Stopala trdno na tleh, palica do spodnjega dela prsi, uporabi varovala.') });
X('smith_bench', 'Smith Machine Bench Press', 'Potisk na Smith napravi', 'lowerChest', ['triceps', 'frontDelts'], 'smith+flatBench|adjBench', 'machine', 'compound', 2, 3, [6, 12], 0.9, 2.5, 'SEC', { notes: ['stable', 'compound'], cue: cue('Bar to the lower chest, press straight up.', 'Palica do spodnjega dela prsi, potisni naravnost gor.') });
X('dips', 'Dip', 'Potiski na bradlji', 'lowerChest', ['triceps', 'frontDelts'], 'dipStation', 'bw', 'compound', 1, 4, [5, 10], 0, 2.5, 'SEC', { bw: 1.0, rtf: 12, notes: ['stretch', 'compound'], cue: cue('Lean forward slightly, go down until the shoulders are below the elbows.', 'Rahlo nagnjen naprej, spusti se, dokler ramena niso pod komolci.') });
X('assisted_dip', 'Assisted Dip', 'Potiski na bradlji s pomočjo', 'lowerChest', ['triceps', 'frontDelts'], 'assistMachine|bands+dipStation', 'bw', 'compound', 1, 4, [8, 12], 0, 2.5, 'SEC', { bw: 1.0, rtf: 12, assist: true, notes: ['compound'], cue: cue('Knees on the pad or feet in a band; the less assistance, the harder.', 'Kolena na blazini ali stopala v elastiki; manj pomoči = težje.') });
X('deficit_pushup', 'Deficit Push-Up', 'Sklece z globljim razponom', 'lowerChest', ['triceps', 'frontDelts'], '', 'bw', 'compound', 1, 4, [5, 10], 0, 2.5, 'SEWC', { bw: 0.65, rtf: 20, notes: ['stretch', 'compound'], cue: cue('Hands on handles or plates, chest sinks below hand level.', 'Roke na ročajih ali ploščah, prsi se spustijo pod višino dlani.') });
X('pushup', 'Push-Up', 'Sklece', 'lowerChest', ['triceps', 'frontDelts'], '', 'bw', 'compound', 1, 3, [8, 25], 0, 2.5, 'SEWC', { bw: 0.65, rtf: 22, notes: ['compound'], cue: cue('Body straight, chest to the floor.', 'Telo ravno, prsi do tal.') });
X('pec_deck', 'Pec Deck', 'Metuljček (pec deck)', 'lowerChest', ['upperChest'], 'pecDeck', 'machine', 'iso', 1, 4, [10, 15], 0.6, 2.5, 'SC', { notes: ['stable', 'stretch'], cue: cue('Handles in line with mid-chest, deep stretch each rep.', 'Ročaji v liniji s sredino prsi, globok razteg pri vsaki ponovitvi.') });
X('cable_fly', 'Cable Fly', 'Razpiranje na kablih', 'lowerChest', ['upperChest'], 'cable|crossover', 'cable', 'iso', 2, 4, [10, 15], 0.3, 2.5, 'SC', { notes: ['stretch', 'tension'], cue: cue('Slight elbow bend, feel the stretch, squeeze together.', 'Rahlo pokrčeni komolci, začuti razteg, stisni skupaj.') });
X('db_fly', 'Dumbbell Fly', 'Razpiranje z ročkami', 'lowerChest', ['upperChest'], 'dumbbell+flatBench|adjBench', 'dumbbell', 'iso', 2, 3, [10, 15], 0.14, 2, 'SC', { notes: ['stretch'], cue: cue('Open wide with soft elbows, stop at a deep stretch.', 'Široko razpri z mehkimi komolci, ustavi se v globokem raztegu.') });
X('trx_fly', 'Suspension Trainer Fly', 'Razpiranje na TRX', 'lowerChest', ['upperChest'], 'trx', 'bw', 'iso', 1, 3, [8, 15], 0, 2.5, 'SC', { bw: 0.5, rtf: 12, notes: ['stretch'], cue: cue('Lean forward, open the arms, bring the handles together.', 'Nagni se naprej, razpri roke, ročaja pripelji skupaj.') });

// ----- LATS -----
X('lat_pulldown', 'Lat Pulldown', 'Poteg na prsi (lat poteg)', 'lats', ['biceps', 'upperBack'], 'latPulldown|cable', 'cable', 'compound', 1, 4, [8, 12], 0.75, 2.5, 'SET', { notes: ['stable', 'compound'], cue: cue('Full stretch at the top, drive the elbows down to your sides.', 'Poln razteg zgoraj, komolce vleci navzdol ob telo.') });
X('pullup', 'Pull-Up', 'Zgibi', 'lats', ['biceps', 'upperBack'], 'pullupBar', 'bw', 'compound', 1, 4, [5, 10], 0, 2.5, 'SET', { bw: 1.0, rtf: 10, notes: ['compound', 'stretch'], cue: cue('Dead hang at the bottom, chest up to the bar.', 'Popoln vis spodaj, prsi proti drogu.') });
X('weighted_pullup', 'Weighted Pull-Up', 'Zgibi z dodatno obremenitvijo', 'lats', ['biceps', 'upperBack'], 'pullupBar+dipBelt', 'bw', 'heavy', 2, 4, [5, 10], 0, 2.5, 'SET', { bw: 1.0, rtf: 10, notes: ['compound'], cue: cue('Belt loaded, full hang, chest to bar.', 'Pas obremenjen, poln vis, prsi do droga.') });
X('assisted_pullup', 'Assisted Pull-Up', 'Zgibi s pomočjo', 'lats', ['biceps', 'upperBack'], 'assistMachine|bands+pullupBar', 'bw', 'compound', 1, 4, [8, 12], 0, 2.5, 'SET', { bw: 1.0, rtf: 10, assist: true, notes: ['compound'], cue: cue('Knees on the pad or a band under the feet; reduce assistance over time.', 'Kolena na blazini ali elastika pod stopali; pomoč sčasoma zmanjšuj.') });
X('single_arm_pulldown', 'Single-Arm Cable Pulldown', 'Enoročni poteg na kablu', 'lats', ['biceps'], 'cable|latPulldown', 'cable', 'compound', 1, 4, [10, 15], 0.3, 1.25, 'SE', { uni: true, notes: ['stretch', 'tension'], cue: cue('Reach up for a full stretch, pull the elbow to the hip.', 'Iztegni se za poln razteg, komolec vleci proti boku.') });
X('db_row', 'One-Arm Dumbbell Row', 'Enoročno veslanje z ročko', 'lats', ['upperBack', 'biceps'], 'dumbbell+flatBench|adjBench', 'dumbbell', 'compound', 1, 4, [8, 12], 0.45, 2, 'ETB', { uni: true, notes: ['stretch', 'compound'], cue: cue('Support on a bench, pull the dumbbell towards the hip.', 'Opora na klopi, ročko vleci proti boku.') });
X('straight_arm_pulldown', 'Straight-Arm Cable Pulldown', 'Poteg z iztegnjenimi rokami na kablu', 'lats', [], 'cable|latPulldown', 'cable', 'iso', 1, 4, [10, 15], 0.35, 2.5, 'S', { notes: ['tension', 'stretch'], cue: cue('Hinge slightly, arms long, sweep the bar to the thighs.', 'Rahel predklon, roke dolge, palico povleci do stegen.') });
X('db_pullover', 'Dumbbell Pullover', 'Pullover z ročko', 'lats', ['lowerChest'], 'dumbbell+flatBench|adjBench', 'dumbbell', 'iso', 2, 3, [10, 15], 0.3, 2, 'S', { notes: ['stretch'], cue: cue('Arms slightly bent, lower behind the head to a big stretch.', 'Roki rahlo pokrčeni, spusti za glavo do velikega raztega.') });
X('band_pulldown', 'Band Lat Pulldown', 'Poteg z elastiko', 'lats', ['biceps'], 'bands', 'band', 'compound', 1, 2, [12, 20], 0, 0, 'SE', { cue: cue('Band anchored high, pull the elbows down to your sides.', 'Elastika pritrjena visoko, komolce vleci navzdol ob telo.') });

// ----- UPPER BACK -----
X('cs_row', 'Chest-Supported Machine Row', 'Veslanje na napravi z oporo za prsi', 'upperBack', ['lats', 'rearDelts', 'biceps'], 'rowMachine|plRow', 'machine', 'compound', 1, 4, [8, 12], 0.8, 2.5, 'ET', { notes: ['stable', 'compound'], cue: cue('Chest on the pad, let the shoulder blades stretch forward.', 'Prsi na blazini, lopatice naj se raztegnejo naprej.') });
X('cable_row', 'Seated Cable Row', 'Veslanje sede na kablu', 'upperBack', ['lats', 'biceps'], 'cableRow|cable', 'cable', 'compound', 1, 4, [8, 12], 0.8, 2.5, 'ETB', { notes: ['stable', 'compound'], cue: cue('Tall torso, reach forward, row to the belly.', 'Pokončen trup, iztegni se naprej, vleci proti trebuhu.') });
X('incline_db_row', 'Chest-Supported Dumbbell Row', 'Veslanje z ročkami na poševni klopi', 'upperBack', ['lats', 'rearDelts'], 'dumbbell+adjBench', 'dumbbell', 'compound', 2, 4, [8, 12], 0.3, 2, 'ET', { notes: ['stable', 'compound'], cue: cue('Chest on an incline bench, elbows out ~45°.', 'Prsi na poševni klopi, komolci navzven ~45°.') });
X('tbar_row', 'T-Bar Row', 'Veslanje s T-palico', 'upperBack', ['lats', 'biceps', 'rearDelts'], 'tbar|landmine+barbell', 'barbell', 'compound', 2, 4, [8, 12], 0.7, 2.5, 'ETB', { bar: 'tbar', notes: ['compound'], cue: cue('Chest up, pull the handle to the sternum.', 'Prsi gor, ročaj vleci proti prsnici.') });
X('inverted_row', 'Inverted Row', 'Obrnjeno veslanje', 'upperBack', ['lats', 'biceps', 'rearDelts'], 'rack|smith|trx', 'bw', 'compound', 2, 3, [5, 10], 0, 2.5, 'ET', { bw: 0.6, rtf: 14, notes: ['compound'], cue: cue('Bar at hip height, body straight, pull the chest to the bar.', 'Palica v višini bokov, telo ravno, prsi vleci do palice.') });
X('bb_row', 'Barbell Row', 'Veslanje s palico', 'upperBack', ['lats', 'biceps', 'rearDelts'], 'barbell', 'barbell', 'heavy', 2, 3, [6, 10], 0.85, 2.5, 'ETB', { notes: ['compound'], cue: cue('Hinge to ~45°, neutral spine, bar to the lower ribs.', 'Predklon ~45°, nevtralna hrbtenica, palica do spodnjih reber.') });
X('band_row', 'Band Row', 'Veslanje z elastiko', 'upperBack', ['lats', 'biceps'], 'bands', 'band', 'compound', 1, 2, [12, 20], 0, 0, 'ET', { cue: cue('Band around the feet or an anchor, row to the belly.', 'Elastika okoli stopal ali sidra, vleci proti trebuhu.') });
X('face_pull', 'Cable Face Pull', 'Poteg k obrazu na kablu', 'upperBack', ['rearDelts'], 'cable|crossover', 'cable', 'iso', 1, 4, [12, 20], 0.3, 2.5, 'ST', { notes: ['tension'], cue: cue('Rope at face height, pull towards the eyes with the elbows high.', 'Vrv v višini obraza, vleci k očem s komolci visoko.') });

// ----- UPPER TRAPS -----
X('db_shrug', 'Seated Dumbbell Shrug', 'Dvig ramen z ročkami sede', 'upperTraps', [], 'dumbbell', 'dumbbell', 'iso', 1, 4, [8, 12], 0.45, 2, 'NT', { notes: ['compound_time'], cue: cue('Shrug straight up towards the ears, pause, lower slowly.', 'Ramena dvigni naravnost proti ušesom, zadrži, spuščaj počasi.') });
X('cable_shrug', 'Cable Shrug', 'Dvig ramen na kablu', 'upperTraps', [], 'cable', 'cable', 'iso', 1, 3, [10, 15], 0.5, 2.5, 'NT', { notes: ['tension'], cue: cue('Stand close to the cable, shrug up and slightly back.', 'Stoj blizu kabla, ramena dvigni gor in rahlo nazaj.') });
X('bb_shrug', 'Barbell Shrug', 'Dvig ramen s palico', 'upperTraps', [], 'barbell|trapBar', 'barbell', 'iso', 2, 3, [8, 12], 1.0, 2.5, 'NTB', { bar: 'trap', cue: cue('Straight arms, shrug straight up, no rolling.', 'Iztegnjene roke, ramena naravnost gor, brez kroženja.') });

// ----- FRONT DELTS -----
X('machine_ohp', 'Machine Shoulder Press', 'Ramenski potisk na napravi', 'frontDelts', ['sideDelts', 'triceps'], 'shoulderPress', 'machine', 'compound', 1, 4, [8, 12], 0.6, 2.5, 'SE', { notes: ['stable', 'compound'], cue: cue('Handles at chin height at the bottom, press up.', 'Ročaji spodaj v višini brade, potisni gor.') });
X('smith_ohp', 'Seated Smith Overhead Press', 'Potisk nad glavo sede na Smith napravi', 'frontDelts', ['sideDelts', 'triceps'], 'smith+adjBench', 'machine', 'compound', 2, 4, [5, 10], 0.55, 2.5, 'SE', { notes: ['stable', 'compound'], cue: cue('Upright bench, bar in front of the face, lower to the chin.', 'Pokončna klop, palica pred obrazom, spusti do brade.') });
X('db_ohp', 'Seated Dumbbell Shoulder Press', 'Ramenski potisk z ročkami sede', 'frontDelts', ['sideDelts', 'triceps'], 'dumbbell+adjBench', 'dumbbell', 'compound', 2, 4, [5, 10], 0.25, 2, 'SE', { notes: ['compound'], cue: cue('Back supported, lower the dumbbells to ear level.', 'Hrbet podprt, ročke spusti do višine ušes.') });
X('ohp', 'Overhead Press', 'Potisk s palico nad glavo', 'frontDelts', ['sideDelts', 'triceps'], 'barbell+rack', 'barbell', 'heavy', 2, 3, [5, 10], 0.65, 2.5, 'SEB', { notes: ['compound'], cue: cue('Glutes tight, bar path close to the face.', 'Stisnjena zadnjica, palica tik ob obrazu.') });
X('pike_pushup', 'Pike Push-Up', 'Pike sklece', 'frontDelts', ['triceps'], '', 'bw', 'compound', 1, 3, [6, 15], 0, 2.5, 'SEW', { bw: 0.5, rtf: 12, cue: cue('Hips high, lower the head between the hands.', 'Boki visoko, glavo spusti med dlani.') });
X('band_ohp', 'Band Overhead Press', 'Potisk nad glavo z elastiko', 'frontDelts', ['sideDelts', 'triceps'], 'bands', 'band', 'compound', 1, 2, [12, 20], 0, 0, 'SE', { cue: cue('Stand on the band, press overhead.', 'Stoj na elastiki, potisni nad glavo.') });

// ----- SIDE DELTS -----
X('cable_lateral', 'Standing Cable Lateral Raise', 'Stranski dvig na kablu stoje', 'sideDelts', [], 'cable|crossover', 'cable', 'iso', 1, 5, [12, 20], 0.07, 1.25, 'S', { uni: true, notes: ['tension', 'stretch'], cue: cue('Cable behind the body, lead with the elbow.', 'Kabel za telesom, vodi s komolcem.') });
X('machine_lateral', 'Seated Machine Lateral Raise', 'Stranski dvig na napravi sede', 'sideDelts', [], 'lateralRaise', 'machine', 'iso', 1, 4, [10, 15], 0.35, 2.5, 'S', { notes: ['stable', 'tension'], cue: cue('Pads on the outside of the elbows, control the negative.', 'Blazini na zunanji strani komolcev, kontroliraj spust.') });
X('db_lateral', 'Dumbbell Lateral Raise', 'Stranski dvig z ročkami', 'sideDelts', [], 'dumbbell', 'dumbbell', 'iso', 1, 4, [12, 20], 0.1, 1, 'S', { notes: ['compound_time'], cue: cue('Slight lean forward, raise to shoulder height.', 'Rahel nagib naprej, dvigni do višine ramen.') });
X('band_lateral', 'Band Lateral Raise', 'Stranski dvig z elastiko', 'sideDelts', [], 'bands', 'band', 'iso', 1, 3, [15, 25], 0, 0, 'S', { cue: cue('Stand on the band, raise to shoulder height.', 'Stoj na elastiki, dvigni do višine ramen.') });

// ----- REAR DELTS -----
X('reverse_pec_deck', 'Reverse Pec Deck', 'Obrnjeni metuljček', 'rearDelts', ['upperBack'], 'pecDeck', 'machine', 'iso', 1, 4, [12, 20], 0.4, 2.5, 'S', { notes: ['stable'], cue: cue('Arms wide, sweep back, do not squeeze the shoulder blades.', 'Roke široko, zamahni nazaj, ne stiskaj lopatic.') });
X('cable_rear_fly', 'Rear Delt Cable Crossover', 'Razpiranje za zadnje rame na kablih', 'rearDelts', ['upperBack'], 'cable|crossover', 'cable', 'iso', 2, 4, [12, 20], 0.08, 1.25, 'S', { notes: ['tension', 'stretch'], cue: cue('Cross the cables, pull out and back.', 'Prekriži kabla, vleci navzven in nazaj.') });
X('db_rear_fly', 'Chest-Supported Rear Delt Raise', 'Dvig za zadnje rame z oporo za prsi', 'rearDelts', ['upperBack'], 'dumbbell+adjBench', 'dumbbell', 'iso', 1, 3, [12, 20], 0.08, 1, 'S', { notes: ['stable'], cue: cue('Chest on an incline bench, raise the arms out wide.', 'Prsi na poševni klopi, roke dvigni široko vstran.') });
X('band_pullapart', 'Band Pull-Apart', 'Razpiranje elastike', 'rearDelts', ['upperBack'], 'bands', 'band', 'iso', 1, 3, [15, 25], 0, 0, 'S', { cue: cue('Arms straight at shoulder height, pull the band apart to the chest.', 'Roke iztegnjene v višini ramen, elastiko razpri do prsi.') });

// ----- NECK -----
X('plate_neck_curl', 'Plate Neck Curl', 'Upogib vratu z utežno ploščo', 'neckFlexors', [], 'flatBench|adjBench', 'machine', 'iso', 1, 3, [10, 20], 0.1, 1.25, 'N', { cue: cue('Lie on a bench, plate on the forehead (on a towel), slow curls.', 'Leži na klopi, plošča na čelu (na brisači), počasni upogibi.') });
X('band_neck_flex', 'Band Neck Flexion', 'Upogib vratu z elastiko', 'neckFlexors', [], 'bands', 'band', 'iso', 1, 2, [12, 20], 0, 0, 'N', { cue: cue('Band around the forehead anchored behind, nod the chin down.', 'Elastika okoli čela, pritrjena zadaj, brado pokimaj navzdol.') });
X('neck_ext', 'Plate Neck Extension', 'Iztegovanje vratu z utežno ploščo', 'neckExtensors', ['upperTraps'], 'flatBench|adjBench', 'machine', 'iso', 1, 3, [10, 20], 0.12, 1.25, 'N', { cue: cue('Lie face down, plate behind the head, slow extensions.', 'Leži na trebuhu, plošča za glavo, počasna iztegovanja.') });
X('band_neck_ext', 'Band Neck Extension', 'Iztegovanje vratu z elastiko', 'neckExtensors', [], 'bands', 'band', 'iso', 1, 2, [12, 20], 0, 0, 'N', { cue: cue('Band around the back of the head anchored in front, look up.', 'Elastika za glavo, pritrjena spredaj, poglej navzgor.') });

// ----- BICEPS -----
X('bayesian_curl', 'Bayesian Cable Curl', 'Bayesian upogib na kablu', 'biceps', [], 'cable|crossover', 'cable', 'iso', 1, 5, [10, 15], 0.12, 1.25, 'E', { uni: true, notes: ['stretch', 'tension'], cue: cue('Face away from the cable, arm behind the body for a long stretch.', 'Obrnjen stran od kabla, roka za telesom za dolg razteg.') });
X('incline_curl', 'Incline Dumbbell Curl', 'Upogib z ročkami na poševni klopi', 'biceps', [], 'dumbbell+adjBench', 'dumbbell', 'iso', 2, 5, [8, 15], 0.11, 1, 'ES', { notes: ['stretch'], cue: cue('Bench at ~45°, arms hang straight down, no swinging.', 'Klop na ~45°, roki visita navpično, brez zamahovanja.') });
X('ez_preacher', 'EZ-Bar Preacher Curl', 'Scott upogib z EZ palico', 'biceps', [], 'ezbar+preacherBench', 'barbell', 'iso', 2, 4, [8, 12], 0.3, 2.5, 'EW', { bar: 'ez', notes: ['stretch'], cue: cue('Armpits tight on the pad, full extension at the bottom.', 'Pazduhe tesno ob blazini, popolna iztegnitev spodaj.') });
X('preacher_machine', 'Machine Preacher Curl', 'Scott upogib na napravi', 'biceps', [], 'preacherMachine', 'machine', 'iso', 1, 4, [8, 15], 0.3, 2.5, 'E', { notes: ['stable', 'stretch'], cue: cue('Elbows on the pad, control the stretch.', 'Komolci na blazini, kontroliraj razteg.') });
X('db_curl', 'Dumbbell Curl', 'Upogib z ročkami', 'biceps', [], 'dumbbell', 'dumbbell', 'iso', 1, 3, [8, 15], 0.13, 1, 'EW', { cue: cue('Elbows fixed at the sides, supinate at the top.', 'Komolci pri miru ob telesu, zgoraj obrni dlan navzgor.') });
X('ez_curl', 'EZ-Bar Curl', 'Upogib z EZ palico', 'biceps', [], 'ezbar|barbell', 'barbell', 'iso', 1, 3, [8, 12], 0.35, 2.5, 'EW', { bar: 'ez', cue: cue('No body swing, lower under control.', 'Brez zibanja telesa, spuščaj kontrolirano.') });
X('band_curl', 'Band Curl', 'Upogib z elastiko', 'biceps', [], 'bands', 'band', 'iso', 1, 2, [12, 20], 0, 0, 'E', { cue: cue('Stand on the band, curl with the elbows fixed.', 'Stoj na elastiki, upogibaj s komolci pri miru.') });
X('chinup', 'Chin-Up', 'Zgibi s podprijemom', 'biceps', ['lats', 'upperBack'], 'pullupBar', 'bw', 'compound', 1, 4, [5, 10], 0, 2.5, 'SET', { bw: 1.0, rtf: 10, notes: ['compound', 'stretch'], cue: cue('Underhand grip, full hang, chin over the bar.', 'Podprijem, poln vis, brada nad drogom.') });

// ----- TRICEPS -----
X('oh_cable_ext', 'Overhead Cable Triceps Extension', 'Iztegovanje za triceps nad glavo na kablu', 'triceps', [], 'cable|crossover', 'cable', 'iso', 2, 5, [10, 15], 0.3, 2.5, 'ES', { notes: ['overhead', 'stretch'], cue: cue('Face away from the cable, elbows by the head, deep stretch.', 'Obrnjen stran od kabla, komolci ob glavi, globok razteg.') });
X('db_oh_ext', 'Seated Dumbbell Overhead Extension', 'Iztegovanje z ročko nad glavo sede', 'triceps', [], 'dumbbell', 'dumbbell', 'iso', 1, 4, [10, 15], 0.25, 2, 'ES', { notes: ['overhead', 'stretch'], cue: cue('Hold one dumbbell with both hands, lower it deep behind the head.', 'Eno ročko drži z obema rokama, spusti globoko za glavo.') });
X('skullcrusher', 'EZ-Bar Skull Crusher', 'Francoski potisk z EZ palico', 'triceps', [], 'ezbar|barbell+flatBench|adjBench', 'barbell', 'iso', 2, 4, [8, 12], 0.35, 2.5, 'E', { bar: 'ez', notes: ['stretch'], cue: cue('Lower the bar behind the head, keep the elbows narrow.', 'Palico spusti za glavo, komolci ozko.') });
X('pushdown', 'Cable Triceps Pushdown', 'Potisk za triceps na kablu', 'triceps', [], 'cable|crossover', 'cable', 'iso', 1, 3, [10, 15], 0.35, 2.5, 'E', { notes: ['stable'], cue: cue('Elbows pinned to the sides, full lockout.', 'Komolci ob telesu, popolna iztegnitev.') });
X('band_pushdown', 'Band Pushdown', 'Potisk za triceps z elastiko', 'triceps', [], 'bands', 'band', 'iso', 1, 2, [12, 20], 0, 0, 'E', { cue: cue('Band anchored high, elbows at the sides, press down.', 'Elastika pritrjena visoko, komolci ob telesu, potisni navzdol.') });
X('diamond_pushup', 'Diamond Push-Up', 'Diamantne sklece', 'triceps', ['lowerChest'], '', 'bw', 'compound', 1, 3, [6, 20], 0, 2.5, 'EW', { bw: 0.6, rtf: 15, cue: cue('Hands together under the chest, elbows back.', 'Dlani skupaj pod prsmi, komolci nazaj.') });
X('bench_dip', 'Bench Dip', 'Potiski ob klopi', 'triceps', ['lowerChest'], 'flatBench|adjBench|box', 'bw', 'compound', 1, 2, [10, 20], 0, 2.5, 'SE', { bw: 0.55, rtf: 18, cue: cue('Hands on the bench behind you, lower until the elbows are at 90°.', 'Dlani na klopi za tabo, spusti se do 90° v komolcih.') });

// ----- FOREARMS -----
X('db_wrist_curl', 'Dumbbell Wrist Curl', 'Upogib zapestja z ročkami', 'forearmFlexors', [], 'dumbbell', 'dumbbell', 'iso', 1, 4, [12, 20], 0.1, 1, 'W', { notes: ['stretch'], cue: cue('Forearms on the thighs, let the dumbbell roll to the fingertips.', 'Podlakti na stegnih, ročka naj se odkotali do konic prstov.') });
X('cable_wrist_curl', 'Cable Wrist Curl', 'Upogib zapestja na kablu', 'forearmFlexors', [], 'cable', 'cable', 'iso', 1, 3, [12, 20], 0.15, 1.25, 'W', { notes: ['tension'], cue: cue('Kneel facing the cable, forearms on the thighs.', 'Kleči obrnjen h kablu, podlakti na stegnih.') });
X('bb_wrist_curl', 'Barbell Wrist Curl', 'Upogib zapestja s palico', 'forearmFlexors', [], 'barbell|ezbar', 'barbell', 'iso', 2, 3, [12, 20], 0.3, 2.5, 'W', { bar: 'ez', cue: cue('Forearms on the bench, full range of motion.', 'Podlakti na klopi, poln obseg giba.') });
X('reverse_wrist_curl', 'Dumbbell Reverse Wrist Curl', 'Obrnjeni upogib zapestja z ročkami', 'forearmExtensors', [], 'dumbbell', 'dumbbell', 'iso', 1, 3, [12, 20], 0.06, 1, 'W', { cue: cue('Palms down, forearms supported, lift the knuckles up.', 'Dlani navzdol, podlakti podprte, členke dvigni gor.') });
X('reverse_curl', 'EZ-Bar Reverse Curl', 'Obrnjeni upogib z EZ palico', 'forearmExtensors', ['biceps'], 'ezbar|barbell', 'barbell', 'iso', 1, 3, [10, 15], 0.25, 2.5, 'EW', { bar: 'ez', cue: cue('Overhand grip, elbows at the sides, curl.', 'Nadprijem, komolci ob telesu, upogni.') });
X('band_reverse_curl', 'Band Reverse Curl', 'Obrnjeni upogib z elastiko', 'forearmExtensors', ['biceps'], 'bands', 'band', 'iso', 1, 2, [15, 25], 0, 0, 'EW', { cue: cue('Overhand grip on the band, curl.', 'Nadprijem elastike, upogni.') });

// ----- ABS -----
X('cable_crunch', 'Cable Crunch', 'Trebušnjaki na kablu', 'abs', [], 'cable', 'cable', 'iso', 1, 4, [10, 15], 0.6, 2.5, 'B', { notes: ['stable'], cue: cue('Round the spine, crunch the elbows to the thighs.', 'Zaokroži hrbtenico, komolce pripelji do stegen.') });
X('machine_crunch', 'Machine Crunch', 'Trebušnjaki na napravi', 'abs', [], 'abCrunch', 'machine', 'iso', 1, 4, [10, 15], 0.5, 2.5, 'B', { notes: ['stable'], cue: cue('Exhale and crunch, control the way back.', 'Izdihni in se zvij, kontroliraj nazaj.') });
X('ab_rollout', 'Ab Roll Out', 'Valjček za trebušne', 'abs', [], 'abWheel|barbell', 'bw', 'iso', 1, 4, [5, 10], 0, 2.5, 'BS', { bw: 0.5, rtf: 10, notes: ['stretch'], cue: cue('From the knees, roll out as far as you can keep the back flat.', 'S kolen se zapelji čim dlje, dokler hrbet ostane raven.') });
X('hanging_raise', 'Hanging Leg Raise', 'Dvig nog v visi', 'abs', [], 'pullupBar', 'bw', 'iso', 1, 4, [8, 15], 0, 2.5, 'S', { bw: 0.35, rtf: 12, cue: cue('Curl the pelvis up, no swinging.', 'Medenico zavij navzgor, brez zibanja.') });
X('crunch', 'Crunch', 'Trebušnjaki (crunch)', 'abs', [], '', 'bw', 'iso', 1, 3, [12, 25], 0, 2.5, 'N', { bw: 0.3, rtf: 25, cue: cue('Lower back stays down, curl the ribs to the pelvis.', 'Križ ostane na tleh, rebra pripelji k medenici.') });
X('medball_slam', 'Medicine Ball Slam', 'Met medicinke v tla', 'abs', ['obliques', 'lats'], 'medBall', 'dumbbell', 'iso', 1, 2, [10, 15], 0.15, 1, 'SB', { cue: cue('Reach overhead, slam the ball down with the whole body.', 'Iztegni se nad glavo, žogo vrzi v tla s celim telesom.') });

// ----- OBLIQUES -----
X('db_side_bend', 'Dumbbell Side Bend', 'Stranski predklon z ročko', 'obliques', [], 'dumbbell', 'dumbbell', 'iso', 1, 3, [10, 15], 0.35, 2, 'B', { uni: true, notes: ['stretch'], cue: cue('Lean to the dumbbell side for a stretch, then bend the other way.', 'Nagni se proti ročki do raztega, nato na drugo stran.') });
X('cable_woodchop', 'Cable Woodchop', 'Sekanje na kablu', 'obliques', ['abs'], 'cable|crossover', 'cable', 'iso', 1, 3, [10, 15], 0.25, 2.5, 'B', { uni: true, notes: ['tension'], cue: cue('Rotate from the torso, arms stay long.', 'Zasukaj se iz trupa, roke ostanejo dolge.') });
X('side_crunch', 'Side-Lying Oblique Crunch', 'Stranski trebušnjaki leže', 'obliques', [], '', 'bw', 'iso', 1, 2, [12, 25], 0, 2.5, 'B', { uni: true, bw: 0.25, rtf: 25, cue: cue('Lie on the side, crunch the ribs towards the hip.', 'Leži na boku, rebra približaj boku.') });
X('band_rotation', 'Band Torso Rotation', 'Rotacija trupa z elastiko', 'obliques', ['abs'], 'bands', 'band', 'iso', 1, 2, [12, 20], 0, 0, 'B', { uni: true, cue: cue('Band anchored at chest height, rotate away from the anchor.', 'Elastika pritrjena v višini prsi, zasukaj se stran od sidra.') });

// ----- ERECTORS -----
X('back_ext', 'Back Extension', 'Hiperekstenzija', 'erectors', ['gluteMax', 'hamstrings'], 'backExtBench|ghd', 'bw', 'iso', 1, 4, [10, 15], 0, 2.5, 'B', { bw: 0.5, rtf: 15, notes: ['stretch'], cue: cue('Round down slowly, extend to a straight line, hold a plate if needed.', 'Počasi se zaokroži navzdol, iztegni do ravne linije, po potrebi drži ploščo.') });
X('cable_pullthrough', 'Cable Pullthrough', 'Poteg med nogami na kablu', 'erectors', ['gluteMax', 'hamstrings'], 'cable', 'cable', 'compound', 1, 3, [10, 15], 0.6, 2.5, 'BH', { notes: ['tension'], cue: cue('Face away, hinge back with a long spine, drive the hips through.', 'Obrnjen stran, predkloni se z ravno hrbtenico, boke potisni naprej.') });
X('superman', 'Superman', 'Superman', 'erectors', ['gluteMax'], '', 'bw', 'iso', 1, 2, [12, 25], 0, 2.5, 'B', { bw: 0.25, rtf: 20, cue: cue('Lie face down, lift chest and legs, pause.', 'Leži na trebuhu, dvigni prsi in noge, zadrži.') });
X('good_morning', 'Barbell Good Morning', 'Dobro jutro s palico', 'erectors', ['hamstrings', 'gluteMax'], 'barbell|ssb+rack', 'barbell', 'compound', 2, 3, [8, 12], 0.5, 2.5, 'BH', { bar: 'ssb', notes: ['stretch'], cue: cue('Bar on the back, hinge with a long spine, soft knees.', 'Palica na hrbtu, predklon z ravno hrbtenico, mehka kolena.') });

// ----- QUADS -----
X('hack_squat', 'Hack Squat', 'Hack počep', 'quads', ['gluteMax'], 'hackSquat', 'machine', 'heavy', 2, 5, [6, 12], 1.4, 5, 'KH', { notes: ['depth', 'stable'], cue: cue('Feet mid-platform, go as deep as possible.', 'Stopala na sredini, spusti se čim globlje.') });
X('leg_press', 'Low Foot Placement Seated Leg Press', 'Nožna preša z nizko postavitvijo stopal', 'quads', ['gluteMax'], 'legPress', 'machine', 'compound', 1, 4, [10, 15], 2.2, 5, 'KH', { notes: ['stable'], cue: cue('Low foot placement, knees deep, lower back stays on the pad.', 'Stopala nizko, globoko v kolenih, križ ostane na blazini.') });
X('leg_ext', 'Leg Extension', 'Iztegovanje nog', 'quads', [], 'legExt', 'machine', 'iso', 1, 4, [10, 15], 0.7, 2.5, 'K', { notes: ['rf', 'stable'], cue: cue('Lean back slightly, control the bottom stretch.', 'Rahlo se nasloni nazaj, kontroliraj spodnji razteg.') });
X('bb_squat', 'Barbell High Bar Squat', 'Počep s palico (visoka palica)', 'quads', ['gluteMax', 'adductors'], 'barbell+rack', 'barbell', 'heavy', 3, 5, [5, 10], 1.3, 2.5, 'KHB', { notes: ['depth', 'compound'], cue: cue('Brace, sit down between the heels, full depth.', 'Napni trup, sedi med pete, polna globina.') });
X('ssb_squat', 'Safety Bar Squat', 'Počep z varnostno palico', 'quads', ['gluteMax', 'erectors'], 'ssb+rack', 'barbell', 'heavy', 3, 4, [5, 10], 1.2, 2.5, 'KHB', { bar: 'ssb', notes: ['depth', 'compound'], cue: cue('Handles in front, stay upright, full depth.', 'Ročaja spredaj, ostani pokončen, polna globina.') });
X('smith_squat', 'Smith Machine Squat', 'Počep na Smith napravi', 'quads', ['gluteMax'], 'smith', 'machine', 'heavy', 2, 4, [6, 12], 1.2, 2.5, 'KH', { notes: ['depth', 'stable'], cue: cue('Feet slightly forward, deep and controlled.', 'Stopala rahlo naprej, globoko in kontrolirano.') });
X('sissy_squat', 'Sissy Squat', 'Sissy počep', 'quads', [], '', 'bw', 'iso', 1, 3, [8, 15], 0, 2.5, 'K', { bw: 0.7, rtf: 12, notes: ['stretch', 'rf'], cue: cue('Hold onto something, knees travel forward, lean back.', 'Drži se opore, kolena gredo naprej, nagni se nazaj.') });
X('reverse_nordic', 'Reverse Nordic', 'Obrnjeni nordijski upogib', 'quads', [], '', 'bw', 'iso', 1, 3, [6, 12], 0, 2.5, 'K', { bw: 0.5, rtf: 10, notes: ['stretch', 'rf'], cue: cue('Kneel upright, lean back with straight hips, return.', 'Kleči pokončno, nagni se nazaj z iztegnjenimi boki, vrni se.') });
X('goblet_squat', 'Goblet Squat', 'Goblet počep', 'quads', ['gluteMax', 'adductors'], 'dumbbell|kettlebell', 'dumbbell', 'compound', 1, 3, [8, 15], 0.5, 2, 'KH', { notes: ['depth'], cue: cue('Dumbbell at the chest, elbows inside the knees.', 'Ročka ob prsih, komolci znotraj kolen.') });
X('trap_deadlift', 'Trap Bar Deadlift', 'Mrtvi dvig s trap palico', 'quads', ['gluteMax', 'hamstrings', 'erectors', 'upperTraps'], 'trapBar', 'barbell', 'heavy', 2, 4, [5, 10], 1.6, 2.5, 'KHB', { bar: 'trap', notes: ['compound'], cue: cue('Hips down, chest up, push the floor away.', 'Boki dol, prsi gor, odrini tla.') });
X('step_up', 'Dumbbell Step-Up', 'Stopanje na klop z ročkami', 'quads', ['gluteMax'], 'dumbbell+box|flatBench', 'dumbbell', 'compound', 1, 3, [8, 12], 0.25, 2, 'KH', { uni: true, cue: cue('Knee-high box, drive through the whole foot, control the way down.', 'Škatla v višini kolena, odrini s celim stopalom, kontroliraj spust.') });
X('band_squat', 'Band Squat', 'Počep z elastiko', 'quads', ['gluteMax'], 'bands', 'band', 'compound', 1, 2, [12, 20], 0, 0, 'KH', { cue: cue('Stand on the band, band over the shoulders, squat deep.', 'Stoj na elastiki, elastika čez ramena, globok počep.') });

// ----- HAMSTRINGS -----
X('seated_leg_curl', 'Seated Leg Curl', 'Upogib nog sede', 'hamstrings', [], 'seatedCurl', 'machine', 'iso', 1, 5, [8, 15], 0.6, 2.5, 'K', { notes: ['seatedcurl', 'stable'], cue: cue('Lean forward over the thighs for more stretch.', 'Nagni se naprej nad stegna za večji razteg.') });
X('lying_leg_curl', 'Lying Leg Curl', 'Upogib nog leže', 'hamstrings', [], 'lyingCurl', 'machine', 'iso', 1, 4, [8, 15], 0.5, 2.5, 'K', { notes: ['stable'], cue: cue('Hips pressed down, full range.', 'Boki pritisnjeni ob blazino, poln obseg.') });
X('rdl', 'Romanian Deadlift', 'Romunski mrtvi dvig', 'hamstrings', ['gluteMax', 'erectors'], 'barbell|trapBar', 'barbell', 'heavy', 2, 4, [6, 10], 1.2, 2.5, 'BH', { bar: 'trap', notes: ['stretch', 'compound'], cue: cue('Push the hips back, soft knees, stop at a hamstring stretch.', 'Boke potisni nazaj, mehka kolena, ustavi se ob raztegu.') });
X('db_rdl', 'Dumbbell Romanian Deadlift', 'Romunski mrtvi dvig z ročkami', 'hamstrings', ['gluteMax', 'erectors'], 'dumbbell|kettlebell', 'dumbbell', 'compound', 1, 4, [10, 15], 0.45, 2, 'BH', { notes: ['stretch', 'compound'], cue: cue('Dumbbells close to the legs, hinge until a full stretch.', 'Ročke tik ob nogah, predklon do polnega raztega.') });
X('nordic', 'Nordic Hamstring Curl', 'Nordijski upogib', 'hamstrings', [], '', 'bw', 'iso', 1, 4, [4, 8], 0, 2.5, 'K', { bw: 0.6, rtf: 6, notes: ['stretch'], cue: cue('Ankles anchored, lower yourself as slowly as possible.', 'Gležnji pritrjeni, spuščaj se čim počasneje.') });
X('ghd_raise', 'Glute-Ham Raise', 'Glute-ham dvig', 'hamstrings', ['gluteMax', 'erectors'], 'ghd', 'bw', 'iso', 1, 4, [5, 10], 0, 2.5, 'K', { bw: 0.6, rtf: 8, notes: ['stretch'], cue: cue('Lower slowly to parallel, curl back up with the hamstrings.', 'Počasi se spusti do vodoravnega, dvigni se z zadnjimi stegenskimi.') });
X('band_leg_curl', 'Band Leg Curl', 'Upogib nog z elastiko', 'hamstrings', [], 'bands', 'band', 'iso', 1, 2, [15, 25], 0, 0, 'K', { uni: true, cue: cue('Lie face down, band anchored low, curl the heel to the glute.', 'Leži na trebuhu, elastika pritrjena nizko, peto pripelji k zadnjici.') });
X('swiss_ball_curl', 'Sliding Leg Curl', 'Drsni upogib nog', 'hamstrings', ['gluteMax'], '', 'bw', 'iso', 1, 3, [8, 15], 0, 2.5, 'K', { bw: 0.4, rtf: 12, cue: cue('Heels on a towel or sliders, bridge up and curl the heels in.', 'Pete na brisači ali drsnikih, dvigni boke in pete povleci k sebi.') });

// ----- GLUTE MAX -----
X('db_split_squat', 'Dumbbell Split Squat', 'Razkoračni počep z ročkami', 'gluteMax', ['quads', 'adductors'], 'dumbbell', 'dumbbell', 'compound', 1, 4, [10, 15], 0.25, 2, 'KH', { uni: true, notes: ['depth', 'stretch'], cue: cue('Long stance, slight forward lean, rear knee to the floor.', 'Dolg razkorak, rahel nagib naprej, zadnje koleno do tal.') });
X('bulgarian', 'Bulgarian Split Squat', 'Bolgarski počep', 'gluteMax', ['quads', 'adductors'], 'dumbbell+flatBench|adjBench|box', 'dumbbell', 'compound', 2, 4, [8, 12], 0.3, 2, 'KH', { uni: true, notes: ['depth', 'stretch'], cue: cue('Rear foot on a bench, front knee travels forward, deep.', 'Zadnja noga na klopi, sprednje koleno potuje naprej, globoko.') });
X('db_lunge', 'Dumbbell Lunge', 'Izpadni korak z ročkami', 'gluteMax', ['quads', 'adductors'], 'dumbbell', 'dumbbell', 'compound', 1, 4, [8, 12], 0.25, 2, 'KH', { uni: true, notes: ['depth', 'stretch'], cue: cue('Long steps, slight forward lean, rear knee to the floor.', 'Dolgi koraki, rahel nagib naprej, zadnje koleno do tal.') });
X('hip_thrust', 'Barbell Hip Thrust', 'Dvig bokov s palico', 'gluteMax', ['hamstrings'], 'barbell+flatBench|adjBench', 'barbell', 'compound', 3, 3, [8, 12], 1.5, 2.5, 'H', { cue: cue('Chin tucked, pause and squeeze at the top.', 'Brada k prsim, zgoraj zadrži in stisni.') });
X('hip_thrust_machine', 'Hip Thrust Machine', 'Dvig bokov na napravi', 'gluteMax', ['hamstrings'], 'hipThrustMachine', 'machine', 'compound', 1, 4, [8, 12], 1.5, 5, 'H', { notes: ['stable'], cue: cue('Belt over the hips, drive up and squeeze.', 'Pas čez boke, potisni gor in stisni.') });
X('cable_kickback', 'Cable Glute Kickback', 'Odriv nazaj na kablu', 'gluteMax', ['hamstrings'], 'cable|gluteKickback', 'cable', 'iso', 2, 3, [10, 15], 0.15, 1.25, 'H', { uni: true, cue: cue('Hinge forward, kick back and slightly out.', 'Predklon, odriv nazaj in rahlo navzven.') });
X('glute_bridge', 'Glute Bridge', 'Glutealni most', 'gluteMax', ['hamstrings'], '', 'bw', 'iso', 1, 2, [12, 25], 0, 2.5, 'H', { bw: 0.6, rtf: 20, cue: cue('Feet close, drive the hips up, squeeze.', 'Stopala blizu, boke potisni gor, stisni.') });
X('kb_swing', 'Kettlebell Swing', 'Zamah s kettlebellom', 'gluteMax', ['hamstrings', 'erectors'], 'kettlebell', 'dumbbell', 'compound', 1, 3, [12, 20], 0.4, 4, 'BH', { cue: cue('Hinge, snap the hips forward, arms stay loose.', 'Predklon, boke sunkovito potisni naprej, roke ostanejo sproščene.') });
X('band_glute_bridge', 'Banded Glute Bridge', 'Glutealni most z elastiko', 'gluteMax', ['gluteMed'], 'bands', 'band', 'iso', 1, 2, [15, 25], 0, 0, 'H', { cue: cue('Band above the knees, bridge up, push the knees out.', 'Elastika nad koleni, dvigni boke, kolena potisni navzven.') });

// ----- GLUTE MED / MIN -----
X('hip_abduction', 'Hip Abduction Machine', 'Abdukcija kolka na napravi', 'gluteMed', [], 'hipAbd', 'machine', 'iso', 1, 4, [12, 20], 0.8, 2.5, 'H', { notes: ['stable'], cue: cue('Lean forward slightly, push the knees out.', 'Rahlo se nagni naprej, kolena potisni navzven.') });
X('clam_raise', 'Clam Raise', 'Bočni dvig noge (školjka)', 'gluteMed', [], '', 'bw', 'iso', 1, 3, [8, 15], 0, 2.5, 'H', { uni: true, bw: 0.25, rtf: 15, cue: cue('Side plank on the elbow, raise the top leg, add a dumbbell for load.', 'Bočna opora na komolcu, dvigni zgornjo nogo, za obremenitev dodaj ročko.') });
X('cable_hip_abd', 'Cable Hip Abduction', 'Odmik kolka na kablu', 'gluteMed', [], 'cable', 'cable', 'iso', 1, 3, [10, 15], 0.12, 1.25, 'H', { uni: true, notes: ['tension'], cue: cue('Cuff on the ankle, sweep the leg out to the side.', 'Manšeta na gležnju, nogo odmakni vstran.') });
X('band_hip_abd', 'Band Hip Abduction', 'Odmik kolka z elastiko', 'gluteMed', [], 'bands', 'band', 'iso', 1, 3, [15, 25], 0, 0, 'H', { uni: true, cue: cue('Band around the ankles, step out to the side.', 'Elastika okoli gležnjev, stopi vstran.') });

// ----- ADDUCTORS -----
X('adductor_machine', 'Adductor Machine', 'Adduktorji na napravi', 'adductors', [], 'hipAdd', 'machine', 'iso', 1, 4, [10, 15], 0.8, 2.5, 'H', { notes: ['stretch', 'stable'], cue: cue('Start wide for a stretch, squeeze the knees together.', 'Začni široko za razteg, kolena stisni skupaj.') });
X('copenhagen', 'Copenhagen Raise', 'Kopenhagenski dvig', 'adductors', ['obliques'], 'flatBench|adjBench|box', 'bw', 'iso', 1, 4, [5, 10], 0, 2.5, 'HK', { uni: true, bw: 0.35, rtf: 10, cue: cue('Top leg on a bench, lift the hips into a side plank.', 'Zgornja noga na klopi, dvigni boke v bočno oporo.') });
X('cable_adduction', 'Cable Hip Adduction', 'Primik kolka na kablu', 'adductors', [], 'cable', 'cable', 'iso', 1, 3, [10, 15], 0.12, 1.25, 'H', { uni: true, notes: ['tension'], cue: cue('Cuff on the inner leg, sweep it across the body.', 'Manšeta na notranji nogi, nogo povleci čez telo.') });
X('sumo_squat', 'Dumbbell Sumo Squat', 'Sumo počep z ročko', 'adductors', ['quads', 'gluteMax'], 'dumbbell|kettlebell', 'dumbbell', 'compound', 1, 3, [10, 15], 0.5, 2, 'KH', { notes: ['stretch', 'depth'], cue: cue('Wide stance, toes out, dumbbell hangs between the legs, go deep.', 'Širok razkorak, prsti navzven, ročka visi med nogami, globoko.') });

// ----- CALVES -----
X('standing_calf', 'Standing Calf Raise', 'Dvig na prste stoje', 'calves', [], 'calfStanding', 'machine', 'iso', 1, 4, [8, 15], 1.2, 5, 'A', { notes: ['calfstretch', 'stable'], cue: cue('Pause 1–2 s in the bottom stretch, no bouncing.', 'Spodaj v raztegu zadrži 1–2 s, brez odbijanja.') });
X('lp_calf', 'Leg Press Calf Raise', 'Dvig na prste na nožni preši', 'calves', [], 'legPress', 'machine', 'iso', 1, 4, [10, 15], 1.5, 5, 'A', { notes: ['calfstretch', 'stable'], cue: cue('Balls of the feet on the edge, full stretch each rep.', 'Blazinice stopal na robu, poln razteg pri vsaki ponovitvi.') });
X('smith_calf', 'Smith Machine Calf Raise', 'Dvig na prste na Smith napravi', 'calves', [], 'smith', 'machine', 'iso', 2, 4, [8, 15], 1.2, 2.5, 'A', { notes: ['calfstretch'], cue: cue('Stand on a plate or step, deep stretch, pause.', 'Stoj na plošči ali stopnici, globok razteg, zadrži.') });
X('seated_calf', 'Seated Calf Raise', 'Dvig na prste sede', 'calves', [], 'calfSeated', 'machine', 'iso', 1, 3, [12, 20], 0.6, 2.5, 'A', { notes: ['stable'], cue: cue('Targets the soleus, slow and full range.', 'Cilja soleus, počasi in v polnem obsegu.') });
X('db_calf', 'Single-Leg Dumbbell Calf Raise', 'Enonožni dvig na prste z ročko', 'calves', [], 'dumbbell', 'dumbbell', 'iso', 1, 3, [10, 20], 0.2, 2, 'A', { uni: true, notes: ['calfstretch'], cue: cue('Stand on a step, deep stretch, hold on for balance.', 'Stoj na stopnici, globok razteg, drži se za ravnotežje.') });
X('bw_calf', 'Bodyweight Calf Raise', 'Dvig na prste z lastno težo', 'calves', [], '', 'bw', 'iso', 1, 2, [15, 30], 0, 2.5, 'A', { bw: 0.9, rtf: 30, notes: ['calfstretch'], cue: cue('On a step, full stretch and full rise, pause at both ends.', 'Na stopnici, poln razteg in poln dvig, zadrži na obeh koncih.') });

// ----- TIBIALIS -----
X('tib_raise', 'Tibialis Raise', 'Dvig prstov (tibialis)', 'tibialis', [], '', 'bw', 'iso', 1, 3, [12, 25], 0, 2.5, 'A', { bw: 0.15, rtf: 25, cue: cue('Back against a wall, heels forward, lift the toes high.', 'Hrbet ob steni, pete naprej, prste dvigni visoko.') });
X('band_dorsiflexion', 'Band Dorsiflexion', 'Dorzalna fleksija z elastiko', 'tibialis', [], 'bands', 'band', 'iso', 1, 2, [15, 25], 0, 0, 'A', { uni: true, cue: cue('Band around the foot anchored in front, pull the toes towards you.', 'Elastika okoli stopala, pritrjena spredaj, prste povleci k sebi.') });

const EX = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

/* Short scientific rationales shown in the exercise info sheet. */
const NOTES = {
  stretch: { en: 'Loads the muscle at long lengths — training in the stretched position is linked to greater hypertrophy (Pedrosa 2022; Maeo 2021/2023; Wolf 2023 review).', sl: 'Obremeni mišico v raztegnjenem položaju — trening pri dolgih mišičnih dolžinah je povezan z večjo hipertrofijo (Pedrosa 2022; Maeo 2021/2023; pregled Wolf 2023).' },
  stable: { en: 'Stable machine/cable setup: fast to set up and lets you train safely close to failure, where most of the growth stimulus is.', sl: 'Stabilna naprava/kabel: hitra priprava in varen trening blizu odpovedi, kjer je največji dražljaj za rast.' },
  compound: { en: 'Multi-joint movement: trains several muscles per set, which makes it time-efficient.', sl: 'Večsklepna vaja: z enim setom trenira več mišic, zato je časovno učinkovita.' },
  compound_time: { en: 'Needs almost no setup — ideal when time is short.', sl: 'Skoraj brez priprave — idealno, ko je časa malo.' },
  tension: { en: 'Cables keep tension through the whole range of motion, including the stretched position.', sl: 'Kabel ohranja napetost skozi celoten obseg giba, tudi v raztegnjenem položaju.' },
  overhead: { en: 'Overhead extensions grew the triceps ~40% more than pushdowns (Maeo et al. 2023).', sl: 'Iztegovanje nad glavo je povečalo triceps za ~40 % bolj kot potisk navzdol (Maeo in sod. 2023).' },
  seatedcurl: { en: 'Seated leg curls produced more hamstring growth than lying curls because of the hip-flexed stretch (Maeo et al. 2021).', sl: 'Upogib nog sede je povzročil večjo rast zadnjih stegenskih mišic kot upogib leže zaradi raztega v kolku (Maeo in sod. 2021).' },
  depth: { en: 'Deep squatting patterns grow glutes and adductors more than shallow ones (Kubo et al. 2019).', sl: 'Globoki počepi bolj razvijejo zadnjico in adduktorje kot plitvi (Kubo in sod. 2019).' },
  rf: { en: 'Trains the rectus femoris, which squats and presses develop poorly.', sl: 'Trenira rectus femoris, ki ga počepi in preše slabo razvijejo.' },
  calfstretch: { en: 'Calf work emphasising the bottom stretch produced more growth (Kassiano et al. 2023).', sl: 'Trening meč s poudarkom na spodnjem raztegu je dal večjo rast (Kassiano in sod. 2023).' }
};

/* Release notes shown under "What's new" */
const RELEASE_NOTES = [
  { v: '1.4', date: '2026-11-15', en: ['One-off week changes: set different training days and a different split for a single week; the regular program returns by itself (Weekly plan or Calendar).', 'Supersets: a setting to pair isolation exercises only, and a switch to turn supersets off for one workout when the gym is crowded.', 'Drop sets are announced before the last set, with the weights to have ready (about 20 % lighter per drop, 25 % for heavy sets).', 'Rest timer turns orange once you are over time; estimated reps stand out more.', 'Bottom sheets close with a swipe down. The notification icon in the status bar is no longer a blank square.', 'Corrected figures for the seated dumbbell shrug, hack squat and lying leg curl.'],
    sl: ['Enkratne spremembe tedna: za posamezen teden nastavi druge dneve treninga in drug split; redni program se vrne sam (Tedenski načrt ali Koledar).', 'Superseti: nastavitev za pare samo iz izolacijskih vaj in stikalo za izklop supersetov na enem treningu, ko je telovadnica polna.', 'Drop seti so napovedani pred zadnjim setom, skupaj s težami, ki jih pripraviš (približno 20 % lažje na spust, 25 % pri težkih setih).', 'Časovnik počitka postane oranžen, ko prekoračiš čas; ocenjene ponovitve so bolj vidne.', 'Spodnja okna se zaprejo s potegom navzdol. Ikona obvestila v vrstici stanja ni več prazen kvadrat.', 'Popravljene figure za dvig ramen z ročkami sede, hack počep in upogib nog leže.'] },
  { v: '1.3', date: '2026-11-12', en: ['Your last result is shown on every exercise card, so you always know the number to beat.', 'Rest screen: a large timer with −15 / +15 s, and the Next set button always in reach.', 'Weekly plan: all workouts of the week and the planned sets per muscle (Train → Weekly plan).', 'Deloads when needed: LiftLab suggests an easier week when progress stalls, instead of forcing one by the calendar.', 'New: exercise library, body measurements, and moving a single workout to another day in the calendar.', 'Backup reminders, and storage protected from automatic clean-up where the browser allows it.', 'English is the default language for new installs.'],
    sl: ['Na vsaki kartici vaje je zadnji rezultat, da vedno veš, kaj moraš preseči.', 'Zaslon počitka: velik časovnik z −15 / +15 s in gumb Naslednji set vedno na dosegu.', 'Tedenski načrt: vsi treningi v tednu in načrtovani seti na mišico (Trening → Tedenski načrt).', 'Deload po potrebi: LiftLab predlaga lažji teden, ko napredek zastane, namesto fiksno po koledarju.', 'Novo: knjižnica vaj, telesne mere in prestavljanje posameznega treninga na drug dan v koledarju.', 'Opomniki za varnostno kopijo in shramba, zaščitena pred samodejnim čiščenjem, kjer brskalnik to dovoli.', 'Angleščina je privzeti jezik za nove namestitve.'] },
  { v: '1.2', date: '2026-11-12', en: ['Dark theme is now the default and has been refined.', 'System notifications when a rest or warm-up timer ends, also with the phone locked (allow notifications first).', 'The routine recommendation now comes at the end of the training questions, once your goal, days and time are known, with a short explanation.', 'Walkthroughs can be turned off (in any walkthrough or under App settings).', 'Exercise figures are larger and more body-like, and pause when tapped.'],
    sl: ['Temna tema je zdaj privzeta in izpopolnjena.', 'Sistemska obvestila ob izteku časovnika počitka ali ogrevanja, tudi pri zaklenjenem telefonu (najprej dovoli obvestila).', 'Priporočilo rutine je zdaj na koncu vprašanj o treningu, ko so znani cilj, dnevi in čas, s kratko razlago.', 'Vodiče lahko izklopiš (v kateremkoli vodiču ali v Nastavitvah aplikacije).', 'Figure vaj so večje in bolj podobne telesu ter se ob tapu ustavijo.'] },
  { v: '1.1', date: '2026-11-11', en: ['Animated figures now show how every exercise is performed — at the recommended tempo, with the target muscle highlighted, and fully offline. They replace the video links.', 'Routines that train a large muscle only once a week (e.g. push/pull/legs on 3 days, body-part split) now give it more sets in that session, because weekly volume is what drives growth.'],
    sl: ['Animirane figure zdaj pokažejo izvedbo vsake vaje — v priporočenem tempu, z označeno ciljno mišico in povsem brez povezave. Nadomeščajo povezave do videov.', 'Rutine, ki veliko mišico trenirajo le enkrat tedensko (npr. potisk/poteg/noge v 3 dneh, trening po delih telesa), ji zdaj v tem treningu namenijo več setov, ker rast poganja tedenski volumen.'] },
  { v: '1.0', date: '2026-11-10', en: ['First release: profile setup, routines, time-aware planning, supersets, drop sets, plate calculator, training environments with weight inventories, stats and charts.', 'Everything works offline and all data stays on this device.'],
    sl: ['Prva izdaja: nastavitev profila, rutine, načrtovanje glede na čas, superseti, drop seti, kalkulator plošč, okolja za trening z inventarjem uteži, statistika in grafi.', 'Vse deluje brez povezave, vsi podatki ostanejo na tej napravi.'] }
];
