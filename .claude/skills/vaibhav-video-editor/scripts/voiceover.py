"""Make a voiceover from a script and get word timings, with any of four voice providers.

usage: python3 voiceover.py <script.txt> <out_dir> [--name NAME] [--provider P] [--voice V] [--model M]
                            [--lang L] [--speed S] [--list-voices]

providers (--provider, default: elevenlabs if $ELEVENLABS_API_KEY is set, else kokoro):
  elevenlabs  ElevenLabs API, needs $ELEVENLABS_API_KEY. Exact word timings from its timestamps endpoint.
              --voice <voice id> (see --list-voices), --model (default eleven_multilingual_v2; also
              eleven_v3, eleven_turbo_v2_5, eleven_flash_v2_5). Multilingual v2 reads Hindi and Hinglish.
  gemini      Google's Gemini TTS through the HyperFrames audio engine, needs $GEMINI_API_KEY (free key from
              Google AI Studio). --voice e.g. Kore, Puck, Charon. Timings by transcription.
  heygen      HeyGen voices through HyperFrames (free with `npx hyperframes auth login`). Word timings included.
  kokoro      Kokoro-82M on this computer through `npx hyperframes tts`: free, offline, no account.
              --voice af_heart (default), am_michael, bf_emma, bm_george ... (--list-voices). Timings by
              transcription.

Writes <out_dir>/<NAME>-voice.<wav|mp3> and <out_dir>/<NAME>-voice-words.json ([{start, end, word}], seconds),
and prints VOICE=, WORDS=, DURATION=. Keys are read from the environment only and never printed or saved.
"""
import argparse, base64, glob, json, os, re, shutil, subprocess, sys, urllib.error, urllib.request

HF = os.environ.get('HYPERFRAMES_CLI', 'npx --yes hyperframes@0.8.226').split()
# Kokoro runs in its own Python 3.12 venv when there is one (set up with:
#   python3.12 -m venv ~/.local/share/hyperframes-venv && ~/.local/share/hyperframes-venv/bin/pip install kokoro-onnx soundfile)
_VENV_PY = os.path.expanduser('~/.local/share/hyperframes-venv/bin/python')
if not os.environ.get('HYPERFRAMES_PYTHON') and os.path.exists(_VENV_PY):
    os.environ['HYPERFRAMES_PYTHON'] = _VENV_PY


def media_use_dir():
    hits = sorted(glob.glob(os.path.expanduser('~/.claude/plugins/cache/hyperframes/hyperframes/*/skills/media-use')))
    hits += sorted(glob.glob(os.path.expanduser('~/.claude/plugins/marketplaces/hyperframes/skills/media-use')))
    if not hits:
        sys.exit('HyperFrames is not installed: /plugin marketplace add heygen-com/hyperframes, then /plugin install hyperframes@hyperframes')
    return hits[-1]


def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


# ---------------------------------------------------------------- ElevenLabs
def eleven(method, path, body=None):
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        sys.exit('ELEVENLABS_API_KEY is not set. Add `export ELEVENLABS_API_KEY=...` to ~/.zshrc yourself, open a new '
                 'terminal, and run again. (Never paste the key into the chat.)')
    req = urllib.request.Request('https://api.elevenlabs.io' + path, method=method,
                                 data=json.dumps(body).encode() if body else None,
                                 headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f'ElevenLabs error {e.code}: {e.read().decode(errors="replace")[:400]}')


def tts_elevenlabs(text, out, a):
    voice = a.voice
    if not voice:
        voices = eleven('GET', '/v1/voices').get('voices', [])
        if not voices:
            sys.exit('No ElevenLabs voices on this account.')
        voice = voices[0]['voice_id']
        print(f'no --voice given, using "{voices[0]["name"]}" ({voice})')
    body = {'text': text, 'model_id': a.model or 'eleven_multilingual_v2'}
    if a.lang:
        body['language_code'] = a.lang
    r = eleven('POST', f'/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128', body)
    path = out + '.mp3'
    open(path, 'wb').write(base64.b64decode(r['audio_base64']))
    al = r.get('alignment') or r.get('normalized_alignment') or {}
    chars, st, en = al.get('characters', []), al.get('character_start_times_seconds', []), al.get('character_end_times_seconds', [])
    words, cur = [], None
    for c, s, e in zip(chars, st, en):
        if c.isspace():
            cur = None
            continue
        if cur is None:
            cur = {'start': s, 'end': e, 'word': c}; words.append(cur)
        else:
            cur['end'] = e; cur['word'] += c
    return path, words


