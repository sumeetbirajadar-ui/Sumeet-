#!/usr/bin/env python3
"""
gemini_tts.py - Gemini 3.8 Flash TTS CLI (Interactions API + Voices API, raw REST).

Subcommands:
  speak         Single-speaker TTS -> WAV (or mp3/ogg/flac via ffmpeg). Long text auto-chunked.
  dialogue      Multi-speaker TTS from a script file ("Name: line" per line, or JSON)
  voices        List voices (custom stored first, then prebuilt catalog) with filters
  prebuilt      Print the 30 studio voices
  voice-get     Show one stored voice (writes its sample audio if present)
  voice-delete  Delete a stored custom voice
  design        Create a persistent custom voice from a text description (Voice design)
  replicate     Clone a voice from a reference clip + consent clip (Voice replication)
  studio        Open the local web studio: speak, dialogue, my voices, clone (EN/HE UI)
  record        Same studio, opened on the Clone tab
  doctor        Check python/ffmpeg/API key and do a tiny test render
  import-elevenlabs  Download your original sample clips from an ElevenLabs cloned voice
  consent       Print the exact consent sentence to record, per locale
  registry      Show locally saved voice ids/keys (aliases)

Env: GEMINI_API_KEY (required). Optional: GEMINI_TTS_MODEL (default gemini-3.8-flash-tts)
"""
import argparse, base64, json, os, re, subprocess, sys, tempfile, time, shutil, datetime, threading, webbrowser
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

try:
    import requests
except ImportError:
    sys.exit("pip install requests")

BASE = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = os.environ.get("GEMINI_TTS_MODEL", "gemini-3.8-flash-tts")
LITE_MODEL = "gemini-3.8-flash-lite-tts"
SKILL_DIR = Path(__file__).resolve().parent.parent
REGISTRY = SKILL_DIR / "voices.json"
RECORDINGS = SKILL_DIR / "recordings"

PREBUILT = {
 "Zephyr":"Bright","Puck":"Upbeat","Charon":"Informative","Kore":"Firm","Fenrir":"Excitable",
 "Leda":"Youthful","Orus":"Firm","Aoede":"Breezy","Callirrhoe":"Easy-going","Autonoe":"Bright",
 "Enceladus":"Breathy","Iapetus":"Clear","Umbriel":"Easy-going","Algieba":"Smooth","Despina":"Smooth",
 "Erinome":"Clear","Algenib":"Gravelly","Rasalgethi":"Informative","Laomedeia":"Upbeat","Achernar":"Soft",
 "Alnilam":"Firm","Schedar":"Even","Gacrux":"Mature","Pulcherrima":"Forward","Achird":"Friendly",
 "Zubenelgenubi":"Casual","Vindemiatrix":"Gentle","Sadachbia":"Lively","Sadaltager":"Knowledgeable","Sulafat":"Warm",
}

CONSENT = {
 "en-US":"I am the owner of this voice and I consent to Google using this voice to create a synthetic voice model.",
 "en-GB":"I am the owner of this voice and I consent to Google using this voice to create a synthetic voice model.",
 "en-IN":"I am the owner of this voice and I consent to Google using this voice to create a synthetic voice model.",
 "en-AU":"I am the owner of this voice and I consent to Google using this voice to create a synthetic voice model.",
 "ar-XA":"أنا مالك هذا الصوت وأوافق على أن تستخدم Google هذا الصوت لإنشاء نموذج صوتي اصطناعي.",
 "bn-IN":"আমি এই ভয়েসের মালিক এবং আমি একটি সিন্থেটিক ভয়েস মডেল তৈরি করতে এই ভয়েস ব্যবহার করে Google-এর সাথে সম্মতি দিচ্ছি।",
 "zh-CN":"我是此声音的拥有者并授权谷歌使用此声音创建语音合成模型",
 "nl-NL":"Ik ben de eigenaar van deze stem en ik geef Google toestemming om deze stem te gebruiken om een synthetisch stemmodel te maken.",
 "fr-FR":"Je suis le propriétaire de cette voix et j'autorise Google à utiliser cette voix pour créer un modèle de voix synthétique.",
 "fr-CA":"Je suis le propriétaire de cette voix et j'autorise Google à utiliser cette voix pour créer un modèle de voix synthétique.",
 "de-DE":"Ich bin der Eigentümer dieser Stimme und bin damit einverstanden, dass Google diese Stimme zur Erstellung eines synthetischen Stimmmodells verwendet.",
 "gu-IN":"હું આ વોઈસનો માલિક છું અને સિન્થેટિક વોઈસ મોડલ બનાવવા માટે આ વોઈસનો ઉપયોગ કરીને google ને હું સંમતિ આપું છું",
 "hi-IN":"मैं इस आवाज का मालिक हूं और मैं सिंथेटिक आवाज मॉडल बनाने के लिए Google को इस आवाज का उपयोग करने की सहमति देता हूं",
 "id-ID":"Saya pemilik suara ini dan saya menyetujui Google menggunakan suara ini untuk membuat model suara sintetis.",
 "it-IT":"Sono il proprietario di questa voce e acconsento che Google la utilizzi per creare un modello di voce sintetica.",
 "ja-JP":"私はこの音声の所有者であり、Googleがこの音声を使用して音声合成モデルを作成することを承認します。",
 "kn-IN":"ನಾನು ಈ ಧ್ವನಿಯ ಮಾಲಿಕ ಮತ್ತು ಸಂಶ್ಲೇಷಿತ ಧ್ವನಿ ಮಾದರಿಯನ್ನು ರಚಿಸಲು ಈ ಧ್ವನಿಯನ್ನು ಬಳಸಿಕೊಂಡುಗೂಗಲ್ ಗೆ ನಾನು ಸಮ್ಮತಿಸುತ್ತೇನೆ.",
 "ko-KR":"나는 이 음성의 소유자이며 구글이 이 음성을 사용하여 음성 합성 모델을 생성할 것을 허용합니다.",
 "ml-IN":"ഈ ശബ്ദത്തിന്റെ ഉടമ ഞാനാണ്, ഒരു സിന്തറ്റിക് വോയ്സ് മോഡൽ സൃഷ്ടിക്കാൻ ഈ ശബ്ദം ഉപയോഗിക്കുന്നതിന് ഞാൻ Google-ന് സമ്മതം നൽകുന്നു.",
 "mr-IN":"मी या आवाजाचा मालक आहे आणि सिंथेटिक व्हॉइस मॉडल तयार करण्यासाठी हा आवाज वापरण्यासाठी मी Google ला संमती देतो",
 "pl-PL":"Jestem właścicielem tego głosu i wyrażam zgodę na wykorzystanie go przez Google w celu utworzenia syntetycznego modelu głosu.",
 "pt-BR":"Eu sou o proprietário desta voz e autorizo o Google a usá-la para criar um modelo de voz sintética.",
 "ru-RU":"Я являюсь владельцем этого голоса и даю согласие Google на использование этого голоса для создания модели синтетического голоса.",
 "es-ES":"Soy el propietario de esta voz y doy mi consentimiento para que Google la utilice para crear un modelo de voz sintética.",
 "es-US":"Soy el propietario de esta voz y doy mi consentimiento para que Google la utilice para crear un modelo de voz sintética.",
 "ta-IN":"நான் இந்த குரலின் உரிமையாளர் மற்றும் செயற்கை குரல் மாதிரியை உருவாக்க இந்த குரலை பயன்படுத்த குகல்க்கு நான் ஒப்புக்கொள்கிறேன்.",
 "te-IN":"నేను ఈ వాయిస్ యజమానిని మరియు సింతటిక్ వాయిస్ మోడల్ ని రూపొందించడానికి ఈ వాయిస్ ని ఉపయోగించడానికి googleకి నేను సమ్మతిస్తున్నాను.",
 "th-TH":"ฉันเป็นเจ้าของเสียงนี้ และฉันยินยอมให้ Google ใช้เสียงนี้เพื่อสร้างแบบจำลองเสียงสังเคราะห์",
 "tr-TR":"Bu sesin sahibi benim ve Google'ın bu sesi kullanarak sentetik bir ses modeli oluşturmasına izin veriyorum.",
 "vi-VN":"Tôi là chủ sở hữu giọng nói này và tôi đồng ý cho Google sử dụng giọng nói này để tạo mô hình giọng nói tổng hợp.",
}

