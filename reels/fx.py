"""Look-and-feel effects for reel.py: mood colour grades, camera moves,
background changer and a royalty-free sound-effects library.

Everything here runs on CPU with no paid service. The colour looks are
written as standard .cube LUT files, so the same grade can be used in
CapCut, DaVinci Resolve, Premiere or Edits.
"""
import json, math, re, subprocess
from pathlib import Path
import numpy as np

W, H = 1080, 1920
HERE = Path(__file__).parent
LUT_DIR = HERE / "luts"
SFX_DIR = HERE / "sfx"
MODELS = Path.home() / ".cache/reels"
SR = 48000


# ================================================================ colour grading
# Each look: what mood it serves, and how it moves shadows / mids / highlights.
LOOKS = {
    "blockbuster": "Teal shadows, warm highlights, punchy contrast. Action, motivation, big claims.",
    "golden":      "Warm golden-hour tint, soft contrast. Hope, success stories, nostalgia.",
    "moody":       "Desaturated, cool shadows, deep blacks. Serious topics, struggle, exam pressure.",
    "noir":        "High-contrast black and white. Mystery, drama, 'nobody tells you this'.",
    "vintage":     "Faded blacks, warm-green film tint, softer colour. Memories, history of science.",
    "clean":       "Bright, neutral-warm, slightly richer colour. Teaching, explainers, vlogs.",
    "cyber":       "Teal shadows, magenta highlights, high contrast. Tech, future, space, AI.",
    "thriller":    "Sickly green-cyan cast, low saturation, crushed blacks. Tension, myths busted.",
    "dreamy":      "Lifted, low contrast, pink-peach highlights. Calm, motivation at night, wellbeing.",
}


def _luma(c):
    return c[..., 0] * 0.2126 + c[..., 1] * 0.7152 + c[..., 2] * 0.0722


def _scurve(x, amount):
    """Contrast around mid-grey; amount 0 = none, 1 = strong."""
    s = x + amount * (x - 0.5) * (1 - np.abs(2 * x - 1)) * 1.2
    return np.clip(s, 0, 1)


def _sat(c, k):
    y = _luma(c)[..., None]
    return np.clip(y + (c - y) * k, 0, 1)


def _skin_weight(c):
    """~1 for skin-like hues (orange, 10-50 degrees, moderately saturated), 0 elsewhere."""
    mx, mn = c.max(-1), c.min(-1)
    d = mx - mn + 1e-6
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    sat = d / (mx + 1e-6)
    hw = np.clip(1 - np.abs(hue - 28) / 25, 0, 1)
    sw = np.clip((sat - 0.12) / 0.2, 0, 1) * np.clip((0.75 - sat) / 0.2, 0, 1)
    return hw * sw * np.clip((mx - 0.15) / 0.2, 0, 1)


def _split_tone(c, shadow_rgb, high_rgb, amt_s, amt_h, protect_skin=0.7):
    y = _luma(c)[..., None]
    ws = np.clip(1 - y * 2, 0, 1) ** 1.5      # shadow weight
    wh = np.clip(y * 2 - 1, 0, 1) ** 1.5      # highlight weight
    k = 1 - protect_skin * _skin_weight(c)[..., None]
    out = c + k * (ws * amt_s * (np.array(shadow_rgb) - 0.5) + wh * amt_h * (np.array(high_rgb) - 0.5))
    return np.clip(out, 0, 1)


def _lift_gain(c, lift=0.0, gain=1.0):
    return np.clip(lift + c * (gain - lift), 0, 1)


