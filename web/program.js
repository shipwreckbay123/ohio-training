/* ===== Ohio's off-season program: dates, sessions, meals, reminder lines =====
   Training: 16-week program v2 (Offseason-16wk-v2.pdf), week 1 = Mon 30 Nov 2026.
   Plain script: pasted into the page by build.mjs, and run by build.mjs to make the iPhone reminder calendar. */

/* ---------- Dates ---------- */
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const mondayOf = s => { const d = parse(s); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return iso(d); };
const fmt = (s, o = { weekday: 'short', day: 'numeric', month: 'short' }) => parse(s).toLocaleDateString('en-AU', o);
const fmtShort = s => parse(s).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

/* ---------- Key dates ---------- */
const START = '2026-11-23';          // app start (first program's Phase 1). Weigh-ins, streaks and meal prep count from here.
const PROGRAM_START = '2026-11-30';  // 16-week program v2 (Offseason-16wk-v2.pdf), week 1
const TRIALS = '2027-03-15';         // week 16, trials
const BRIDGE = '2027-03-22';         // weeks 17–20 bridge block
const PRESEASON = '2027-04-19';      // season proper starts after the bridge block (reminders run to here)
const INSEASON = PRESEASON;
// First program, only for the week before v2 started (so old logs still open)
const OLD_PHASES = [
  { id: 'T', name: 'Test week', start: '2026-11-16', end: '2026-11-22', sp: 1, focus: 'Do the tests, learn the sessions',
    note: 'Test week. Do the tests on Saturday. Any other sessions this week are light: learn the moves and leave 3 in the tank.' },
  { id: '1', name: 'Phase 1 · Foundation', start: '2026-11-23', end: '2026-11-29', sp: 1, focus: 'Technique, muscle, base fitness' }
];
const PHASES = [
  { id: 'B1', name: 'Block 1 · Foundation', start: '2026-11-30', end: '2026-12-27', weeks: '1–4', contacts: '40–60',
    focus: 'Tissue, technique, acceleration base, first 1–2 kg. Week 1 is testing, week 4 is a deload.' },
  { id: 'B2', name: 'Block 2 · Strength', start: '2026-12-28', end: '2027-01-24', weeks: '5–8', contacts: '60–90',
    focus: 'Real kilos on the bar: intensity climbs to 82.5%. Hang power clean comes in. Week 8 deload + mid-point retest.' },
  { id: 'B3', name: 'Block 3 · Power', start: '2027-01-25', end: '2027-02-21', weeks: '9–12', contacts: '90–110 (ceiling)',
    focus: 'Turn strength into speed: cleans, depth jumps, contrast pairs. Week 12 deload.' },
  { id: 'B4', name: 'Block 4 · Sharpen', start: '2027-02-22', end: '2027-03-21', weeks: '13–16', contacts: '60–80',
    focus: 'Top speed, 30% less volume, arrive at trials fast and fresh. Week 16 taper + final tests.' },
  { id: 'BR', name: 'Bridge block', start: '2027-03-22', end: '2027-04-18', weeks: '17–20',
    focus: 'Ramp into the season alongside team training. Never walk straight out of a taper into a trial.' },
  { id: 'IS', name: 'In-season', start: '2027-04-19', end: '2027-09-30', weeks: '',
    focus: 'Minimum: one lower lift, one upper lift, one speed day. Nordics, Copenhagen planks and neck all season.' }
];
const OLD_TEST_DAYS = ['2026-11-21'];
// Week 1 Mon + Wed, week 8 Wed + Thu, week 16 Tue + Thu
const TEST_DAYS = [[1, 0], [1, 2], [8, 2], [8, 3], [16, 1], [16, 3]].map(([w, o]) => addDays(PROGRAM_START, 7 * (w - 1) + o));
const REST_DAYS = ['2026-12-25', '2027-01-01'];
const SCHOOL_HOLS = [['2026-12-18', '2027-01-27'], ['2027-04-12', '2027-04-23']];
const WEEK = { 1: 'gymA', 2: 'speedA', 3: 'gymB', 4: 'sand', 5: 'gymC', 6: 'speedB', 0: 'rest' }; // first program
const inSchoolHols = d => SCHOOL_HOLS.some(([a, b]) => d >= a && d <= b);
const WEEK_NOTE = {
  1: 'Testing week. Mon speed tests, Tue rest, Wed strength tests, Thu–Fri light technique only. Real training starts week 2.',
  4: 'Deload week: volume halves, weights drop to about 70%. This is where he actually gets stronger.',
  8: 'Deload week + mid-point retest (Wed speed, Thu strength). Enter the new 5RMs and every weight for weeks 9–16 updates.',
  12: 'Deload week: volume halves, weights drop to about 70%.',
  16: 'Taper week + final tests. Sharp, not tired.'
};
const BLOCK_NOTE = {
  B3: 'Heavy-lift gate: squat, bench and trap-bar sets above 85%, and cleans above 75%, need a coach technique check in the last 3 weeks. No coach? The app caps the weight there: same sets and reps, push bar speed.',
  B4: 'The coach gate still applies: 92.5% sets need a recent sign-off.'
};

// Program week: 1–16, then 17–20 for the bridge block; 0 outside them
function weekNo(d) {
  if (d < PROGRAM_START || d >= INSEASON) return 0;
  if (d >= BRIDGE) return 17 + Math.floor(daysBetween(BRIDGE, d) / 7);
  return Math.floor(daysBetween(PROGRAM_START, d) / 7) + 1;
}
// sp is the program week for v2 dates (sessionFor uses it to pick the week's sets and reps)
function phaseFor(d) {
  if (d < PROGRAM_START) return d < OLD_PHASES[0].start ? OLD_PHASES[0] : (OLD_PHASES.find(p => d >= p.start && d <= p.end) || OLD_PHASES[1]);
  const p = PHASES.find(x => d >= x.start && d <= x.end) || PHASES[PHASES.length - 1], wk = weekNo(d);
  const note = [WEEK_NOTE[wk], BLOCK_NOTE[p.id]].filter(Boolean).join(' ');
  return { ...p, sp: wk, name: p.name + (wk ? ' · Week ' + wk : ''), note };
}
function keyFor(d) {
  const dow = parse(d).getDay();
  if (d < PROGRAM_START) {
    if (OLD_TEST_DAYS.includes(d)) return 'test';
    const k = WEEK[dow];
    return k === 'sand' && inSchoolHols(d) ? 'sandHols' : k;
  }
  if (REST_DAYS.includes(d)) return 'rest';
  if (d >= INSEASON) return { 1: 'isL', 2: 'team', 3: 'isS', 4: 'isU', 5: 'team', 6: 'game', 0: 'rest' }[dow];
  const w = weekNo(d);
  if (w >= 17) return { 1: 'brL', 2: 'team', 3: 'brS', 4: 'brT', 5: 'team', 6: w === 17 ? 'F' : w === 20 ? 'game' : 'trial', 0: 'rest' }[dow];
  const o = { 1: { 1: 'test1', 2: 'rest', 3: 'test2' }, 8: { 3: 'test1', 4: 'test2' }, 16: { 2: 'test1', 3: 'mob', 4: 'test2', 5: 'easy', 6: 'teamskills' } }[w];
  if (o && o[dow]) return o[dow];
  if (dow === 4) return inSchoolHols(d) ? 'D' : 'Dsand'; // Thursday: Session D, plus school sandhills in term
  return { 1: 'A', 2: 'B', 3: 'C', 5: 'E', 6: 'F', 0: 'rest' }[dow];
}
const NOTRAIN_KEYS = ['rest', 'team', 'game', 'trial', 'teamskills', 'mob'];
const isTrainKey = k => !NOTRAIN_KEYS.includes(k);
const isSunday = d => parse(d).getDay() === 0;


/* ---------- Warm-ups ---------- */
const WARMUPS = {
  speed: { title: 'Speed warm-up · 10 min', items: [
    ['Easy jog or skips', '2 min', 'jog skip warm up'], ['Leg swings, front and side', '10 each leg', 'leg swings warm up'], ['Walking lunge + twist', '5 each leg', 'walking lunge with twist warm up'],
    ['A-march, then A-skip', '2 × 15m', 'A skip sprint drill'], ['High knees, then butt kicks', '2 × 15m each', 'high knees butt kicks drill'], ['Pogo hops (stiff ankles)', '2 × 10', 'pogo hops'],
    ['Build-up runs at 60%, 75%, 90%', '3 × 20m', 'build up runs sprint warm up'] ] },
  upper: { title: 'Upper warm-up · 8 min', items: [
    ['Bike', '3 min', ''], ['Band pull-aparts', '2 × 15', 'band pull aparts'], ['Push-ups', '2 × 10', 'push up proper form'], ['Dead hang from bar', '2 × 20s', 'dead hang'], ['Light sets of the first exercise', '2 sets', ''] ] },
  lower: { title: 'Lower warm-up · 8 min', items: [
    ['Bike', '3 min', ''], ['Glute bridges', '2 × 10', 'glute bridge form'], ['Bodyweight squats', '10', 'bodyweight squat form'], ['Cossack squats', '5 each side', 'cossack squat'], ['Walking lunges', '10', 'walking lunges form'], ['Light sets of the first exercise', '2 sets', ''] ] }
};
const COOLDOWN = 'Walk 1 min, then 30s each: kneeling hip-flexor stretch, hamstring, quad, chest in a doorway, child’s pose. Finish with 5 slow deep breaths.';
const PAIN_RULE = 'Sharp pain, pain that changes how he moves, or pain still there next morning: stop and get it checked by a physio. Sore, tired muscles are normal. Pain in a joint or tendon is not.';

