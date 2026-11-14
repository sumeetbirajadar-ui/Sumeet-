"""Check word timings against the audio, so drifted transcripts are caught before anything is timed to them.

usage: python3 check_words.py <video or audio> <words.json> [--db -32] [--min-gap 0.12]

words.json: a list of {"start", "end", "word"} (or {"words": [...]}, or whisper.cpp -ojf output).
It finds the speech gaps (ffmpeg silencedetect on the voice band) and flags:
  - words that start inside a gap (the transcript says speech, the audio says silence)
  - speech that starts after a gap of 0.4 s or more with no word starting within 0.35 s of it
Whisper word times often drift after music, applause or a stretch with no talking: re-transcribe the flagged
stretch on its own (cut on the gaps), or snap the first word after each gap to the gap's end.
Prints OK when nothing is flagged.
"""
import argparse, json, re, subprocess


def load_words(path):
    d = json.load(open(path))
    if isinstance(d, dict) and 'transcription' in d:      # whisper.cpp -ojf
        out = []
        for seg in d['transcription']:
            for t in seg['tokens']:
                tx = t['text']
                if tx.startswith('[_') or not tx.strip():
                    continue
                s, e = t['offsets']['from'] / 1000, t['offsets']['to'] / 1000
                if tx.startswith(' ') or not out:
                    out.append({'start': s, 'end': e, 'word': tx.strip()})
                else:
                    out[-1]['end'] = e; out[-1]['word'] += tx
        return out
    if isinstance(d, dict):
        d = d.get('words', d.get('segments', []))
    return [{'start': float(w['start']), 'end': float(w['end']), 'word': w.get('word', w.get('text', '')).strip()} for w in d]


def gaps(path, db, min_gap):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vn', '-af',
                          f'highpass=f=200,lowpass=f=3500,silencedetect=n={db}dB:d={min_gap}', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', err)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]
    return list(zip(starts, ends))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('media'); ap.add_argument('words')
    ap.add_argument('--db', type=float, default=-32); ap.add_argument('--min-gap', type=float, default=0.12)
    a = ap.parse_args()
    words, gs = load_words(a.words), gaps(a.media, a.db, a.min_gap)
    flags = []
    for w in words:
        for s, e in gs:
            if s + 0.05 < w['start'] < e - 0.05:
                flags.append((w['start'], f'"{w["word"]}" starts at {w["start"]:.2f} inside a silence {s:.2f}-{e:.2f}'))
    for s, e in gs:
        if not any(w['start'] >= s for w in words):
            continue                                    # silence after the last word (an ending or a hold) is fine
        if e - s >= 0.4 and not any(abs(w['start'] - e) <= 0.35 for w in words):
            near = min(words, key=lambda w: abs(w['start'] - e), default=None)
            hint = f' (nearest word "{near["word"]}" at {near["start"]:.2f})' if near else ''
            flags.append((e, f'speech starts at {e:.2f} after a {e - s:.1f}s gap with no word there{hint}'))
    for _, msg in sorted(flags):
        print('DRIFT', msg)
    print('OK' if not flags else f'{len(flags)} timing problems: fix these stretches before planning')


if __name__ == '__main__':
    main()