def apply_look(c, look):
    if look == "blockbuster":
        c = _split_tone(c, (0.15, 0.55, 0.65), (0.85, 0.55, 0.3), 0.35, 0.22)
        c = _scurve(c, 0.35); c = _sat(c, 1.12)
    elif look == "golden":
        c = c * np.array([1.05, 1.0, 0.91]); c = _lift_gain(c, 0.03, 1.0)
        c = _split_tone(c, (0.55, 0.45, 0.35), (0.85, 0.65, 0.35), 0.15, 0.2, 0.4)
        c = _scurve(c, 0.15); c = _sat(c, 1.05)
    elif look == "moody":
        c = _sat(c, 0.72); c = _split_tone(c, (0.3, 0.45, 0.62), (0.55, 0.53, 0.48), 0.3, 0.1)
        c = _scurve(c, 0.4); c = _lift_gain(c, -0.02, 0.94)
    elif look == "noir":
        y = _luma(c)[..., None]; c = np.repeat(_scurve(_scurve(y, 0.6), 0.4), 3, -1)
    elif look == "vintage":
        c = _split_tone(c, (0.4, 0.55, 0.45), (0.75, 0.62, 0.42), 0.2, 0.2, 0.3)
        c = _sat(c, 0.82); c = _scurve(c, 0.15); c = _lift_gain(c, 0.07, 0.93)
    elif look == "clean":
        c = np.clip(c * 1.04 + 0.01, 0, 1) * np.array([1.015, 1.0, 0.985])
        c = _scurve(c, 0.18); c = _sat(c, 1.1)
    elif look == "cyber":
        c = _split_tone(c, (0.1, 0.6, 0.7), (0.85, 0.35, 0.8), 0.4, 0.28, 0.5)
        c = _scurve(c, 0.45); c = _sat(c, 1.15)
    elif look == "thriller":
        c = _sat(c, 0.65); c = _split_tone(c, (0.35, 0.6, 0.5), (0.55, 0.62, 0.45), 0.3, 0.2, 0.5)
        c = _scurve(c, 0.5); c = _lift_gain(c, -0.03, 0.95)
    elif look == "dreamy":
        c = _lift_gain(c, 0.08, 1.0); c = _split_tone(c, (0.5, 0.45, 0.6), (0.85, 0.6, 0.6), 0.15, 0.25, 0.3)
        c = _scurve(c, -0.1); c = _sat(c, 0.95)
    else:
        raise SystemExit(f"unknown look {look!r}; choose from: {', '.join(LOOKS)}")
    return np.clip(c, 0, 1)


def write_cube(look, path, size=33, strength=1.0):
    g = np.linspace(0, 1, size)
    b, gg, r = np.meshgrid(g, g, g, indexing="ij")  # .cube order: red changes fastest
    ident = np.stack([r, gg, b], -1).reshape(-1, 3)
    out = ident + (apply_look(ident, look) - ident) * strength
    lines = [f'TITLE "Science Monk {look}"', f"LUT_3D_SIZE {size}", "DOMAIN_MIN 0 0 0", "DOMAIN_MAX 1 1 1"]
    lines += [f"{x:.6f} {y:.6f} {z:.6f}" for x, y, z in out]
    Path(path).write_text("\n".join(lines) + "\n")
    return path


def build_luts():
    LUT_DIR.mkdir(exist_ok=True)
    for look in LOOKS:
        write_cube(look, LUT_DIR / f"{look}.cube")
    return LUT_DIR


def grade(inp, out, look=None, lut=None, strength=1.0, grain=0, vignette=False):
    """Apply a mood look (or any downloaded .cube LUT), plus optional film grain and vignette."""
    filters = []
    if lut:
        filters.append(f"lut3d=file='{lut}':interp=tetrahedral")
    elif look:
        tmp = Path(out).with_suffix(f".{look}.cube")
        write_cube(look, tmp, strength=strength)
        filters.append(f"lut3d=file='{tmp}':interp=tetrahedral")
    if vignette:
        filters.append("vignette=angle=PI/5")
    if grain:
        filters.append(f"noise=alls={int(grain)}:allf=t")
    filters.append("format=yuv420p")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(inp), "-vf", ",".join(filters), "-c:v", "libx264",
                    "-crf", "16", "-preset", "medium", "-c:a", "copy", str(out)], check=True)


# ================================================================ camera moves
def punch_times(words_json, min_gap=2.2):
    """Sentence/phrase starts from the transcript: where an editor would cut to a closer framing.
    Kept at least `min_gap` seconds apart - a punch every 2-4 s feels energetic, every 1 s feels like a glitch."""
    words = json.loads(Path(words_json).read_text())["words"]
    times, prev_end = [], None
    for w in words:
        if prev_end is None or w["s"] - prev_end > 0.35 or re.search(r"[.!?,]$", prev_word):
            times.append(w["s"])
        prev_end, prev_word = w["e"], w["w"]
    out = []
    for t in times[1:]:  # the opening framing is the wide one
        if not out or t - out[-1] >= min_gap:
            out.append(t)
    return out


