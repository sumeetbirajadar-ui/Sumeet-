#!/usr/bin/env python3
"""Instagram Reels editing toolkit.

One command per editing step, plus `auto` that runs the whole chain:

  cut        remove silences / dead air          (auto-editor)
  vertical   make 1080x1920: face-tracked crop, blurred fill, or centre crop
  audio      clean voice: rumble cut, denoise, loudness to -14 LUFS
  music      add background music that ducks under the voice
  transcribe speech -> words.json with word timings (faster-whisper)
  captions   words.json -> animated word-by-word captions, burned in
  export     final Instagram-ready H.264/AAC MP4
  cover      1080x1920 cover image with a title
  grade/looks/luts  mood colour grades (also exported as .cube LUTs)
  motion     punch-in zooms, slow push-in, impact shake
  bg         blur or replace the background behind the person
  light/lights  virtual relighting: key/fill/rim/background/gels (creator, rembrandt, golden, neon...)
  sfx/sfx-kit  royalty-free sound effects (whoosh, pop, riser, impact...)
  auto       cut -> vertical -> [bg] -> [punch/push] -> [grade] -> audio -> [music] -> [sfx]
             -> captions -> export -> cover   ([..] = optional flags)

Run `python3 reels/reel.py <command> -h` for options.
"""
import argparse, json, math, os, re, shutil, subprocess, sys, tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import fx  # noqa: E402  (colour looks, camera moves, background, SFX)

W, H, FPS = 1080, 1920, 30
YUNET = Path.home() / ".cache/reels/yunet.onnx"

# Caption fonts per script. Latin captions are uppercased; Indic ones are not.
FONTS = {"latin": "Poppins ExtraBold", "kn": "Noto Sans Kannada", "hi": "Noto Sans Devanagari"}

# ASS colours are &HAABBGGRR
HIGHLIGHTS = {"yellow": "&H0000E6FF", "green": "&H0050FF7A", "red": "&H002828D6", "cyan": "&H00FFE600",
              "gold": "&H0042C5F5", "cream": "&H00C8E6F5", "ice": "&H00FFE7BD", "white": "&H00FFFFFF"}

# Editing styles = how creators in each country actually edit Reels/Shorts: caption typography and casing,
# how many words are on screen, how often the framing changes, keyword pops, branding and the legally
# required sponsorship label. Based on the top creators' Shorts (covers) and native-language tutorials
# (GUIDE.md section 12). Colour is NOT part of a country style: use --look / --light separately if wanted.
STYLES = {
    "american": dict(desc="US creator style (Hormozi/MrBeast school): 2-3 word ALL-CAPS captions, yellow active word, snap zooms every ~2 s, SFX",
        case="upper", words=3, lines=1, line_chars=22, cap_box=False, cap_color="white", highlight="yellow",
        font="Poppins ExtraBold", size=108, outline=7, anim="pop", hook_box=True, pos=0.66, keywords=None,
        key_style="pop", shots="punch", punch_zoom=1.14, moves=["static"], ease=2, cut_gap=2.2, sfx=True,
        margin="0.2s", light="auto", label="#ad"),
    "french": dict(desc="French creators (Dr Nozman, Lena Situations, Strategie Video): sentence-case 2-line subtitles, soft shadow, "
                        "key terms popping in yellow caps, 'mini zooms' everywhere, tight hook",
        case="sentence", words=7, lines=2, line_chars=26, cap_box=False, cap_color="white", highlight="none",
        font="Montserrat", size=82, outline=3, anim="fade", hook_box=True, pos=0.72, keywords="auto",
        key_style="pop", shots="punch", punch_zoom=1.08, moves=["static"], ease=6, cut_gap=2.6, sfx=True,
        margin="0.2s", light="auto", label="Collaboration commerciale"),
    "italian": dict(desc="Italian creators (Geopop, Khaby-era talking heads): subtitles in a translucent dark box, key words in a "
                         "yellow highlight box, logo top-left, direct-to-camera with gentle punch-ins",
        case="sentence", words=7, lines=2, line_chars=28, cap_box=True, cap_color="white", highlight="none",
        font="Montserrat", size=74, outline=12, anim="fade", hook_box=True, pos=0.74, keywords="auto",
        key_style="box", shots="punch", punch_zoom=1.10, moves=["static"], ease=4, cut_gap=3.0, sfx=False,
        margin="0.2s", light="auto", label="ADV"),
    "german": dict(desc="German explainers (Doktor Whatson, MrWissen2go, simplicissimus): one word at a time, lowercase-clean, "
                        "calm studio framing, few effects, mandatory 'Werbung' label when sponsored",
        case="sentence", words=1, lines=1, line_chars=22, cap_box=False, cap_color="white", highlight="none",
        font="Montserrat", size=112, outline=5, anim="pop", hook_box=True, pos=0.70, keywords=None,
        key_style="pop", shots="minimal", punch_zoom=1.08, moves=["static"], ease=4, cut_gap=3.5, sfx=False,
        margin="0.25s", light="auto", label="Werbung"),
    "british": dict(desc="UK creators (Max Fosh vlog energy, Steve Mould science): handheld, 2-3 word bold caps captions with "
                         "yellow active word, frequent cut-ins, dry pacing, '#ad' label",
        case="upper", words=3, lines=1, line_chars=20, cap_box=False, cap_color="white", highlight="yellow",
        font="Montserrat", size=96, outline=6, anim="pop", hook_box=True, pos=0.66, keywords=None,
        key_style="pop", shots="talk", punch_zoom=1.12, moves=["handheld"], ease=3, cut_gap=2.4, sfx=False,
        margin="0.2s", light="auto", label="#ad"),
    "spanish": dict(desc="Spanish science creators (CdeCiencia, QuantumFracture): one huge yellow word at a time with thick "
                         "black outline, keyword slams, fast cuts, SFX",
        case="upper", words=1, lines=1, line_chars=20, cap_box=False, cap_color="yellow", highlight="none",
        font="Poppins ExtraBold", size=150, outline=9, anim="pop", hook_box=True, pos=0.66, keywords="auto",
        key_style="pop", shots="punch", punch_zoom=1.12, moves=["static"], ease=2, cut_gap=2.0, sfx=True,
        margin="0.15s", light="auto", label="Publicidad"),
    "european": dict(desc="Common European education style (FR/IT/DE science channels): calm sentence-case boxed subtitles, "
                          "keyword highlights, measured cut-ins, clear sponsorship label",
        case="sentence", words=6, lines=2, line_chars=26, cap_box=True, cap_color="white", highlight="none",
        font="Montserrat", size=74, outline=12, anim="fade", hook_box=True, pos=0.74, keywords="auto",
        key_style="box", shots="minimal", punch_zoom=1.08, moves=["static"], ease=5, cut_gap=3.2, sfx=False,
        margin="0.25s", light="auto", label="Ad"),
}
STYLE_KEYS = ["light", "look", "film", "grain", "vignette", "shots", "moves", "ease", "cut_gap", "font", "italic",
              "case", "size", "highlight", "anim", "outline", "hook_box", "words", "sfx", "margin", "lines",
              "line_chars", "cap_box", "cap_color", "keywords", "key_style", "pos", "punch_zoom"]
