#!/usr/bin/env python3
"""Generate one voice clip per scene and record their durations.

Usage (from the project root):
    python3 .claude/skills/kahani-reel/scripts/make_voice.py <slug> [--provider sarvam|gemini|elevenlabs|edge]
            [--gender female|male] [--voice <id>] [--mood calm|devotional|warm|dramatic|energetic|children]
            [--rate +0%] [--only N] [--fallback edge]

Reads   src/stories/<slug>/script.json   -> [{"narration": "...", "caption": "..."}, ...]
Writes  public/<slug>/s1.mp3, s2.mp3 ...
        src/stories/<slug>/voice.json    -> {"provider", "voice", "durations": [...]}

Providers and voices: tools/voices.json. API keys go in .env at the project root (never committed):
    SARVAM_API_KEY=...    GEMINI_API_KEY=...    ELEVENLABS_API_KEY=...
Defaults: reel-defaults.json ("voice_provider", "voice", "voice_mood"). Old style "--voice hi-IN-SwaraNeural" still works
(edge voices are detected automatically).
Set KAHANI_FAKE_TTS=1 to write silent placeholder clips (testing without internet).
"""
import argparse, asyncio, base64, json, os, subprocess, sys, tempfile, urllib.error, urllib.request
from pathlib import Path

ROOT = Path.cwd()

def load_env():
    f = ROOT / ".env"
    if f.exists():
        for line in f.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

def jload(p, default=None):
    try:
        return json.loads(Path(p).read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default

def duration(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout.strip()
    return round(float(out), 3)

def to_mp3(raw: bytes, suffix: str, out: Path):
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as t:
        t.write(raw); src = t.name
    # trim leading/trailing silence a little, normalise speech loudness
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af",
                    "silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_threshold=-45dB:stop_duration=0.4,loudnorm=I=-16:TP=-1.5",
                    "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "192k", str(out)], check=True)
    os.unlink(src)

def post(url, body, headers):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **headers})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read(), r.headers.get("Content-Type", "")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{url.split('/')[2]} HTTP {e.code}: {e.read().decode(errors='replace')[:400]}")

def need(key):
    v = os.environ.get(key)
    if not v:
        raise RuntimeError(f"{key} is not set. Add it to .env in the project root (see .env.example), or use --provider edge.")
    return v

# ---------------- providers ----------------
def tts_sarvam(text, voice, cfg, mood, out):
    body = {"text": text, "language_code": "hi-IN", "model": cfg.get("model", "bulbul:v4-flash"), "speaker": voice,
            "pace": mood.get("sarvam_pace", 1.0), "speech_sample_rate": 44100, "output_audio_codec": "wav"}
    url = os.environ.get("KAHANI_SARVAM_URL", "https://api.sarvam.ai/text-to-speech")
    raw, _ = post(url, body, {"api-subscription-key": need("SARVAM_API_KEY")})
    audios = json.loads(raw).get("audios") or []
    if not audios: raise RuntimeError("Sarvam returned no audio")
    to_mp3(b"".join(base64.b64decode(a) for a in audios[:1]), ".wav", out)

def tts_gemini(text, voice, cfg, mood, out):
    body = {"model": cfg.get("model", "gemini-3.8-flash-tts"),
            "input": [{"type": "user_input", "content": [{"type": "text", "text": text,
                       "annotations": [{"type": "speech_metadata", "style": mood.get("style", "")}]}]}],
            "response_format": {"type": "audio"},
            "generation_config": {"speech_config": [{"voice": voice}]}}
    url = os.environ.get("KAHANI_GEMINI_URL", "https://generativelanguage.googleapis.com/v1beta/interactions")
    raw, _ = post(url, body, {"x-goog-api-key": need("GEMINI_API_KEY")})
    data = json.loads(raw)
    audio = [c for s in data.get("steps", []) if s.get("type") == "model_output" for c in s.get("content", []) if c.get("type") == "audio"]
    if not audio: raise RuntimeError("Gemini returned no audio: " + json.dumps(data)[:300])
    to_mp3(base64.b64decode(audio[-1]["data"]), ".wav", out)

