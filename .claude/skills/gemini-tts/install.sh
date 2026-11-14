#!/usr/bin/env bash
# gemini-tts global installer for macOS / Linux
# Installs the skill for the current user at ~/.claude/skills/gemini-tts (global: available in every Claude Code project).
# Usage (from anywhere):
#   curl -fsSL https://raw.githubusercontent.com/guyaga/gemini-tts-skill/main/install.sh | bash
set -euo pipefail
REPO="https://github.com/guyaga/gemini-tts-skill"
DEST="$HOME/.claude/skills/gemini-tts"

echo "gemini-tts installer -> $DEST"
mkdir -p "$(dirname "$DEST")"
if [ -d "$DEST/.git" ]; then
  echo "Existing install found, updating..."; git -C "$DEST" pull --ff-only
elif [ -e "$DEST" ]; then
  echo "Folder exists but is not a git checkout. Backing it up..."
  mv "$DEST" "$DEST.bak-$(date +%Y%m%d-%H%M%S)"; git clone --depth 1 "$REPO" "$DEST"
else
  git clone --depth 1 "$REPO" "$DEST"
fi

PY=$(command -v python3 || command -v python || true)
if [ -z "$PY" ]; then echo "Python 3 not found. Install it and rerun."; exit 1; fi
"$PY" -m pip install --quiet --user requests 2>/dev/null || "$PY" -m pip install --quiet --break-system-packages requests

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found."
  if command -v brew >/dev/null 2>&1; then brew install ffmpeg
  elif command -v apt-get >/dev/null 2>&1; then sudo apt-get install -y ffmpeg
  else echo "Install ffmpeg with your package manager and rerun."; fi
fi

if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo
  echo "You need a Gemini API key (free): https://aistudio.google.com/apikey"
  read -r -p "Paste your GEMINI_API_KEY (or press Enter to skip): " key </dev/tty || key=""
  if [ -n "$key" ]; then
    RC="$HOME/.zshrc"; [ -n "${BASH_VERSION:-}" ] && [ "$(basename "${SHELL:-}")" = "bash" ] && RC="$HOME/.bashrc"
    echo "export GEMINI_API_KEY=\"$key\"" >> "$RC"
    export GEMINI_API_KEY="$key"
    echo "Saved to $RC. New terminals will have it."
  fi
fi

echo
"$PY" "$DEST/scripts/gemini_tts.py" doctor --quick
echo
echo "Done. Open the studio with:"
echo "  $PY \"$DEST/scripts/gemini_tts.py\" studio"
echo "Or just ask Claude Code: 'read this in Hebrew with a warm voice' / 'clone my voice'."
