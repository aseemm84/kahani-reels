#!/usr/bin/env python3
"""Generate one voice clip per scene and record their durations.

Usage (from the Remotion project root):
    python3 .claude/skills/kahani-reel/scripts/make_voice.py <slug> [--voice hi-IN-MadhurNeural] [--rate +0%]

Reads   src/stories/<slug>/script.json   -> [{"narration": "...", "caption": "..."}, ...]
Writes  public/<slug>/s1.mp3, s2.mp3 ...
        src/stories/<slug>/voice.json    -> {"voice": "...", "durations": [3.2, 4.1, ...]}

Voices: hi-IN-MadhurNeural (male), hi-IN-SwaraNeural (female),
        en-IN-PrabhatNeural / en-IN-NeerjaNeural (Indian English).
Set KAHANI_FAKE_TTS=1 to write silent placeholder clips (for testing without internet).
"""
import argparse, asyncio, json, os, subprocess, sys
from pathlib import Path


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return round(float(out), 3)


async def tts(text: str, voice: str, rate: str, pitch: str, path: Path) -> None:
    if os.environ.get("KAHANI_FAKE_TTS"):
        secs = max(1.5, len(text.split()) * 0.42)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
                        "-t", f"{secs}", str(path)], check=True)
        return
    import edge_tts  # pip install edge-tts
    await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(str(path))


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--voice", default="hi-IN-MadhurNeural")
    ap.add_argument("--rate", default="+0%")
    ap.add_argument("--pitch", default="+0Hz")
    ap.add_argument("--only", type=int, help="regenerate just this scene number (1-based)")
    a = ap.parse_args()

    story_dir = Path("src/stories") / a.slug
    script = json.loads((story_dir / "script.json").read_text(encoding="utf-8"))
    out_dir = Path("public") / a.slug
    out_dir.mkdir(parents=True, exist_ok=True)

    vfile = story_dir / "voice.json"
    old = json.loads(vfile.read_text()) if vfile.exists() else {}
    durs = list(old.get("durations", []))
    durs += [0.0] * (len(script) - len(durs))
    durs = durs[: len(script)]

    for i, scene in enumerate(script, start=1):
        if a.only and i != a.only:
            continue
        mp3 = out_dir / f"s{i}.mp3"
        print(f"[{i}/{len(script)}] {scene['narration'][:60]}")
        await tts(scene["narration"], a.voice, a.rate, a.pitch, mp3)
        durs[i - 1] = duration(mp3)

    vfile.write_text(json.dumps({"voice": a.voice, "durations": durs}, indent=2))
    print(f"Done. Total voice: {sum(durs):.1f}s -> {vfile}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except FileNotFoundError as e:
        sys.exit(f"Missing file or tool: {e}")
