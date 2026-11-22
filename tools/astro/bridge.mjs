#!/usr/bin/env node
/* Astro bridge — drives the Nirayana (Astro repo) engines headlessly.
 *
 *   node tools/astro/bridge.mjs list                       all Reel Studio templates
 *   node tools/astro/bridge.mjs facts <key> [--lang hi] [--seconds N] [--out file.json]
 *   node tools/astro/bridge.mjs today [--date YYYY-MM-DD] [--place "Delhi, IN"] [--out file.json]
 *   node tools/astro/bridge.mjs render <slug>              render public/<slug>/astro.mp4 synced to the voice
 *   node tools/astro/bridge.mjs data sky [--date YYYY-MM-DD] [--time HH:MM] [--place ..]   live positions + panchanga + festivals
 *   node tools/astro/bridge.mjs data events [--date ..] [--days 30]                       ingress / vakri / margi / purnima / amavasya
 *   node tools/astro/bridge.mjs data nakshatra <1-27|name>                                 one nakshatra, fully described
 *   node tools/astro/bridge.mjs data rashi <1-12|name>                                     one rashi and its nakshatras
 *   node tools/astro/bridge.mjs data graha <Sun|Moon|...|Shani..> [--days 365]             a graha: now + coming events
 *   (all data commands accept --out file.json)
 *
 * Config: tools/astro/config.json  { "astroDir": "~/Astro", "place": "Delhi, IN" }
 *         overrides in tools/astro/config.local.json (git-ignored)
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, "..", "..");
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, "config.json"), "utf8"));
// personal overrides (astroDir, place…) live in the git-ignored config.local.json
if (fs.existsSync(path.join(HERE, "config.local.json"))) Object.assign(cfg, JSON.parse(fs.readFileSync(path.join(HERE, "config.local.json"), "utf8")));
const ASTRO = cfg.astroDir.replace(/^~/, os.homedir());
const FPS = 30, GAP = 0.35, TAIL = 1.5;

const [cmd, ...rest] = process.argv.slice(2);
const opt = {}; const pos = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith("--")) opt[rest[i].slice(2)] = rest[i + 1]?.startsWith("--") || rest[i + 1] === undefined ? true : rest[++i];
  else pos.push(rest[i]);
}
const die = (m) => { console.error("✗ " + m); process.exit(1); };
if (!fs.existsSync(path.join(ASTRO, "reel.html"))) die(`Astro repo not found at ${ASTRO} (set astroDir in tools/astro/config.json)`);

/* ---- tiny static server for the Astro folder ---- */
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json", ".woff2": "font/woff2", ".wasm": "application/wasm" };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
      const f = path.join(ASTRO, path.normalize(p));
      if (!f.startsWith(ASTRO) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
      fs.createReadStream(f).pipe(r);
    }).listen(0, "127.0.0.1", () => res(srv));
  });
}

async function open(page) {
  const srv = await serve();
  const browser = await chromium.launch(process.env.ASTRO_CHROME ? { executablePath: process.env.ASTRO_CHROME } : {});
  const pg = await browser.newPage({ viewport: { width: 1300, height: 1000 } });
  pg.on("pageerror", (e) => console.error("page error:", e.message));
  await pg.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await pg.goto(`http://127.0.0.1:${srv.address().port}/${page}`);
  return { pg, close: async () => { await browser.close(); srv.close(); } };
}

async function reelPage() {
  const s = await open("reel.html");
  await s.pg.waitForFunction("window.__reel && window.__reel.ready()", null, { timeout: 120000 });
  return s;
}

async function choose(pg, key, seconds, placeName) {
  await pg.evaluate(({ key, seconds, placeName }) => {
    if (placeName) {
      const p = window.NP.PLACES.find((x) => x.n.toLowerCase().startsWith(placeName.toLowerCase()));
      if (p) window.__reel.place(p);
    }
    if (!window.SPStories.byKey(key)) throw new Error("Unknown template " + key);
    window.__reel.choose(key, seconds ? { seconds: +seconds } : null);
  }, { key, seconds, placeName });
  await pg.waitForTimeout(150);
  await pg.waitForFunction("window.__reel.ready()", null, { timeout: 180000 });
}

const write = (data, out) => {
  const txt = JSON.stringify(data, null, 2);
  if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, txt); console.log("wrote " + out); }
  else console.log(txt);
};

