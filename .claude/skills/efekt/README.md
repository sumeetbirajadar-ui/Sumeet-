# efekt: video effects for Claude Code

Drop a talking-head video into Claude Code and type `/efekt spot`. Claude finds your face, cuts you out of the room
and renders the effect with [HyperFrames](https://hyperframes.heygen.com): a glowing word behind your head, glass
widgets around it, a chart, a checklist, an editing timeline. No editing app, no timeline of your own.

By [@isamercanai](https://instagram.com/isamercanai).

## Kurulum / Install (one line)

Terminal (Mac / Linux, or the terminal inside Claude Code):

```bash
git clone https://github.com/isamercan/claude-efekt ~/.claude/skills/efekt
```

Windows (PowerShell): `git clone https://github.com/isamercan/claude-efekt $HOME\.claude\skills\efekt`

Restart Claude Code. Or just ask Claude: *"github.com/isamercan/claude-efekt skill'ini ~/.claude/skills/efekt içine kur"*.
The first effect sets itself up (ffmpeg, Node and Python; Claude installs what is missing).

## Kullanım / Use

1. Open Claude Code and drag your video into the chat.
2. Type what you want:

```
/efekt spot 1. saniyeden 4'e kadar, arkamda CLAUDE yazsın
/efekt cam ilk 3 saniye
/efekt liste sonda
/efekt grafik 6–9 sn, rakamlar: 11.2K, 6.5K, 3.1K
```

Claude checks a few frames first, fixes anything that covers your face, then renders `<video>_efekt.mp4` next to your
original, with your sound.

## The 7 effects

| type | what happens |
|---|---|
| `spot` | The lights go out, you stay lit, a glowing word behind your head |
| `cam` | Frosted glass widgets float around your head |
| `belgesel` | Black and white on magenta, a stamped headline, a Follow button gets clicked |
| `yorunge` | Your reels orbit your head, behind you at the top, in front at the bottom |
| `grafik` | A chart card pushes you to the bottom half, the bars rise and count up |
| `liste` | A task list under your chin ticks green, step by step |
| `kurgu` | An editing timeline with a glowing playhead, a warm film look |

## Notes
- Vertical phone videos with you in frame work best. Renders are 1080 px wide.
- Charts and counters should show your real numbers: tell Claude what they are.
- It drafts, you approve: watch the result before you post.

## How it works
`scripts/face.py` tracks your face (OpenCV YuNet), HyperFrames' `remove-background` cuts you out, and
`scripts/efekt.py` writes a HyperFrames composition (your video, a layer behind you, the cut-out, a layer in front)
from the effect files in `effects/`, then renders it. Add an effect: one `effects/<name>.js` (+ `.css`).

## Credits
The "one clip, many edits" idea comes from [@vibha.in.progress](https://instagram.com/vibha.in.progress)'s
claude-video-effects; this is an independent HyperFrames implementation. Face detection: OpenCV YuNet (MIT).
Fonts: SIL OFL 1.1 (`templates/fonts/`). Code: MIT.
