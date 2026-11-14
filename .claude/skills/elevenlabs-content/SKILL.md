---
name: elevenlabs-content
description: Generate voiceovers, clone voices, create sound effects, and batch-process scripts using ElevenLabs API. Developer content creation from the terminal.
command: elevenlabs
---

# ElevenLabs Content Skill

Generate audio content using the ElevenLabs API directly from Claude Code. Text-to-speech, voice cloning, sound effects, and batch processing for developer content workflows.

## Prerequisites

- Python 3.8+ with `elevenlabs` package installed (`pip3 install elevenlabs`)
- Environment variable `ELEVENLABS_API_KEY` set with a valid ElevenLabs API key
- Output directory `./audio/` will be created automatically

## Commands

### `/elevenlabs speak "text"` — Generate speech
Generate a voiceover from text. Saves to `./audio/`.

**Options the user may specify:**
- Voice name or ID (default: "George" — warm storyteller)
- Model: `v3` (highest quality), `flash` (fastest), `multilingual_v2` (default, good balance)
- Language: auto-detected from the text. The same cloned voice works in 70+ languages — clone in French, generate in English, Spanish, German, etc.
- Output filename

**Implementation:** Write and run a Python script:
```python
import os, sys
from elevenlabs.client import ElevenLabs

client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
os.makedirs("audio", exist_ok=True)

text = "<USER_TEXT>"
voice_id = "<VOICE_ID or default JBFqnCBsd6RMkjVDRZzb>"
model = "<MODEL or default eleven_multilingual_v2>"
output = "<FILENAME or default audio/speech.mp3>"

audio = client.text_to_speech.convert(
    text=text,
    voice_id=voice_id,
    model_id=model,
    output_format="mp3_44100_128",
)
with open(output, "wb") as f:
    for chunk in audio:
        f.write(chunk)
print(f"Generated: {output} ({os.path.getsize(output)} bytes)")
```

### `/elevenlabs clone <path>` — Clone a voice
Create an instant voice clone from an audio sample (MP3/M4A/WAV, 1-2 min of clean speech).

**Requires:** Starter plan ($5/mo) or higher. Free tier does not support voice cloning.

**Implementation:**
```python
import os
from elevenlabs.client import ElevenLabs

client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])

name = "<VOICE_NAME>"
audio_path = "<PATH_TO_AUDIO_FILE>"

with open(audio_path, "rb") as f:
    voice = client.voices.ivc.create(
        name=name,
        files=[f],
        description="Cloned voice for content creation"
    )
print(f"Voice cloned: {voice.voice_id}")
print(f"Name: {name}")
print(f"Use with: /elevenlabs speak 'text' --voice {voice.voice_id}")
```

### `/elevenlabs voices` — List available voices
Show all voices including cloned ones.

**Implementation:**
```python
import os
from elevenlabs.client import ElevenLabs

client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
voices = client.voices.get_all()

print(f"{'Name':<35} {'Voice ID':<28} {'Category'}")
print("-" * 80)
for v in voices.voices:
    cat = getattr(v, 'category', 'unknown')
    print(f"{v.name:<35} {v.voice_id:<28} {cat}")
print(f"\nTotal: {len(voices.voices)} voices")
```

### `/elevenlabs batch <file.md>` — Batch generate from markdown
Read a markdown file split by `## ` headers. Generate one MP3 per section. Great for turning a launch script, blog post, or tutorial into audio content.

**Example input (script.md):**
```markdown
## Intro
Welcome to ElevenLabs. The voice AI platform for developers.

## Feature One
With our API, you can generate speech in 32 languages with under 75ms latency.

## Closing
Start building today at elevenlabs.io/docs.
```

**Implementation:**
```python
import os, re
from elevenlabs.client import ElevenLabs

client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
os.makedirs("audio/batch", exist_ok=True)

filepath = "<MARKDOWN_FILE>"
voice_id = "<VOICE_ID or default JBFqnCBsd6RMkjVDRZzb>"

with open(filepath) as f:
    content = f.read()

sections = re.split(r'^## ', content, flags=re.MULTILINE)
generated = []

for i, section in enumerate(sections):
    if not section.strip():
        continue
    lines = section.strip().split('\n', 1)
    title = lines[0].strip()
    text = lines[1].strip() if len(lines) > 1 else title
    slug = re.sub(r'[^a-z0-9]+', '_', title.lower()).strip('_')
    outpath = f"audio/batch/{i:02d}_{slug}.mp3"

    audio = client.text_to_speech.convert(
        text=text,
        voice_id=voice_id,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )
    with open(outpath, "wb") as f:
        for chunk in audio:
            f.write(chunk)
    generated.append(outpath)
    print(f"[{i}/{len(sections)-1}] {outpath} ({os.path.getsize(outpath)} bytes)")

print(f"\nDone. {len(generated)} files in audio/batch/")
```

