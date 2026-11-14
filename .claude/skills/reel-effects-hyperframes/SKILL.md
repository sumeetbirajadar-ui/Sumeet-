---
name: reel-effects-hyperframes
description: >-
  Load before building a short-form video (Reel, TikTok, Short, Meta video ad) that copies an effect from a trending "N effects Claude can make" reel, or when someone names one: "frame break", "zoom through", "glass type", "orbit", "floating UI", "split flap", "teardown", "type slam", "rack focus", "paper tear", "ink wash", "particle logo", "voice note", "receipt", "iceberg", "before/after", "10 animation styles", "efectos de reels", "rompe el marco", "letras de cristal". It maps about 80 of those effect names to the real HyperFrames registry block that does it (names checked against the 456-block registry, Nov 2026), says which ones do not exist and how to build them by hand, which ones must never run in paid Meta ads, and gives the 8-block short-form script structure (hook, lead, value, open loop, CTA). Not a renderer tutorial: load hyperframes / hyperframes-registry for wiring, and remotion skills for Remotion projects.
license: MIT
---

# Reel effects → HyperFrames blocks

Reels titled "30 animations Claude made" get millions of views, and every viewer then asks an agent for "the orbit one" or "split flap". Agents guess: they hand-build something the registry already ships, invent a block name that does not exist, or copy the reference's music, brand and data. This skill gives the real block for each name, an honest "does not exist" with a build recipe when it doesn't, and the rules that keep the result shippable as an ad.

## 1. Find and add the block

```bash
npx hyperframes catalog --query "<effect in English>" --json   # search only
npx hyperframes add <name> --json                             # copy the block into the project
npx hyperframes remove-background <video.mp4> -o cutout.webm  # local subject cutout, free
```
If `catalog` times out, read the registry directly: `https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/registry.json` (names), and `.../registry/<blocks|components|examples>/<name>/registry-item.json` (description). Never cite a block name you did not see there.

**Ready** = a block does it almost as shown. **Base** = a block does half and you build the rest on top. **By hand** = not in the registry; build it from the recipe.

## 2. Effect map

