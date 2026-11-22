#!/bin/bash
# Runs the astro-daily skill headlessly with Claude Code. Called by launchd every morning.
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
PROJECT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT" || exit 1
DATE=$(date +%F)
mkdir -p logs
bash tools/update-astro.sh > "logs/astro-update-$(date +%F).log" 2>&1 || true
claude -p "Use the astro-daily skill for $DATE. Work fully autonomously." \
  --permission-mode acceptEdits \
  --allowedTools "Bash,Read,Write,Edit,Glob,Grep" > "logs/daily-$DATE.log" 2>&1
if [ -f "out/daily/$DATE/reel.mp4" ]; then
  osascript -e "display notification \"Today's reel is ready: out/daily/$DATE\" with title \"Kahani Reels\" sound name \"Glass\""
else
  osascript -e "display notification \"Daily reel failed — see logs/daily-$DATE.log\" with title \"Kahani Reels\""
fi