BASE = dict(light=None, look=None, film=None, grain=0, vignette=False, shots=None, moves=["static"], ease=3, cut_gap=2.2,
            font=None, italic=False, case="upper", size=None, highlight="yellow", anim="pop", outline=7,
            hook_box=True, words=3, sfx=False, margin="0.25s", lines=1, line_chars=22, cap_box=False,
            cap_color="white", keywords=None, key_style="pop", pos=0.68, punch_zoom=1.14)


def resolve_style(a):
    """Fill every option the user didn't set from the chosen style, then from BASE."""
    st = STYLES.get(getattr(a, "style", None) or "", {})
    for k in STYLE_KEYS:
        cur = getattr(a, k, None)
        # None = not given; False = an on/off flag that wasn't switched on, so the style may switch it on
        if cur is None or (cur is False and st.get(k)):
            setattr(a, k, st.get(k, BASE[k]))
    if isinstance(a.moves, str):
        a.moves = a.moves.split(",")
    if isinstance(a.shots, str) and "," in a.shots:
        a.shots = a.shots.split(",")
    return a


def run(cmd, **kw):
    print("  $", " ".join(str(c) for c in cmd)[:300], flush=True)
    subprocess.run([str(c) for c in cmd], check=True, **kw)


def probe(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries",
        "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", str(path)])
    j = json.loads(out)
    v = next((s for s in j["streams"] if s["codec_type"] == "video"), None)
    a = any(s["codec_type"] == "audio" for s in j["streams"])
    return {"w": v and v["width"], "h": v and v["height"], "dur": float(j["format"]["duration"]), "audio": a}


# ---------------------------------------------------------------- cut
def cmd_cut(a):
    """Drop silent stretches but keep a margin so word endings are never clipped."""
    run(["auto-editor", a.input, "--edit", f"audio:threshold={a.threshold}", "--margin", a.margin or "0.25s",
         "--no-open", "--progress", "none", "-o", a.output])


