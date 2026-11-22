#!/bin/bash
# Schedules the daily reel at 06:30 every morning (runs on wake if the Mac was asleep).
# Usage: bash tools/install-daily.sh [HH] [MM]        Remove: bash install-daily.sh --remove
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.kahanireels.daily.plist"
if [ "$1" = "--remove" ]; then launchctl unload "$PLIST" 2>/dev/null; rm -f "$PLIST"; echo "Daily reel removed."; exit 0; fi
H="${1:-6}"; M="${2:-30}"
command -v claude >/dev/null || { echo "Claude Code CLI not found. Run: npm install -g @anthropic-ai/claude-code  then 'claude' once to log in."; exit 1; }
chmod +x "$PROJECT/tools/astro/daily.sh"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<P
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.kahanireels.daily</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$PROJECT/tools/astro/daily.sh</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>$H</integer><key>Minute</key><integer>$M</integer></dict>
  <key>StandardErrorPath</key><string>$PROJECT/logs/launchd.err</string>
</dict></plist>
P
launchctl unload "$PLIST" 2>/dev/null; launchctl load "$PLIST"
printf "✓ Daily reel scheduled at %02d:%02d. Test it now with:  bash %s/tools/astro/daily.sh\n" "$H" "$M" "$PROJECT"
