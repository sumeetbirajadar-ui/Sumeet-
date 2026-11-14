# Example: kinetic promo with an AI voice

The 25-second "I didn't edit this video" reel, made from a script with no camera footage: a free Kokoro voice, kinetic type, motion graphics that act out each word, zoom-through transitions, punch-ins and a sound effect on every motion. Style preset: `references/styles/kinetic-promo.md`.

## Remake it (or use it as a starting point)

Ask Claude: *"Make a kinetic promo video from this script with a voiceover"* and paste your lines. Claude follows the skill's voiceover mode. By hand, from this folder:

```bash
python3 ../../scripts/voice_lines.py lines.txt work --name promo --pace brisk --provider kokoro --voice am_michael --min-hold "2:2.3,10:1.7,11:1.75,12:1.75"
```

```bash
mkdir -p assets && cp work/promo-voice.wav assets/voice.wav && python3 build.py work/promo-voice-words.json
```

```bash
npx --yes hyperframes@0.8.226 check && npx --yes hyperframes@0.8.226 render . -o work/render.mp4 --fps 60
```

```bash
python3 ../../scripts/sound_mix.py work/render.mp4 cues.json work/promo-final.mp4
```

## Files

- `lines.txt`: the script, one spoken line per row (each list item is its own line, so it gets its own beat).
- `build.py`: writes the HyperFrames composition (`index.html`) and the sound cues (`cues.json`) from the word timings. Every entrance is `t("word")`, so it re-times itself when the voice changes. A different script needs its own scenes: keep the helpers and the look, rewrite the scene markup and key times.
- `hyperframes.json`, `package.json`: the HyperFrames project files.

Work files (`work/`, `assets/voice.wav`, `index.html`, `cues.json`) are made by the commands above.
