#!/usr/bin/env bash
# Installs the video tools that need your own computer (GPU, desktop app or a
# local server): voice cloning, relighting, Google Flow, storyboard workbench.
# Run on your PC/Mac:   bash tools/install-local-ai-tools.sh
# Re-running is safe: existing folders are updated instead of re-cloned.
set -euo pipefail

DIR="${CLAUDE_VIDEO_TOOLS:-$HOME/claude-video-tools}"
mkdir -p "$DIR"
cd "$DIR"
have() { command -v "$1" >/dev/null 2>&1; }

clone() { # owner/repo
  local name="${1#*/}"
  if [ -d "$name/.git" ]; then git -C "$name" pull --ff-only -q || true
  else git clone -q --depth 1 "https://github.com/$1.git" "$name"; fi
  echo "  ok  $1 -> $DIR/$name"
}

echo "== 1. Source code"
for r in jamiepine/voicebox debpalash/voicestudio k2-fsa/OmniVoice OpenBMB/VoxCPM \
         Kunbyte-AI/Lumen GTAI-1/flow-mcp Yuuhann1999/agent-storyboard elibarnett/kie-mcp; do
  clone "$r"
done

echo "== 2. Python voice-cloning models (OmniVoice, VoxCPM)"
if have python3; then
  python3 -m venv "$DIR/.venv-voice"
  "$DIR/.venv-voice/bin/pip" install -q --upgrade pip
  "$DIR/.venv-voice/bin/pip" install -q omnivoice voxcpm \
    && echo "  ok  omnivoice + voxcpm in $DIR/.venv-voice" \
    || echo "  !!  pip install failed - install PyTorch for your GPU first (see OmniVoice/README.md)"
else echo "  --  python3 not found, skipped"; fi

echo "== 3. Lumen relighting (needs an NVIDIA GPU with CUDA 12.4)"
if have nvidia-smi; then
  python3 -m venv "$DIR/.venv-lumen"
  "$DIR/.venv-lumen/bin/pip" install -q torch==2.4.0 torchvision==0.19.0 --index-url https://download.pytorch.org/whl/cu124
  "$DIR/.venv-lumen/bin/pip" install -q -r Lumen/requirements.txt && echo "  ok  Lumen env in $DIR/.venv-lumen (weights: huggingface.co/Kunbyte/Lumen)"
else echo "  --  no NVIDIA GPU found, skipped (use the Hugging Face Space instead: huggingface.co/spaces/Kunbyte/Lumen)"; fi

echo "== 4. Google Flow MCP (Veo + Nano Banana with your Google account)"
if have npm; then
  (cd flow-mcp && npm install -s && npm run -s build) && echo "  ok  built flow-mcp; sign in once with: (cd $DIR/flow-mcp && npm run login)"
else echo "  --  npm not found, skipped"; fi

echo "== 5. Register with Claude Code"
if have claude; then
  claude plugin marketplace add Yuuhann1999/agent-storyboard || true
  claude plugin install agent-storyboard@agent-storyboard || true
  [ -f flow-mcp/dist/index.js ] && claude mcp add --scope user flow -- node "$DIR/flow-mcp/dist/index.js" || true
  claude mcp add --scope user --transport http voicebox http://127.0.0.1:17493/mcp \
    --header "X-Voicebox-Client-Id: claude-code" || true
  echo "  ok  registered (check with: claude mcp list)"
else echo "  --  claude CLI not found, skipped"; fi

cat <<EOF

== 6. Desktop apps to download and open yourself
  Voicebox (local ElevenLabs alternative, MCP on :17493): https://github.com/jamiepine/voicebox/releases/latest
  VoiceStudio (OmniVoice studio):                          https://github.com/debpalash/voicestudio/releases
  Voicebox and VoiceStudio must be running for their MCP servers to answer.

Done. Everything is in $DIR
Only clone voices you own or have written permission to use.
EOF
