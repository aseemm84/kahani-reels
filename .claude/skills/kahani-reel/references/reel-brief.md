# Reel brief — ask BEFORE doing any work (all reel skills)

Read `reel-defaults.json` (project root). Then ask the user, in **one** question round (Claude Code: use the
AskUserQuestion tool with up to 4 questions per call; Antigravity/other agents: one short numbered message).
Skip any question the prompt already answers. Put the saved default first and mark it "(default)".

**Round 1 — always**
1. **Length** — 30 s · 45 s · 60 s · 90 s
2. **Voice** — Female (hi-IN-SwaraNeural) · Male (hi-IN-MadhurNeural)
3. **Background music** — None · Tanpura drone (bundled, royalty-free) · My own file (`public/music/*.mp3`)
4. **Captions** — Hindi captions on · Off

**Round 2 — technical (one call; skip if the user said "use defaults")**
5. **Language** — Pure Hindi (Devanagari) · Hinglish · English
6. **Voice speed** — Normal (+0%) · Calm (-8%) · Brisk (+8%)
7. **Handle / watermark** — None · the saved handle · type a new one (e.g. @Nirayana.Soft)
8. **Save these as my defaults?** — Yes · No  → if yes, write them to `reel-defaults.json`.

**Astro-data reels only** (ask with round 2, only when the topic depends on time/place):
- **Date & place** — Today, saved place · another date/place (e.g. 2026-12-11, Abu Dhabi, AE)

**Never ask** in unattended runs (daily reel, `claude -p`, scheduled): use `reel-defaults.json` silently and
state the values used in the final report.

## Apply the answers
| Answer | Where it goes |
|---|---|
| Length L | script ≈ L×2.2 Hindi words (≈ L×2.5 Hinglish, L×2.6 English); scenes = round(L/6) |
| Voice / speed | `make_voice.py --voice <id> --rate <rate>` |
| Music | story `music: "music/tanpura.mp3"`, `musicVolume` from defaults. Tanpura missing → `python3 tools/make_music.py` |
| Captions | `captions` flag (astro) / leave `caption` empty strings to hide (kahani & nirayana-story) |
| Language | narration script + captions in that language |
| Handle | story `handle` |
| Date/place | `bridge.mjs data … --date … --place …` |

After voicing, check the real total: if it is off the chosen length by more than 15 %, tighten or extend the
script and re-voice before rendering.
