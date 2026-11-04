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
    run(["auto-editor", a.input, "--edit", f"audio:threshold={a.threshold}", "--margin", a.margin,
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
    fc = (f"[1:a]volume={a.volume},aloop=loop=-1:size=2e9[m];"
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


def build_ass(data, a):
    lang = data.get("lang", "en")
    script = lang if lang in FONTS else "latin"
    font = a.font or FONTS[script]
    upper = script == "latin" and not a.no_upper
    # ASS colours are &HAABBGGRR
    hl = {"yellow": "&H0000E6FF", "green": "&H0050FF7A", "red": "&H004040FF", "cyan": "&H00FFE600"}[a.highlight]
    size = a.size or (108 if script == "latin" else 96)
    margin_v = int(H * (1 - a.pos))  # distance from bottom
    # NB: letter-spacing must stay 0 for Kannada/Devanagari or libass breaks the vowel signs apart.
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{font},{size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,{1 if script == 'latin' else 0},0,1,7,3,2,90,90,{margin_v},1
Style: Hook,{FONTS['latin'] if script == 'latin' else font},{int(size * 1.05)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,3,26,0,8,70,70,330,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    if a.hook:
        hook = a.hook.upper() if upper else a.hook
        ev.append(f"Dialogue: 1,{ass_time(0)},{ass_time(a.hook_secs)},Hook,,0,0,0,,"
                  f"{{\\fad(150,250)\\3c&H00000000&\\1c&H00FFFFFF&}}{hook}")
    caps = []  # (start, end, text) - one event per spoken word, whole group visible
    for g in group_words(data["words"], a.words, a.chars):
        # trailing commas/full stops look cluttered on screen; keep ? and !
        toks = [re.sub(r"[,.;:।]+$", "", x["w"].upper() if upper else x["w"]) for x in g]
        for i, w in enumerate(g):
            end = g[i + 1]["s"] if i + 1 < len(g) else w["e"] + 0.3
            parts = [f"{{\\1c{hl}&\\fscx112\\fscy112}}{t}{{\\1c&H00FFFFFF&\\fscx100\\fscy100}}" if j == i else t
                     for j, t in enumerate(toks)]
            pop = "{\\fscx80\\fscy80\\t(0,90,\\fscx100\\fscy100)}" if i == 0 else ""
            caps.append([w["s"], end, pop + " ".join(parts)])
    # Never let two caption lines share the screen: cut each one off where the next begins.
    for k in range(len(caps) - 1):
        caps[k][1] = min(caps[k][1], caps[k + 1][0])
    ev += [f"Dialogue: 0,{ass_time(s)},{ass_time(e)},Cap,,0,0,0,,{t}" for s, e, t in caps if e > s]
    return head + "\n".join(ev) + "\n"


def cmd_captions(a):
    data = json.loads(Path(a.words_json).read_text())
    ass = Path(a.output).with_suffix(".ass")
    ass.write_text(build_ass(data, a), encoding="utf-8")
    fontsdir = Path.home() / ".local/share/fonts"
    vf = f"ass={ass}:fontsdir={fontsdir}"
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
    src = Path(a.input)
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
    punches = fx.punch_times(words) if a.punch else []
    if punches or a.push:
        fx.motion(cur, work / "2c_motion.mp4", punch=punches, punch_zoom=a.punch_zoom, push=a.push)
        cur = work / "2c_motion.mp4"
    if a.look or a.lut:
        fx.grade(cur, work / "2d_grade.mp4", look=a.look, lut=a.lut, strength=a.strength,
                 grain=a.grain, vignette=a.vignette)
        cur = work / "2d_grade.mp4"
    cmd_audio(ns(input=cur, output=work / "3_audio.mp4"))
    cur = work / "3_audio.mp4"
    if a.music:
        cmd_music(ns(input=cur, output=work / "4_music.mp4", music=a.music, volume=a.music_volume))
        cur = work / "4_music.mp4"
    if a.sfx:
        cues = [("pop", 0.05)] if a.hook else []          # pop as the hook title lands
        cues += [("whoosh", max(0, t - 0.15)) for t in punches]  # whoosh into each punch-in
        cues.append(("ding", max(0, probe(cur)["dur"] - 1.6)))   # soft ding on the call to action
        fx.add_sfx(cur, work / "4b_sfx.mp4", cues, volume=a.sfx_volume)
        cur = work / "4b_sfx.mp4"
    if not a.no_captions:
        cmd_captions(ns(input=cur, output=work / "5_captions.mp4", words_json=words, font=None,
                        highlight=a.highlight, size=None, pos=a.pos, words=a.words, chars=18, no_upper=False,
                        hook=a.hook, hook_secs=a.hook_secs, progress=a.progress))
        cur = work / "5_captions.mp4"
    cmd_export(ns(input=cur, output=out))
    cmd_cover(ns(input=out, output=out.with_suffix(".cover.jpg"), time=a.cover_time, title=a.hook, font_file=None))
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
                (["--margin"], dict(default="0.25s", help="padding kept around speech"))]
    vert_opts = [(["--mode"], dict(default="face", choices=["face", "blur", "crop"])),
                 (["--zoom"], dict(type=float, default=1.0, help="face mode: >1 crops tighter"))]
    tr_opts = [(["--model"], dict(default="small", help="tiny/base/small/medium/large-v3")),
               (["--lang"], dict(default=None, help="en, hi, kn ... (auto-detect if omitted)")),
               (["--prompt"], dict(default=None, help="spellings to expect, e.g. 'KCET, NEET, Newton'"))]
    cap_opts = [(["--highlight"], dict(default="yellow", choices=["yellow", "green", "red", "cyan"])),
                (["--pos"], dict(type=float, default=0.68, help="caption height, 0=top 1=bottom")),
                (["--words"], dict(type=int, default=3, help="max words on screen")),
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
                 (["--grain"], dict(type=int, default=0, help="film grain, try 6-12")),
                 (["--vignette"], dict(action="store_true"))]
    add("grade", lambda a: fx.grade(a.input, a.output, a.look, a.lut, a.strength, a.grain, a.vignette), *io, *look_opts)
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
        *tr_opts, *cap_opts, *look_opts, (["--music"], dict(default=None)), (["--music-volume"], dict(default="0.18")),
        (["--bg"], dict(default=None, help="blur | #RRGGBB | image.jpg | video.mp4")),
        (["--punch"], dict(action="store_true", help="jump-zoom in/out at each sentence")),
        (["--punch-zoom"], dict(type=float, default=1.14)), (["--push"], dict(type=float, default=0.0)),
        (["--sfx"], dict(action="store_true", help="pop on hook, whoosh on punch-ins, ding at end")),
        (["--sfx-volume"], dict(type=float, default=0.45)),
        (["--no-cut"], dict(action="store_true")), (["--no-captions"], dict(action="store_true")),
        (["--cover-time"], dict(type=float, default=1.0)))
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