### `/elevenlabs sfx "description"` — Generate sound effect
Create a sound effect from a text description. Great for demo videos, app prototyping, game dev.

**Implementation:**
```python
import os
from elevenlabs.client import ElevenLabs

client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
os.makedirs("audio/sfx", exist_ok=True)

prompt = "<DESCRIPTION>"
duration = <DURATION_SECONDS or default 3.0>
output = "<FILENAME or default audio/sfx/effect.mp3>"

audio = client.text_to_sound_effects.convert(
    text=prompt,
    duration_seconds=duration,
)
with open(output, "wb") as f:
    for chunk in audio:
        f.write(chunk)
print(f"Generated SFX: {output} ({os.path.getsize(output)} bytes)")
```

### `/elevenlabs clone-guide` — Show the voice cloning script
Display a text the user can read aloud to create a high-quality voice sample. ~1.5 min of natural speech. Ask the user which language they want to read in (French, English, or Spanish) and print the appropriate version. Print it directly in the terminal — no API call needed.

**Important:** Voice cloning captures the voice timbre, NOT the language. A voice cloned from French speech works perfectly for generating audio in English, German, Japanese, and 70+ other languages via the multilingual models. Let the user read in whichever language is most natural for them.

**First:** Ask the user: "Which language do you want to read the script in? (English / French / Spanish)"

**Then show recording instructions:**
```
HOW TO RECORD:

Option A — iPhone/Android:
  1. Open "Voice Memos" (iPhone) or "Recorder" (Android)
  2. Find a quiet room — no fan, no AC, no TV
  3. Hold phone 15-20cm from your mouth
  4. Tap Record, read the script below naturally
  5. Tap Stop when done
  6. AirDrop/share the file to your computer

Option B — Mac:
  1. Open QuickTime Player
  2. File > New Audio Recording
  3. Click the red Record button
  4. Read the script below naturally
  5. Click Stop, save as .m4a

Option C — Any computer:
  1. Go to vocalremover.org/recorder (free, no install)
  2. Click Record, allow mic access
  3. Read the script below
  4. Click Stop, download as .mp3

Tips:
  - Speak at your normal pace, don't rush
  - Keep consistent distance from mic
  - If you stumble, just pause and repeat the sentence
  - Background noise = bad clone quality
```

Then print the matching version:

**ENGLISH VERSION:**
```
============================================================
  VOICE CLONE SAMPLE SCRIPT — Read this aloud
============================================================

Record in a quiet room with your phone (Voice Memos).
Speak naturally, consistent volume, 15-20cm from mic.
Aim for 1-2 minutes. Save as .m4a or .mp3.

------------------------------------------------------------

Hi, my name is [YOUR NAME]. I am a developer based in
[YOUR CITY].

I believe the best developer tools are built by people
who actually use them. That is why I spend most of my day
inside my code editor, writing code, running experiments,
and shipping products.

What excites me most right now is the intersection of AI
and developer tooling. The ability to generate speech,
clone voices, and create audio content programmatically
is changing how developers build products.

I build fast, I ship often, and I care deeply about the
quality of what I put out. If you are listening to this,
it means my voice has been cloned by ElevenLabs, and this
audio was generated entirely by AI. Pretty cool, right?

The quick brown fox jumps over the lazy dog. She sells
seashells by the seashore. Peter Piper picked a peck of
pickled peppers.

------------------------------------------------------------
  When done, run: /elevenlabs clone ~/path/to/recording.m4a
============================================================
```

**FRENCH VERSION:**
```
============================================================
  SCRIPT DE CLONAGE VOCAL — Lisez ceci a voix haute
============================================================

Enregistrez dans une piece calme avec votre telephone.
Parlez naturellement, volume constant, 15-20cm du micro.
Visez 1-2 minutes. Sauvez en .m4a ou .mp3.

------------------------------------------------------------

Bonjour, je m'appelle [VOTRE NOM]. Je suis developpeur
et je vis a [VOTRE VILLE].

Je crois que les meilleurs outils pour developpeurs sont
construits par des gens qui les utilisent vraiment. C'est
pourquoi je passe la plupart de mes journees dans mon
editeur de code, a ecrire du code, lancer des experiences
et livrer des produits.

Ce qui me passionne le plus en ce moment, c'est
l'intersection entre l'intelligence artificielle et les
outils pour developpeurs. La capacite de generer de la
parole, de cloner des voix et de creer du contenu audio
de maniere programmatique change la facon dont les
developpeurs construisent leurs produits.

Je construis vite, je livre souvent, et je tiens
enormement a la qualite de ce que je produis. Si vous
ecoutez ceci, cela signifie que ma voix a ete clonee
par ElevenLabs, et cet audio a ete genere entierement
par intelligence artificielle. Plutot cool, non?

Un chasseur sachant chasser doit savoir chasser sans son
chien. Les chaussettes de l'archiduchesse sont-elles
seches ou archi-seches?

------------------------------------------------------------
  Une fois termine: /elevenlabs clone ~/chemin/vers/enregistrement.m4a
============================================================
```

