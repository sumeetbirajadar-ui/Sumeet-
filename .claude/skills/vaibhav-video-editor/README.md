# Vaibhav AI Video Editor

**One command, raw clip to finished video.** Vaibhav AI Video Editor is a Claude Code skill that runs your video editing skills as one professional pipeline: it cuts silences and retakes, plans the edit from what you say, adds captions, motion graphics, face-tracked effects, transitions, camera moves, b-roll, sound effects and music, checks its own work, and exports the final MP4.

It doesn't replace your other video skills. It directs them: each moment in your video goes to the tool that does it best, and everything follows one plan that you approve first.

Made by Vaibhav ([@vaibhavv.ai](https://instagram.com/vaibhavv.ai)).

## Make a video with an AI voiceover (quick start)

No camera, no editing skills. You give it a script or a topic; it makes the voice, animates every word and adds the sound.

1. **Install** Claude Code, then the two things this mode needs (Claude can do both for you, see Install below):
   - this skill, and
   - HyperFrames: in Claude Code type `/plugin marketplace add heygen-com/hyperframes`, then `/plugin install hyperframes@hyperframes`.
   You also need ffmpeg and Python 3 (Claude checks and offers to install them).
2. **Ask:**
   > /vaibhav-video-editor make a 25 second animated reel with a voiceover from this script: …
3. **Approve** the script and the storyboard it shows you. It renders, checks its own work, and gives you the MP4 (1080x1920, 60 fps), a no-music copy and the voice file.

The free voice (Kokoro) runs on your computer; the first time, the skill asks before a one-time setup (about 500 MB). For more natural voices, add an ElevenLabs or Google Gemini key (see Voices below). The look and pace of the example video are a preset: say *"in kinetic promo style"*, and *"brisk"* (default, about 1.2x), *"normal"* or *"fast"* for the pace.

## What it does

| Stage | What happens |
|---|---|
| 0. Preflight | Checks which tools and skills you have and offers to install anything missing |
| 1. Brief and style | Loads your saved editing style (or a clean default) and asks only what it needs |
| 2. Prepare | Transcribes with word timings and fixes misheard names |
| 3. Clean cut | Removes silences, fillers, false starts and repeated takes |
| 4. B-roll | If you mention a website, offers to record it being used |
| 5. Storyboard | Shows the whole plan as a table (what's said, what appears, which tool, transition, sound) and waits for your OK |
| 6. Build | Renders effects, captions, cards, motion graphics and camera moves |
| 7. Sound | Sound effects on every visual beat, music ducked under your voice, mixed to -14 LUFS |
| 8. Quality check | Checks stills at every beat for faces, safe zones, spelling and timing, plus loudness |
| 9. Deliver | Final MP4, a no-music copy for trending sounds, credits, and an optional post caption |
| Voiceover mode | No footage: script → AI voice → fully animated video timed to every word |

## What you need

- **Claude Code** (desktop app Code tab, or the terminal): claude.com/download
- **ffmpeg** and **Python 3**. Node.js 20+ and Google Chrome for motion graphics and website b-roll.
- **At least one engine** below. The more you install, the more it can do.

| Component | What it adds | Get it |
|---|---|---|
| awa-video-reel | One-pass reel edits (up to 60 s): effects, captions, cards, website b-roll, music and sound effects | by Awa K. Penn (awa-newsletter.beehiiv.com) |
| Video Editor plugin | Any length: silence cuts, captions, titles, zooms, overlays, shorts from long videos, your saved style | mavgpt.ai/resources/make-videos-using-claude |
| HyperFrames | Designed motion graphics, kinetic type, logo animations, background removal, voices and 21 sound effects. **Needed for voiceover videos** | in Claude Code: `/plugin marketplace add heygen-com/hyperframes` then `/plugin install hyperframes@hyperframes` |
| effects | 45 face-tracked effects (orbit, spotlight, checklist, glass graph...) | `git clone https://github.com/Vibha-Ramprakash/claude-video-effects ~/.claude/skills/effects` |
| brand-nat-styles | The Brand Nat Style Guide: 105 video styles with short codes (H10 C9 L4 X1...). Pick styles in the visual guide, copy the prompt and paste it with your video | made by Brand Nat, free to use on your own videos: get it from Brand Nat, then put the folder in `~/.claude/skills/brand-nat-styles/`. Say "show me the styles" to open the guide |
| multicam-shot | AI camera-pass prompts for Seedance 2.0 Fast | `git clone https://github.com/aipauloshimas/kinetic-multicam ~/.claude/skills/multicam-shot` |
| remotion-best-practices | Remotion rules, if your style builds in Remotion | the Remotion skill |

Nothing installed yet? Vaibhav AI Video Editor tells you what's missing and what each piece is for, and asks before installing anything.

## Install

**Easiest:** open Claude Code and paste:

> Install the skill from https://github.com/V413havai/vaibhav-video-editor into ~/.claude/skills/vaibhav-video-editor

Claude does the rest. Then restart Claude Code.

**Or in a terminal** (Mac and Linux):

```bash
git clone https://github.com/V413havai/vaibhav-video-editor ~/.claude/skills/vaibhav-video-editor
```

On Windows (PowerShell):

```powershell
git clone https://github.com/V413havai/vaibhav-video-editor "$HOME\.claude\skills\vaibhav-video-editor"
```

Then restart Claude Code and type `/vaibhav-video-editor`.

**No git?** On the GitHub page click **Code → Download ZIP**, unzip it, rename the folder to `vaibhav-video-editor`, and move it into `~/.claude/skills/` so you have `~/.claude/skills/vaibhav-video-editor/SKILL.md`. (`~` is your home folder: `/Users/<you>` on a Mac, `C:\Users\<you>` on Windows. The `.claude` folder may be hidden.)

**Update to the latest version:**

```bash
git -C ~/.claude/skills/vaibhav-video-editor pull
```

**First run:** the skill checks your tools and other video skills and tells you what's missing (see the table above). It asks before installing anything.

## Use it

Drag a video into Claude Code and type:

```
/vaibhav-video-editor edit raw/my-reel.mp4 start to finish
/vaibhav-video-editor edit this with H10 C9 L4 X1 M1 S1, cinematic, music upbeat
/vaibhav-video-editor full edit, clean look, no music, end card @myhandle
/vaibhav-video-editor turn this 20 minute podcast into 3 finished shorts
```

It shows you a plan first and only renders after you say go. Then tell it changes in plain words: *"captions bigger"*, *"zoom when I say insane"*, *"the cut at 0:14 is too sudden"*.

**Voices.** No footage? Say *"make an animated video about my 5 favourite AI tools with a voiceover"*. It writes the script (you approve it), voices it line by line, and animates every word in HyperFrames. Voices:

| Voice | Cost | Setup |
|---|---|---|
| ElevenLabs | paid (free plan: credit line, non-commercial) | add `export ELEVENLABS_API_KEY=your-key` to `~/.zshrc` |
| Google Gemini TTS | free key, free-tier limits | free key at aistudio.google.com/apikey, then `export GEMINI_API_KEY=your-key` |
| HeyGen | free with sign-in | `npx hyperframes auth login` |
| Kokoro | free, offline | one-time setup in its own Python 3.12 environment (the skill does it, after asking) |

Keys stay in your own environment: never paste them into the chat.

**Style presets.** Say *"in kinetic promo style"* for the clean, quick faceless look of the example reel (big kinetic type with a yellow key word, motion graphics that act out each line, zoom-through transitions, a comment CTA card; `examples/kinetic-promo/`). Say *"edit this in Nick style"* for the look of Nick Saraev's AI-tool reels: glowing browser cards over a soft background, a numbered header, big stat callouts, 1 to 3 word captions with a blue keyword, pause-free pacing and a comment-keyword CTA. Presets live in `references/styles/`, and adding one is a single Markdown file.

**Your own style.** If you've saved a style with `/video-editor:start` or `/video-editor:style` (it lives at `~/.claude/skills/my-video-style/`), Vaibhav AI Video Editor follows it on every edit. Say *"add that to my style"* any time. Without one, it uses a clean, professional house style.

## What's inside

```
vaibhav-video-editor/
├── SKILL.md                      the pipeline Claude follows
├── README.md                     this file
├── LICENSE
├── references/
│   ├── toolkit.md                every component: what it's best at, how it's used, fallbacks, credits
│   ├── beat-map.md               which visual fits which moment, and how every Brand Nat code is built
│   ├── transitions-sound.md      transitions, sound-effect cues, music and loudness rules
│   ├── house-style.md            the default style: canvas, safe zones, captions, pace
│   ├── quality-check.md          the checklist run on every render
│   └── styles/
│       ├── kinetic-promo.md      style preset: the clean, quick voiceover reel look
│       └── nick-saraev.md        style preset: Nick Saraev's reel look (plus a classic variant)
├── examples/kinetic-promo/       a full voiceover reel: script, build and the commands to remake it
└── scripts/
    ├── preflight.sh              finds your tools and skills
    ├── voice_lines.py            voices a script line by line at a chosen pace, one track + word timings
    ├── voiceover.py              AI voice from a script (ElevenLabs, Gemini, HeyGen, Kokoro) + word timings
    ├── check_words.py            catches transcript timing drift against the real speech gaps
    ├── apply_keep.py             makes the clean cut (click-free joins, plus a time map)
    └── sound_mix.py              sound effects + ducked music, two-pass -14 LUFS, plus a no-music copy
```

## Good to know

- It never modifies your original footage and never posts or uploads anything.
- It never puts graphics over your face, keeps text inside the Reels and TikTok safe zone, and never invents numbers.
- Trending songs are copyrighted: add them in the app on the no-music copy.
- Watch every video before you post it.

## Credits

Vaibhav AI Video Editor orchestrates other people's excellent work. Please keep these credits when you share it:
effects engine by Vibha Ramprakash (@vibha.in.progress, MIT) · awa-video-reel by Awa K. Penn (MIT) · MultiCam shot by The Creator Stack / pauloshimas (MIT) · Brand Nat Style Guide by Brand Nat · HyperFrames by HeyGen · Remotion · Video Editor plugin by mavgpt.ai · sound effects in awa-video-reel from Pixabay · Kokoro-82M (Apache 2.0).

## License

MIT. See `LICENSE`. The skills it calls keep their own licences.
