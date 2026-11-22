#!/usr/bin/env python3
"""Check a storyboard (from the Gemini "Kahani Storyboard Director" Gem, or written by hand).

    python3 .claude/skills/storyboard-reel/scripts/validate_storyboard.py <file> [--save src/stories/<slug>/storyboard.json]

<file> may be the raw JSON, or Gemini's whole reply pasted into a .md/.txt file: the first ```json block
(or the first {...} object) is extracted. Exit 1 on errors; warnings don't fail.
"""
import json, re, sys
from pathlib import Path

CAMERA_MOVES = {"static", "push-in", "pull-out", "pan-left", "pan-right", "tilt-up", "tilt-down", "orbit", "shake", "focus"}
SHOTS = {"wide", "medium", "close-up", "extreme-close-up", "low-angle", "birds-eye", "over-the-shoulder"}
FOCUS = {"center", "top", "bottom", "left", "right"}
INTENSITY = {"subtle", "medium", "strong"}
TRANSITIONS = {"cut", "crossfade", "fade-black", "slide-left", "slide-right", "zoom-in", "wipe-down", "flash"}
PALETTES = {"night", "dawn", "day", "sunset", "dusk", "cosmic"}
BEATS = {"hook", "setup", "conflict", "rising", "turn", "climax", "resolution", "meaning", "cta"}
ELEMENTS = {"moon", "sun", "stars", "mountains", "clouds", "trees", "forest", "river", "sea", "waves", "palace", "temple",
            "village", "hut", "garden", "lotus", "fire", "diyas", "rain", "lightning", "sky-chariot", "herb-mountain",
            "cave", "desert", "battlefield", "ashram", "planets", "zodiac", "comet", "eclipse", "none"}
LAYOUTS = {"ZodiacWheel", "NakshatraArc", "MoonPhase", "InfoCards", "Timeline", "BigStat", "GrahaOrb", "RetroLoop", "none"}
TOPICS = {"itihasa", "purana", "mythology", "festival", "saint", "temple-legend", "folk-tale", "moral", "devotional",
          "history", "tradition-explainer", "jyotisha-legend", "jyotisha-data"}
SOURCED = {"itihasa", "purana", "mythology", "festival", "saint", "temple-legend", "history", "jyotisha-legend", "devotional"}
WPS = {"hi": 2.2, "hinglish": 2.5, "en": 2.6}

