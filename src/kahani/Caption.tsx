import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";

/** Pill caption near the bottom. Words wrapped in *stars* are highlighted gold. */
export const Caption: React.FC<{ text: string; bottom?: number }> = ({ text, bottom = 330 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 4, fps, config: { damping: 14, mass: 0.6 } });
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${(1 - s) * 40}px) scale(${0.9 + 0.1 * s})`,
        opacity: s,
      }}
    >
      <div
        style={{
          background: "rgba(8,14,40,0.88)",
          border: "3px solid rgba(255,255,255,0.12)",
          borderRadius: 22,
          padding: "16px 34px",
          maxWidth: 900,
          textAlign: "center",
          fontFamily: theme.font,
          fontWeight: 800,
          fontSize: 58,
          lineHeight: 1.2,
          color: theme.white,
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        {parts.map((p, i) =>
          p.startsWith("*") ? (
            <span key={i} style={{ color: theme.gold }}>
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
