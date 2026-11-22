import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { GRAHA_COLOR, GRAHA_HI, RASHI_HI, font, polar, sectorPath } from "./common";

export type WheelGraha = { graha: string; lon: number; retro?: boolean; hi?: string };

/** Rāśi chakra with the 27-nakṣatra ring; grahas fly in to their real longitudes. */
export const ZodiacWheel: React.FC<{
  grahas?: WheelGraha[];
  highlightRashi?: number; // 1-12
  highlightArc?: [number, number]; // degrees
  nakEdges?: number[]; // optional custom edges (28 values); default equal 13°20'
  cx?: number; cy?: number; r?: number; delay?: number; spin?: boolean;
}> = ({ grahas = [], highlightRashi, highlightArc, nakEdges, cx = 540, cy = 900, r = 420, delay = 0, spin = true }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const draw = interpolate(f, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rot = spin ? interpolate(f, [0, 600], [8, 0], { extrapolateRight: "clamp" }) : 0;
  const edges = nakEdges ?? Array.from({ length: 28 }, (_, i) => (i * 360) / 27);
  const glow = 0.55 + 0.35 * Math.sin(f / 9);
  // keep close grahas apart: walk in longitude order and step inward when the previous one is within 14°
  const lane: Record<string, number> = {};
  const sorted = [...grahas].sort((a, b) => a.lon - b.lon);
  sorted.forEach((g, k) => {
    const prev = sorted[k - 1];
    const near = prev && Math.abs(g.lon - prev.lon) < 24;
    lane[g.graha] = near ? (lane[prev.graha] + 1) % 3 : 0;
  });
  if (sorted.length > 1) { // wrap-around neighbour (e.g. 355° and 3°)
    const a = sorted[0], z = sorted[sorted.length - 1];
    if (a.lon + 360 - z.lon < 24 && lane[a.graha] === lane[z.graha]) lane[a.graha] = (lane[z.graha] + 1) % 3;
  }
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`} opacity={draw}>
      <circle cx={cx} cy={cy} r={r + 26} fill={theme.gold} opacity={0.06} />
      {Array.from({ length: 12 }).map((_, i) => {
        const hi = highlightRashi === i + 1;
        const mid = polar(cx, cy, r * 0.86, i * 30 + 15);
        return (
          <g key={i}>
            <path d={sectorPath(cx, cy, r * 0.72, r, i * 30, i * 30 + 30)}
              fill={hi ? theme.gold : i % 2 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.10)"}
              opacity={hi ? glow : 1} stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
            <text x={mid.x} y={mid.y + 14} textAnchor="middle" fontFamily={font} fontWeight={800}
              fontSize={38} fill={hi ? theme.ink : theme.cream}>{RASHI_HI[i]}</text>
          </g>
        );
      })}
      {edges.slice(0, 27).map((a, i) => {
        const p0 = polar(cx, cy, r * 0.62, a), p1 = polar(cx, cy, r * 0.72, a);
        return <line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={theme.cream} strokeWidth={2} opacity={0.5} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
      {highlightArc ? (
        <path d={sectorPath(cx, cy, r * 0.62, r * 0.72, highlightArc[0], highlightArc[1])} fill={theme.saffron} opacity={glow} />
      ) : null}
      {grahas.map((g, i) => {
        const s = spring({ frame: f - 20 - i * 6, fps, config: { damping: 13 } });
        const lon = interpolate(s, [0, 1], [g.lon - 90, g.lon]);
        const ring = r * (0.52 - lane[g.graha] * 0.13);
        const p = polar(cx, cy, ring, lon);
        const c = GRAHA_COLOR[g.graha] ?? theme.gold;
        return (
          <g key={g.graha} opacity={s}>
            <circle cx={p.x} cy={p.y} r={30} fill={c} opacity={0.25} />
            <circle cx={p.x} cy={p.y} r={17} fill={c} />
            <text x={p.x + (lane[g.graha] === 1 ? 30 : 0)} y={p.y + (lane[g.graha] === 0 ? -30 : lane[g.graha] === 1 ? 10 : 52)}
              textAnchor={lane[g.graha] === 1 ? "start" : "middle"} fontFamily={font} fontWeight={700} fontSize={28} fill={theme.white}
              stroke={theme.ink} strokeWidth={6} paintOrder="stroke">
              {(g.hi ?? GRAHA_HI[g.graha]) + (g.retro && g.graha !== "Rahu" && g.graha !== "Ketu" ? " ℞" : "")}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={10} fill={theme.gold} />
    </g>
  );
};
