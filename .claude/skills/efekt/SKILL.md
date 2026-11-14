---
name: efekt
description: Add motion-design effects to a talking-head video with HyperFrames (spot, cam, belgesel, yörünge, grafik, liste, kurgu). Effects follow the speaker's face and can put text behind their head. Use when the user types /efekt, names one of the effects, or asks (in Turkish or English) to add an effect, a glowing word behind them, glass widgets, a chart, a checklist or an editing timeline to their video.
---

# efekt: video effects that follow your face

The user is often not technical. Reply in the user's language (Turkish if they write Turkish), keep it short, and do
the work: never ask them to run commands. Paths below are relative to this skill's folder; use its absolute path.

## 1. First run (once)
Run `bash scripts/setup.sh`. It prints `READY` (1–3 minutes the first time).
- `NEED_FFMPEG`: Mac `brew install ffmpeg`, Windows `winget install ffmpeg`.
- `NEED_NODE`: Mac `brew install node`, Windows `winget install OpenJS.NodeJS.LTS`.
- `NEED_PYTHON`: Mac `brew install python@3.12`, Windows `winget install Python.Python.3.12`. Then run setup again.

## 2. The video and the effect
- Video: dragged into the chat or a path. A vertical phone video with the person in frame works best.
- Effect: from `/efekt <name>` or the user's words; match them to the table. Unsure: show the table.
- Timing: "3. saniyeden 6'ya", "başta", "sonda". No timing given: 3 seconds from where the person starts talking,
  or ask one short question. 2–4 s per effect looks best.

## 3. Check, then render
1. Write the plan next to the video as `<video>_efekt.json`:
   ```json
   {"effects": [
     {"fx": "spot", "start": 1.0, "end": 4.0, "text": "CLAUDE"},
     {"fx": "liste", "start": 6.0, "end": 9.0}
   ]}
   ```
2. Check frames first: `.venv/bin/python scripts/efekt.py <video> <folder> --plan <plan.json> --still 2,7.5`
   (the middle of each effect). Look at the PNGs yourself. Text on the face, cut off at an edge, unreadable: fix the
   text or timing and check again.
3. Render: `.venv/bin/python scripts/efekt.py <video> <video>_efekt.mp4 --plan <plan.json>`. The video's own sound
   is kept. The first run also cuts the person out of the room (a minute or two); later runs reuse it.
4. Tell the user where the file is, and to watch it before posting.

One effect needs no plan: `.venv/bin/python scripts/efekt.py <video> <out.mp4> --fx spot --start 1 --end 4 --text CLAUDE`
(more options: `--opt key=value`, repeatable; pictures for `yorunge`: `--images <folder>`).

## The effects
| name | what happens | options |
|---|---|---|
| `spot` | The lights go out, the person stays lit, a glowing word appears behind their head | `text`, `color`, `push` |
| `cam` | Frosted glass widgets float around the head: a big number, a render bar, a mini chart, a profile pill, an HD badge, "Claude ile düzenlendi" | `text` (number), `handle`, `label` |
| `belgesel` | Black and white on a magenta ground, a three-line stamped headline, a Follow button that gets clicked, a name bar | `text` (lines with \|), `name`, `handle`, `kicker` |
| `yorunge` | The user's reels orbit the head, behind them at the top, in front at the bottom | `images`, `count`, `size`, `turns` |
| `grafik` | A chart card slides down over the top half, the person moves to the bottom half, bars rise and count up | `title`, `lead`, `bars` (`11.2K::label\|…`), `values=0` (no figures) |
| `liste` | A task card under the chin: each step spins, then ticks green | `text` (`step::meta\|…`), `title` |
| `kurgu` | An editing timeline on top with tracks and a glowing playhead, a warm film grade below | `title`, `lead`, `tc`, `caps` (caption chips, `a\|b\|c`), `effects` (effect chips, `a\|b\|c\|d`) |

## Rules
- Never cover the face. If a check frame shows text on it, shorten the text or move the effect in time.
- Numbers on screen (charts, counters) must be the user's real numbers: ask for them, never invent them.
- Effects can follow each other; overlapping two camera effects (`spot`, `grafik`, `kurgu`) is not supported.
- These effects add pictures only, no sound or captions.
