import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Caption } from "../kahani/Caption";
import { Handle } from "../kahani/Handle";
import { Kicker } from "../kahani/Kicker";
import { FADE, FPS } from "../kahani/types";
import { storyboardStories } from "../stories/registry";
import { CameraSpec, SBCamera } from "./Camera";
import { Palette, Sky } from "./Sky";
import { SBTransition, TransitionIn } from "./Transition";

export type SBScene = {
  narration: string;
  caption: string;
  Visual: React.FC<{ durationInFrames: number }>;
  /** fallback length when no voice exists yet */
  seconds?: number;
  camera?: CameraSpec;
  transition?: TransitionIn;
  palette?: Palette;
};

export type SBStory = {
  slug: string;
  id: string;
  title: string;
  kicker?: string;
  scenes: SBScene[];
  voice?: { durations: number[] };
  music?: string;
  musicVolume?: number;
  handle?: string;
  diyas?: boolean;
  /** hide the title after the first scene (default false = title stays) */
  titleFirstSceneOnly?: boolean;
};

export const sbSceneFrames = (s: SBStory) =>
  s.scenes.map((sc, i) => Math.max(30, Math.round(((s.voice?.durations?.[i] ?? sc.seconds ?? 5) + 0.35) * FPS)));
export const sbTotalFrames = (s: SBStory) => {
  const f = sbSceneFrames(s);
  return f.reduce((a, b) => a + b, 0) - FADE * (f.length - 1);
};

/** Plays a storyboard: per-scene sky palette, camera move/shot, transition, caption and voice. */
export const StoryboardReel: React.FC<{ storyId: string }> = ({ storyId }) => {
  const s = storyboardStories.find((x) => x.id === storyId);
  if (!s) throw new Error(`Storyboard story ${storyId} not in src/stories/registry.ts`);
  const frames = sbSceneFrames(s);
  const hasVoice = !!s.voice?.durations?.length;
  let start = 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {s.music ? <Audio src={staticFile(s.music)} volume={s.musicVolume ?? 0.12} loop /> : null}
      {s.scenes.map((sc, i) => {
        const d = frames[i], from = start;
        start += d - FADE;
        const V = sc.Visual;
        return (
          <Sequence key={i} from={from} durationInFrames={d}>
            <SBTransition d={d} first={i === 0} last={i === frames.length - 1} type={sc.transition}
              nextType={s.scenes[i + 1]?.transition}>
              <Sky palette={sc.palette} diyas={s.diyas ?? true} />
              <SBCamera durationInFrames={d} spec={sc.camera}>
                <V durationInFrames={d} />
              </SBCamera>
              {sc.caption ? <Caption text={sc.caption} /> : null}
            </SBTransition>
            {hasVoice ? <Audio src={staticFile(`${s.slug}/s${i + 1}.mp3`)} /> : null}
          </Sequence>
        );
      })}
      {s.titleFirstSceneOnly ? (
        <Sequence durationInFrames={frames[0]}><Kicker kicker={s.kicker} title={s.title} /></Sequence>
      ) : (
        <Kicker kicker={s.kicker} title={s.title} />
      )}
      {s.handle ? <Handle text={s.handle} /> : null}
    </AbsoluteFill>
  );
};