/* ---------- Sessions ---------- */
// E(name, dose, rest seconds, cue, { tt: TikTok search words, lift })
const E = (n, d, r, c, extra = {}) => ({ n, d, r, c, ...extra });
const G = (a, b, c, d) => ({ 1: a, 2: b, 3: c, 4: d });
const CUE = {
  squat: 'Big breath, tight belly. Knees out, hips just below knees, drive up fast.',
  dl: 'Bar over mid-foot, flat back. Push the floor away, stand tall, don’t lean back.',
  bench: 'Shoulder blades squeezed, feet planted. Bar to lower chest, press up and slightly back.',
  box: 'Swing arms, jump UP, land soft and quiet. Step down, don’t jump down.',
  broad: 'Hips back, explode forward, stick the landing for 2 sec.',
  prop: 'Low and long first 3 steps. Eyes down, then rise gradually.',
  acc20: 'Stay low for the first 10m. Big arm drive, cheek to cheek.',
  fly: 'Tall hips, relaxed face and shoulders, quick feet under the body.',
  shuttle: 'Drop the hips before the line, plant the outside foot, touch, push off hard.',
  reactive: 'Sprint 5m at Dad. He points left or right late. Cut and go 5m.',
  sled: 'He should still be running, not grinding. If he slows to a walk, take weight off.'
};
const TT = {
  squat: 'back squat technique beginner', dl: 'deadlift technique beginner', bench: 'barbell bench press technique',
  box: 'box jump technique', broad: 'broad jump technique', prop: 'three point stance sprint start', acc20: 'acceleration sprint technique 20m',
  fly: 'flying sprint drill', shuttle: '5-10-5 pro agility drill', reactive: 'reactive agility drill rugby', sled: 'sled sprint technique'
};


/* ---------- Big lifts: the program's lift first, safer swaps after ----------
   The first option is what the 16-week program prescribes, with weights from his tested 5RM.
   Swaps have no tested max, so they go by feel (RPE 7–8). Safety: barbell work inside a rack with the
   safety arms set just below the bottom of the rep, a mate spotting the bench, never test a max alone. */
const VARIANTS = {
  squat: [
    { lift: 'squat', pdf: true, n: 'Back squat · in a rack, safety arms set', short: 'Back squat', c: 'Inside a squat rack with the safety arms set just below his lowest point. Big breath, tight belly, knees out, hips just below knees, drive up fast.', tt: 'back squat technique beginner' },
    { lift: 'hacksquat', safe: true, n: 'Hack squat machine', short: 'Hack squat', c: 'Feet shoulder width, mid-platform. Lower until thighs are parallel, drive up hard. The machine catches the weight, so it’s safe on his own.', tt: 'hack squat machine form' },
    { lift: 'goblet', n: 'Goblet squat (dumbbell at chest)', short: 'Goblet', c: 'Hold one dumbbell against the chest, elbows inside the knees. Sit down between the heels, chest up.', tt: 'goblet squat form' }
  ],
  hinge: [
    { lift: 'trapbar', pdf: true, safe: true, n: 'Trap-bar deadlift', short: 'Trap bar', c: 'Stand inside the hex bar, grip the high handles. Push the floor away, chest up, no yanking. One clean rep beats three ugly ones.', tt: 'trap bar deadlift form' },
    { lift: 'deadlift', n: 'Deadlift · a mate watching his back', short: 'Deadlift', c: 'Bar over mid-foot, flat back. Push the floor away, stand tall, don’t lean back. Stop the set if his back rounds.', tt: 'deadlift technique beginner' }
  ],
  press: [
    { lift: 'bench', pdf: true, n: 'Barbell bench · safety arms or a mate spotting', short: 'Barbell', c: 'Never alone without the safety arms set just above chest height. Shoulder blades squeezed, feet planted, bar to lower chest, press up and slightly back.', tt: 'bench press safety arms setup' },
    { lift: 'dbbench', safe: true, n: 'Dumbbell bench press', short: 'Dumbbells', c: 'Elbows about 45° from the body. Control down, push hard up. If he fails a rep he can lower the dumbbells to the floor.', tt: 'dumbbell bench press form' }
  ]
};
// rm: the test result the program weights come from; div turns a 5RM into an estimated 1RM
const LIFT_INFO = {
  squat: { name: 'Back squat', start: 45, inc: [5, 80, 2.5], rm: 'sq5', div: 0.87 },
  hacksquat: { name: 'Hack squat', start: 40, inc: [5, 120, 2.5] }, goblet: { name: 'Goblet squat', start: 24, inc: [2, 999, 2] },
  trapbar: { name: 'Trap bar', start: 60, inc: [5, 120, 2.5], rm: 'tb5', div: 0.88 },
  hipthrust: { name: 'Hip thrust', start: 60, inc: [5, 120, 2.5] }, deadlift: { name: 'Deadlift', start: 50, inc: [5, 100, 2.5] },
  bench: { name: 'Bench', start: 62.5, inc: [2.5, 999, 2.5], rm: 'bp5', div: 0.87 },
  dbbench: { name: 'DB bench (each hand)', start: 26, inc: [2, 999, 2] },
  clean: { name: 'Hang clean', start: 40, inc: [2.5, 999, 2.5], rm: 'cl1', div: 1 }
};
// BIG(slot, dose, rest, extra cue, % of 1RM): one of the big lifts, version picked on the day
const BIG = (slot, d, r, extra, pct) => E(slot, d, r, '', { slot, extra: extra || '', pct: pct || 0 });