def extract(text: str):
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    if m:
        return json.loads(m.group(1))
    i, j = text.find("{"), text.rfind("}")
    if i < 0 or j < 0:
        raise ValueError("no JSON object found")
    return json.loads(text[i:j + 1])

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1]).read_text(encoding="utf-8")
    try:
        sb = extract(src)
    except Exception as e:
        sys.exit(f"✗ could not read JSON: {e}")
    err, warn = [], []
    E, W = err.append, warn.append

    if sb.get("kahani_storyboard") != 1: E("top-level \"kahani_storyboard\": 1 missing")
    for k in ("title", "topic_type", "language", "target_seconds", "scenes"):
        if k not in sb: E(f"missing \"{k}\"")
    if sb.get("topic_type") and sb["topic_type"] not in TOPICS: E(f"topic_type must be one of {sorted(TOPICS)}")
    lang = sb.get("language", "hi")
    if lang not in WPS: E("language must be hi | hinglish | en")
    target = sb.get("target_seconds", 0)
    chars = {c.get("id") for c in sb.get("characters", [])}
    for c in sb.get("characters", []):
        for k in ("id", "name", "look"):
            if not c.get(k): E(f"character {c.get('id', '?')}: missing \"{k}\"")
    data_keys = {d.get("key") for d in sb.get("data_needed", [])}
    if sb.get("topic_type") in SOURCED and not sb.get("sources"):
        E("no \"sources\" — this topic type needs at least one named source (text, kāṇḍa/parva/skandha, or tradition)")
    for src_ in sb.get("sources", []):
        if not src_.get("text"): E("each source needs \"text\" (e.g. \"Vālmīki Rāmāyaṇa, Yuddha Kāṇḍa\")")

    scenes = sb.get("scenes", [])
    total, words_total = 0.0, 0
    for i, s in enumerate(scenes, 1):
        tag = f"scene {i}"
        for k in ("narration", "caption", "seconds", "camera", "transition_in", "visual"):
            if k not in s: E(f"{tag}: missing \"{k}\"")
        sec = float(s.get("seconds", 0)); total += sec
        if not 2.5 <= sec <= 12: W(f"{tag}: {sec}s is unusual (aim 3–9 s)")
        words = len(re.sub(r"\{\{[^}]+\}\}", "X", s.get("narration", "")).split()); words_total += words
        budget = sec * WPS.get(lang, 2.2)
        if words > budget * 1.25: E(f"{tag}: {words} words won't fit {sec}s (≈{budget:.0f} max) — shorten or lengthen")
        cap = s.get("caption", "")
        if len(cap.replace("*", "").split()) > 5: E(f"{tag}: caption longer than 5 words")
        if cap and cap.count("*") not in (0, 2): E(f"{tag}: caption must highlight exactly one word with *stars*")
        cam = s.get("camera", {})
        if cam.get("move") not in CAMERA_MOVES: E(f"{tag}: camera.move must be one of {sorted(CAMERA_MOVES)}")
        if cam.get("shot", "wide") not in SHOTS: E(f"{tag}: camera.shot must be one of {sorted(SHOTS)}")
        fo = cam.get("focus", "center")
        if not (fo in FOCUS or fo in chars or (isinstance(fo, dict) and {"x", "y"} <= set(fo))):
            E(f"{tag}: camera.focus must be {sorted(FOCUS)}, a character id, or {{x,y}} 0–1")
        if cam.get("intensity", "medium") not in INTENSITY: E(f"{tag}: camera.intensity must be subtle|medium|strong")
        if s.get("transition_in") not in TRANSITIONS: E(f"{tag}: transition_in must be one of {sorted(TRANSITIONS)}")
        if i > 1 and s.get("transition_in") == scenes[i - 2].get("transition_in") == "flash": W(f"{tag}: two flashes in a row")
        v = s.get("visual", {})
        if v.get("palette", "night") not in PALETTES: E(f"{tag}: visual.palette must be one of {sorted(PALETTES)}")
        for el in v.get("elements", []):
            if el not in ELEMENTS: W(f"{tag}: element \"{el}\" is not in the standard set — Claude will draw it custom")
        if v.get("layout", "none") not in LAYOUTS: E(f"{tag}: visual.layout must be one of {sorted(LAYOUTS)}")
        for a in v.get("characters", []):
            if a.get("id") not in chars: E(f"{tag}: character \"{a.get('id')}\" not defined in characters[]")
        if s.get("beat") and s["beat"] not in BEATS: W(f"{tag}: beat \"{s['beat']}\" not standard")
        for key in re.findall(r"\{\{([^}]+)\}\}", s.get("narration", "") + " " + cap):
            if key.strip() not in data_keys: E(f"{tag}: placeholder {{{{{key}}}}} has no entry in data_needed")
    if scenes and scenes[0].get("beat") not in (None, "hook"): W("scene 1 should be the hook")
    if target and abs(total - target) > target * 0.15: E(f"scenes add up to {total:.0f}s but target_seconds is {target}")
    if sb.get("topic_type") == "jyotisha-data" and re.search(r"\d", json.dumps([s.get("narration") for s in scenes], ensure_ascii=False)):
        W("jyotisha-data narration contains digits — computed numbers should be {{placeholders}} filled from Nirayana")

    print(f"storyboard: \"{sb.get('title')}\" · {len(scenes)} scenes · {total:.0f}s · {words_total} words · {len(chars)} characters")
    for w in warn: print("  ⚠ " + w)
    for e in err: print("  ✗ " + e)
    if "--save" in sys.argv and not err:
        out = Path(sys.argv[sys.argv.index("--save") + 1]); out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(sb, ensure_ascii=False, indent=2), encoding="utf-8"); print("saved " + str(out))
    sys.exit(1 if err else 0)

if __name__ == "__main__":
    main()
