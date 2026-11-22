import { theme } from "../theme";

export const RASHI_HI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुम्भ","मीन"];
export const GRAHA_COLOR: Record<string, string> = {
  Sun: "#ffb321", Moon: "#f3f1e6", Mars: "#ff5a3c", Mercury: "#4fd18b", Jupiter: "#ffd36b",
  Venus: "#f7d7ff", Saturn: "#7fa2ff", Rahu: "#8d7bd6", Ketu: "#c98b5a",
};
export const GRAHA_HI: Record<string, string> = {
  Sun: "सूर्य", Moon: "चन्द्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "बृहस्पति", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु",
};
/** Ecliptic longitude → point. 0° Meṣa sits at 9 o'clock and longitudes run anticlockwise (as the sky turns). */
export const polar = (cx: number, cy: number, r: number, lon: number) => {
  const a = Math.PI - (lon * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
};
export const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 0 ${p1.x} ${p1.y}`;
};
export const sectorPath = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) => {
  const A = polar(cx, cy, r1, a0), B = polar(cx, cy, r1, a1), C = polar(cx, cy, r0, a1), D = polar(cx, cy, r0, a0);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${A.x} ${A.y} A ${r1} ${r1} 0 ${large} 0 ${B.x} ${B.y} L ${C.x} ${C.y} A ${r0} ${r0} 0 ${large} 1 ${D.x} ${D.y} Z`;
};
export const deva = (n: number | string) => String(n); // keep Arabic digits – voice and verify read them reliably
export const font = theme.font;
