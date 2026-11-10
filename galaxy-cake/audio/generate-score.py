"""Render the project's original 'Starlight Letter' without samples or dependencies.
Run from any directory with Python 3. Outputs the committed, playable PCM WAV.
Composition, synthesis code and generated recording: CC0-1.0.
"""
from array import array
from pathlib import Path
import math
import random
import wave

RATE, SECONDS, BEAT = 22050, 48, .75
score = array('f', [0]) * (RATE * SECONDS)
rng = random.Random(20261103)
chords = [(48, 52, 55, 59), (45, 48, 52, 55), (53, 57, 60, 64), (55, 59, 62, 65),
          (50, 53, 57, 60), (52, 55, 59, 62), (53, 57, 60, 64), (55, 60, 62, 65)]
melody = [(76, 79, 74), (72, 76, 79), (77, 76, 72), (74, 79, 77),
          (77, 81, 76), (79, 76, 74), (77, 76, 72), (74, 71, 72),
          (79, 83, 76), (76, 79, 72), (81, 79, 77), (79, 77, 74),
          (77, 76, 74), (79, 76, 71), (77, 76, 74), (76, 74, 72)]

def note(midi, start, duration, gain, pad=False):
    freq = 440 * 2 ** ((midi - 69) / 12)
    first = max(0, round(start * RATE))
    last = min(len(score), first + round(duration * RATE))
    for i in range(first, last):
        t = (i - first) / RATE
        phase = 2 * math.pi * freq * t
        if pad:
            envelope = min(1, t / .6) * min(1, (duration - t) / .8)
            value = math.sin(phase) + .16 * math.sin(phase * 2) + .025 * math.sin(phase * 3)
        else:
            envelope = min(1, t / .018) * math.exp(-t * 2.3) * min(1, (duration - t) / .2)
            value = math.sin(phase) + .24 * math.sin(phase * 2) * math.exp(-t * 2) + .08 * math.sin(phase * 3) * math.exp(-t * 3)
        score[i] += value * envelope * gain

for bar in range(16):
    start = bar * BEAT * 4
    for i, midi in enumerate(chords[bar % 8]):
        note(midi, start + i * .035, 3.8, .022, True)
    for offset, midi in zip((0, 1.5, 2.75), melody[bar]):
        note(midi, start + offset * BEAT + rng.uniform(0, .018), 2.3, .11 * rng.uniform(.88, 1))

# A small, deterministic multi-tap room. No recording or external samples.
dry = array('f', score)
for delay, gain in ((.13, .13), (.27, .1), (.43, .075), (.71, .045), (.97, .025)):
    shift = round(delay * RATE)
    for i in range(shift, len(score)):
        score[i] += dry[i - shift] * gain
peak = max(abs(v) for v in score) or 1
pcm = array('h')
for i, value in enumerate(score):
    fade = min(1, i / (RATE * .15), (len(score) - 1 - i) / (RATE * .35))
    pcm.append(round(max(-1, min(1, value / peak * .78 * fade)) * 32767))
target = Path(__file__).resolve().parent / 'masters' / 'starlight-letter.wav'
target.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(target), 'wb') as output:
    output.setnchannels(1)
    output.setsampwidth(2)
    output.setframerate(RATE)
    output.writeframes(pcm.tobytes())
print(f'{target}: {SECONDS}s, {RATE}Hz PCM, {target.stat().st_size} bytes')
