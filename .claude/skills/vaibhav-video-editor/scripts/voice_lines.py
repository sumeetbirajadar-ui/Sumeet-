"""Voice a script line by line and lay the lines out at a chosen pace: one voice track plus word timings.

usage: python3 voice_lines.py <lines.txt> <out_dir> [--name NAME] [--pace normal|brisk|fast] [--provider P] [--voice V]
                              [--hold-tail 2.6] [--min-hold "2:2.3,10:1.7"]

lines.txt: one spoken line per row (a sentence, or one list item). Blank rows and rows starting with # are skipped.
Each line is voiced on its own with scripts/voiceover.py (same providers and keys), then placed so that:
  - the next line starts after a breath (shorter between list items, which are lines of one to three words),
  - every line stays on screen long enough to read: at least 0.5 s + 0.3 s a word (HyperFrames' reading rule),
  - --min-hold gives chosen lines more time (1-based line number : seconds), e.g. for a card that animates.
Paces:  normal  speed 1.0,  breaths 0.40 s / 0.30 s, reading floor on
        brisk   speed 1.1,  breaths 0.28 s / 0.20 s, reading floor on   (default: about 1.2x, quick but readable)
        fast    speed 1.15, breaths 0.14 s / 0.06 s, no reading floor  (packed; captions may be hard to read)
Writes <out_dir>/<NAME>-voice.wav, <NAME>-voice-words.json ([{start, end, word, line}]) and <NAME>-lines.json
([{line, text, start, end, hold}]), and prints the layout and DURATION= (voice end + --hold-tail for the CTA).
Speech-free audio between lines is silent, so scripts/check_words.py passes on the result.
"""
import argparse, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PACES = {'normal': (1.0, 0.40, 0.30, True), 'brisk': (1.1, 0.28, 0.20, True), 'fast': (1.15, 0.14, 0.06, False)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('lines'); ap.add_argument('out_dir')
    ap.add_argument('--name', default='narration')
    ap.add_argument('--pace', choices=list(PACES), default='brisk')
    ap.add_argument('--provider'); ap.add_argument('--voice'); ap.add_argument('--model'); ap.add_argument('--lang')
    ap.add_argument('--speed', type=float, help='override the pace speed')
    ap.add_argument('--hold-tail', type=float, default=2.6, help='seconds after the last word (CTA hold)')
    ap.add_argument('--min-hold', default='', help='e.g. "2:2.3,10:1.7" (line number : seconds)')
    a = ap.parse_args()
    speed, gap, gap_list, floor_on = PACES[a.pace]
    speed = a.speed or speed
    min_hold = {int(k): float(v) for k, v in (x.split(':') for x in a.min_hold.split(',') if x.strip())}

    texts = [l.strip() for l in open(a.lines) if l.strip() and not l.lstrip().startswith('#')]
    seg_dir = os.path.join(a.out_dir, f'{a.name}-lines')
    os.makedirs(seg_dir, exist_ok=True)
    placed, words, cur = [], [], 0.08
    for i, text in enumerate(texts, 1):
        tf = os.path.join(seg_dir, f'{i:02d}.txt')
        open(tf, 'w').write(text + '\n')
        cmd = [sys.executable, os.path.join(HERE, 'voiceover.py'), tf, seg_dir, '--name', f'{i:02d}', '--speed', str(speed)]
        for flag, v in (('--provider', a.provider), ('--voice', a.voice), ('--model', a.model), ('--lang', a.lang)):
            if v:
                cmd += [flag, v]
        out = subprocess.run(cmd, capture_output=True, text=True)
        if out.returncode != 0:
            sys.exit(f'line {i} failed:\n{out.stdout[-600:]}{out.stderr[-1500:]}')
        voice = re.search(r'^VOICE=(.*)$', out.stdout, re.M).group(1)
        w = json.load(open(re.search(r'^WORDS=(.*)$', out.stdout, re.M).group(1)))
        if not w:
            sys.exit(f'line {i} came back with no words: "{text}"')
        s0, e0 = w[0]['start'], w[-1]['end']
        n = len(text.split())
        is_item = n <= 3 and not text.rstrip().endswith('?')
        speech = e0 - s0
        hold = speech + (gap_list if is_item else gap)
        if floor_on:
            hold = max(hold, 0.5 + 0.3 * n + (0.1 if is_item else 0.15))
        hold = max(hold, min_hold.get(i, 0))
        off = cur - s0
        placed.append({'line': i, 'text': text, 'start': round(cur, 3), 'end': round(cur + speech, 3), 'hold': round(hold, 3),
                       'file': voice, 'offset': off})
        for x in w:
            words.append({'start': round(x['start'] + off, 3), 'end': round(x['end'] + off, 3), 'word': x['word'], 'line': i})
        cur += hold
        print(f'{i:02d} {placed[-1]["start"]:6.2f}  hold {hold:.2f}  {text}')

    total = round(words[-1]['end'] + a.hold_tail, 2)
    inputs, chains = [], []
    for k, p in enumerate(placed):
        inputs += ['-i', p['file']]
        pre = f'atrim=start={-p["offset"]:.3f},asetpts=PTS-STARTPTS,' if p['offset'] < 0 else ''
        chains.append(f'[{k}:a]{pre}aformat=sample_rates=48000:channel_layouts=mono,adelay={max(0, int(round(p["offset"] * 1000)))}[a{k}]')
    chains.append(''.join(f'[a{k}]' for k in range(len(placed))) +
                  f'amix=inputs={len(placed)}:normalize=0:duration=longest,apad,atrim=0:{total}[o]')
    voice_out = os.path.abspath(os.path.join(a.out_dir, f'{a.name}-voice.wav'))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *inputs, '-filter_complex', ';'.join(chains), '-map', '[o]', '-ar', '48000',
                    voice_out], check=True)
    wpath = os.path.abspath(os.path.join(a.out_dir, f'{a.name}-voice-words.json'))
    json.dump(words, open(wpath, 'w'), indent=0)
    lpath = os.path.abspath(os.path.join(a.out_dir, f'{a.name}-lines.json'))
    json.dump([{k: v for k, v in p.items() if k not in ('file', 'offset')} for p in placed], open(lpath, 'w'), indent=1)
    print(f'pace {a.pace} (speed {speed}), {len(texts)} lines')
    print(f'VOICE={voice_out}')
    print(f'WORDS={wpath}')
    print(f'LINES={lpath}')
    print(f'DURATION={total}')


if __name__ == '__main__':
    main()
