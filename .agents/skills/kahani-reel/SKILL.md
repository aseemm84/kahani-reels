---
name: kahani-reel
description: Make a 9:16 animated cartoon-style Hindi story reel (mythology, folk tales, nakshatra/graha legends) (Instagram/YouTube Shorts) from a one-line prompt like "Hanuman ji aur Sanjeevani ki kahani, 60 seconds". Use for any request to create, edit, re-voice or re-render a kahani/story reel in this Remotion project.
---

# Kahani Reel

This project already contains a reel engine. Do NOT rebuild it — only add a story.

- `src/kahani/` — engine: `KahaniReel` (sequencing, crossfades, camera push-in, captions, voice, music),
  `Background` (stars + diyas), `Caption`, `Kicker`, `Props` (Moon, Mountains, Cloud, Tree), `theme.ts`.
- `src/stories/<slug>/` — one folder per story: `script.json`, `voice.json`, `index.tsx`.
- `src/stories/registry.ts` — every story must be registered here.
- `src/stories/demo/` — working example. Copy its patterns.

Read `references/style-guide.md` before drawing scenes. Also apply the `remotion-best-practices` skill if installed.


## 0. Reel brief
Before any work, follow `.claude/skills/kahani-reel/references/reel-brief.md` (in Antigravity `.agents/skills/…`): ask length, voice, music, captions, then the technical round. Skip only in unattended runs (use `reel-defaults.json`).

## Workflow — run every step without stopping to ask (after the brief)

1. **Parse the prompt + brief**: story, target length (from the brief), language (default **pure Hindi, Devanagari**;
   Hinglish/English only if asked), voice (default male `hi-IN-MadhurNeural`; "female voice" → `hi-IN-SwaraNeural`).
   **Jyotisha topics** (a nakshatra, rashi, graha, bhava, festival): first run
   `node tools/astro/bridge.mjs facts <key> --lang hi --out src/stories/<slug>/astro-facts.json`
   (keys from `node tools/astro/bridge.mjs list`, e.g. `learn.nakshatra.4` for Rohiṇī) and treat it as the
   factual base — lord, deity, degrees, rashi, dasha years must match it exactly. The legend itself
   (e.g. Chandra and his 27 wives, Rohiṇī his favourite) is traditional story; keep it respectful and faithful. Pick a kebab-case `slug`
   and PascalCase composition id ending in `Reel` (e.g. `hanuman-sanjeevani`, `HanumanSanjeevaniReel`).

2. **Script** → `src/stories/<slug>/script.json`, an array of scenes `{ "narration", "caption" }`.
   - ~2.3 spoken words per second; 60 s ≈ 130–140 words; 8–12 scenes of 4–7 s each.
   - Scene 1 is a hook (question or surprising line) in under 3 s. Last scene = moral/payoff + soft CTA
     ("ऐसी और कहानियों के लिए फ़ॉलो करें").
   - Narration in Devanagari Hindi by default (Roman Hinglish only if asked).
   - Caption: 2–5 words in the narration's script, highlight ONE word with `*stars*`.
   - Treat religious and mythological figures respectfully; stay faithful to the traditional story.

3. **Voice**: `python3 .claude/skills/kahani-reel/scripts/make_voice.py <slug> --voice <voice> --rate +5%`
   (in Antigravity the same script is at `.agents/skills/kahani-reel/scripts/`). This writes
   `public/<slug>/sN.mp3` and `voice.json` with real durations. If total voice differs from target by
   >15 %, edit the script and re-run. Fix one line with `--only N`.

4. **Visuals** → `src/stories/<slug>/index.tsx`. One React component per scene, pure inline SVG in a
   `0 0 1080 1920` viewBox, following the style guide. Export:
   ```ts
   export const <camel>Story: Story = {
     slug, id, title: "Short *title*", kicker: "UPPERCASE KICKER", voice,
     scenes: [Scene1, Scene2, ...].map((Visual, i) => ({ ...script[i], Visual })),
   };
   ```
   The number of Scene components MUST equal the number of script entries.

5. **Register** the story in `src/stories/registry.ts` (import + add to the array).

6. **Check**: `npx tsc --noEmit` must pass. Render 3 stills to eyeball composition:
   `npx remotion still <Id> out/<slug>-f30.png --frame=30` (and two later frames). Open them; fix overlaps
   with the title (top 330 px) and caption (y 1450–1620) zones.

7. **Render**: `npx remotion render <Id> out/<slug>.mp4` and report the path + duration.

## Edits after the first render
- "Change scene N" → edit that component only, re-render.
- "Change the words" → edit script.json, re-run make_voice.py (`--only N` for one line), re-render.
- Music: `music: "music/tanpura.mp3"` (make it with `python3 tools/make_music.py` if missing) or the user's file; `musicVolume` and `handle` from the brief.
