# elevenlabs-claude-skill

A Claude Code skill that generates voiceovers, clones voices, creates sound effects, and batch-processes scripts using the ElevenLabs API — directly from your terminal.

Built for developers who create content alongside code. Turn a markdown script into 5 voiceovers in one command. Clone your voice and narrate your demo video. Generate sound effects for your app prototype. All without leaving Claude Code.

## Demo

```
> /elevenlabs speak "Welcome to ElevenLabs. The voice AI platform for developers."

Generated: audio/speech.mp3 (66KB, 4.2s)
```

```
> /elevenlabs batch launch-script.md

[1/3] audio/batch/01_intro.mp3 (65KB)
[2/3] audio/batch/02_features.mp3 (153KB)
[3/3] audio/batch/03_closing.mp3 (96KB)

Done. 3 files in audio/batch/
```

```
> /elevenlabs sfx "futuristic notification ping"

Generated SFX: audio/sfx/ping.mp3 (33KB, 2.0s)
```

## Install

### 1. Install the ElevenLabs Python SDK

```bash
pip3 install elevenlabs
```

### 2. Set your API key

Get your key from [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys).

```bash
export ELEVENLABS_API_KEY="sk_your_key_here"
```

Add to your `.zshrc` / `.bashrc` to persist.

### 3. Copy the skill to Claude Code

```bash
mkdir -p ~/.claude/skills/elevenlabs-content
cp SKILL.md ~/.claude/skills/elevenlabs-content/SKILL.md
```

Or clone this repo and symlink:

```bash
git clone https://github.com/thomasblc/elevenlabs-claude-skill.git
ln -s $(pwd)/elevenlabs-claude-skill/SKILL.md ~/.claude/skills/elevenlabs-content/SKILL.md
```

### 4. Restart Claude Code

The skill appears automatically. Type `/elevenlabs` to use it.

## Commands

| Command | What it does |
|---|---|
| `/elevenlabs speak "text"` | Generate speech from text → saves MP3 |
| `/elevenlabs clone path/to/sample.mp3` | Clone a voice from an audio sample (1-2 min) |
| `/elevenlabs voices` | List all available voices (premade + cloned) |
| `/elevenlabs batch script.md` | Generate one MP3 per `##` section in a markdown file |
| `/elevenlabs sfx "description"` | Generate a sound effect from a text prompt |

### Options

**`/elevenlabs speak`** accepts:
- `--voice <name or ID>` — pick a voice (default: George)
- `--model v3|flash|multilingual_v2` — pick a model (default: multilingual_v2)
- `--output filename.mp3` — custom output path

**`/elevenlabs batch`** accepts:
- `--voice <name or ID>` — voice for all sections
- Files are saved to `./audio/batch/` with section names as filenames

**`/elevenlabs sfx`** accepts:
- `--duration <seconds>` — length (0.5-30s, default: 3)
- `--output filename.mp3` — custom output path

## Models

| Model | Speed | Languages | Best for |
|---|---|---|---|
| `eleven_v3` | Slower | 70+ | Highest quality, most expressive |
| `eleven_multilingual_v2` | Medium | 70+ | Default, good balance |
| `eleven_flash_v2_5` | <75ms | 32 | Real-time, lowest latency |
| `eleven_turbo_v2_5` | Fast | 32 | Speed + quality balance |

## Batch format

The `/elevenlabs batch` command reads a markdown file and splits it by `## ` headers. Each section becomes one MP3.

```markdown
## Intro
Welcome to our product. This is the intro voiceover.

## Feature walkthrough
Here we show the main features of the API.

## Call to action
Sign up today at example.com. Your first 10,000 characters are free.
```

Output:
```
audio/batch/01_intro.mp3
audio/batch/02_feature_walkthrough.mp3
audio/batch/03_call_to_action.mp3
```

## Voice cloning

Instant voice cloning requires a [Starter plan](https://elevenlabs.io/pricing) ($5/mo) or higher.

1. Record 1-2 minutes of clean speech (iPhone Voice Memos works great)
2. No background noise, consistent volume, single speaker
3. Run: `/elevenlabs clone ~/Desktop/my-voice.m4a`
4. Get back a `voice_id`
5. Use it: `/elevenlabs speak "Hello" --voice <voice_id>`

## Pricing

| Tier | Credits/mo | Approx minutes | Voice cloning |
|---|---|---|---|
| Free | 10,000 | ~10 min | No |
| Starter ($5) | 30,000 | ~30 min | Instant |
| Creator ($22) | 100,000 | ~100 min | Professional |

1 credit = 1 character on standard models, 0.5 on Flash/Turbo.

## How it works

This skill is a `SKILL.md` file that teaches Claude Code how to use the ElevenLabs Python SDK. When you invoke `/elevenlabs`, Claude reads the skill instructions and writes + executes a Python script inline. No separate server, no daemon, no build step.

The skill does NOT use the ElevenLabs MCP server — it calls the API directly via the official Python SDK for simplicity and portability.

## Requirements

- Python 3.8+
- `elevenlabs` Python package (v2.41.0+)
- `ELEVENLABS_API_KEY` environment variable
- Claude Code

## License

MIT

## Author

[Thomas Blanc](https://linkedin.com/in/thomasblanc2)