# ---------------------------------------------------------------- vertical
def face_track(path, step=0.2):
    """Return a smoothed list of (time, cx, cy) for the main face, in source pixels."""
    import cv2
    cap = cv2.VideoCapture(str(path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    sw, sh = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    scale = 480 / max(sw, sh)
    dw, dh = int(sw * scale), int(sh * scale)
    det = cv2.FaceDetectorYN.create(str(YUNET), "", (dw, dh), 0.7)
    pts, i, every = [], 0, max(1, round(fps * step))
    while True:
        ok = cap.grab()
        if not ok:
            break
        if i % every == 0:
            _, fr = cap.retrieve()
            _, faces = det.detect(cv2.resize(fr, (dw, dh)))
            if faces is not None and len(faces):
                f = max(faces, key=lambda f: f[2] * f[3])  # biggest face = speaker
                pts.append((i / fps, (f[0] + f[2] / 2) / scale, (f[1] + f[3] / 2) / scale))
            else:
                pts.append((i / fps, None, None))
        i += 1
    cap.release()
    # Fill gaps with the last seen face (or frame centre), then smooth with a
    # dead-zone so the virtual camera holds still for small head movements.
    last = (sw / 2, sh / 2)
    filled = []
    for t, x, y in pts:
        if x is not None:
            last = (x, y)
        filled.append((t, *last))
    cam, out = None, []
    for t, x, y in filled:
        if cam is None:
            cam = [x, y]
        dead = sw * 0.06
        if abs(x - cam[0]) > dead:
            cam[0] += (x - cam[0]) * 0.25
        if abs(y - cam[1]) > dead:
            cam[1] += (y - cam[1]) * 0.25
        out.append((t, cam[0], cam[1]))
    return out, fps, (sw, sh)


def vertical_face(inp, out, zoom=1.0):
    import cv2, numpy as np
    track, fps, (sw, sh) = face_track(inp)
    # Largest 9:16 window that fits in the source, optionally tighter.
    ch = min(sh, sw * 16 / 9) / zoom
    cw = ch * 9 / 16
    cap = cv2.VideoCapture(str(inp))
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24",
        "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-i", str(inp), "-map", "0:v", "-map", "1:a?",
        "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy",
        "-shortest", str(out)], stdin=subprocess.PIPE)
    i, k = 0, 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        t = i / fps
        while k + 1 < len(track) and track[k + 1][0] <= t:
            k += 1
        # interpolate between samples for a smooth pan
        t0, x0, y0 = track[k]
        t1, x1, y1 = track[min(k + 1, len(track) - 1)]
        u = 0 if t1 == t0 else min(1, (t - t0) / (t1 - t0))
        cx, cy = x0 + (x1 - x0) * u, y0 + (y1 - y0) * u
        x = int(min(max(cx - cw / 2, 0), sw - cw))
        y = int(min(max(cy - ch * 0.4, 0), sh - ch))  # face a little above centre
        crop = fr[y:y + int(ch), x:x + int(cw)]
        enc.stdin.write(cv2.resize(crop, (W, H), interpolation=cv2.INTER_LANCZOS4).tobytes())
        i += 1
    enc.stdin.close()
    enc.wait()
    cap.release()


def cmd_vertical(a):
    p = probe(a.input)
    if p["w"] * 16 == p["h"] * 9 and p["w"] >= W:  # already 9:16
        vf = f"scale={W}:{H}:flags=lanczos"
    elif a.mode == "face":
        return vertical_face(a.input, a.output, a.zoom)
    elif a.mode == "crop":
        vf = f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H}"
    else:  # blur: whole frame in the middle, blurred copy filling the background
        vf = (f"split[bg][fg];[bg]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
              f"boxblur=40:2,eq=brightness=-0.08[b];[fg]scale={W}:-2:flags=lanczos[f];"
              f"[b][f]overlay=(W-w)/2:(H-h)/2")
    run(["ffmpeg", "-y", "-v", "error", "-i", a.input, "-filter_complex", f"[0:v]{vf},fps={FPS},format=yuv420p",
         "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-c:a", "copy", a.output])


# ---------------------------------------------------------------- audio
VOICE = "highpass=f=80,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=120"
LOUD = "loudnorm=I=-14:TP=-1.5:LRA=11"


def cmd_audio(a):
    run(["ffmpeg", "-y", "-v", "error", "-i", a.input, "-af", f"{VOICE},{LOUD}", "-ar", "48000",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", a.output])


def cmd_music(a):
    """Music under the voice; it ducks automatically whenever someone speaks."""
    # Carve a small mid-range "pocket" in the music (1-4 kHz) so the voice sits on top of it, as mixers do.
    fc = (f"[1:a]volume={a.volume},equalizer=f=2200:t=q:w=1.1:g=-5,aloop=loop=-1:size=2e9[m];"
          f"[0:a]asplit[v][sc];[m][sc]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=350[md];"
          f"[v][md]amix=inputs=2:duration=first:normalize=0,afade=t=out:st={probe(a.input)['dur'] - 1.5:.2f}:d=1.5,{LOUD}[a]")
    run(["ffmpeg", "-y", "-v", "error", "-i", a.input, "-i", a.music, "-filter_complex", fc,
         "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", a.output])


# ---------------------------------------------------------------- transcribe
def cmd_transcribe(a):
    from faster_whisper import WhisperModel
    m = WhisperModel(a.model, device="cpu", compute_type="int8")
    # Decode with ffmpeg ourselves (16 kHz mono float) so we don't depend on PyAV's version.
    import numpy as np
    pcm = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(a.input), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"])
    segs, info = m.transcribe(np.frombuffer(pcm, np.float32), language=a.lang, word_timestamps=True, vad_filter=True,
                              initial_prompt=a.prompt)
    words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)}
             for s in segs for w in s.words if w.word.strip()]
    Path(a.output).write_text(json.dumps({"lang": info.language, "words": words}, ensure_ascii=False, indent=1))
    print(f"  {len(words)} words, language={info.language} -> {a.output} (edit it to fix any wrong words)")


