#!/bin/bash
# One-time setup for the Reels toolkit. Cloud sessions start fresh, so run this
# at the start of each editing session:   bash reels/setup.sh
set -e
echo "== Python tools"
pip install -q faster-whisper auto-editor scenedetect opencv-python-headless librosa soundfile yt-dlp piper-tts mediapipe 2>&1 | grep -v WARNING || true
if [ "$1" = "--full" ]; then  # optional heavy extras (~1 GB): stem separation
  pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio 2>&1 | grep -v WARNING || true
  pip install -q demucs 2>&1 | grep -v WARNING || true
fi

echo "== System libs (MediaPipe needs EGL)"
(apt-get install -y -qq libegl1 libgles2 >/dev/null 2>&1 || (apt-get update -qq >/dev/null && apt-get install -y -qq libegl1 libgles2 >/dev/null)) || echo "  could not install libegl1 - background changer will not work"

echo "== Fonts (Latin, Kannada, Devanagari)"
F=~/.local/share/fonts/reels; mkdir -p "$F"
B=https://raw.githubusercontent.com/google/fonts/main/ofl
for f in anton/Anton-Regular.ttf "montserrat/Montserrat[wght].ttf" poppins/Poppins-Bold.ttf \
         poppins/Poppins-ExtraBold.ttf poppins/Poppins-Black.ttf bebasneue/BebasNeue-Regular.ttf \
         "notosanskannada/NotoSansKannada[wdth,wght].ttf" "notosansdevanagari/NotoSansDevanagari[wdth,wght].ttf"; do
  n=$(basename "$f" | sed 's/\[.*\]//'); [ -s "$F/$n" ] || curl -sSfLg -o "$F/$n" "$B/$f"
done
fc-cache -f >/dev/null

echo "== Models"
M=~/.cache/reels; mkdir -p "$M/piper"
[ -s "$M/yunet.onnx" ] || curl -sSfL -o "$M/yunet.onnx" \
  https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx
[ -s "$M/selfie_multiclass.tflite" ] || curl -sSfL -o "$M/selfie_multiclass.tflite" \
  https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite
for e in onnx onnx.json; do
  [ -s "$M/piper/en_US-ryan-medium.$e" ] || curl -sSfL -o "$M/piper/en_US-ryan-medium.$e" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.$e"
done
python3 -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')" 2>/dev/null
auto-editor --version >/dev/null
D=$(dirname "$0"); [ -s "$D/luts/clean.cube" ] || python3 "$D/reel.py" luts; [ -s "$D/sfx/whoosh.wav" ] || python3 "$D/reel.py" sfx-kit
echo "== Ready. Try: python3 reels/reel.py auto my_clip.mp4 --hook 'Your title'"
