import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile } from "remotion";
import { Caption } from "./Caption";
import { Handle } from "./Handle";
import { FPS } from "./types";
import { astroStories } from "../stories/registry";

export type AstroLine = { narration: string; caption?: string; beats?: number[] };
export type AstroStory = {
  slug: string;
  id: string;
  script: AstroLine[];
  voice: { durations: number[] };
  timing: { seconds: number; gap: number; tail?: number };
  /** Draw Devanagari caption pills over the engine's frame (default false – the reel has its own text) */
  captions?: boolean;
  /** Distance of the caption pill from the bottom edge (px). 215 sits between the engine text and its footer. */
  captionBottom?: number;
  music?: string;
  musicVolume?: number;
  handle?: string;
};

export const astroFrames = (s: AstroStory) => Math.max(30, Math.round(s.timing.seconds * FPS));

export const AstroReel: React.FC<{ storyId: string }> = ({ storyId }) => {
  const s = astroStories.find((x) => x.id === storyId);
  if (!s) throw new Error(`Astro story ${storyId} not in src/stories/registry.ts`);
  let t = 0;
  return (
    <AbsoluteFill style={{ background: "#07080d" }}>
      <OffthreadVideo src={staticFile(`${s.slug}/astro.mp4`)} muted />
      {s.music ? <Audio src={staticFile(s.music)} volume={s.musicVolume ?? 0.1} loop /> : null}
      {s.script.map((line, i) => {
        const from = Math.round(t * FPS);
        const len = Math.max(1, Math.round((s.voice.durations[i] + s.timing.gap) * FPS));
        t += s.voice.durations[i] + s.timing.gap;
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            <Audio src={staticFile(`${s.slug}/s${i + 1}.mp3`)} />
            {s.captions && line.caption ? <Caption text={line.caption} bottom={s.captionBottom ?? 215} /> : null}
          </Sequence>
        );
      })}
      {s.handle ? <Handle text={s.handle} top /> : null}
    </AbsoluteFill>
  );
};