// The first program (up to 29 Nov 2026), kept so old logs still open
function legacySession(key, sp) {
  const P = sp;
  const S = {
    gymA: { title: 'Gym A', sub: 'Bench + upper strength', where: 'Gym with mates', time: '4:00–5:00pm', dad: false, warm: 'upper', items: [
      E('Med ball chest pass into wall', '3 × 5', 60, 'Throw as hard as possible. Every rep is max effort.', { tt: 'medicine ball chest pass wall' }),
      E('Med ball rotational throw', '3 × 4 each side', 60, 'Turn from the hips first, arms follow.', { tt: 'medicine ball rotational throw' }),
      BIG('press', G('3 × 8', '4 × 5', '4 × 3', '3 × 3')[P], G(120, 150, 180, 180)[P], P === 3 ? 'After each set: 3 hard med ball chest passes into the wall. ' : ''),
      E('Chest-supported or seated cable row', G('4 × 10', '4 × 8', '3 × 8', '3 × 6')[P], 90, 'Pull elbows to back pockets, squeeze 1 sec.', { tt: 'chest supported row form' }),
      E('Assisted chin-up or lat pulldown', G('3 × 8', '4 × 6', '3 × 6', '3 × 6')[P], 90, 'Chest up to the bar, full hang at the bottom.', { tt: 'lat pulldown form' }),
      E('Seated DB shoulder press', G('3 × 10', '3 × 8', '3 × 8', '2 × 6')[P], 60, 'Ribs down, don’t arch the back.', { tt: 'seated dumbbell shoulder press form' }),
      E('Easy bike', G('15 min', '20 min', '20 min', '15 min')[P], 0, 'Can-still-talk pace. Builds the engine without hurting speed.', { tt: 'zone 2 cardio explained' })
    ] },
    gymB: { title: 'Gym B', sub: 'Squat + deadlift + legs', where: 'Gym with mates', time: '4:00–5:00pm', dad: false, warm: 'lower', items: [
      BIG('squat', G('3 × 8', '4 × 5', '4 × 3', '3 × 3')[P], G(120, 150, 180, 180)[P], P === 3 ? 'After each set: rest 30s, then 2 max broad jumps. ' : ''),
      BIG('hinge', G('3 × 6', '4 × 5', '4 × 3', '2 × 3')[P], G(150, 180, 180, 180)[P]),
      E('DB rear-foot-elevated split squat', G('2 × 8 each leg', '3 × 6 each leg', '2 × 6 each leg', '2 × 6 each leg')[P], 60, 'Front shin fairly upright. Drop the back knee straight down.', { tt: 'bulgarian split squat dumbbell form' }),
      E('Hamstring curl machine', G('3 × 10', '3 × 8', '3 × 8', '2 × 8')[P], 60, 'Slow on the way back (3 sec). Protects the hamstrings for sprinting.', { tt: 'hamstring curl machine form' }),
      E('Copenhagen plank, knee on bench', G('2 × 20s each side', '2 × 25s each side', '2 × 30s each side', '2 × 25s each side')[P], 45, 'Straight line, hips up. Protects the groin for side-steps.', { tt: 'copenhagen plank short lever' }),
      E('Calf raise', '3 × 12', 45, 'Full stretch at the bottom, pause at the top.', { tt: 'calf raise proper form' }),
      E('Easy bike flush', '10 min', 0, 'Easy only. Thursday sandhills are his hard fitness this week.', { tt: 'bike cool down flush' })
    ] },
    gymC: { title: 'Gym C', sub: 'Upper muscle + contact prep', where: 'Gym with mates', time: '4:00–5:00pm', dad: false, warm: 'upper', items: [
      E('Med ball overhead slam', '3 × 5', 60, 'Reach tall, slam through the floor.', { tt: 'medicine ball slam' }),
      E('Incline DB press', G('4 × 10', '4 × 8', '3 × 6', '3 × 6')[P], 90, 'Bench at about 30°. Control the stretch.', { tt: 'incline dumbbell press form' }),
      E('Single-arm DB row', G('4 × 10 each', '4 × 8 each', '3 × 8 each', '3 × 6 each')[P], 60, 'Flat back, pull to the hip.', { tt: 'single arm dumbbell row form' }),
      E('Cable or machine chest fly', G('3 × 12', '3 × 10', '3 × 10', '2 × 10')[P], 60, 'Slight bend in the elbows, squeeze.', { tt: 'cable chest fly form' }),
      E('Face pulls', '3 × 15', 45, 'Pull the rope to the forehead, thumbs back. Keeps shoulders healthy.', { tt: 'face pulls cable form' }),
      E('DB curls + rope pushdowns', '2 × 12 each', 45, 'No swinging.', { tt: 'dumbbell curl tricep rope pushdown form' }),
      E('Neck work, lying on bench', '2 × 15 each way', 45, 'Front, back, sides with a light plate or band. Slow and LIGHT. Props need a strong neck for scrums and contact.', { tt: 'neck training rugby prop' }),
      E('Farmer’s carry', '3 × 20m', 60, 'Heaviest dumbbells he can hold with tall posture.', { tt: 'farmers carry form' })
    ] },
    speedA: { title: 'Speed A', sub: 'Acceleration + jumps', where: 'Backyard 30m track', time: '4:00–4:45pm', dad: true, warm: 'speed', items: ({
      1: [ E('Wall drives', '2 × 5 each leg', 60, 'Lean into the wall at 45°, straight body line. Drive the knee up, punch the foot down.', { tt: 'wall drive sprint drill' }),
           E('Falling starts', '4 × 10m', 90, 'Fall forward from tall. First step lands under the hips. Push the ground back.', { tt: 'falling start sprint drill' }),
           E('Prop-stance starts (3-point)', '3 × 10m', 90, CUE.prop, { tt: TT.prop }),
           E('20m accelerations', '3 × 20m', 150, CUE.acc20, { tt: TT.acc20 }),
           E('Box jump, knee height', '3 × 3', 60, CUE.box, { tt: TT.box }),
           E('Broad jump', '3 × 3', 60, CUE.broad, { tt: TT.broad }) ],
      2: [ E('Wall drives', '2 × 5 each leg', 60, 'Straight body line, drive the knee up, punch the foot down.', { tt: 'wall drive sprint drill' }),
           E('Sled sprint · start 20kg', '4 × 15m', 120, CUE.sled, { tt: TT.sled }),
           E('Prop-stance starts (3-point)', '4 × 10m', 90, CUE.prop, { tt: TT.prop }),
           E('20m accelerations', '3 × 20m', 150, CUE.acc20, { tt: TT.acc20 }),
           E('Box jump', '4 × 3', 60, CUE.box, { tt: TT.box }),
           E('Broad jump', '3 × 3', 60, CUE.broad, { tt: TT.broad }),
           E('Single-leg hop', '2 × 3 each leg', 60, 'Hop forward, land on the same leg, hold 2 sec. Knee stays over the toes.', { tt: 'single leg hop and stick landing' }) ],
      3: [ E('Sled sprint · about 30kg', '3 × 15m', 150, CUE.sled, { tt: TT.sled }),
           E('Push-up starts', '3 × 10m', 90, 'Start chest-down on the grass. On “go”, pop up and sprint, like getting off the ruck.', { tt: 'push up start sprint drill' }),
           E('20m accelerations', '3 × 20m', 150, CUE.acc20, { tt: TT.acc20 }),
           E('Depth jump off 30cm box', '3 × 3', 90, 'Step off (don’t jump off), land and bounce straight up as fast as possible.', { tt: 'depth jump technique' }) ],
      4: [ E('Prop-stance starts (3-point)', '4 × 10m', 90, CUE.prop, { tt: TT.prop }),
           E('Chase starts vs Dad or a mate', '4 × 15m', 120, 'Chaser starts 2m behind. Race it.', { tt: 'chase sprint drill' }),
           E('Box jump', '3 × 3', 60, CUE.box, { tt: TT.box }),
           E('Broad jump', '2 × 3', 60, CUE.broad, { tt: TT.broad }) ]
    })[P] },
    speedB: { title: 'Speed B', sub: 'Agility + top speed', where: 'Football field', time: '8:30–9:15am', dad: true, warm: 'speed', items: ({
      1: [ E('5-10-5 shuttle', '4 (2 each way)', 90, CUE.shuttle, { tt: TT.shuttle }),
           E('45° cut drill: 5m, cut, 5m', '3 each side', 60, 'Plant the foot outside the hips. Lean the whole body, not just the head.', { tt: '45 degree cut drill' }),
           E('Flying sprint: 20m build + 10m fly', '3 reps', 180, CUE.fly, { tt: TT.fly }) ],
      2: [ E('5-10-5 shuttle', '4 (2 each way)', 90, CUE.shuttle, { tt: TT.shuttle }),
           E('Mirror drill with Dad', '4 × 5s', 60, 'Dad side-steps, he copies. Stay low, feet never cross.', { tt: 'mirror drill agility' }),
           E('Flying sprint: 20m build + 10m fly', '4 reps', 180, CUE.fly, { tt: TT.fly }) ],
      3: [ E('Reactive agility', '6 reps', 75, CUE.reactive, { tt: TT.reactive }),
           E('Flying sprint: 20m build + 20m fly', '4 reps', 210, CUE.fly, { tt: TT.fly }) ],
      4: [ E('Reactive agility', '6 reps', 75, CUE.reactive, { tt: TT.reactive }),
           E('Flying sprint: 20m build + 20m fly', '3 reps', 210, CUE.fly, { tt: TT.fly }),
           E('Prop repeat efforts', '2 sets × 5', 180, 'Chest to ground, up, sprint 10m, walk back. 20s per rep, 3 min between sets.', { tt: 'rugby league repeat effort drill' }) ]
    })[P] },
    sand: { title: 'Sandhills', sub: 'School fitness at Greenhills · easy day from us', where: 'Greenhills with school', time: 'School', dad: false, warm: null, items: [
      E('Sandhill session with school', 'Whatever the coach sets', 0, 'This is his hard fitness for the week. Drive the arms, short quick steps up, walk down to recover.', { tt: 'sand dune hill sprints technique' }),
      E('After school: easy mobility', '10 min', 0, 'Kneeling hip-flexor stretch, calves, hamstrings, glutes. Foam roll if you have one. Nothing hard.', { tt: 'mobility routine after running' }),
      E('Big feed and 2 big bottles of water', 'Tonight', 0, 'Sand running burns a lot. Eat the full plan today.', { tt: '' })
    ] },
    sandHols: { title: 'Sandhills (optional)', sub: 'No school this week · easy day', where: 'Greenhills or rest', time: 'Morning', dad: false, warm: 'speed', items: [
      E('Sandhill reps (optional)', '6–8 hills, walk down', 0, 'Only if he feels fresh. Hard up, walk down. Otherwise take the day off.', { tt: 'sand dune hill sprints technique' }),
      E('Easy mobility', '10 min', 0, 'Hip flexors, calves, hamstrings, glutes.', { tt: 'mobility routine after running' })
    ] },
    test: { title: 'Test day', sub: 'Every 4 weeks · film it', where: 'Field (same surface and boots each time)', time: 'Fresh, after an easy day', dad: true, warm: 'speed', items: [
      E('Bodyweight', 'Morning', 0, 'After the toilet, before breakfast.', { tt: '' }),
      E('10m + 40m sprint', 'Best of 3', 180, 'Prop-stance start. Film side-on in slow-mo. Time from first movement to crossing the cone; take the 10m split from the same run.', { tt: 'how to time 40m sprint with phone slow motion' }),
      E('Vertical jump', 'Best of 3', 60, 'Chalk fingers. Stand side-on to a wall, mark the reach. Jump and touch high. The gap is his jump in cm.', { tt: 'vertical jump test wall' }),
      E('Broad jump', 'Best of 3', 60, 'Two feet. Measure from the toe line to the back of the rear heel.', { tt: 'standing broad jump test' }),
      E('5-10-5 shuttle', '2 each way', 120, 'Record right-first and left-first separately.', { tt: TT.shuttle }),
      E('Chin-ups', '1 max set', 0, 'Full hang to chin over the bar. No kicking.', { tt: 'strict chin up form' }),
      E('Big lifts', '3-rep max', 180, 'At the gym this week: bench on Monday, squat and deadlift versions on Wednesday. Test the version he trains. Safety arms set, a mate spotting, and stop the moment form breaks.', { tt: 'how to test 3 rep max safely' })
    ] },
    rest: { title: 'Rest day', sub: 'Recovery is when the muscle gets built', where: 'Anywhere', time: '—', dad: false, warm: null, items: [] }
  };
  return S[key];
}

/* ---------- 16-week program v2 sessions (from Mon 30 Nov 2026) ---------- */
WARMUPS.std = { title: 'Standard warm-up · 12 min · no skipping', items: [
  ['Bike or row, easy', '3 min', ''], ['Ankle rocks, leg swings, hip openers', '10 / 10 / 8 each side', 'ankle rocks leg swings hip openers warm up'],
  ['Pogo hops, then A-march', '2 × 10, 2 × 10m', 'pogo hops A march drill'], ['Band pull-aparts, band external rotation', '15, 12 each side', 'band pull aparts external rotation'],
  ['Ramp-up on the first main lift: bar, 40%, 60%, 75%', '8, 5, 3, 2 reps', 'warm up sets before heavy squat'] ] };
