---
name: astro-reel
description: Make a 9:16 Hindi-voiced reel from the Nirayana/Astro engine's Reel Studio (126 templates — eclipses, vakri, asta, graha cycles, festivals, 27 nakshatras, 12 rashis, 12 bhavas, concepts). Use when the user asks for a reel about a sky event, festival date, nakshatra, rashi, bhava or Jyotisha concept rendered by the Astro engine.
---

# Astro reel (engine-rendered sky reel + Hindi story voice)

The visuals come from the user's own verified engine (repo at the `astroDir` in `tools/astro/config.json`).
You never draw these visuals — you write the voice and let the bridge render frames synced to it.

Bridge: `node tools/astro/bridge.mjs <command>` (run from the project root).


## 0. Reel brief
Before any work, follow `.claude/skills/kahani-reel/references/reel-brief.md` (in Antigravity `.agents/skills/…`): ask length, voice, music, captions, then the technical round. Skip only in unattended runs (use `reel-defaults.json`).

## Workflow — run every step without stopping to ask (after the brief)

1. **Pick the template.** `node tools/astro/bridge.mjs list` shows every key with its default length and label.
   Map the request to one key (e.g. "Rohini" → `learn.nakshatra.4`, "Shani vakri" → `vakri.saturn`,
   "why Diwali date changes" → `fest.when.diwali`). Choose slug (kebab-case) and id (PascalCase + `Reel`).

2. **Get the facts.** `node tools/astro/bridge.mjs facts <key> --lang hi --out src/stories/<slug>/astro-facts.json`
   Read it: `beats` (numbered visual moments with reel times and the engine's own Hindi line), `title`,
   `closing`, `blurb`, `place`. For long reels (30+ beats) you may first pass `--seconds 60`.

3. **Write the script** → `src/stories/<slug>/script.json`:
   `[{ "beats": [firstBeat, lastBeat], "narration": "...", "caption": "..." }, ...]`
   - Pure Hindi in Devanagari (unless the user asks otherwise). Warm storytelling tone, short sentences,
     spoken numbers ("चालीस अंश"), Sanskrit names correct. 5–9 lines, total ≈ 35–60 s of speech.
   - Line 1 = hook question over beat 1. Last line ends on the closing beat with a soft CTA
     ("ऐसी और जानकारी के लिए फ़ॉलो करें").
   - Beat ranges must be contiguous, in order, start at 1 and end at the last beat — every beat covered once.
     Group repetitive beats (e.g. 30 eclipse beats → 6 lines).
   - **Facts only from astro-facts.json.** Do not invent numbers, dates, deities or predictions. You may add
     well-known mythology colour, clearly as story, never as a computed fact. Keep the engine's honesty:
     "शास्त्रीय अध्ययन का ढाँचा, भविष्यवाणी नहीं" if the topic drifts toward prediction.
   - Caption: 2–4 Devanagari words, one word in `*stars*`.

4. **Voice** (voice + speed from the brief): `python3 .claude/skills/kahani-reel/scripts/make_voice.py <slug> --voice hi-IN-SwaraNeural --rate +0%`
   (male: `hi-IN-MadhurNeural`). Fix a single line with `--only N`.

5. **Render the engine frames, synced to the voice**: `node tools/astro/bridge.mjs render <slug>`
   → `public/<slug>/astro.mp4` + `src/stories/<slug>/astro-timing.json`. Each line's beats are stretched to
   exactly that line's voice. Optional `--palette <name>`.

6. **Register** → create `src/stories/<slug>/index.ts`:
   ```ts
   import type { AstroStory } from "../../kahani/AstroReel";
   import script from "./script.json";
   import voice from "./voice.json";
   import timing from "./astro-timing.json";
   export const <camel>Story: AstroStory = { slug: "<slug>", id: "<Id>", script, voice, timing,
     captions: <brief>, music: "music/tanpura.mp3" /* or none */, musicVolume: <brief>, handle: "<brief>" };
   ```
   and add it to `astroStories` in `src/stories/registry.ts`.

7. **Check**: `npx tsc --noEmit`; render two stills (`npx remotion still <Id> out/<slug>-a.png --frame=90`,
   and one mid-reel). If a caption pill covers the engine's text, set `captionBottom` (default 215) or
   `captions: false`.

8. **Render**: `npx remotion render <Id> out/<slug>.mp4`. Report path, duration, and the post caption:
   2-line Hindi hook + 5 hashtags (#ज्योतिष #नक्षत्र #Jyotish #VedicAstrology #Nirayana).

## Edits
- Wording → edit script.json, re-run make_voice (`--only N`), then **re-run bridge render** (timing changes), then render.
- Music: `music: "music/<file>.mp3"` on the story.
