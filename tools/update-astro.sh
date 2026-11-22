#!/bin/bash
# Pull the latest Astro / Nirayana into the folder kahani-reels uses, then smoke-test the bridge.
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
DIR=$(python3 - "$PROJECT" <<'PY'
import json, os, sys
d = os.path.join(sys.argv[1], "tools/astro")
c = json.load(open(os.path.join(d, "config.json")))
if os.path.exists(os.path.join(d, "config.local.json")): c.update(json.load(open(os.path.join(d, "config.local.json"))))
print(os.path.expanduser(c["astroDir"]))
PY
)
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only || { echo "Local changes in $DIR — resolve them, then re-run."; exit 1; }
else
  echo "Cloning Astro into $DIR"; git clone --depth 1 https://github.com/aseemm84/Astro "$DIR"
fi
echo "Astro is at: $(git -C "$DIR" log -1 --format='%h  %cd  %s' --date=short)"
cd "$PROJECT" && node tools/astro/bridge.mjs data nakshatra 4 --out /tmp/astro-check.json >/dev/null && echo "✓ bridge works with this version"