def tts_elevenlabs(text, voice, cfg, mood, out):
    if voice.startswith("env:"): voice = need(voice[4:])
    url = os.environ.get("KAHANI_ELEVEN_URL", "https://api.elevenlabs.io/v1/text-to-speech") + f"/{voice}?output_format=mp3_44100_128"
    raw, _ = post(url, {"text": text, "model_id": cfg.get("model", "eleven_v3"), "language_code": "hi"},
                  {"xi-api-key": need("ELEVENLABS_API_KEY"), "Accept": "audio/mpeg"})
    to_mp3(raw, ".mp3", out)

def tts_edge(text, voice, cfg, mood, out, rate):
    import edge_tts  # pip install edge-tts
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as t: tmp = t.name
    asyncio.run(edge_tts.Communicate(text, voice, rate=rate).save(tmp))
    to_mp3(Path(tmp).read_bytes(), ".mp3", out); os.unlink(tmp)

def tts_fake(text, out):
    secs = max(1.5, len(text.split()) * 0.42)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", f"{secs}", str(out)], check=True)

# ---------------- main ----------------
def main():
    load_env()
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--provider", choices=["sarvam", "gemini", "elevenlabs", "edge"])
    ap.add_argument("--gender", choices=["female", "male"])
    ap.add_argument("--voice", help="voice id for the provider (e.g. simran_hi_narration, Sulafat, hi-IN-SwaraNeural)")
    ap.add_argument("--mood", default=None)
    ap.add_argument("--rate", default=None, help="edge only, e.g. +5%%")
    ap.add_argument("--pitch", default=None, help="ignored (kept for compatibility)")
    ap.add_argument("--only", type=int, help="regenerate just this scene number (1-based)")
    ap.add_argument("--fallback", choices=["edge", "none"], default="none", help="use edge-tts for a line if the provider fails")
    a = ap.parse_args()

    cat = jload(ROOT / "tools/voices.json", {})
    dflt = jload(ROOT / "reel-defaults.json", {})
    if a.voice and a.voice.startswith("hi-IN-") and a.voice.endswith("Neural"):
        a.provider = a.provider or "edge"
    provider = a.provider or dflt.get("voice_provider", "edge")
    gender = a.gender or dflt.get("voice", "female")
    cfg = cat.get(provider, {})
    voice = a.voice or dflt.get(f"{provider}_{gender}") or cfg.get(gender)   # e.g. "sarvam_female": "roopa_hi_narration"
    mood_name = a.mood or dflt.get("voice_mood", "warm")
    mood = cat.get("moods", {}).get(mood_name, {})
    rate = a.rate or dflt.get("voice_rate") or mood.get("rate", "+0%")
    if not voice: sys.exit(f"✗ no {gender} voice configured for {provider} in tools/voices.json")

    story = ROOT / "src/stories" / a.slug
    script = jload(story / "script.json")
    if script is None: sys.exit(f"✗ {story}/script.json not found")
    out_dir = ROOT / "public" / a.slug; out_dir.mkdir(parents=True, exist_ok=True)
    vfile = story / "voice.json"
    old = jload(vfile, {}) or {}
    durs = (list(old.get("durations", [])) + [0.0] * len(script))[: len(script)]
    print(f"voice: {provider} · {voice} · mood {mood_name}")

    for i, scene in enumerate(script, 1):
        if a.only and i != a.only: continue
        text = scene["narration"].strip()
        mp3 = out_dir / f"s{i}.mp3"
        print(f"[{i}/{len(script)}] {text[:60]}")
        try:
            if os.environ.get("KAHANI_FAKE_TTS"): tts_fake(text, mp3)
            elif provider == "sarvam": tts_sarvam(text, voice, cfg, mood, mp3)
            elif provider == "gemini": tts_gemini(text, voice, cfg, mood, mp3)
            elif provider == "elevenlabs": tts_elevenlabs(text, voice, cfg, mood, mp3)
            else: tts_edge(text, voice, cfg, mood, mp3, rate)
        except Exception as e:
            if a.fallback == "edge" and provider != "edge":
                print(f"   ⚠ {provider} failed ({e}); using edge-tts for this line")
                tts_edge(text, cat["edge"][gender], {}, mood, mp3, rate)
            else:
                sys.exit(f"✗ scene {i}: {e}")
        durs[i - 1] = duration(mp3)

    vfile.write_text(json.dumps({"provider": provider, "voice": voice, "mood": mood_name, "durations": durs}, indent=2))
    print(f"Done. Total voice: {sum(durs):.1f}s -> {vfile}")

if __name__ == "__main__":
    main()
