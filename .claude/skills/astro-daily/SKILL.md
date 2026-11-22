---
name: astro-daily
description: Produce today's reel automatically — ask the Astro engine's Studio what is worth posting today, map it to a Reel Studio template (astro-reel) or a cartoon kahani reel (kahani-reel), and render it with Hindi voice. Use for "today's reel", "daily reel", or scheduled runs.
---

# Daily reel

Run all steps without asking — **do not run the reel brief**; take length, voice, music, captions, handle and
place from `reel-defaults.json`. Date defaults to today.

1. `node tools/astro/bridge.mjs today --out out/daily/<YYYY-MM-DD>/today.json` (add `--date YYYY-MM-DD` if given).
   Read `ideas` (ranked; `hook`, `facts`, `body`, `tags`, `scene`) and `day` (vāra, māsa, phase).

2. Skip ideas already made: check `out/daily/*/made.json` for the same template key within the last 14 days.

3. Map the best remaining idea to a template (`node tools/astro/bridge.mjs list` for exact keys):
   | Idea | Template |
   |---|---|
   | Today's nakṣatra is X | `learn.nakshatra.<1-27>` (Aśvinī = 1 … Revatī = 27) |
   | Pūrṇimā / Amāvāsyā | `cyc.cyc-purnima` / `cyc.cyc-amavasya` |
   | graha goes vakrī / stations | `vakri.<planet>` or `cyc.cyc-station-<graha>` |
   | graha combust / asta | `asta.<planet>` |
   | eclipse | `eclipse.new` (solar) / `eclipse.full` (lunar) |
   | festival (Diwali, Holi, Navarātri, Janmāṣṭamī, Śivarātri, Makara, Ugādi, Rāmanavamī, Dussehra) | `fest.when.<name>` |
   | conjunction / opposition | matching `cyc.cyc-conj-…` / `cyc.cyc-opp-…` |
   | graha enters a rāśi | `learn.rashi.<1-12>` of the new rāśi, mention the ingress time from facts |
   If an idea maps → follow the **astro-reel** skill (or **nirayana-story** on odd days for variety) (slug `daily-<YYYY-MM-DD>`), weaving the idea's
   date/time facts into line 1 ("आज चन्द्रमा रोहिणी में है…").
   If nothing maps (e.g. pañcāṅga only) → follow the **kahani-reel** skill in pure Hindi, using the idea's
   facts plus `bridge facts` of the related nakshatra/rashi as the factual base (mythology story of
   today's nakshatra deity works well).

4. Copy the final MP4 to `out/daily/<YYYY-MM-DD>/reel.mp4`, write `caption.txt` (Hindi hook, 2–3 lines,
   hashtags) and `made.json` `{ "template": "<key or kahani>", "slug": "...", "hook": "..." }`.

5. Report the path. Never post anywhere automatically.
