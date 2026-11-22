#!/usr/bin/env python3
"""Royalty-free Indian background music, synthesised on your machine (numpy + ffmpeg, no internet).

    python3 tools/make_music.py --style bansuri               → public/music/bansuri.mp3
    python3 tools/make_music.py --all                         → every style
    python3 tools/make_music.py --list
Options: --seconds 120  --tonic 138.6 (Sa ≈ C#)  --seed 7 (variation)  --out path.mp3

Styles
  tanpura     devotional drone: Pa–Sa'–Sa'–Sa, buzzy jawari                       (calm, devotional)
  bansuri     bamboo-flute melody in rāga Bhūpālī over tanpura                    (peaceful, Krishna, dawn)
  santoor     hammered-dulcimer arpeggios, rāga Yaman colours                      (gentle, storytelling)
  temple      temple bells, ghanta, conch swells over drone                        (aarti, temples, deities)
  tabla       tabla groove (tīntāl-style) + drone + soft pad                       (lively storytelling)
  ambient     warm evolving pad chords                                             (narration, explainers)
  suspense    low pulse, rumble, tension rises                                     (battles, demons, mystery)
  festive     dhol + shehnai-like lead                                             (festivals, celebrations, weddings)
  lullaby     soft music-box in rāga Bhūpālī                                       (children's stories, bedtime)
"""
import argparse, os, subprocess, sys, tempfile, wave
import numpy as np

SR = 44100
STYLES = ["tanpura", "bansuri", "santoor", "temple", "tabla", "ambient", "suspense", "festive", "lullaby"]
BHUPALI = [0, 2, 4, 7, 9]                # Sa Re Ga Pa Dha (semitones)
YAMAN = [0, 2, 4, 6, 7, 9, 11]           # Sa Re Ga Ma# Pa Dha Ni

def t_axis(n): return np.arange(n) / SR
def semis(tonic, s): return tonic * 2 ** (s / 12)

def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.ones(n) * s
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    A = min(A, n); e[:A] = np.linspace(0, 1, A)
    D2 = min(D, max(0, n - A)); e[A:A + D2] = np.linspace(1, s, D2)
    if R and n > R: e[-R:] *= np.linspace(1, 0, R)
    return e

def place(buf, sig, start):
    i = int(start * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i]

# ---------- instruments ----------
def tanpura(sec, tonic, rng):
    buf = np.zeros(int(sec * SR)); cyc = 4.4
    strings = [(tonic * 1.5, 0), (tonic * 2, 1), (tonic * 2, 2), (tonic, 3)]
    L = int(cyc * 1.6 * SR); tt = t_axis(L)
    for k in range(int(sec / cyc) + 1):
        for f, slot in strings:
            sig = sum(w * np.sin(2 * np.pi * f * h * tt + h) for h, w in [(1, 1), (2, .55), (3, .42), (4, .3), (5, .24), (6, .16), (7, .11), (9, .06)])
            sig *= np.exp(-0.55 * tt) * (1 - np.exp(-60 * tt))
            place(buf, sig * 0.08, k * cyc + slot * cyc / 4)
    return buf

def karplus(f, dur, bright=0.5, rng=None):
    n = int(dur * SR); p = max(2, int(SR / f))
    rng = rng or np.random.default_rng(0)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * (0.994 + 0.005 * bright)
    return out

def pluck_fast(f, dur, decay=2.5, bright=1.0):
    """Cheap plucked string (additive), fast enough for long pieces."""
    n = int(dur * SR); tt = t_axis(n)
    sig = sum((1 / h) ** (1.2 - 0.4 * bright) * np.sin(2 * np.pi * f * h * tt * (1 + 0.0007 * h)) * np.exp(-decay * h ** 0.6 * tt) for h in range(1, 9))
    return sig * (1 - np.exp(-400 * tt))

def flute(f, dur, rng, vib=5.2):
    n = int(dur * SR); tt = t_axis(n)
    vibrato = 1 + 0.006 * np.sin(2 * np.pi * vib * tt) * np.clip(tt * 2, 0, 1)
    phase = 2 * np.pi * np.cumsum(f * vibrato) / SR
    tone = np.sin(phase) + 0.18 * np.sin(2 * phase) + 0.06 * np.sin(3 * phase)
    breath = rng.normal(0, 1, n); breath = np.convolve(breath, np.ones(40) / 40, "same") * 0.08
    return (tone + breath) * env_adsr(n, 0.12, 0.2, 0.85, min(0.35, dur / 3))

def bell(f, dur, strike=1.0):
    n = int(dur * SR); tt = t_axis(n)
    partials = [(0.56, 1, .4), (0.92, .7, .6), (1.19, .9, .8), (1.71, .6, 1.2), (2.0, .5, 1.6), (2.74, .35, 2.2), (3.0, .3, 2.6), (3.76, .2, 3.4)]
    return strike * sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-d * tt) for r, a, d in partials) * (1 - np.exp(-800 * tt))