const C2 = {
  squat: CUE.squat, bench: CUE.bench, box: CUE.box, broad: CUE.broad, shuttle: CUE.shuttle, fly: CUE.fly,
  clean: 'Hips, not arms: the arms are just ropes. Fast elbows, catch high. Jump and shrug. Stop the set the moment the bar slows.',
  rdl: 'Soft knees, hips back, flat back. Feel the hamstring stretch, then drive the hips through.',
  nordic: 'Kneel with ankles anchored. Lower as slowly as you can, catch with your hands, push back up.',
  cph: 'Top leg on the bench, body in a straight line, hips up. Each side. Protects the groin.',
  accel10: 'A primer, not speed work. Walk back. Stop if the last two look worse than the first.',
  depth: 'Step off (don’t jump off). Land silent on the balls of the feet, bounce straight up. Loud landing = lower the box. Knees caving = stop. Max 12 a session.',
  depthSprint: 'Step off, land, and sprint 10m straight away. Silent landing, knees over toes.',
  sprint: 'Full rest: walk back. Gasping = not sprinting. Stop when times drop.',
  maxv: 'Tall and relaxed, claw the ground back, don’t reach. 20–30m build-up before every flying rep. Full rest.',
  neck: 'Front, back, both sides. Slow and controlled, harness or hand resistance.',
  face: 'Pull the rope to the forehead, thumbs back. Keeps the shoulders healthy.',
  row: 'Flat back, pull to the hip, squeeze 1 sec. Each arm.',
  chin: 'Full hang to chin over the bar. Stop each set 2 reps short of failure. Can’t do 5 strict? Use a band, or 5 × 4-second negatives.',
  wchin: 'Weight on a belt or a DB between the feet. Full hang every rep, no kicking.',
  ohp: 'Standing. Ribs down, glutes tight, press straight up.',
  pushpress: 'Short dip with the knees, drive with the legs, lock out overhead. Ribs down.',
  incline: 'Bench at about 30°. Control the stretch, press hard.',
  csrow: 'Chest on the bench so the back can’t cheat. Pull elbows to the back pockets.',
  hipthrust: 'Upper back on the bench, chin tucked. Drive through the heels, squeeze 1 sec at the top.',
  lunge: 'Long step back, back knee drops straight down, push through the front heel. Each leg.',
  backext: '45° bench. Hinge at the hips, flat back, squeeze the glutes at the top. Don’t over-arch.',
  pallof: 'Arms straight out, resist the cable trying to twist you. Each side.',
  calf: 'Full stretch at the bottom, pause at the top.',
  farmer: 'Heaviest dumbbells he can hold with tall posture. 20m per trip.',
  mb: 'Max intent every rep. Turn from the hips first, arms follow.',
  slam: 'Reach tall, slam through the floor. Every rep max effort.',
  split: 'Front shin fairly upright, back knee drops straight down. Each leg.',
  jumpsq: 'Light bar (about 20–30% of squat 1RM). Jump as high as possible, land soft, reset each rep.',
  jpush: 'Explode so the hands leave the floor (clap if you can). Land soft, reset.',
  chestThrow: '2–3 kg ball, right after the bench set. Throw as hard as possible.',
  decel: 'Sprint 10m, brake hard into a balanced 2 s hold, reset 5m. Low hips, short choppy steps. Each side.',
  partner: 'Dad points left or right as he reaches the cone. React, don’t guess. Full rest.',
  mirror: 'Dad or a mate moves, he copies. Stay low, feet never cross. No contact.',
  ball: 'React to a rolled or bounced ball: 2m cut, then accelerate hard.',
  chase: '5m grid: evade the chaser for 15 s. Full rest between reps.',
  evade: '10m channel, attacker vs defender, no contact. Work the outside shoulder.',
  snap: 'Rise on the toes, snap down fast into a quiet athletic landing, hold 2 s, then jump.',
  tempo: '70%: steady, can talk in short sentences. 1 min rest between runs. Capped at 15 min.',
  mech: 'Tall posture, shin angled forward at the start, arms driving, push the ground away, don’t reach with the lead foot.',
  five: 'Build in 10% jumps, 3 reps each, until 3 reps feel like RPE 8. Then one set of 5. Moved clean? Add 5 kg and go again. Stop at the first set where rep 5 slows badly. No grinding. A mate spotting, safety arms set.'
};
const ttFor = n => n.replace(/\s*[(·,:].*$/, '').toLowerCase() + ' technique';
const X = (n, d, r, c, extra) => d == null ? null : E(n, d, r, c, { tt: ttFor(n), ...(extra || {}) });
const SL = (slot, spec, r, extra) => { if (!spec) return null; const [s, reps, pct] = spec; return BIG(slot, pct ? `${s} × ${reps} @ ${pct}%` : `${s} × ${reps}`, r, extra, pct); };
const CL = (spec, r) => { if (!spec) return null; const [s, reps, pct] = spec; return E('Hang power clean', `${s} × ${reps} @ ${pct}%`, r, C2.clean, { lift: 'clean', pct, tt: 'hang power clean technique' }); };
const durability = () => [X('Nordic curl', '2 × 5', 90, C2.nordic), X('Copenhagen plank', '2 × 30 s each side', 60, C2.cph), X('Neck', '2 × 15 each way', 60, C2.neck, { tt: 'neck training rugby prop' })];
const SLOT = { A: ['4:00–5:20pm', 'Gym', false], B: ['4:00–5:20pm', 'Field, then gym', true], C: ['4:00–4:55pm', 'Backyard track or field', true],
  D: ['4:00–5:15pm', 'Gym', false], Dsand: ['Afternoon, once home', 'Sandhills at school, then gym', false], E: ['4:00–5:00pm', 'Gym', false], F: ['9:00–9:45am', 'Home or club', false] };
const NOTRAIN = {
  rest: { title: 'Rest day', sub: 'Recovery is when the muscle gets built', where: 'Anywhere', time: '—', dad: false, warm: null, items: [] },
  team: { title: 'Team training', sub: 'Club session. Nothing extra from this program today.', where: 'Club', time: 'Club time', dad: false, warm: null, items: [] },
  game: { title: 'Game day', sub: 'Play well. Big carb meal the night before.', where: 'Club', time: 'Game time', dad: false, warm: null, items: [] },
  trial: { title: 'Trial', sub: 'Warm up properly and empty the tank.', where: 'Club', time: 'Trial time', dad: false, warm: null, items: [] },
  teamskills: { title: 'Team session', sub: 'Team session or skills only. Nothing extra.', where: 'Club', time: 'Club time', dad: false, warm: null, items: [] },
  mob: { title: 'Rest or mobility', sub: 'Optional 20 min mobility: hips, ankles, upper back', where: 'Anywhere', time: '—', dad: false, warm: null, items: [] }
};
const SAT_F = () => ({ title: 'Session F', sub: 'Easy day: skills + durability', time: SLOT.F[0], where: SLOT.F[1], dad: false, mins: 45, warm: 'std',
  note: 'He should finish feeling better than when he started. No wrestling, no max efforts, nothing timed.', items: [
  X('Light movement', '8 min', 0, '5 min bike or walk, A-skips, 2–3 easy build-ups. Nothing timed.', { tt: '' }),
  X('Tackle technique', '10–12 reps', 0, 'On bags only, at walk-through speed. Live contact belongs at team training.', { tt: 'rugby league tackle technique bag' }),
  X('Grip', '3 × 20m', 60, 'Towel hang or a light farmer’s hold.', { tt: 'towel hang grip training' }),
  X('Neck + shoulders', 'Neck 3 × 15 · Y-T-W 2 × 12 · ER 2 × 15', 45, C2.neck + ' Then Y-T-W raises and band external rotation.', { tt: 'neck training rugby prop' }),
  X('Mobility', '15 min', 0, 'Hips, ankles, upper-back flow.', { tt: 'hip ankle thoracic mobility routine' })
] });

function newSession(key, wk) {
  if (NOTRAIN[key]) return NOTRAIN[key];
  const j = wk >= 17 ? wk - 17 : Math.max(0, wk - 1) % 4, blk = wk <= 4 ? 1 : wk <= 8 ? 2 : wk <= 12 ? 3 : 4;
  const pick = a => a[j];
  const slot = SLOT[key] || ['4:00pm–', 'Gym', false];
  const build = (title, sub, mins, items, extra = {}) => ({ title, sub, mins, time: slot[0], where: slot[1], dad: slot[2], warm: 'std', items: items.filter(Boolean), ...extra });
  const COND = [null,
    () => X('Conditioning: tempo runs, 4 min @ 70%', pick(['1 run', '3 runs', '3 runs', '2 runs']), 60, C2.tempo + ' No school sandhills this week, so this is the week’s conditioning.', { tt: 'tempo runs conditioning' }),
    () => X('Conditioning: 6 × 60m @ 85%', 'or 12 min small-sided game', 60, 'No school sandhills this week, so this is the week’s conditioning.', { tt: 'rugby league conditioning drills' }),
    () => X('Conditioning: repeated-effort shuttles', '2 sets × 8 × 20m', 180, '20 s on, 40 s off. 3 min between sets. No school sandhills this week, so this is the week’s conditioning.', { tt: 'rugby league repeat effort drill' })];
  const sand = key === 'Dsand'
    ? X('Conditioning: sandhills with school', 'Whatever the coach sets', 0, 'This is the week’s conditioning. Drive the arms, short quick steps up, walk down. The rest of Session D is this afternoon once he’s home; if his legs are cooked, cut the accessories and keep the trap bar.', { tt: 'sand dune hill sprints technique' })
    : key === 'D' && blk <= 3 ? COND[blk]() : null;

  if (key === 'test1') {
    const full = wk !== 8;
    return build('Test Day 1', 'Speed, jumps, agility · film it', 60, [
      X('Body weight', 'Morning', 0, 'After the toilet, before food.' + (full ? ' Also height, and a front and side photo.' : ''), { tt: '' }),
      X('10, 20 and 40m sprint', 'Best of 2', 180, 'Full rest between runs. Same surface and boots every time. Film side-on; take the 10 and 20m splits from the 40.', { tt: 'how to time 40m sprint with phone slow motion' }),
      X('Vertical jump', 'Best of 3', 60, 'Chalk fingers. Side-on to a wall, mark the standing reach. Jump and touch high. The gap is the jump in cm.', { tt: 'vertical jump test wall' }),
      X('Broad jump', 'Best of 3', 60, 'Two feet. Toe line to the back of the rear heel.', { tt: 'standing broad jump test' }),
      full ? X('5-10-5 shuttle', 'Best of 2 each way', 120, 'Record right-first and left-first separately.', { tt: TT.shuttle }) : null
    ], { time: 'Fresh, after an easy day', where: 'Field (same surface and boots each time)', dad: true,
      note: wk === 8 ? 'Mid-point retest. Compare with week 1.' : wk === 16 ? 'Final tests. Compare with week 1.' : 'Baseline. Every weight in the program comes from these numbers.' });
  }
  if (key === 'test2') {
    const full = wk !== 8;
    return build('Test Day 2', 'Strength · 5RM tests', 75, [
      X('5RM back squat', 'Build to a 5RM', 180, C2.five, { tt: 'how to test 5 rep max safely' }),
      X('5RM bench press', 'Build to a 5RM', 180, C2.five, { tt: 'bench press safety arms setup' }),
      X('5RM trap-bar deadlift', 'Build to a 5RM', 180, C2.five, { tt: 'trap bar deadlift form' }),
      full ? X('Strict chin-up max', '1 max set', 0, 'Full hang to chin over the bar. No kicking.', { tt: 'strict chin up form' }) : null,
      full ? X('Beep test or Yo-Yo IR1', 'Last thing', 0, 'Same course and surface each time.', { tt: 'beep test how to' }) : null
    ], { time: '4:00–5:15pm', where: 'Gym', dad: true,
      note: 'Enter the 5RMs on the Progress tab. The app works out every working weight from them (1RM = 5RM ÷ 0.87 for squat and bench, ÷ 0.88 for trap bar).' });
  }
  if (key === 'easy') return build('Easy movement', '20 min, no lifting', 20, [X('Easy movement', '20 min', 0, 'Bike, walk, light skips. No lifting.', { tt: '' })], { warm: null, time: 'Any time', where: 'Anywhere' });

  /* Bridge block, weeks 17–20 */
  if (key === 'brL') return build('Lift · lower', `Bridge week ${wk}`, 50, [
    SL('squat', pick([[4, 5, 75], [4, 4, 80], [3, 3, 85], [3, 3, 80]]), 180), wk === 17 ? SL('press', [4, 5, 75], 150) : null, ...durability()], { time: '4:00–4:50pm', where: 'Gym' });
  if (key === 'brS') return build('Speed', `Bridge week ${wk}`, 30, [X('Sprints', pick(['4 × 20m', '3 × 30m', '2 × 40m', '2 × 30m']), 180, C2.sprint, { tt: TT.acc20 })], { time: '4:00–4:30pm', where: 'Backyard track or field', dad: true });
  if (key === 'brT') return wk === 17
    ? build('Lift · hinge', 'Bridge week 17', 50, [SL('hinge', [4, 5, 0], 150), X('Hang power clean', '4 × 3 light', 120, C2.clean, { lift: 'clean', tt: 'hang power clean technique' }), ...durability()], { time: '4:00–4:50pm', where: 'Gym' })
    : build('Light lift', `Bridge week ${wk} · keep it easy`, 40, [SL('hinge', [3, 3, 70], 150), SL('press', [3, 3, 70], 150), ...durability()], { time: '4:00–4:40pm', where: 'Gym' });
  /* In-season minimum */
  if (key === 'isL') return build('In-season lift · lower', 'Minimum dose', 40, [SL('squat', [3, 3, 80], 180), ...durability().slice(0, 2)], { time: '4:00–4:40pm', where: 'Gym' });
  if (key === 'isS') return build('In-season speed', 'Short and sharp', 25, [X('Sprints', '3 × 20m', 150, C2.sprint, { tt: TT.acc20 }), X('Flying 20m', '2 reps', 180, C2.maxv, { tt: TT.fly })], { time: '4:00–4:25pm', where: 'Backyard track or field' });
  if (key === 'isU') return build('In-season lift · upper', 'Minimum dose', 40, [SL('press', [3, 3, 80], 180), X('Weighted chin-up', '3 × 3', 120, C2.wchin), X('Neck', '2 × 15 each way', 60, C2.neck, { tt: 'neck training rugby prop' })], { time: '4:00–4:40pm', where: 'Gym' });

  if (key === 'F') return SAT_F();
  const light = wk === 1 && (key === 'D' || key === 'Dsand' || key === 'E') ? { note: 'Week 1: light technique work only. Practise the movements at easy weights. Real training starts next week.' } : {};
  const isD = key === 'D' || key === 'Dsand';

  if (blk === 1) {
    if (key === 'A') return build('Session A', 'Lower strength + jumps', 80, [
      X('Snap-down to jump', pick(['3 × 5', '3 × 5', '4 × 4', '2 × 4']), 90, C2.snap),
      X('Box jump', pick(['3 × 4 @ 40 cm', '4 × 4 @ 45 cm', '4 × 4 @ 50 cm', '2 × 4 @ 40 cm']), 90, C2.box, { tt: TT.box }),
      SL('squat', pick([[4, 7, 67.5], [4, 7, 72], [4, 6, 77], [2, 6, 65]]), 165),
      X('Romanian deadlift', pick(['3 × 8 @ RPE 7', '3 × 8', '4 × 6', '2 × 8']), 90, C2.rdl),
      X('DB split squat', pick(['3 × 8 each leg', '3 × 9 each leg', '3 × 10 each leg', '2 × 8 each leg']), 75, C2.split, { tt: 'dumbbell split squat form' }),
      X('Nordic curl (4 s lower)', pick(['3 × 4', '3 × 5', '3 × 5', '2 × 4']), 90, C2.nordic),
      X('Copenhagen plank', pick(['3 × 20 s', '3 × 25 s', '3 × 30 s', '2 × 20 s']), 60, C2.cph, { tt: 'copenhagen plank short lever' }),
      X('10m acceleration, 2-point start', pick(['6 reps', '6 reps', '6 reps', '4 reps']), 45, C2.accel10, { tt: 'two point stance sprint start' })]);
    if (key === 'B') return build('Session B', 'Agility first, then upper strength', 80, [
      X('Deceleration drill', pick(['4 each side', '4 each side', '5 each side', '3 each side']), 60, C2.decel),
      X('5-10-5 shuttle', pick(['3 each way', '4 each way', '4 each way', '2 each way']), 90, C2.shuttle, { tt: TT.shuttle }),
      SL('press', pick([[4, 7, 67.5], [4, 7, 72], [4, 6, 77], [2, 6, 65]]), 150),
      X('Chin-up, 2 in reserve', pick(['3 sets', '3 sets', '4 sets', '2 sets']), 90, C2.chin, { tt: 'strict chin up form' }),
      X('Single-arm DB row', pick(['3 × 10', '3 × 10', '3 × 11', '2 × 10']), 75, C2.row),
      X('Standing DB overhead press', pick(['3 × 8', '3 × 9', '3 × 9', '2 × 8']), 75, C2.ohp),
      X('Face pull', pick(['3 × 20', '3 × 20', '3 × 20', '2 × 20']), 60, C2.face, { tt: 'face pulls cable form' }),
      X('Neck (harness or manual)', pick(['3 × 15 each way', '3 × 15 each way', '3 × 15 each way', '2 × 15 each way']), 60, C2.neck, { tt: 'neck training rugby prop' })]);
    if (key === 'C') return build('Session C', 'Speed + plyometrics · no conditioning', 55, pick([
      [X('Mechanics', '12 min', 0, 'A-skips, B-skips, wall drills, ankle pops. ' + C2.mech, { tt: 'A skip B skip sprint drills' }), X('10m sprints, standing start', '6 reps', 60, C2.sprint, { tt: TT.acc20 }), X('Pogo hops', '2 × 10', 60, 'Stiff ankles, quick off the ground.'), X('Box jump', '3 × 4 @ 40 cm', 90, C2.box, { tt: TT.box }), X('Finish', '5 min', 0, 'Walk, then stretch.', { tt: '' })],
      [X('Mechanics + falling starts', '12 min · 4 falling starts', 0, 'A-skips, B-skips, wall drills, ankle pops. ' + C2.mech, { tt: 'falling start sprint drill' }), X('10m sprints, falling start', '8 reps', 60, C2.sprint, { tt: 'falling start sprint drill' }), X('Box jump', '4 × 4 @ 45 cm', 90, C2.box, { tt: TT.box }), X('Broad jump', '3 × 3', 90, C2.broad, { tt: TT.broad }), X('Finish', '5 min', 0, 'Walk, then stretch.', { tt: '' })],
      [X('Mechanics + 3-point starts', '12 min · 4 starts', 0, 'A-skips, B-skips, wall drills, ankle pops. ' + C2.mech, { tt: TT.prop }), X('15m sprints from 3-point', '6 reps', 75, C2.sprint, { tt: TT.prop }), X('Broad jump', '4 × 3', 90, C2.broad, { tt: TT.broad }), X('Lateral bound', '3 × 5 each side', 75, 'Bound sideways off one leg, stick the landing on the other for 2 s.'), X('Finish', '5 min', 0, 'Walk, then stretch.', { tt: '' })],
      [X('Mechanics only, easy', '12 min', 0, C2.mech, { tt: 'A skip B skip sprint drills' }), X('10m sprints, easy', '4 reps', 60, C2.sprint, { tt: '' }), X('Jumps', '2 × 4', 90, 'Any easy jump. Quality only.', { tt: '' }), X('Finish', '5 min', 0, 'Walk, then stretch.', { tt: '' })]
    ]), { note: 'Jump contacts this block: 40–60 a week. That’s deliberately low.' });
    if (isD) return build('Session D', 'Hinge + posterior chain', 75, [sand,
      SL('hinge', pick([[4, 6, 65], [4, 6, 70], [5, 5, 75], [2, 5, 65]]), 165),
      X('Barbell hip thrust', pick(['3 × 10', '3 × 12', '4 × 10', '2 × 10']), 90, C2.hipthrust),
      X('DB reverse lunge', pick(['3 × 8 each leg', '3 × 9 each leg', '3 × 10 each leg', '2 × 8 each leg']), 75, C2.lunge),
      X('45° back extension', pick(['3 × 12', '3 × 12', '3 × 15', '2 × 12']), 60, C2.backext, { tt: '45 degree back extension form' }),
      X('Pallof press', pick(['3 × 12 each side', '3 × 12 each side', '3 × 15 each side', '2 × 12 each side']), 60, C2.pallof),
      X('Standing calf raise', pick(['3 × 15', '3 × 15', '3 × 20', '2 × 15']), 60, C2.calf),
      X('Heavy farmer’s carry', pick(['2 trips', '3 trips', '3 trips', '2 trips']), 90, C2.farmer, { tt: 'farmers carry form' })], light);
    if (key === 'E') return build('Session E', 'Upper power', 60, [
      X('Med ball slam / rotational throw', pick(['3 × 4 each', '4 × 4 each', '4 × 5 each', '2 × 4 each']), 60, C2.mb, { tt: 'medicine ball rotational throw' }),
      X('Incline DB press', pick(['3 × 10', '3 × 10', '3 × 11', '2 × 10']), 90, C2.incline),
      X('Push press', pick(['3 × 6', '3 × 6', '3 × 7', '2 × 6']), 90, C2.pushpress),
      X('Chest-supported row', pick(['3 × 10', '3 × 10', '3 × 11', '2 × 10']), 75, C2.csrow),
      X('Face pull', pick(['3 × 20', '3 × 20', '3 × 20', '2 × 20']), 60, C2.face, { tt: 'face pulls cable form' })], light);
  }
  if (blk === 2) {
    if (key === 'A') return build('Session A', 'Lower strength + clean technique', 80, [
      X('Box jump', pick(['3 × 4 @ 50 cm', '4 × 4 @ 55 cm', '4 × 3 @ 55 cm', '2 × 4 @ 40 cm']), 90, C2.box, { tt: TT.box }),
      j === 0 ? X('Hang power clean (technique)', '5 × 3 light · RPE 5', 120, C2.clean + ' Coach check this week, before it gets loaded.', { lift: 'clean', tt: 'hang power clean technique' })
              : CL(pick([null, [5, 3, 60], [5, 3, 65], [3, 2, 60]]), 120),
      SL('squat', pick([[5, 5, 77.5], [5, 5, 80], [4, 5, 82.5], [3, 4, 70]]), 180),
      X('Romanian deadlift', pick(['4 × 6', '4 × 6', '4 × 6', '2 × 6']), 90, C2.rdl),
      X('Split squat', pick(['3 × 8 each leg', '3 × 8 each leg', '3 × 8 each leg', '2 × 8 each leg']), 75, C2.split, { tt: 'dumbbell split squat form' }),
      X('Nordic curl (5 s lower)', pick(['3 × 5', '3 × 6', '3 × 6', '2 × 5']), 90, C2.nordic),
      X('Copenhagen plank', pick(['3 × 30 s', '3 × 35 s', '3 × 35 s', '2 × 25 s']), 60, C2.cph, { tt: 'copenhagen plank short lever' }),
      X('10m acceleration', pick(['6 reps', '6 reps', '6 reps', '4 reps']), 45, C2.accel10, { tt: 'two point stance sprint start' })]);
    if (key === 'B') return build('Session B', 'Reactive agility + upper', 80, [
      X('Partner-cued 5-10-5', pick(['6 reps', '8 reps', '8 reps', '4 reps']), 90, C2.partner, { tt: TT.reactive }),
      X('Mirror drill, 20 s', pick(['3 reps', '4 reps', '4 reps', '2 reps']), 60, C2.mirror, { tt: 'mirror drill agility' }),
      SL('press', pick([[5, 5, 77.5], [5, 5, 80], [4, 5, 82.5], [3, 4, 70]]), 180),
      X('Weighted chin-up', pick(['5 × 3', '5 × 3', '4 × 3', '3 × 2']), 120, C2.wchin),
      X('Single-arm DB row', pick(['4 × 8', '4 × 8', '4 × 8', '2 × 8']), 75, C2.row),
      X('Push press', pick(['4 × 5', '4 × 5', '4 × 4', '2 × 5']), 90, C2.pushpress),
      X('Face pull + external rotation', pick(['3 × 20', '3 × 20', '3 × 20', '2 × 20']), 60, C2.face, { tt: 'face pulls cable form' }),
      X('Neck', pick(['3 × 15 each way', '3 × 15 each way', '3 × 15 each way', '2 × 15 each way']), 60, C2.neck, { tt: 'neck training rugby prop' })]);
    if (key === 'C') return build('Session C', 'Speed', 55, pick([
      [X('Box jump', '3 × 4', 90, C2.box, { tt: TT.box }), X('20m free sprints', '4 reps', 150, C2.sprint, { tt: TT.acc20 }), X('10m from 3-point', '3 reps', 75, C2.sprint, { tt: TT.prop })],
      [X('Box jump', '3 × 4', 90, C2.box, { tt: TT.box }), X('20m resisted sprints', '4 reps', 150, 'Sled or band, 10–15% of body weight. Push the ground back, don’t lean. ' + CUE.sled, { tt: TT.sled }), X('20m free sprints', '3 reps', 150, C2.sprint, { tt: TT.acc20 })],
      [X('Box jump', '3 × 4', 90, C2.box, { tt: TT.box }), X('25m free sprints', '4 reps', 150, C2.sprint, { tt: TT.acc20 }), X('Flying 10m (20m build, 10m flat out)', '3 reps', 180, C2.fly, { tt: TT.fly })],
      [X('20m sprints, easy', '4 reps', 120, 'Deload. Smooth and relaxed.', { tt: '' })]
    ]), { note: 'Jump contacts this block: 60–90 a week.' });
    if (isD) return build('Session D', 'Posterior chain', 75, [sand,
      SL('hinge', pick([[5, 5, 77.5], [4, 5, 82.5], [4, 4, 87.5], [3, 4, 70]]), 180),
      X('Hip thrust', pick(['4 × 10', '4 × 10', '4 × 8', '2 × 10']), 90, C2.hipthrust, { tt: 'barbell hip thrust form' }),
      X('Reverse lunge', pick(['3 × 8 each leg', '3 × 8 each leg', '3 × 8 each leg', '2 × 8 each leg']), 75, C2.lunge),
      X('Back extension', pick(['3 × 12', '3 × 15', '3 × 15', '2 × 12']), 60, C2.backext, { tt: '45 degree back extension form' }),
      X('Pallof press', pick(['3 × 12 each side', '3 × 12 each side', '3 × 15 each side', '2 × 12 each side']), 60, C2.pallof),
      X('Calf raise', pick(['3 × 20', '3 × 20', '3 × 20', '2 × 15']), 60, C2.calf),
      X('Farmer’s carry', pick(['3 trips', '4 trips', '4 trips', '2 trips']), 90, C2.farmer, { tt: 'farmers carry form' })]);
    if (key === 'E') return build('Session E', 'Upper power', 60, [
      X('Med ball rotational throw', pick(['4 × 4 each', '4 × 4 each', '5 × 3 each', '3 × 4 each']), 60, C2.mb, { tt: 'medicine ball rotational throw' }),
      X('Incline DB press', pick(['3 × 10', '3 × 10', '3 × 8', '2 × 10']), 90, C2.incline),
      X('Weighted chin-up', pick(['4 × 5', '4 × 5', '4 × 4', '2 × 5']), 120, C2.wchin),
      X('Chest-supported row', pick(['4 × 8', '4 × 8', '4 × 8', '2 × 8']), 75, C2.csrow),
      X('1-on-1 wrestling from knees', '3 × 45 s', 60, 'Controlled, with a sensible partner.', { tt: 'rugby league wrestle training' }),
      X('Grip fights', '3 × 30 s', 45, 'Win the hand fight, then reset.', { tt: '' })]);
  }
  if (blk === 3) {
    if (key === 'A') return build('Session A', 'Contrast power', 80, [
      X('Depth jump, 40 cm box', pick(['3 × 3', '3 × 3', '3 × 3', '2 × 3']), 90, C2.depth, { tt: 'depth jump technique' }),
      CL(pick([[6, 3, 70], [6, 2, 75], [6, 2, 80], [3, 2, 65]]), 150),
      SL('squat', pick([[4, 4, 85], [4, 4, 87.5], [4, 3, 90], [3, 3, 72.5]]), 180),
      X('Jump squat, right after squats', pick(['3 × 5', '3 × 5', '4 × 4', '2 × 4 light']), 90, C2.jumpsq),
      X('Romanian deadlift', pick(['3 × 5', '3 × 5', '3 × 5', '2 × 6']), 90, C2.rdl),
      X('Split squat', pick(['3 × 8 each leg', '3 × 8 each leg', '3 × 8 each leg', '2 × 8 each leg']), 75, C2.split, { tt: 'dumbbell split squat form' }),
      X('Nordic curl (5 s lower)', pick(['3 × 6', '4 × 5', '4 × 5', '2 × 4']), 90, C2.nordic),
      X('Copenhagen plank', pick(['3 × 35 s', '3 × 40 s', '3 × 40 s', '2 × 25 s']), 60, C2.cph, { tt: 'copenhagen plank short lever' })],
      { note: 'The first exercise matters most. Flat? Cut the accessories, never the jumps or the clean.' });
    if (key === 'B') return build('Session B', 'Rugby-reactive agility + upper power', 80, [
      X('Ball-reactive drill', pick(['6 reps', '8 reps', '8 reps', '4 reps']), 75, C2.ball, { tt: TT.reactive }),
      X('Chase-and-evade, 15 s', pick(['3 reps', '3 reps', '4 reps', '2 reps']), 75, C2.chase, { tt: 'chase and evade agility drill' }),
      X('1-on-1 evasion, 10m channel', '3 reps', 75, C2.evade, { tt: 'rugby league evasion drill' }),
      SL('press', pick([[4, 4, 85], [4, 4, 87.5], [4, 3, 90], [3, 3, 72.5]]), 180),
      X('Med ball chest throw', pick(['3 × 5', '3 × 5', '4 × 3', '2 × 4']), 60, C2.chestThrow, { tt: 'medicine ball chest pass wall' }),
      X('Weighted chin-up', pick(['4 × 3', '4 × 3', '4 × 3', '2 × 3']), 120, C2.wchin),
      X('Single-arm DB row', pick(['4 × 8', '4 × 8', '4 × 8', '2 × 8']), 75, C2.row),
      X('Push press', pick(['4 × 3 @ 80%', '4 × 3', '5 × 3 heavy', '2 × 4']), 120, C2.pushpress),
      X('Face pull / neck', pick(['3 × 20 / 3 × 15', '3 × 20 / 3 × 15', '3 × 20 / 3 × 15', '2 × 20 / 2 × 15']), 60, C2.face + ' Then neck each way.', { tt: 'face pulls cable form' })]);
    if (key === 'C') return build('Session C', 'Top speed', 55, pick([
      [X('30m build-ups to 95%', '4 reps', 150, C2.maxv, { tt: 'build up runs sprint' }), X('40m sprints', '2 reps', 210, C2.sprint, { tt: TT.acc20 }), X('Broad jump', '3 × 3', 90, C2.broad, { tt: TT.broad })],
      [X('30m sprints', '5 reps', 150, C2.sprint, { tt: TT.acc20 }), X('Flying 20m', '3 reps', 210, C2.maxv, { tt: TT.fly }), X('Broad jump', '4 × 3', 90, C2.broad, { tt: TT.broad }), X('Med ball throw', '3 × 4', 60, C2.mb, { tt: 'medicine ball rotational throw' })],
      [X('40m sprints', '3 reps', 210, C2.sprint, { tt: TT.acc20 }), X('Flying 20m', '4 reps', 210, C2.maxv, { tt: TT.fly }), X('Broad jump', '3 × 3', 90, C2.broad, { tt: TT.broad })],
      [X('20m sprints, easy', '4 reps', 120, 'Deload. Smooth and relaxed.', { tt: '' }), X('Jumps', '2 × 4', 90, 'Any easy jump. Quality only.', { tt: '' })]
    ]), { note: 'Jump contacts: 90–110 a week at the top of this block. That’s the ceiling.' });
    if (isD) return build('Session D', 'Heavy hinge', 75, [sand,
      SL('hinge', pick([[4, 4, 85], [5, 3, 88], [4, 3, 90], [3, 3, 72.5]]), 180),
      X('Hip thrust', pick(['4 × 8', '4 × 8', '4 × 6', '2 × 8']), 90, C2.hipthrust, { tt: 'barbell hip thrust form' }),
      X('Reverse lunge', pick(['3 × 8 each leg', '3 × 8 each leg', '3 × 8 each leg', '2 × 8 each leg']), 75, C2.lunge),
      X('Back extension', pick(['3 × 15', '3 × 15', '3 × 12', '2 × 12']), 60, C2.backext, { tt: '45 degree back extension form' }),
      X('Pallof press', pick(['3 × 15 each side', '3 × 15 each side', '3 × 15 each side', '2 × 12 each side']), 60, C2.pallof),
      X('Calf raise', pick(['3 × 20', '3 × 20', '3 × 20', '2 × 15']), 60, C2.calf),
      X('Farmer’s carry', pick(['4 trips', '4 trips', '4 trips', '2 trips']), 90, C2.farmer, { tt: 'farmers carry form' })]);
    if (key === 'E') return build('Session E', 'Upper power', 60, [
      X('Med ball overhead slam', pick(['5 × 3', '5 × 3', '5 × 3', '3 × 3']), 60, C2.slam, { tt: 'medicine ball slam' }),
      X('Jump (or clap) push-up', pick(['4 × 4', '4 × 5', '4 × 5', '2 × 4']), 60, C2.jpush, { tt: 'clap push up technique' }),
      X('Incline DB press', pick(['3 × 8', '3 × 8', '3 × 8', '2 × 8']), 90, C2.incline),
      X('Chest-supported row', pick(['4 × 8', '4 × 8', '4 × 8', '2 × 8']), 75, C2.csrow)]);
  }
  /* Block 4 · weeks 13–16 */
  if (key === 'A') return build('Session A', wk === 16 ? 'Lower · taper' : 'Lower power + speed', 70, [
    X('Depth jump to sprint, 40–45 cm', pick(['3 × 3', '3 × 3', '3 × 3', '2 × 2']), 120, C2.depthSprint, { tt: 'depth jump to sprint' }),
    CL(pick([[8, 2, 80], [8, 2, 82.5], [6, 2, 85], [4, 2, 75]]), 150),
    SL('squat', pick([[4, 3, 87.5], [4, 3, 90], [3, 3, 92.5], [2, 3, 80]]), 180),
    X('Jump squat, light (20%)', pick(['3 × 3', '3 × 3', '2 × 3', null]), 90, C2.jumpsq),
    X('Romanian deadlift', pick(['2 × 5', '2 × 5', '2 × 5', null]), 90, C2.rdl),
    X('Nordic curl', pick(['2 × 6', '2 × 6', '2 × 5', '2 × 4']), 90, C2.nordic),
    X('Copenhagen plank', pick(['2 × 40 s', '2 × 40 s', '2 × 40 s', '2 × 30 s']), 60, C2.cph, { tt: 'copenhagen plank short lever' })]);
  if (key === 'B') return build('Session B', 'Evasion + upper strength', 70, [
    X('1-on-1 mirror evasion, 15 s', pick(['4 reps', '4 reps', '3 reps', '2 reps']), 75, C2.evade, { tt: 'rugby league evasion drill' }),
    X('Ball-reactive cut + 10m accelerate', pick(['6 reps', '6 reps', '4 reps', '3 reps']), 75, C2.ball, { tt: TT.reactive }),
    SL('press', pick([[4, 3, 87.5], [4, 3, 90], [3, 3, 92.5], [2, 3, 80]]), 180),
    X('Weighted chin-up', pick(['4 × 3', '4 × 3', '3 × 3', '2 × 3']), 120, C2.wchin),
    X('Single-arm DB row', pick(['3 × 8', '3 × 8', '3 × 8', '2 × 8']), 75, C2.row),
    X('Push press', pick(['4 × 3', '4 × 3', '3 × 3', '2 × 3']), 120, C2.pushpress),
    X('Face pull / neck', pick(['3 × 20 / 3 × 15', '3 × 20 / 3 × 15', '2 × 20 / 2 × 15', '2 × 15 / 2 × 15']), 60, C2.face + ' Then neck each way.', { tt: 'face pulls cable form' })]);
  if (key === 'C') return build('Session C', 'Top speed', 45, pick([
    [X('Flying 30m (30m build, 30m flat out)', '4 reps', 240, C2.maxv, { tt: TT.fly })],
    [X('Flying 30m', '4 reps', 240, C2.maxv, { tt: TT.fly }), X('60m @ 95%', '3 reps', 240, C2.sprint, { tt: '' })],
    [X('Flying 30m', '3 reps', 240, C2.maxv, { tt: TT.fly }), X('20m timed', '3 reps', 180, 'Time every rep and write it in the notes.', { tt: '' })],
    [X('30m sprints', '2 reps', 180, 'Sharp, not tired.', { tt: '' }), X('Flying 20m', '2 reps', 210, C2.maxv, { tt: TT.fly })]
  ]), { note: 'Jumps this block: depth jumps on Monday only. Contacts 60–80 a week.' });
  if (isD) return build('Session D', 'Light hinge', 60, [sand,
    SL('hinge', pick([[4, 3, 88], [4, 3, 90], [3, 3, 92.5], [2, 3, 80]]), 180),
    X('Hip thrust', pick(['3 × 8', '3 × 8', '2 × 8', '2 × 8']), 90, C2.hipthrust, { tt: 'barbell hip thrust form' }),
    X('Back extension', pick(['2 × 12', '2 × 12', '2 × 12', '2 × 10']), 60, C2.backext, { tt: '45 degree back extension form' }),
    X('Pallof press', pick(['2 × 15 each side', '2 × 15 each side', '2 × 15 each side', '2 × 12 each side']), 60, C2.pallof),
    X('Calf raise', pick(['3 × 15', '3 × 15', '2 × 15', '2 × 15']), 60, C2.calf),
    X('Farmer’s carry', pick(['3 trips', '3 trips', '2 trips', '2 trips']), 90, C2.farmer, { tt: 'farmers carry form' })]);
  if (key === 'E') return build('Session E', 'Short and sharp', 50, [
    X('Med ball throw, max intent', '4 × 3', 60, C2.mb, { tt: 'medicine ball rotational throw' }),
    X('Jump push-up', '3 × 4', 60, C2.jpush, { tt: 'clap push up technique' }),
    X('Incline DB press', '3 × 8', 90, C2.incline),
    X('Chest-supported row', '3 × 8', 75, C2.csrow),
    X('40m runs @ 90%', '6 reps', 180, 'Full rest. Quality, not fitness.', { tt: '' })]);
  return NOTRAIN.rest;
}
const LEGACY_KEYS = ['gymA', 'gymB', 'gymC', 'speedA', 'speedB', 'sand', 'sandHols', 'test'];
function sessionFor(key, sp) { return LEGACY_KEYS.includes(key) ? legacySession(key, sp) : newSession(key, sp); }

/* ---------- Meal plan ---------- */
const TARGETS = { kcal: 4450, restKcal: 3750, protein: 215, water: '3–3.5 litres', sleep: '9–9.5 hours' }; // 16-week program v2
const MEALS = [
  { t: '6:45am', n: 'Breakfast', what: '¾ cup oats cooked in 300ml milk + banana + honey, 3 eggs on toast', kcal: 830, p: 40, tt: 'high protein oats eggs breakfast bulking' },
  { t: '10:30am', n: 'Recess', what: 'Greek yoghurt tub + muesli bar + 2 boiled eggs (from Sunday prep)', kcal: 520, p: 30, tt: '' },
  { t: '12:45pm', n: 'Lunch', what: 'This week’s meal-prep container + a piece of fruit', kcal: 800, p: 50, tt: '' },
  { t: '3:15pm', n: 'After school', what: 'Peanut butter and honey sandwich (2 slices, thick PB) + trail mix bag', kcal: 650, p: 20, tt: '' },
  { t: 'After training', n: 'Shake', what: '1 scoop whey + 400ml milk + banana, within 30 min of finishing', kcal: 450, p: 40, tt: 'protein shake bulking milk banana' },
  { t: '7:00pm', n: 'Dinner', what: 'Family dinner (Dinner Planner): 1½ portions of meat and double the rice, pasta or potato', kcal: 900, p: 50, tt: '' },
  { t: '9:15pm', n: 'Supper', what: '3 Weet-Bix with milk, or 200g cottage cheese or yoghurt with fruit', kcal: 350, p: 20, tt: '' }
];
const SNACK_PREP = [
  ['Boil 12 eggs', 'Peel, keep in a container in the fridge. 2 a day for recess.'],
  ['Make 5 trail mix bags', 'Each: handful of peanuts or almonds, sultanas, a few choc chips. For after school.'],
  ['Portion 5 yoghurt tubs', 'Or buy 5 single tubs. Greek yoghurt has the most protein.']
];
// Sunday prep: one main recipe a week, rotating. Makes 5 school lunches.
const PREP = [
  { name: 'Teriyaki chicken & rice bowls', per: 'About 780 kcal, 55g protein each', tt: 'teriyaki chicken rice meal prep',
    shop: [['Chicken thighs', '1.5kg'], ['Rice', '2½ cups uncooked'], ['Broccoli', '2 heads'], ['Carrots', '2'], ['Teriyaki sauce', '1 bottle'], ['Sesame seeds', 'optional']],
    steps: ['Cook the rice.', 'Slice chicken thighs, pan-fry in batches until browned and cooked through.', 'Pour in ¾ bottle of teriyaki sauce, simmer 3 min until sticky.', 'Steam broccoli and sliced carrot 4 min.', 'Split into 5 containers: rice, chicken, veg. Fridge (eat by Thursday) or freeze Friday’s.'] },
  { name: 'Beef burrito bowls (freezer mince)', per: 'About 820 kcal, 55g protein each', tt: 'beef burrito bowl meal prep',
    shop: [['Beef mince (freezer)', '1.5kg'], ['Taco seasoning', '2 sachets'], ['Rice', '2½ cups uncooked'], ['Black beans (400g tin)', '2 tins'], ['Corn kernels (tin)', '1 tin'], ['Grated cheese', '250g'], ['Salsa', '1 jar']],
    steps: ['Cook the rice.', 'Brown the mince, drain, add taco seasoning and ¾ cup water, simmer 5 min.', 'Warm drained beans and corn.', 'Split into 5 containers: rice, mince, beans, corn, cheese. Salsa on the day.'] },
  { name: 'Beef & pasta bake', per: 'About 850 kcal, 55g protein each', tt: 'beef pasta bake meal prep',
    shop: [['Beef mince (freezer)', '1.5kg'], ['Penne pasta', '750g'], ['Pasta sauce', '2 jars'], ['Brown onion', '1'], ['Baby spinach', '1 bag'], ['Grated mozzarella', '300g']],
    steps: ['Cook penne 2 min less than the packet says.', 'Brown mince and onion, add pasta sauce, simmer 10 min, stir in spinach.', 'Mix pasta and sauce in a big dish, cheese on top, bake 200°C for 20 min.', 'Cut into 5 portions once cooled.'] },
  { name: 'Butter chicken & rice', per: 'About 800 kcal, 50g protein each', tt: 'butter chicken meal prep',
    shop: [['Chicken thighs', '1.5kg'], ['Butter chicken sauce', '2 jars'], ['Rice', '2½ cups uncooked'], ['Frozen peas', '2 cups'], ['Naan bread', 'optional']],
    steps: ['Cook the rice.', 'Cube chicken and brown in a big pot or the pressure cooker.', 'Add sauce and ¼ cup water. Simmer 15 min (or pressure cooker HIGH 8 min).', 'Stir in peas. Split into 5 containers with rice.'] }
];
const prepFor = d => PREP[Math.max(0, Math.floor(daysBetween(START, mondayOf(d)) / 7)) % PREP.length];

/* ---------- Reminder lines ---------- */
const MORNING = [
  'Props are built at the breakfast table. Oats, eggs, milk. Go.',
  'Nobody remembers the off-season. Everyone sees the pre-season. Make today count.',
  'Big breakfast, big day. Pack the lunch box and the trail mix.',
  'Every rep this summer is a carry you win in April.',
  'Today is another brick. Eat, train, sleep, repeat.',
  'The other props are asleep. You’re getting faster.',
  'Weigh-in Monday? Breakfast first, then the scales tell the story.',
  'Hit your protein today: eggs now, shake after training.',
  'First 10 metres wins the collision. Train like it.',
  'Small wins stack up. Tick every meal off today.',
  'Tired is fine. Sore is fine. Quitting isn’t on the program.',
  'Water bottle in the bag. Three litres today.',
  'You don’t rise to the game. You fall to your training.',
  'Ahead of schedule beats behind. Get it done today.'
];
const AFTERNOON_REST = ['Rest day. Eat big, stretch 10 minutes, early night.', 'No session today. Recovery is training too. Get the protein in.'];
const BEDTIME = ['10:30. Xbox off, phone down. Muscle grows while you sleep.', '10:30. Controller down. 9 hours of sleep is part of the program.', 'Lights out soon. Xbox off now so you’re fast tomorrow.'];
const pick = (arr, d) => arr[Math.abs(daysBetween('2026-01-01', d)) % arr.length];
function afternoonLine(d) {
  const k = keyFor(d), s = sessionFor(k, phaseFor(d).sp);
  if (k === 'rest') return isSunday(d) ? 'Sunday meal prep: ' + prepFor(addDays(d, 1)).name + '. Do it now and the week is sorted. Then the Sunday check-in: body weight and how the body feels.' : pick(AFTERNOON_REST, d);
  if (!isTrainKey(k)) return `${s.title} today. ${s.sub}`;
  if (k === 'sand') return 'Sandhills done? Big feed, 10 minutes of stretching, lots of water.';
  if (k === 'Dsand') return 'Sandhills done? That’s the week’s conditioning. Once home: snack and water, then the rest of Session D. Legs cooked? Cut the accessories, keep the trap bar.';
  if (k === 'test' || k === 'test1' || k === 'test2') return 'Test day. Warm up properly, film every run, give every test everything.';
  if (/am/.test(s.time)) return 'Morning session done? Big lunch, protein shake, feet up this arvo.';
  return `${s.title} at ${s.time.split('–')[0]}: ${s.sub}. ${s.dad ? 'Dad’s needed.' : 'Get to the gym.'} Snack first.`;
}


/* ---------- What each day is, what it builds, and how to recover ---------- */
const TYPES = {
  SPR: { n: 'Sprints', c: '#0f9d8a' }, PLY: { n: 'Plyometrics (jumps)', c: '#d6457a' }, WT: { n: 'Weights', c: '#6c5ce7' },
  PWR: { n: 'Med-ball power', c: '#e07a1f' }, AGI: { n: 'Agility', c: '#c9a000' }, FIT: { n: 'Fitness', c: '#2f7fd8' },
  REC: { n: 'Recovery', c: '#3aa76d' }, TST: { n: 'Testing', c: '#e0566b' }
};
const RECOVER = {
  weights: 'No ice bath for 6 hours after weights (it slows muscle growth). Shake within 30 min, foam roll anything tight, early night.',
  speed: 'Foam roll 5–10 min (calves, quads, glutes), stretch, feet up. Big feed.',
  sand: 'Today’s fine for a cold ocean dip or cold shower, 5–10 min, as there are no weights. Then 10 min mobility.',
  sunday: 'Sauna 10–15 min at UFC Gym (drink lots of water), 10 min foam roll, early night. Meal prep for the week.',
  rest: 'Easy walk or swim, stretch, sleep 9 hours.',
  test: 'Easy evening, big feed, early night.'
};
function metaFor(key, sp, d) {
  const blk = sp <= 4 ? 1 : sp <= 8 ? 2 : sp <= 12 ? 3 : 4;
  const M = {
    gymA: { t: ['WT', 'PWR'], dev: 'Upper-body strength and pushing power for contact', r: RECOVER.weights },
    gymB: { t: sp === 3 ? ['WT', 'PLY'] : ['WT'], dev: sp === 3 ? 'Leg strength turned into explosiveness (heavy squat + jumps)' : 'Leg strength and size, hip drive for the first step', r: RECOVER.weights },
    gymC: { t: ['WT', 'PWR'], dev: 'Upper muscle, neck and grip for contact', r: RECOVER.weights },
    speedA: { t: ['SPR', 'PLY'], dev: sp >= 2 ? 'Acceleration (first 10–20m), sled power and explosiveness' : 'Acceleration (first 10–20m) and explosiveness', r: RECOVER.speed },
    speedB: { t: sp === 4 ? ['AGI', 'SPR', 'FIT'] : ['AGI', 'SPR'], dev: sp === 4 ? 'Change of direction, top speed and repeat efforts' : 'Change of direction and top speed', r: RECOVER.speed },
    sand: { t: ['FIT'], dev: 'Repeat-effort fitness and leg drive (school sandhills)', r: RECOVER.sand },
    sandHols: { t: ['FIT'], dev: 'Optional fitness top-up', r: RECOVER.sand },
    test: { t: ['TST'], dev: 'Measuring speed, power and strength progress', r: RECOVER.test },
    A: { t: blk === 1 ? ['WT', 'PLY', 'SPR'] : blk === 2 ? ['WT', 'PWR', 'PLY'] : ['PLY', 'PWR', 'WT'],
      dev: blk === 1 ? 'Squat strength, jumps and first-10m acceleration' : blk === 2 ? 'Squat strength and learning the hang power clean' : blk === 3 ? 'Contrast power: clean, heavy squat, then jump squats' : 'Turning strength into speed for trials', r: RECOVER.weights },
    B: { t: ['AGI', 'WT'], dev: blk === 1 ? 'Braking and cutting, then bench and upper strength' : blk === 2 ? 'Reacting to a partner, then heavier bench' : 'Rugby-style evasion, then bench power', r: RECOVER.weights },
    C: { t: ['SPR', 'PLY'], dev: blk <= 2 ? 'Acceleration (first 10–20m) and jumps, done fresh' : 'Top speed (flying sprints) and jumps', r: RECOVER.speed },
    D: { t: blk <= 3 ? ['FIT', 'WT'] : ['WT'], dev: blk <= 3 ? 'The week’s conditioning, then trap-bar strength and hamstrings' : 'Trap-bar strength, glutes and hamstrings (posterior chain)', r: RECOVER.weights },
    Dsand: { t: ['FIT', 'WT'], dev: 'The week’s conditioning (school sandhills), then trap-bar strength and hamstrings once home', r: RECOVER.weights },
    E: { t: blk === 4 ? ['PWR', 'SPR'] : ['PWR', 'WT'], dev: blk === 4 ? 'Explosive upper body and quality runs' : 'Explosive upper body and pulling strength', r: RECOVER.weights },
    F: { t: ['REC', 'AGI'], dev: 'Tackle technique, grip, neck and mobility. He should finish fresher than he started.', r: RECOVER.rest },
    test1: { t: ['TST'], dev: 'Measuring speed, jumps and agility', r: RECOVER.test },
    test2: { t: ['TST', 'WT'], dev: 'Measuring strength: the 5RMs set every working weight', r: RECOVER.test },
    easy: { t: ['REC'], dev: 'Staying loose before the final strength tests', r: RECOVER.rest },
    mob: { t: ['REC'], dev: 'Optional mobility between test days', r: RECOVER.rest },
    brL: { t: ['WT'], dev: 'Keeping squat strength while team training ramps up', r: RECOVER.weights },
    brS: { t: ['SPR'], dev: 'Keeping speed sharp into the season', r: RECOVER.speed },
    brT: { t: ['WT'], dev: 'Light hinge and upper work to hold strength', r: RECOVER.weights },
    isL: { t: ['WT'], dev: 'In-season minimum: hold lower-body strength', r: RECOVER.weights },
    isS: { t: ['SPR'], dev: 'In-season minimum: keep the speed', r: RECOVER.speed },
    isU: { t: ['WT'], dev: 'In-season minimum: hold upper-body strength', r: RECOVER.weights },
    team: { t: ['FIT', 'AGI'], dev: 'Club training', r: RECOVER.speed },
    teamskills: { t: ['AGI'], dev: 'Team session or skills', r: RECOVER.rest },
    trial: { t: ['TST'], dev: 'Trial: show what the off-season built', r: RECOVER.test },
    game: { t: ['TST'], dev: 'Game day', r: 'Cold shower or dip is fine after a game. Big feed, early night.' },
    rest: { t: ['REC'], dev: 'Recovery: this is when the muscle gets built', r: d && parse(d).getDay() === 0 ? RECOVER.sunday : RECOVER.rest }
  };
  return M[key] || M.rest;
}
