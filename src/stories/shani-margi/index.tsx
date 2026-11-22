import React from "react";
import { BigStat, GrahaOrb, RetroLoop, Timeline, ZodiacWheel } from "../../kahani/astro";
import { Story } from "../../kahani/types";
import graha from "./data/graha.json";
import sky from "./data/sky.json";
import script from "./script.json";
import voice from "./voice.json";

const V: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width="100%" height="100%" viewBox="0 0 1080 1920">{children}</svg>
);
const hiDate = (w: string) => {
  const M = ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितम्बर","अक्टूबर","नवम्बर","दिसम्बर"];
  const [d] = w.split(" "); const [y, m, dd] = d.split("-").map(Number); return `${dd} ${M[m - 1]} ${y}`;
};
const label: Record<string, string> = { direct: "मार्गी", retrograde: "वक्री", ingress: "प्रवेश" };

const S1 = () => <V><GrahaOrb graha="Saturn" retro={graha.now.retro} cy={880} /></V>;
const S2 = () => <V><ZodiacWheel grahas={sky.grahas} highlightRashi={graha.now.rashi.i} cy={880} /></V>;
const S3 = () => <V><RetroLoop graha="Saturn" y={900} /></V>;
const S4 = () => (
  <V><Timeline items={graha.comingEvents.map((e) => ({ date: hiDate(e.when), graha: "Saturn",
    text: `शनि ${label[e.kind] ?? e.kind}${e.to ? " · " + e.to.hi : ""}` }))} y={640} /></V>
);
const S5 = () => <V><BigStat value={graha.dashaYears ?? 0} suffix=" वर्ष" label="शनि महादशा" y={900} /></V>;
const S6 = () => <V><GrahaOrb graha="Saturn" label="शनि मार्गी" cy={860} r={180} /></V>;

export const shaniMargiStory: Story = {
  slug: "shani-margi",
  id: "ShaniMargiReel",
  title: "शनि *मार्गी*",
  kicker: "निरायण · शनि गोचर",
  voice,
  music: "music/tanpura.mp3",
  musicVolume: 0.12,
  handle: "@Nirayana.Soft",
  scenes: [S1, S2, S3, S4, S5, S6].map((Visual, i) => ({ ...script[i], seconds: 7, Visual })),
};
