#!/usr/bin/env bash
# First run: check the tools, make the Python environment, warm up HyperFrames. Prints READY when done.
set -u
cd "$(dirname "$0")/.."
command -v ffmpeg >/dev/null || { echo NEED_FFMPEG; exit 1; }
command -v node >/dev/null || { echo NEED_NODE; exit 1; }
PY=$(command -v python3.12 || command -v python3 || true)
[ -n "$PY" ] || { echo NEED_PYTHON; exit 1; }
if [ ! -x .venv/bin/python ]; then
  "$PY" -m venv .venv && .venv/bin/pip -q install opencv-python-headless numpy || { echo PIP_FAILED; exit 1; }
fi
npx -y hyperframes@0.8.46 --version >/dev/null 2>&1 || { echo NEED_HYPERFRAMES; exit 1; }
echo READY
