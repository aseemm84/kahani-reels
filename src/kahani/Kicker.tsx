import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "./theme";

/** Small monospace kicker + big title with a gold highlight box (top of frame). */
export const Kicker: React.FC<{ kicker?: string; title: string }> = ({ kicker, title }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const parts = title.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <div style={{ position: "absolute", top: 150, left: 70, right: 70, opacity: o, fontFamily: theme.font }}>
      {kicker ? (
        <div style={{ fontFamily: "monospace", letterSpacing: 4, fontSize: 28, color: theme.gold, marginBottom: 10 }}>
          {kicker}
        </div>
      ) : null}
      <div style={{ fontSize: 72, fontWeight: 800, color: theme.white, lineHeight: 1.15 }}>
        {parts.map((p, i) =>
          p.startsWith("*") ? (
            <span
              key={i}
              style={{ background: theme.gold, color: theme.ink, borderRadius: 12, padding: "0 14px", margin: "0 4px" }}
            >
              {p.slice(1, -1)}
            </span>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </div>
    </div>
  );
};