/* ---- commands ---- */
async function list() {
  const s = await reelPage();
  const t = await s.pg.evaluate(() => window.SPStories.TEMPLATES.map((t) => ({ key: t.key, group: t.group, label: t.label, seconds: t.seconds })));
  await s.close();
  if (opt.json) return write(t, opt.out);
  for (const x of t) console.log(`${x.key.padEnd(34)} ${String(x.seconds).padStart(3)}s  ${x.group} · ${x.label}`);
}

async function facts(key) {
  if (!key) die("facts <template-key>");
  const lang = opt.lang || cfg.lang || "hi";
  const s = await reelPage();
  await choose(s.pg, key, opt.seconds, opt.place || cfg.place);
  const f = await s.pg.evaluate((lang) => {
    const R = window.__reel.reel(), T = window.SPStories.byKey(R.key);
    const r = window.SPScript.render(R, lang);
    return {
      key: R.key, group: T.group, label: T.label, blurb: T.blurb, lang,
      reelSeconds: R.seconds, kicker: R.kicker, title: R.title, subtitle: R.subtitle,
      closing: R.closing, foot: R.foot, method: R.method, place: window.__reel.placeName(),
      beats: r.beats.map((b, i) => ({ i: i + 1, from: +b.from.toFixed(3), to: +b.to.toFixed(3), say: b.say })),
      speech: window.SPScript.speech(R, lang),
    };
  }, lang);
  await s.close();
  write(f, opt.out);
}

async function today() {
  const s = await open("studio.html");
  await s.pg.waitForFunction("window.__stIdeas && window.__stIdeas.length", null, { timeout: 120000 });
  const date = opt.date || null, place = opt.place || cfg.place;
  await s.pg.evaluate(({ date, place }) => {
    const S = window.__stState();
    if (place) { const p = window.NP.PLACES.find((x) => x.n.toLowerCase().startsWith(place.toLowerCase())); if (p) S.place = p; }
    if (date) { const [y, m, d] = date.split("-").map(Number); S.date = { y, m, d }; }
    window.__stIdeas = null; window.__stRender();
  }, { date, place });
  await s.pg.waitForFunction("window.__stIdeas && window.__stIdeas.length", null, { timeout: 120000 });
  const out = await s.pg.evaluate(() => {
    const D = window.__stDay, S = window.__stState();
    const txt = (h) => { const e = document.createElement("div"); e.innerHTML = h || ""; return e.textContent.trim(); };
    return {
      date: S.date, place: S.place.n,
      day: { vara: D.vara, varaEn: D.varaEn, masa: D.masa, phase: D.phase, samvat: D.samvat, masaFestival: D.masaFestival },
      ideas: window.__stIdeas.map((i) => ({ rank: i.rank, key: i.key, hook: i.hook, headline: i.headline, sub: i.sub,
        body: txt(i.body), facts: i.facts, tags: i.tags, scene: i.rec && i.rec.scene })),
    };
  });
  await s.close();
  write(out, opt.out);
}

