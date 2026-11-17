// Builds www/: the training page + the phone layer (login, shared logs, reminders),
// and the iPhone reminder calendar (7am, 3pm, 10:30pm) from the same program.
// The same www/ is the Android app (via Capacitor) and Ohio's iPhone version (GitHub Pages).
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "fs";
import vm from "vm";

const program = readFileSync("web/program.js", "utf8");
const r = await build({ entryPoints: ["src/native.js"], bundle: true, format: "iife", minify: true, write: false, target: "es2020" });
const native = r.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
let t = readFileSync("web/template.html", "utf8");
t = t.replace("/*__PROGRAM__*/", () => program);
t = t.replace("<!--__NATIVE__-->", () => `<script>${native}</script>`);
t = t.replace("</head>", `<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#0f0c29">
</head>`);
mkdirSync("www", { recursive: true });
writeFileSync("www/index.html", t);
copyFileSync("web/icon-180.png", "www/icon-180.png");
copyFileSync("web/icon-512.png", "www/icon-512.png");
writeFileSync("www/manifest.webmanifest", JSON.stringify({
  name: "Ohio Training", short_name: "Ohio", start_url: "./", display: "standalone",
  background_color: "#0f0c29", theme_color: "#0f0c29",
  icons: [{ src: "icon-180.png", sizes: "180x180", type: "image/png" }, { src: "icon-512.png", sizes: "512x512", type: "image/png" }]
}));

// ---------- iPhone reminder calendar ----------
const P = vm.runInNewContext(program + "\n;({ iso, addDays, keyFor, sessionFor, phaseFor, isTrainKey, isSunday, pick, MORNING, BEDTIME, afternoonLine, prepFor, PRESEASON })");
const esc = s => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const fold = line => { const out = []; let s = line; while (s.length > 73) { out.push(s.slice(0, 73)); s = " " + s.slice(73); } out.push(s); return out.join("\r\n"); };
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
const ev = [];
const add = (d, hhmm, kind, summary, desc) => {
  const dt = d.replace(/-/g, "") + "T" + hhmm.replace(":", "") + "00";
  const [h, m] = hhmm.split(":").map(Number); const end = d.replace(/-/g, "") + "T" + String(h).padStart(2, "0") + String(m + 5).padStart(2, "0") + "00";
  ev.push(["BEGIN:VEVENT", `UID:ohio-${d}-${kind}@ohio-training`, `DTSTAMP:${stamp}`, `DTSTART:${dt}`, `DTEND:${end}`,
    fold(`SUMMARY:${esc(summary)}`), fold(`DESCRIPTION:${esc(desc)}`), "TRANSP:TRANSPARENT",
    "BEGIN:VALARM", "ACTION:DISPLAY", fold(`DESCRIPTION:${esc(summary)}`), "TRIGGER:PT0M", "END:VALARM", "END:VEVENT"].join("\r\n"));
};
const today = P.iso(new Date(Date.now() + 11 * 3600 * 1000)); // Sydney date
for (let d = today; d < P.PRESEASON; d = P.addDays(d, 1)) {
  const k = P.keyFor(d), s = P.sessionFor(k, P.phaseFor(d).sp);
  add(d, "07:00", "am", P.isTrainKey(k) ? `${s.title} today` : (P.isSunday(d) ? "Meal prep Sunday" : "Rest day"), P.pick(P.MORNING, d));
  add(d, "15:00", "pm", "Time to train", P.afternoonLine(d));
  add(d, "22:30", "bed", "Xbox off", P.pick(P.BEDTIME, d));
}
writeFileSync("www/ohio-reminders.ics", ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ohio Training//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Ohio Training", ...ev, "END:VCALENDAR", ""].join("\r\n"));
console.log("built www/index.html", t.length, "bytes;", ev.length, "calendar reminders");