# ---------------------------------------------------------------- helpers
def api_key():
    k = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not k:
        sys.exit("ERROR: set GEMINI_API_KEY")
    return k

def headers():
    return {"x-goog-api-key": api_key(), "Content-Type": "application/json"}

class ApiError(Exception):
    def __init__(self, status, msg):
        super().__init__(f"HTTP {status}: {msg}")
        self.status, self.msg = status, msg

def request(method, path, retries=3, **kw):
    url = path if path.startswith("http") else f"{BASE}{path}"
    for attempt in range(retries):
        r = requests.request(method, url, headers=headers(), timeout=600, **kw)
        if r.status_code in (429, 500, 502, 503, 504) and attempt < retries - 1:
            wait = 2 ** (attempt + 1)
            log(f"HTTP {r.status_code}, retrying in {wait}s ...")
            time.sleep(wait)
            continue
        if not r.ok:
            try:
                err = r.json().get("error", {})
                msg = err.get("message", r.text)
                for d in err.get("details", []) or []:
                    m = re.search(r"Original error:\s*(.+)", str(d.get("detail", "")), re.S)
                    if m:
                        msg += " | " + m.group(1).strip()[:400]
            except Exception:
                msg = r.text
            if r.status_code == 500 and ("translating server response" in msg or "safety checks" in msg) and path == "/voices":
                msg += (" | Google returns this opaque 500 when voice replication fails verification: the consent clip and the "
                        "reference clip must be the SAME real person (no synthetic/TTS audio), the consent sentence must be read "
                        "exactly, and both should be recorded on the same mic. If the reference is in another language than the "
                        "consent (e.g. Hebrew), use --prepend-consent: verification fails across languages otherwise.")
            raise ApiError(r.status_code, msg)
        return r.json() if r.content else {}
    return {}

def log(*a):
    print(*a, file=sys.stderr)

def load_registry():
    if REGISTRY.exists():
        try:
            return json.loads(REGISTRY.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}

def save_registry(reg):
    REGISTRY.write_text(json.dumps(reg, indent=2, ensure_ascii=False), encoding="utf-8")

def save_alias(alias, entry):
    reg = load_registry()
    reg[alias] = entry
    save_registry(reg)

def short_voice(v):
    return (v[:24] + "...") if isinstance(v, str) and v.startswith("voicekey_") else v

def resolve_voice(name):
    """Accept prebuilt name, voice_..., voicekey_..., or a registry alias."""
    if not name:
        return "Kore"
    reg = load_registry()
    if name in reg:
        return reg[name].get("id") or reg[name].get("key")
    return name

def ffmpeg():
    p = shutil.which("ffmpeg")
    if not p:
        sys.exit("ffmpeg not found on PATH (needed for mp3/ogg conversion and audio prep)")
    return p

def to_24k_mono_wav(src, offset=None, seconds=None):
    """Convert any audio/video file to 24 kHz mono 16-bit WAV in a temp file. Returns path."""
    out = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    args = [ffmpeg(), "-y", "-loglevel", "error"]
    if offset:
        args += ["-ss", str(offset)]
    args += ["-i", str(src)]
    if seconds:
        args += ["-t", str(seconds)]
    args += ["-vn", "-ac", "1", "-ar", "24000", "-sample_fmt", "s16", out]
    subprocess.run(args, check=True)
    return out

def audio_duration(path):
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                             capture_output=True, text=True, check=True).stdout.strip()
        return float(out)
    except Exception:
        return None

