import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { font } from "./common";

/** The Moon lit by its real illumination (0..1); waxing when elongation < 180°. */
export const MoonPhase: React.FC<{ illumination: number; elongation: number; label?: string; sub?: string; cx?: number; cy?: number; r?: number; delay?: number }> = ({
  illumination, elongation, label, sub, cx = 540, cy = 860, r = 260, delay = 0,
}) => {
  const f = useCurrentFrame() - delay;
  const k = interpolate(f, [0, 30], [0, illumination], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const waxing = elongation < 180;
  const rx = Math.abs(1 - 2 * k) * r; // terminator ellipse
  const litRight = waxing;
  const d = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${litRight ? 1 : 0} ${cx} ${cy + r} A ${rx} ${r} 0 0 ${(k > 0.5) === litRight ? 1 : 0} ${cx} ${cy - r} Z`;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 1.5} fill={theme.cream} opacity={0.06 + 0.04 * Math.sin(f / 10)} />
      <circle cx={cx} cy={cy} r={r} fill="#1b2556" />
      <path d={d} fill={theme.cream} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.25} r={r * 0.12} fill="#000" opacity={0.06} />
      <circle cx={cx + r * 0.25} cy={cy + r * 0.3} r={r * 0.09} fill="#000" opacity={0.06} />
      {label ? <text x={cx} y={cy + r + 110} textAnchor="middle" fontFamily={font} fontWeight={900} fontSize={76} fill={theme.gold}>{label}</text> : null}
      {sub ? <text x={cx} y={cy + r + 170} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={40} fill={theme.cream}>{sub}</text> : null}
    </g>
  );
};
