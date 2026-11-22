import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { GRAHA_COLOR, GRAHA_HI, font } from "./common";

/** Stacked info rows (e.g. the five limbs of the pañcāṅga) that slide in one by one. */
export const InfoCards: React.FC<{ title?: string; rows: { label: string; value: string }[]; y?: number; delay?: number; highlight?: number }> = ({
  title, rows, y = 520, delay = 0, highlight,
}) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  return (
    <g>
      {title ? <text x={540} y={y - 40} textAnchor="middle" fontFamily={font} fontWeight={900} fontSize={64} fill={theme.gold}>{title}</text> : null}
      {rows.map((r, i) => {
        const s = spring({ frame: f - 6 - i * 7, fps, config: { damping: 14 } });
        const yy = y + i * 150, on = highlight === i;
        return (
          <g key={i} opacity={s} transform={`translate(${(1 - s) * 200} 0)`}>
            <rect x={110} y={yy} width={860} height={124} rx={26} fill={on ? theme.gold : "rgba(8,14,40,0.82)"} stroke="rgba(255,255,255,0.15)" strokeWidth={2} />
            <text x={150} y={yy + 78} fontFamily={font} fontWeight={600} fontSize={38} fill={on ? theme.ink : theme.cream}>{r.label}</text>
            <text x={930} y={yy + 80} textAnchor="end" fontFamily={font} fontWeight={900} fontSize={48} fill={on ? theme.ink : theme.white}>{r.value}</text>
          </g>
        );
      })}
    </g>
  );
};

/** Vertical timeline of dated events. */
export const Timeline: React.FC<{ items: { date: string; text: string; graha?: string }[]; y?: number; delay?: number }> = ({ items, y = 480, delay = 0 }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const h = interpolate(f, [0, 20 + items.length * 10], [0, items.length * 170], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <g>
      <line x1={190} y1={y} x2={190} y2={y + h} stroke={theme.gold} strokeWidth={6} strokeLinecap="round" />
      {items.map((it, i) => {
        const s = spring({ frame: f - 8 - i * 10, fps, config: { damping: 13 } });
        const yy = y + 40 + i * 190, c = it.graha ? GRAHA_COLOR[it.graha] : theme.gold;
        return (
          <g key={i} opacity={s} transform={`translate(${(1 - s) * 120} 0)`}>
            <circle cx={190} cy={yy} r={24} fill={c} stroke={theme.ink} strokeWidth={6} />
            <text x={250} y={yy - 10} fontFamily={font} fontWeight={800} fontSize={46} fill={theme.gold}>{it.date}</text>
            <text x={250} y={yy + 44} fontFamily={font} fontWeight={600} fontSize={46} fill={theme.white}>{it.text}</text>
          </g>
        );
      })}
    </g>
  );
};

/** A big number that counts up, with a label (e.g. 19 वर्ष, 13°20′). */
export const BigStat: React.FC<{ value: number; decimals?: number; suffix?: string; label: string; y?: number; delay?: number }> = ({
  value, decimals = 0, suffix = "", label, y = 860, delay = 0,
}) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 18, mass: 1.2 } });
  const v = (value * s).toFixed(decimals);
  return (
    <g>
      <circle cx={540} cy={y - 40} r={300} fill={theme.gold} opacity={0.08 * s} />
      <text x={540} y={y} textAnchor="middle" fontFamily={font} fontWeight={900} fontSize={230} fill={theme.gold}>{v}<tspan fontSize={110}>{suffix}</tspan></text>
      <text x={540} y={y + 110} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={50} fill={theme.cream}
        opacity={interpolate(f, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>{label}</text>
    </g>
  );
};

/** A stylised graha with optional vakrī badge. */
export const GrahaOrb: React.FC<{ graha: string; cx?: number; cy?: number; r?: number; retro?: boolean; label?: string; delay?: number }> = ({
  graha, cx = 540, cy = 860, r = 210, retro, label, delay = 0,
}) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 12 } });
  const c = GRAHA_COLOR[graha] ?? theme.gold;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <circle r={r * 1.6} fill={c} opacity={0.12 + 0.05 * Math.sin(f / 8)} />
      <circle r={r} fill={c} />
      <ellipse cx={-r * 0.3} cy={-r * 0.35} rx={r * 0.35} ry={r * 0.2} fill="#fff" opacity={0.25} />
      {graha === "Saturn" ? <ellipse rx={r * 1.7} ry={r * 0.38} fill="none" stroke="#c9d6ff" strokeWidth={22} opacity={0.8} transform="rotate(-18)" /> : null}
      {graha === "Sun" ? Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={-8} y={-r * 1.45} width={16} height={r * 0.3} rx={8} fill={c} transform={`rotate(${i * 30 + f})`} />
      )) : null}
      <text y={r + 110} textAnchor="middle" fontFamily={font} fontWeight={900} fontSize={84} fill={theme.white}>{label ?? GRAHA_HI[graha]}</text>
      {retro ? (
        <g transform={`translate(${r * 0.75} ${-r * 0.8})`}>
          <rect x={-90} y={-46} width={180} height={80} rx={40} fill={theme.saffron} />
          <text y={12} textAnchor="middle" fontFamily={font} fontWeight={900} fontSize={42} fill={theme.white}>वक्री</text>
        </g>
      ) : null}
    </g>
  );
};
