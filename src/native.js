// Phone/web layer for Ohio Training: Firebase login + shared logs, and session reminders on Android.
// The training page itself (web/template.html) is the same code as the Claude version.
import { initializeApp } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, doc, getDoc, setDoc, deleteDoc, onSnapshot, collection } from "firebase/firestore";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { AppLauncher } from "@capacitor/app-launcher";
import { FIREBASE_CONFIG } from "./config.js";

window.NATIVE = true;
const PREFIX = "ohio/data/"; // keeps training data apart from the Dinner Planner's

const fbApp = initializeApp(FIREBASE_CONFIG);
const auth = initializeAuth(fbApp, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
const fs = initializeFirestore(fbApp, { localCache: persistentLocalCache() });

// ---------- the same db shape the page already uses ----------
const mapErr = e => ({ code: e && e.code === "permission-denied" ? "invalid_argument" : "unavailable", message: String(e && e.message || e) });
const wrap = s => ({ id: s.id, exists: s.exists(), data: () => s.data(), metadata: { fromCache: s.metadata.fromCache, hasPendingWrites: s.metadata.hasPendingWrites } });
const wait = ms => new Promise(r => setTimeout(r, ms));
// Writes show straight away (offline too) and finish syncing when there's signal.
// Wait up to 2.5 s for the server, so a permission problem still shows up as an error.
function settle(p) {
  let failed = null;
  const tracked = p.catch(e => { failed = mapErr(e); if (window.OHIO) window.OHIO.toast(failed.code === "invalid_argument" ? "This login isn’t allowed to save. Check the Firebase rules." : "Saved on this phone. It will sync when there’s signal."); });
  return Promise.race([tracked, wait(2500)]).then(() => { if (failed && failed.code === "invalid_argument") throw failed; });
}
const db = {
  collection(path) {
    const c = collection(fs, PREFIX + path);
    return {
      onSnapshot(next, err) {
        return onSnapshot(c, { includeMetadataChanges: true }, q => {
          const docs = q.docs.map(wrap);
          next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: q.metadata.fromCache, hasPendingWrites: q.metadata.hasPendingWrites } });
        }, e => { console.error(e); if (err) err(mapErr(e)); });
      },
      doc(id) {
        const r = doc(fs, PREFIX + path + "/" + id);
        return {
          id, path: r.path,
          get: async () => wrap(await getDoc(r)),
          set: d => settle(setDoc(r, d)),
          delete: () => settle(deleteDoc(r)),
        };
      },
    };
  },
};
let resolveLogin;
const loggedIn = new Promise(r => { resolveLogin = r; });
window.claude = { use: async name => { await loggedIn; return name === "db" ? db : name === "user" ? { can: async () => true } : null; } };

// ---------- login screen ----------
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const css = `
#login{position:fixed;inset:0;z-index:50;background:var(--grad);overflow:auto;padding:calc(env(safe-area-inset-top) + 40px) 20px 40px}
#login .in{max-width:420px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
#login h1{font-size:44px;font-weight:800;color:var(--accent);text-shadow:var(--glow)}
#login p{margin:0;color:var(--muted)}
#login label{display:flex;flex-direction:column;gap:6px;font-weight:600;font-size:15px}
#login input{border:1.5px solid var(--line);border-radius:12px;background:var(--surface);padding:13px 14px;font-size:17px}
#login .msg{color:var(--bad);font-weight:600}
#login .stripe{height:6px;width:64px;background:var(--accent);border-radius:99px}`;
function showLogin(msg, email) {
  let el = document.getElementById("login");
  if (!el) {
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    el = document.createElement("div"); el.id = "login"; document.body.appendChild(el);
  }
  el.innerHTML = `<form class="in" id="loginForm">
    <div class="stripe"></div>
    <h1>Ohio</h1>
    <p>Off-season training. Log in to see the program and the shared logs.</p>
    <label for="lemail">Email<input type="email" id="lemail" autocomplete="username" required value="${esc(email || "")}"></label>
    <label for="lpass">Password<input type="password" id="lpass" autocomplete="current-password" required></label>
    ${msg ? `<div class="msg" role="alert">${esc(msg)}</div>` : ""}
    <button class="primary" type="submit">Log in</button>
    <button class="linkbtn" type="button" id="forgot">Forgot password?</button>
  </form>`;
  document.getElementById("loginForm").onsubmit = async e => {
    e.preventDefault();
    const em = document.getElementById("lemail").value.trim(), pw = document.getElementById("lpass").value;
    try { await signInWithEmailAndPassword(auth, em, pw); }
    catch (err) { showLogin(/invalid|wrong|user-not-found/.test((err && err.code) || "") ? "Email or password isn’t right. Try again." : "Couldn’t log in. Check your internet and try again.", em); }
  };
  document.getElementById("forgot").onclick = async () => {
    const em = document.getElementById("lemail").value.trim();
    if (!em) { showLogin("Type your email first, then tap Forgot password."); return; }
    try { await sendPasswordResetEmail(auth, em); showLogin("Check your email for a link to reset your password.", em); }
    catch (_) { showLogin("Couldn’t send the reset email. Check the address.", em); }
  };
}