def write_audio(b64, out_path, mime="audio/wav"):
    """Write base64 audio to out_path; convert with ffmpeg if extension is not .wav."""
    data = base64.b64decode(b64)
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.suffix == "":
        out = out.with_suffix(".wav")
    if out.suffix.lower() == ".wav":
        out.write_bytes(data)
        return out
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    Path(tmp).write_bytes(data)
    args = [ffmpeg(), "-y", "-loglevel", "error", "-i", tmp]
    if out.suffix.lower() == ".mp3":
        args += ["-codec:a", "libmp3lame", "-b:a", "192k"]
    args.append(str(out))
    subprocess.run(args, check=True)
    os.unlink(tmp)
    return out

def concat_wavs(paths, out_path):
    """Concatenate WAV files losslessly into out_path (any ext; converted if needed)."""
    lst = tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode="w", encoding="utf-8")
    for p in paths:
        lst.write(f"file '{Path(p).as_posix()}'\n")
    lst.close()
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst.name, "-c", "copy", tmp_wav], check=True)
    if out.suffix.lower() == ".wav":
        shutil.move(tmp_wav, out)
    else:
        args = [ffmpeg(), "-y", "-loglevel", "error", "-i", tmp_wav]
        if out.suffix.lower() == ".mp3":
            args += ["-codec:a", "libmp3lame", "-b:a", "192k"]
        subprocess.run(args + [str(out)], check=True)
        os.unlink(tmp_wav)
    os.unlink(lst.name)
    return out

def chunk_text(text, max_chars):
    """Split on paragraph, then sentence boundaries, keeping chunks <= max_chars."""
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks, cur = [], ""
    def flush():
        nonlocal cur
        if cur.strip():
            chunks.append(cur.strip())
        cur = ""
    for p in paras:
        if len(p) > max_chars:
            flush()
            sents = re.split(r"(?<=[\.\!\?׃。])\s+", p)
            for s in sents:
                if len(cur) + len(s) + 1 > max_chars:
                    flush()
                cur += s + " "
            flush()
        elif len(cur) + len(p) + 2 > max_chars:
            flush(); cur = p + "\n\n"
        else:
            cur += p + "\n\n"
    flush()
    return chunks

def extract_audio(res):
    """Find the base64 audio block in an Interactions response (output_audio, outputs[], or steps[].content[])."""
    audio = res.get("output_audio") or {}
    if audio.get("data"):
        return audio["data"]
    blocks = []
    for o in res.get("outputs") or res.get("output") or []:
        blocks.append(o)
    for st in res.get("steps") or []:
        blocks.extend(st.get("content") or [])
    for b in blocks:
        if isinstance(b, dict) and b.get("data") and (b.get("type") in (None, "audio") or str(b.get("mime_type", "")).startswith("audio")):
            return b["data"]
    return None

# ---------------------------------------------------------------- TTS core
def synthesize(turns, speech_config, model, mime="audio/wav", sample_rate=24000):
    """turns: list of {text, style?, speaker?}. speech_config: list (single) or dict (multi). Returns b64 wav."""
    content = []
    for t in turns:
        ann = {"type": "speech_metadata"}
        if t.get("style"):
            ann["style"] = t["style"]
        if t.get("speaker"):
            ann["speaker"] = t["speaker"]
        block = {"type": "text", "text": t["text"]}
        if len(ann) > 1:
            block["annotations"] = [ann]
        content.append(block)
    body = {
        "model": model,
        "input": [{"type": "user_input", "content": content}],
        "response_format": {"type": "audio", "mime_type": mime, "sample_rate": sample_rate},
        "generation_config": {"speech_config": speech_config},
    }
    res = request("POST", "/interactions", json=body)
    b64 = extract_audio(res)
    if not b64:
        raise ApiError(0, "no audio in response: " + json.dumps(res)[:1500])
    return b64

def speak_to_file(text, voice, style, out, model, chunk_chars=6000):
    speech_config = [{"voice": voice}]
    chunks = chunk_text(text, chunk_chars) if len(text) > chunk_chars else [text]
    if len(chunks) == 1:
        return write_audio(synthesize([{"text": text, "style": style}], speech_config, model), out)
    log(f"Long text: {len(chunks)} chunks")
    parts = []
    for i, c in enumerate(chunks, 1):
        log(f"  chunk {i}/{len(chunks)} ({len(c)} chars)")
        p = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
        Path(p).write_bytes(base64.b64decode(synthesize([{"text": c, "style": style}], speech_config, model)))
        parts.append(p)
    path = concat_wavs(parts, out)
    for p in parts:
        os.unlink(p)
    return path

def cmd_speak(a):
    text = a.text
    if a.file:
        text = Path(a.file).read_text(encoding="utf-8")
    if not text:
        text = sys.stdin.read()
    text = (text or "").strip()
    if not text:
        sys.exit("no text given")
    model = LITE_MODEL if a.lite else a.model
    voice = resolve_voice(a.voice)
    path = speak_to_file(text, voice, a.style, a.out, model, a.chunk_chars)
    dur = audio_duration(path)
    print(json.dumps({"ok": True, "file": str(Path(path).resolve()), "voice": short_voice(voice), "model": model,
                      "duration_sec": round(dur, 2) if dur else None, "chars": len(text)}, ensure_ascii=False))

def parse_script(path):
    """Script file -> turns. JSON list [{speaker,text,style}] or lines 'Speaker: line' /
    'Speaker [style]: line'. Continuation lines append to previous turn. '#' = comment."""
    raw = Path(path).read_text(encoding="utf-8")
    s = raw.strip()
    if s.startswith("["):
        return json.loads(s)
    turns = []
    pat = re.compile(r"^\s*([^:\[\]]+?)\s*(?:\[(.*?)\])?\s*:\s*(.+)$")
    for line in raw.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = pat.match(line)
        if not m:
            if turns:
                turns[-1]["text"] += " " + line.strip()
            continue
        spk, style, txt = m.group(1).strip(), (m.group(2) or "").strip(), m.group(3).strip()
        turns.append({"speaker": spk, "style": style or None, "text": txt})
    return turns

