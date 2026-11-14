# Transitions and sound

## Transitions

Default to hard cuts. A transition has to earn its place: it marks a new section, a cutaway, or a reveal. Flashy transitions (flash, shake, light leak, glitch) only when the user's style or a picked code calls for them.

| Transition | When | How |
|---|---|---|
| Hard cut | between takes, inside a section, everywhere by default | the clean cut (stage 3) |
| Punch-in cut (Nat M1) | sentence starts, to keep one shot alive | awa `camera` zoom 1.06 to 1.15, or VE `zooms` |
| Two-framing jump cut (M5) | one-take talking head with a fast pace | alternate wide and tight framing per sentence, no easing |
| Face-centred zoom (M6) | short emphasis lines (snap), long lines (slow push) | awa `camera`, which scales round the face |
| Zoom-blur in and out (M2) | into and out of cutaways and b-roll | awa `style: cinematic`; HF `seam-craft` |
| Zoom-through (X9) | section change through a dark part of the frame | HF `seam-craft` zoom-through and inverse zoom-through |
| Rack-focus blur cut | calm, premium section change | HF `seam-craft` |
| Match cut | the same word or shape carries across two shots | fx `match-cut`, or HF |
| Colour circle wipe (M7) | section change in clean, branded edits | HF |
| Split-screen slide | speaker moves aside for b-roll | awa b-roll (automatic) |
| Motion-blurred camera whip | AI camera pass on a short hook | `/multicam-shot` prompt only |
| Light leak | warm, cinematic pieces when picked | Remotion `rules/light-leaks.md` |

Rules:
- One transition style per job. If section changes use a circle wipe once, they use it every time.
- Transitions are short: 0.2 to 0.5 s. Never on top of an effect that already moves the camera (`lean-in`, `slow-push`, `orbit`).
- In HyperFrames, read `motion-doctrine` first so a multi-scene piece feels like one continuous camera move, and `cut-the-curve` for velocity-matched cuts.

## Sound effects

Every visual beat gets a sound, sitting well under the voice (about 9 to 18 dB below). Sync the sound to the frame where the visual lands, not where it starts.

| Visual | Sound (awa `sfx` names) | Volume (0 to 1) |
|---|---|---|
| card or title in | `whoosh-short` (0.05 s before) | 0.25 to 0.3 |
| list item, chip, logo pop | `pop` | 0.2 to 0.25 |
| camera punch-in or push | `whoosh-short` | 0.2 |
| b-roll or cutaway in | `whoosh` (0.1 s before) | 0.35 |
| cinematic cutaway, zoom-through | `whoosh-cinematic` | 0.35 |
| stamp, headline slam, big reveal | `impact-bass-1` or `impact-bass-2` | 0.45 to 0.6 |
| tap, toggle, button, cursor click | `click` or `click-soft` | 0.3 to 0.45 |
| typing, search bar, comment box | `typing` or `key-press` | 0.25 to 0.3 |
| notification, message pop | `notification` or `ping` | 0.3 |
| success, tick, done | `chime` | 0.25 |
| sparkle, glitter, magic reveal | `sparkle` | 0.3 |
| wrong, error | `error` | 0.3 |
| glitch effect (only if picked) | `glitch-1` to `glitch-3` | 0.35 to 0.4 |
| build-up into the CTA | `riser`: it is 10 s long, start it 10 s before the hit | 0.3 |

If the user's style lists its own sounds (for example "money sounds when I talk about money"), use those and add them to the cue list by file path.

## Music

- Only when the style or the user wants it. Pick a mood from `awa-video-reel/music/library.json` (upbeat, energetic, cinematic, inspiring, chill, calm, playful, dark, dramatic, tech, and more), or their own track.
- Duck it about 10 dB under the voice. Start it where the beat lands, not on a slow intro.
- Prefer CC0 or their own tracks. CC BY tracks need the credit line in the post caption.
- Never add trending songs from Instagram or TikTok to the file. Always deliver a no-music copy so they can add one in the app.

## Loudness

- Integrated -14 LUFS, true peak under -1 dBTP. Light high-pass on the voice at 80 Hz.
- Denoise only when there's hum or room noise and the style allows it.
- Check with `ffmpeg -i final.mp4 -af ebur128=peak=true -f null -` (read the Summary at the end).

## `scripts/sound_mix.py` cue file (engines B and C)

```json
{"music": {"file": "/abs/path/track.mp3", "volume": 0.18, "start": 4.0},
 "cues": [{"t": 0.15, "name": "whoosh-short", "vol": 0.28},
          {"t": 3.40, "name": "pop", "vol": 0.22},
          {"t": 12.0, "file": "/abs/path/cash.mp3", "vol": 0.3}]}
```
- `t` is seconds on the final video's timeline. `name` is looked up in `--sfx-dir` (default: awa-video-reel's `sfx/` folder); `file` uses any sound by path.
- `music` is optional. `start` skips into the track. It loops if the video is longer.
- Run: `python3 scripts/sound_mix.py <video> work/NAME-cues.json exports/NAME-final.mp4`. It also writes `NAME-final_nomusic.mp4` when there's music.
