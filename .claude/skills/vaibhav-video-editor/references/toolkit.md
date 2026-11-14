# The toolkit

Every component this skill can drive: what it's best at, where it lives, how the director uses it, and what to do when it's missing. `scripts/preflight.sh` checks all of them.

## Engines

### awa-video-reel (engine A, the reel engine)
- **Best at:** finished short clips (up to 60 s) in one render: 45 face-tracked effects, HyperFrames captions and cards (title, lower, stat, list, cta), camera punch-ins and pushes, clean or cinematic look, recorded website b-roll and Claude Code b-roll, Remotion intro and follow cards, a ducked music bed and automatic sound effects, -14 LUFS.
- **Where:** `~/.claude/skills/awa-video-reel/` (by Awa K. Penn, MIT).
- **Entry points:** `scripts/prepare.sh <video>` → job folder with `probe.json`, `words.json`, `words.txt`. Write `fx.json`, `edit.json`, `cards.json`. `scripts/broll.py <job>` for b-roll. `scripts/render.sh <job>` (6 to 8 min for 40 s). Outputs `<name>_edited.mp4` and `<name>_edited_nomusic.mp4` in Downloads.
- **Watch for:** renders at the source fps capped at 30. Does not cut silences (the director does that in stage 3). Libraries: `music/library.json` (moods), `sfx/manifest.json` (sound names).
- **Missing:** use engine B or C, and `scripts/sound_mix.py` for sound.

### Video Editor plugin (engine B, the long-form engine)
- **Best at:** any length, joining clips, silence and filler cuts, retakes, captions, titles, zooms, image and video overlays, b-roll, music, loudness, other shapes, and shorts from long videos.
- **Where:** a Claude plugin (`/video-editor:start`, `:edit`, `:style`, `:clips`). Its `scripts/` folder holds `check_setup.py`, `transcribe.py`, `silences.py`, `join.py`, `storyboard.py`, `render.py`, `frames.py`. `preflight.sh` prints the folder.
- **Entry points:** `transcribe.py VIDEO --out work/NAME-words.json --vocab "..."`, `silences.py VIDEO --words ... --out work/NAME-keep.json`, `storyboard.py work/NAME-storyboard.json` (an HTML storyboard with stills), `render.py work/NAME-plan.json --preview`, then without `--preview` for the final. Plan format: `skills/edit/reference/plan-format.md`.
- **Watch for:** plan times are on the original timeline unless `"times": "edited"`. Its `my-video-style` skill is the user's saved style.
- **Missing:** ffmpeg plus `scripts/apply_keep.py` for cuts, HyperFrames for captions and graphics.

### HyperFrames (engine C, and the motion-graphics layer for A and B)
- **Best at:** designed motion graphics in HTML: hooks, kinetic type, logo tiles, UI recreations, charts, captions in any style, full graphics-led videos, transparent overlays. Also `transcribe`, `remove-background` (cut the person out), `beats`, `normalize-audio`, `tts`.
- **Where:** Claude Code plugin `hyperframes@hyperframes` (by HeyGen). Install: `/plugin marketplace add heygen-com/hyperframes`, then `/plugin install hyperframes@hyperframes`.
- **Read before building:** `/hyperframes` (contract and work loop), `references/captions.md`, `overlays.md`, `motion.md`, `sound.md`; on-demand skills `motion-doctrine` (one continuous camera feel), `seam-craft` (zoom-through, inverse zoom-through, waterfall and rack-focus cuts), `cut-the-curve`, `captions-overlay`, `oversized-cursor`; `hyperframes-registry` for ready blocks (orbit-card, glass-shard-title, cuboid-carousel and more).
- **Watch for:** awa pins `npx -y hyperframes@0.8.222`; use the same version inside awa jobs. Overlays need a transparent root.

### Remotion
- **Best at:** React-built motion graphics when the user's style asks for Remotion, intro and end cards (awa uses it), charts, text animations, light leaks, transitions.
- **Where:** `~/.claude/skills/remotion-best-practices/` (rules for each topic in `rules/`). awa ships its own Remotion project in `awa-video-reel/remotion/`.
- **Missing:** use HyperFrames.

