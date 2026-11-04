# Reels toolkit

Tools for editing Instagram Reels. Give it a raw clip (landscape or vertical)
and it returns a 1080x1920 Reel with silences cut, the speaker kept in frame,
clean voice, word-by-word captions, a hook title, a progress bar, and a cover image.

```bash
bash reels/setup.sh                       # once per session (the container resets)
python3 reels/reel.py auto raw.mp4 --hook "3 habits of KCET toppers" --progress
# everything on: background swap, jump zooms, teal-orange grade, sound effects
python3 reels/reel.py auto raw.mp4 --hook "..." --progress --bg studio.jpg --punch --look blockbuster --vignette --sfx --music bed.mp3
# -> raw_reel.mp4, raw_reel.cover.jpg, raw_reel_work/ (steps + words.json)
```

If a caption word is wrong, fix it in `raw_reel_work/words.json` and run the same
command again. Your fixed transcript is kept, so only the render runs again.

Music libraries, colour grading by mood, camera moves, background tips, editing
apps and how Instagram ranks Reels are covered in **[GUIDE.md](GUIDE.md)**.

## Commands

| Command | What it does | Built on |
|---|---|---|
| `cut` | Removes silences but keeps 0.25s of padding, so word endings aren't cut off | auto-editor |
| `vertical --mode face` | 9:16 crop that follows the speaker's face, with smoothing so the frame doesn't shake | OpenCV YuNet face detector |
| `vertical --mode blur` | Shows the whole frame in the middle with a blurred copy behind it (for screen recordings and slides) | ffmpeg |
| `audio` | Removes low rumble, reduces noise, compresses, sets loudness to −14 LUFS | ffmpeg |
| `music --music song.mp3` | Adds background music that gets quieter while you talk | ffmpeg sidechain compressor |
| `transcribe --lang kn/hi/en` | Writes an editable `words.json` with the time of every word | faster-whisper |
| `captions` | Animated captions: 3 words at a time, the current word pops in colour | libass (ASS subtitles) |
| `export` | H.264 High, 30 fps, AAC 48 kHz, faststart, ≤12 Mbps | ffmpeg |
| `cover` | 1080x1920 cover, title placed inside the square the profile grid shows | Pillow |
| `grade --look moody` | Mood colour grade (9 looks), or any `.cube` LUT, plus grain/vignette | ffmpeg lut3d |
| `luts` / `looks` | Writes the looks as `.cube` files in `luts/` (for CapCut/Resolve too) / lists them | numpy |
| `motion` | Punch-in jump zooms at each phrase, slow push-in, impact shake | OpenCV |
| `bg --bg blur\|#hex\|img\|video` | Blurs or replaces the background behind the person | MediaPipe selfie segmentation |
| `sfx --cues pop@0.2,whoosh@3` | Places sound effects. `sfx-kit` rebuilds the built-in royalty-free kit in `sfx/` | numpy synthesis |

Useful options: `--lang kn` (Kannada) or `--lang hi` (Hindi) switch the font
automatically. `--prompt "KCET, NEET, Newton"` helps Whisper spell names.
`--model medium` is more accurate but slower. `--highlight green` changes the word colour.
`--pos 0.6` moves captions up. `--words 2` shows fewer words at a time.
`--no-cut` keeps all pauses.

## Instagram target specs used

1080x1920 (9:16), H.264 + AAC in MP4, 30 fps, loudness about −14 LUFS.
Captions and titles stay out of the top ~250 px and bottom ~350 px, where
Instagram draws its own buttons and text. Reels over 3 minutes are
reportedly not shown to non-followers. Sources differ on exact bitrate and
length limits, so check in the app before a big upload.

## Research: what's out there and what was chosen

**Used here (CPU-friendly, no paid API):**
- [auto-editor](https://github.com/WyattBlue/auto-editor): silence and dead-air removal. Users report it can clip
  word endings, which is why a margin is always kept.
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper): speech-to-text with word timestamps, Kannada and Hindi included.
  [WhisperX](https://github.com/m-bain/whisperX) gives tighter word timing (wav2vec2 alignment) but works best with a GPU.
- [OpenCV YuNet](https://github.com/opencv/opencv_zoo): face detection for auto-reframing. Picked over MediaPipe, whose
  current Python build no longer ships the old `solutions` API.
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect): finds shot changes (installed, for multi-shot edits).
- [Demucs](https://github.com/facebookresearch/demucs): separates voice from music (`setup.sh --full`).
- [Piper](https://github.com/rhasspy/piper): offline text-to-speech for voiceovers and test clips.
- ffmpeg + libass: all rendering, captions, ducking, loudness.

**Looked at, not used yet:**
- [Remotion](https://github.com/remotion-dev/remotion) / Revideo: React or TypeScript motion graphics. Good for designed
  intros and animated explainers. Remotion needs a paid licence for companies above a small size.
- [MoviePy](https://github.com/Zulko/moviepy): Python compositing. Slower than plain ffmpeg for this work.
- [Google AutoFlip](https://opensource.googleblog.com/2020/02/autoflip-open-source-framework-for.html),
  [auto-vertical-reframe](https://github.com/KazKozDev/auto-vertical-reframe): heavier auto-reframe projects. The
  face tracker here covers the talking-head case.
- [Robust Video Matting](https://github.com/PeterL1n/RobustVideoMatting): background removal without a green screen.
  GPLv3 licence and slow on CPU.
- Real-ESRGAN (upscaling) and RIFE (slow motion): need a GPU to be practical.
- vidpipe and VEED OpenEdit: AI clip pipelines. vidpipe needs a paid Copilot subscription, and OpenEdit's renderer
  is closed source and in beta.
- Connectors available in Claude: Descript (text-based editing), OpusClip (long video to clips, needs a Pro plan),
  ElevenLabs (voices and music), vidIQ (titles, thumbnails, trends).
