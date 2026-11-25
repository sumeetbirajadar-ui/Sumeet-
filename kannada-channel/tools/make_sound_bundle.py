"""Generate an original, copyright-free starter sound bundle with code (numpy + ffmpeg).

Every sound here is synthesised from scratch, so the channel owns it outright.
Usage:  python make_sound_bundle.py <output_dir>
Writes <output_dir>/01_Meme_SFX/*.mp3 and <output_dir>/02_Emotion_Music/*.mp3
(normalised: SFX to -12 LUFS, music beds to -16 LUFS so voice sits on top).
"""
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

SR = 44100
RNG = np.random.default_rng(7)


# ---------- building blocks ----------
def t(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.005, r=None, curve=6.0):
    """Attack then exponential decay over n samples."""
    e = np.ones(n)
    na = max(1, int(SR * a))
    e[:na] = np.linspace(0, 1, na)
    tail = np.linspace(0, 1, n - na)
    e[na:] = np.exp(-curve * tail) if r is None else np.clip(1 - tail / r, 0, 1)
    return e


def osc(freq, d, kind="sine", harmonics=8):
    """freq may be a float or an array (pitch glide)."""
    n = int(SR * d)
    f = np.full(n, freq, dtype=float) if np.isscalar(freq) else np.asarray(freq, float)[:n]
    ph = 2 * np.pi * np.cumsum(f) / SR
    if kind == "sine":
        return np.sin(ph)
    if kind == "tri":
        return (2 / np.pi) * np.arcsin(np.sin(ph))
    if kind == "square":
        return sum(np.sin(k * ph) / k for k in range(1, 2 * harmonics, 2)) * 4 / np.pi
    if kind == "saw":
        return sum(((-1) ** (k + 1)) * np.sin(k * ph) / k for k in range(1, harmonics + 1)) * 2 / np.pi
    raise ValueError(kind)


def noise(d):
    return RNG.uniform(-1, 1, int(SR * d))


def band_noise(d, centers, width=0.25):
    """Noise whose pass-band glides through `centers` (Hz) — FFT per block, crossfaded."""
    n = int(SR * d)
    blk = 2048
    hop = blk // 2
    out = np.zeros(n + blk)
    win = np.hanning(blk)
    src = noise(d + blk / SR)
    freqs = np.fft.rfftfreq(blk, 1 / SR)
    nb = n // hop + 1
    cs = np.interp(np.linspace(0, 1, nb), np.linspace(0, 1, len(centers)), centers)
    for i in range(nb):
        s = i * hop
        seg = src[s:s + blk] * win
        spec = np.fft.rfft(seg)
        c = cs[i]
        spec *= np.exp(-((np.log2(np.maximum(freqs, 1) / c)) ** 2) / (2 * width ** 2))
        out[s:s + blk] += np.fft.irfft(spec, blk) * win
    out = out[:n]
    return out / (np.max(np.abs(out)) + 1e-9)