def motion(inp, out, punch=(), punch_zoom=1.14, push=0.0, shake=(), centre_y=0.42):
    """Digital camera moves on a 1080x1920 clip.
    punch: times where framing jumps between wide and close (classic talking-head jump zoom)
    push:  slow push-in over the whole clip, e.g. 0.06 = 6% closer by the end
    shake: times of a short 0.35s impact shake
    """
    import cv2
    cap = cv2.VideoCapture(str(inp))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    w0, h0 = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    punch = sorted(punch)
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w0}x{h0}",
        "-r", str(fps), "-i", "-", "-i", str(inp), "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-crf", "16",
        "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest", str(out)], stdin=subprocess.PIPE)
    rng = np.random.default_rng(7)
    jitter = rng.normal(size=(int(fps * 0.4) + 2, 2))
    i = 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        t = i / fps
        k = sum(1 for p in punch if p <= t)
        z = (punch_zoom if k % 2 else 1.0) * (1 + push * i / n)
        # ease into each punch over 3 frames so it reads as a cut, not a glitch
        if k and t - punch[k - 1] < 3 / fps:
            z_prev = punch_zoom if (k - 1) % 2 else 1.0
            u = (t - punch[k - 1]) * fps / 3
            z = (z_prev + (z - z_prev) * u) * (1 + push * i / n)
        dx = dy = 0.0
        for s in shake:
            if 0 <= t - s < 0.35:
                amp = 18 * (1 - (t - s) / 0.35)
                j = jitter[int((t - s) * fps)]
                dx, dy, z = dx + amp * j[0], dy + amp * j[1], z * 1.03
        cx, cy = w0 / 2, h0 * centre_y
        M = np.float32([[z, 0, (1 - z) * cx + dx], [0, z, (1 - z) * cy + dy]])
        fr = cv2.warpAffine(fr, M, (w0, h0), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        enc.stdin.write(fr.tobytes())
        i += 1
    enc.stdin.close(); enc.wait(); cap.release()


# ================================================================ background changer
def background(inp, out, bg="blur", feather=7, smooth=0.55):
    """Replace or blur the background behind the person.
    bg: 'blur' (portrait-mode bokeh) | '#RRGGBB' colour | path to an image | path to a video
    """
    import cv2, mediapipe as mp
    from mediapipe.tasks.python import vision, BaseOptions
    seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
        base_options=BaseOptions(model_asset_path=str(MODELS / "selfie_multiclass.tflite")),
        output_confidence_masks=True))
    cap = cv2.VideoCapture(str(inp))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    w0, h0 = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    def cover(img):
        s = max(w0 / img.shape[1], h0 / img.shape[0])
        img = cv2.resize(img, (math.ceil(img.shape[1] * s), math.ceil(img.shape[0] * s)), interpolation=cv2.INTER_AREA)
        y, x = (img.shape[0] - h0) // 2, (img.shape[1] - w0) // 2
        return img[y:y + h0, x:x + w0]

    still, bgcap = None, None
    if bg.startswith("#"):
        r, g, b = (int(bg[i:i + 2], 16) for i in (1, 3, 5))
        still = np.full((h0, w0, 3), (b, g, r), np.uint8)
    elif bg != "blur" and Path(bg).suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
        still = cover(cv2.imread(bg))
    elif bg != "blur":
        bgcap = cv2.VideoCapture(bg)

    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w0}x{h0}",
        "-r", str(fps), "-i", "-", "-i", str(inp), "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-crf", "16",
        "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest", str(out)], stdin=subprocess.PIPE)
    prev = None
    sw, sh = w0 // 2, h0 // 2
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        small = cv2.cvtColor(cv2.resize(fr, (sw, sh)), cv2.COLOR_BGR2RGB)
        res = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(small)))
        person = 1 - res.confidence_masks[0].numpy_view()[..., 0]  # class 0 = background
        prev = person if prev is None else smooth * person + (1 - smooth) * prev  # stop edge flicker
        # Harden the soft model output (kills faint halos of the old background), then feather the edge.
        hard = np.clip((prev - 0.4) / 0.25, 0, 1).astype(np.float32)
        m = cv2.GaussianBlur(cv2.resize(hard, (w0, h0)), (0, 0), feather)[..., None]
        if bg == "blur":
            back = cv2.GaussianBlur(fr, (0, 0), 22)
        elif bgcap is not None:
            ok2, bfr = bgcap.read()
            if not ok2:
                bgcap.set(cv2.CAP_PROP_POS_FRAMES, 0); ok2, bfr = bgcap.read()
            back = cover(bfr)
        else:
            back = still
        enc.stdin.write((fr * m + back * (1 - m)).astype(np.uint8).tobytes())
    enc.stdin.close(); enc.wait(); cap.release(); seg.close()


# ================================================================ sound effects
def _env(n, attack, release):
    a, r = int(attack * SR), int(release * SR)
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a) ** 2
    e[n - r:] *= np.linspace(1, 0, r) ** 2
    return e


