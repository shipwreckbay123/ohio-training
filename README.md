# Ohio Training

Ohio's off-season rugby league program (Nov 2026 → pre-season April 2027): today's session, week view, phase plan, test results and a shared training log.

- `web/template.html` – the training page (same as the Claude version)
- `src/native.js` – login + shared logs (Firebase, under `ohio/`), reminders on Android
- `src/config.js` – Firebase project details (shared with Dinner Planner)
- `firestore.rules` – who can read/write; paste into Firebase → Firestore → Rules
- Every push to `main` builds `OhioTraining.apk` under **Releases**, and puts the iPhone version on GitHub Pages.
