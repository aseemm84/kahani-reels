import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../kahani/theme";

export type Palette = "night" | "dawn" | "day" | "sunset" | "dusk" | "cosmic";

const SKIES: Record<Palette, { top: string; bottom: string; stars: number; sun?: string }> = {
  night: { top: theme.skyTop, bottom: theme.skyBottom, stars: 1 },
  dawn: { top: "#2b2a6b", bottom: "#f4a46b", stars: 0.35, sun: "#ffd27a" },
  day: { top: "#3d9be9", bottom: "#bfe6ff", stars: 0, sun: "#fff3b0" },
  sunset: { top: "#3a1c5c", bottom: "#ff7a3d", stars: 0.15, sun: "#ffb347" },
  dusk: { top: "#141a4a", bottom: "#8a4f9e", stars: 0.6 },
  cosmic: { top: "#05040f", bottom: "#24124a", stars: 1.4 },
};

const rand = (i: number) => { const x = Math.sin(i * 9301.17) * 43758.5453; return x - Math.floor(x); };

/** Per-scene sky: gradient, stars (scaled by palette), optional low sun, optional diya row. */
export const Sky: React.FC<{ palette?: Palette; diyas?: boolean }> = ({ palette = "night", diyas = true }) => {
  const frame = useCurrentFrame();
  const s = SKIES[palette] ?? SKIES.night;
  const n = Math.round(70 * s.stars);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${s.top} 0%, ${s.bottom} 100%)` }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920">
        {Array.from({ length: n }).map((_, i) => (
          <circle key={i} cx={rand(i) * 1080} cy={rand(i + 100) * 1300} r={1 + rand(i + 200) * 2.4} fill="#fff"
            opacity={(0.35 + 0.65 * Math.abs(Math.sin(frame / 25 + i))) * 0.8} />
        ))}
        {s.sun ? (
          <g>
            <circle cx={820} cy={1250} r={260} fill={s.sun} opacity={0.18} />
            <circle cx={820} cy={1250} r={120} fill={s.sun} />
          </g>
        ) : null}
        <path d="M0 1720 Q270 1640 540 1700 T1080 1680 V1920 H0Z" fill={theme.ink} opacity={palette === "day" ? 0.25 : 0.55} />
        {diyas
          ? Array.from({ length: 7 }).map((_, i) => {
              const x = 80 + i * 153, y = 1800 + (i % 2) * 30 + Math.sin(frame / 18 + i) * 6;
              const g = 0.55 + 0.45 * Math.abs(Math.sin(frame / 12 + i * 1.7));
              return (
                <g key={i} transform={`translate(${x} ${y})`}>
                  <circle r={46} fill={theme.gold} opacity={0.18 * g} />
                  <ellipse cx={0} cy={-6} rx={7} ry={13} fill={theme.cream} opacity={g} />
                  <path d="M-22 4 Q0 26 22 4Z" fill={theme.saffron} />
                </g>
              );
            })
          : null}
      </svg>
    </AbsoluteFill>
  );
};
