// Builds www/: the training page + the phone layer (login, shared logs, reminders).
// The same www/ is the Android app (via Capacitor) and Ohio's iPhone version (GitHub Pages).
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "fs";
const r = await build({ entryPoints: ["src/native.js"], bundle: true, format: "iife", minify: true, write: false, target: "es2020" });
const native = r.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
let t = readFileSync("web/template.html", "utf8");
t = t.replace("<!--__NATIVE__-->", () => `<script>${native}</script>`);
t = t.replace("</head>", `<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#101316">
</head>`);
mkdirSync("www", { recursive: true });
writeFileSync("www/index.html", t);
copyFileSync("web/icon-180.png", "www/icon-180.png");
copyFileSync("web/icon-512.png", "www/icon-512.png");
writeFileSync("www/manifest.webmanifest", JSON.stringify({
  name: "Ohio Training", short_name: "Ohio", start_url: "./", display: "standalone",
  background_color: "#101316", theme_color: "#101316",
  icons: [{ src: "icon-180.png", sizes: "180x180", type: "image/png" }, { src: "icon-512.png", sizes: "512x512", type: "image/png" }]
}));
console.log("built www/index.html", t.length, "bytes");
