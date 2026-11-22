import React from "react";
import { theme } from "./theme";

/** Small handle / watermark. Bottom centre by default, top-right with `top`. */
export const Handle: React.FC<{ text: string; top?: boolean }> = ({ text, top }) => (
  <div style={{ position: "absolute", ...(top ? { top: 70, right: 60 } : { bottom: 70, left: 0, right: 0, textAlign: "center" as const }),
    fontFamily: theme.font, fontWeight: 700, fontSize: 34, color: theme.cream, opacity: 0.75, letterSpacing: 1,
    textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{text}</div>
);
