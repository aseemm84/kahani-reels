import { Story } from "../kahani/types";
import type { AstroStory } from "../kahani/AstroReel";
import type { SBStory } from "../storyboard/StoryboardReel";
import { demoStory } from "./demo";
import { shaniMargiStory } from "./shani-margi";
import { hanumanSanjeevaniStory } from "./hanuman-sanjeevani";
// Skills add one import + one array entry per new story below.

/** Cartoon kahani reels (kahani-reel skill) */
export const stories: Story[] = [demoStory, shaniMargiStory];

/** Reels rendered by the Astro/Nirayana engine (astro-reel skill) */
export const astroStories: AstroStory[] = [];

/** Reels built from a Gemini (or any) storyboard (storyboard-reel skill) */
export const storyboardStories: SBStory[] = [hanumanSanjeevaniStory];
