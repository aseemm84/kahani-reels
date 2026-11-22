#!/usr/bin/env python3
"""Fail if the narration or captions state a number that is not in the Nirayana data.

    python3 .claude/skills/nirayana-story/scripts/verify_numbers.py <slug>

Data = every JSON file in src/stories/<slug>/data/. Script = src/stories/<slug>/script.json.
A number may also be allowed explicitly with a reason, in script.json's companion file
src/stories/<slug>/derived.json: {"27": "number of nakshatras", "4": "padas per nakshatra"}.
Devanagari digits are normalised. Numbers within ±0.01 (or the same after rounding to a whole degree/minute)
count as matching.
"""
import json, re, sys
from pathlib import Path

DEV = str.maketrans("०१२३४५६७८९", "0123456789")
NUM = re.compile(r"\d+(?:\.\d+)?")

def nums_in(obj, out):
    if isinstance(obj, bool) or obj is None:
        return
    if isinstance(obj, (int, float)):
        out.add(round(float(obj), 2)); return
    if isinstance(obj, str):
        for m in NUM.findall(obj.translate(DEV)):
            out.add(round(float(m), 2))
        return
    if isinstance(obj, dict):
        for v in obj.values(): nums_in(v, out)
    elif isinstance(obj, list):
        for v in obj: nums_in(v, out)

def ok(n, pool):
    for p in pool:
        if abs(n - p) <= 0.01 or round(p) == n or int(p) == n:
            return True
        frac = p - int(p)          # degree with minutes, e.g. 53.33 -> 53°20′
        if frac and abs(n - round(frac * 60)) < 0.5:
            return True
    return False

slug = sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__)
d = Path("src/stories") / slug
pool = set()
for f in sorted((d / "data").glob("*.json")):
    nums_in(json.loads(f.read_text(encoding="utf-8")), pool)
derived = d / "derived.json"
if derived.exists():
    nums_in(list(json.loads(derived.read_text(encoding="utf-8")).keys()), pool)
script = json.loads((d / "script.json").read_text(encoding="utf-8"))
bad = []
for i, line in enumerate(script, 1):
    for field in ("narration", "caption"):
        for m in NUM.findall(str(line.get(field, "")).translate(DEV)):
            if not ok(float(m), pool):
                bad.append(f"scene {i} {field}: {m}")
if not pool:
    sys.exit("✗ no data files in " + str(d / "data"))
if bad:
    print("✗ numbers not found in the Nirayana data (fix them, or justify in derived.json):")
    print("\n".join("  - " + b for b in bad)); sys.exit(1)
print(f"✓ every number in {len(script)} scenes is backed by the data")
