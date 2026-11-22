import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Background } from "./Background";
import { Camera } from "./Camera";
import { Caption } from "./Caption";
import { Kicker } from "./Kicker";
import { Handle } from "./Handle";
import { FADE, FPS, Story } from "./types";
import { stories } from "../stories/registry";

export const sceneFrames = (story: Story): number[] =>
  story.scenes.map((s, i) => {
    const sec = story.voice?.durations?.[i] ?? s.seconds ?? 5;
    return Math.max(30, Math.round((sec + 0.35) * FPS)); // small breath after each line
  });

export const totalFrames = (story: Story) => {
  const f = sceneFrames(story);
  return f.reduce((a, b) => a + b, 0) - FADE * (f.length - 1);
};

const Fader: React.FC<{ d: number; children: React.ReactNode; first: boolean; last: boolean }> = ({
  d,
  children,
  first,
  last,
}) => {
  const frame = useCurrentFrame();
  const inO = first ? 1 : interpolate(frame, [0, FADE], [0, 1], { extrapolateRight: "clamp" });
  const outO = last ? 1 : interpolate(frame, [d - FADE, d], [1, 0], { extrapolateLeft: "clamp" });
  return <AbsoluteFill style={{ opacity: Math.min(inO, outO) }}>{children}</AbsoluteFill>;
};

export const KahaniReel: React.FC<{ storyId: string }> = ({ storyId }) => {
  const story = stories.find((s) => s.id === storyId);
  if (!story) throw new Error(`Story ${storyId} not in src/stories/registry.ts`);
  const frames = sceneFrames(story);
  let start = 0;
  const hasVoice = !!story.voice?.durations?.length;
  return (
    <AbsoluteFill>
      <Background />
      {story.music ? <Audio src={staticFile(story.music)} volume={story.musicVolume ?? 0.12} loop /> : null}
      {story.scenes.map((scene, i) => {
        const d = frames[i];
        const from = start;
        start += d - FADE;
        const V = scene.Visual;
        return (
          <Sequence key={i} from={from} durationInFrames={d}>
            <Fader d={d} first={i === 0} last={i === frames.length - 1}>
              <Camera durationInFrames={d}>
                <V durationInFrames={d} />
              </Camera>
              <Caption text={scene.caption} />
            </Fader>
            {hasVoice ? <Audio src={staticFile(`${story.slug}/s${i + 1}.mp3`)} /> : null}
          </Sequence>
        );
      })}
      <Kicker kicker={story.kicker} title={story.title} />
      {story.handle ? <Handle text={story.handle} /> : null}
    </AbsoluteFill>
  );
};