// ---------- reminders (Android app only) ----------
const NKEY = "ohio-notify";
const NDEF = { morning: true, afternoon: true, bedtime: true, prep: true, test: true, nudge: true, nudgeTime: "20:00" };
function nset() { try { return Object.assign({}, NDEF, JSON.parse(localStorage.getItem(NKEY) || "{}")); } catch (_) { return Object.assign({}, NDEF); } }
function nsave(s) { try { localStorage.setItem(NKEY, JSON.stringify(s)); } catch (_) {} }
const isNative = () => Capacitor.isNativePlatform();
let perm = "unknown";
function at(dateIso, hhmm) { const [y, m, d] = dateIso.split("-").map(Number); const [h, mi] = hhmm.split(":").map(Number); return new Date(y, m - 1, d, h, mi, 0); }
const nid = (dateIso, kind) => Number(dateIso.replace(/-/g, "").slice(2)) * 10 + kind;

function buildReminders() {
  const O = window.OHIO; if (!O) return [];
  const s = nset(), out = [], now = new Date(), today = O.TODAY;
  const add = (id, when, title, body, d) => { if (when > now) out.push({ id, title, body, schedule: { at: when, allowWhileIdle: true }, extra: { date: d } }); };
  for (let i = 0; i < 14; i++) {
    const d = O.addDays(today, i), key = O.keyFor(d);
    const ses = O.sessionFor(key, O.phaseFor(d).sp);
    const logged = O.state.logs.some(l => l.id === d + "_" + key);
    if (s.morning) add(nid(d, 1), at(d, "07:00"), O.isTrainKey(key) ? `${ses.dad ? "Dad needed · " : ""}${ses.title} today` : (O.isSunday(d) ? "Meal prep Sunday" : "Rest day"), O.pick(O.MORNING, d), d);
    if (s.afternoon) add(nid(d, 2), at(d, "15:00"), "Time to train", O.afternoonLine(d), d);
    if (s.bedtime) add(nid(d, 3), at(d, "22:30"), "Xbox off", O.pick(O.BEDTIME, d), d);
    if (s.prep && O.isSunday(d)) add(nid(d, 4), at(d, "10:00"), "Sunday meal prep", "This week: " + O.prepFor(O.addDays(d, 1)).name + ". Shopping list is on the Meals tab.", d);
    if (s.test && key === "test") add(nid(d, 5), at(O.addDays(d, -1), "19:00"), "Test day tomorrow", "Early night. Charge the phone for slow-mo video, bring cones and a tape measure.", d);
    if (s.nudge && O.isTrainKey(key) && !logged) add(nid(d, 6), at(d, s.nudgeTime), `Log today’s ${ses.title}?`, "Tick what got done, the weights, and how it felt.", d);
  }
  return out.slice(0, 60);
}
let lastSig = null, timer = null;
async function reschedule(force) {
  if (!isNative() || perm !== "granted" || !window.OHIO) return;
  const list = buildReminders();
  const sig = JSON.stringify(list.map(n => [n.id, n.title, n.body, +n.schedule.at]));
  if (!force && sig === lastSig) return;
  lastSig = sig;
  try {
    const p = await LocalNotifications.getPending();
    if (p.notifications.length) await LocalNotifications.cancel({ notifications: p.notifications.map(n => ({ id: n.id })) });
    if (list.length) await LocalNotifications.schedule({ notifications: list });
  } catch (e) { console.error("schedule", e); }
}
window.onRendered = () => { clearTimeout(timer); timer = setTimeout(() => reschedule(false), 1500); };

async function setupNotifications() {
  if (!isNative()) { perm = "web"; return; }
  try {
    let p = await LocalNotifications.checkPermissions();
    if (p.display === "prompt" || p.display === "prompt-with-rationale") p = await LocalNotifications.requestPermissions();
    perm = p.display;
    await LocalNotifications.addListener("localNotificationActionPerformed", ev => {
      const x = (ev.notification && ev.notification.extra) || {};
      if (x.date && window.OHIO) { window.OHIO.state.date = x.date; location.hash = "today"; window.OHIO.render(); }
    });
  } catch (e) { console.error(e); }
  if (window.OHIO) window.OHIO.render();
}

