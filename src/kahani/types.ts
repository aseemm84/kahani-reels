import React from "react";

export type SceneDef = {
  /** Narration text (Hindi/Hinglish) – spoken by the voice track */
  narration: string;
  /** Short on-screen caption; wrap the word to highlight in *stars* */
  caption: string;
  /** Scene visual – an SVG React component. Receives local frame info. */
  Visual: React.FC<{ durationInFrames: number }>;
  /** Fallback length (seconds) used when no voice file exists yet */
  seconds?: number;
};

export type Story = {
  /** kebab-case id, also the folder name under public/ and src/stories/ */
  slug: string;
  /** Composition id shown in Remotion Studio, e.g. "HanumanReel" */
  id: string;
  title: string;
  /** Optional top-left kicker line, e.g. "RAMAYAN KI KAHANI" */
  kicker?: string;
  scenes: SceneDef[];
  /** seconds per scene measured from the voice clips (written by make_voice.py) */
  voice?: { durations: number[] };
  /** Optional background music file inside public/, e.g. "music/tanpura.mp3" */
  music?: string;
  /** Music level 0..1 under the voice (default 0.12) */
  musicVolume?: number;
  /** Optional on-screen handle / watermark, e.g. "@Nirayana.Soft" */
  handle?: string;
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FADE = 9; // crossfade frames (0.3 s)
