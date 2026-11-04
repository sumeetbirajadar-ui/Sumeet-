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
    # ---- European cinema looks (inspired by, not copied from, the films named)
    "amelie":        "FRENCH whimsical: saturated reds and greens, amber light, warm skin (Delbonnel-style palette).",
    "nouvelle_vague": "FRENCH New Wave: silvery natural-light black and white, soft contrast, visible grain.",
    "parisian":      "FRENCH modern arthouse: muted pastel, creamy highlights, grey-cool shadows, gentle contrast.",
    "italian_summer": "ITALIAN summer: golden natural sunlight, warm greens, soft 35mm warmth (Guadagnino-style).",
    "dolce_vita":    "ITALIAN baroque: rich deep colour, strong contrast, warm skin, magenta-crimson depth (Sorrentino-style).",
    "neorealismo":   "ITALIAN neorealism: gritty, grainy, high-contrast black and white, street realism.",
    "british_drama": "BRITISH TV drama: overcast, cool green-grey, desaturated, soft contrast. Grounded, honest.",
    "peaky":         "BRITISH period: smoky desaturation except strong primaries, sepia tint, golden highlights.",
    "ritchie":       "BRITISH crime-caper: bleached high contrast, brown-gold mids, punchy and gritty.",
    "scandi":        "EUROPEAN Nordic: cold, clean, airy blue-white, low saturation, minimalist.",
    "bleach_bypass": "EUROPEAN war/thriller: silver retention look, very high contrast, very low saturation.",
}

# Which looks belong to which regional family (used by GUIDE and `looks`).
FAMILIES = {"french": ["amelie", "nouvelle_vague", "parisian"],
            "italian": ["italian_summer", "dolce_vita", "neorealismo"],
            "british": ["british_drama", "peaky", "ritchie"],
            "european": ["scandi", "bleach_bypass", "vintage"],
            "hollywood": ["blockbuster", "golden", "moody", "noir", "clean", "cyber", "thriller", "dreamy"]}


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


def _tint(c, rgb, keep_whites=0.75):
    """White-balance style tint that fades out in the brightest areas, so walls and shirts stay cream, not lemon."""
    y = _luma(c)[..., None]
    w = 1 - keep_whites * np.clip((y - 0.7) / 0.3, 0, 1)
    return np.clip(c * (1 + (np.array(rgb) - 1) * w), 0, 1)


