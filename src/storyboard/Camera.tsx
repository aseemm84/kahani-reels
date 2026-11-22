import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export type CameraMove =
  | "static" | "push-in" | "pull-out" | "pan-left" | "pan-right" | "tilt-up" | "tilt-down"
  | "orbit" | "shake" | "focus";
export type Shot = "wide" | "medium" | "close-up" | "extreme-close-up" | "low-angle" | "birds-eye" | "over-the-shoulder";
export type Focus = "center" | "top" | "bottom" | "left" | "right" | { x: number; y: number };
export type CameraSpec = { move?: CameraMove; shot?: Shot; focus?: Focus; intensity?: "subtle" | "medium" | "strong" };

const SHOT_SCALE: Record<Shot, number> = {
  wide: 1, medium: 1.22, "close-up": 1.55, "extreme-close-up": 2.1, "low-angle": 1.15, "birds-eye": 1.1, "over-the-shoulder": 1.3,
};
const FOCUS: Record<string, { x: number; y: number }> = {
  center: { x: 0.5, y: 0.47 }, top: { x: 0.5, y: 0.3 }, bottom: { x: 0.5, y: 0.65 }, left: { x: 0.3, y: 0.47 }, right: { x: 0.7, y: 0.47 },
};
const AMOUNT = { subtle: 0.5, medium: 1, strong: 1.8 };

/** Storyboard camera: `shot` sets the framing around `focus`, `move` animates it across the scene. */
export const SBCamera: React.FC<{ durationInFrames: number; children: React.ReactNode; spec?: CameraSpec }> = ({
  durationInFrames: d, children, spec = {},
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, d], [0, 1], { extrapolateRight: "clamp" });
  const ease = t * t * (3 - 2 * t);
  const k = AMOUNT[spec.intensity ?? "medium"];
  const base = SHOT_SCALE[spec.shot ?? "wide"];
  const f = typeof spec.focus === "object" ? spec.focus : FOCUS[spec.focus ?? "center"];
  let scale = base, tx = 0, ty = 0, rot = 0;
  switch (spec.move ?? "push-in") {
    case "static": break;
    case "push-in": scale = base * (1 + 0.08 * k * ease); break;
    case "pull-out": scale = base * (1 + 0.1 * k * (1 - ease)); break;
    case "pan-left": scale = Math.max(base, 1.12); tx = interpolate(ease, [0, 1], [60, -60]) * k; break;
    case "pan-right": scale = Math.max(base, 1.12); tx = interpolate(ease, [0, 1], [-60, 60]) * k; break;
    case "tilt-up": scale = Math.max(base, 1.12); ty = interpolate(ease, [0, 1], [-90, 90]) * k; break;
    case "tilt-down": scale = Math.max(base, 1.12); ty = interpolate(ease, [0, 1], [90, -90]) * k; break;
    case "orbit": scale = base * 1.08; rot = Math.sin(t * Math.PI) * 2.5 * k; tx = Math.sin(t * Math.PI * 2) * 25 * k; break;
    case "shake": scale = base * 1.04; tx = Math.sin(frame * 1.9) * 7 * k; ty = Math.cos(frame * 2.3) * 6 * k; break;
    case "focus": scale = interpolate(ease, [0, 1], [1, base * 1.15]); break;
  }
  const skew = spec.shot === "low-angle" ? " skewX(-2deg)" : "";
  return (
    <AbsoluteFill style={{ transformOrigin: `${f.x * 100}% ${f.y * 100}%`,
      transform: `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rot}deg)${skew}` }}>
      {children}
    </AbsoluteFill>
  );
};
