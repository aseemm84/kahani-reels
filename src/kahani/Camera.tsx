import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

/** Slow push-in (Ken Burns) applied to a scene's visual. */
export const Camera: React.FC<{ durationInFrames: number; children: React.ReactNode; from?: number; to?: number }> = ({
  durationInFrames,
  children,
  from = 1,
  to = 1.08,
}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, durationInFrames], [from, to], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: "50% 45%" }}>{children}</AbsoluteFill>;
};