def cmd_dialogue(a):
    turns = parse_script(a.script)
    if not turns:
        sys.exit("script has no turns")
    speakers_in_script = []
    for t in turns:
        if t.get("speaker") and t["speaker"] not in speakers_in_script:
            speakers_in_script.append(t["speaker"])
    mapping = {}
    for kv in (a.speakers or "").split(","):
        if "=" in kv:
            k, v = kv.split("=", 1)
            mapping[k.strip()] = resolve_voice(v.strip())
    defaults = ["Puck", "Kore", "Charon", "Leda", "Orus", "Aoede"]
    for i, s in enumerate(speakers_in_script):
        mapping.setdefault(s, defaults[i % len(defaults)])
    if a.global_style:
        for t in turns:
            t["style"] = t.get("style") or a.global_style
    model = LITE_MODEL if a.lite else a.model
    if len(speakers_in_script) == 1:
        # single narrator with per-turn styles: use single-voice config, drop speaker labels
        speech_config = [{"voice": mapping[speakers_in_script[0]]}]
        turns = [{"text": t["text"], "style": t.get("style")} for t in turns]
    else:
        speech_config = {"mode": "conversational",
                         "speakers": [{"speaker": s, "voice": mapping[s]} for s in speakers_in_script]}
    path = write_audio(synthesize(turns, speech_config, model), a.out)
    dur = audio_duration(path)
    print(json.dumps({"ok": True, "file": str(path.resolve()), "speakers": {k: short_voice(v) for k, v in mapping.items()}, "turns": len(turns),
                      "model": model, "duration_sec": round(dur, 2) if dur else None}, ensure_ascii=False))

# ---------------------------------------------------------------- voices
def cmd_voices(a):
    params = []
    def add(name, vals):
        for v in vals or []:
            params.append((name, v))
    add("type", a.type); add("language_code", a.lang); add("gender", a.gender)
    add("accent", a.accent); add("persona", a.persona); add("context", a.context); add("pitch", a.pitch)
    if a.search:
        params.append(("search", a.search))
    params.append(("page_size", str(a.limit)))
    res = request("GET", "/voices", params=params)
    voices = res.get("voices", [])
    if a.json:
        print(json.dumps(res, indent=2, ensure_ascii=False)); return
    reg = load_registry()
    alias_by_id = {v.get("id"): k for k, v in reg.items()}
    print(f"{'ID/NAME':<30} {'TYPE':<10} {'LANG':<8} {'GENDER':<7} {'DISPLAY / PERSONA'}")
    for v in voices:
        vid = v.get("id") or v.get("name", "")
        alias = alias_by_id.get(vid)
        label = v.get("display_name") or v.get("persona") or v.get("description") or ""
        if alias:
            label = f"[{alias}] {label}"
        if v.get("expire_time"):
            label += f"  (expires {v['expire_time'][:10]})"
        print(f"{vid:<30} {v.get('type',''):<10} {(v.get('language_code') or ''):<8} {(v.get('gender') or ''):<7} {label}")
    if res.get("next_page_token"):
        print("... more available. Increase --limit or narrow filters.")
    if not voices:
        print("(no voices returned)")

def _strip_audio(res):
    for k in ("prompted", "replicated"):
        if isinstance(res.get(k), dict):
            for ak in ("sample_audio", "source_audio", "consent_audio"):
                if isinstance(res[k].get(ak), dict) and "data" in res[k][ak]:
                    res[k][ak]["data"] = f"<{len(res[k][ak]['data'])} b64 chars>"
    if isinstance(res.get("sample_audio"), dict) and "data" in res["sample_audio"]:
        res["sample_audio"]["data"] = "<b64>"
    return res

def cmd_voice_get(a):
    vid = resolve_voice(a.voice)
    res = request("GET", f"/voices/{vid}")
    sample = (res.get("prompted") or {}).get("sample_audio") or res.get("sample_audio")
    if sample and sample.get("data") and a.sample_out:
        res["_sample_written_to"] = str(write_audio(sample["data"], a.sample_out).resolve())
    print(json.dumps(_strip_audio(res), indent=2, ensure_ascii=False))

def cmd_voice_delete(a):
    vid = resolve_voice(a.voice)
    if not vid.startswith("voice_"):
        sys.exit("only stored custom voices (voice_...) can be deleted")
    request("DELETE", f"/voices/{vid}")
    reg = load_registry()
    for k in [k for k, v in reg.items() if v.get("id") == vid]:
        del reg[k]
    save_registry(reg)
    print(json.dumps({"ok": True, "deleted": vid}))

def slug(s):
    return re.sub(r"[^\w-]+", "_", s or "voice").strip("_").lower()

def cmd_design(a):
    model = LITE_MODEL if a.lite else a.model
    print(json.dumps(design_voice(a.name, a.prompt, a.gender, a.lang, a.alias, a.stateless, model, a.sample_out), ensure_ascii=False))

