/* ===== Ohio's off-season program: dates, sessions, meals, reminder lines =====
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
const START = '2026-11-23';        // Phase 1 starts Monday 23 Nov
const PRESEASON = '2027-04-05';    // club pre-season, early April
const PHASES = [
  { id: 'T', name: 'Test week', start: '2026-11-16', end: '2026-11-22', sp: 1, focus: 'Do the tests, learn the sessions',
    note: 'Test week. Do the tests on Saturday. Any other sessions this week are light: learn the moves and leave 3 in the tank.' },
  { id: '1', name: 'Phase 1 · Foundation', start: '2026-11-23', end: '2026-12-20', sp: 1, focus: 'Technique, muscle, base fitness' },
  { id: 'X', name: 'Christmas easy block', start: '2026-12-21', end: '2027-01-03', sp: 1, focus: 'Recover, keep the habit',
    note: 'Easy fortnight: 3–4 sessions a week, drop 1 set from everything, no new PBs. School hols, so 9–10am is fine.' },
  { id: '2', name: 'Phase 2 · Strength', start: '2027-01-04', end: '2027-01-31', sp: 2, focus: 'Heavier lifts, sled sprints start' },
  { id: '3', name: 'Phase 3 · Power & speed', start: '2027-02-01', end: '2027-02-28', sp: 3, focus: 'Turn strength into speed: heavy + jump pairs, reactive agility' },
  { id: '4', name: 'Phase 4 · Peak', start: '2027-03-01', end: '2027-03-28', sp: 4, focus: 'About 30% less volume, same intensity. Sharp and fresh',
    note: 'Peak block: fewer sets, same weights. Quality only. If he feels flat, cut a set.' },
  { id: 'Z', name: 'Taper week', start: '2027-03-29', end: '2027-04-04', sp: 4, focus: 'Half the sets, stay sharp, sleep and eat big',
    note: 'Last week before pre-season. Do half the sets of each exercise at the same weight. Nothing new, nothing to failure.' },
  { id: 'P', name: 'Pre-season', start: '2027-04-05', end: '2027-06-30', sp: 4, focus: 'Club pre-season. Club program comes first',
    note: 'Pre-season: the club program comes first. On days without club training, use this session with half the sets.' }
];
const TEST_DAYS = ['2026-11-21', '2026-12-19', '2027-01-30', '2027-02-27', '2027-03-23'];
const REST_DAYS = ['2026-12-25', '2027-01-01'];
const SCHOOL_HOLS = [['2026-12-18', '2027-01-27'], ['2027-04-12', '2027-04-23']];
const WEEK = { 1: 'gymA', 2: 'speedA', 3: 'gymB', 4: 'sand', 5: 'gymC', 6: 'speedB', 0: 'rest' };
const inSchoolHols = d => SCHOOL_HOLS.some(([a, b]) => d >= a && d <= b);

function phaseFor(d) {
  if (d < PHASES[0].start) return PHASES[0];
  return PHASES.find(p => d >= p.start && d <= p.end) || PHASES[PHASES.length - 1];
}
function keyFor(d) {
  if (TEST_DAYS.includes(d)) return 'test';
  if (REST_DAYS.includes(d)) return 'rest';
  const k = WEEK[parse(d).getDay()];
  if (k === 'sand' && inSchoolHols(d)) return 'sandHols';
  return k;
}
const isTrainKey = k => k !== 'rest';
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

/* ---------- Big lifts: done at the gym, he picks the version ----------
   First option in each list is the default. Safety: barbell work only inside a rack with the safety arms set
   just below the bottom of the rep, a mate spotting the bench, and never test a max alone. */
