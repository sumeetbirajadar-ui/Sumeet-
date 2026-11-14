---
name: gemini-tts
description: Studio-grade text-to-speech with Google's Gemini 3.8 Flash TTS (gemini-3.8-flash-tts) — single-speaker narration, multi-speaker dialogue with per-line emotion, inline vocal events (<laugh>, <sigh>, <short pause>), 130 languages incl. Hebrew, Voice design (a new voice from a text description) and Voice replication (clone the user's own voice), plus a local web studio (EN/HE) for recording, cloning, dialogue and playback. Use when the user wants TTS / voiceover / narration with Gemini or Google, wants to design or clone a voice, says "gemini tts", "google tts", "clone my voice", "voice design", "voice studio", or "/gemini-tts". For ElevenLabs use ai-voice-audio instead.
allowed-tools: Bash, Read, Write, Glob
---

# Gemini 3.8 Flash TTS

One script does everything: `scripts/gemini_tts.py` (Python 3.9+, `requests`, ffmpeg on PATH). Raw REST against
`POST /v1beta/interactions` (speech) and `/v1beta/voices` (voice library, design, replication). No SDK dependency.

```
SKILL=~/.claude/skills/gemini-tts
python $SKILL/scripts/gemini_tts.py <subcommand> ...
```

**Install location:** always global, `~/.claude/skills/gemini-tts` (the user's home, never a project's `.claude/skills`). If asked to install or update this skill for someone, use `install.ps1` / `install.sh` from the repo or `git clone https://github.com/guyaga/gemini-tts-skill ~/.claude/skills/gemini-tts`, then run `doctor`.

