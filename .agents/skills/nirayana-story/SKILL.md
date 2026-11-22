---
name: nirayana-story
description: Make a 9:16 Hindi reel whose FACTS come from the Nirayana (Astro) engine but whose LAYOUT and STORY are designed fresh — animated zodiac wheels, nakshatra arcs, moon phases, timelines, graha orbs, info cards. Use for any Jyotisha/sky topic when the user wants an original reel rather than a Reel Studio template (e.g. "Shani margi kab hoga", "aaj ka panchang", "Rohini nakshatra ki kahani", "is mahine ke grahan aur gochar").
---

# Nirayana story reel — engine data, own layout, own story

Three rules: **every number comes from the engine**, **every scene is designed for this story**, **the story has
an arc** (not a list of facts).

## 0. Reel brief
Follow `.claude/skills/kahani-reel/references/reel-brief.md` (in Antigravity: `.agents/skills/…`). Ask before
anything else; skip in unattended runs.

## 1. Get the data → `src/stories/<slug>/data/`
`node tools/astro/bridge.mjs data <kind> … --out src/stories/<slug>/data/<name>.json`

| Need | Command |
|---|---|
| positions, pañcāṅga, sunrise/sunset, moon phase, festivals for a date/time/place | `data sky --date YYYY-MM-DD --time HH:MM --place "Delhi, IN"` |
| coming ingress / vakrī / mārgī / pūrṇimā / amāvasyā | `data events --days 30` |
| one nakṣatra (span, pādas, navāṃśa, lord, daśā years, yogatārā, tradition) | `data nakshatra 4` or `data nakshatra rohini` |
| one rāśi and its nakṣatras | `data rashi 2` |
| one graha now + its next year of events, rulerships | `data graha shani --days 365` |
| a Reel Studio template's facts (optional extra colour) | `facts <key> --lang hi --out …/data/facts.json` |

Pull 2–4 files: the core topic plus context (e.g. graha + events + sky). Read them fully.
Tradition fields (deity, gaṇa, yoni, nāḍī) must be framed as tradition ("परम्परा के अनुसार…"), never as Parāśara.

## 2. Design the story → `src/stories/<slug>/storyboard.md` (write it, then follow it)
Arc for 30–90 s (scene count = length/6, from the brief):
1. **Hook** (≤3 s): a question or surprise built on one real number ("शनि 11 दिसम्बर को फिर सीधे चलेंगे — पर क्या वे कभी उल्टे चले थे?").
2. **Setup**: where we are in the sky (wheel / arc / card).
3. **Turn**: the key fact, shown big (BigStat, highlight, timeline).
4. **Meaning**: what the tradition says, or the legend — clearly as story, no predictions.
5. **Payoff + CTA**: one-line takeaway; "ऐसी और जानकारी के लिए फ़ॉलो करें".
For each scene record: narration, caption (2–4 words, one `*highlight*`), layout, the exact data fields used.
Vary layouts — never the same layout twice in a row.

## 3. Script → `src/stories/<slug>/script.json`
`[{ "narration": "...", "caption": "..." }, ...]` in the brief's language. **Write numbers as digits**
(the Hindi voice reads "16 अंश" correctly). Dates spoken naturally ("11 दिसम्बर"), times as "सुबह 5 बजकर 23 मिनट".
Then: `python3 .claude/skills/nirayana-story/scripts/verify_numbers.py <slug>` — must print ✓. Structural numbers
not in the data (27 nakṣatras, 12 rāśis, 4 pādas, 360°) go into `derived.json` with a reason.

## 4. Voice
`python3 .claude/skills/kahani-reel/scripts/make_voice.py <slug> --voice <brief voice> --rate <brief rate>`
Check the total against the brief's length (±15 %); adjust script and re-voice if needed.

## 5. Scenes → `src/stories/<slug>/index.tsx`
Use the **kahani engine** (`Story` type, registered in `stories`) so background, captions, kicker, camera,
music and handle all work. Import data JSON directly and bind real values — never retype numbers:
```tsx
import { ZodiacWheel, NakshatraArc, MoonPhase, InfoCards, Timeline, BigStat, GrahaOrb } from "../../kahani/astro";
import sky from "./data/sky.json";
const Scene2 = () => (<svg width="100%" height="100%" viewBox="0 0 1080 1920">
  <ZodiacWheel grahas={sky.grahas} highlightRashi={sky.grahas.find(g => g.graha === "Saturn")!.rashi.i} /></svg>);
```
Layout catalogue (all in `src/kahani/astro/`, all 1080×1920, all animate on their own):
- `ZodiacWheel` grahas fly to real longitudes; `highlightRashi`, `highlightArc=[a,b]`
- `NakshatraArc` one nakṣatra: span, 4 pādas (+navāṃśa), yogatārā star; `activePada`
- `MoonPhase` real illumination + waxing/waning, label/sub
- `InfoCards` rows sliding in (pañcāṅga limbs, rulerships); `highlight`
- `Timeline` dated events, graha-coloured dots
- `BigStat` counting number with suffix (°, वर्ष, दिन)
- `GrahaOrb` stylised graha, Saturn ring, Sun rays, `retro` badge "वक्री"
- From `../../kahani/Props`: `Moon`, `Mountains`, `Cloud`, `Tree` for story/legend scenes.
You may **create new layouts** when the story needs one (e.g. a retrograde loop path, a sunrise arc): add them to
`src/kahani/astro/`, export from its `index.ts`, keep them data-driven and deterministic (no Math.random).
Keep content inside y 330–1450 (title above, caption/diyas below).

## 6. Assemble, check, render
Story object: `{ slug, id, title, kicker, voice, music, musicVolume, handle, scenes }` (kicker e.g.
"निरायण · शनि गोचर"); add to `stories` in `src/stories/registry.ts`. `npx tsc --noEmit`; render 3 stills
(`npx remotion still <Id> out/<slug>-<n>.png --frame=<n>`), open them, fix overlaps; then
`npx remotion render <Id> out/<slug>.mp4`. Report: path, duration, brief values used, data files used, and a
post caption (2–3 Hindi lines + hashtags #ज्योतिष #Jyotish #VedicAstrology #Nirayana + topic tags).
