import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "./theme";

const rand = (i: number) => {
  const x = Math.sin(i * 9301.17) * 43758.5453;
  return x - Math.floor(x);
};

/** Starry night gradient + a row of glowing diyas along the bottom. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${theme.skyTop} 0%, ${theme.skyBottom} 100%)`,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 1080 1920">
        {Array.from({ length: 70 }).map((_, i) => {
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame / 25 + i));
          return (
            <circle
              key={i}
              cx={rand(i) * 1080}
              cy={rand(i + 100) * 1300}
              r={1 + rand(i + 200) * 2.4}
              fill="#fff"
              opacity={tw * 0.8}
            />
          );
        })}
        {/* soft hills */}
        <path d="M0 1720 Q270 1640 540 1700 T1080 1680 V1920 H0Z" fill={theme.ink} opacity={0.55} />
        {/* diyas */}
        {Array.from({ length: 7 }).map((_, i) => {
          const x = 80 + i * 153;
          const y = 1800 + (i % 2) * 30 + Math.sin(frame / 18 + i) * 6;
          const glow = 0.55 + 0.45 * Math.abs(Math.sin(frame / 12 + i * 1.7));
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle r={46} fill={theme.gold} opacity={0.18 * glow} />
              <circle r={24} fill={theme.gold} opacity={0.35 * glow} />
              <ellipse cx={0} cy={-6} rx={7} ry={13} fill={theme.cream} opacity={glow} />
              <path d="M-22 4 Q0 26 22 4Z" fill={theme.saffron} />
            </g>
          );
        })}
      </svg>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(5,10,35,0.55) 100%)",
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