**Env:** `GEMINI_API_KEY` (https://aistudio.google.com/apikey). Optional `ELEVEN_API_KEY` for `import-elevenlabs`.
**First run / troubleshooting:** `python $SKILL/scripts/gemini_tts.py doctor` checks Python, ffmpeg, the key, and does a tiny test render. Run it when anything fails.

## Two ways to use it

- **CLI** (what Claude uses): `speak`, `dialogue`, `voices`, `design`, `replicate`, ... Output path printed as JSON.
- **Studio** (for the human): `python $SKILL/scripts/gemini_tts.py studio` opens http://127.0.0.1:7891 with tabs Speak / Dialogue / My voices / Clone my voice, UI in English or Hebrew (toggle top-right, RTL aware), model toggle Flash / Flash-Lite. Outputs go to `outputs/`. `record` opens the same studio on the Clone tab. If the user wants to *record*, *hear*, *try voices*, or *clone their voice*, launch the studio for them (it runs in the foreground; start it in the background or tell them Ctrl+C stops it).

## Models

| Model | Use |
|---|---|
| `gemini-3.8-flash-tts` (default) | Max fidelity, acting, accents, 130 languages. Narration, audiobooks, dialogue. |
| `gemini-3.8-flash-lite-tts` (`--lite`) | Cheaper/faster, 101 languages. Bulk or realtime. |

Output is 24 kHz mono 16-bit WAV natively. Pass `-o file.mp3` (or .ogg/.flac) and ffmpeg converts.

## Prompting rules (3.8 schema, not the old one)

- The text is a **verbatim transcript**. Never write "Say cheerfully:" or "Speaker 1:" in the text; it will be read aloud.
- Sustained delivery goes in `--style` (maps to `speech_metadata.style`): `"warm, slow, storytelling"`, `"whispered urgently"`, `"דוגרי, קצב של מרצה"`. One short phrase; long director's notes hurt.
- Point-in-time events go **inline in angle brackets**: `<laugh> <chuckle> <giggle> <sigh> <gasp> <breath> <exhales> <cough> <throat-clearing> <yawn> <whispers> <snicker> <groan> <phew> <short pause> <long pause>` (+ argh, cackle, cheer, cry, growl, grunt, hiss, moan, pant, scream, shout, shriek, sneeze, snort, sob, tsk, whimper). Human vocalizations only, no SFX.
- Emphasis: CAPITALS on key words, `...` and `--` for hesitation. Backchannels between pipes `|mm-hmm|`.
- Identity (age, gender, accent, timbre) = the voice. Emotion = style. Don't fight the voice with style.
- Long text: `speak` auto-chunks at ~6000 chars on paragraph/sentence boundaries and concatenates losslessly (`--chunk-chars`).
- Language is auto-detected from the text; any voice speaks any of the 130 languages.

**"My voice":** when the user asks for their own voice, run `registry` first and use the alias of the `replicated` entry (if there are several, ask which). If none exists, offer to open `record` to clone it. Their cloned voice speaks any language, so Hebrew text in = Hebrew narration in their voice.

## Speak (single speaker)

```bash
python $SKILL/scripts/gemini_tts.py speak "Hey! <laugh> Welcome back. <short pause> Let's begin." \
  --voice Sulafat --style "warm, upbeat, a little playful" -o out.wav
python $SKILL/scripts/gemini_tts.py speak --file script.txt --voice Charon --style "calm documentary narrator" -o narration.mp3
echo "טקסט בעברית" | python $SKILL/scripts/gemini_tts.py speak --voice Kore -o he.wav
```
`--voice` accepts a prebuilt name (`Kore`, `Puck`, `Charon`, `Sulafat`...), an Extended Library id (`ar-001-advisor-1`), a `voice_...` id, a `voicekey_...`, or a local alias from `voices.json`.

## Dialogue (multi speaker, or one narrator with per-line emotion)

Script file, one turn per line, optional style in brackets, `#` comments. JSON `[{"speaker","text","style"}]` also works.
```
Dana [excited]: Guy, did you see the new TTS model?
Guy [skeptical, dry]: Another one? <sigh> How good can it be.
Dana: Listen. <laugh> It does laughs, pauses, everything.
```
```bash
python $SKILL/scripts/gemini_tts.py dialogue script.txt --speakers "Dana=Leda,Guy=Orus" -o dialogue.wav
```
Every speaker gets a voice (defaults if unmapped). Custom/cloned voices work here too.
**One speaker on every line = single narrator with a different `[style]` per line.** The tool switches to single-voice mode automatically (the conversational config rejects one speaker). This is the way to do emotional narration. Ready-made emotional-range scripts: `examples/emotions_en.txt`, `examples/emotions_he.txt`.

## Voices

```bash
python $SKILL/scripts/gemini_tts.py prebuilt                       # the 30 studio voices + character
python $SKILL/scripts/gemini_tts.py voices --lang en-US --gender female --limit 30
python $SKILL/scripts/gemini_tts.py voices --type prompted replicated   # the user's custom voices
python $SKILL/scripts/gemini_tts.py voice-get <alias|voice_id> --sample-out preview.wav
python $SKILL/scripts/gemini_tts.py voice-delete <alias|voice_id>
python $SKILL/scripts/gemini_tts.py registry                       # local aliases (voices.json)
```
Quick picks: Sulafat (warm), Charon (informative), Kore (firm), Puck (upbeat), Leda (youthful), Orus (firm male), Enceladus (breathy), Algenib (gravelly), Gacrux (mature). The Extended Library has hundreds more per language (`voices --lang xx-XX`); as of 2026-09 it lists no he-IL entries but every voice speaks Hebrew fine.

## Voice design (persona from text, persistent voice_ id)

```bash
python $SKILL/scripts/gemini_tts.py design --name "Warm Israeli Narrator" --alias narrator \
  --prompt "A calm Israeli man in his 40s, warm baritone, slight Hebrew accent in English, relaxed documentary pacing." \
  --gender male --lang he-IL
```
Prompt = 1–2 sentences of immutable traits. Returns `voice_...`, saves a preview WAV to `samples/`, stores the alias in `voices.json`. Stored voices: max 200 per project, 1-year TTL. `--stateless` gives a temporary key instead.

## Voice replication (clone the user's own voice)

Google needs **two clips from the same real adult person**:
1. **Consent clip**: the exact consent sentence (`consent <locale>` prints it; 30 locales, Hebrew not among them, English is fine).
2. **Sample clip**: ~10–30 s of clean natural speech, any language. Speak the way the clone should sound.

**Cross-language gotcha (verified):** English consent + Hebrew sample fails Google's speaker check with "Voice mismatch detected", even for the same person on the same mic. Fix: send the sample as *consent clip + ≤30 s of speech*. `--prepend-consent` on the CLI; the studio has this ticked by default. Consent + 30 s passes, consent + 45 s fails.
**Synthetic/TTS audio is rejected** ("failed safety checks"). Google surfaces both failures as an opaque HTTP 500; the script extracts the real reason.

Easiest path is the studio: `python $SKILL/scripts/gemini_tts.py record`. CLI:
```bash
python $SKILL/scripts/gemini_tts.py replicate --source sample.wav --source-seconds 30 --prepend-consent \
  --consent consent.wav --name "My Voice" --alias me
python $SKILL/scripts/gemini_tts.py speak "Hi, it's me." --voice me -o me.wav
python $SKILL/scripts/gemini_tts.py import-elevenlabs --list       # reuse original uploads from an ElevenLabs clone
```
`--stateless` = 7-day `voicekey_...`, nothing stored at Google. Otherwise a stored `voice_...` (1 year, counts toward 200).

## Files
- `scripts/gemini_tts.py` CLI + local server, `scripts/studio.html` the web studio
- `voices.json` local alias registry, `samples/` design previews, `recordings/` clips, `outputs/` generated audio (all git-ignored, personal)
- `examples/` ready scripts

## Gotchas learned
- Interactions API returns audio at `steps[0].content[0].data` (base64 WAV), not `output_audio`; handled.
- Request keys are snake_case (`source_audio`, `mime_type`); camelCase is rejected.
- `voices --search` is free text but does not find custom voices by name; filter `--type prompted replicated`.
- The multi-speaker (`conversational`) config needs ≥2 speakers; one speaker = "Invalid input received". `dialogue` handles it.
- Prebuilt names are case-insensitive in the list (`kore`) but use the capitalized form in requests.