def apply_look(c, look):
    if look == "blockbuster":
        c = _split_tone(c, (0.15, 0.55, 0.65), (0.85, 0.55, 0.3), 0.35, 0.22)
        c = _scurve(c, 0.35); c = _sat(c, 1.12)
    elif look == "golden":
        c = _tint(c, [1.05, 1.0, 0.91]); c = _lift_gain(c, 0.03, 1.0)
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
    # ---- French
    elif look == "amelie":
        c = _tint(c, [1.04, 1.02, 0.84])                                   # amber light
        c = _split_tone(c, (0.32, 0.55, 0.35), (0.85, 0.7, 0.35), 0.32, 0.22, 0.5)  # green shadows, gold highs
        c = _boost_hues(c, {0: 1.35, 120: 1.35, 50: 1.15})                      # red, green, yellow pop
        c = _scurve(c, 0.25); c = _sat(c, 1.1)
    elif look == "nouvelle_vague":
        y = _luma(c)[..., None]
        c = np.repeat(_lift_gain(_scurve(y, 0.2), 0.05, 0.96), 3, -1) * np.array([1.0, 1.0, 1.02])
    elif look == "parisian":
        c = _sat(c, 0.78); c = _split_tone(c, (0.42, 0.48, 0.56), (0.62, 0.56, 0.5), 0.2, 0.18, 0.5)
        c = _scurve(c, 0.08); c = _lift_gain(c, 0.05, 0.95)
    # ---- Italian
    elif look == "italian_summer":
        c = _tint(c, [1.05, 1.02, 0.88])
        c = _split_tone(c, (0.5, 0.5, 0.38), (0.88, 0.7, 0.42), 0.18, 0.25, 0.35)
        c = _boost_hues(c, {90: 1.2, 45: 1.15, 200: 0.9})                      # yellow-greens up, blues calmer
        c = _scurve(c, 0.15); c = _lift_gain(c, 0.03, 0.98); c = _sat(c, 1.06)
    elif look == "dolce_vita":
        c = _split_tone(c, (0.45, 0.3, 0.42), (0.82, 0.62, 0.45), 0.25, 0.18, 0.6)  # wine shadows, warm highs
        c = _boost_hues(c, {350: 1.3, 20: 1.1, 220: 1.15})
        c = _scurve(c, 0.4); c = _sat(c, 1.2)
    elif look == "neorealismo":
        y = _luma(c)[..., None]
        c = np.repeat(_lift_gain(_scurve(_scurve(y, 0.45), 0.25), 0.0, 0.97), 3, -1)
    # ---- British
    elif look == "british_drama":
        c = _sat(c, 0.72); c = c * np.array([0.97, 1.0, 1.01])
        c = _split_tone(c, (0.38, 0.5, 0.52), (0.55, 0.57, 0.55), 0.25, 0.12, 0.6)
        c = _scurve(c, 0.12); c = _lift_gain(c, 0.03, 0.95)
    elif look == "peaky":
        c = _selective_sat(c, floor=0.35)                                       # only strong colours survive
        c = _tint(c, [1.04, 1.0, 0.9])                                      # sepia lean
        c = _split_tone(c, (0.42, 0.45, 0.4), (0.9, 0.72, 0.38), 0.2, 0.28, 0.4)  # "gold" highlights
        c = _scurve(c, 0.3); c = _lift_gain(c, 0.04, 0.96)                      # smoky lifted blacks
    elif look == "ritchie":
        y = _luma(c)[..., None]
        c = c * 0.45 + y * 0.55                                                 # half bleach
        c = _tint(c, [1.06, 1.0, 0.86]); c = _scurve(c, 0.55)
    # ---- European
    elif look == "scandi":
        c = _sat(c, 0.7); c = c * np.array([0.96, 1.0, 1.05])
        c = _split_tone(c, (0.42, 0.5, 0.6), (0.52, 0.55, 0.6), 0.2, 0.15, 0.6)
        c = _lift_gain(c, 0.04, 1.0); c = _scurve(c, 0.1)
    elif look == "bleach_bypass":
        y = _luma(c)[..., None]
        c = c * 0.35 + _scurve(y, 0.5) * 0.65; c = _scurve(c, 0.4)
    else:
        raise SystemExit(f"unknown look {look!r}; choose from: {', '.join(LOOKS)}")
    return np.clip(c, 0, 1)


def _hue_sat(c):
    mx, mn = c.max(-1), c.min(-1)
    d = mx - mn + 1e-6
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return hue, d / (mx + 1e-6)


def _boost_hues(c, gains, width=35):
    """Scale saturation of chosen hues, e.g. {0: 1.3} = reds 30% richer. Smooth falloff over `width` degrees."""
    hue, _ = _hue_sat(c)
    k = np.ones(c.shape[:-1])
    for h, g in gains.items():
        dist = np.minimum(np.abs(hue - h), 360 - np.abs(hue - h))
        k *= 1 + (g - 1) * np.clip(1 - dist / width, 0, 1)
    y = _luma(c)[..., None]
    return np.clip(y + (c - y) * k[..., None], 0, 1)


def _selective_sat(c, floor=0.35, thr=0.35):
    """Desaturate everything except already-strong colours (the 'only the red coat' look)."""
    _, s = _hue_sat(c)
    k = floor + (1 - floor) * np.clip((s - thr) / 0.3, 0, 1)
    y = _luma(c)[..., None]
    return np.clip(y + (c - y) * k[..., None], 0, 1)


FILM_STOCKS = {
    # softness sigma, halation strength, bloom strength, grain, gate weave px
    "35mm": dict(soft=0.6, hal=0.35, bloom=0.12, grain=7, weave=0.8),
    "16mm": dict(soft=1.1, hal=0.5, bloom=0.18, grain=14, weave=1.6),
    "super8": dict(soft=1.8, hal=0.6, bloom=0.25, grain=22, weave=2.8),
}


