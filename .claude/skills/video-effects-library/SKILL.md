---
name: video-effects-library
description: Master index and router for every video effect, editing step and media tool installed here. Maps effect names seen in viral "N effects Claude made" reels (orbit, liquid glass, dolly zoom, paper cutout, frame break, banknote, voice note, glass widgets, apple toggles, match cut, spotlight, checklist, magazine cover, phone mockup, zoom through, green screen...) to the exact skill that renders them, and lays out the basic editing structure from raw footage to upload. Use whenever the user names an effect, asks "which effects can you do", wants a full edit, or asks about storyboard, image-to-video, voice cloning, music, SFX, lighting, grading or upscaling.
---

# Video effects library + editing structure

## A. Basic editing structure (run in this order)

| # | Stage | Skill(s) to use |
|---|---|---|
| 1 | Idea, script, hook | `ig-reel`, `yt-script`, `yt-hook-scripter`, `youtube` |
| 2 | Storyboard / shot list | `cinematic-director` (DirectorSKILL), `video` + `image` (smixs visual-skills), `cinematic-video-prompt` skill, `shot-composition`, `motion-brief-writer` |
| 3 | Lighting for the shoot | `mood-lighting-grade` (part 1) |
| 4 | Transcript (word-level) | `transcribe`, `remotion-captions`, `transcript` (YouTube) |
| 5 | Rough cut: silences, mistakes, best takes | `cut-silences`, `cut-mistakes`, `video-edit`, `ffmpeg-skill` |
| 6 | Story / beats / pacing | `video-storytelling`, `hyperframes-video-beats`, `beat-sync-editing`, `short-form-edit` |
| 7 | B-roll and generated shots | `get-brolls`, `find-footage`, `product-shot-prompts` → image-to-video (`generate-video`, `seedance-2-5-skill`, `ltx2`, `generate-clip`, `ultimate-ai-media-generator-skill`) |
| 8 | Effects and motion graphics | section B below |
| 9 | Captions / subtitles | `add-captions`, `remotion-captions`, `captions-overlay`, `oil-subtitle` |
| 10 | Voiceover / voice cloning | `elevenlabs`, `add-voiceover`, `clone-voice` (ComfyUI), `local-voice-clone`, `gemini-tts` — only clone a voice you own or have written consent for |
| 11 | Background music | `add-music`, `acestep` (local AI music), `generate-audio` (ComfyUI) |
| 12 | Sound effects library | `sfx-sources` (Mixkit, Kenney, Freesound), `freesound`, `media-use` |
| 13 | Colour grade / mood / visual improvement | `mood-lighting-grade` (part 2), `color-motion`, `premiere-grade-bot` (gradekit), `upscale-image` |
| 14 | Loudness + mix | `ffmpeg-skill` (LUFS: −14 for YouTube/IG) |
| 15 | Export per platform | `reel-export`, `remotion-render`, `hyperframes-cli`, `ffmpeg-skill` |
| 16 | Package: title, thumbnail, caption, hashtags, chapters | `yt-title-optimizer`, `yt-thumbnail-brief`, `yt-chapters`, `ig-caption`, `ig-hashtag-strategist` |

Connected cloud tools you can also call directly: Higgsfield (image/video generation, image-to-video, upscale, voice change, dubbing), ElevenLabs (voices, voice design, music, SFX), HyperFrames by HeyGen, Descript, OpusClip, Tella, Adobe (video resize/quick cut, speech enhance), Picsart Media Studio, vidIQ (thumbnails, music, clips).

## B. Effect name → skill

Three effect packs do talking-head effects with face tracking/cut-outs:
- `video-effects` — 21 Remotion effects (the "20 Video Effects Created by Claude" set).
- `effects-pack` — 42 Python/FFmpeg face-tracked effects.
- `orbit`, `glass-widgets`, `match-cut`, `neon-word`, `app-frame`, `profile-wall`, `shutter-strike`, `documentary`, `effects-grid` (ydarwish1 claude-video-effects).
Plus `reel-effects-hyperframes` (maps ~80 trending names to HyperFrames registry blocks), `facecammaxxing`, `eva-video-style`, `motion-effects`, `hyperframes-registry` (~450 blocks), `cut-the-curve` (transitions).

| Effect (as named in reels) | Use |
|---|---|
| Orbit / Orbit ring | `video-effects` orbit, `effects-pack` orbit, `orbit` |
| Chat Takeover | `video-effects` chat-takeover |
| Frame Escape / Frame Break | `video-effects` frame-escape, frame-break |
| Snap Zoom / Digital Zoom / Dolly Zoom | `video-effects` snap-zoom, digital-zoom; `reel-effects-hyperframes` (camera-dolly-zoom); `effects-pack` slow-push, lean-in |
| Checklist / Checklist Pop / Checklist Tally | `video-effects` checklist*, `effects-pack` checklist, check-pills, todo |
| Headline Storm / Headline Wall / Split Headline | `video-effects` headline-storm; `effects-pack` headline-wall, split-headline, headline-box |
| Zoom Portal / Zoom Through Cut / Letter dive | `video-effects` zoom-portal, zoom-through-cut; `reel-effects-hyperframes` |
| Growth Curve / Split chart | `video-effects` growth-curve, split; `animated-chart` |
| Studio Reveal / Green Screen | `video-effects` green-screen |
| B-roll Overlay / B-roll split | `video-effects` broll-overlay; `effects-pack` broll-split |
| Paper Cutout / Paper tear | `video-effects` paper-cutout; `reel-effects-hyperframes` torn-paper-rip |
| Magazine Cover / Cover star | `video-effects` magazine-cover; `effects-pack` cover-star |
| Liquid Glass | `video-effects` liquid-glass; `effects-pack` liquid-glass-graph |
| Phone Mockup / Post wall / Profile wall | `video-effects` phone-mockup; `effects-pack` phone-fan, profile-wall; `profile-wall` |
| Glass widgets | `glass-widgets`, `video-effects` glass-widgets, `effects-pack` glass-widgets |
| Spotlight / Neon word / LED sign | `effects-pack` spotlight, glitter-spotlight, led-sign; `neon-word` |
| Match cut | `match-cut`, `effects-pack` match-cut |
| Apple toggles | `effects-pack` apple-toggles |
| Word behind the head / Sketch words | `effects-pack` backdrop-word, scribble; `reel-effects-hyperframes` hw-* |
| Banknote / the bill | `effects-pack` the-bill |
| Voice note / Comment drop | `effects-pack` comment-box; HyperFrames `notification-*` blocks via `reel-effects-hyperframes` |
| Tier list / Timeline / Countdown flip | `effects-pack` tier-list, timeline, countdown-flip |
| Layer explode / Teardown | `reel-effects-hyperframes` exploded-stack |
| Rack focus / Impact frame / Blade slice / Head stack | `cut-the-curve` (rack-focus blur-cut), `shutter-strike`, `effects-pack` red-collage, `reel-effects-hyperframes` |
| Press font / Type slam | `reel-effects-hyperframes` headline-slam, char-slam-explode |
| Blow away / Particle | `reel-effects-hyperframes` particle-text-dissolve |
| Live cursor / Oversized cursor | `oversized-cursor` |
| Split flap / Day counter / Day dial | `reel-effects-hyperframes` split-flap-board, count-up, conic-progress-ring |

If a name isn't listed: check `reel-effects-hyperframes` first, then search the HyperFrames catalogue (`npx hyperframes catalog --query "<name>"`), then build by hand with `hyperframes` or `remotion-best-practices`.