def note(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def pluck(freq, d=0.6, bright=6):
    x = t(d)
    sig = sum(np.sin(2 * np.pi * freq * k * x) * np.exp(-x * (3 + k * bright / 3)) / k for k in range(1, 7))
    return sig * env(len(x), 0.002, curve=4)


def pad(freqs, d):
    x = t(d)
    sig = sum(osc(f * (1 + 0.003 * np.sin(2 * np.pi * 0.3 * x + i)), d, "saw", 6) for i, f in enumerate(freqs))
    a = np.minimum(1, x / 0.8) * np.minimum(1, (d - x) / 0.8)
    return sig / len(freqs) * a


def kick(d=0.35):
    x = t(d)
    f = 50 + 120 * np.exp(-x * 30)
    return osc(f, d) * np.exp(-x * 9)


def snare(d=0.2):
    x = t(d)
    return (0.7 * noise(d) + 0.3 * osc(190, d)) * np.exp(-x * 22)


def hat(d=0.05):
    return band_noise(d, [9000], 0.5) * np.exp(-t(d) * 60)


def crash(d=1.6):
    return band_noise(d, [7000, 5000], 0.8) * np.exp(-t(d) * 2.5)


def mix_at(buf, sig, at, gain=1.0):
    s = int(SR * at)
    e = min(len(buf), s + len(sig))
    if e > s:
        buf[s:e] += sig[: e - s] * gain
    return buf


def silence(d):
    return np.zeros(int(SR * d))


# ---------- meme SFX ----------
def vine_boom():
    d = 1.6
    x = t(d)
    f = 40 + 90 * np.exp(-x * 12)
    s = osc(f, d) * np.exp(-x * 3) + 0.4 * np.tanh(4 * osc(f * 2, d)) * np.exp(-x * 5)
    return np.tanh(2 * s) + 0.3 * noise(d) * np.exp(-x * 40)


def record_scratch():
    d = 0.7
    x = t(d)
    rate = np.sin(2 * np.pi * 3.2 * x) ** 2
    centers = list(800 + 2600 * rate[:: SR // 40])
    return band_noise(d, centers, 0.35) * np.minimum(1, x / 0.01) * np.exp(-x * 1.5)


def crickets():
    d = 4.0
    out = silence(d)
    for k in range(int(d / 0.55)):
        base = k * 0.55 + RNG.uniform(0, 0.08)
        for j in range(3):
            c = osc(4600, 0.035) * env(int(SR * 0.035), 0.003, curve=3)
            mix_at(out, c, base + j * 0.05, 0.6)
    return out


def sad_trombone():
    seq = [(note(58), 0.45), (note(57), 0.45), (note(56), 0.45), (note(55), 1.6)]
    out = []
    for i, (f, d) in enumerate(seq):
        x = t(d)
        vib = 1 + (0.025 * np.sin(2 * np.pi * 5.5 * x) * np.minimum(1, x / 0.3) if i == 3 else 0)
        s = osc(f * vib, d, "saw", 10)
        a = np.minimum(1, x / 0.04) * np.minimum(1, (d - x) / 0.08)
        out.append(s * a)
    return np.concatenate(out)


def ding():
    d = 2.0
    x = t(d)
    return sum(np.sin(2 * np.pi * 1568 * r * x) * np.exp(-x * (2 + 3 * i)) * g
               for i, (r, g) in enumerate([(1, 1), (2.76, 0.4), (5.4, 0.2)]))


def whoosh():
    d = 0.9
    x = t(d)
    s = band_noise(d, [300, 1200, 3500, 900], 0.5)
    return s * np.sin(np.pi * x / d) ** 2


def boing():
    d = 0.9
    x = t(d)
    f = 220 * (1 + 0.35 * np.sin(2 * np.pi * 9 * x) * np.exp(-x * 4)) * (1 + 0.6 * np.exp(-x * 8))
    return osc(f, d) * np.exp(-x * 4)


def slap():
    d = 0.25
    x = t(d)
    return np.tanh(3 * (band_noise(d, [2500], 0.9) * np.exp(-x * 45) + 0.5 * osc(160, d) * np.exp(-x * 40)))


def dun_dun_dun():
    out = silence(3.2)
    for i, (m, at, dd) in enumerate([(43, 0.0, 0.5), (42, 0.6, 0.5), (38, 1.2, 1.9)]):
        f = note(m)
        x = t(dd)
        hit = (osc(f, dd, "saw", 12) + osc(f * 1.5, dd, "saw", 8) * 0.5 + osc(f / 2, dd) ) * np.exp(-x * (1.5 if i == 2 else 3))
        mix_at(out, hit, at)
        mix_at(out, kick(0.5), at, 0.8)
    return out


def drum_roll_crash():
    out = silence(3.6)
    n = 0
    tt = 0.0
    while tt < 2.0:
        mix_at(out, snare(0.08), tt, 0.4 + 0.5 * tt / 2)
        tt += 0.045
        n += 1
    mix_at(out, crash(1.6), 2.0, 1.0)
    mix_at(out, kick(0.5), 2.0, 1.0)
    return out


def tick_tock():
    out = silence(4.0)
    for k in range(8):
        f = 2400 if k % 2 == 0 else 1800
        mix_at(out, osc(f, 0.03) * np.exp(-t(0.03) * 120), k * 0.5)
    return out


def heartbeat():
    out = silence(4.0)
    for k in range(4):
        for off, g in [(0, 1.0), (0.22, 0.7)]:
            x = t(0.25)
            mix_at(out, osc(55 + 25 * np.exp(-x * 30), 0.25) * np.exp(-x * 14), k * 1.0 + off, g)
    return out


def error_buzz():
    d = 0.7
    out = silence(d)
    for at in (0.0, 0.38):
        mix_at(out, osc(150, 0.3, "square", 12) * 0.6, at)
    return out


def success_chime():
    out = silence(1.8)
    for i, m in enumerate([72, 76, 79, 84]):
        mix_at(out, pluck(note(m), 1.2, 3), i * 0.11, 0.7)
    return out


def pop():
    d = 0.12
    x = t(d)
    return osc(900 * np.exp(-x * 25) + 200, d) * np.exp(-x * 45)


def suspense_sting():
    d = 3.0
    x = t(d)
    cl = sum(osc(note(m), d, "saw", 6) for m in (60, 61, 66, 67)) / 4
    return cl * (x / d) ** 2 * np.minimum(1, (d - x) / 0.05) + 0.5 * np.exp(-((x - d + 0.2) * 20) ** 2) * noise(d)


def rimshot():
    out = silence(2.0)
    mix_at(out, osc(180 * (1 + np.exp(-t(0.3) * 20)), 0.3) * np.exp(-t(0.3) * 12), 0.0)
    mix_at(out, osc(130 * (1 + np.exp(-t(0.3) * 20)), 0.3) * np.exp(-t(0.3) * 12), 0.18)
    mix_at(out, crash(1.4) * 0.8, 0.4)
    mix_at(out, hat(0.05), 0.4)
    return out


def mass_entry_hit():
    d = 3.0
    out = silence(d)
    mix_at(out, whoosh() * 0.7, 0.0)
    boom = vine_boom()
    mix_at(out, boom, 0.85)
    chord = sum(osc(note(m), 2.0, "saw", 10) for m in (38, 45, 50, 57)) / 4 * np.exp(-t(2.0) * 1.4)
    mix_at(out, chord, 0.85, 0.8)
    mix_at(out, crash(1.8), 0.85, 0.6)
    return out


def thud_fall():
    out = silence(1.6)
    x = t(0.6)
    mix_at(out, osc(1200 * np.exp(-x * 4) + 150, 0.6) * 0.4, 0.0)
    mix_at(out, kick(0.5), 0.6)
    mix_at(out, 0.5 * band_noise(0.3, [400], 0.8) * np.exp(-t(0.3) * 20), 0.6)
    return out


SFX = {
    "vine_boom": vine_boom, "record_scratch": record_scratch, "crickets_awkward": crickets,
    "sad_trombone_fail": sad_trombone, "ding_correct": ding, "whoosh_transition": whoosh,
    "boing_cartoon": boing, "slap_hit": slap, "dun_dun_dun_dramatic": dun_dun_dun,
    "drum_roll_crash_reveal": drum_roll_crash, "tick_tock_waiting": tick_tock,
    "heartbeat_tension": heartbeat, "error_buzz_wrong": error_buzz, "success_chime": success_chime,
    "pop_text": pop, "suspense_sting": suspense_sting, "rimshot_joke": rimshot,
    "mass_entry_hit": mass_entry_hit, "thud_fall": thud_fall,
}


# ---------- emotion music beds (15 s) ----------
def seq_chords(chords, beat, bars_per, pattern, d=15.0, octave_up=12, gain=0.5):
    out = silence(d)
    tt = 0.0
    i = 0
    while tt < d - 0.5:
        ch = chords[i % len(chords)]
        for step, idx in pattern:
            at = tt + step * beat
            if at >= d - 0.3:
                break
            m = ch[idx % len(ch)] + octave_up * (idx // len(ch))
            mix_at(out, pluck(note(m), beat * 3), at, gain)
        tt += bars_per * 4 * beat
        i += 1
    return out


def bed_sad():
    beat = 60 / 66
    ch = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
    out = seq_chords(ch, beat, 1, [(0, 0), (1, 1), (2, 2), (3, 1)], gain=0.45)
    for k, c in enumerate(ch * 2):
        mix_at(out, pad([note(m - 12) for m in c], 4 * beat) * 0.25, k * 4 * beat)
    return out


def bed_suspense():
    d = 15.0
    x = t(d)
    out = pad([note(38), note(45), note(51)], d) * 0.5
    out += osc(note(86), d) * 0.08 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 8 * x)))
    for k in range(15):
        mix_at(out, heartbeat()[: SR // 2] * 0.8, k * 1.0)
    return out * np.minimum(1, x / 3)


def bed_happy():
    beat = 60 / 120
    ch = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
    out = seq_chords(ch, beat, 1, [(0, 0), (0.5, 2), (1, 1), (1.5, 2), (2, 0), (2.5, 2), (3, 1), (3.5, 3)])
    for k in range(int(15 / beat)):
        if k % 2 == 0:
            mix_at(out, kick(0.3) * 0.7, k * beat)
        else:
            mix_at(out, snare(0.15) * 0.35, k * beat)
        mix_at(out, hat() * 0.25, k * beat + beat / 2)
    return out


def bed_mass_entry():
    d = 15.0
    beat = 60 / 90
    out = silence(d)
    for k in range(int(d / beat)):
        mix_at(out, kick(0.4), k * beat, 1.0)
        if k % 2 == 1:
            mix_at(out, snare(0.25) * 0.8, k * beat)
        if k % 4 == 0:
            ch = [38, 45, 50] if (k // 4) % 2 == 0 else [36, 43, 48]
            stab = sum(osc(note(m), beat * 1.5, "saw", 12) for m in ch) / 3 * np.exp(-t(beat * 1.5) * 3)
            mix_at(out, stab, k * beat, 0.7)
    mix_at(out, mass_entry_hit() * 0.6, 0.0)
    return np.tanh(1.3 * out)


def bed_awkward():
    d = 15.0
    out = crickets()
    out = np.concatenate([out] * 4)[: int(SR * d)] * 0.5
    for k, m in enumerate([67, 64, 66, 62, 64, 60]):
        mix_at(out, pluck(note(m), 1.0, 8) * 0.5, 1.0 + k * 2.2)
    return out


def bed_romantic():
    beat = 60 / 72
    ch = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]]
    out = silence(15.0)
    for k, c in enumerate(ch * 2):
        mix_at(out, pad([note(m) for m in c], 4 * beat + 0.4) * 0.3, k * 4 * beat)
    mel = [76, 79, 77, 76, 74, 72, 74, 76, 79, 81, 79, 76]
    for k, m in enumerate(mel):
        mix_at(out, pluck(note(m), 1.4, 2) * 0.5, 0.5 + k * beat * 1.5)
    return out


def bed_horror():
    d = 15.0
    x = t(d)
    out = osc(note(26) * (1 + 0.01 * np.sin(2 * np.pi * 0.2 * x)), d, "saw", 10) * 0.4
    out += sum(osc(note(m) * (1 + 0.004 * np.sin(2 * np.pi * (0.13 + i * 0.07) * x)), d) for i, m in enumerate((74, 75, 80))) * 0.07
    out += band_noise(d, [200, 600, 150, 900, 300], 0.4) * 0.15
    mix_at(out, suspense_sting() * 0.6, 11.5)
    return out * np.minimum(1, x / 2)


def bed_villain():
    d = 15.0
    beat = 60 / 80
    out = silence(d)
    line = [38, 38, 41, 38, 43, 41, 37, 38]
    for k in range(int(d / beat)):
        m = line[k % len(line)]
        tone = (osc(note(m), beat * 0.9, "saw", 10) + osc(note(m - 12), beat * 0.9, "square", 6) * 0.4) * env(int(SR * beat * 0.9), 0.01, curve=3)
        mix_at(out, tone, k * beat, 0.6)
        mix_at(out, kick(0.4) * 0.8, k * beat)
    return out


def bed_comedy_chase():
    beat = 60 / 160
    ch = [[60, 64, 67], [62, 65, 69], [64, 67, 71], [62, 65, 69]]
    out = seq_chords(ch, beat, 1, [(s * 0.5, (0, 1, 2, 1, 0, 1, 2, 3)[s]) for s in range(8)], gain=0.5)
    for k in range(int(15 / beat)):
        mix_at(out, (kick(0.2) if k % 2 == 0 else snare(0.1) * 0.5), k * beat)
    for k in range(0, 40, 3):
        mix_at(out, boing() * 0.25, k * 0.37 + 0.2)
    return out


def bed_victory():
    beat = 60 / 112
    out = silence(15.0)
    fan = [(60, 0.5), (60, 0.5), (60, 0.5), (65, 2.5), (67, 1), (69, 1), (72, 3)]
    tt = 0.2
    for m, bl in fan * 2:
        x = t(bl * beat)
        tone = sum(osc(note(m + iv), bl * beat, "saw", 10) for iv in (0, 4, 7)) / 3 * np.minimum(1, x / 0.02) * np.minimum(1, (bl * beat - x) / 0.06)
        mix_at(out, tone, tt, 0.6)
        tt += bl * beat
    for k in range(int(15 / beat)):
        mix_at(out, kick(0.3) * 0.6, k * beat)
        if k % 8 == 0:
            mix_at(out, crash(1.5) * 0.4, k * beat)
    return out


BEDS = {
    "sad_emotional_15s": bed_sad, "suspense_tension_15s": bed_suspense, "happy_bouncy_15s": bed_happy,
    "mass_hero_entry_15s": bed_mass_entry, "awkward_silence_15s": bed_awkward,
    "romantic_soft_15s": bed_romantic, "horror_scary_15s": bed_horror, "villain_march_15s": bed_villain,
    "comedy_chase_15s": bed_comedy_chase, "victory_celebration_15s": bed_victory,
}


# ---------- export ----------
def write_wav(path, sig):
    sig = sig / (np.max(np.abs(sig)) + 1e-9) * 0.89
    pcm = (sig * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def export(sig, out_mp3, lufs, reverb=False, fade=0.03):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        write_wav(tmp.name, sig)
    dur = len(sig) / SR
    chain = []
    if reverb:
        chain.append("aecho=0.8:0.5:60|120:0.25|0.15")
    chain += [f"afade=t=in:d=0.005", f"afade=t=out:st={max(0, dur - fade)}:d={fade}",
              f"loudnorm=I={lufs}:TP=-1.5:LRA=11", "aresample=44100"]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, "-af", ",".join(chain),
                    "-ac", "2", "-b:a", "192k", out_mp3], check=True)
    os.unlink(tmp.name)


def main(root):
    sfx_dir = os.path.join(root, "01_Meme_SFX")
    bed_dir = os.path.join(root, "02_Emotion_Music")
    os.makedirs(sfx_dir, exist_ok=True)
    os.makedirs(bed_dir, exist_ok=True)
    for name, fn in SFX.items():
        export(fn(), os.path.join(sfx_dir, f"{name}.mp3"), -12, reverb=name in {"ding_correct", "dun_dun_dun_dramatic", "mass_entry_hit"})
        print("sfx ", name)
    for name, fn in BEDS.items():
        sig = fn()[: int(SR * 15)]
        export(sig, os.path.join(bed_dir, f"{name}.mp3"), -16, reverb=True, fade=1.5)
        print("bed ", name)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "sound_bundle")
