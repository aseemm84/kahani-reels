import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { GRAHA_COLOR, GRAHA_HI, font } from "./common";

/** The apparent retrograde loop: a graha drifts forward, loops backward, then resumes. */
export const RetroLoop: React.FC<{ graha: string; y?: number; delay?: number; retroLabel?: string; directLabel?: string }> = ({
  graha, y = 880, delay = 0, retroLabel = "वक्री", directLabel = "मार्गी",
}) => {
  const f = useCurrentFrame() - delay;
  const path = `M 100 ${y + 120} C 330 ${y + 40}, 520 ${y - 30}, 640 ${y - 40} C 760 ${y - 50}, 720 ${y + 120}, 560 ${y + 60} C 470 ${y + 25}, 600 ${y - 120}, 760 ${y - 110} C 860 ${y - 100}, 940 ${y - 150}, 1000 ${y - 200}`;
  const t = interpolate(f, [10, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const L = 1600; // approx path length
  const c = GRAHA_COLOR[graha] ?? theme.gold;
  const pos = (k: number) => {
    // sample the path in the DOM-free way: precomputed with a cubic chain
    const segs = [
      [[100, y + 120], [330, y + 40], [520, y - 30], [640, y - 40]],
      [[640, y - 40], [760, y - 50], [720, y + 120], [560, y + 60]],
      [[560, y + 60], [470, y + 25], [600, y - 120], [760, y - 110]],
      [[760, y - 110], [860, y - 100], [940, y - 150], [1000, y - 200]],
    ];
    const s = Math.min(3, Math.floor(k * 4)), u = k * 4 - s, [a, b, cc, d] = segs[s];
    const B = (i: number) => (1 - u) ** 3 * a[i] + 3 * (1 - u) ** 2 * u * b[i] + 3 * (1 - u) * u * u * cc[i] + u ** 3 * d[i];
    return { x: B(0), y: B(1) };
  };
  const p = pos(t);
  const inRetro = t > 0.27 && t < 0.62;
  return (
    <g>
      <path d={path} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={10} strokeLinecap="round" />
      <path d={path} fill="none" stroke={theme.gold} strokeWidth={10} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - t)} />
      <circle cx={p.x} cy={p.y} r={inRetro ? 46 : 36} fill={c} opacity={0.3} />
      <circle cx={p.x} cy={p.y} r={26} fill={c} />
      <text x={p.x} y={p.y - 50} textAnchor="middle" fontFamily={font} fontWeight={800} fontSize={40} fill={theme.white}>{GRAHA_HI[graha]}</text>
      <text x={640} y={y + 230} textAnchor="middle" fontFamily={font} fontWeight={900} fontSize={70}
        fill={inRetro ? theme.saffron : theme.leaf}>{t < 0.27 ? "→" : inRetro ? `← ${retroLabel}` : `${directLabel} →`}</text>
    </g>
  );
};