**SPANISH VERSION:**
```
============================================================
  SCRIPT DE CLONACION DE VOZ — Lea esto en voz alta
============================================================

Grabe en una habitacion tranquila con su telefono.
Hable naturalmente, volumen constante, 15-20cm del micro.
Apunte a 1-2 minutos. Guarde como .m4a o .mp3.

------------------------------------------------------------

Hola, mi nombre es [SU NOMBRE]. Soy desarrollador y vivo
en [SU CIUDAD].

Creo que las mejores herramientas para desarrolladores son
construidas por personas que realmente las usan. Por eso
paso la mayor parte de mis dias en mi editor de codigo,
escribiendo codigo, ejecutando experimentos y lanzando
productos.

Lo que mas me emociona ahora mismo es la interseccion
entre la inteligencia artificial y las herramientas para
desarrolladores. La capacidad de generar habla, clonar
voces y crear contenido de audio de forma programatica
esta cambiando como los desarrolladores construyen sus
productos.

Construyo rapido, lanzo a menudo, y me importa
profundamente la calidad de lo que produzco. Si esta
escuchando esto, significa que mi voz ha sido clonada
por ElevenLabs, y este audio fue generado completamente
por inteligencia artificial. Bastante genial, no?

El perro de San Roque no tiene rabo porque Ramon Ramirez
se lo ha robado.

------------------------------------------------------------
  Al terminar: /elevenlabs clone ~/ruta/a/grabacion.m4a
============================================================
```

## Model Reference

| Model ID | Name | Speed | Languages | Best for |
|---|---|---|---|---|
| `eleven_v3` | V3 | Slower | 70+ | Highest quality, most expressive |
| `eleven_multilingual_v2` | Multilingual V2 | Medium | 70+ | Default, good balance |
| `eleven_flash_v2_5` | Flash V2.5 | <75ms | 32 | Real-time, lowest latency |
| `eleven_turbo_v2_5` | Turbo V2.5 | Fast | 32 | Speed + quality balance |

## Default Voices (quick reference)

| Name | Voice ID | Style |
|---|---|---|
| George | JBFqnCBsd6RMkjVDRZzb | Warm, captivating storyteller |
| Roger | CwhRBWXzGAHq8TQ4Fs17 | Laid-back, casual |
| Sarah | EXAVITQu4vr4xnSDxMaL | Mature, confident |
| Charlie | IKne3meq5aSn9XLyUdCD | Deep, energetic |
| Laura | FGY2WhTYpPnrIDTdsKH5 | Enthusiastic, quirky |

## Cost Awareness

**Always estimate and display the cost BEFORE generating audio.** After each generation, show credits used and remaining.

**Credit calculation:**
- Standard models (v3, multilingual_v2): **1 credit per character** (including spaces)
- Fast models (flash_v2_5, turbo_v2_5): **0.5 credits per character**
- Sound effects: **100 credits per generation** (flat)
- Voice cloning: **free** (but requires Starter plan, $5/mo)

**Before generating, always print:**
```
Estimated cost: ~[X] credits ([Y] characters × [rate])
Your remaining credits: [Z]
Proceed? (yes/no)
```

**After generating, always print:**
```
Credits used: ~[X]
Remaining: [Y] / [Z] total
```

## Plans & Limits

| Plan | Price | Credits/mo | ~Minutes | Voice Cloning |
|---|---|---|---|---|
| Free | $0 | 10,000 | ~10 min | No |
| Starter | $5/mo | 30,000 | ~30 min | Instant |
| Creator | $22/mo | 100,000 | ~100 min | Professional |
| Pro | $99/mo | 500,000 | ~500 min | Professional |

## Notes

- All output goes to `./audio/` directory by default
- Audio sample for cloning: 1-2 min, clean speech, no background noise
- Voice cloning captures timbre, not language — clone in French, generate in English
