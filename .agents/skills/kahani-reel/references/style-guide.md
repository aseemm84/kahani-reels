# Visual style guide (keep every reel consistent)

**Look**: flat vector storybook art, night-blue sky, warm gold/saffron highlights, soft glow. No outlines
thicker than 4 px, no gradients except glows. Use colours from `src/kahani/theme.ts` only.

**Frame zones (1080×1920)**
- 0–330 px: title/kicker (engine draws it) — keep empty.
- 330–1450 px: main action. Hero character centred around y ≈ 850–1000, 450–700 px tall.
- 1450–1620 px: caption pill (engine draws it) — keep faces/text out of here.
- 1700–1920 px: diya row (engine draws it).

**Characters**
- Build each character once as its own component in the story file (e.g. `const Hanuman = ({pose}) => ...`)
  and reuse it in every scene so it looks identical. Big head (~1/3 of height), simple shapes, expressive
  eyes, 3–4 flat colours plus a highlight.
- Add life: idle bob `Math.sin(frame/12)*6`, blink every ~90 frames, cape/tail sway.

**Motion**
- Every scene needs at least: one parallax layer (background moves slower than foreground), one entrance
  (`spring()` scale/translate for the hero), one ambient loop (clouds drift, stars, sparks, leaves).
- Big moments: scale punch (1 → 1.15 → 1) + golden radial burst.
- Use `interpolate(..., {extrapolateRight: "clamp"})`; never CSS animations or Math.random() (use seeded
  helpers) so renders are deterministic.

**Reuse** `Moon`, `Mountains`, `Cloud`, `Tree` from `src/kahani/Props.tsx`; add new reusable props there
when a story needs them (palace, river, sun, forest, sea, mountain with herbs, etc.).
