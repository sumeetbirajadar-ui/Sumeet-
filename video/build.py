"""Trim the recorded scenes and join them with crossfades into one MP4."""
import json, subprocess, sys
from pathlib import Path

d = Path(__file__).parent / "clips"
out = Path(sys.argv[1])
offsets = json.loads((d / "offsets.json").read_text())
n = len(offsets)
XF = 0.5  # crossfade seconds

def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)]).strip())

inputs, filters, lens = [], [], []
for i in range(n):
    f = d / f"{i}.webm"
    ss = offsets[str(i)] + 0.15
    L = dur(f) - ss - 0.1
    lens.append(L)
    inputs += ["-i", str(f)]
    filters.append(f"[{i}:v]trim=start={ss:.3f}:duration={L:.3f},setpts=PTS-STARTPTS,fps=30,format=yuv420p,settb=AVTB[v{i}]")

prev, t = "v0", lens[0]
for i in range(1, n):
    off = t - XF
    filters.append(f"[{prev}][v{i}]xfade=transition=fade:duration={XF}:offset={off:.3f}[x{i}]")
    prev, t = f"x{i}", t - XF + lens[i]
filters.append(f"[{prev}]fade=t=in:st=0:d=0.4,fade=t=out:st={t-0.6:.3f}:d=0.6[out]")

subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(filters), "-map", "[out]",
                "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)], check=True)
print(f"{out} {t:.1f}s")
