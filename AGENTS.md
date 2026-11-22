# Kahani Reels project
Remotion project for 9:16 Hindi reels. Default narration language: pure Hindi (Devanagari).

**Every reel starts with the reel brief** (length, voice, music, captions, then language, speed, handle, defaults):
`.agents/skills/kahani-reel/references/reel-brief.md`. Defaults live in `reel-defaults.json`.
Unattended runs (daily, `claude -p`) never ask — they use the defaults.

Which skill:
- Original reel on a Jyotiṣa/sky topic — Nirayana data + own layout + own story → `nirayana-story`
- Reel rendered by Nirayana's Reel Studio templates → `astro-reel`
- Cartoon story / legend → `kahani-reel`
- "Today's reel" / scheduled → `astro-daily`

Nirayana engine bridge: `node tools/astro/bridge.mjs list | facts | today | render | data sky|events|nakshatra|rashi|graha`.
Update the engine: `bash tools/update-astro.sh`. Tanpura music: `python3 tools/make_music.py`.
Never modify src/kahani/ unless asked (new data layouts may be added to src/kahani/astro/);
add stories under src/stories/ and register them in src/stories/registry.ts.
Preview: `npm run dev`. Render: `npx remotion render <Id> out/<slug>.mp4`.
