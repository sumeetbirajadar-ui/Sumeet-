"""Add efekt effects to a talking-head video, rendered with HyperFrames.

    .venv/bin/python scripts/efekt.py <video> <out.mp4> --fx cam --start 0 --end 3 [--opt key=value ...]
    .venv/bin/python scripts/efekt.py <video> <out.mp4> --plan plan.json
    .venv/bin/python scripts/efekt.py <video> <folder> --plan plan.json --still 1.5,4.2     # check frames (PNG)

plan.json: {"effects": [{"fx": "orbit", "start": 3.2, "end": 6.0, "text": "..."}, ...]}

Next to the video a cache folder <video>_efekt/ keeps the face track, the person cut-out and the HyperFrames
project, so a second effect on the same clip renders without redoing the slow steps. The output keeps the
video's own sound.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HF = ["npx", "-y", "hyperframes@0.8.46"]
WIDTH = 1080


def run(cmd, cwd=None):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"failed: {' '.join(map(str, cmd))}\n{r.stdout[-2000:]}\n{r.stderr[-2000:]}")
    return r.stdout


def probe(video):
    out = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
               "stream=width,height:format=duration", "-of", "json", str(video)])
    d = json.loads(out)
    s = d["streams"][0]
    return int(s["width"]), int(s["height"]), float(d["format"]["duration"])


def prepare(video, cache):
    """The slow, cacheable part: a plate at the render size, the face track, the person cut-out."""
    cache.mkdir(exist_ok=True)
    w, h, dur = probe(video)
    H = round(WIDTH * h / w / 2) * 2
    plate = cache / "plate.mp4"
    if not plate.exists():
        run(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-an", "-vf",
             # lanczos with full chroma, then a light luma-only unsharp: non-generative, the face is not redrawn
             f"scale={WIDTH}:{H}:flags=lanczos+accurate_rnd+full_chroma_int,unsharp=5:5:0.5:5:5:0", "-c:v", "libx264",
             "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", str(plate)])
    face = cache / "face.json"
    if not face.exists():
        run([sys.executable, str(ROOT / "scripts" / "face.py"), str(plate), str(face)])
    person = cache / "person.webm"
    if not person.exists():
        print("cutting you out of the room (first time only, a minute or two)…", flush=True)
        run(HF + ["remove-background", str(plate), "-o", str(person), "--quality", "best"])
    return {"width": WIDTH, "height": H, "duration": dur, "plate": plate, "face": face, "person": person}


def effect_files(names):
    js, css = [], []
    for n in sorted(set(names)):
        f = ROOT / "effects" / f"{n}.js"
        if not f.exists():
            known = ", ".join(p.stem for p in sorted((ROOT / "effects").glob("*.js")))
            sys.exit(f"unknown effect '{n}'. Known: {known}")
        js.append(f.read_text())
        c = f.with_suffix(".css")
        if c.exists():
            css.append(c.read_text())
    return "\n".join(js), "\n".join(css)


def build(media, plan, proj, images):
    if proj.exists():
        shutil.rmtree(proj)
    (proj / "assets" / "img").mkdir(parents=True)
    shutil.copytree(ROOT / "templates" / "fonts", proj / "assets" / "fonts")
    shutil.copy(ROOT / "templates" / "gsap.min.js", proj / "assets")
    for k in ("plate", "person"):
        dst = proj / "assets" / media[k].name
        dst.symlink_to(media[k].resolve())
    # images an effect shows (orbit, wall…): copied in and named img/<n>.<ext>, listed in the plan for the effect
    for fx in plan:
        src = fx.get("images") or images
        if not src:
            continue
        files = sorted(p for p in Path(src).expanduser().iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"))
        names = []
        for i, p in enumerate(files):
            dst = proj / "assets" / "img" / f"{len(list((proj / 'assets' / 'img').iterdir()))}{p.suffix.lower()}"
            shutil.copy(p, dst)
            names.append(f"assets/img/{dst.name}")
        fx["images"] = "|".join(names)
    js, css = effect_files(fx["fx"] for fx in plan)
    data = {"width": media["width"], "height": media["height"], "duration": round(media["duration"], 3),
            "face": json.loads(media["face"].read_text()), "plan": plan}
    html = (ROOT / "templates" / "base.html").read_text()
    for k, v in {"{{W}}": str(media["width"]), "{{H}}": str(media["height"]), "{{DUR}}": f"{media['duration']:.3f}",
                 "{{DATA}}": json.dumps(data, ensure_ascii=False), "{{EFFECTS_JS}}": js, "{{RUNTIME_JS}}": (ROOT / "templates" / "runtime.js").read_text(), "{{EFFECTS_CSS}}": css}.items():
        html = html.replace(k, v)
    (proj / "index.html").write_text(html)


def parse_plan(a, dur):
    if a.plan:
        plan = json.loads(Path(a.plan).read_text())["effects"]
    else:
        fx = {"fx": a.fx, "start": a.start or 0.0, "end": a.end or dur}
        if a.text:
            fx["text"] = a.text
        for kv in a.opt or []:
            k, _, v = kv.partition("=")
            fx[k] = v
        plan = [fx]
    for fx in plan:
        fx["start"] = max(0.0, float(fx.get("start", 0)))
        fx["end"] = min(dur, float(fx.get("end", dur)))
    return plan


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--fx")
    ap.add_argument("--plan")
    ap.add_argument("--start", type=float)
    ap.add_argument("--end", type=float)
    ap.add_argument("--text")
    ap.add_argument("--opt", action="append", help="key=value, repeatable")
    ap.add_argument("--images", help="a folder of pictures for orbit and the other picture effects")
    ap.add_argument("--still", help="comma-separated seconds: write check frames instead of a video")
    a = ap.parse_args()
    if not (a.fx or a.plan):
        ap.error("give --fx <name> or --plan <plan.json>")
    video = Path(a.video).expanduser().resolve()
    cache = video.with_name(video.stem + "_efekt")
    media = prepare(video, cache)
    plan = parse_plan(a, media["duration"])
    proj = cache / "project"
    build(media, plan, proj, a.images)
    out = Path(a.out).expanduser().resolve()
    if a.still:
        out.mkdir(parents=True, exist_ok=True)
        run(HF + ["snapshot", "--at", a.still, "--no-end", "-o", str(out)], cwd=proj)
        print(f"check frames in {out}")
        return
    silent = cache / "render.mp4"
    run(HF + ["render", "--quality", "high", "--output", str(silent)], cwd=proj)
    run(["ffmpeg", "-v", "error", "-y", "-i", str(silent), "-i", str(video), "-map", "0:v", "-map", "1:a?",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)])
    print(f"done: {out}")


if __name__ == "__main__":
    main()