### Voices (voiceover mode)
- **`scripts/voiceover.py`:** one command for four providers, always returning the voice file and word timings (`[{start, end, word}]`).
- **ElevenLabs:** `ELEVENLABS_API_KEY`; calls `/v1/text-to-speech/{voice}/with-timestamps` for exact timings. Default model `eleven_multilingual_v2` (Hindi and Hinglish). Free plan: credit line, non-commercial.
- **Google Gemini TTS:** `GEMINI_API_KEY` (free from Google AI Studio); through the HyperFrames audio engine (`media-use/audio/scripts/audio.mjs`, provider `gemini`), timings by transcription.
- **HeyGen:** free with `npx hyperframes auth login`; `media-use/audio/scripts/heygen-tts.mjs`, timings included.
- **Kokoro-82M:** free and offline through `npx hyperframes tts`. One-time setup (ask first): a Python 3.12 venv at `~/.local/share/hyperframes-venv` with `kokoro-onnx soundfile` (`voiceover.py` points HyperFrames at it through `HYPERFRAMES_PYTHON`), then a ~340 MB model on first use. Non-English voices also need `espeak-ng`. Transcribed timings are snapped to the real speech starts. A 22 s read takes about 25 s on an M-series Mac.
- **Missing key:** say which key and where it goes; never switch to another voice silently.

## Effects and styles

### effects (45 face-tracked effects)
- **Best at:** one-shot showpiece effects that track the face and can sit behind the head: orbit, spotlight, backdrop-word, lean-in, slow-push, checklist, todo, apple-toggles, messages, comment-box, tap, liquid-glass-graph, headline-wall, cover-star, reject-stamp, countdown-flip, match-cut, led-sign and more. Full table in `effects/SKILL.md`.
- **Where:** `~/.claude/skills/effects/` (by @vibha.in.progress, MIT), also bundled inside awa-video-reel as `effects/`.
- **Entry points:** `scripts/setup.sh` (once), `.venv/bin/python -I scripts/fx.py --plan plan.json <video> out.mp4`, `--still t1,t2` for check frames, `scripts/words.py <video>` for word times.
- **Watch for:** keeps the original audio, adds visuals only. Renders at 30 fps at most (for 60 fps edits, run it on the effect's segment and splice it back, see SKILL.md stage 6). Camera effects first when they overlap. Zoom never past 2x. `words.py` writes `<video>.words.json` next to its input and installs faster-whisper into its own venv on first use: run it on a copy in `work/`, never on `raw/`, and ask first. Its venv is also a handy faster-whisper when the system has none.

### brand-nat-styles (style vocabulary)
- **Best at:** a shared language for the look: short codes in groups H (hook), C (captions), L (layout), P (proof), V (visual beats), B (animated b-roll), X (signature effects), M (motion and pace), S (sound), G (colour and finish). The user can pick codes in a visual guide and paste them.
- **Where:** `~/.claude/skills/brand-nat-styles/` (`styles.md`, and `guide/index.html` to open in a browser).
- **How the director uses it:** codes go on the style card, and `references/beat-map.md` says how each one is built with the tools here. Its house rules (never cover the face, safe zone, proper capitals, real proof, -14 LUFS, no flashy transitions unless picked, privacy) are always on.

### my-video-style (the user's own taste)
- **Where:** `~/.claude/skills/my-video-style/SKILL.md`, made by `/video-editor:start` or `/video-editor:style`.
- **How the director uses it:** read it first, every time. It wins over every default. If it lists skills that aren't installed, map each to the nearest tool here and say so once.

### multicam-shot (AI camera pass)
- **Best at:** turning one talking-head take into a prompt for a video-to-video AI (Seedance 2.0 Fast) that adds motion-blurred camera whips and kinetic supers synced to the speech. The result is a prompt to paste, not a render.
- **Where:** `~/.claude/skills/multicam-shot/` (The Creator Stack by pauloshimas, MIT).
- **How the director uses it:** an optional extra for short hooks (best under 15 s). Run it as its own skill with its frozen template and checkpoint. Never mix its template with other camera prompts.

## Fallbacks when a component is missing

| Missing | Use instead |
|---|---|
| awa-video-reel | engine B or C; `scripts/sound_mix.py` with any sound effects folder |
| Video Editor plugin | `scripts/apply_keep.py` for cuts, awa or HyperFrames for captions |
| effects | HyperFrames builds of the same idea (see the ≈ notes in `beat-map.md`), or skip the effect |
| HyperFrames | awa cards, Video Editor titles and overlays, or Remotion |
| brand-nat-styles | describe the look in words on the style card |
| my-video-style | `references/house-style.md` |
| sound effects library | `sound_mix.py --sfx-dir <folder>` with the user's own sounds, or no sound effects |

## Credits (keep these when you share)

Effects engine: Vibha Ramprakash (@vibha.in.progress), MIT. awa-video-reel: Awa K. Penn, MIT. MultiCam shot: The Creator Stack by pauloshimas, MIT. Brand Nat Styles: the Brand Nat Style Guide. HyperFrames: HeyGen. Remotion: Remotion. Video Editor plugin: mavgpt.ai. Sound effects in awa-video-reel: Pixabay licence. Music: credits per track in `awa-video-reel/music/library.json`.
