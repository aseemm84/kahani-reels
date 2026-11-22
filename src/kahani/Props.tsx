import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "./theme";

/* Reusable SVG scenery. All draw inside a 1080x1920 viewBox. */

export const Moon: React.FC<{ x?: number; y?: number; r?: number }> = ({ x = 760, y = 520, r = 150 }) => {
  const frame = useCurrentFrame();
  const g = 0.25 + 0.08 * Math.sin(frame / 20);
  return (
    <g>
      <circle cx={x} cy={y} r={r * 1.7} fill={theme.cream} opacity={g * 0.5} />
      <circle cx={x} cy={y} r={r} fill={theme.cream} />
      <circle cx={x - r * 0.3} cy={y - r * 0.2} r={r * 0.16} fill="#f1e2bd" />
      <circle cx={x + r * 0.35} cy={y + r * 0.3} r={r * 0.11} fill="#f1e2bd" />
    </g>
  );
};

export const Mountains: React.FC<{ y?: number; color?: string; dark?: string; offset?: number }> = ({
  y = 1300,
  color = theme.mountain,
  dark = theme.mountainDark,
  offset = 0,
}) => (
  <g transform={`translate(${offset} 0)`}>
    <path d={`M-100 ${y + 300} L180 ${y - 120} L420 ${y + 300}Z`} fill={dark} />
    <path d={`M250 ${y + 300} L560 ${y - 260} L880 ${y + 300}Z`} fill={color} />
    <path d={`M700 ${y + 300} L980 ${y - 90} L1250 ${y + 300}Z`} fill={dark} />
    <path d={`M560 ${y - 260} L500 ${y - 150} L540 ${y - 170} L580 ${y - 140} L620 ${y - 180}Z`} fill={theme.cloud} />
  </g>
);

export const Cloud: React.FC<{ x: number; y: number; s?: number; drift?: number }> = ({ x, y, s = 1, drift = 0.6 }) => {
  const frame = useCurrentFrame();
  return (
    <g transform={`translate(${x + frame * drift} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={110} ry={46} fill={theme.cloud} />
      <circle cx={-40} cy={-30} r={48} fill={theme.cloud} />
      <circle cx={35} cy={-42} r={60} fill={theme.cloud} />
    </g>
  );
};

/** Simple stylised tree. */
export const Tree: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame / 22 + x) * 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${sway})`}>
      <rect x={-10} y={-10} width={20} height={90} rx={6} fill="#6b3f1f" />
      <path d="M0 -170 L-80 0 H80Z" fill={theme.leafDark} />
      <path d="M0 -230 L-60 -80 H60Z" fill={theme.leaf} />
    </g>
  );
};
