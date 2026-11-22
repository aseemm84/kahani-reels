# Kahani Reels

You ask in one line and get back a finished 9:16 reel with pure Hindi narration, built from verified Jyotiṣa
data. The reels are made by an AI agent (Claude Code or Google Antigravity), drawn with
[Remotion](https://remotion.dev), and draw their facts from the
[Nirayana / Astro](https://github.com/aseemm84/Astro) engine.

| Reel type | What it is | Ask, for example |
|---|---|---|
| **Nirayana story** | Data from the Nirayana engine, with layouts and a story designed fresh for each reel | शनि मार्गी पर अपनी कहानी वाली रील बनाओ |
| **Astro reel** | Nirayana's own Reel Studio animation (126 templates), narrated as a Hindi story and synced to the voice | Make an astro reel about Rohini nakshatra |
| **Kahani** | A cartoon story or legend, with Jyotiṣa facts taken from Nirayana where relevant | चन्द्रमा और रोहिणी की कहानी, cartoon reel |
| **Daily** | Nirayana's Studio picks today's best topic, and the agent makes the reel | Make today's daily reel |
| **Storyboard** | A scene-by-scene storyboard written by your Gemini Gem, on any story from Indian Hindu culture, built faithfully: camera, shots, transitions, characters | *(paste the Gem's reply)* |

Every reel first asks for a short **brief**: length (30/45/60/90 s), female or male voice, music (none,
tanpura, or your own file) and captions. It then asks about language, voice speed, your handle, and whether
to save these as defaults. Daily runs use the saved defaults in `reel-defaults.json` and don't ask.

---

## Setup (once, on a Mac)

```bash
brew install node ffmpeg                  # Node 22.13+ (check: node -v)
git clone https://github.com/aseemm84/kahani-reels ~/kahani-reels
cd ~/kahani-reels
bash setup.sh                             # ≈5 min: packages, voice, Nirayana, browser, skills, music, demo
```

Options:
- `ASTRO_DIR=~/path/to/Astro bash setup.sh` uses an Astro checkout you already have. By default, setup
  clones it to `~/Astro`.
- `PLACE="Abu Dhabi, AE" bash setup.sh` sets the default city for dates and times. Without it, setup uses
  Delhi, IN.

Your own settings go in `tools/astro/config.local.json`, which git ignores.

**Coming from the kit (zip) version?** Rename the old folder, clone this repository, and run setup. If you
made any stories in the old folder, copy them across:

```bash
mv ~/kahani-reels ~/kahani-reels-old
git clone https://github.com/aseemm84/kahani-reels ~/kahani-reels && cd ~/kahani-reels && bash setup.sh
cp -R ~/kahani-reels-old/src/stories/<your-story> src/stories/    # then add it to src/stories/registry.ts
```

## Make a reel

- **Claude desktop app:** open the Code tab, choose this folder, and type your request.
- **Antigravity:** File → Open Folder, then type your request in the Agent panel.
- **Terminal:** run `claude` in this folder.

Finished videos are saved in `out/`. For a live preview while a reel is being built, run `npm run dev`.

### From your iPhone

The Mac does the work, and your phone controls it.

```bash
cd ~/kahani-reels
caffeinate -dims & claude --remote-control
```

On the iPhone, open the **Claude app → Code**, tap the session (it has a computer icon), and type your
request. Keep the Mac plugged in with the lid open.

To get the videos onto your phone, link `out/` to iCloud Drive. Each video then appears in
Files → iCloud Drive → Kahani Reels:

```bash
mkdir -p ~/Library/Mobile\ Documents/com~apple~CloudDocs/Kahani\ Reels
rm -rf out && ln -s ~/Library/Mobile\ Documents/com~apple~CloudDocs/Kahani\ Reels out
```

### Every morning, automatically

```bash
npm install -g @anthropic-ai/claude-code && claude    # log in once
bash tools/install-daily.sh                           # 06:30 every day; pass HH MM to change it
bash tools/astro/daily.sh                             # run it now, as a test
```

Each daily run first updates Astro, then makes the reel. It saves `reel.mp4` and `caption.txt` to
`out/daily/<date>/`. Nothing is ever posted automatically. To stop it, run
`bash tools/install-daily.sh --remove`.

---

## Gemini storyboards → reels

Gemini writes the story and Claude builds the reel.

1. **Create the Gem (once).** In Gemini, go to **Gems → New Gem**, name it *Kahani Storyboard Director*, and
   paste the instructions from [`gemini/GEM-INSTRUCTIONS.md`](gemini/GEM-INSTRUCTIONS.md). You can also add
   [`gemini/storyboard-example.json`](gemini/storyboard-example.json) as a knowledge file.
2. **Ask it for a story**, for example: *"गणेश जी और चन्द्रमा की कथा, 45 सेकंड"* or *"Why is Diwali
   celebrated? 60 s"*. It replies with a Hindi summary, a JSON storyboard and an authenticity note. The
   storyboard covers sources, characters, and each scene's narration, caption, setting, palette, camera
   move/shot/focus and transition.
3. **Paste the whole reply into Claude** (Code tab, or Remote Control from your iPhone). The `storyboard-reel`
   skill then:
   - validates the storyboard
   - asks only what the storyboard leaves open
   - flags authenticity doubts instead of silently changing the story
   - fills Jyotiṣa `{{placeholders}}` from Nirayana
   - builds each character once with the pose-able `Figure`
   - renders the reel

Check a storyboard yourself with
`python3 .claude/skills/storyboard-reel/scripts/validate_storyboard.py storyboards/<file>.md`.
The included example, `HanumanSanjeevaniReel`, was built from `gemini/storyboard-example.json`.

## How it works

```
your request ─▶ reel brief ─▶ skill ─▶ Nirayana bridge (facts / data / frames)
                                   ─▶ Hindi script (numbers checked against the data)
                                   ─▶ edge-tts voice ─▶ Remotion scenes ─▶ out/<slug>.mp4
```

| Path | What |
|---|---|
| `.claude/skills/` (mirrored to `.agents/skills/`) | `nirayana-story`, `astro-reel`, `kahani-reel`, `astro-daily` |
| `.claude/skills/kahani-reel/references/reel-brief.md` | the questions asked before every reel, and how the answers are applied |
| `src/kahani/` | the reel engine: background with stars and diyas, captions, title, camera, crossfades, handle, `AstroReel` |
| `src/kahani/astro/` | data-driven layouts: `ZodiacWheel`, `NakshatraArc`, `MoonPhase`, `InfoCards`, `Timeline`, `BigStat`, `GrahaOrb`, `RetroLoop` |
| `src/storyboard/` | storyboard engine: `StoryboardReel`, camera (10 moves × 7 shots), 8 transitions, 6 sky palettes, the pose-able `Figure` (14 poses), and scenery (sea, herb mountain, battlefield, lotus, burst) |
| `gemini/` | instructions for the Gemini Gem, plus an example storyboard |
| `src/stories/` | one folder per reel, all listed in `registry.ts` (the `demo`, `shani-margi` and `hanuman-sanjeevani` examples are included) |
| `tools/astro/bridge.mjs` | the bridge that drives the Nirayana pages headlessly |
| `tools/make_music.py` | generates a royalty-free tanpura drone |
| `tools/update-astro.sh` | `git pull` of Astro, plus a bridge check |
| `reel-defaults.json` | your default answers to the brief |

### Bridge commands

```bash
node tools/astro/bridge.mjs list                                   # the 126 Reel Studio templates
node tools/astro/bridge.mjs facts learn.nakshatra.4 --lang hi      # a template's facts and timed beats
node tools/astro/bridge.mjs today [--date 2026-11-24]              # Studio's ideas for the day
node tools/astro/bridge.mjs render <slug>                          # engine frames synced to the voice
node tools/astro/bridge.mjs data sky --date 2026-12-11 --time 06:00 --place "Abu Dhabi"
node tools/astro/bridge.mjs data events --days 30
node tools/astro/bridge.mjs data nakshatra rohini | rashi 2 | graha shani
```

### Honesty rules the skills enforce

- Every number, date, degree and name in a script must come from the engine's output.
  `verify_numbers.py` checks this and blocks the reel otherwise.
- Deity, gaṇa, yoni and nāḍī are presented as later tradition, the same way Nirayana labels them.
- Reels never make predictions.

## Voices, music and licences

- **Voices:** Microsoft Edge neural voices through edge-tts, which is free: `hi-IN-SwaraNeural` (female)
  and `hi-IN-MadhurNeural` (male).
- **Music:** the tanpura drone is generated on your machine, so there's no copyright issue. You can also
  put your own `.mp3` files in `public/music/`.
- **Remotion:** free for individuals and teams of up to 3 people. See
  [remotion.dev/license](https://remotion.dev/license).
