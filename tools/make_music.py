#!/usr/bin/env python3
"""Generate a royalty-free tanpura-style drone for background music (no internet needed).

    python3 tools/make_music.py [--tonic 138.6] [--seconds 120] [--out public/music/tanpura.mp3]

Four strings plucked in the classic Pa – Sa' – Sa' – Sa cycle, each ringing with buzzy harmonics (jawari).
Default tonic ≈ C# (138.6 Hz). Use --tonic 130.8 for C, 146.8 for D.
"""
import argparse, os, subprocess

ap = argparse.ArgumentParser()
ap.add_argument("--tonic", type=float, default=138.6)
ap.add_argument("--seconds", type=int, default=120)
ap.add_argument("--cycle", type=float, default=4.4, help="seconds per Pa-Sa-Sa-Sa cycle")
ap.add_argument("--out", default="public/music/tanpura.mp3")
a = ap.parse_args()

S = a.tonic
strings = [(S * 1.5, 0.0), (S * 2, 1.0), (S * 2, 2.0), (S, 3.0)]  # (frequency, slot in the cycle): Pa, Sa', Sa', Sa
cyc = a.cycle
terms = []
for f, onset in strings:
    o = onset * cyc / 4
    tau = f"mod(t-{o:.3f}+{cyc*10},{cyc})"
    env = f"exp(-0.55*{tau})*(1-exp(-60*{tau}))"
    harm = "+".join(f"{w}*sin(2*PI*{f*n:.3f}*t+{n*0.7:.2f})" for n, w in
                    [(1, 1.0), (2, 0.55), (3, 0.42), (4, 0.30), (5, 0.24), (6, 0.16), (7, 0.11), (9, 0.06)])
    terms.append(f"({env})*({harm})")
expr = "0.09*(" + "+".join(terms) + ")"
os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
fade = a.seconds - 3
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"aevalsrc='{expr}|{expr}':s=44100:d={a.seconds}",
                "-af", f"lowpass=f=4200,aecho=0.8:0.7:60|130:0.25|0.18,afade=t=in:d=2,afade=t=out:st={fade}:d=3,loudnorm=I=-24:TP=-3",
                "-c:a", "libmp3lame", "-b:a", "160k", a.out], check=True)
print("wrote", a.out)