def film_filters(stock="35mm", grain=True):
    """ffmpeg filter chain emulating film: softness, red halation round highlights, bloom, grain, gate weave."""
    s = FILM_STOCKS[stock]
    w = s["weave"]
    return (f"split=3[f0][f1][f2];"
            f"[f1]lutrgb=r='if(gt(val,200),val,0)':g='if(gt(val,215),val*0.4,0)':b='if(gt(val,225),val*0.15,0)',"
            f"gblur=sigma=14[hal];"
            f"[f2]lutyuv=y='if(gt(val,190),val,16)',gblur=sigma=28[bl];"
            f"[f0]gblur=sigma={s['soft']}[soft];"
            f"[soft][hal]blend=all_mode=screen:all_opacity={s['hal']}[h1];"
            f"[h1][bl]blend=all_mode=screen:all_opacity={s['bloom']},"
            + (f"noise=c0s={s['grain']}:c0f=t+u:c1s={s['grain'] // 3}:c1f=t," if grain else "") +
            f"crop=iw-{int(4 * w + 4)}:ih-{int(4 * w + 4)}:x='{2 * w + 2}+{w}*sin(t*11)+{w / 2}*sin(t*23)'"
            f":y='{2 * w + 2}+{w}*sin(t*13+1)+{w / 2}*sin(t*29)',scale={W}:{H}")


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


def grade(inp, out, look=None, lut=None, strength=1.0, grain=0, vignette=False, film=None, film_grain=True):
    """Apply a mood look (or any downloaded .cube LUT), plus optional film emulation, grain and vignette.
    Order follows colourist practice: look first, then the film 'print' characteristics on top."""
    filters = []
    if lut:
        filters.append(f"lut3d=file='{lut}':interp=tetrahedral")
    elif look:
        tmp = Path(out).with_suffix(f".{look}.cube")
        write_cube(look, tmp, strength=strength)
        filters.append(f"lut3d=file='{tmp}':interp=tetrahedral")
    if film:
        filters.append(film_filters(film, grain=film_grain))
    if vignette:
        filters.append("vignette=angle=PI/5")
    if grain:
        filters.append(f"noise=alls={int(grain)}:allf=t")
    filters.append("format=yuv420p")
    graph = ",".join(filters)
    # the film chain has branches, so it needs a filter_complex with a labelled output
    vid = ["-filter_complex", graph + "[vout]", "-map", "[vout]"] if film else ["-vf", graph, "-map", "0:v"]
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(inp), *vid, "-map", "0:a?",
                    "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-c:a", "copy", str(out)], check=True)


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


SHOTS = {"wide": 1.0, "medium": 1.2, "close": 1.45, "extreme": 1.8}
# Shot patterns cycle per phrase. A real editor rarely goes wide->extreme; these are tested orders.
SHOT_PATTERNS = {
    "talk":    ["wide", "close", "medium", "close"],          # standard talking-head coverage
    "punch":   ["wide", "medium"],                            # gentle jump-zoom
    "drama":   ["medium", "close", "wide", "extreme", "medium", "close"],
    "minimal": ["wide", "medium", "wide", "medium"],
}
MOVES = ["handheld", "pan", "dolly", "pull", "orbit", "static"]


def face_centre(inp, every_s=0.5):
    """Median face centre (x, y) in pixels over the clip, or None. Used to frame close-ups on the face."""
    import cv2
    det_path = MODELS / "yunet.onnx"
    if not det_path.exists():
        return None
    cap = cv2.VideoCapture(str(inp))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    w0, h0 = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    sc = 480 / max(w0, h0)
    det = cv2.FaceDetectorYN.create(str(det_path), "", (int(w0 * sc), int(h0 * sc)), 0.7)
    pts, i, step = [], 0, max(1, int(fps * every_s))
    while cap.grab():
        if i % step == 0:
            _, fr = cap.retrieve()
            _, f = det.detect(cv2.resize(fr, (int(w0 * sc), int(h0 * sc))))
            if f is not None and len(f):
                f = max(f, key=lambda r: r[2] * r[3])
                pts.append(((f[0] + f[2] / 2) / sc, (f[1] + f[3] / 2) / sc))
        i += 1
    cap.release()
    return tuple(np.median(np.array(pts), 0)) if pts else None


