---
name: pro-video-pipeline
description: The user's master video-editing workflow. Use whenever the user says "video edit", "edit video", "edit this video", "make a reel/short from this", or gives a video file or link to edit. Runs the full professional pipeline in order - intake, transcript, storyline, rough cut, visual effects, explainer graphics, B-roll, captions, sound effects, music, voice, colour grade, mix, render, QA and packaging - by routing each stage to the installed skills and connectors.
---

# Pro video pipeline

Goal: the most professional edit possible. Work stage by stage, show the user the plan before heavy rendering, and verify with stills before every render. Keep replies short; do the work yourself.

## 0. Intake (one short question round, then go)
Ask only what is missing:
- Platform: Instagram Reel / YouTube Short (9:16, 1080x1920) or YouTube long-form (16:9, 1920x1080 or 4K).
- Target length, language (captions can be bilingual, e.g. Kannada/Hindi + English), mood, and the one message the viewer must take away.
Probe the file: `ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate,codec_name -of json <video>`.
Large files: ask for a Google Drive / Dropbox direct link if an upload is too big.

## 1. Transcript (word-level)
`transcribe` (or `remotion-captions` whisper flow). Keep word timings; every later stage times to them.

## 2. Storyline and storyboard
- Hook + structure: `ig-reel` (Reels), `yt-script` / `yt-hook-scripter` (YouTube), `shorts` (long → short clips).
- Story and beats: `video-storytelling`, `cinematic-director` (beat sheet, shot list, storyboard prompts), `beat-sync-editing` for rhythm.
- Write `edit-plan.md`: hook (first 2 s), beats with timestamps, which effect / B-roll / SFX lands on each beat, the payoff and CTA. Show it to the user before step 5.

## 3. Rough cut
`cut-silences` → `cut-mistakes` (review-gated, best takes). Keep 30 ms audio fades on every cut. `ffmpeg-skill` for trims, reframes, speed.

## 4. Visual effects (talking head)
Use `video-effects-library` to map each beat to an effect. Main packs:
- `video-effects` (21 Remotion effects: orbit, liquid glass, dolly/snap zoom, paper cutout, magazine cover, frame break, phone mockup, green screen...)
- `effects-pack` (42 face-tracked: banknote/the-bill, voice note/comment box, apple toggles, spotlight, LED sign, tier list...)
- `effects` (50 transcript-aware) and `effects-vibharamprak` (51), `facecammaxxing` (text-behind, over-the-shoulder, prop-3d, LOG→cinema grade)
- Any other named effect: `reel-effects-hyperframes` → `hyperframes-registry` (~450 blocks) → build with `hyperframes` / `remotion-best-practices`.
Rules: 1 strong effect per idea, 1.5–4 s windows, never cover the face or eyes, keep text inside the platform safe zone, vary effects (no effect twice in a row).

## 5. Explainer graphics
`explainer` (head over panel, visuals on top), `behind-the-person` (charts/screens behind speaker), `animated-chart`, `vox-explainer`, `manim-video` (maths/physics/science), `ranking-list`, `split-screen`, `visual-notes`. Every number shown must come from the user's script or data — never invent figures.

## 6. B-roll and generated shots
`get-brolls` / `find-footage` (stock), `product-shot-prompts` → image-to-video with the Higgsfield connector (`generate_video`) or `ltx2-video` / `scenario-kling` / `scenario-veo`. Log the source of every clip.

## 7. Captions
`add-captions` (TikTok/karaoke/minimal) or `captions-overlay` doctrine for HyperFrames. Highlight 1–2 key words per line; captions sit as an overlay, below the chin, inside safe zones.

## 8. Sound design
- SFX: `editing-videos` (128 CC0 SFX: whoosh, riser, hit, pop), `sfx-sources` (Mixkit, Kenney, Freesound), ElevenLabs connector for custom SFX. Put a sound on every effect entrance, cut and text pop — subtle, not on every word.
- Music: `add-music` / ElevenLabs connector music / `acestep` (local). Match mood; duck music under speech (−18 to −22 dB under voice).
- Voiceover or fixes: `elevenlabs` / ElevenLabs connector. Voice cloning only for the user's own voice or with written consent.
- Clean speech: Adobe `media_enhance_speech` connector if the recording is noisy.

## 9. Colour and light
`mood-lighting-grade` part 2: fix exposure → white balance → denoise → sharpen, then the mood look. Preview stills before applying to the whole video.

## 10. Mix and loudness
Integrated loudness −14 LUFS, true peak −1 dBTP (`ffmpeg-skill` loudnorm). Voice always clear above music and SFX.

## 11. Render (highest quality)
Render with the engine used for the effects (`hyperframes-cli` / `remotion-render`), final assembly with FFmpeg:
`-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high -movflags +faststart -c:a aac -b:a 320k`
1080x1920 (Reels/Shorts) or 1920x1080 / 3840x2160 (YouTube), same frame rate as the source (30 or 60 fps). `reel-export` for platform presets.

## 12. QA before delivery
`review-video`: pull stills at every effect and cut (`ffmpeg -ss T -i out.mp4 -frames:v 1 qa_T.png`), look at them, check: face never covered, text readable and in safe zone, no black/white flash frames, audio in sync, no clipped audio, captions match speech. Fix and re-render anything that fails.

## 13. Package
`yt-title-optimizer`, `yt-thumbnail-brief`, `yt-chapters`, `ig-caption`, `ig-hashtag-strategist`. Deliver: final MP4, thumbnail brief, title/caption, and a one-line list of what was done.