# ---------------------------------------------------------------- HyperFrames-backed providers
def tts_kokoro(text_file, out, a):
    path = out + '.wav'
    cmd = HF + ['tts', text_file, '-o', path, '-v', a.voice or 'af_heart']
    if a.speed:
        cmd += ['-s', str(a.speed)]
    if a.lang:
        cmd += ['-l', a.lang]
    subprocess.run(cmd, check=True)
    return path, None


def tts_heygen(text_file, out, a):
    path, wpath = out + '.wav', out + '-heygen-words.json'
    cmd = ['node', os.path.join(media_use_dir(), 'audio', 'scripts', 'heygen-tts.mjs'), text_file,
           '--output', path, '--words', wpath]
    for flag, v in (('--voice', a.voice), ('--speed', a.speed), ('--lang', a.lang)):
        if v:
            cmd += [flag, str(v)]
    subprocess.run(cmd, check=True)
    words = [{'start': w['start'], 'end': w['end'], 'word': w.get('text', w.get('word', ''))} for w in json.load(open(wpath))]
    return path, words


def tts_gemini(text, out, a):
    if not (os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')):
        sys.exit('GEMINI_API_KEY is not set. Get a free key at aistudio.google.com/apikey, add '
                 '`export GEMINI_API_KEY=...` to ~/.zshrc yourself, open a new terminal, and run again.')
    work = os.path.dirname(out)
    req = {'provider': 'gemini', 'lines': [{'id': 'vo', 'text': text}], 'bgm': {'mode': 'none'}}
    for k, v in (('voice', a.voice), ('lang', a.lang), ('speed', a.speed), ('tts_model', a.model)):
        if v:
            req[k] = v
    rq, meta = out + '-request.json', out + '-meta.json'
    json.dump(req, open(rq, 'w'))
    subprocess.run(['node', os.path.join(media_use_dir(), 'audio', 'scripts', 'audio.mjs'), '--request', rq,
                    '--hyperframes', work, '--out', meta, '--only', 'tts'], check=True, cwd=work)
    m = json.load(open(meta))
    v = m['voices']
    v = v[0] if isinstance(v, list) else v.get('vo', next(iter(v.values())))
    src = v['path'] if os.path.isabs(v['path']) else os.path.join(work, v['path'])
    path = out + os.path.splitext(src)[1]
    shutil.copy(src, path)
    words = [{'start': w['start'], 'end': w['end'], 'word': w.get('text', w.get('word', ''))} for w in v.get('words') or []]
    return path, words or None


# ---------------------------------------------------------------- timings by transcription
def transcribe(path, lang):
    """Word timings for audio that came without them: whisper-cli if installed, else HyperFrames' transcriber."""
    models = [os.environ.get('WHISPER_MODEL', '')] + sorted(glob.glob(os.path.expanduser('~/.local/share/whisper-models/ggml-*.bin')))
    models = [m for m in models if m and os.path.isfile(m)]
    tmp = os.path.splitext(path)[0] + '-asr'
    if shutil.which('whisper-cli') and models:
        model = next((m for m in models if 'turbo' in m), models[0])
        wav = tmp + '.wav'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', path, '-ar', '16000', '-ac', '1', wav], check=True)
        subprocess.run(['whisper-cli', '-m', model, '-f', wav, '-l', lang[:2] if lang else 'auto', '-ml', '1', '-sow', '-ojf',
                        '-of', tmp, '-np'], check=True, capture_output=True)
        d, words = json.load(open(tmp + '.json')), []
        for seg in d['transcription']:
            for t in seg['tokens']:
                tx = t['text']
                if tx.startswith('[_') or not tx.strip():
                    continue
                s, e = t['offsets']['from'] / 1000, t['offsets']['to'] / 1000
                if tx.startswith(' ') or not words:
                    words.append({'start': s, 'end': e, 'word': tx.strip()})
                else:
                    words[-1]['end'] = e; words[-1]['word'] += tx
        return words
    d = tmp + '-hf'
    os.makedirs(d, exist_ok=True)
    cmd = HF + ['transcribe', path, '--dir', d, '--json'] + (['--language', lang[:2]] if lang else [])
    subprocess.run(cmd, check=True, capture_output=True)
    t = json.load(open(os.path.join(d, 'transcript.json')))
    t = t.get('words', t.get('segments', t)) if isinstance(t, dict) else t
    return [{'start': w['start'], 'end': w['end'], 'word': w.get('text', w.get('word', '')).strip()} for w in t]


def snap_to_speech(path, words):
    """Transcribed starts often sit a little early, inside the pause before a sentence. TTS audio is clean, so move
    any word that starts inside a silence to where the speech starts (keeping the words in order)."""
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af',
                          'highpass=f=200,lowpass=f=3500,silencedetect=n=-32dB:d=0.12', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    gaps = list(zip([float(x) for x in re.findall(r'silence_start: ([\d.]+)', err)],
                    [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]))
    for s, e in gaps:
        inside = [w for w in words if s + 0.05 < w['start'] < e - 0.05]
        for k, w in enumerate(inside):
            w['start'] = round(e + k * 0.08, 3)
            w['end'] = max(w['end'], w['start'] + 0.05)
    return words


def respell(words, text):
    """Use the script's own spelling (names, numbers) when the word counts line up."""
    script = text.split()
    if len(script) == len(words):
        for w, s in zip(words, script):
            w['word'] = s
    return words


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('script'); ap.add_argument('out_dir')
    ap.add_argument('--name', default='narration')
    ap.add_argument('--provider', choices=['elevenlabs', 'gemini', 'heygen', 'kokoro'])
    ap.add_argument('--voice'); ap.add_argument('--model'); ap.add_argument('--lang')
    ap.add_argument('--speed', type=float)
    ap.add_argument('--list-voices', action='store_true')
    a = ap.parse_args()
    provider = a.provider or ('elevenlabs' if os.environ.get('ELEVENLABS_API_KEY') else 'kokoro')

    if a.list_voices:
        if provider == 'elevenlabs':
            for v in eleven('GET', '/v1/voices').get('voices', []):
                labels = ', '.join(f'{k}: {x}' for k, x in (v.get('labels') or {}).items())
                print(f'{v["voice_id"]}  {v["name"]}  {labels}')
        elif provider == 'kokoro':
            subprocess.run(HF + ['tts', '--list'])
        else:
            print('See the provider dashboard for voice ids (Gemini: Kore, Puck, Charon, Aoede, Fenrir, Leda ...).')
        return

    os.makedirs(a.out_dir, exist_ok=True)
    text = re.sub(r'\s+', ' ', open(a.script).read()).strip()
    text_file = os.path.abspath(os.path.join(a.out_dir, f'{a.name}-script.txt'))
    open(text_file, 'w').write(text + '\n')
    out = os.path.abspath(os.path.join(a.out_dir, f'{a.name}-voice'))

    path, words = {'elevenlabs': lambda: tts_elevenlabs(text, out, a), 'kokoro': lambda: tts_kokoro(text_file, out, a),
                   'heygen': lambda: tts_heygen(text_file, out, a), 'gemini': lambda: tts_gemini(text, out, a)}[provider]()
    if not words:
        words = snap_to_speech(path, respell(transcribe(path, a.lang), text))
    words = [{'start': round(w['start'], 3), 'end': round(w['end'], 3), 'word': w['word']} for w in words if w['word'].strip()]
    wpath = out + '-words.json'
    json.dump(words, open(wpath, 'w'), indent=0)
    print(f'provider {provider}: {len(words)} words')
    print(f'VOICE={path}')
    print(f'WORDS={wpath}')
    print(f'DURATION={duration(path):.2f}')


if __name__ == '__main__':
    main()