def replicate_voice(source, consent, name="My Voice", alias=None, lang=None, stateless=False,
                    model=DEFAULT_MODEL, offset=None, seconds=None, prepend_consent=False):
    """Core replication. Returns dict.
    prepend_consent=True builds the reference as [consent clip] + [source segment]. Google's speaker check
    fails across languages (English consent vs Hebrew reference -> "Voice mismatch"), but passes when the
    reference starts with the same English read; the rest of the clip can be any language."""
    con = to_24k_mono_wav(consent)
    if prepend_consent:
        seg = to_24k_mono_wav(source, offset, seconds)
        mixed = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
        subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", con, "-i", seg, "-filter_complex",
                        "[0:a][1:a]concat=n=2:v=0:a=1[o]", "-map", "[o]", "-ac", "1", "-ar", "24000", "-sample_fmt", "s16", mixed], check=True)
        os.unlink(seg)
        source, offset, seconds = mixed, None, None
        log("Reference = consent clip + source segment (cross-language verification workaround)")
    d_con = audio_duration(con)
    if d_con and d_con > 25:
        log(f"warning: consent clip is {d_con:.1f}s; it should contain just the consent sentence")
    b64 = lambda p: base64.b64encode(Path(p).read_bytes()).decode()
    attempts = [(offset, seconds)]
    d_full = audio_duration(source)
    if seconds is None and d_full and d_full > 30:
        attempts.append((offset or 0, 30))  # fallback: first 30 s
    last_err = None
    for off, secs in attempts:
        src = to_24k_mono_wav(source, off, secs)
        d_src = audio_duration(src)
        voice = {"model": model, "type": "replicated",
                 "replicated": {"source_audio": {"mime_type": "audio/wav", "data": b64(src)},
                                "consent_audio": {"mime_type": "audio/wav", "data": b64(con)}}}
        if name and not stateless:
            voice["display_name"] = name
        if lang:
            voice["language_code"] = lang
        log(f"Uploading reference ({d_src:.1f}s) + consent ({d_con or 0:.1f}s) and verifying speaker ...")
        try:
            res = request("POST", "/voices", json={"store": not stateless, "voice": voice})
            os.unlink(src)
            break
        except ApiError as e:
            os.unlink(src)
            last_err = e
            if len(attempts) > 1 and (off, secs) == attempts[0] and re.search(r"duration|length|long|second", e.msg, re.I):
                log(f"API rejected full clip ({e.msg[:120]}). Retrying with first 30s ...")
                continue
            os.unlink(con)
            raise
    else:
        os.unlink(con)
        raise last_err
    os.unlink(con)
    vid = res.get("id") or res.get("key")
    if not vid:
        raise ApiError(0, "no id/key in response: " + json.dumps(_strip_audio(res))[:1500])
    alias = alias or slug(name or "my_voice")
    entry = {("key" if stateless else "id"): vid, "type": "replicated", "display_name": name, "model": model,
             "source": str(Path(source).resolve()), "consent": str(Path(consent).resolve()), "prepend_consent": bool(prepend_consent),
             "created": datetime.datetime.now().isoformat(timespec="seconds"),
             "expire_time": res.get("expire_time"), "stateless": bool(stateless)}
    save_alias(alias, entry)
    return {"ok": True, "alias": alias, "voice": short_voice(vid), "stateless": bool(stateless),
            "expire_time": res.get("expire_time"), "use": f"speak --voice {alias}"}

def cmd_replicate(a):
    model = LITE_MODEL if a.lite else a.model
    try:
        out = replicate_voice(a.source, a.consent, a.name, a.alias, a.lang, a.stateless, model,
                              a.source_offset, a.source_seconds, a.prepend_consent)
    except ApiError as e:
        sys.exit(f"ERROR {e}")
    print(json.dumps(out, ensure_ascii=False))

def cmd_consent(a):
    if a.locale == "all":
        for k, v in CONSENT.items():
            print(f"{k}: {v}")
        return
    s = CONSENT.get(a.locale)
    if not s:
        sys.exit(f"locale {a.locale} not supported for consent. Supported: {', '.join(CONSENT)}")
    print(s)

def cmd_registry(a):
    reg = load_registry()
    if not reg:
        print("(registry empty) -", REGISTRY); return
    print(json.dumps(reg, indent=2, ensure_ascii=False))

def cmd_prebuilt(a):
    for k, v in PREBUILT.items():
        print(f"{k:<16} {v}")

def cmd_import_elevenlabs(a):
    """Download the original sample clips behind an ElevenLabs cloned voice (your own uploads) into recordings/elevenlabs/."""
    key = os.environ.get("ELEVEN_API_KEY") or os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("set ELEVEN_API_KEY")
    H = {"xi-api-key": key}
    voices = requests.get("https://api.elevenlabs.io/v1/voices", headers=H, timeout=60).json().get("voices", [])
    if a.list or not a.voice:
        for v in voices:
            if v.get("category") in ("cloned", "generated") or (a.voice and a.voice.lower() in v["name"].lower()):
                print(f"{v['voice_id']}  {v['name']:<30} {v.get('category'):<10} samples: {len(v.get('samples') or [])}")
        return
    match = [v for v in voices if v["voice_id"] == a.voice or v["name"].lower() == a.voice.lower()] or             [v for v in voices if a.voice.lower() in v["name"].lower()]
    if not match:
        sys.exit(f"no ElevenLabs voice matching {a.voice!r}")
    v = match[0]
    out_dir = RECORDINGS / "elevenlabs" / slug(v["name"]); out_dir.mkdir(parents=True, exist_ok=True)
    files = []
    for i, smp in enumerate(v.get("samples") or [], 1):
        ext = Path(smp.get("file_name") or "").suffix or ".mp3"
        dest = out_dir / f"{i:02d}_{slug(Path(smp.get('file_name') or 'sample').stem)}{ext}"
        r = requests.get(f"https://api.elevenlabs.io/v1/voices/{v['voice_id']}/samples/{smp['sample_id']}/audio", headers=H, timeout=300)
        r.raise_for_status(); dest.write_bytes(r.content)
        files.append({"file": str(dest), "duration_sec": round(audio_duration(dest) or 0, 1)})
    print(json.dumps({"ok": True, "voice": v["name"], "dir": str(out_dir), "files": files}, indent=2, ensure_ascii=False))