# ---------------------------------------------------------------- captions
def ass_time(t):
    t = max(0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def group_words(words, max_words, max_chars):
    groups, cur = [], []
    for w in words:
        gap = cur and w["s"] - cur[-1]["e"] > 0.45
        long = cur and (len(cur) >= max_words or len(" ".join(x["w"] for x in cur + [w])) > max_chars)
        if gap or long:
            groups.append(cur)
            cur = []
        cur.append(w)
        if re.search(r"[.!?।]$", w["w"]):
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    return groups


def _wrap2(text, line_chars):
    """Break a subtitle into two balanced lines (European subtitle convention) when it's long."""
    if len(text) <= line_chars or " " not in text:
        return text
    mid = len(text) // 2
    cut = min((i for i, ch in enumerate(text) if ch == " "), key=lambda i: abs(i - mid))
    return text[:cut] + "\\N" + text[cut + 1:]


def pick_keywords(words, spec, min_gap=2.5, after=0.0):
    """Words to 'pop' big on screen: numbers, proper nouns mid-sentence, long technical words,
    or an explicit comma list. Spaced out so it never becomes visual noise."""
    if not spec or spec == "none":
        return []
    wanted = None if spec == "auto" else {w.strip().lower() for w in spec.split(",")}
    out, last = [], -99
    for i, w in enumerate(words):
        t = re.sub(r"[^\w-]", "", w["w"])
        if not t:
            continue
        if wanted is not None:
            hit = t.lower() in wanted
        else:
            prev = words[i - 1]["w"] if i else "."
            proper = t[0].isupper() and not re.search(r"[.!?]$", prev) and t.lower() not in ("i", "i'm")
            hit = any(c.isdigit() for c in t) or proper or len(t) >= 9
        if hit and w["s"] >= after and w["s"] - last >= min_gap:
            out.append(w); last = w["s"]
    return out


def build_ass(data, a):
    lang = data.get("lang", "en")
    script = lang if lang in FONTS else "latin"
    # Indic scripts always use their Noto font; style fonts only apply to Latin text.
    font = (getattr(a, "font", None) or FONTS["latin"]) if script == "latin" else FONTS[script]
    case = getattr(a, "case", None) or ("upper" if getattr(a, "upper", True) and not getattr(a, "no_upper", False) else "sentence")
    if script != "latin":
        case = "sentence"
    fix = {"upper": str.upper, "lower": str.lower}.get(case, lambda x: x)
    italic = -1 if getattr(a, "italic", False) and script == "latin" else 0
    hlname = getattr(a, "highlight", None) or "yellow"
    hl = HIGHLIGHTS.get(hlname)
    base_col = HIGHLIGHTS.get(getattr(a, "cap_color", None) or "white")
    a.words = getattr(a, "words", None) or 3
    size = a.size or (108 if script == "latin" else 96)
    outline = getattr(a, "outline", None) or 7
    shadow = 3 if outline >= 5 else 5        # thin-outline styles lean on a soft shadow instead
    anim = getattr(a, "anim", None) or "pop"
    hook_box = getattr(a, "hook_box", True)
    cap_box = getattr(a, "cap_box", False)
    lines = getattr(a, "lines", None) or 1
    line_chars = getattr(a, "line_chars", None) or 22
    a.pos = getattr(a, "pos", None) or 0.68
    margin_v = int(H * (1 - a.pos))  # distance from bottom
    # Caption box (Italian/German subtitle look): opaque-box border style with a translucent black box.
    cap_border = f"3,{max(outline, 12)},0" if cap_box else f"1,{outline},{shadow}"
    cap_back = "&H64000000" if cap_box else "&H96000000"
    key_box = getattr(a, "key_style", "pop") == "box"
    # NB: letter-spacing must stay 0 for Kannada/Devanagari or libass breaks the vowel signs apart.
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{font},{size},{base_col},&H00FFFFFF,{cap_back if cap_box else '&H00000000'},{cap_back},-1,{italic},0,0,100,100,{1 if script == 'latin' and not cap_box else 0},0,{cap_border},2,90,90,{margin_v},1
Style: Hook,{font},{int(size * 1.05)},&H00FFFFFF,&H00FFFFFF,&H00000000,{'&H00000000' if hook_box else '&H78000000'},-1,{italic},0,0,100,100,0,0,{3 if hook_box else 1},{26 if hook_box else 2},{0 if hook_box else 6},8,70,70,330,1
Style: Key,{font},{int(size * 1.9)},{'&H00101010' if key_box else '&H0000E6FF'},&H00FFFFFF,{'&H0000E6FF' if key_box else '&H00000000'},&H96000000,-1,0,0,0,100,100,0,0,{'3,18,0' if key_box else '1,9,4'},5,60,60,0,1
Style: Label,Montserrat,46,&H00FFFFFF,&H00FFFFFF,&H50000000,&H50000000,-1,0,0,0,100,100,0,0,3,10,0,7,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    dur_end = max((w["e"] for w in data["words"]), default=0) + 2
    if getattr(a, "label", None):   # legal sponsorship label, visible the whole time (FR/IT/DE/UK rules)
        ev.append(f"Dialogue: 3,{ass_time(0)},{ass_time(dur_end)},Label,,0,0,0,,{{\\pos(60,{getattr(a, 'label_y', 300)})}}{a.label}")
    if a.hook:
        hook = fix(a.hook)
        ev.append(f"Dialogue: 1,{ass_time(0)},{ass_time(a.hook_secs)},Hook,,0,0,0,,"
                  f"{{\\fad(150,250)\\3c&H00000000&\\1c&H00FFFFFF&}}{hook}")
    caps = []
    for g in group_words(data["words"], a.words, a.chars):
        # trailing commas/full stops look cluttered on screen; keep ? and !
        toks = [re.sub(r"[,.;:।]+$", "", fix(x["w"])) for x in g]
        pop_in = "{\\fad(150,0)}" if anim == "fade" else "{\\fscx80\\fscy80\\t(0,90,\\fscx100\\fscy100)}"
        if hl is None:                       # plain subtitle: whole phrase, no per-word colour
            text = " ".join(toks)
            caps.append([g[0]["s"], g[-1]["e"] + 0.3, pop_in + (_wrap2(text, line_chars) if lines > 1 else text)])
            continue
        for i, w in enumerate(g):
            end = g[i + 1]["s"] if i + 1 < len(g) else w["e"] + 0.3
            parts = [f"{{\\1c{hl}&\\fscx112\\fscy112}}{t}{{\\1c{base_col}&\\fscx100\\fscy100}}" if j == i else t
                     for j, t in enumerate(toks)]
            text = " ".join(parts)
            if lines > 1 and len(" ".join(toks)) > line_chars:
                k = len(toks) // 2
                text = " ".join(parts[:k]) + "\\N" + " ".join(parts[k:])
            caps.append([w["s"], end, (pop_in if i == 0 else "") + text])
    # Never let two caption lines share the screen: cut each one off where the next begins.
    for k in range(len(caps) - 1):
        caps[k][1] = min(caps[k][1], caps[k + 1][0])
    ev += [f"Dialogue: 0,{ass_time(s)},{ass_time(e)},Cap,,0,0,0,,{t}" for s, e, t in caps if e > s]
    # Keyword pops: the French/Spanish science-creator habit of slamming the key term big on screen.
    a._key_times = []
    for w in pick_keywords(data["words"], getattr(a, "keywords", None), after=a.hook_secs + 0.3 if a.hook else 0):
        t = re.sub(r"[,.;:!?]+$", "", w["w"]).upper()
        ev.append(f"Dialogue: 2,{ass_time(w['s'])},{ass_time(w['s'] + 1.0)},Key,,0,0,0,,"
                  f"{{\\pos({W // 2},{int(H * 0.56)})\\fscx60\\fscy60\\t(0,120,\\fscx100\\fscy100)\\fad(0,200)}}{t}")
        a._key_times.append(w["s"])
    return head + "\n".join(ev) + "\n"


def cmd_captions(a):
    data = json.loads(Path(a.words_json).read_text())
    ass = Path(a.output).with_suffix(".ass")
    ass.write_text(build_ass(data, a), encoding="utf-8")
    fontsdir = Path.home() / ".local/share/fonts"
    vf = f"ass={ass}:fontsdir={fontsdir}"
    logo = getattr(a, "logo", None)
    if logo:   # channel logo top-left, inside the safe zone (Geopop / Science Etonnante habit)
        extra = ["-i", logo]
        chain = f"[0:v]{vf}[c];[1:v]scale=170:-1,format=rgba,colorchannelmixer=aa=0.9[lg];[c][lg]overlay=50:250"
        if a.progress:
            chain += f"[c2];color=c=0xF5C542:s={W}x10[bar];[c2][bar]overlay=x='-W+W*t/{probe(a.input)['dur']:.3f}':y=0:shortest=1"
        chain += "[v]"
        run(["ffmpeg", "-y", "-v", "error", "-i", a.input, "-loop", "1", *extra, "-filter_complex", chain,
             "-shortest", "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-c:a", "copy", a.output])
        print(f"  captions file: {ass}")
        return
    if a.progress:
        vf = f"[0:v]{vf}[c];color=c=0xF5C542:s={W}x10[bar];[c][bar]overlay=x='-W+W*t/{probe(a.input)['dur']:.3f}':y=0:shortest=1"
        run(["ffmpeg", "-y", "-v", "error", "-i", a.input, "-filter_complex", vf, "-c:v", "libx264",
             "-crf", "16", "-preset", "medium", "-c:a", "copy", a.output])
    else:
        run(["ffmpeg", "-y", "-v", "error", "-i", a.input, "-vf", vf, "-c:v", "libx264", "-crf", "16",
             "-preset", "medium", "-c:a", "copy", a.output])
    print(f"  captions file: {ass}")


# ---------------------------------------------------------------- export / cover
def cmd_export(a):
    p = probe(a.input)
    vf = f"scale={W}:{H}:force_original_aspect_ratio=decrease:flags=lanczos,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,fps={FPS},format=yuv420p"
    if getattr(a, "grain", 0):
        vf += f",noise=c0s={int(a.grain)}:c0f=t+u:c1s={int(a.grain) // 3}:c1f=t"
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", a.input, "-vf", vf, "-c:v", "libx264", "-profile:v", "high",
           "-level", "4.2", "-preset", "slow", "-crf", "18", "-maxrate", "12M", "-bufsize", "24M",
           "-g", str(FPS * 2), "-movflags", "+faststart"]
    cmd += ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"] if p["audio"] else \
           ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-shortest", "-c:a", "aac"]
    run(cmd + [a.output])
    q = probe(a.output)
    mb = os.path.getsize(a.output) / 1e6
    print(f"  {a.output}: {q['w']}x{q['h']}, {q['dur']:.1f}s, {mb:.1f} MB")
    if q["dur"] > 180:
        print("  note: over 3 minutes - Instagram may not show it to non-followers")


