import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Cloud, Moon, Mountains, Tree } from "../../kahani/Props";
import { theme } from "../../kahani/theme";
import { Story } from "../../kahani/types";
import script from "./script.json";
import voice from "./voice.json";

// Demo story – replace or copy this folder for new stories.

const Firefly: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const x = 200 + ((i * 137) % 700) + Math.sin(f / 15 + i) * 40;
  const y = 900 + ((i * 89) % 400) + Math.cos(f / 19 + i) * 30;
  return <circle cx={x} cy={y} r={7} fill={theme.gold} opacity={0.5 + 0.5 * Math.sin(f / 6 + i)} />;
};

const Scene1: React.FC<{ durationInFrames: number }> = () => (
  <svg width="100%" height="100%" viewBox="0 0 1080 1920">
    <Moon />
    <Cloud x={120} y={620} s={1.1} />
    <Mountains y={1350} />
  </svg>
);

const Scene2: React.FC<{ durationInFrames: number }> = () => {
  const f = useCurrentFrame();
  return (
    <svg width="100%" height="100%" viewBox="0 0 1080 1920">
      <Moon x={300} y={500} r={110} />
      <g transform={`translate(${interpolate(f, [0, 150], [0, -80])} 0)`}>
        <Mountains y={1400} />
      </g>
      <Tree x={200} y={1500} s={1.3} />
      <Tree x={880} y={1520} s={1.1} />
      {Array.from({ length: 12 }).map((_, i) => (
        <Firefly key={i} i={i} />
      ))}
    </svg>
  );
};

const Scene3: React.FC<{ durationInFrames: number }> = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 5, fps, config: { damping: 10 } });
  return (
    <svg width="100%" height="100%" viewBox="0 0 1080 1920">
      <g transform={`translate(540 900) scale(${pop})`}>
        <circle r={260} fill={theme.gold} opacity={0.18} />
        <ellipse cx={0} cy={-40} rx={60} ry={110} fill={theme.cream} />
        <path d="M-180 40 Q0 220 180 40Z" fill={theme.saffron} />
      </g>
      <Cloud x={-150} y={1250} s={1.4} drift={1.2} />
    </svg>
  );
};

export const demoStory: Story = {
  slug: "demo",
  id: "DemoReel",
  title: "Ek *diya* ki kahani",
  kicker: "KAHANI REELS · DEMO",
  voice,
  // narration + caption come from script.json; visuals are matched by order
  scenes: [Scene1, Scene2, Scene3].map((Visual, i) => ({ ...script[i], seconds: 3, Visual })),
};
