#!/usr/bin/env python3
"""Audition voices: speaks one Hindi line with every voice you have a key for.

    python3 tools/voice_samples.py                  # all configured providers, default + alternative voices
    python3 tools/voice_samples.py --provider sarvam --text "एक समय की बात है…"
Output: out/voice-samples/<provider>-<voice>.mp3  (open them in Finder / Files on iPhone via iCloud)
Pick one, then set it in reel-defaults.json: "voice_provider": "sarvam", "sarvam_female": "roopa_hi_narration", "sarvam_male": "anand_hi_documentary"
"""
import argparse, json, os, subprocess, sys
from pathlib import Path

LINE = "बहुत समय पहले, हिमालय की गोद में एक छोटा सा गाँव था। वहाँ हर शाम दीप जलते थे, और कहानियाँ सुनाई जाती थीं।"

ap = argparse.ArgumentParser()
ap.add_argument("--provider", choices=["sarvam", "gemini", "elevenlabs", "edge"])
ap.add_argument("--text", default=LINE)
a = ap.parse_args()

cat = json.loads(Path("tools/voices.json").read_text())
env = {}
if Path(".env").exists():
    for l in Path(".env").read_text().splitlines():
        if "=" in l and not l.strip().startswith("#"):
            k, v = l.split("=", 1); env[k.strip()] = v.strip()
keys = {"sarvam": "SARVAM_API_KEY", "gemini": "GEMINI_API_KEY", "elevenlabs": "ELEVENLABS_API_KEY", "edge": None}
out = Path("out/voice-samples"); out.mkdir(parents=True, exist_ok=True)
tmp = Path("src/stories/_voice_sample"); tmp.mkdir(parents=True, exist_ok=True)
(tmp / "script.json").write_text(json.dumps([{"narration": a.text, "caption": ""}], ensure_ascii=False))

for prov in ([a.provider] if a.provider else ["sarvam", "gemini", "elevenlabs", "edge"]):
    k = keys[prov]
    if k and not (env.get(k) or os.environ.get(k)):
        print(f"– {prov}: no {k} in .env, skipped"); continue
    c = cat[prov]; voices = [c.get("female"), c.get("male")]
    for group in c.get("more", {}).values(): voices += group
    for v in [x for x in voices if x and not x.startswith("env:")] or [c.get("female"), c.get("male")]:
        r = subprocess.run([sys.executable, ".claude/skills/kahani-reel/scripts/make_voice.py", "_voice_sample", "--provider", prov, "--voice", v],
                           capture_output=True, text=True)
        if r.returncode == 0:
            (Path("public/_voice_sample/s1.mp3")).replace(out / f"{prov}-{v}.mp3"); print(f"✓ {prov}-{v}.mp3")
        else:
            print(f"✗ {prov} {v}: {(r.stdout + r.stderr).strip().splitlines()[-1]}")
subprocess.run(["rm", "-rf", str(tmp), "public/_voice_sample"])
print(f"\nListen in {out}/ and put your favourites in reel-defaults.json.")