def cover_font(family):
    """Pick a .ttf for the cover title that matches the caption family."""
    d = Path.home() / ".local/share/fonts/reels"
    for key, f in [("Playfair", "PlayfairDisplay.ttf"), ("Cormorant", "CormorantGaramond.ttf"),
                   ("DM Serif", "DMSerifDisplay-Regular.ttf"), ("Bebas", "BebasNeue-Regular.ttf"),
                   ("Montserrat", "Montserrat.ttf")]:
        if family and key in family and (d / f).exists():
            return str(d / f)
    return None


def cmd_cover(a):
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    tmp = Path(tempfile.mkdtemp()) / "f.png"
    run(["ffmpeg", "-y", "-v", "error", "-ss", str(a.time), "-i", a.input, "-frames:v", "1",
         "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}", tmp])
    im = Image.open(tmp).convert("RGB")
    if a.title:
        d = ImageDraw.Draw(im, "RGBA")
        fontfile = a.font_file or str(Path.home() / ".local/share/fonts/reels/Anton-Regular.ttf")
        f = ImageFont.truetype(fontfile, 150)
        # wrap to fit the centre square that the profile grid shows (1080x1080 around y=960)
        words, lines, cur = a.title.upper().split(), [], ""
        for w in words:
            if d.textlength((cur + " " + w).strip(), font=f) > W - 140:
                lines.append(cur)
                cur = w
            else:
                cur = (cur + " " + w).strip()
        lines.append(cur)
        lh = 165
        y = 960 - lh * len(lines) / 2
        for ln in lines:
            tw = d.textlength(ln, font=f)
            d.text(((W - tw) / 2, y), ln, font=f, fill="white", stroke_width=10, stroke_fill="black")
            y += lh
    im.save(a.output, quality=95)
    print(f"  cover -> {a.output}")


