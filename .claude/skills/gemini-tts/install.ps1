# gemini-tts global installer for Windows (PowerShell)
# Installs the skill for the current user at ~\.claude\skills\gemini-tts (global: available in every Claude Code project).
# Usage (from anywhere):
#   irm https://raw.githubusercontent.com/guyaga/gemini-tts-skill/main/install.ps1 | iex
$ErrorActionPreference = "Stop"
$Repo = "https://github.com/guyaga/gemini-tts-skill"
$Dest = Join-Path $HOME ".claude\skills\gemini-tts"

Write-Host "gemini-tts installer -> $Dest" -ForegroundColor Cyan
New-Item -ItemType Directory -Force (Split-Path $Dest) | Out-Null

if (Test-Path (Join-Path $Dest ".git")) {
  Write-Host "Existing install found, updating..."
  git -C $Dest pull --ff-only
} elseif (Test-Path $Dest) {
  Write-Host "Folder exists but is not a git checkout. Backing it up..."
  Move-Item $Dest "$Dest.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"
  git clone --depth 1 $Repo $Dest
} else {
  git clone --depth 1 $Repo $Dest
}

# Python + requests
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { Write-Host "Python not found. Install from https://www.python.org/downloads/ (tick 'Add to PATH') and rerun." -ForegroundColor Red; exit 1 }
python -m pip install --quiet --user requests

# ffmpeg
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Host "ffmpeg not found. Installing with winget (close and reopen the terminal afterwards)..." -ForegroundColor Yellow
  try { winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements } catch { Write-Host "winget failed; install ffmpeg manually from https://www.gyan.dev/ffmpeg/builds/ and add it to PATH." -ForegroundColor Red }
}

# API key
if (-not $env:GEMINI_API_KEY) {
  Write-Host ""
  Write-Host "You need a Gemini API key (free): https://aistudio.google.com/apikey" -ForegroundColor Yellow
  $key = Read-Host "Paste your GEMINI_API_KEY (or press Enter to skip)"
  if ($key) {
    [Environment]::SetEnvironmentVariable("GEMINI_API_KEY", $key, "User")
    $env:GEMINI_API_KEY = $key
    Write-Host "Saved to your user environment. New terminals will have it."
  }
}

Write-Host ""
python (Join-Path $Dest "scripts\gemini_tts.py") doctor --quick
Write-Host ""
Write-Host "Done. Open the studio with:" -ForegroundColor Green
Write-Host "  python `"$Dest\scripts\gemini_tts.py`" studio"
Write-Host "Or just ask Claude Code: 'read this in Hebrew with a warm voice' / 'clone my voice'."