// ---------- extra section on the Plan tab ----------
window.nativeSettings = () => {
  const s = nset(), u = auth.currentUser;
  const tog = (k, label) => `<label class="check" style="justify-content:space-between;width:100%">${label}<input type="checkbox" data-nact="set" data-k="${k}" ${s[k] ? "checked" : ""}></label>`;
  const tm = (k, label) => `<div class="field"><label for="n-${k}">${label}</label><input type="time" id="n-${k}" data-nact="set" data-k="${k}" value="${esc(s[k])}"></div>`;
  let h = "";
  if (isNative()) {
    h += `<div class="card"><h3 style="font-size:20px">Reminders on this phone</h3>`;
    if (perm === "denied") h += `<div class="alert">Notifications are off for Ohio Training. Turn them on in Settings → Apps → Ohio Training → Notifications.</div>`;
    h += `${tog("morning", "7am: today’s session + motivation")}
      ${tog("afternoon", "3pm: time to train")}
      ${tog("bedtime", "10:30pm: Xbox off")}
      ${tog("prep", "Sunday 10am: meal prep")}
      ${tog("test", "Test day reminder the night before (7pm)")}
      ${tog("nudge", "Nudge if the session isn’t logged")}${s.nudge ? tm("nudgeTime", "Time") : ""}
      <div class="muted small">Covers the next 2 weeks and updates every time you open the app.</div>
      <button class="pill" type="button" data-nact="test">Send a test reminder</button></div>`;
  } else {
    h += `<div class="card"><h3 style="font-size:20px">Reminders on your iPhone</h3>
      <div class="small">iPhone web apps can’t send their own alerts, so the 7am, 3pm and 10:30pm Xbox-off reminders come through your iPhone Calendar instead.</div>
      <ol class="steps"><li>Open this page in Safari (not from the home-screen icon).</li><li>Tap the button below, then tap <b>Add All</b>.</li><li>Pick a calendar, like “Ohio Training”.</li></ol>
      <a class="primary" style="display:block;text-align:center;text-decoration:none" href="ohio-reminders.ics">Add reminders to Calendar</a>
      <div class="muted small">Runs until pre-season. If the program changes, add it again and the reminders update.</div></div>`;
  }
  h += `<div class="card"><h3 style="font-size:20px">Account</h3>
    <div class="small">Logged in as <b>${esc(u ? u.email : "")}</b>. Dad and Ohio each log in with their own email and see the same logs.</div>
    <button class="pill" type="button" data-nact="logout">Log out</button></div>`;
  return h;
};
document.addEventListener("change", ev => {
  const el = ev.target; if (!el.dataset || el.dataset.nact !== "set") return;
  const s = nset(); s[el.dataset.k] = el.type === "checkbox" ? el.checked : el.value;
  nsave(s); reschedule(true); if (el.type === "checkbox" && window.OHIO) window.OHIO.render();
});
document.addEventListener("click", ev => {
  const b = ev.target.closest("[data-nact]"); if (!b) return;
  const act = b.dataset.nact;
  if (act === "logout") signOut(auth);
  else if (act === "test") {
    if (perm !== "granted") { window.OHIO.toast("Notifications are off. Allow them in phone Settings."); return; }
    LocalNotifications.schedule({ notifications: [{ id: 1, title: "Test reminder", body: "Reminders are working. Time to get fast.", schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true } }] })
      .then(() => window.OHIO.toast("Test reminder in 3 seconds"));
  }
});

// ---------- TikTok links open straight in the TikTok app on Android ----------
window.openTikTok = q => {
  if (!isNative()) return false;
  const web = "https://www.tiktok.com/search?q=" + encodeURIComponent(q);
  const viaWeb = () => AppLauncher.openUrl({ url: web }).catch(() => {});
  AppLauncher.openUrl({ url: "snssdk1233://search?keyword=" + encodeURIComponent(q) }).then(r => { if (!r || !r.completed) return viaWeb(); }).catch(viaWeb);
  return true;
};

// ---------- boot ----------
let started = false;
onAuthStateChanged(auth, async user => {
  if (!user) { if (started) location.reload(); else showLogin(); return; }
  const el = document.getElementById("login"); if (el) el.remove();
  if (started) return;
  started = true;
  resolveLogin();
  await setupNotifications();
  reschedule(true);
});
document.addEventListener("visibilitychange", () => { if (!document.hidden && started) reschedule(false); });
