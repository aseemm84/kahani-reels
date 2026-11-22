import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../kahani/theme";

/* Reusable storyboard scenery. All draw in a 1080×1920 viewBox and are deterministic. */
const rnd = (i: number) => { const x = Math.sin(i * 7919.3) * 10000; return x - Math.floor(x); };

export const Sea: React.FC<{ y?: number; color?: string }> = ({ y = 1420, color = "#1f4fb0" }) => {
  const f = useCurrentFrame();
  return (
    <g>
      <rect x={0} y={y} width={1080} height={1920 - y} fill={color} />
      {Array.from({ length: 5 }).map((_, r) => (
        <path key={r} d={Array.from({ length: 13 }).map((_, i) => `${i === 0 ? "M" : "Q"} ${i * 90 - 40 + ((f * (1 + r * 0.3)) % 90)} ${y + 30 + r * 55 + (i % 2 ? -14 : 0)}${i === 0 ? "" : ` ${i * 90 + ((f * (1 + r * 0.3)) % 90)} ${y + 30 + r * 55}`}`).join(" ")}
          stroke="#9fc4ff" strokeWidth={5} fill="none" opacity={0.5 - r * 0.07} />
      ))}
    </g>
  );
};

export const HerbMountain: React.FC<{ x?: number; y?: number; s?: number; glow?: number }> = ({ x = 540, y = 1300, s = 1, glow = 1 }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={-150} rx={420} ry={260} fill={theme.leaf} opacity={0.12 * glow} />
      <path d="M -380 0 L -120 -420 L 0 -300 L 140 -470 L 400 0 Z" fill="#2c6e57" />
      <path d="M -120 -420 L -60 -330 L -150 -340 Z M 140 -470 L 200 -370 L 90 -390 Z" fill="#eaf4ff" />
      {Array.from({ length: 26 }).map((_, i) => {
        const px = (rnd(i) - 0.5) * 560, py = -40 - rnd(i + 50) * 300;
        const tw = 0.5 + 0.5 * Math.sin(f / 7 + i);
        return <circle key={i} cx={px} cy={py} r={6 + 6 * tw} fill="#b6ff9e" opacity={0.5 + 0.5 * tw * glow} />;
      })}
    </g>
  );
};

export const Battlefield: React.FC<{ y?: number }> = ({ y = 1300 }) => {
  const f = useCurrentFrame();
  return (
    <g>
      <rect x={0} y={y} width={1080} height={1920 - y} fill="#3a2a1e" />
      {Array.from({ length: 6 }).map((_, i) => {
        const tx = 60 + i * 190, ty = y - 10;
        return (
          <g key={i}>
            <path d={`M ${tx} ${ty} l 60 -110 l 60 110 z`} fill="#5b3a2a" opacity={0.9} />
            <rect x={tx + 58} y={ty - 160} width={4} height={60} fill="#2a1a10" />
            <path d={`M ${tx + 62} ${ty - 160} l 40 12 l -40 12 z`} fill={i % 2 ? theme.saffron : "#c0392b"} />
          </g>
        );
      })}
      {[150, 930].map((tx, i) => (
        <g key={tx}>
          <rect x={tx - 5} y={y - 170} width={10} height={170} fill="#5a3b20" />
          <ellipse cx={tx} cy={y - 190 + Math.sin(f / 4 + i) * 4} rx={20} ry={36} fill="#ffb02e" />
          <ellipse cx={tx} cy={y - 184} rx={10} ry={20} fill="#fff1a6" />
          <circle cx={tx} cy={y - 190} r={90} fill="#ffb02e" opacity={0.12} />
        </g>
      ))}
    </g>
  );
};

export const Lotus: React.FC<{ x?: number; y?: number; s?: number }> = ({ x = 540, y = 1400, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-60, -30, 0, 30, 60].map((r, i) => (
      <ellipse key={i} cx={0} cy={-70} rx={34} ry={80} fill={i === 2 ? "#ffd1e3" : "#ff9fc4"} transform={`rotate(${r} 0 0)`} />
    ))}
    <ellipse cx={0} cy={0} rx={150} ry={26} fill="#2e8b57" />
  </g>
);

export const Ground: React.FC<{ y?: number; color?: string }> = ({ y = 1270, color = "#2a3f7a" }) => (
  <path d={`M 0 ${y} Q 540 ${y - 40} 1080 ${y} V 1920 H 0 Z`} fill={color} />
);

/** A glowing light ray / divine burst behind a moment. */
export const Burst: React.FC<{ x?: number; y?: number; r?: number; color?: string }> = ({ x = 540, y = 800, r = 520, color = theme.gold }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(${x} ${y}) rotate(${f * 0.4})`}>
      <circle r={r * 0.5} fill={color} opacity={0.18} />
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={i} d={`M 0 0 L ${r * Math.cos((i * Math.PI) / 8 - 0.06)} ${r * Math.sin((i * Math.PI) / 8 - 0.06)} L ${r * Math.cos((i * Math.PI) / 8 + 0.06)} ${r * Math.sin((i * Math.PI) / 8 + 0.06)} Z`} fill={color} opacity={0.12} />
      ))}
    </g>
  );
};
