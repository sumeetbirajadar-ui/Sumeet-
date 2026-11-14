"""Cut a video down to the parts in a keep list, with short audio fades so the joins don't click.

usage: python3 apply_keep.py <video> <keep.json> <out.mp4> [--crf 18] [--fade 0.012]

keep.json is either a list of [start, end] pairs in seconds, or an object with a "keep" list (the format the
Video Editor plugin's silences.py writes). Parts shorter than 0.05 s are skipped. Prints the new duration and a
time map (old start -> new start for each part), also saved next to the output as <out>-timemap.json, so word
times can be shifted onto the cut's timeline without transcribing again.
"""
import argparse, json, os, subprocess, sys


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type:format=duration',
                          '-of', 'json', path], capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    kinds = {s['codec_type'] for s in j.get('streams', [])}
    return float(j['format']['duration']), 'audio' in kinds


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video'); ap.add_argument('keep'); ap.add_argument('out')
    ap.add_argument('--crf', default='18'); ap.add_argument('--fade', type=float, default=0.012)
    a = ap.parse_args()

    dur, has_audio = probe(a.video)
    data = json.load(open(a.keep))
    parts = data.get('keep', []) if isinstance(data, dict) else data
    parts = sorted((max(0.0, float(s)), min(dur, float(e))) for s, e in parts)
    parts = [(s, e) for s, e in parts if e - s >= 0.05]
    if not parts:
        sys.exit('keep list is empty')

    chains, labels, timemap, t = [], [], [], 0.0
    for i, (s, e) in enumerate(parts):
        chains.append(f'[0:v]trim=start={s:.3f}:end={e:.3f},setpts=PTS-STARTPTS[v{i}]')
        lab = f'[v{i}]'
        if has_audio:
            f = min(a.fade, (e - s) / 4)
            chains.append(f'[0:a]atrim=start={s:.3f}:end={e:.3f},asetpts=PTS-STARTPTS,'
                          f'afade=t=in:d={f:.3f},afade=t=out:st={e - s - f:.3f}:d={f:.3f}[a{i}]')
            lab += f'[a{i}]'
        labels.append(lab)
        timemap.append({'old_start': round(s, 3), 'old_end': round(e, 3), 'new_start': round(t, 3)})
        t += e - s
    n = len(parts)
    chains.append(''.join(labels) + f'concat=n={n}:v=1:a={1 if has_audio else 0}' + ('[v][a]' if has_audio else '[v]'))

    cmd = ['ffmpeg', '-y', '-v', 'error', '-i', a.video, '-filter_complex', ';'.join(chains), '-map', '[v]']
    if has_audio:
        cmd += ['-map', '[a]', '-c:a', 'aac', '-b:a', '192k']
    cmd += ['-c:v', 'libx264', '-preset', 'medium', '-crf', str(a.crf), '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart', a.out]
    subprocess.run(cmd, check=True)

    tm_path = os.path.splitext(a.out)[0] + '-timemap.json'
    json.dump(timemap, open(tm_path, 'w'), indent=1)
    removed = dur - t
    print(f'parts {n}  old {dur:.2f}s  new {t:.2f}s  removed {removed:.2f}s')
    print(f'OUT={a.out}')
    print(f'TIMEMAP={tm_path}')


if __name__ == '__main__':
    main()