def _ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def zoom_cap(src_h):
    """Largest sensible punch-in for a source: a 720p clip is already enlarged ~2.7x to fill 9:16,
    so it gets gentle shot changes; 4K landscape has room for real close-ups."""
    return float(np.clip(1.15 + 0.65 * (src_h / 2160), 1.2, 1.8))


def camera(inp, out, cuts=(), shots="punch", moves=("static",), push=0.0, shake=(), ease_frames=3,
           punch_zoom=None, move_amount=1.0, max_zoom=1.8):
    """Virtual multi-camera edit on a 1080x1920 clip.
    cuts:   times where the 'camera' changes (phrase starts from the transcript)
    shots:  pattern name from SHOT_PATTERNS, or a list like ["wide","close"]
    moves:  camera move per segment, cycled: handheld | pan | dolly | pull | orbit | static
    push:   extra slow push-in over the whole clip (0.06 = 6% closer at the end)
    shake:  times of a 0.35 s impact shake
    ease_frames: 3 = hard snap (cut feel), 12+ = smooth glide (Italian/French feel)
    """
    import cv2
    pattern = SHOT_PATTERNS[shots] if isinstance(shots, str) else list(shots)
    if punch_zoom and pattern == SHOT_PATTERNS["punch"]:
        pattern = ["wide", f"z{punch_zoom}"]
    # Compress the shot ladder to the resolution budget, keeping wide < medium < close < extreme.
    squeeze = min(1.0, (max_zoom - 1) / 0.8)
    zoom_of = lambda name: 1 + ((float(name[1:]) if name.startswith("z") else SHOTS[name]) - 1) * squeeze
    cap = cv2.VideoCapture(str(inp))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    w0, h0 = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    dur = n / fps
    face = face_centre(inp) or (w0 / 2, h0 * 0.42)
    bounds = [0.0] + sorted(t for t in cuts if 0 < t < dur) + [dur]
    segs = [(bounds[k], bounds[k + 1], zoom_of(pattern[k % len(pattern)]), moves[k % len(moves)])
            for k in range(len(bounds) - 1)]
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w0}x{h0}",
        "-r", str(fps), "-i", "-", "-i", str(inp), "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-crf", "16",
        "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest", str(out)], stdin=subprocess.PIPE)
    rng = np.random.default_rng(7)
    jitter = rng.normal(size=(int(fps * 0.4) + 2, 2))
    ph = rng.uniform(0, 6.28, 6)
    i, k = 0, 0
    A = move_amount
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        t = i / fps
        while k + 1 < len(segs) and t >= segs[k + 1][0]:
            k += 1
        s0, s1, z, mv = segs[k]
        u = (t - s0) / max(s1 - s0, 1e-3)            # progress through this shot, 0..1
        if k and t - s0 < ease_frames / fps:         # blend from the previous framing
            z = segs[k - 1][2] + (z - segs[k - 1][2]) * _ease((t - s0) * fps / ease_frames)
        dx = dy = rot = 0.0
        zm = 1.0
        if mv == "handheld":                          # slow organic drift, like a person holding the phone
            dx = A * 7 * (np.sin(t * 1.3 + ph[0]) + 0.5 * np.sin(t * 2.9 + ph[1]))
            dy = A * 6 * (np.sin(t * 1.1 + ph[2]) + 0.5 * np.sin(t * 3.3 + ph[3]))
            rot = A * 0.35 * np.sin(t * 0.9 + ph[4]); zm = 1.03
        elif mv == "pan":                              # lateral slide across the shot
            dx = A * 40 * (_ease(u) - 0.5); zm = 1.05
        elif mv == "dolly":                            # push in through the shot
            zm = 1.0 + A * 0.07 * _ease(u)
        elif mv == "pull":                             # pull out (reveal)
            zm = 1.0 + A * 0.07 * (1 - _ease(u))
        elif mv == "orbit":                            # fake orbit: rotate + slide + slight zoom
            rot = A * 1.6 * (_ease(u) - 0.5); dx = A * 30 * (0.5 - _ease(u)); zm = 1.07
        z = z * zm * (1 + push * i / n)
        for sh in shake:
            if 0 <= t - sh < 0.35:
                amp = 18 * (1 - (t - sh) / 0.35)
                j = jitter[int((t - sh) * fps)]
                dx, dy, z = dx + amp * j[0], dy + amp * j[1], z * 1.03
        # Zoom about the face: at z=1 the frame is untouched, closer shots slide the face to 40% height.
        tgt = (w0 / 2, h0 * 0.43)   # keep room above the head in close shots
        a = min(1.0, (z - 1) / 0.45)
        cx, cy = face[0] + (tgt[0] - face[0]) * a, face[1] + (tgt[1] - face[1]) * a
        M = cv2.getRotationMatrix2D((float(face[0]), float(face[1])), float(rot), float(z))
        M[0, 2] += cx - face[0] + dx
        M[1, 2] += cy - face[1] + dy
        # keep the image covering the frame (no black/reflected edges)
        M[0, 2] = min(0.0, max(w0 - z * w0, M[0, 2])) if not rot else M[0, 2]
        M[1, 2] = min(0.0, max(h0 - z * h0, M[1, 2])) if not rot else M[1, 2]
        fr = cv2.warpAffine(fr, M, (w0, h0), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        enc.stdin.write(fr.tobytes())
        i += 1
    enc.stdin.close(); enc.wait(); cap.release()


def motion(inp, out, punch=(), punch_zoom=1.14, push=0.0, shake=(), centre_y=0.42):
    """Backwards-compatible: wide/close jump zoom at `punch` times."""
    camera(inp, out, cuts=punch, shots="punch", punch_zoom=punch_zoom, push=push, shake=shake)


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


# ================================================================ virtual lighting (relight in the edit)
# Physical setups this imitates (see GUIDE.md section 9). Every preset is a recipe of virtual lights:
#   key: (side -1 = from viewer's left, +1 = right, 0 = front), height 0..1 (1 = from above), ratio (lit:shadow), colour K
#   fill: shadow lift 0..1   rim: (strength, colour K)   bg: (dim 0..1, gel colour or None, gel side)
LIGHTS = {
    "auto":      dict(desc="Fix only: brings an under- or over-exposed face to a healthy level, leaves good exposure alone",
                      key=None, fill=0.15, rim=None, bg=(0.0, None, 0)),
    "creator":   dict(desc="Modern YouTube/Reels look: soft 45-degree key, warm rim for separation, slightly darker background",
                      key=(-1, 0.6, 2.0, 5000), fill=0.25, rim=(0.35, 3800), bg=(0.18, None, 0)),
    "loop":      dict(desc="Loop lighting: key 30-45 degrees and a little high - the most flattering everyday portrait light",
                      key=(-1, 0.7, 2.5, 5200), fill=0.2, rim=(0.2, 5200), bg=(0.1, None, 0)),
    "rembrandt": dict(desc="Rembrandt: strong 45-degree key, deep shadow side (4:1), moody and cinematic",
                      key=(-1, 0.75, 4.0, 4800), fill=0.05, rim=(0.3, 4300), bg=(0.35, None, 0)),
    "butterfly": dict(desc="Butterfly/paramount: frontal key from above - glamour, beauty, even and bright",
                      key=(0, 0.9, 1.6, 5600), fill=0.35, rim=(0.15, 5600), bg=(0.0, None, 0)),
    "split":     dict(desc="Split light: 90-degree side key, half the face in shadow - drama, mystery, villain",
                      key=(-1, 0.5, 6.0, 5000), fill=0.0, rim=(0.25, 6500), bg=(0.45, None, 0)),
    "window":    dict(desc="Soft daylight from a side window: natural, European arthouse feel",
                      key=(1, 0.55, 2.2, 5800), fill=0.3, rim=None, bg=(0.05, None, 0)),
    "golden":    dict(desc="Low warm golden-hour sun from the side + warm rim: Italian summer",
                      key=(1, 0.4, 2.4, 3400), fill=0.25, rim=(0.45, 3000), bg=(0.08, (255, 170, 90), 1)),
    "overcast":  dict(desc="Flat soft overcast light, low contrast, cool: British documentary",
                      key=(0, 0.8, 1.3, 6800), fill=0.45, rim=None, bg=(0.05, None, 0)),
    "neon":      dict(desc="Two-tone gels: teal background wash + magenta rim - tech, gaming, night creator",
                      key=(-1, 0.6, 2.0, 5600), fill=0.15, rim=(0.6, (255, 60, 200)), bg=(0.35, (0, 200, 210), 1)),
    "noir":      dict(desc="Hard side key, black background, cold rim: film noir / thriller",
                      key=(1, 0.65, 5.0, 4800), fill=0.0, rim=(0.35, 7500), bg=(0.65, None, 0)),
}


def kelvin_rgb(k):
    """Approximate RGB multiplier (normalised to green) for a colour temperature, 2000-10000 K."""
    t = k / 100
    r = 255 if t <= 66 else 329.7 * (t - 60) ** -0.1332
    g = 99.47 * math.log(t) - 161.12 if t <= 66 else 288.12 * (t - 60) ** -0.0755
    b = 255 if t >= 66 else (0 if t <= 19 else 138.52 * math.log(t - 10) - 305.04)
    rgb = np.clip(np.array([r, g, b]), 1, 255)
    return rgb / rgb[1]


def _rgb_of(c):
    """Colour spec -> linear RGB multiplier: a Kelvin number or an (R,G,B) tuple."""
    if isinstance(c, (int, float)):
        return kelvin_rgb(c)
    v = np.array(c, float) / 255
    return v / max(v.max(), 1e-6)


def relight(inp, out, preset="creator", strength=1.0, side=None, target_face=0.5, smooth=0.6):
    """Relight a person in the edit using MediaPipe's multiclass segmentation (background/hair/skin/face/clothes).
    The face mask locates the face every frame, so the virtual key light follows the person.
    Light maps are computed at quarter resolution (light is smooth) and gamma is done with lookup tables."""
    import cv2, mediapipe as mp
    from mediapipe.tasks.python import vision, BaseOptions
    P = LIGHTS[preset]
    seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
        base_options=BaseOptions(model_asset_path=str(MODELS / "selfie_multiclass.tflite")),
        output_confidence_masks=True))
    cap = cv2.VideoCapture(str(inp))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    w0, h0 = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w0}x{h0}",
        "-r", str(fps), "-i", "-", "-i", str(inp), "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-crf", "16",
        "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest", str(out)], stdin=subprocess.PIPE)
    dec = ((np.arange(256) / 255.0) ** 2.2).astype(np.float32)            # sRGB-ish -> linear
    encl = (np.clip(np.linspace(0, 1, 4096) ** (1 / 2.2), 0, 1) * 255).astype(np.uint8)
    q = 4                                                                  # light-map downscale
    lw, lh = w0 // q, h0 // q
    ys, xs = np.mgrid[0:lh, 0:lw].astype(np.float32) * q
    bgr = lambda c: _rgb_of(c)[::-1].astype(np.float32)                   # frames are BGR
    person_prev = face_state = gain_prev = add_prev = None
    expo_s = 1.0
    S = strength
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        small = cv2.cvtColor(cv2.resize(fr, (lw * 2, lh * 2)), cv2.COLOR_BGR2RGB)
        ms = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(small))).confidence_masks
        person = cv2.resize(1 - ms[0].numpy_view()[..., 0], (lw, lh))
        facem = cv2.resize(ms[3].numpy_view()[..., 0], (lw, lh))
        person_prev = person if person_prev is None else smooth * person + (1 - smooth) * person_prev
        pm = cv2.GaussianBlur(np.clip((person_prev - 0.4) / 0.25, 0, 1).astype(np.float32), (0, 0), 1.5)
        tot = float(facem.sum())
        if tot > 20:
            fx, fy = float((facem * xs).sum() / tot), float((facem * ys).sum() / tot)
            cur = np.array([fx, fy, math.sqrt(tot / math.pi) * q])
            face_state = cur if face_state is None else 0.8 * face_state + 0.2 * cur
            # auto exposure from face skin only, with a dead band: well-exposed faces are left alone
            fs = cv2.resize(fr, (lw, lh)).astype(np.float32).mean(-1) / 255
            lum = float((fs * facem).sum() / tot)
            want = 1.0 if 0.38 <= lum <= 0.62 else np.clip(target_face / max(lum, 0.05), 0.7, 1.6) ** 2.2
            expo_s = 0.9 * expo_s + 0.1 * want
        fx, fy, rad = face_state if face_state is not None else (w0 / 2, h0 * 0.4, w0 * 0.12)
        g = np.full((lh, lw, 3), 1.0, np.float32)
        add = np.zeros((lh, lw, 3), np.float32)
        g *= 1 + (expo_s - 1) * (0.85 * pm + 0.15)[..., None]
        if P["key"]:
            kside, height, ratio, kcol = P["key"]
            if side is not None:
                kside = side
            ratio = 1 + (ratio - 1) * S
            if kside:
                lat = np.clip(0.5 + kside * (xs - fx) / (1.1 * rad), 0, 1)
                lat = lat * lat * (3 - 2 * lat)                              # smoothstep: soft-box falloff
            else:
                lat = np.full_like(xs, 0.5)
            vert = np.clip(0.5 + height * (fy - ys) / (2.5 * rad), 0, 1)
            shape = lat * (0.7 + 0.3 * vert) if kside else 0.3 + 0.7 * vert
            lit, shadow = 2 * ratio / (ratio + 1), 2 / (ratio + 1)
            kg = shadow + (lit - shadow) * shape
            kg = kg + (1 - kg) * P["fill"]                                  # fill lifts the shadow side
            kc = 1 + (bgr(kcol) - 1) * 0.5 * S
            m = pm * 0.8 + 0.2                                              # some key light spills onto the room
            g *= 1 + (kg[..., None] * kc - 1) * m[..., None]
        elif P["fill"]:
            g *= 1 + P["fill"] * 0.3 * pm[..., None]
        if P["rim"]:
            rs, rcol = P["rim"]
            edge = np.clip(pm - cv2.erode(pm, np.ones((5, 5), np.uint8)), 0, 1)
            edge = cv2.GaussianBlur(edge, (0, 0), 1.2)
            rim_side = -(P["key"][0] if P["key"] else 1) or 1
            if side is not None:
                rim_side = -side or 1
            sidew = np.clip(0.5 + rim_side * (xs - fx) / (2.5 * rad), 0.2, 1)
            add += (edge * sidew * rs * S)[..., None] * bgr(rcol) * 0.5
        dim, gel, gside = P["bg"]
        bgm = (1 - pm)[..., None]
        g *= 1 - dim * S * bgm
        if gel is not None:
            grad = np.clip(0.5 + gside * (xs - w0 / 2) / w0, 0, 1) ** 1.2
            add += bgm * (grad[..., None] * 0.22 * S) * bgr(gel)
        gain_prev = g if gain_prev is None else 0.7 * gain_prev + 0.3 * g      # lights don't flicker
        add_prev = add if add_prev is None else 0.7 * add_prev + 0.3 * add
        G = cv2.resize(gain_prev, (w0, h0), interpolation=cv2.INTER_LINEAR)
        A = cv2.resize(add_prev, (w0, h0), interpolation=cv2.INTER_LINEAR)
        lin = dec[fr]
        res = lin * G + A * (0.1 + lin)                                    # additive light scales with what's lit
        res = np.where(res > 0.85, 0.85 + (res - 0.85) / (1 + (res - 0.85) * 3), res)  # gentle highlight roll-off
        enc.stdin.write(encl[np.clip(res * 4095, 0, 4095).astype(np.int32)].tobytes())
    enc.stdin.close(); enc.wait(); cap.release(); seg.close()
