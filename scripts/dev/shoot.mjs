// Screenshots at phone width with headless Chrome, for checking changes by eye.
// Kept in the repo (19 Nov 2026) because the scratchpad copy kept being wiped.
//
//   node scripts/dev/shoot.mjs plan.json [outDir]
//
// plan.json: { "width": 390, "height": 844, "dark": true, "steps": [
//   { "goto": "http://localhost:3100/new" },
//   { "eval": "localStorage.setItem('k', 'v')" },     // runs in the page
//   { "click": "Background" },                        // a button or link by its text (whole, start or end), or css:selector
//   { "scroll": ".b2-panel", "by": 600 },            // scroll an element (or the page with "window")
//   { "wait": 800 },
//   { "shot": "look-background" }                    // saves outDir/look-background.png
// ] }
// Prints console errors and anything wider than the screen after each shot.

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [planFile, outDir = "shots"] = process.argv.slice(2);
if (!planFile) { console.error("Usage: node scripts/dev/shoot.mjs plan.json [outDir]"); process.exit(1); }
const plan = JSON.parse(readFileSync(planFile, "utf8"));
mkdirSync(outDir, { recursive: true });

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9300 + Math.floor(Math.random() * 600);
const profile = join(outDir, ".profile");
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch { /* not up yet */ }
}
if (!target) { chrome.kill(); throw new Error("Chrome didn't start"); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const waiting = new Map();
const errors = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((r) => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const run = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true })).result?.result?.value;

const w = plan.width ?? 390, h = plan.height ?? 844;
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: w < 700 });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: plan.dark === false ? "light" : "dark" }, { name: "prefers-reduced-motion", value: plan.reduced ? "reduce" : "no-preference" }] });

for (const s of plan.steps) {
  if (s.goto) { await send("Page.navigate", { url: s.goto }); await sleep(s.wait ?? 2500); continue; }
  if (s.eval) { const v = await run(s.eval); if (v !== undefined) console.log("eval:", JSON.stringify(v).slice(0, 300)); }
  if (s.click) {
    const ok = await run(`(() => {
      const q = ${JSON.stringify(s.click)};
      const el = q.startsWith("css:") ? document.querySelector(q.slice(4))
        : (() => { const all = [...document.querySelectorAll("button, a, [role=radio], [role=tab], label")].map((b) => [b, b.textContent.trim().replace(/\\s+/g, " ")]);
            return (all.find(([, t]) => t === q) ?? all.find(([, t]) => t.startsWith(q)) ?? all.find(([, t]) => t.endsWith(q)) ?? [])[0]; })();
      if (!el) return false; el.scrollIntoView({ block: "center" }); el.click(); return true; })()`);
    if (!ok) console.log(`click: couldn't find "${s.click}"`);
  }
  if (s.scroll) await run(`(${JSON.stringify(s.scroll)} === "window" ? window : document.querySelector(${JSON.stringify(s.scroll)}))?.scrollBy(0, ${s.by ?? 600})`);
  if (s.wait) await sleep(s.wait);
  if (s.shot) {
    await sleep(400);
    const r = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(outDir, `${s.shot}.png`), Buffer.from(r.result.data, "base64"));
    const wide = await run(`[...document.querySelectorAll("body *")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && getComputedStyle(e).position !== "fixed" && !e.closest(".b2-tabs, [data-scrolls]"); }).slice(0, 5).map((e) => e.className || e.tagName)`);
    console.log(`shot ${s.shot}${wide?.length ? ` · wider than the screen: ${wide.join(", ")}` : ""}`);
  }
}
if (errors.length) console.log("console errors:\n  " + [...new Set(errors)].slice(0, 10).join("\n  "));
ws.close();
chrome.kill();