def drum(f0, f1, dur, decay, noise=0.0, rng=None):
    n = int(dur * SR); tt = t_axis(n)
    f = f1 + (f0 - f1) * np.exp(-30 * tt)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-decay * tt)
    if noise and rng is not None: s += noise * rng.normal(0, 1, n) * np.exp(-decay * 3 * tt)
    return s

def pad(freqs, dur, rng):
    n = int(dur * SR); tt = t_axis(n); s = np.zeros(n)
    for f in freqs:
        for det in (-0.004, 0, 0.004):
            ph = rng.uniform(0, 6.28)
            s += np.sin(2 * np.pi * f * (1 + det) * tt + ph) + 0.3 * np.sin(4 * np.pi * f * (1 + det) * tt + ph)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.08 * tt + rng.uniform(0, 6))
    return s * lfo / (len(freqs) * 3) * env_adsr(n, dur * 0.3, 0.1, 1, dur * 0.3)

# ---------- styles ----------
def melody_line(scale, rng, steps, start=0, span=(0, 2)):
    deg = start; out = []
    for _ in range(steps):
        deg = int(np.clip(deg + rng.choice([-2, -1, -1, 0, 1, 1, 2]), span[0] * len(scale), span[1] * len(scale) - 1))
        out.append(scale[deg % len(scale)] + 12 * (deg // len(scale)))
    return out

def style_bansuri(sec, tonic, rng):
    buf = tanpura(sec, tonic / 2, rng) * 0.7
    t = 2.0
    while t < sec - 4:
        phrase = melody_line(BHUPALI, rng, int(rng.integers(4, 8)), start=int(rng.integers(3, 7)))
        for s in phrase:
            d = float(rng.choice([0.45, 0.6, 0.9, 1.3]))
            place(buf, flute(semis(tonic * 2, s), d + 0.15, rng) * 0.22, t); t += d
        t += float(rng.uniform(1.5, 3.5))
    return buf

def style_santoor(sec, tonic, rng):
    buf = tanpura(sec, tonic / 2, rng) * 0.45
    t, beat = 1.0, 0.18
    while t < sec - 3:
        root = int(rng.choice([0, 2, 4]))
        notes = [YAMAN[(root + k) % 7] + 12 * ((root + k) // 7) for k in (0, 2, 4, 2, 0, 2, 4, 6)]
        for i, s in enumerate(notes * 2):
            place(buf, pluck_fast(semis(tonic * 2, s), 1.6, decay=3.2) * (0.16 if i % 4 else 0.22), t + i * beat)
        t += beat * 16 + float(rng.uniform(0.3, 1.2))
    return buf

def style_temple(sec, tonic, rng):
    buf = tanpura(sec, tonic / 2, rng) * 0.6
    for t in np.arange(1.0, sec - 6, 2.2):
        place(buf, bell(semis(tonic * 4, float(rng.choice([0, 7, 12]))), 5, 0.12 + 0.05 * rng.random()), t + rng.uniform(0, 0.2))
    for t in np.arange(0.5, sec - 2, 0.32):                     # ghanta (small fast bell) in bursts
        if (t // 8) % 3 == 1: place(buf, bell(semis(tonic * 8, 4), 1.2, 0.04), t)
    for t in np.arange(6, sec - 8, 20):                         # conch-like swell
        n = int(5 * SR); tt = t_axis(n)
        place(buf, (np.sin(2 * np.pi * tonic * tt) + 0.5 * np.sin(4 * np.pi * tonic * tt)) * env_adsr(n, 1.8, 0.5, 0.8, 1.8) * 0.12, t)
    return buf

def style_tabla(sec, tonic, rng):
    buf = tanpura(sec, tonic / 2, rng) * 0.4 + pad([tonic, tonic * 1.5, tonic * 2], sec, rng) * 0.12
    bpm = 92; b = 60 / bpm / 2                                   # eighth-note grid
    theka = ["dha", "dhin", "dhin", "dha", "dha", "dhin", "dhin", "dha", "dha", "tin", "tin", "ta", "ta", "dhin", "dhin", "dha"]
    def stroke(name):
        L = 0.45                                                   # all strokes share one length so they can be mixed
        bayan = drum(130, 70, L, 7) * 0.5                          # low drum, pitch bend
        dayan = drum(semis(tonic * 4, 0) * 1.02, semis(tonic * 4, 0), L, 14, 0.15, rng) * 0.35
        na = drum(semis(tonic * 4, 0), semis(tonic * 4, 0), L, 40, 0.3, rng) * 0.3
        return {"dha": bayan + dayan, "dhin": bayan * 0.8 + dayan * 0.9, "tin": dayan * 0.8, "ta": na}[name]
    t, i = 2.0, 0
    while t < sec - 2:
        place(buf, stroke(theka[i % 16]) * (1.15 if i % 16 == 0 else 1), t + rng.normal(0, 0.004)); t += b; i += 1
    return buf

def style_ambient(sec, tonic, rng):
    buf = np.zeros(int(sec * SR)); chords = [[0, 7, 16], [5, 9, 12], [9, 16, 19], [7, 11, 14]]
    t, k = 0.0, 0
    while t < sec:
        c = chords[k % 4]; place(buf, pad([semis(tonic, s) for s in c], 9.0, rng) * 0.5, t); t += 7.0; k += 1
    for t in np.arange(3, sec - 4, 5.5):
        place(buf, pluck_fast(semis(tonic * 4, float(rng.choice(BHUPALI))), 3, 1.5) * 0.06, t)
    return buf

def style_suspense(sec, tonic, rng):
    n = int(sec * SR); tt = t_axis(n); low = tonic / 2
    buf = 0.25 * np.sin(2 * np.pi * low * tt) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.12 * tt))
    rum = np.convolve(rng.normal(0, 1, n), np.ones(400) / 400, "same") * 0.6; buf += rum
    for t in np.arange(1, sec - 1, 0.75):
        place(buf, drum(80, 45, 0.6, 6) * (0.35 + 0.25 * (t % 6 < 0.8)), t)
    rise = np.sin(2 * np.pi * np.cumsum(semis(tonic, 1) * (1 + 0.3 * (tt % 12) / 12)) / SR) * ((tt % 12) / 12) ** 2 * 0.08
    return buf + rise

def style_festive(sec, tonic, rng):
    buf = tanpura(sec, tonic / 2, rng) * 0.25
    b = 60 / 120 / 2; pattern = [1, 0, 2, 2, 1, 0, 2, 0, 1, 2, 2, 0, 1, 0, 2, 2]
    t, i = 0.5, 0
    while t < sec - 1:
        p = pattern[i % 16]
        if p == 1: place(buf, drum(110, 55, 0.5, 8) * 0.55, t)
        if p == 2: place(buf, drum(380, 300, 0.12, 30, 0.4, rng) * 0.25, t)
        t += b; i += 1
    t = 2.0
    while t < sec - 4:
        for s in melody_line(BHUPALI, rng, 8, start=5):
            d = float(rng.choice([0.25, 0.25, 0.5, 0.75]))
            n = int((d + 0.05) * SR); tt = t_axis(n); f = semis(tonic * 2, s)
            ph = 2 * np.pi * np.cumsum(f * (1 + 0.01 * np.sin(2 * np.pi * 6 * tt))) / SR
            reed = np.tanh(2.5 * (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)))
            place(buf, reed * env_adsr(n, 0.03, 0.05, 0.8, 0.05) * 0.08, t); t += d
        t += 2.0
    return buf

def style_lullaby(sec, tonic, rng):
    buf = pad([tonic, tonic * 1.5], sec, rng) * 0.15
    t = 1.0
    while t < sec - 3:
        for s in melody_line(BHUPALI, rng, 8, start=5):
            place(buf, bell(semis(tonic * 4, s) / 0.56, 2.0, 0.05), t); t += 0.55
        t += 1.2
    return buf

GEN = {"tanpura": tanpura, "bansuri": style_bansuri, "santoor": style_santoor, "temple": style_temple, "tabla": style_tabla,
       "ambient": style_ambient, "suspense": style_suspense, "festive": style_festive, "lullaby": style_lullaby}

def render(style, sec, tonic, seed, out):
    rng = np.random.default_rng(seed)
    x = GEN[style](sec, tonic, rng)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    st = np.stack([x, np.roll(x, int(0.012 * SR)) * 0.96], 1)          # gentle stereo width
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        with wave.open(tmp.name, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((st * 32767).astype(np.int16).tobytes())
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    fx = "lowpass=f=6000,aecho=0.8:0.6:70|140:0.22|0.15" if style not in ("suspense",) else "lowpass=f=3500,aecho=0.8:0.7:120|260:0.3|0.2"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp.name, "-af",
                    f"{fx},afade=t=in:d=2,afade=t=out:st={sec - 3}:d=3,loudnorm=I=-22:TP=-2",
                    "-c:a", "libmp3lame", "-b:a", "192k", out], check=True)
    os.unlink(tmp.name)
    print(f"wrote {out}  ({style}, {sec}s)")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--style", choices=STYLES, default="tanpura")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--seconds", type=int, default=120)
    ap.add_argument("--tonic", type=float, default=138.6)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out")
    a = ap.parse_args()
    if a.list:
        print("\n".join(l for l in __doc__.splitlines() if l.startswith("  ") and l.split()[0] in STYLES)); sys.exit()
    for s in (STYLES if a.all else [a.style]):
        render(s, a.seconds, a.tonic, a.seed, a.out if (a.out and not a.all) else f"public/music/{s}.mp3")