| Effect name (as in the reels) | Status and block |
|---|---|
| Frame break (subject steps out of the frame) | Base: `remove-background` + frame behind and cutout on top; `freeze-frame-dressing` |
| Zoom through / Letter dive | Ready: `zoom-through-transition`; `camera-dolly-zoom` |
| Glass type | Ready: `glass-hero`, `glass-shard-title` |
| Orbit / Orbit ring | Ready: `carousel-orbit-1` … `carousel-orbit-5`, `three-orbiting-cards`, `locked-nucleus-orbit` |
| Floating UI / data cards | Ready: `liquid-glass-widgets`, `grid-card-assemble` |
| Headline wall (sticky notes) | By hand: notes with `freeze-frame-dressing` tape, staggered drop |
| Phone with a live feed | Ready: `device-frame-stage` or `vfx-iphone-device` + `scroll-feed` |
| Chart that grows / Stat chart | Ready: `animated-bar-chart`, `mk-line-graph`, `chart-story`, `data-chart`, `nyt-graph` |
| Live doodles / Ink doodle / Sketch words | Ready: `hw-arrow`, `hw-callout-circle`, `hw-underline`, `hw-frame`, `hw-path-text`, `whiteboard-ink` |
| Digital zoom (REC viewfinder) | Base: `ui-focus-zoom`; draw the REC frame and the ×1.0→×2.6 readout yourself |
| Map route | Base: `arc-motion-path` or `offset-path-traveler` over your own map. The registry has US, Spain and world maps only |
| Iso flow (parcel's trip on an isometric map) | Base: `exploded-stack` (isometric) + `offset-path-traveler` |
| Globe arcs | Base: `world-map` (has a globe); draw the arcs |
| Headline / Press front (newspaper front page) | By hand; `headline-slam` for the hit. No real newspaper names |
| Teardown / Layer explode | Ready: `exploded-stack` |
| Split flap | Ready: `split-flap-board` |
| Git city (3D bar city) | By hand in three.js |
| Agent swarm, Terminal bloom, Code body | `terminal-simulator`, `code-terminal-run` exist, but these show *how* the work is done. Keep them out of client work |
| Before / After | Ready: `before-after-wipe`, `comparison-split`. **Never in paid Meta ads** (misleading before/after policy) |
| Swiss grid | Ready: `swiss-grid` |
| Blueprint draw | Base: `whiteboard-ink` or `outline-draw`, white lines on blue |
| Paper desk / Paper tear | Ready: `torn-paper-rip`; base: `paper-collage-reveal` |
| Laptop reveal | Ready: `vfx-iphone-device` (includes a MacBook), `multi-device-splay` |
| Notifications | Ready: `notification-cascade`, `notification-stack`, `native-notification-pop` |
| Ink wash | Ready: `ink-bleed-reveal` |
| Type slam | Ready: `headline-slam`, `char-slam-explode`, `shutter-slam`, `caption-kinetic-slam` |
| Day counter | Ready: `count-up`, `mk-progress-stat` |
| Day dial | By hand; `conic-progress-ring` as a base |
| Hologram | Base: `hologram` is an abstract shader orb, not an object; a holographic product is by hand |
| Deep time (scale pulling away) | Base: `parallax-unzoom` or chained `zoom-through-transition` |
| Contour map | By hand: SVG contour lines drawn with `svg-line-draw-loader` |
| Neon silhouette | Base: `remove-background` + glow outline; `lt-neon-border` for a frame |
| Particle logo / Blow away | Ready: `particle-text-dissolve`, `particle-image-reveal` |
| Turntable | Base: `product-turntable` needs a GLB model; with a flat photo use `carousel-orbit-1` or a short turn of the cutout |
| Money stack / Banknote | Base: `apple-money-count` (US dollars, its own sound); banknote by hand. Real prices only, never earnings claims |
| Receipt | By hand: an HTML receipt printing line by line with `typewriter` |
| Iceberg | By hand: layers under a waterline with labels |
| POV doodle | Base: `hw-frame` + `whiteboard-ink` over a real photo |
| Live cursor | Ready: `agent-cursor`, `cursor-zoom-follow`, `cursor-annotate` |
| Clone row | Base: `mk-clone-wall-transition` + `remove-background` |
| Predict keys | Base: `typed-prompt`, `typewriter` |
| Post wall | Base: `scroll-feed`, `logo-wall`, filled with real posts |
| Comment drop | Base: `yt-comment-card`, restyled for the platform; real comments with permission only |
| Blade slice | By hand: two halves with `clip-path` sliding apart |
| Head stack | By hand: `remove-background` + stacked copies |
| Rack focus | Ready: `rack-focus`, `focus-rack`, `focus-blur-resolve` |
| Voice note (chat voice bubble) | Base: a chat bubble + `waveform`. No real names or numbers |
| Impact frame | Ready: `logo-sting`, `headline-slam` |
| Dolly zoom | Ready: `camera-dolly-zoom` |
| Kinetic lyric type (one word per beat, mixed fonts) | Ready: `kinetic-type`, `caption-kinetic-slam`; cut to the beat |
| Text ribbons on rotating 3D rings | By hand: a three.js cylinder with the text as a texture, or CSS 3D rings |
| Ransom-note letters | By hand |
| 3D sticker words / falling 3D shapes finale | By hand in three.js; `confetti` is the 2D base |

**"10 animation styles" reels** (the same scene redrawn as comic, CGI, pixel art, glow sketch, low-poly console 3D, flat vector, minimal white line on black, chalkboard, toy bricks, 3D cartoon): the useful idea is to keep one scene and change the style each week, so a brand's feed changes while the brand stays. Describe the style, and never use a toy brand's or a creator's name or look-alike logo.

## 3. Rules that decide whether it ships
- **The brand wins over the effect:** recolor and retype every block to the client's brand. Never ship the reference's colors.
- **Real data only:** charts, counters, maps, prices, comments and testimonials come from the client's real data, with permission. Nothing invented.
- **Meta ads:** no before/after, no health or income promises, no "you" + personal attribute, no engagement bait ("comment WORD") in ads that lead to WhatsApp or a form.
- **Do not show the recipe in client work:** no terminals, code, prompts or agent UIs.
- **Rights:** never the reference's song, footage, logos or famous faces. Gated prompt packs ("comment ANIMATE to get them") are not needed: rebuild from the effect name and what is visible.
- **Safe zone for 9:16 ads:** keep text, cards, counters and captions out of the top 270 px, the bottom 670 px and 65 px at each side of 1080×1920, where Meta draws its own UI.
- **One signature effect per video.** Stack too many and none of them reads.

## 4. The script decides more than the effect
Effects lift a video that already has a story. The 8-block short-form structure:
1. **Hook:** breaks the pattern of what the viewer was scrolling, in second one.
2. **Lead:** carries them to about second 10; past that, few leave.
3. **Value 1.**
4. **Open loop:** one line of curiosity ("but that's not the best part").
5. **Value 2.**
6. **Open loop.**
7. **Value 3.**
8. **CTA:** the warmest viewers get the next step.

A common variant adds a "super hook" after the hook and "re-hooks" between the values.

For a 15-30 s paid ad:
- Use hook, lead by second 3-5, and two values with one loop between them.
- End on a CTA that matches the campaign: message us, call, book.
- Every loop opened must really close. Clickbait loops get ads rejected and kill trust.

Write the script with the blocks named before choosing an effect.

## 5. Check before delivery
1. Extract a contact sheet every 0.5 s and check every frame:
   - the cutout edges at 100% zoom (hair, hands);
   - no clipped words;
   - nothing outside the safe zone;
   - no empty first frame.
2. Every number and label is compared with its source.
3. Captions match the voice word for word.
4. Loudness: one target for all videos (e.g. about -14 LUFS integrated). Sound effects are real licensed recordings tied to a cue on screen.

## Limits
- The status column was checked against the registry on Nov 12, 2026. Blocks get added and renamed: re-check with `catalog` before you promise one.
- "Base" and "by hand" effects take real work. Estimate them as such.