# ---------------------------------------------------------------- record UI
READING_SCRIPTS = {
 "en": ("Read naturally, like you are telling this to a friend. Do not rush.",
  "Hi, this is a short recording so an AI model can learn how my voice sounds. "
  "I am going to talk for about a minute in my normal speaking voice, at my usual pace. "
  "Yesterday I went for a walk in the morning. The air was cool, the streets were quiet, and I stopped for a coffee on the way back. "
  "I like mornings like that, when nothing is urgent and there is time to think. "
  "Later in the day I had a few meetings, answered some emails, and worked on a project I have been excited about for a while. "
  "It is the kind of work where the hours pass quickly. In the evening I cooked dinner, something simple, pasta with tomatoes and garlic. "
  "Then I read a few pages of a book and went to sleep early. "
  "That is a pretty typical day for me. Some days are busier, some are slower, but I try to keep a good rhythm. "
  "Numbers are useful too, so here are a few: one, two, three, four, five, ten, twenty, one hundred, two thousand and twenty six. "
  "And a question to finish with: what would you do with an extra hour every day? I think I would spend it outside."),
 "he": ("קראו בטבעיות, כאילו אתם מספרים לחבר. בלי למהר.",
  "היי, זו הקלטה קצרה כדי שמודל בינה מלאכותית ילמד איך הקול שלי נשמע. "
  "אני הולך לדבר בערך דקה בקול הרגיל שלי, בקצב הרגיל שלי. "
  "אתמול יצאתי להליכה בבוקר. האוויר היה קריר, הרחובות היו שקטים, ועצרתי לקפה בדרך חזרה. "
  "אני אוהב בקרים כאלה, כשכלום לא דחוף ויש זמן לחשוב. "
  "אחר כך היו לי כמה פגישות, עניתי על מיילים, ועבדתי על פרויקט שאני מתלהב ממנו כבר הרבה זמן. "
  "זו עבודה שבה השעות עוברות מהר. בערב בישלתי ארוחת ערב, משהו פשוט, פסטה עם עגבניות ושום. "
  "אחר כך קראתי כמה עמודים בספר והלכתי לישון מוקדם. "
  "זה יום די טיפוסי בשבילי. יש ימים עמוסים יותר ויש ימים רגועים יותר, אבל אני משתדל לשמור על קצב טוב. "
  "גם מספרים חשובים, אז הנה כמה: אחת, שתיים, שלוש, ארבע, חמש, עשר, עשרים, מאה, אלפיים עשרים ושש. "
  "ושאלה לסיום: מה הייתם עושים עם שעה נוספת כל יום? אני חושב שהייתי מבלה אותה בחוץ."),
}

STUDIO_HTML = SKILL_DIR / "scripts" / "studio.html"
OUTPUTS = SKILL_DIR / "outputs"

def design_voice(name, prompt, gender=None, lang=None, alias=None, stateless=False, model=DEFAULT_MODEL, sample_out=None):
    voice = {"model": model, "type": "prompted", "display_name": name, "prompted": {"input": prompt}}
    if gender:
        voice["gender"] = gender
    if lang:
        voice["language_code"] = lang
    res = request("POST", "/voices", json={"store": not stateless, "voice": voice})
    vid = res.get("id") or res.get("key")
    sample = (res.get("prompted") or {}).get("sample_audio") or res.get("sample_audio")
    sample_path = None
    if sample and sample.get("data"):
        sp = sample_out or (SKILL_DIR / "samples" / f"{slug(name)}.wav")
        sample_path = str(write_audio(sample["data"], sp).resolve())
    alias = alias or slug(name)
    entry = {("key" if stateless else "id"): vid, "type": "prompted", "display_name": name,
             "prompt": prompt, "model": model, "created": datetime.datetime.now().isoformat(timespec="seconds"),
             "expire_time": res.get("expire_time"), "sample": sample_path, "stateless": bool(stateless)}
    save_alias(alias, entry)
    return {"ok": True, "alias": alias, "voice": short_voice(vid), "sample": sample_path, "expire_time": res.get("expire_time")}

def out_path(kind, fmt):
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    return OUTPUTS / f"{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{kind}.{fmt if fmt in ('wav','mp3','ogg','flac') else 'wav'}"