/* Render the reel so that each script line's beats span exactly that line's voice. */
async function render(slug) {
  if (!slug) die("render <slug>");
  const dir = path.join(ROOT, "src/stories", slug);
  const F = JSON.parse(fs.readFileSync(path.join(dir, "astro-facts.json"), "utf8"));
  const script = JSON.parse(fs.readFileSync(path.join(dir, "script.json"), "utf8"));
  const voice = JSON.parse(fs.readFileSync(path.join(dir, "voice.json"), "utf8")).durations || [];
  if (voice.length !== script.length || voice.some((d) => !d)) die("voice.json missing durations — run make_voice.py first");
  const nb = F.beats.length;
  // segments in reel time, one per script line
  const segs = script.map((line, i) => {
    const [a, b] = line.beats || [i + 1, i + 1];
    if (a < 1 || b > nb || a > b) die(`script line ${i + 1}: beats ${a}-${b} out of range 1-${nb}`);
    return { r0: F.beats[a - 1].from, r1: F.beats[b - 1].to, out: voice[i] + GAP };
  });
  segs[0].r0 = 0; segs[segs.length - 1].r1 = F.reelSeconds;
  for (let i = 1; i < segs.length; i++) if (segs[i].r0 < segs[i - 1].r1) segs[i].r0 = segs[i - 1].r1;
  const total = segs.reduce((a, s) => a + s.out, 0) + TAIL;
  const frames = Math.round(total * FPS);
  const progressAt = (t) => {
    let acc = 0;
    for (const s of segs) { if (t < acc + s.out) return (s.r0 + ((t - acc) / s.out) * (s.r1 - s.r0)) / F.reelSeconds; acc += s.out; }
    return 1;
  };

  const s = await reelPage();
  await choose(s.pg, F.key, F.reelSeconds, F.place);
  if (opt.palette) await s.pg.evaluate((k) => window.__reel.palette(k), opt.palette);
  const outFile = path.join(ROOT, "public", slug, "astro.mp4");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", outFile], { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    const p = Math.min(1, progressAt(f / FPS));
    const b64 = await s.pg.evaluate((p) => { window.__reel.at(p); return document.getElementById("reel-canvas").toDataURL("image/jpeg", 0.93).split(",")[1]; }, p);
    if (!ff.stdin.write(Buffer.from(b64, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 150 === 0) process.stdout.write(`\r  frame ${f}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await s.close();
  fs.writeFileSync(path.join(dir, "astro-timing.json"), JSON.stringify({ seconds: +total.toFixed(3), gap: GAP, tail: TAIL }, null, 2));
  console.log(`\rrendered ${outFile}  (${total.toFixed(1)} s, ${frames} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}


/* ---------------- structured data (for own-layout reels) ---------------- */
const RASHI = ["Meṣa","Vṛṣabha","Mithuna","Karka","Siṃha","Kanyā","Tulā","Vṛścika","Dhanu","Makara","Kumbha","Mīna"];
const RASHI_HI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुम्भ","मीन"];
const RASHI_LORD = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
const NAK_HI = ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्व फाल्गुनी","उत्तर फाल्गुनी","हस्त","चित्रा","स्वाति","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्व भाद्रपद","उत्तर भाद्रपद","रेवती"];
const GRAHA_HI = { Sun: "सूर्य", Moon: "चन्द्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "बृहस्पति", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु" };
const GRAHA_ALIAS = { surya: "Sun", sun: "Sun", chandra: "Moon", moon: "Moon", mangal: "Mars", mars: "Mars", budh: "Mercury", budha: "Mercury",
  mercury: "Mercury", guru: "Jupiter", brihaspati: "Jupiter", jupiter: "Jupiter", shukra: "Venus", venus: "Venus", shani: "Saturn",
  sani: "Saturn", saturn: "Saturn", rahu: "Rahu", ketu: "Ketu" };
const DASHA_ORDER = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
const DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
const TITHI_HI = ["प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा","अमावस्या"];
const VARA_HI = ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];

/* Deity / gaṇa / yoni / nāḍī live inside kundli.html's source (marked there as later tradition, not Parāśara). */
function kundliTables() {
  const src = fs.readFileSync(path.join(ASTRO, "kundli.html"), "utf8");
  // several arrays share a name in that file, so take the first 27-item match that passes a sanity test
  const grab = (name, ok) => {
    const re = new RegExp("var " + name + "\\s*=\\s*\\[([\\s\\S]*?)\\];", "g");
    for (const m of src.matchAll(re)) {
      try { const a = JSON.parse("[" + m[1] + "]"); if (a.length === 27 && (!ok || ok(a))) return a; } catch (e) {}
    }
    return null;
  };
  return { deity: grab("MT_NKD"), gana: grab("NAKG", (a) => a.includes("Deva")), yoni: grab("NAKY", (a) => a.includes("Horse")),
    nadi: grab("NAKN", (a) => a.every((x) => ["Adi", "Madhya", "Antya"].includes(x))) };
}

const findIdx = (arg, list, hi) => {
  if (/^\d+$/.test(String(arg))) return +arg - 1;
  const n = String(arg).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zऀ-ॿ]/g, "");
  const i = list.findIndex((x) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "").startsWith(n));
  return i >= 0 ? i : hi.findIndex((x) => x.replace(/\s/g, "") === n);
};

async function enginePage() {
  const s = await open("reel.html");
  await s.pg.waitForFunction("window.NP && window.NP.dayOfDate && window.NNak && window.YOGATARAS", null, { timeout: 120000 });
  return s;
}

function whenFromOpts(P) {
  const now = new Date();
  const [y, m, d] = (opt.date || `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`).split("-").map(Number);
  const [hh, mm] = (opt.time || "06:00").split(":").map(Number);
  const ms = Date.UTC(y, m - 1, d, hh, mm) - (P.tz || 0) * 3600000;
  return { y, m, d, ms };
}

