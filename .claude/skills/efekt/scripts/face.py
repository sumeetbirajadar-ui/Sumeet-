"""Track the speaker's face through a video: one box per frame, smoothed, normalised to 0..1.

    .venv/bin/python scripts/face.py <video> <out.json>

Writes {"fps", "width", "height", "frames": [[cx, cy, w, h], ...]} where cx/cy is the face centre and w/h its
size, all as fractions of the frame. Frames with no detection take the last good box; the track is then smoothed
with a centred moving average so effects that follow the face never jitter.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

MODEL = Path(__file__).resolve().parent.parent / "models" / "yunet.onnx"
WORK_W = 540  # detect on a small copy: faster, and plenty for a face that fills a phone frame


def track(video: str) -> dict:
    cap = cv2.VideoCapture(video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    sw, sh = WORK_W, round(h * WORK_W / w)
    det = cv2.FaceDetectorYN.create(str(MODEL), "", (sw, sh), 0.6, 0.3, 5)
    boxes, last = [], None
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        _, faces = det.detect(cv2.resize(frame, (sw, sh)))
        if faces is not None and len(faces):
            x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])[:4]
            last = [(x + fw / 2) / sw, (y + fh / 2) / sh, fw / sw, fh / sh]
        boxes.append(last)
    cap.release()
    first = next((b for b in boxes if b), [0.5, 0.35, 0.3, 0.17])
    filled, prev = [], first
    for b in boxes:
        prev = b or prev
        filled.append(prev)
    arr = np.array(filled, dtype=float)
    k = max(1, round(fps * 0.25)) | 1  # a quarter-second window, odd
    pad = np.pad(arr, ((k // 2, k // 2), (0, 0)), mode="edge")
    smooth = np.stack([np.convolve(pad[:, i], np.ones(k) / k, mode="valid") for i in range(4)], axis=1)
    return {"fps": fps, "width": w, "height": h, "frames": [[round(v, 4) for v in row] for row in smooth]}


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    data = track(sys.argv[1])
    Path(sys.argv[2]).write_text(json.dumps(data))
    print(f"{len(data['frames'])} frames, face at {data['frames'][0][:2]}")
