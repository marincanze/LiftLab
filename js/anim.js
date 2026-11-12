'use strict';
/*
 * Animated exercise figures — replaces technique videos and works fully offline.
 * A jointed silhouette is posed in two key positions (a = stretched, b = contracted); the frames between them are
 * solved with simple forward/inverse kinematics and played as an SVG animation: lift ~1 s, short pause,
 * lower ~2 s (the recommended controlled tempo). The target muscle's body part is drawn in the accent colour.
 */
const Anim = (() => {
  const LEN = { torso: 36, sh: 33, neck: 4, head: 7.5, ua: 20, fa: 19, th: 28, shin: 27, foot: 7 };
  const N = 6;                                   // interpolation steps per direction
  const T_UP = 1.0, T_HOLD = 0.35, T_DOWN = 2.0, T_REST = 0.45;
  const DUR = T_UP + T_HOLD + T_DOWN + T_REST;
  const rad = d => d * Math.PI / 180;
  const dir = a => [Math.sin(rad(a)), Math.cos(rad(a))];          // 0 = down, 90 = forward (+x), 180 = up
  const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const r1 = v => Math.round(v * 10) / 10;
  const r3 = v => Math.round(v * 1000) / 1000;
  const ease = x => x * x * (3 - 2 * x);

  /** two-bone IK: joint position and reachable end point */
  function ik(R, T, l1, l2, s) {
    const dx = T[0] - R[0], dy = T[1] - R[1];
    const d = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(l1 + l2 - 0.3, Math.hypot(dx, dy) || 0.01));
    const base = Math.atan2(dy, dx);
    const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
    return [[R[0] + l1 * Math.cos(base + s * a), R[1] + l1 * Math.sin(base + s * a)], [R[0] + d * Math.cos(base), R[1] + d * Math.sin(base)]];
  }
  const res = (J, spec) => (typeof spec === 'string' ? J[spec] : typeof spec[0] === 'string' ? add(J[spec[0]], [spec[1], spec[2]]) : spec);

  /* ---------- side view ---------- */
  function solveS(p) {
    const J = { p };
    J.hip = p.hip;
    let td;
    if (p.shp) { const dx = p.shp[0] - p.hip[0], dy = p.shp[1] - p.hip[1], d = Math.hypot(dx, dy) || 1; td = [dx / d, dy / d]; }
    else td = [Math.sin(rad(p.t || 0)), -Math.cos(rad(p.t || 0))];
    J.neck = add(J.hip, td, LEN.torso);
    J.mid = add(J.hip, td, LEN.torso * 0.5);
    J.chest = add(J.hip, td, LEN.torso * 0.84);
    J.sh = add(J.hip, td, LEN.sh + (p.shr || 0));
    const h = rad(p.hd || 0);
    const hdv = [td[0] * Math.cos(h) - td[1] * Math.sin(h), td[0] * Math.sin(h) + td[1] * Math.cos(h)];
    J.head = add(J.neck, hdv, LEN.neck + LEN.head);
    ['', '2'].forEach(k => {
      const g = n => (p[n + k] !== undefined ? p[n + k] : p[n]);
      const foot = k ? (p.foot2 !== undefined ? p.foot2 : p.th2 !== undefined ? undefined : p.foot) : p.foot;
      if (foot) { const r = ik(J.hip, foot, LEN.th, LEN.shin, g('kb') || -1); J['knee' + k] = r[0]; J['ankle' + k] = r[1]; }
      else { J['knee' + k] = add(J.hip, dir(g('th') || 0), LEN.th); J['ankle' + k] = add(J['knee' + k], dir(g('sh') || 0), LEN.shin); }
      const sd = [J['ankle' + k][0] - J['knee' + k][0], J['ankle' + k][1] - J['knee' + k][1]], sl = Math.hypot(sd[0], sd[1]) || 1;
      const toe = g('toe');
      J['toe' + k] = toe || add(J['ankle' + k], [sd[1] / sl, -sd[0] / sl], LEN.foot * (p.ff || 1));
    });
    ['', '2'].forEach(k => {
      const g = n => (p[n + k] !== undefined ? p[n + k] : p[n]);
      const hand = k ? (p.hand2 !== undefined ? p.hand2 : p.ua2 !== undefined ? undefined : p.hand) : p.hand;
      if (hand) { const r = ik(J.sh, res(J, hand), LEN.ua, LEN.fa, g('eb') || 1); J['el' + k] = r[0]; J['hand' + k] = r[1]; }
      else { J['el' + k] = add(J.sh, dir(g('ua') || 0), LEN.ua); J['hand' + k] = add(J['el' + k], dir(g('fa') || 0), LEN.fa); }
    });
    return J;
  }
  /* ---------- front view (left side mirrors the right unless overridden) ---------- */
  function solveF(p) {
    const J = { p, front: true };
    const td = [Math.sin(rad(p.t || 0)), -Math.cos(rad(p.t || 0))];
    const pr = [-td[1], td[0]];
    const T = p.lying ? 0.3 : 1;
    J.hip = p.hip;
    J.neck = add(J.hip, td, LEN.torso * T);
    J.mid = add(J.hip, td, LEN.torso * T * 0.5);
    J.chest = add(J.hip, td, LEN.torso * T * 0.84);
    const shc = add(J.hip, td, (LEN.sh + (p.shr || 0)) * T);
    J.head = add(J.neck, td, LEN.neck + LEN.head);
    J.sh = add(shc, pr, 11); J.sh2 = add(shc, pr, -11);
    J.hp = add(J.hip, pr, 5); J.hp2 = add(J.hip, pr, -5);
    const thL = LEN.th * (p.sit ? 0.5 : 1);
    [['', 1], ['2', -1]].forEach(([k, m]) => {
      const g = n => (p[n + k] !== undefined ? p[n + k] : p[n]);
      const d = a => { const v = dir(a || 0); return [v[0] * m, v[1]]; };
      J['el' + k] = add(J['sh' + k], d(g('ua')), LEN.ua); J['hand' + k] = add(J['el' + k], d(g('fa')), LEN.fa);
      J['knee' + k] = add(J['hp' + k], d(g('th')), thL); J['ankle' + k] = add(J['knee' + k], d(g('sh')), LEN.shin);
      J['toe' + k] = add(J['ankle' + k], [m * 5, 2]);
    });
    return J;
  }

  /* ---------- archetypes ----------
   * v: 's' side | 'f' front;  c: common pose fields, a: stretched pose, b: contracted pose
   * pose fields: hip, t (torso lean) | shp (point the torso aims at), hand | ua+fa, eb (elbow side), foot | th+sh, kb (knee side),
   *              toe, hd (head tilt), shr (shoulder raise), py (tool offset), …2 = far-side limb
   * tool: bar db kb ball wheel pad cable band none;  at: where the tool sits;  anchor: cable/band origin
   * st: static equipment ['L',x1,y1,x2,y2,w] ['R',x,y,w,h] ['D',x,y,r];  mv: moving bars [{from,to,w}]
   */
  const BENCH = [['R', 70, 107, 64, 5], ['L', 78, 112, 78, 138, 3], ['L', 126, 112, 126, 138, 3]];
  const SEAT = [['L', 80, 112, 106, 112, 5], ['L', 84, 112, 80, 70, 5]];
  const A = {
    squat: { c: { foot: [102, 135], hand: ['sh', -4, 2], eb: -1 }, a: { hip: [88, 110], t: 32 }, b: { hip: [100, 80], t: 4 }, tool: 'bar' },
    squat_front: { c: { foot: [102, 135], hand: ['sh', 10, 10] }, a: { hip: [88, 110], t: 26 }, b: { hip: [100, 80], t: 2 }, tool: 'db' },
    squat_bw: { c: { foot: [102, 135], hand: ['sh', 30, 4] }, a: { hip: [88, 110], t: 30 }, b: { hip: [100, 80], t: 2 }, tool: 'none' },
    legpress: { c: { hip: [66, 120], t: -55, hand: ['hip', 8, 2] }, a: { foot: [100, 96] }, b: { foot: [110, 90] }, tool: 'none',
      st: [['L', 62, 128, 32, 104, 5], ['L', 60, 128, 80, 128, 5]], mv: [{ from: ['ankle', 9, 9], to: ['ankle', -5, -17], w: 4 }] },
    legext: { c: { hip: [84, 102], t: -12, th: 88, hand: ['hip', 4, 6] }, a: { sh: -8 }, b: { sh: 78 }, tool: 'pad', at: ['ankle', 5, -2], st: [['L', 80, 108, 108, 108, 5], ['L', 80, 108, 72, 66, 5]] },
    legcurl_seated: { c: { hip: [84, 102], t: -12, th: 88, hand: ['hip', 4, 6] }, a: { sh: 80 }, b: { sh: -30 }, tool: 'pad', at: ['ankle', -5, 2], st: [['L', 80, 108, 108, 108, 5], ['L', 80, 108, 72, 66, 5]] },
    legcurl_lying: { c: { hip: [96, 102], t: 90, th: -90, hand: ['sh', 8, 10] }, a: { sh: -90 }, b: { sh: 155 }, tool: 'pad', at: ['ankle', 0, -6], st: [['R', 62, 106, 84, 5], ['L', 72, 111, 72, 138, 3], ['L', 136, 111, 136, 138, 3]] },
    hinge: { c: { foot: [100, 135], ua: 0, fa: 0 }, a: { hip: [90, 84], t: 78 }, b: { hip: [100, 80], t: 0 }, tool: 'bar' },
    goodmorning: { c: { foot: [100, 135], hand: ['sh', -4, 2], eb: -1 }, a: { hip: [90, 84], t: 72 }, b: { hip: [100, 80], t: 0 }, tool: 'bar' },
    deadlift: { c: { foot: [100, 135], ua: 0, fa: 0 }, a: { hip: [86, 102], t: 50 }, b: { hip: [100, 80], t: 0 }, tool: 'bar' },
    backext: { c: { foot: [100, 135], hand: ['sh', 4, 12] }, a: { hip: [90, 84], t: 80 }, b: { hip: [98, 80], t: 8 }, tool: 'none', st: [['L', 96, 92, 108, 84, 5], ['L', 104, 90, 112, 138, 3]] },
    swing: { c: { foot: [100, 135] }, a: { hip: [90, 86], t: 70, ua: -25, fa: -25 }, b: { hip: [100, 80], t: 0, ua: 80, fa: 85 }, tool: 'kb' },
    pullthrough: { c: { foot: [100, 135] }, a: { hip: [90, 86], t: 70, ua: -30, fa: -30 }, b: { hip: [100, 80], t: 0, ua: -5, fa: 5 }, tool: 'cable', anchor: [22, 128] },
    hipthrust: { c: { shp: [62, 104], foot: [124, 135], hand: ['hip', 2, -6] }, a: { hip: [94, 126] }, b: { hip: [97, 105] }, tool: 'bar', at: ['hip', 2, -8], st: [['R', 38, 108, 26, 30]] },
    bridge: { c: { shp: [58, 133], foot: [122, 135], hand: [97, 136] }, a: { hip: [93, 130] }, b: { hip: [94, 110] }, tool: 'none' },
    lunge: { c: { t: 4, ua: 0, fa: 0, foot: [120, 135], foot2: [70, 133] }, a: { hip: [96, 106] }, b: { hip: [96, 86] }, tool: 'db' },
    bulgarian: { c: { t: 6, ua: 0, fa: 0, foot: [120, 135], foot2: [62, 112] }, a: { hip: [94, 108] }, b: { hip: [94, 88] }, tool: 'db', st: [['R', 44, 116, 28, 5], ['L', 50, 121, 50, 138, 3], ['L', 66, 121, 66, 138, 3]] },
    stepup: { c: { t: 6, ua: 0, fa: 0, foot: [112, 116] }, a: { hip: [100, 84], foot2: [94, 135] }, b: { hip: [112, 61], foot2: [110, 116] }, tool: 'db', st: [['R', 102, 119, 36, 20]] },
    calf: { c: { t: 0, ua: 0, fa: 0, toe: [111, 133] }, a: { hip: [100, 84], foot: [101, 138] }, b: { hip: [100, 73], foot: [102, 127] }, tool: 'none', st: [['R', 106, 135, 26, 4]] },
    calf_seated: { c: { hip: [80, 106], t: 0, hand: ['knee', -2, -5], toe: [121, 133] }, a: { foot: [112, 137] }, b: { foot: [112, 129] }, tool: 'pad', at: ['knee', 1, -7], st: [['L', 70, 112, 92, 112, 5], ['R', 116, 135, 20, 4]] },
    bench: { c: { hip: [82, 104], t: 90, foot: [60, 135], kb: 1, eb: -1 }, a: { hand: [102, 92] }, b: { hand: [113, 66] }, tool: 'bar', st: BENCH },
    incline: { c: { hip: [84, 116], t: 50, foot: [62, 135], kb: 1, eb: -1 }, a: { hand: ['sh', -12, -8] }, b: { hand: ['sh', -2, -38] }, tool: 'bar', st: [['L', 86, 124, 124, 93, 5], ['L', 70, 124, 90, 124, 5], ['L', 100, 122, 100, 138, 3]] },
    press_seated: { c: { hip: [84, 106], t: -5, foot: [114, 135] }, a: { hand: ['sh', 10, 6] }, b: { hand: ['sh', 37, 4] }, tool: 'handle', st: SEAT },
    press_seated_inc: { c: { hip: [84, 106], t: -14, foot: [114, 135] }, a: { hand: ['sh', 10, 2] }, b: { hand: ['sh', 30, -22] }, tool: 'handle', st: [['L', 80, 112, 106, 112, 5], ['L', 84, 112, 72, 72, 5]] },
    press_band: { c: { hip: [100, 80], t: 6, foot: [100, 135], foot2: [84, 135] }, a: { hand: ['sh', 10, 4] }, b: { hand: ['sh', 34, -14] }, tool: 'band', anchor: [40, 120] },
    pushup: { c: { hand: [118, 136], foot: [36, 134] }, a: { hip: [88, 124], shp: [126, 124] }, b: { hip: [88, 112], shp: [128, 100] }, tool: 'none' },
    pushup_decline: { c: { hand: [118, 136], foot: [36, 112] }, a: { hip: [88, 116], shp: [124, 124] }, b: { hip: [88, 106], shp: [124, 100] }, tool: 'none', st: [['R', 20, 116, 30, 22]] },
    pushup_deficit: { c: { hand: [118, 130], foot: [36, 134] }, a: { hip: [88, 126], shp: [124, 129] }, b: { hip: [88, 112], shp: [128, 100] }, tool: 'none', st: [['R', 111, 133, 14, 6]] },
    pike: { c: { hand: [128, 136], foot: [70, 135] }, a: { hip: [92, 90], shp: [122, 124] }, b: { hip: [88, 84], shp: [114, 104] }, tool: 'none' },
    dip: { c: { hand: [100, 76], th: 6, sh: -60 }, a: { hip: [104, 106], t: 16 }, b: { hip: [101, 72], t: 4 }, tool: 'none', st: [['L', 100, 80, 100, 138, 3]], mv: [{ from: [96, 77], to: [104, 77], w: 5 }] },
    benchdip: { c: { hand: [84, 104], foot: [140, 134], t: 0 }, a: { hip: [92, 122] }, b: { hip: [92, 104] }, tool: 'none', st: [['R', 56, 106, 32, 5], ['L', 62, 111, 62, 138, 3]] },
    pullup: { c: { hand: [100, 22], th: 8, sh: -55 }, a: { hip: [100, 94], t: 0 }, b: { hip: [102, 60], t: -12 }, tool: 'none', mv: [{ from: [97, 21], to: [103, 21], w: 5 }] },
    legraise: { c: { hand: [100, 22], hip: [100, 94], t: 0 }, a: { th: 4, sh: 0 }, b: { th: 92, sh: 88 }, tool: 'none', mv: [{ from: [97, 21], to: [103, 21], w: 5 }] },
    pulldown: { c: { hip: [92, 112], foot: [122, 135] }, a: { t: -4, hand: [98, 42] }, b: { t: -14, hand: [96, 76] }, tool: 'cable', anchor: [98, 6], st: [['L', 82, 118, 104, 118, 5]] },
    straightarm: { c: { hip: [100, 80], t: 14, foot: [100, 135] }, a: { ua: 140, fa: 146 }, b: { ua: 18, fa: 24 }, tool: 'cable', anchor: [150, 14] },
    pullover: { c: { hip: [82, 104], t: 90, foot: [60, 135], kb: 1 }, a: { ua: 112, fa: 125 }, b: { ua: 178, fa: 182 }, tool: 'db', st: BENCH },
    row_seated: { c: { hip: [84, 116], foot: [128, 128] }, a: { t: 8, hand: ['sh', 36, 12] }, b: { t: -6, hand: ['sh', 8, 16] }, tool: 'cable', anchor: [172, 100], st: [['L', 72, 122, 100, 122, 5], ['L', 131, 120, 135, 137, 4]] },
    row_machine: { c: { hip: [84, 108], foot: [112, 135], t: 6 }, a: { hand: ['sh', 36, 6] }, b: { hand: ['sh', 8, 12] }, tool: 'handle', st: [['L', 74, 114, 100, 114, 5], ['L', 100, 82, 100, 114, 5]] },
    row_bent: { c: { hip: [90, 84], t: 62, foot: [100, 135] }, a: { hand: ['sh', 0, 38] }, b: { hand: ['sh', -6, 15] }, tool: 'bar' },
    row_onearm: { c: { hip: [90, 84], t: 75, foot: [100, 135], hand2: [126, 104] }, a: { hand: ['sh', -2, 38] }, b: { hand: ['sh', -8, 15] }, tool: 'db', st: [['R', 108, 106, 50, 5], ['L', 116, 111, 116, 138, 3], ['L', 150, 111, 150, 138, 3]] },
    row_tbar: { c: { hip: [90, 84], t: 58, foot: [100, 135] }, a: { hand: ['sh', 0, 38] }, b: { hand: ['sh', -6, 15] }, tool: 'bar', mv: [{ from: [40, 137], to: 'hand', w: 3 }] },
    row_incline: { c: { hip: [82, 112], t: 52, foot: [50, 137] }, a: { hand: ['sh', 2, 37] }, b: { hand: ['sh', -6, 14] }, tool: 'db', st: [['L', 88, 119, 122, 92, 5], ['L', 104, 108, 104, 138, 3]] },
    row_inverted: { c: { hand: [110, 84], foot: [40, 132], eb: -1 }, a: { hip: [90, 118], shp: [118, 121] }, b: { hip: [90, 104], shp: [119, 91] }, tool: 'none', st: [['D', 110, 84, 3], ['L', 110, 87, 110, 138, 3]] },
    facepull: { c: { hip: [100, 80], t: -4, foot: [100, 135], eb: -1 }, a: { hand: ['sh', 36, -4] }, b: { hand: ['sh', 9, -10] }, tool: 'cable', anchor: [170, 38] },
    ohp: { c: { hip: [100, 80], t: 0, foot: [100, 135] }, a: { hand: ['sh', 8, -2] }, b: { hand: ['sh', 3, -38] }, tool: 'bar' },
    ohp_seated: { c: { hip: [90, 106], t: -4, foot: [120, 135] }, a: { hand: ['sh', 8, -2] }, b: { hand: ['sh', 3, -38] }, tool: 'db', st: [['L', 80, 112, 106, 112, 5], ['L', 84, 112, 81, 72, 5]] },
    landmine: { c: { hip: [100, 80], t: 6, foot: [100, 135], foot2: [84, 135] }, a: { hand: ['sh', 8, 2] }, b: { hand: ['sh', 24, -30] }, tool: 'none', mv: [{ from: [174, 137], to: 'hand', w: 3 }] },
    curl: { c: { hip: [100, 80], t: 0, foot: [100, 135], ua: 2 }, a: { fa: 8 }, b: { fa: 150 }, tool: 'db' },
    curl_bayesian: { c: { hip: [100, 80], t: 6, foot: [100, 135], foot2: [88, 135], ua: -28 }, a: { fa: -20 }, b: { fa: 115 }, tool: 'cable', anchor: [38, 128] },
    curl_incline: { c: { hip: [96, 112], t: -38, foot: [128, 135], ua: -4 }, a: { fa: 0 }, b: { fa: 140 }, tool: 'db', st: [['L', 91, 119, 62, 82, 5], ['L', 88, 119, 110, 119, 5], ['L', 80, 108, 80, 138, 3]] },
    curl_preacher: { c: { hip: [84, 106], t: 18, foot: [108, 135], ua: 48 }, a: { fa: 55 }, b: { fa: 165 }, tool: 'bar', st: [['L', 90, 79, 108, 95, 5], ['L', 104, 94, 104, 138, 3], ['L', 74, 112, 96, 112, 5]] },
    wristcurl: { c: { hip: [84, 106], t: 22, foot: [110, 135], hand: ['knee', 4, -5] }, a: { py: 4 }, b: { py: -5 }, tool: 'db', at: ['hand', 4, 0], st: [['L', 74, 112, 96, 112, 5]], mv: [{ from: 'hand', to: ['hand', 4, 0], w: 5, py: 1 }] },
    pushdown: { c: { hip: [100, 80], t: 6, foot: [100, 135], ua: 4 }, a: { fa: 120 }, b: { fa: 8 }, tool: 'cable', anchor: [126, 12] },
    ohext: { c: { hip: [100, 80], t: 0, foot: [100, 135], ua: 172 }, a: { fa: -35 }, b: { fa: 176 }, tool: 'db' },
    ohext_cable: { c: { hip: [100, 80], t: 14, foot: [106, 135], foot2: [88, 135], ua: 160 }, a: { fa: -30 }, b: { fa: 158 }, tool: 'cable', anchor: [36, 60] },
    skullcrusher: { c: { hip: [82, 104], t: 90, foot: [60, 135], kb: 1, ua: 172 }, a: { fa: 75 }, b: { fa: 172 }, tool: 'bar', st: BENCH },
    crunch: { c: { hip: [112, 130], foot: [142, 135], hand: ['head', 2, -2] }, a: { shp: [76, 131] }, b: { shp: [82, 112] }, tool: 'none' },
    crunch_cable: { c: { foot: [72, 133], hand: ['head', 6, 2] }, a: { hip: [98, 104], t: 8 }, b: { hip: [96, 106], t: 62 }, tool: 'cable', anchor: [150, 10] },
    crunch_seated: { c: { hip: [86, 108], foot: [116, 135], hand: ['sh', 10, -4] }, a: { t: -12 }, b: { t: 30 }, tool: 'none', st: [['L', 76, 114, 100, 114, 5], ['L', 80, 114, 72, 76, 5]] },
    rollout: { c: { foot: [56, 134] }, a: { hip: [104, 118], shp: [136, 112], hand: [166, 131] }, b: { hip: [90, 108], shp: [120, 90], hand: [127, 129] }, tool: 'wheel', at: ['hand', 0, 3] },
    superman: { c: { hip: [92, 130] }, a: { shp: [128, 130], th: -90, sh: -90, ua: 90, fa: 90 }, b: { shp: [126, 119], th: -99, sh: -102, ua: 106, fa: 110 }, tool: 'none' },
    slam: { c: { foot: [100, 135] }, a: { hip: [94, 92], t: 38, ua: 25, fa: 25 }, b: { hip: [100, 80], t: -4, ua: 176, fa: 180 }, tool: 'ball' },
    nordic: { c: { foot: [59, 132], hand: ['sh', 8, 10] }, a: { hip: [109, 116], t: 55 }, b: { hip: [86, 104], t: 0 }, tool: 'none', st: [['D', 58, 126, 3]] },
    nordic_rev: { c: { foot: [59, 132], ua: 0, fa: 0 }, a: { hip: [66, 112], t: -45 }, b: { hip: [86, 104], t: 0 }, tool: 'none' },
    slidecurl: { c: { shp: [56, 133], hand: [92, 136] }, a: { hip: [92, 126], foot: [146, 134] }, b: { hip: [94, 112], foot: [122, 134] }, tool: 'none' },
    kickback: { c: { hip: [100, 80], t: 32, hand: ['sh', 22, 16], foot2: [100, 135] }, a: { th: 8, sh: 2 }, b: { th: -38, sh: -48 }, tool: 'cable', at: 'ankle', anchor: [152, 134], st: [['L', 141, 62, 141, 138, 3]] },
    neck_flex: { c: { hip: [90, 106], t: 0, foot: [120, 135], hand: ['knee', -4, -5] }, a: { hd: -22 }, b: { hd: 28 }, tool: 'none', st: [['L', 78, 112, 104, 112, 5]] },
    neck_ext: { c: { hip: [90, 106], t: 0, foot: [120, 135], hand: ['knee', -4, -5] }, a: { hd: 28 }, b: { hd: -22 }, tool: 'none', st: [['L', 78, 112, 104, 112, 5]] },
    tib: { c: { hip: [94, 80], t: -6, ua: 0, fa: 0, foot: [104, 135] }, a: { toe: [113, 138] }, b: { toe: [112, 129] }, tool: 'none', st: [['L', 84, 20, 84, 138, 3]] },
    /* front view */
    lateral: { v: 'f', c: { hip: [100, 80], th: 4, sh: 0 }, a: { ua: 8, fa: 6 }, b: { ua: 84, fa: 88 }, tool: 'db' },
    shrug: { v: 'f', c: { hip: [100, 80], th: 4, sh: 0, ua: 6, fa: 4 }, a: { shr: -1 }, b: { shr: 6 }, tool: 'db' },
    fly: { v: 'f', c: { hip: [100, 80], th: 4, sh: 0 }, a: { ua: 80, fa: 95 }, b: { ua: 30, fa: -75 }, tool: 'cable', anchor: [158, 34] },
    fly_low: { v: 'f', c: { hip: [100, 80], th: 4, sh: 0 }, a: { ua: 48, fa: 40 }, b: { ua: 62, fa: -100 }, tool: 'cable', anchor: [158, 132] },
    fly_lying: { v: 'f', c: { hip: [100, 104], lying: true, nolegs: true }, a: { ua: 80, fa: 100 }, b: { ua: 168, fa: 185 }, tool: 'db', st: [['R', 76, 98, 48, 10], ['L', 84, 108, 84, 138, 3], ['L', 116, 108, 116, 138, 3]] },
    rearfly: { v: 'f', c: { hip: [100, 80], th: 4, sh: 0 }, a: { ua: 30, fa: -75 }, b: { ua: 82, fa: 92 }, tool: 'db' },
    abduction: { v: 'f', c: { hip: [100, 98], sit: true, sh: 0, ua: 12, fa: -25 }, a: { th: 10 }, b: { th: 58 }, tool: 'none', st: [['R', 82, 100, 36, 6]] },
    adduction: { v: 'f', c: { hip: [100, 98], sit: true, sh: 0, ua: 12, fa: -25 }, a: { th: 58 }, b: { th: 8 }, tool: 'none', st: [['R', 82, 100, 36, 6]] },
    abduction_stand: { v: 'f', c: { hip: [100, 80], th2: 2, sh2: 0, ua: 8, fa: 5 }, a: { th: 0, sh: 0 }, b: { th: 38, sh: 38 }, tool: 'cable', at: 'ankle', anchor: [38, 136], one: true },
    adduction_stand: { v: 'f', c: { hip: [100, 80], th2: 2, sh2: 0, ua: 8, fa: 5 }, a: { th: 36, sh: 36 }, b: { th: -8, sh: -8 }, tool: 'cable', at: 'ankle', anchor: [166, 136], one: true },
    sidebend: { v: 'f', c: { hip: [100, 80], th: 6, sh: 0, ua: 4, fa: 2 }, a: { t: 14 }, b: { t: -14 }, tool: 'db', one: true }
  };

  /* exercise → [archetype, tool override, anchor override] */
  const MAP = {
    incline_db: ['incline', 'db'], incline_machine: ['press_seated_inc'], smith_incline: ['incline'], incline_bb: ['incline'], landmine_press: ['landmine'], low_high_fly: ['fly_low'],
    decline_pushup: ['pushup_decline'], band_incline_press: ['press_band'],
    machine_press: ['press_seated'], db_bench: ['bench', 'db'], bb_bench: ['bench'], smith_bench: ['bench'], dips: ['dip'], assisted_dip: ['dip'], deficit_pushup: ['pushup_deficit'], pushup: ['pushup'],
    pec_deck: ['fly', 'none'], cable_fly: ['fly'], db_fly: ['fly_lying'], trx_fly: ['fly', 'band', [150, 8]],
    lat_pulldown: ['pulldown'], pullup: ['pullup'], weighted_pullup: ['pullup'], assisted_pullup: ['pullup'], single_arm_pulldown: ['pulldown'], db_row: ['row_onearm'], straight_arm_pulldown: ['straightarm'],
    db_pullover: ['pullover'], band_pulldown: ['pulldown', 'band'],
    cs_row: ['row_machine'], cable_row: ['row_seated'], incline_db_row: ['row_incline'], tbar_row: ['row_tbar'], inverted_row: ['row_inverted'], bb_row: ['row_bent'], band_row: ['row_seated', 'band'], face_pull: ['facepull'],
    db_shrug: ['shrug'], cable_shrug: ['shrug', 'cable', [100, 138]], bb_shrug: ['shrug', 'bar'],
    machine_ohp: ['ohp_seated', 'handle'], smith_ohp: ['ohp_seated', 'bar'], db_ohp: ['ohp_seated'], ohp: ['ohp'], pike_pushup: ['pike'], band_ohp: ['ohp', 'band', 'ankle'],
    cable_lateral: ['lateral', 'cable', [46, 136], { one: true }], machine_lateral: ['lateral', 'none'], db_lateral: ['lateral'], band_lateral: ['lateral', 'band', 'ankle'],
    reverse_pec_deck: ['rearfly', 'none'], cable_rear_fly: ['rearfly', 'cable', [44, 40]], db_rear_fly: ['rearfly'], band_pullapart: ['rearfly', 'link'],
    plate_neck_curl: ['neck_flex'], band_neck_flex: ['neck_flex'], neck_ext: ['neck_ext'], band_neck_ext: ['neck_ext'],
    bayesian_curl: ['curl_bayesian'], incline_curl: ['curl_incline'], ez_preacher: ['curl_preacher'], preacher_machine: ['curl_preacher', 'handle'], db_curl: ['curl'], ez_curl: ['curl', 'bar'],
    band_curl: ['curl', 'band', 'ankle'], chinup: ['pullup'],
    oh_cable_ext: ['ohext_cable'], db_oh_ext: ['ohext'], skullcrusher: ['skullcrusher'], pushdown: ['pushdown'], band_pushdown: ['pushdown', 'band'], diamond_pushup: ['pushup'], bench_dip: ['benchdip'],
    db_wrist_curl: ['wristcurl'], cable_wrist_curl: ['wristcurl', 'handle'], bb_wrist_curl: ['wristcurl', 'bar'], reverse_wrist_curl: ['wristcurl'], reverse_curl: ['curl', 'bar'], band_reverse_curl: ['curl', 'band', 'ankle'],
    cable_crunch: ['crunch_cable'], machine_crunch: ['crunch_seated'], ab_rollout: ['rollout'], hanging_raise: ['legraise'], crunch: ['crunch'], medball_slam: ['slam'],
    db_side_bend: ['sidebend'], cable_woodchop: ['sidebend', 'cable', [160, 30], { one: true }], side_crunch: ['crunch'], band_rotation: ['sidebend', 'band', [160, 70], { one: true }],
    back_ext: ['backext'], cable_pullthrough: ['pullthrough'], superman: ['superman'], good_morning: ['goodmorning'],
    hack_squat: ['squat', 'none'], leg_press: ['legpress'], leg_ext: ['legext'], bb_squat: ['squat'], ssb_squat: ['squat'], smith_squat: ['squat'], sissy_squat: ['nordic_rev'], reverse_nordic: ['nordic_rev'],
    goblet_squat: ['squat_front'], trap_deadlift: ['deadlift'], step_up: ['stepup'], band_squat: ['squat_bw', 'band', 'ankle'],
    seated_leg_curl: ['legcurl_seated'], lying_leg_curl: ['legcurl_lying'], rdl: ['hinge'], db_rdl: ['hinge', 'db'], nordic: ['nordic'], ghd_raise: ['nordic'], band_leg_curl: ['legcurl_lying', 'band', [30, 104]], swiss_ball_curl: ['slidecurl'],
    db_split_squat: ['lunge'], bulgarian: ['bulgarian'], db_lunge: ['lunge'], hip_thrust: ['hipthrust'], hip_thrust_machine: ['hipthrust', 'pad'], cable_kickback: ['kickback'], glute_bridge: ['bridge'], kb_swing: ['swing'],
    band_glute_bridge: ['bridge'],
    hip_abduction: ['abduction'], clam_raise: ['abduction'], cable_hip_abd: ['abduction_stand'], band_hip_abd: ['abduction_stand', 'none'],
    adductor_machine: ['adduction'], copenhagen: ['adduction_stand', 'none'], cable_adduction: ['adduction_stand'], sumo_squat: ['squat_front'],
    standing_calf: ['calf'], lp_calf: ['calf'], smith_calf: ['calf', 'bar'], seated_calf: ['calf_seated'], db_calf: ['calf', 'db'], bw_calf: ['calf'],
    tib_raise: ['tib'], band_dorsiflexion: ['tib']
  };
  /* fallback for custom exercises: a typical movement for the muscle */
  const BY_MUSCLE = {
    biceps: 'curl', triceps: 'pushdown', forearmFlexors: 'wristcurl', forearmExtensors: 'wristcurl', abs: 'crunch', obliques: 'sidebend', erectors: 'backext',
    upperBack: 'row_seated', lats: 'pulldown', upperTraps: 'shrug', frontDelts: 'ohp', sideDelts: 'lateral', rearDelts: 'rearfly', neckFlexors: 'neck_flex', neckExtensors: 'neck_ext',
    calves: 'calf', adductors: 'adduction', hamstrings: 'hinge', quads: 'squat_bw', tibialis: 'tib', gluteMax: 'bridge', gluteMed: 'abduction', upperChest: 'incline', lowerChest: 'pushup'
  };
  /* body part drawn in the accent colour for each muscle */
  const PART = {
    biceps: 'uarm', triceps: 'uarm', forearmFlexors: 'farm', forearmExtensors: 'farm', abs: 'torsoL', obliques: 'torsoL', erectors: 'torsoL',
    upperBack: 'torsoU', lats: 'torsoU', upperTraps: 'traps', frontDelts: 'delt', sideDelts: 'delt', rearDelts: 'delt', neckFlexors: 'neck', neckExtensors: 'neck',
    calves: 'shin', tibialis: 'shin', adductors: 'thigh', hamstrings: 'thigh', quads: 'thigh', gluteMax: 'glute', gluteMed: 'glute', upperChest: 'torsoU', lowerChest: 'torsoU'
  };

  /* ---------- drawing ---------- */
  function shapes(J, def, tool, anchor, part) {
    const out = [];
    const P = (cls, w, ...pts) => out.push({ k: 'P', cls, w, v: pts });
    const C = (cls, c, r, fill) => out.push({ k: 'C', cls, v: [c[0], c[1], r], fill });
    const f = J.front;
    const hipL = f ? J.hp2 : J.hip, hipR = f ? J.hp : J.hip, shL = f ? J.sh2 : J.sh;
    const far = f ? 'body' : 'far';
    const legs = !def.c.nolegs;
    // limbs taper towards the hand / foot so the figure reads as a body, not a stick
    const leg = (cls, h, k) => { P(cls, 10, h, J['knee' + k]); P(cls, 7.5, J['knee' + k], J['ankle' + k]); P(cls, 6, J['ankle' + k], J['toe' + k]); };
    const arm = (cls, sh, k) => { P(cls, 7.5, sh, J['el' + k]); P(cls, 5.8, J['el' + k], J['hand' + k]); C(cls, J['hand' + k], 3.3, true); };
    // far side
    if (legs) leg(far, hipL, '2');
    arm(far, shL, '2');
    // trunk: hips, waist, chest, neck, head
    P('body', 12, J.hip, J.mid);
    P('body', f ? 13 : 14.5, J.mid, J.chest);
    P('body', 6, J.chest, J.head);
    if (f) { P('body', 10, J.sh2, J.sh); if (legs) P('body', 11, J.hp2, J.hp); }
    C('body', J.head, LEN.head, true);
    if (part === 'torsoU') P('hl', f ? 13 : 14.5, J.mid, J.chest);
    if (part === 'torsoL') P('hl', 12, J.hip, J.mid);
    if (part === 'traps') { if (f) P('hl', 10, J.sh2, J.sh); else P('hl', 9, J.chest, J.neck); }
    if (part === 'neck') P('hl', 6, J.chest, J.neck);
    // near side
    if (legs) leg('body', hipR, '');
    if (legs && part === 'thigh') { P('hl', 10, hipR, J.knee); if (f) P('hl', 10, hipL, J.knee2); }
    if (legs && part === 'shin') { P('hl', 7.5, J.knee, J.ankle); if (f) P('hl', 7.5, J.knee2, J.ankle2); }
    if (part === 'glute') { C('hl', f ? J.hip : add(J.hip, [-1.5, 1]), f ? 8.5 : 8, true); }
    arm('body', J.sh, '');
    if (part === 'uarm') { P('hl', 7.5, J.sh, J.el); if (f) P('hl', 7.5, J.sh2, J.el2); }
    if (part === 'farm') { P('hl', 5.8, J.el, J.hand); if (f) P('hl', 5.8, J.el2, J.hand2); }
    if (part === 'delt') { C('hl', J.sh, 5.4, true); if (f) C('hl', J.sh2, 5.4, true); }
    // moving equipment
    const py = J.p.py || 0;
    (def.mv || []).forEach(m => { const b = res(J, m.to); P('eq', m.w || 3, res(J, m.from), m.py ? add(b, [0, py]) : b); });
    const at = add(res(J, def.at || 'hand'), [0, py]);
    const ends = f && !def.one && (def.at || 'hand') === 'hand' ? [at, J.hand2] : [at];
    const mirror = p => [200 - p[0], p[1]];
    const origin = i => { const o = typeof anchor === 'string' ? J[anchor + (i ? '2' : '')] : anchor; return i && typeof anchor !== 'string' ? mirror(o) : o; };
    if (tool === 'cable' || tool === 'band') ends.forEach((e, i) => { const o = origin(i); if (!o) return; P(tool === 'band' ? 'band' : 'cable', 1.6, o, e); if (typeof anchor !== 'string') C('eq', o, 2.5, true); });
    if (tool === 'link') P('band', 2, J.hand2, J.hand);
    if (tool === 'bar') {
      if (f) { P('eq', 2.5, add(J.hand2, [-16, 0]), add(J.hand, [16, 0])); [add(J.hand2, [-13, 0]), add(J.hand, [13, 0])].forEach(c => P('eq', 5, add(c, [0, -8]), add(c, [0, 8]))); }
      else { C('plate', at, 8, false); C('eq', at, 2, true); }
    }
    if (tool === 'db') { if (f) ends.forEach(e => P('eq', 6, add(e, [-4, 2]), add(e, [4, 2]))); else C('eq', at, 4.4, true); }
    if (tool === 'kb') C('eq', add(at, [0, 3]), 5.5, true);
    if (tool === 'ball') C('eq', at, 6, true);
    if (tool === 'wheel') C('plate', at, 5, false);
    if (tool === 'pad') C('eq', at, 4.2, true);
    if (tool === 'handle') ends.forEach(e => C('eq', e, 3, true));
    return out;
  }
  const dOf = pts => pts.map((p, i) => (i ? 'L' : 'M') + r1(p[0]) + ' ' + r1(p[1])).join('');
  const times = (() => {
    const t = [];
    for (let i = 0; i <= N; i++) t.push(T_UP * i / N);
    t.push(T_UP + T_HOLD);
    for (let i = 1; i <= N; i++) t.push(T_UP + T_HOLD + T_DOWN * i / N);
    t.push(DUR);
    return t.map(x => Math.round(x / DUR * 1000) / 1000).join(';');
  })();
  const seq = arr => { const up = arr.slice(), down = arr.slice().reverse(); return up.concat([arr[N]], down.slice(1), [arr[0]]); };
  const anim = (attr, vals) => (vals.every(v => v === vals[0]) ? '' : `<animate attributeName="${attr}" dur="${DUR}s" repeatCount="indefinite" calcMode="linear" keyTimes="${times}" values="${seq(vals).join(';')}"/>`);

  function lerpPose(a, b, e) {
    const out = {};
    new Set(Object.keys(a).concat(Object.keys(b))).forEach(k => {
      const x = a[k], y = b[k];
      if (x === undefined || y === undefined) { out[k] = x === undefined ? y : x; return; }
      if (typeof x === 'number') out[k] = x + (y - x) * e;
      else if (Array.isArray(x)) out[k] = x.map((v, i) => (typeof v === 'number' ? v + (y[i] - v) * e : v));
      else out[k] = x;
    });
    return out;
  }
  function spec(ex) {
    const m = MAP[ex.id] || [BY_MUSCLE[ex.m] || 'squat_bw', ex.custom ? 'none' : undefined];
    const def = m[3] ? Object.assign({}, A[m[0]], m[3]) : A[m[0]];
    return { def, tool: m[1] || def.tool, anchor: m[2] || def.anchor, part: PART[ex.m] };
  }
  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** SVG markup for an exercise; `still` draws both end positions without motion */
  function svg(ex, opts = {}) {
    const { def, tool, anchor, part } = spec(ex);
    const pa = Object.assign({}, def.c, def.a), pb = Object.assign({}, def.c, def.b);
    const solve = def.v === 'f' ? solveF : solveS;
    const still = opts.still || reduced();
    const fr = [];
    for (let i = 0; i <= N; i++) fr.push(shapes(solve(lerpPose(pa, pb, ease(i / N))), def, tool, anchor, part));
    const draw = (list, animate) => list.map((s, n) => {
      if (s.k === 'P') { const ds = fr.map(f => dOf(f[n].v)); return `<path class="f-${s.cls}" stroke-width="${s.w}" d="${animate ? ds[0] : dOf(s.v)}">${animate ? anim('d', ds) : ''}</path>`; }
      const cx = fr.map(f => r1(f[n].v[0])), cy = fr.map(f => r1(f[n].v[1]));
      return `<circle class="f-${s.cls}${s.fill ? ' fill' : ''}" r="${s.v[2]}" cx="${animate ? cx[0] : r1(s.v[0])}" cy="${animate ? cy[0] : r1(s.v[1])}">${animate ? anim('cx', cx) + anim('cy', cy) : ''}</circle>`;
    }).join('');
    const st = (def.st || []).map(s => (s[0] === 'L' ? `<path class="f-st" stroke-width="${s[5] || 3}" d="M${s[1]} ${s[2]}L${s[3]} ${s[4]}"/>` : s[0] === 'R' ? `<rect class="f-st fill" x="${s[1]}" y="${s[2]}" width="${s[3]}" height="${s[4]}" rx="2"/>` : `<circle class="f-st fill" cx="${s[1]}" cy="${s[2]}" r="${s[3]}"/>`)).join('');
    // frame the figure: fit the view to everything that is drawn so the body fills the box
    let x0 = 1e9, x1 = -1e9, y0 = 1e9;
    const see = (x, y, r) => { x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); };
    fr.forEach(f => f.forEach(sh => { if (sh.k === 'P') sh.v.forEach(q => see(q[0], q[1], sh.w / 2)); else see(sh.v[0], sh.v[1], sh.v[2]); }));
    (def.st || []).forEach(q => { if (q[0] === 'L') { see(q[1], q[2], 3); see(q[3], q[4], 3); } else if (q[0] === 'R') { see(q[1], q[2], 0); see(q[1] + q[3], q[2] + q[4], 0); } else see(q[1], q[2], q[3]); });
    const FLOOR = 140, LBL = 5;
    let h = Math.max(104, FLOOR - y0 + 8) + LBL, w = Math.max(x1 - x0 + 16, h * 1.45);
    if (w > h * 1.45) h = w / 1.45;
    const cx = (x0 + x1) / 2, vx = r1(cx - w / 2), vy = r1(FLOOR + LBL - h);
    const body = still ? `<g opacity=".28">${draw(fr[0], false)}</g>${draw(fr[N], false)}` : draw(fr[0], true);
    return `<svg class="fig" viewBox="${vx} ${vy} ${r1(w)} ${r1(h)}" role="img" aria-label="${opts.label || ''}" data-a="figToggle"><path class="f-floor" d="M${r1(cx - w / 2 + 8)} ${FLOOR}H${r1(cx + w / 2 - 8)}"/>${st}${body}</svg>`;
  }
  return { svg, has: ex => !!(MAP[ex.id] || BY_MUSCLE[ex.m]), MAP, A, DUR };
})();
