---
name: storyboard-reel
description: Build a 9:16 Hindi reel from a scene-by-scene storyboard written by the Gemini "Kahani Storyboard Director" Gem (or by hand) — any story from Indian Hindu culture (Rāmāyaṇa, Mahābhārata, Purāṇas, festivals, saints, temple legends, folk and moral tales, Jyotiṣa). Use whenever the user pastes or attaches a storyboard / Gemini JSON (contains "kahani_storyboard"), or says "make this storyboard into a reel".
---

# Storyboard → reel

The storyboard is the director's plan: story, sources, characters, and per-scene narration, caption, setting,
palette, camera move/shot/focus and transition. **Follow it faithfully**; your job is to build it beautifully and
check it, not to rewrite the story.

## 1. Take in the storyboard
- Paste or file → save the raw text as `storyboards/<slug>.md`, then
  `python3 .claude/skills/storyboard-reel/scripts/validate_storyboard.py storyboards/<slug>.md --save src/stories/<slug>/storyboard.json`
- On ✗ errors: fix the mechanical ones yourself (a caption 1 word too long, an unknown camera value → the nearest
  allowed one, seconds that don't add up → rescale), and list what you changed. Anything touching the **story
  content or sources** → ask the user (they can send it back to the Gem). ⚠ warnings: note them and go on.
- Slug from the title (kebab-case, Latin letters, e.g. `hanuman-sanjeevani`); composition id PascalCase + `Reel`.

## 2. Reel brief (short version)
Follow `.claude/skills/kahani-reel/references/reel-brief.md`, but **pre-fill from the storyboard** and only ask what
it does not settle: storyboard gives length (`target_seconds`), voice gender, music, language. Usually only ask:
captions on/off, voice speed, handle, and "use the storyboard's length/voice/music?" (one question, default yes).
Unattended runs: never ask.

## 3. Authenticity pass (2 minutes, always)
Read `sources`, `authenticity_notes` and every narration line. If something looks wrong against the named source
(wrong character, invented śloka, wrong place, a later-version detail claimed as Vālmīki, disrespectful
wording), **do not silently change it** — tell the user in one short list and ask whether to fix. Correct only
obvious spelling of Sanskrit names. Never add facts of your own.

## 4. Data (only if `data_needed` is non-empty — usually `jyotisha-data`)
For each entry run the bridge (`node tools/astro/bridge.mjs data …`, hint in `hint`) into
`src/stories/<slug>/data/`, replace every `{{key}}` in narration/caption with the real value (digits; dates as
"11 दिसम्बर"), then `python3 .claude/skills/nirayana-story/scripts/verify_numbers.py <slug>` must pass.

## 5. Script + voice
- `src/stories/<slug>/script.json` = `[{narration, caption}]` straight from the scenes (captions empty if the brief
  turned captions off).
- `python3 .claude/skills/kahani-reel/scripts/make_voice.py <slug> --provider <brief provider> --gender <female|male> --mood <mood> --fallback edge`
  `--gender` from `voice.gender`, `--mood` from `voice.mood` (calm · devotional · warm · dramatic · energetic · children).
- If the real total is >15 % off `target_seconds`, tell the user and offer to trim; don't rewrite unasked.

## 6. Characters — build once, reuse everywhere
`src/stories/<slug>/characters.tsx`: one SVG component per `characters[]` entry, drawn from its `look`
(flat vector, storybook proportions — big head ≈ 1/3 height, 3–5 flat colours + highlight, traditional
iconography, kind expressions). Signature: `({ pose, x, y, scale, flip }: CharProps) => JSX` with every pose the
storyboard uses (standing, walking, running, flying, sitting, meditating, blessing, fighting, carrying, bowing,
dancing, sleeping, pointing, praying …) as limb/body variants of the same drawing, plus idle life
(breathing bob, blink, tail/cloth sway via `useCurrentFrame`). Positions: far-left 160, left 300, center 540,
right 780, far-right 920 (x); ground y ≈ 1250, sky y ≈ 700. Deities and saints: reverent, never comic.

## 7. Scenes → `src/stories/<slug>/index.tsx`
One `Visual` per scene, a 1080×1920 SVG:
- `visual.elements` → `Moon`, `Mountains`, `Cloud`, `Tree` from `../../kahani/Props`; draw others (sea, palace,
  temple, herb-mountain, battlefield, fire, lotus, sky-chariot, rain, lightning …) as small reusable components in
  `src/stories/<slug>/scenery.tsx` — flat, layered for parallax, deterministic (no Math.random; seeded helpers).
- `visual.characters[].action` → animate with `interpolate` / `spring` over the scene (enter, fly path, rise, bow).
- `visual.layout` (Jyotiṣa) → components from `../../kahani/astro`.
- Keep important content in y 330–1450.
Story object (type `SBStory` from `../../storyboard/StoryboardReel`):
```ts
export const <camel>Story: SBStory = {
  slug, id, title: sb.title, kicker: sb.kicker, voice, handle, diyas: sb.diyas ?? true,
  music: sb.music && sb.music !== "none" ? `music/${sb.music}.mp3` : undefined, musicVolume: 0.12,
  scenes: sb.scenes.map((s, i) => ({
    narration: script[i].narration, caption: script[i].caption, seconds: s.seconds, Visual: VISUALS[i],
    camera: { ...s.camera, focus: focusOf(s.camera.focus) },   // character id → {x,y} from its position
    transition: s.transition_in, palette: s.visual.palette,
  })),
};
```
Register it in `storyboardStories` in `src/stories/registry.ts`. The `StoryboardReel` engine applies sky palette,
camera (shot framing + move), transitions, captions, title, handle, diyas, music and voice.

## 8. Check and render
`npx tsc --noEmit`; render one still per scene at ~60 % of its length
(`npx remotion still <Id> out/<slug>-s<n>.png --frame=<f>`), look at them, fix overlaps/off-frame characters;
then `npx remotion render <Id> out/<slug>.mp4`.
Report: path, duration, scenes, anything you fixed or flagged, and the post text = `post_caption` + `hashtags`
(also saved to `out/<slug>-caption.txt`).
