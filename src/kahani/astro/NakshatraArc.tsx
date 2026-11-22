import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { font } from "./common";

/** One nakṣatra drawn large as a curved band: its degree span, four pādas and its yogatārā. */
export const NakshatraArc: React.FC<{
  name: string; start: number; end: number;
  padas?: { pada: number; navamsha?: { hi: string } }[];
  star?: { name: string; lon: number };
  y?: number; delay?: number; activePada?: number;
}> = ({ name, start, end, padas = [], star, y = 950, delay = 0, activePada }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 14 } });
  const L = 120, R = 960, W = R - L, top = y - 150;
  const xAt = (lon: number) => L + ((lon - start) / (end - start)) * W;
  const fmt = (d: number) => { const deg = Math.floor(d + 1e-6), min = Math.round((d - deg) * 60); return min ? `${deg}°${min}′` : `${deg}°`; };
  return (
    <g opacity={s} transform={`translate(0 ${(1 - s) * 60})`}>
      <path d={`M ${L} ${top + 60} Q 540 ${top - 40} ${R} ${top + 60} L ${R} ${top + 230} Q 540 ${top + 130} ${L} ${top + 230} Z`}
        fill="rgba(255,200,61,0.16)" stroke={theme.gold} strokeWidth={3} />
      {padas.map((p, i) => {
        const x0 = L + (i * W) / 4, x1 = L + ((i + 1) * W) / 4, on = activePada === p.pada;
        const appear = interpolate(f, [12 + i * 8, 22 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <g key={i} opacity={appear}>
            {i > 0 ? <line x1={x0} y1={top + 20} x2={x0} y2={top + 200} stroke={theme.cream} strokeDasharray="8 8" opacity={0.6} /> : null}
            {on ? <rect x={x0 + 6} y={top + 40} width={x1 - x0 - 12} height={150} rx={18} fill={theme.saffron} opacity={0.35} /> : null}
            <text x={(x0 + x1) / 2} y={top + 120} textAnchor="middle" fontFamily={font} fontWeight={800} fontSize={40} fill={theme.white}>पाद {p.pada}</text>
            {p.navamsha ? <text x={(x0 + x1) / 2} y={top + 168} textAnchor="middle" fontFamily={font} fontSize={30} fill={theme.gold}>{p.navamsha.hi}</text> : null}
          </g>
        );
      })}
      <text x={540} y={top - 70} textAnchor="middle" fontFamily={font} fontWeight={900} fontSize={96} fill={theme.gold}>{name}</text>
      <text x={L} y={top + 290} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={36} fill={theme.cream}>{fmt(start)}</text>
      <text x={R} y={top + 290} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={36} fill={theme.cream}>{fmt(end)}</text>
      {star ? (
        <g opacity={interpolate(f, [45, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          <circle cx={xAt(star.lon)} cy={top + 30} r={22 + 6 * Math.sin(f / 6)} fill={theme.white} opacity={0.35} />
          <path d={`M ${xAt(star.lon)} ${top + 4} l 8 18 20 4 -15 14 4 20 -17 -10 -17 10 4 -20 -15 -14 20 -4 z`} fill={theme.white} />
          <text x={xAt(star.lon)} y={top - 14} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={32} fill={theme.white}>{star.name}</text>
        </g>
      ) : null}
    </g>
  );
};
