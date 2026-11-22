#!/bin/bash
# Kahani Reels — one-time setup, run from inside the cloned repository.
#   git clone https://github.com/aseemm84/kahani-reels ~/kahani-reels && cd ~/kahani-reels && bash setup.sh
# Options (environment variables):
#   ASTRO_DIR=/path/to/Astro   use an existing Astro (Nirayana) checkout instead of ~/Astro
#   PLACE="Abu Dhabi, AE"      default city for dates/times (any city in Nirayana's list)
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"
say()  { printf "\n\033[1;33m▶ %s\033[0m\n" "$1"; }
fail() { printf "\n\033[1;31m✗ %s\033[0m\n" "$1"; exit 1; }
IS_MAC=0; [ "$(uname)" = "Darwin" ] && IS_MAC=1

say "Checking tools"
node_ok() { local v; v=$(node -v 2>/dev/null | sed 's/v//'); [ -n "$v" ] || return 1
  local M=${v%%.*} m=$(echo "$v" | cut -d. -f2); [ "$M" -gt 22 ] || { [ "$M" -eq 22 ] && [ "$m" -ge 13 ]; }; }
if ! node_ok; then
  if [ $IS_MAC = 1 ] && command -v brew >/dev/null; then say "Installing Node (found: $(node -v 2>/dev/null || echo none))"; brew install node; hash -r
  else fail "Node 22.13+ needed (found: $(node -v 2>/dev/null || echo none)). Mac: brew install node"; fi
fi
node_ok || fail "Still on Node $(node -v) at $(which node). Another Node (often Anaconda) comes first in PATH — 'conda deactivate' or 'conda remove nodejs', then re-run."
if ! command -v ffmpeg >/dev/null; then
  if [ $IS_MAC = 1 ] && command -v brew >/dev/null; then brew install ffmpeg; else fail "ffmpeg missing (Mac: brew install ffmpeg)"; fi
fi
command -v python3 >/dev/null || fail "python3 missing"
command -v git >/dev/null || fail "git missing"
echo "node $(node -v) · $(ffmpeg -version | head -1 | cut -d' ' -f1-3) · $(python3 --version)"

say "Installing project packages"
npm ci --no-audit --no-fund || npm install --no-audit --no-fund

say "Installing Python helpers (edge-tts voice fallback, numpy for music)"
python3 -m pip install --quiet --upgrade edge-tts numpy || python3 -m pip install --quiet --user --break-system-packages edge-tts numpy
[ -f .env ] || { cp .env.example .env; echo "Created .env — add your SARVAM_API_KEY / GEMINI_API_KEY for natural Hindi voices."; }

say "Getting the Astro (Nirayana) engine"
ASTRO_DIR="${ASTRO_DIR:-$HOME/Astro}"
if [ -d "$ASTRO_DIR/.git" ]; then git -C "$ASTRO_DIR" pull --ff-only || echo "(could not fast-forward $ASTRO_DIR — leaving it as is)"
elif [ ! -f "$ASTRO_DIR/reel.html" ]; then git clone --depth 1 https://github.com/aseemm84/Astro "$ASTRO_DIR"; fi
python3 - "$ASTRO_DIR" "${PLACE:-}" <<'PY'
import json, os, sys
p = "tools/astro/config.local.json"
c = json.load(open(p)) if os.path.exists(p) else {}
c["astroDir"] = sys.argv[1]
if sys.argv[2]: c["place"] = sys.argv[2]
json.dump(c, open(p, "w"), indent=2)
PY

say "Installing the headless browser used by the Nirayana bridge"
npx playwright install chromium

say "Installing Remotion's agent skills (Claude Code + Antigravity)"
npx -y remotion skills add || echo "(skipped — run 'npx remotion skills add' later)"
mkdir -p .agents/skills
for sk in kahani-reel astro-reel astro-daily nirayana-story storyboard-reel; do rm -rf ".agents/skills/$sk"; cp -R ".claude/skills/$sk" .agents/skills/; done
chmod +x tools/*.sh tools/astro/*.sh

say "Generating royalty-free Indian background music (9 styles)"
for st in tanpura bansuri santoor temple tabla ambient suspense festive lullaby; do
  [ -f "public/music/$st.mp3" ] || python3 tools/make_music.py --style "$st"
done

say "Test 1/2: Nirayana bridge"
node tools/astro/bridge.mjs data nakshatra 4 --out out/check-nakshatra.json >/dev/null && echo "✓ Astro bridge OK ($(git -C "$ASTRO_DIR" log -1 --format=%h 2>/dev/null))"
say "Test 2/2: voice + render of the demo reel"
python3 .claude/skills/kahani-reel/scripts/make_voice.py demo --fallback edge || python3 .claude/skills/kahani-reel/scripts/make_voice.py demo --provider edge || echo "(voice test failed — check internet)"
npx remotion render DemoReel out/demo.mp4

printf "\n\033[1;32m✓ All set!\033[0m  Demo: %s/out/demo.mp4\n" "$ROOT"
cat <<MSG
Open this folder in the Claude desktop app (Code tab) or Antigravity and ask, e.g.:
  शनि मार्गी पर अपनी कहानी वाली रील बनाओ                (Nirayana data · own layout · own story)
  Make an astro reel about Rohini nakshatra             (Nirayana Reel Studio template)
  हनुमान जी और संजीवनी की कहानी, cartoon reel             (cartoon kahani)
  <paste a Gemini storyboard>                           (storyboard → reel)
  Make today's daily reel                               (Studio → reel)
Every reel first asks: length · voice (Sarvam / Gemini / free) · music (9 styles) · captions · language · mood · handle.
Natural voices: put SARVAM_API_KEY and/or GEMINI_API_KEY in .env, then audition:  python3 tools/voice_samples.py
From your iPhone:  claude --remote-control   (then open the session in the Claude app → Code)
Daily reel at 06:30:  bash tools/install-daily.sh
MSG
[ $IS_MAC = 1 ] && open out/demo.mp4 2>/dev/null || true
