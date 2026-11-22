import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FADE } from "../kahani/types";

export type TransitionIn = "cut" | "crossfade" | "fade-black" | "slide-left" | "slide-right" | "zoom-in" | "wipe-down" | "flash";

/** Animates a scene's entrance (its transition_in) and how it hands over to the next scene. */
export const SBTransition: React.FC<{
  d: number; first: boolean; last: boolean; type?: TransitionIn; nextType?: TransitionIn; children: React.ReactNode;
}> = ({ d, first, last, type = "crossfade", nextType = "crossfade", children }) => {
  const f = useCurrentFrame();
  const p = first ? 1 : interpolate(f, [0, FADE], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const q = last ? 1 : interpolate(f, [d - FADE, d], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // the outgoing scene only fades for fade-type transitions; slides, wipes and cuts cover it instead
  const exitFades = ["crossfade", "fade-black", "zoom-in", "flash"].includes(nextType);
  let opacity = exitFades ? q : 1;
  let transform = "";
  let clip: string | undefined;
  switch (first ? "cut" : type) {
    case "cut": break;
    case "crossfade": case "fade-black": case "flash": opacity = Math.min(opacity, p); break;
    case "slide-left": transform = `translateX(${(1 - p) * 100}%)`; break;
    case "slide-right": transform = `translateX(${-(1 - p) * 100}%)`; break;
    case "zoom-in": opacity = Math.min(opacity, p); transform = `scale(${1.25 - 0.25 * p})`; break;
    case "wipe-down": clip = `inset(0 0 ${(1 - p) * 100}% 0)`; break;
  }
  const blackIn = !first && type === "fade-black" ? interpolate(f, [0, FADE], [1, 0], { extrapolateRight: "clamp" }) : 0;
  const blackOut = !last && nextType === "fade-black" ? interpolate(f, [d - FADE, d], [0, 1], { extrapolateLeft: "clamp" }) : 0;
  const white = !first && type === "flash" ? interpolate(f, [0, 3, FADE], [0, 0.9, 0], { extrapolateRight: "clamp" }) : 0;
  return (
    <AbsoluteFill style={{ opacity, transform, clipPath: clip }}>
      {children}
      {blackIn || blackOut ? <AbsoluteFill style={{ background: "#000", opacity: Math.max(blackIn, blackOut) }} /> : null}
      {white ? <AbsoluteFill style={{ background: "#fff", opacity: white }} /> : null}
    </AbsoluteFill>
  );
};