def _bandnoise(n, f_start, f_end, rng, q=4):
    """White noise through a band-pass whose centre sweeps from f_start to f_end (FFT-domain, per block)."""
    out, blk = np.zeros(n), 2048
    noise = rng.normal(size=n + blk)
    for i in range(0, n, blk // 2):
        f = f_start * (f_end / f_start) ** (i / n)
        seg = noise[i:i + blk] * np.hanning(blk)
        F = np.fft.rfft(seg)
        fr = np.fft.rfftfreq(blk, 1 / SR)
        F *= np.exp(-((np.log(fr + 1) - np.log(f)) ** 2) * q)
        part = np.fft.irfft(F)[: min(blk, n - i)]
        out[i:i + len(part)] += part
    return out / (np.abs(out).max() + 1e-9)


def _stereo(x, pan_from=0.0, pan_to=0.0):
    p = np.linspace(pan_from, pan_to, len(x))
    return np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)], -1)


def make_sfx():
    """Synthesise a small royalty-free SFX kit (we made it, so there is no copyright claim on it)."""
    SFX_DIR.mkdir(exist_ok=True)
    rng = np.random.default_rng(1)
    t = lambda d: np.arange(int(d * SR)) / SR
    kit = {}
    n = int(0.55 * SR)  # whoosh: swept band noise, panned left to right
    kit["whoosh"] = _stereo(_bandnoise(n, 400, 3500, rng) * np.sin(np.pi * np.arange(n) / n) ** 2, -0.7, 0.7)
    n = int(0.3 * SR)
    kit["swoosh_short"] = _stereo(_bandnoise(n, 1500, 6000, rng) * np.sin(np.pi * np.arange(n) / n) ** 3, 0.5, -0.5)
    x = t(0.09); f = 1100 * np.exp(-x * 30) + 180  # pop: fast pitch drop
    kit["pop"] = _stereo(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 40))
    x = t(2.2)  # riser: rising tone + noise, crescendo into the cut
    tone = np.sin(2 * np.pi * np.cumsum(200 * (12 ** (x / 2.2))) / SR)
    kit["riser"] = _stereo((0.6 * tone + 0.5 * _bandnoise(len(x), 500, 8000, rng)) * (x / 2.2) ** 2.5 * _env(len(x), 0.01, 0.03))
    x = t(1.6)  # impact: sub drop + noise transient
    sub = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-x * 2) + 32) / SR) * np.exp(-x * 2.6)
    kit["impact"] = _stereo(sub + 0.5 * rng.normal(size=len(x)) * np.exp(-x * 30))
    x = t(1.4)  # ding: bell partials
    kit["ding"] = _stereo(sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x * d)
                              for f, a, d in [(1318, 1, 3), (2637, .45, 4.5), (3951, .25, 6), (5274, .12, 8)]))
    x = t(0.012)
    kit["click"] = _stereo(rng.normal(size=len(x)) * np.exp(-x * 400))
    x = t(0.35)  # glitch: stuttered square bursts
    sq = np.sign(np.sin(2 * np.pi * 220 * x)) * (np.sin(2 * np.pi * 28 * x) > 0)
    kit["glitch"] = _stereo(0.5 * sq * np.exp(-x * 6) + 0.3 * rng.normal(size=len(x)) * (np.sin(2 * np.pi * 15 * x) > 0.3))
    x = t(0.7)  # camera shutter-ish
    kit["shutter"] = _stereo(rng.normal(size=len(x)) * (np.exp(-x * 90) + 0.6 * np.exp(-np.clip(x - 0.09, 0, None) * 70) * (x > 0.09)))
    import soundfile as sf
    for name, y in kit.items():
        y = y / (np.abs(y).max() + 1e-9) * 0.89
        sf.write(SFX_DIR / f"{name}.wav", y.astype(np.float32), SR)
    return sorted(kit)


def add_sfx(inp, out, cues, volume=0.55):
    """cues: list of (name_or_path, time). Mixed on top of the existing audio, then limited."""
    if not cues:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(inp), "-c", "copy", str(out)], check=True)
        return
    if not (SFX_DIR / "whoosh.wav").exists():
        make_sfx()
    args, fc, labels = ["ffmpeg", "-y", "-v", "error", "-i", str(inp)], [], []
    for k, (name, at) in enumerate(cues, 1):
        p = Path(name) if Path(name).suffix else SFX_DIR / f"{name}.wav"
        if name == "riser":  # a riser should *end* on the moment, not start there
            at = max(0, at - 2.1)
        args += ["-i", str(p)]
        ms = int(at * 1000)
        fc.append(f"[{k}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={volume},adelay={ms}|{ms}[s{k}]")
        labels.append(f"[s{k}]")
    fc.append(f"[0:a]{''.join(labels)}amix=inputs={len(cues) + 1}:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]")
    subprocess.run(args + ["-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[a]", "-c:v", "copy",
                           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(out)], check=True)