# ---------------------------------------------------------------- auto
def cmd_auto(a):
    resolve_style(a)
    if a.style:
        print(f"  style {a.style}: {STYLES[a.style]['desc']}")
    src = Path(a.input)
    src_h = probe(src)["h"] or 1080
    out = Path(a.output or src.with_name(src.stem + "_reel.mp4"))
    work = out.with_name(out.stem + "_work")
    work.mkdir(exist_ok=True)
    ns = argparse.Namespace
    cur = src
    if not a.no_cut:
        cmd_cut(ns(input=cur, output=work / "1_cut.mp4", threshold=a.threshold, margin=a.margin))
        cur = work / "1_cut.mp4"
    cmd_vertical(ns(input=cur, output=work / "2_vertical.mp4", mode=a.mode, zoom=a.zoom))
    cur = work / "2_vertical.mp4"
    words = work / "words.json"
    if not words.exists():  # keep hand-fixed transcripts between runs
        cmd_transcribe(ns(input=cur, output=words, model=a.model, lang=a.lang, prompt=a.prompt))
    if a.bg:
        fx.background(cur, work / "2b_bg.mp4", a.bg)
        cur = work / "2b_bg.mp4"
    if a.light and a.light != "none":
        print(f"  light {a.light}: {fx.LIGHTS[a.light]['desc']}")
        fx.relight(cur, work / "2b2_light.mp4", a.light, strength=a.light_strength,
                   side={"left": -1, "right": 1, "front": 0}.get(a.light_side))
        cur = work / "2b2_light.mp4"
    shots = a.shots or ("punch" if a.punch else None)
    punches = fx.punch_times(words, min_gap=a.cut_gap) if shots else []
    if shots or a.push or a.moves != ["static"]:
        fx.camera(cur, work / "2c_camera.mp4", cuts=punches, shots=shots or ["wide"], moves=a.moves,
                  push=a.push, ease_frames=a.ease, punch_zoom=a.punch_zoom if shots == "punch" else None,
                  max_zoom=fx.zoom_cap(min(src_h, probe(src)["w"] or src_h)))
        cur = work / "2c_camera.mp4"
    if a.look or a.lut or a.film or a.grain or a.vignette:
        # Grain is random every frame, which makes intermediate files huge - so it is added once, at export.
        fx.grade(cur, work / "2d_grade.mp4", look=a.look, lut=a.lut, strength=a.strength,
                 grain=0, vignette=a.vignette, film=a.film, film_grain=False)
        cur = work / "2d_grade.mp4"
    cmd_audio(ns(input=cur, output=work / "3_audio.mp4"))
    cur = work / "3_audio.mp4"
    if a.music:
        cmd_music(ns(input=cur, output=work / "4_music.mp4", music=a.music, volume=a.music_volume))
        cur = work / "4_music.mp4"
    if a.sfx:
        cues = [("pop", 0.05)] if a.hook else []          # pop as the hook title lands
        try:   # a soft pop under each keyword pop-up (French/Spanish creator habit)
            kd = json.loads(words.read_text())["words"]
            cues += [("pop", w["s"]) for w in pick_keywords(kd, a.keywords, after=a.hook_secs + 0.3 if a.hook else 0)]
        except Exception:
            pass
        if a.ease <= 4:  # snappy styles: whoosh into each snap; smooth European styles stay quiet
            cues += [("whoosh", max(0, t - 0.15)) for t in punches]
        if a.style in ("ritchie", "peaky"):  # caper/period: a low hit on every second cut
            cues += [("impact", t) for t in punches[1::2]]
        cues.append(("ding", max(0, probe(cur)["dur"] - 1.6)))   # soft ding on the call to action
        fx.add_sfx(cur, work / "4b_sfx.mp4", cues, volume=a.sfx_volume)
        cur = work / "4b_sfx.mp4"
    if not a.no_captions:
        label = a.label or (STYLES.get(a.style or "", {}).get("label") if a.sponsored else None)
        cmd_captions(ns(input=cur, output=work / "5_captions.mp4", words_json=words, font=a.font,
                        highlight=a.highlight, size=a.size, pos=a.pos, words=a.words,
                        chars=max(18, a.line_chars * a.lines), case=a.case, italic=a.italic, anim=a.anim,
                        outline=a.outline, hook_box=a.hook_box, lines=a.lines, line_chars=a.line_chars,
                        cap_box=a.cap_box, cap_color=a.cap_color, keywords=a.keywords, key_style=a.key_style,
                        label=label, logo=a.logo, hook=a.hook, hook_secs=a.hook_secs, progress=a.progress))
        cur = work / "5_captions.mp4"
    grain = (a.grain or 0) + (fx.FILM_STOCKS[a.film]["grain"] if a.film else 0)
    cmd_export(ns(input=cur, output=out, grain=grain))
    cmd_cover(ns(input=out, output=out.with_suffix(".cover.jpg"), time=a.cover_time, title=a.hook,
                  font_file=cover_font(a.font)))
    print(f"\nDone: {out}\n  working files + editable transcript: {work}/")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)

    def add(name, fn, *args):
        p = sp.add_parser(name)
        for a in args:
            p.add_argument(*a[0], **a[1])
        p.set_defaults(fn=fn)
        return p

    io = [(["input"], {}), (["output"], {})]
    cut_opts = [(["--threshold"], dict(default="0.04", help="loudness below this is silence (0-1)")),
                (["--margin"], dict(default=None, help="padding kept around speech (default 0.25s; styles change it)"))]
    vert_opts = [(["--mode"], dict(default="face", choices=["face", "blur", "crop"])),
                 (["--zoom"], dict(type=float, default=1.0, help="face mode: >1 crops tighter"))]
    tr_opts = [(["--model"], dict(default="small", help="tiny/base/small/medium/large-v3")),
               (["--lang"], dict(default=None, help="en, hi, kn ... (auto-detect if omitted)")),
               (["--prompt"], dict(default=None, help="spellings to expect, e.g. 'KCET, NEET, Newton'"))]
    cap_opts = [(["--highlight"], dict(default=None, choices=list(HIGHLIGHTS) + ["none"], help="active-word colour; none = plain subtitles")),
                (["--case"], dict(default=None, choices=["upper", "sentence", "lower"])),
                (["--keywords"], dict(default=None, help="key-term pops: auto | none | comma list, e.g. 'Saturn,Cassini'")),
                (["--key-style"], dict(default=None, choices=["pop", "box"])),
                (["--lines"], dict(type=int, default=None, help="caption lines (2 = European subtitle style)")),
                (["--cap-box"], dict(action="store_true", help="captions in a translucent dark box")),
                (["--label"], dict(default=None, help="legal label shown all through, e.g. 'Collaboration commerciale'")),
                (["--logo"], dict(default=None, help="logo PNG shown top-left")),
                (["--pos"], dict(type=float, default=None, help="caption height, 0=top 1=bottom (default 0.68; styles set it)")),
                (["--words"], dict(type=int, default=None, help="max words on screen (default 3)")),
                (["--hook"], dict(default=None, help="big title shown at the start")),
                (["--hook-secs"], dict(type=float, default=2.5)),
                (["--progress"], dict(action="store_true", help="thin progress bar at the top"))]

    add("cut", cmd_cut, *io, *cut_opts)
    add("vertical", cmd_vertical, *io, *vert_opts)
    add("audio", cmd_audio, *io)
    add("music", cmd_music, *io, (["--music"], dict(required=True)), (["--volume"], dict(default="0.18")))
    p = add("transcribe", cmd_transcribe, (["input"], {}), (["output"], dict(nargs="?", default="words.json")), *tr_opts)
    add("captions", cmd_captions, (["input"], {}), (["words_json"], {}), (["output"], {}), *cap_opts,
        (["--font"], dict(default=None)), (["--size"], dict(type=int, default=None)),
        (["--chars"], dict(type=int, default=18)), (["--no-upper"], dict(action="store_true")))
    add("export", cmd_export, *io)
    add("cover", cmd_cover, *io, (["--time"], dict(type=float, default=1.0)), (["--title"], dict(default=None)),
        (["--font-file"], dict(default=None)))
    look_opts = [(["--look"], dict(default=None, choices=list(fx.LOOKS), help="mood colour grade")),
                 (["--lut"], dict(default=None, help="any .cube LUT file instead of a built-in look")),
                 (["--strength"], dict(type=float, default=1.0, help="look strength 0-1")),
                 (["--grain"], dict(type=int, default=None, help="film grain, try 6-12")),
                 (["--film"], dict(default=None, choices=list(fx.FILM_STOCKS), help="film emulation: halation, bloom, grain, gate weave")),
                 (["--vignette"], dict(action="store_true"))]
    add("grade", lambda a: fx.grade(a.input, a.output, a.look, a.lut, a.strength, a.grain or 0, a.vignette, a.film),
        *io, *look_opts)
    light_opts = [(["--light"], dict(default=None, choices=list(fx.LIGHTS) + ["none"], help="virtual lighting preset (see `lights`)")),
                  (["--light-strength"], dict(type=float, default=1.0)),
                  (["--light-side"], dict(default=None, choices=["left", "right", "front"], help="where the key light comes from"))]
    add("lights", lambda a: [print(f"  {k:10} {v['desc']}") for k, v in fx.LIGHTS.items()])
    add("light", lambda a: fx.relight(a.input, a.output, a.light or "creator", a.light_strength,
                                      {"left": -1, "right": 1, "front": 0}.get(a.light_side)), *io, *light_opts)
    add("styles", lambda a: [print(f"  {k:16} {v['desc']}") for k, v in STYLES.items()])
    cam_opts = [(["--shots"], dict(default=None, help="talk | punch | drama | minimal, or a list: wide,close,medium")),
                (["--moves"], dict(default=None, help="cycled per shot: handheld,pan,dolly,pull,orbit,static")),
                (["--ease"], dict(type=int, default=None, help="frames to glide between framings: 2 = snap, 16 = glide")),
                (["--cut-gap"], dict(type=float, default=None, help="min seconds between shot changes"))]
    add("camera", lambda a: fx.camera(a.input, a.output,
                                      cuts=fx.punch_times(a.words_json, a.cut_gap or 2.2) if a.words_json else
                                      [float(x) for x in (a.at or "").split(",") if x],
                                      shots=(a.shots.split(",") if a.shots and "," in a.shots else a.shots or "talk"),
                                      moves=(a.moves or "static").split(","), push=a.push, ease_frames=a.ease or 3,
                                      shake=[float(x) for x in (a.shake or "").split(",") if x]),
        *io, *cam_opts, (["--words-json"], dict(default=None, help="cut at phrase starts from this transcript")),
        (["--at"], dict(default=None, help="or: cut times, e.g. 2.5,6,9.2")), (["--push"], dict(type=float, default=0.0)),
        (["--shake"], dict(default=None)))
    add("luts", lambda a: print(f"  .cube files written to {fx.build_luts()}/"))
    add("looks", lambda a: [print(f"  {k:12} {v}") for k, v in fx.LOOKS.items()])
    add("motion", lambda a: fx.motion(a.input, a.output, punch=fx.punch_times(a.punch) if a.punch else
                                      [float(x) for x in a.at.split(",") if x] if a.at else [],
                                      punch_zoom=a.punch_zoom, push=a.push,
                                      shake=[float(x) for x in a.shake.split(",") if x] if a.shake else []),
        *io, (["--punch"], dict(default=None, metavar="WORDS_JSON", help="punch in at each sentence")),
        (["--at"], dict(default=None, help="or: punch times, e.g. 2.5,6,9.2")),
        (["--punch-zoom"], dict(type=float, default=1.14)), (["--push"], dict(type=float, default=0.0)),
        (["--shake"], dict(default=None, help="impact shake times, e.g. 4.1,8")))
    add("bg", lambda a: fx.background(a.input, a.output, a.bg), *io,
        (["--bg"], dict(default="blur", help="blur | #RRGGBB | image.jpg | video.mp4")))
    add("sfx-kit", lambda a: print("  made:", ", ".join(fx.make_sfx()), f"-> {fx.SFX_DIR}/"))
    add("sfx", lambda a: fx.add_sfx(a.input, a.output, [(c.split("@")[0], float(c.split("@")[1]))
                                                         for c in a.cues.split(",")], a.volume),
        *io, (["--cues"], dict(required=True, help="name@seconds list, e.g. pop@0.1,whoosh@3.2,impact@7")),
        (["--volume"], dict(type=float, default=0.55)))
    add("auto", cmd_auto, (["input"], {}), (["output"], dict(nargs="?", default=None)), *cut_opts, *vert_opts,
        (["--style"], dict(default=None, choices=list(STYLES), help="editing style preset (see `styles`)")), *cam_opts,
        *light_opts,
        (["--font"], dict(default=None, help="caption font family name")),
        *tr_opts, *cap_opts, *look_opts, (["--music"], dict(default=None)), (["--music-volume"], dict(default="0.18")),
        (["--bg"], dict(default=None, help="blur | #RRGGBB | image.jpg | video.mp4")),
        (["--punch"], dict(action="store_true", help="jump-zoom in/out at each sentence")),
        (["--punch-zoom"], dict(type=float, default=None)), (["--push"], dict(type=float, default=0.0)),
        (["--sponsored"], dict(action="store_true", help="add the country's legal ad label (Werbung, ADV, #ad...)")),
        (["--sfx"], dict(action="store_true", help="pop on hook, whoosh on punch-ins, ding at end")),
        (["--sfx-volume"], dict(type=float, default=0.45)),
        (["--no-cut"], dict(action="store_true")), (["--no-captions"], dict(action="store_true")),
        (["--cover-time"], dict(type=float, default=1.0)))
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