async function data(kind, arg) {
  const s = await enginePage();
  const placeName = opt.place || cfg.place || "Delhi";
  const consts = { RASHI, RASHI_HI, RASHI_LORD, NAK_HI, GRAHA_HI, DASHA_ORDER, DASHA_YEARS, TITHI_HI, VARA_HI };
  const tables = kundliTables();
  let out;
  try {
    if (kind === "sky" || kind === "events" || kind === "graha") {
      const P = await s.pg.evaluate((pn) => window.NP.PLACES.find((x) => x.n.toLowerCase().startsWith(pn.toLowerCase())) || window.NP.PLACES[0], placeName);
      const W = whenFromOpts(P);
      let grahaKey = null;
      if (kind === "graha") { grahaKey = GRAHA_ALIAS[String(arg || "").toLowerCase()] || arg; if (!GRAHA_HI[grahaKey]) die("unknown graha " + arg); }
      out = await s.pg.evaluate(({ kind, P, W, C, days, grahaKey }) => {
        const NP = window.NP, tz = P.tz || 0;
        const local = (ms) => { if (ms == null) return null; const d = new Date(ms + tz * 3600000);
          const p = (n) => String(n).padStart(2, "0");
          return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`; };
        const r2 = (x) => Math.round(x * 100) / 100;
        const nakOf = (lon) => { const i = window.NNak.idx(lon); const e = window.NNak.edges()[i];
          return { i: i + 1, name: NP.NAMES.nak[i], hi: C.NAK_HI[i], pada: Math.min(4, Math.floor((lon - e.start) / ((e.end - e.start) / 4)) + 1) }; };
        const graha = (g, ms) => { const lon = NP.sidAt(g, ms); const ri = Math.floor(lon / 30);
          return { graha: g, hi: C.GRAHA_HI[g], sa: NP.grahaSa(g), lon: r2(lon), rashi: { i: ri + 1, name: C.RASHI[ri], hi: C.RASHI_HI[ri] },
            degInRashi: r2(lon - ri * 30), nak: nakOf(lon), retro: !!NP.isRetro(g, ms) }; };
        const ev = (e) => ({ kind: e.kind, when: local(e.ms), graha: e.graha || null, grahaHi: e.graha ? C.GRAHA_HI[e.graha] : null,
          to: e.sign != null ? { i: e.sign + 1, name: C.RASHI[e.sign], hi: C.RASHI_HI[e.sign] } : null,
          from: e.from != null ? { i: e.from + 1, name: C.RASHI[e.from], hi: C.RASHI_HI[e.from] } : null });
        const base = { place: P.n, tz, ayanamsa: NP.ayanKey ? NP.ayanKey() : null, asOf: local(W.ms) };
        if (kind === "sky") {
          const D = NP.dayOfDate(W.y, W.m, W.d, P);
          const A = NP.atMoment ? NP.atMoment(D, W.ms) : null;
          const t = D.at.tithi;
          let fest = []; try { fest = (NP.festivalsOn ? NP.festivalsOn(D) : []) || []; } catch (e) {}
          return { ...base, date: `${W.y}-${W.m}-${W.d}`,
            panchangaAtSunrise: { vara: D.vara, varaHi: C.VARA_HI[D.varaIdx], tithi: { ...t, hi: (t.paksha === "śukla" ? "शुक्ल " : "कृष्ण ") + C.TITHI_HI[t.i === 29 ? 15 : t.n - 1] },
              nakshatra: { ...D.at.nak, i: D.at.nak.i + 1, hi: C.NAK_HI[D.at.nak.i] }, yoga: D.at.yoga, karana: D.at.karana },
            sunrise: local(D.sunrise), sunset: local(D.sunset), masa: D.masa, samvat: D.samvat,
            moon: A ? { elongation: r2(A.atMoment.elongation), illumination: r2(A.atMoment.illumination) } : null,
            grahas: NP.GRAHA.map((g) => graha(g, W.ms)),
            festivals: fest.map((f) => (typeof f === "string" ? f : { name: f.name || f.en || f.key, hi: f.hi || null, rule: f.rule || null, source: f.source || null })) };
        }
        const evs = (NP.scanEvents(W.ms, W.ms + days * 86400000) || []).map(ev);
        if (kind === "events") return { ...base, from: local(W.ms), days, events: evs };
        return { ...base, now: graha(grahaKey, W.ms), dashaYears: C.DASHA_YEARS[grahaKey] || null,
          rulesRashis: C.RASHI.map((r, i) => (C.RASHI_LORD[i] === grahaKey ? { i: i + 1, name: r, hi: C.RASHI_HI[i] } : null)).filter(Boolean),
          rulesNakshatras: NP.NAMES.nak.map((n, i) => (C.DASHA_ORDER[i % 9] === grahaKey ? { i: i + 1, name: n, hi: C.NAK_HI[i] } : null)).filter(Boolean),
          comingEvents: evs.filter((e) => e.graha === grahaKey || (grahaKey === "Moon" && /moon/.test(e.kind))), days };
      }, { kind, P, W, C: consts, days: +(opt.days || (kind === "graha" ? 365 : 30)), grahaKey });
    } else if (kind === "nakshatra") {
      const names = await s.pg.evaluate(() => window.NP.NAMES.nak);
      const i = findIdx(arg, names, NAK_HI); if (i < 0 || i > 26) die("nakshatra 1-27 or a name");
      out = await s.pg.evaluate(({ i, C, T }) => {
        const NP = window.NP, e = window.NNak.edges()[i], span = e.end - e.start, r2 = (x) => Math.round(x * 100) / 100;
        const lord = C.DASHA_ORDER[i % 9], yt = window.YOGATARAS[i];
        const padas = [0, 1, 2, 3].map((k) => { const a = e.start + k * span / 4, nav = Math.floor(a / (10 / 3)) % 12, ri = Math.floor((a + 0.001) / 30);
          return { pada: k + 1, from: r2(a), to: r2(a + span / 4), rashi: { name: C.RASHI[ri], hi: C.RASHI_HI[ri] }, navamsha: { name: C.RASHI[nav], hi: C.RASHI_HI[nav] } }; });
        const rs = [...new Set([Math.floor(e.start / 30), Math.floor((e.end - 0.001) / 30)])].map((ri) => ({ i: ri + 1, name: C.RASHI[ri], hi: C.RASHI_HI[ri] }));
        return { i: i + 1, name: NP.NAMES.nak[i], hi: C.NAK_HI[i], start: r2(e.start), end: r2(e.end), span: r2(span),
          rashis: rs, lord: { graha: lord, hi: C.GRAHA_HI[lord], dashaYears: C.DASHA_YEARS[lord] }, padas,
          neighbours: { before: { name: NP.NAMES.nak[(i + 26) % 27], hi: C.NAK_HI[(i + 26) % 27] }, after: { name: NP.NAMES.nak[(i + 1) % 27], hi: C.NAK_HI[(i + 1) % 27] } },
          yogatara: yt ? { star: yt.star, bayer: yt.bayer, magnitude: yt.mag, siderealLon: yt.sid, insideOwnSegment: yt.inside } : null,
          tradition: { deity: T.deity ? T.deity[i] : null, gana: T.gana ? T.gana[i] : null, yoni: T.yoni ? T.yoni[i] : null, nadi: T.nadi ? T.nadi[i] : null,
            note: "Deity, gaṇa, yoni and nāḍī are later tradition, not verses of Parāśara (as Nirayana itself labels them)." },
          nakshatraMode: window.NNak.mode ? window.NNak.mode() : null };
      }, { i, C: consts, T: tables });
    } else if (kind === "rashi") {
      const i = findIdx(arg, RASHI, RASHI_HI); if (i < 0 || i > 11) die("rashi 1-12 or a name");
      out = await s.pg.evaluate(({ i, C }) => {
        const NP = window.NP, a = i * 30, b = a + 30, r2 = (x) => Math.round(x * 100) / 100;
        const naks = window.NNak.edges().filter((e) => e.end > a + 0.001 && e.start < b - 0.001)
          .map((e) => ({ i: e.i + 1, name: NP.NAMES.nak[e.i], hi: C.NAK_HI[e.i], from: r2(Math.max(a, e.start)), to: r2(Math.min(b, e.end)),
            padasHere: Math.round((Math.min(b, e.end) - Math.max(a, e.start)) / ((e.end - e.start) / 4)) }));
        const lord = C.RASHI_LORD[i];
        return { i: i + 1, name: C.RASHI[i], hi: C.RASHI_HI[i], from: a, to: b, lord: { graha: lord, hi: C.GRAHA_HI[lord] }, nakshatras: naks };
      }, { i, C: consts });
    } else die("data sky | events | nakshatra <n> | rashi <n> | graha <name>");
  } finally { await s.close(); }
  write(out, opt.out);
}

const cmds = { list, facts: () => facts(pos[0]), today, render: () => render(pos[0]), data: () => data(pos[0], pos[1]) };
if (!cmds[cmd]) die("usage: bridge.mjs list | facts <key> | today | render <slug> | data sky|events|nakshatra|rashi|graha");
await cmds[cmd]();