class StudioHandler(BaseHTTPRequestHandler):
    model = DEFAULT_MODEL
    def log_message(self, *a):  # quiet
        pass
    def _json(self, obj, code=200):
        data = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
    def _bytes(self, data, ctype):
        self.send_response(200); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        u = urlparse(self.path); q = parse_qs(u.query)
        if u.path == "/":
            self._bytes(STUDIO_HTML.read_bytes(), "text/html; charset=utf-8"); return
        if u.path == "/api/config":
            reg = load_registry()
            safe = {}
            for a, e in reg.items():
                safe[a] = {k: v for k, v in e.items() if k != "key"}
                if e.get("key"):
                    safe[a]["has_key"] = True
            self._json({"ok": True, "prebuilt": PREBUILT, "voices": safe, "consent": CONSENT, "scripts": READING_SCRIPTS,
                        "models": [DEFAULT_MODEL, LITE_MODEL], "outputs_dir": str(OUTPUTS), "skill_dir": str(SKILL_DIR)}); return
        if u.path == "/recordings":
            files = []
            if RECORDINGS.exists():
                for p in sorted(RECORDINGS.rglob("*")):
                    if p.suffix.lower() in (".wav", ".mp3", ".m4a", ".ogg", ".webm", ".flac", ".mp4", ".mov") and "compare" not in p.parts:
                        files.append({"name": str(p.relative_to(RECORDINGS)).replace("\\", "/"), "path": str(p), "duration": audio_duration(p) or 0})
            self._json({"ok": True, "files": files}); return
        if u.path == "/file":
            p = Path(q.get("path", [""])[0])
            allowed = p.exists() and any(str(p.resolve()).startswith(str(d.resolve())) for d in (RECORDINGS, OUTPUTS, SKILL_DIR / "samples"))
            if not allowed:
                self._json({"ok": False, "error": "not found"}, 404); return
            self._bytes(p.read_bytes(), {".wav": "audio/wav", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".webm": "audio/webm", ".flac": "audio/flac"}.get(p.suffix.lower(), "application/octet-stream")); return
        self._json({"ok": False, "error": "no such route"}, 404)
    def do_POST(self):
        u = urlparse(self.path); q = parse_qs(u.query)
        n = int(self.headers.get("Content-Length", 0)); body = self.rfile.read(n)
        try:
            if u.path == "/save":
                kind = q.get("kind", ["ref"])[0]
                RECORDINGS.mkdir(parents=True, exist_ok=True)
                stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                orig_name = q.get("name", [""])[0]
                ext = Path(orig_name).suffix if orig_name else ".webm"
                raw = RECORDINGS / f"{kind}_{stamp}{ext or '.bin'}"
                raw.write_bytes(body)
                wav = RECORDINGS / f"{kind}_{stamp}.wav"
                subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(raw), "-vn", "-ac", "1", "-ar", "24000", "-sample_fmt", "s16", str(wav)], check=True)
                if raw.suffix != ".wav":
                    raw.unlink(missing_ok=True)
                self._json({"ok": True, "path": str(wav), "duration": audio_duration(wav) or 0}); return
            data = json.loads(body or b"{}")
            model = data.get("model") or self.model
            if u.path == "/api/speak":
                voice = resolve_voice(data.get("voice"))
                out = out_path("speak", data.get("format", "wav"))
                path = speak_to_file(data.get("text") or "Hello.", voice, (data.get("style") or "").strip() or None, out, model)
                self._json({"ok": True, "file": str(path), "duration": audio_duration(path) or 0}); return
            if u.path == "/api/dialogue":
                turns = data.get("turns") or []
                names = []
                for t in turns:
                    if t.get("speaker") and t["speaker"] not in names:
                        names.append(t["speaker"])
                cast = {k: resolve_voice(v) for k, v in (data.get("speakers") or {}).items()}
                defaults = ["Puck", "Kore", "Charon", "Leda", "Orus", "Aoede"]
                for i, nm in enumerate(names):
                    cast.setdefault(nm, defaults[i % len(defaults)])
                if len(names) == 1:
                    cfg = [{"voice": cast[names[0]]}]
                    turns = [{"text": t["text"], "style": t.get("style")} for t in turns]
                else:
                    cfg = {"mode": "conversational", "speakers": [{"speaker": nm, "voice": cast[nm]} for nm in names]}
                out = out_path("dialogue", data.get("format", "wav"))
                path = write_audio(synthesize(turns, cfg, model), out)
                self._json({"ok": True, "file": str(path), "duration": audio_duration(path) or 0}); return
            if u.path == "/api/design":
                res = design_voice(data["name"], data["prompt"], data.get("gender") or None, data.get("lang") or None,
                                   (data.get("alias") or "").strip() or None, bool(data.get("stateless")), model)
                self._json(res); return
            if u.path == "/api/voice-delete":
                alias = data.get("alias"); reg = load_registry(); entry = reg.get(alias, {})
                vid = entry.get("id")
                if vid and vid.startswith("voice_"):
                    try:
                        request("DELETE", f"/voices/{vid}")
                    except ApiError as e:
                        if e.status != 404:
                            raise
                reg.pop(alias, None); save_registry(reg)
                self._json({"ok": True}); return
            if u.path == "/replicate":
                off = float(data["offset"]) if str(data.get("offset", "")).strip() else None
                secs = float(data["seconds"]) if str(data.get("seconds", "")).strip() else None
                out = replicate_voice(data["source"], data["consent"], data.get("name") or "My Voice",
                                      (data.get("alias") or "").strip() or None, None, bool(data.get("stateless")),
                                      model, off, secs, bool(data.get("prepend_consent", True)))
                self._json(out); return
            self._json({"ok": False, "error": "no such route"}, 404)
        except ApiError as e:
            self._json({"ok": False, "error": str(e)})
        except subprocess.CalledProcessError as e:
            self._json({"ok": False, "error": f"ffmpeg failed: {e}"})
        except Exception as e:
            self._json({"ok": False, "error": f"{type(e).__name__}: {e}"})

def cmd_studio(a, tab=None):
    api_key()
    if not STUDIO_HTML.exists():
        sys.exit(f"missing {STUDIO_HTML}")
    StudioHandler.model = LITE_MODEL if a.lite else a.model
    try:
        srv = ThreadingHTTPServer(("127.0.0.1", a.port), StudioHandler)
    except OSError:
        sys.exit(f"port {a.port} is busy (studio already running?). Open http://127.0.0.1:{a.port}/ or use --port")
    url = f"http://127.0.0.1:{a.port}/" + (f"#{tab}" if tab else "")
    print(f"Gemini Voice Studio: {url}   (Ctrl+C to stop)")
    print(f"Outputs -> {OUTPUTS}   recordings -> {RECORDINGS}")
    if not a.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()

def cmd_record(a):
    cmd_studio(a, tab="clone")

