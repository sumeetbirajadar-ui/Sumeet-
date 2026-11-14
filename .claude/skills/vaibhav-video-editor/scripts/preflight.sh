#!/usr/bin/env bash
# Check the tools and video skills the director can use. Prints one line per item, then READY or NOT_READY.
#   bash preflight.sh
# Lines: OK <name> <path or version> | MISSING <name> <what it's for> | OPTIONAL <name> <what you lose>
SK="$HOME/.claude/skills"
REQ_MISSING=0
ok()   { printf 'OK        %-20s %s\n' "$1" "$2"; }
miss() { printf 'MISSING   %-20s %s\n' "$1" "$2"; REQ_MISSING=1; }
opt()  { printf 'OPTIONAL  %-20s %s\n' "$1" "$2"; }

echo "== tools"
for t in ffmpeg ffprobe; do
  if command -v "$t" >/dev/null 2>&1; then ok "$t" "$(command -v "$t")"; else miss "$t" "cutting, rendering and checks"; fi
done
PY=$(command -v python3 || command -v python || command -v py)
if [ -n "$PY" ]; then ok python "$("$PY" --version 2>&1)"; else miss python "the helper scripts"; fi
if command -v node >/dev/null 2>&1; then ok node "$(node -v)"; else opt node "HyperFrames, Remotion and the website recorder need Node.js 20+"; fi
if command -v whisper-cli >/dev/null 2>&1; then ok whisper-cli "$(command -v whisper-cli)"
elif [ -n "$PY" ] && "$PY" -c "import faster_whisper" >/dev/null 2>&1; then ok faster-whisper "python module"
else opt transcription "no whisper found on PATH; the engines install their own"; fi
CHROME=""
for c in "/Applications/Google Chrome.app" "/Applications/Microsoft Edge.app"; do [ -d "$c" ] && CHROME="$c"; done
command -v google-chrome >/dev/null 2>&1 && CHROME=$(command -v google-chrome)
if [ -n "$CHROME" ]; then ok chrome "$CHROME"; else opt chrome "website b-roll recording and HyperFrames rendering"; fi

echo "== engines"
ENGINES=0
if [ -f "$SK/awa-video-reel/SKILL.md" ]; then ok awa-video-reel "$SK/awa-video-reel"; ENGINES=1
else opt awa-video-reel "engine A (one-pass reel edit, music, sound effects, website b-roll)"; fi

VE=""
for root in "$HOME/.claude/plugins" "$HOME/Library/Application Support/Claude" "$HOME/.config/Claude" "${APPDATA:-/nonexistent}/Claude"; do
  [ -d "$root" ] || continue
  f=$(find "$root" -type f -name render.py -path "*scripts*" 2>/dev/null | while read -r p; do
        d=$(dirname "$p"); [ -f "$d/silences.py" ] && [ -f "$d/transcribe.py" ] && echo "$d" && break; done | head -1)
  [ -n "$f" ] && VE="$f" && break
done
if [ -n "$VE" ]; then ok video-editor "$VE"; ENGINES=1
else opt video-editor "engine B (long videos, silence cuts, render.py)"; fi

HF=$(ls -d "$HOME/.claude/plugins/cache/hyperframes/hyperframes/"*/ 2>/dev/null | sort -V | tail -1)
if [ -n "$HF" ]; then ok hyperframes "${HF%/}"; ENGINES=1
else opt hyperframes "engine C and custom motion graphics (/plugin install hyperframes@hyperframes)"; fi
[ "$ENGINES" = 1 ] || miss engine "install at least one: awa-video-reel, the Video Editor plugin or HyperFrames"

echo "== effects and styles"
FX=""
for d in "$SK/effects" "$SK/awa-video-reel/effects"; do [ -f "$d/scripts/fx.py" ] && FX="$d" && break; done
if [ -n "$FX" ]; then
  if [ -x "$FX/.venv/bin/python" ] || [ -x "$FX/.venv/Scripts/python.exe" ]; then ok effects "$FX"
  else ok effects "$FX (run scripts/setup.sh once before the first effect)"; fi
else opt effects "the 45 face-tracked effects"; fi
[ -f "$SK/brand-nat-styles/styles.md" ] && ok brand-nat-styles "$SK/brand-nat-styles" || opt brand-nat-styles "the H/C/L/P/V/B/X/M/S/G style codes and visual guide"
[ -f "$SK/remotion-best-practices/SKILL.md" ] && ok remotion-rules "$SK/remotion-best-practices" || opt remotion-rules "Remotion best practices"
[ -f "$SK/multicam-shot/SKILL.md" ] && ok multicam-shot "$SK/multicam-shot" || opt multicam-shot "AI camera pass prompts (Seedance)"
[ -f "$SK/my-video-style/SKILL.md" ] && ok my-video-style "$SK/my-video-style/SKILL.md" || opt my-video-style "no saved style yet: using references/house-style.md"

SFX=""
[ -d "$SK/awa-video-reel/sfx" ] && SFX="$SK/awa-video-reel/sfx"
[ -z "$SFX" ] && [ -n "$HF" ] && [ -d "${HF%/}/skills/media-use/audio/assets/sfx" ] && SFX="${HF%/}/skills/media-use/audio/assets/sfx"
[ -n "$SFX" ] && ok sfx-library "$SFX" || opt sfx-library "no sound effects library found (install HyperFrames, or pass --sfx-dir to sound_mix.py)"

echo "== voices (voiceover mode)"
KV="$HOME/.local/share/hyperframes-venv/bin/python"
if [ -x "$KV" ] && "$KV" -c "import kokoro_onnx, soundfile" >/dev/null 2>&1; then ok kokoro "free offline voice, venv $HOME/.local/share/hyperframes-venv"
else opt kokoro "free offline voice: one-time setup, see SKILL.md voiceover mode (ask first)"; fi
[ -n "$ELEVENLABS_API_KEY" ] && ok elevenlabs "key is set" || opt elevenlabs "no ELEVENLABS_API_KEY in this environment"
[ -n "$GEMINI_API_KEY$GOOGLE_API_KEY" ] && ok gemini "key is set" || opt gemini "no GEMINI_API_KEY in this environment"

echo
[ "$REQ_MISSING" = 0 ] && echo READY || echo NOT_READY
