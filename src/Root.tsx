import React from "react";
import { Composition } from "remotion";
import { AstroReel, astroFrames } from "./kahani/AstroReel";
import { KahaniReel, totalFrames } from "./kahani/KahaniReel";
import { FPS, HEIGHT, WIDTH } from "./kahani/types";
import { StoryboardReel, sbTotalFrames } from "./storyboard/StoryboardReel";
import { astroStories, stories, storyboardStories } from "./stories/registry";

export const RemotionRoot: React.FC = () => (
  <>
    {stories.map((story) => (
      <Composition key={story.id} id={story.id} component={KahaniReel} durationInFrames={totalFrames(story)}
        fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ storyId: story.id }} />
    ))}
    {astroStories.map((s) => (
      <Composition key={s.id} id={s.id} component={AstroReel} durationInFrames={astroFrames(s)}
        fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ storyId: s.id }} />
    ))}
    {storyboardStories.map((s) => (
      <Composition key={s.id} id={s.id} component={StoryboardReel} durationInFrames={sbTotalFrames(s)}
        fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ storyId: s.id }} />
    ))}
  </>
);