const VARIANTS = {
  squat: [
    { lift: 'hacksquat', n: 'Hack squat machine', short: 'Hack squat', c: 'Feet shoulder width, mid-platform. Lower until thighs are parallel, drive up hard. The machine catches the weight, so it’s safe on his own.', tt: 'hack squat machine form' },
    { lift: 'goblet', n: 'Goblet squat (dumbbell at chest)', short: 'Goblet', c: 'Hold one dumbbell against the chest, elbows inside the knees. Sit down between the heels, chest up. He can just drop the dumbbell if it goes wrong.', tt: 'goblet squat form' },
    { lift: 'squat', n: 'Back squat · in a rack, safety arms set', short: 'Back squat', c: 'Only inside a squat rack with the safety arms set just below his lowest point. Big breath, tight belly, knees out, drive up fast.', tt: 'how to set safety arms squat rack' }
  ],
  hinge: [
    { lift: 'trapbar', n: 'Trap bar deadlift', short: 'Trap bar', c: 'Stand inside the hex bar, grip the high handles. Hips back, flat back, push the floor away. More upright than a normal deadlift, so it’s easier on the back.', tt: 'trap bar deadlift form' },
    { lift: 'hipthrust', n: 'Hip thrust (barbell or machine)', short: 'Hip thrust', c: 'Upper back on a bench, pad on the hips. Drive through the heels, squeeze glutes at the top, chin tucked. Builds the hip drive for the first step.', tt: 'barbell hip thrust form' },
    { lift: 'deadlift', n: 'Deadlift · a mate watching his back', short: 'Deadlift', c: 'Bar over mid-foot, flat back. Push the floor away, stand tall, don’t lean back. Stop the set if his back rounds.', tt: 'deadlift technique beginner' }
  ],
  press: [
    { lift: 'bench', n: 'Barbell bench · safety arms or a mate spotting', short: 'Barbell', c: 'Never alone without the safety arms set just above chest height. Shoulder blades squeezed, feet planted, bar to lower chest, press up and slightly back.', tt: 'bench press safety arms setup' },
    { lift: 'dbbench', n: 'Dumbbell bench press', short: 'Dumbbells', c: 'Elbows about 45° from the body. Control down, push hard up. If he fails a rep he can just lower the dumbbells to the floor.', tt: 'dumbbell bench press form' }
  ]
};
const LIFT_INFO = {
  hacksquat: { name: 'Hack squat', start: 40, inc: [5, 120, 2.5] }, goblet: { name: 'Goblet squat', start: 24, inc: [2, 999, 2] }, squat: { name: 'Back squat', start: 45, inc: [5, 80, 2.5] },
  trapbar: { name: 'Trap bar', start: 60, inc: [5, 120, 2.5] }, hipthrust: { name: 'Hip thrust', start: 60, inc: [5, 120, 2.5] }, deadlift: { name: 'Deadlift', start: 50, inc: [5, 100, 2.5] },
  bench: { name: 'Bench', start: 62.5, inc: [2.5, 999, 2.5] }, dbbench: { name: 'DB bench (each hand)', start: 26, inc: [2, 999, 2] }
};
const BIG = (slot, d, r, extra) => E(slot, d, r, '', { slot, extra: extra || '' });

function sessionFor(key, sp) {
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

/* ---------- Meal plan ---------- */
const TARGETS = { kcal: 3800, protein: 190, water: '3 litres', sleep: '9 hours' };
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
  if (k === 'rest') return isSunday(d) ? 'Sunday meal prep: ' + prepFor(addDays(d, 1)).name + '. Do it now and the week is sorted.' : pick(AFTERNOON_REST, d);
  if (k === 'sand') return 'Sandhills done? Big feed, 10 minutes of stretching, lots of water.';
  if (k === 'test') return 'Test day. Warm up properly, film every run, give every test everything.';
  if (/am/.test(s.time)) return 'Morning session done? Big lunch, protein shake, feet up this arvo.';
  return `${s.title} at ${s.time.split('–')[0]}: ${s.sub}. ${s.dad ? 'Dad’s waiting.' : 'Get to the gym.'} Snack first.`;
}