def cmd_doctor(a):
    ok = True
    def line(good, msg):
        nonlocal ok
        ok = ok and good
        print(("  OK   " if good else "  FAIL ") + msg)
    print(f"gemini-tts doctor  (skill dir: {SKILL_DIR})")
    line(sys.version_info >= (3, 9), f"Python {sys.version.split()[0]} (need 3.9+)")
    line(True, "requests module present")
    line(bool(shutil.which("ffmpeg")), "ffmpeg on PATH" + ("" if shutil.which("ffmpeg") else "  -> install: winget install Gyan.FFmpeg | brew install ffmpeg | apt install ffmpeg"))
    line(bool(shutil.which("ffprobe")), "ffprobe on PATH")
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    line(bool(key), "GEMINI_API_KEY set" + ("" if key else "  -> get one at https://aistudio.google.com/apikey"))
    line(STUDIO_HTML.exists(), "studio.html present")
    if key:
        try:
            res = request("GET", "/voices", params=[("page_size", "1")])
            line(True, f"Voices API reachable ({len(res.get('voices', []))} voice returned)")
        except ApiError as e:
            line(False, f"Voices API error: {e}")
        if not a.quick:
            try:
                out = OUTPUTS / "doctor_test.wav"
                speak_to_file("Doctor check complete.", "Kore", None, out, DEFAULT_MODEL)
                line(True, f"TTS round-trip OK -> {out}")
            except ApiError as e:
                line(False, f"TTS error: {e}")
    print("All good." if ok else "Fix the FAIL lines above and run again.")

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    def common(p):
        p.add_argument("--model", default=DEFAULT_MODEL)
        p.add_argument("--lite", action="store_true", help=f"use {LITE_MODEL} (faster, cheaper)")

    p = sub.add_parser("speak", help="single-speaker TTS")
    p.add_argument("text", nargs="?", help="text (or use --file / stdin)")
    p.add_argument("--file", "-f")
    p.add_argument("--voice", "-v", default="Kore", help="prebuilt name, voice_..., voicekey_..., or registry alias")
    p.add_argument("--style", "-s", default=None, help="turn-level delivery, e.g. 'warm, slow, storytelling'")
    p.add_argument("--out", "-o", default="output.wav", help=".wav (native) or .mp3/.ogg/.flac via ffmpeg")
    p.add_argument("--chunk-chars", type=int, default=6000, help="split long text into chunks of ~N chars")
    common(p); p.set_defaults(fn=cmd_speak)

    p = sub.add_parser("dialogue", help="multi-speaker TTS from script file")
    p.add_argument("script", help="'Name: line' per line ('Name [style]: line' ok) or JSON list")
    p.add_argument("--speakers", help="Name=Voice,Name2=Voice2 (voices: prebuilt/voice_/alias)")
    p.add_argument("--global-style", help="style applied to turns without their own")
    p.add_argument("--out", "-o", default="dialogue.wav")
    common(p); p.set_defaults(fn=cmd_dialogue)

    p = sub.add_parser("voices", help="list voices (stored custom first, then catalog)")
    p.add_argument("--type", nargs="*", help="prebuilt prompted replicated")
    p.add_argument("--lang", nargs="*", help="e.g. he-IL en-US")
    p.add_argument("--gender", nargs="*"); p.add_argument("--accent", nargs="*")
    p.add_argument("--persona", nargs="*"); p.add_argument("--context", nargs="*"); p.add_argument("--pitch", nargs="*")
    p.add_argument("--search"); p.add_argument("--limit", type=int, default=50)
    p.add_argument("--json", action="store_true")
    p.set_defaults(fn=cmd_voices)

    p = sub.add_parser("prebuilt", help="print the 30 studio voices"); p.set_defaults(fn=cmd_prebuilt)

    p = sub.add_parser("voice-get"); p.add_argument("voice"); p.add_argument("--sample-out")
    p.set_defaults(fn=cmd_voice_get)

    p = sub.add_parser("voice-delete"); p.add_argument("voice"); p.set_defaults(fn=cmd_voice_delete)

    p = sub.add_parser("design", help="create a custom voice from a description")
    p.add_argument("--name", required=True); p.add_argument("--prompt", required=True)
    p.add_argument("--gender", choices=["male", "female"]); p.add_argument("--lang", help="e.g. he-IL, en-GB")
    p.add_argument("--alias", help="local short name (default from --name)")
    p.add_argument("--sample-out"); p.add_argument("--stateless", action="store_true")
    common(p); p.set_defaults(fn=cmd_design)

    p = sub.add_parser("replicate", help="clone a voice (reference clip + consent clip)")
    p.add_argument("--source", required=True, help="clean speech clip, any audio/video format")
    p.add_argument("--consent", required=True, help="clip of the SAME speaker reading the consent sentence")
    p.add_argument("--name", default="My Voice"); p.add_argument("--alias"); p.add_argument("--lang")
    p.add_argument("--source-offset", type=float, help="start at N seconds of the source file")
    p.add_argument("--source-seconds", type=float, help="use only N seconds of the source file")
    p.add_argument("--stateless", action="store_true", help="get a 7-day voicekey_ instead of a stored voice_")
    p.add_argument("--prepend-consent", action="store_true", help="reference = consent clip + source (needed when the reference is not in the consent language, e.g. Hebrew)")
    common(p); p.set_defaults(fn=cmd_replicate)

    p = sub.add_parser("studio", help="open the local web studio (speak, dialogue, voices, clone)")
    p.add_argument("--port", type=int, default=7891); p.add_argument("--no-browser", action="store_true")
    common(p); p.set_defaults(fn=cmd_studio)

    p = sub.add_parser("record", help="open the studio on the Clone tab")
    p.add_argument("--port", type=int, default=7891); p.add_argument("--no-browser", action="store_true")
    common(p); p.set_defaults(fn=cmd_record)

    p = sub.add_parser("doctor", help="check python, ffmpeg, API key, and do a tiny test render")
    p.add_argument("--quick", action="store_true", help="skip the test render"); p.set_defaults(fn=cmd_doctor)

    p = sub.add_parser("import-elevenlabs", help="download your original sample clips from an ElevenLabs cloned voice")
    p.add_argument("voice", nargs="?", help="ElevenLabs voice name or id (omit or --list to list cloned voices)")
    p.add_argument("--list", action="store_true"); p.set_defaults(fn=cmd_import_elevenlabs)

    p = sub.add_parser("consent", help="print consent sentence for a locale")
    p.add_argument("locale", nargs="?", default="en-US", help="e.g. en-US, or 'all'")
    p.set_defaults(fn=cmd_consent)

    p = sub.add_parser("registry", help="show saved voice aliases"); p.set_defaults(fn=cmd_registry)

    a = ap.parse_args()
    try:
        a.fn(a)
    except ApiError as e:
        sys.exit(f"ERROR {e}")

if __name__ == "__main__":
    main()
