import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Cloud, Moon, Mountains } from "../../kahani/Props";
import { Battlefield, Burst, Ground, HerbMountain, Lotus, Sea } from "../../storyboard/Scenery";
import type { Focus } from "../../storyboard/Camera";
import type { SBStory } from "../../storyboard/StoryboardReel";
import { Char, POS } from "./characters";
import sb from "./storyboard.json";
import script from "./script.json";
import voice from "./voice.json";

type V = React.FC<{ durationInFrames: number }>;
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width="100%" height="100%" viewBox="0 0 1080 1920">{children}</svg>
);

// 1 · hook — Lakṣmaṇa lies unconscious on the night battlefield
const S1: V = () => (
  <Svg><Moon x={800} y={480} r={110} /><Battlefield y={1300} />
    <Char id="lakshmana" pose="sleeping" x={540} y={1330} scale={0.62} glow={1} /></Svg>
);
// 2 · setup — Rāma kneels beside him
const S2: V = () => (
  <Svg><Battlefield y={1300} />
    <Char id="rama" pose="sitting" x={POS.left + 40} y={1320} scale={0.7} />
    <Char id="lakshmana" pose="sleeping" x={POS.right - 20} y={1330} scale={0.55} /></Svg>
);
// 3 · rising — Suṣeṇa points north; the herb appears as a vision
const S3: V = () => {
  const f = useCurrentFrame();
  const v = interpolate(f, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Svg><Ground y={1290} />
      <g opacity={v}><HerbMountain x={720} y={760} s={0.55} /></g>
      <Char id="sushena" pose="pointing" x={POS.left + 60} y={1320} scale={0.75} /></Svg>
  );
};
// 4 · rising — Hanumān leaps into the sky over the sea
const S4: V = ({ durationInFrames: d }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, d], [0, 1], { extrapolateRight: "clamp" });
  return (
    <Svg><Sea y={1430} /><Cloud x={-80} y={560} s={1.1} drift={2} /><Cloud x={600} y={900} s={0.8} drift={3} />
      <Char id="hanuman" pose="flying" x={interpolate(t, [0, 1], [160, 900])} y={interpolate(t, [0, 1], [1300, 760])} scale={0.62} /></Svg>
  );
};
// 5 · conflict — the whole mountain glows; which herb?
const S5: V = () => (
  <Svg><Moon x={260} y={460} r={90} /><Mountains y={1330} /><HerbMountain x={520} y={1330} s={1.05} />
    <Char id="hanuman" pose="standing" x={POS.right + 40} y={1340} scale={0.55} /></Svg>
);
// 6 · climax — Hanumān flies with the mountain on his palm
const S6: V = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const up = spring({ frame: f, fps, config: { damping: 14 } });
  return (
    <Svg><Burst x={540} y={820} r={620} /><Cloud x={-200} y={1200} s={1.4} drift={4} /><Cloud x={700} y={1350} s={1.1} drift={3} />
      <Char id="hanuman" pose="carrying" x={540} y={1250 - 120 * up} scale={0.7}
        holding={<g transform="rotate(180)"><HerbMountain x={0} y={40} s={0.38} /></g>} /></Svg>
  );
};
// 7 · resolution — dawn: Lakṣmaṇa sits up, Rāma blesses, Hanumān bows
const S7: V = () => (
  <Svg><Ground y={1290} color="#5b4a7a" />
    <Char id="lakshmana" pose="sitting" x={POS.left - 60} y={1320} scale={0.5} glow={1} />
    <Char id="rama" pose="blessing" x={POS.center} y={1310} scale={0.56} />
    <Char id="hanuman" pose="bowing" x={POS.right + 70} y={1320} scale={0.5} flip /></Svg>
);
// 8 · meaning — Hanumān in prayer, golden aura
const S8: V = () => (
  <Svg><Burst x={540} y={760} r={560} /><Lotus x={540} y={1330} s={1.6} />
    <Char id="hanuman" pose="praying" x={540} y={1300} scale={0.72} glow={1} /></Svg>
);
// 9 · cta — diyas and the title
const S9: V = () => <Svg><Moon x={540} y={760} r={150} /></Svg>;

const VISUALS: V[] = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

// camera focus: a character id → the point where that character stands in the scene
const focusOf = (focus: string, sceneIdx: number): Focus => {
  const c = (sb.scenes[sceneIdx].visual.characters as { id: string; position: string }[]).find((x) => x.id === focus);
  if (!c) return (["center", "top", "bottom", "left", "right"].includes(focus) ? focus : "center") as Focus;
  return { x: (POS[c.position] ?? 540) / 1080, y: c.position === "sky" ? 0.38 : 0.55 };
};

export const hanumanSanjeevaniStory: SBStory = {
  slug: "hanuman-sanjeevani",
  id: "HanumanSanjeevaniReel",
  title: sb.title,
  kicker: sb.kicker,
  voice,
  diyas: sb.diyas,
  music: sb.music === "tanpura" ? "music/tanpura.mp3" : undefined,
  musicVolume: 0.12,
  handle: "",
  scenes: sb.scenes.map((s, i) => ({
    narration: script[i].narration,
    caption: script[i].caption,
    seconds: s.seconds,
    Visual: VISUALS[i],
    camera: { ...(s.camera as object), focus: focusOf(s.camera.focus, i) } as SBStory["scenes"][number]["camera"],
    transition: s.transition_in as SBStory["scenes"][number]["transition"],
    palette: s.visual.palette as SBStory["scenes"][number]["palette"],
  })),
};
