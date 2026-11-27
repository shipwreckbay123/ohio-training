# Ohio Training

Ohio's off-season rugby league program: today's session, week view, phase plan, test results and a shared training log.

From Mon 30 Nov 2026 the app runs the 16-week program v2 (`Offseason-16wk-v2.pdf`): sessions A–F, tests in weeks 1, 8 and 16, trials week of 15 Mar, bridge block weeks 17–20, then the in-season minimum. Big-lift weights come from the 5RMs entered on the Progress tab; sets above 85% need a coach check logged on the Plan tab. Thursdays keep school sandhills on top of Session D. Dates before 30 Nov still show the first program so old logs open.

- `web/program.js` – dates, sessions, meals and reminder lines
- `web/template.html` – the training page
- `src/native.js` – login + shared logs (Firebase, under `ohio/`), reminders on Android
- `src/config.js` – Firebase project details (shared with Dinner Planner)
- `firestore.rules` – who can read/write; paste into Firebase → Firestore → Rules
- Every push to `main` builds `OhioTraining.apk` under **Releases**, and puts the iPhone version on GitHub Pages.
