"""Render a schematic minimap (same isometric projection/orientation as the game) -> map.jpg
Coordinates match main.js mmPos(): overview px = OVS[2] - (sxu - SMINX + 100)*0.2, (sy - SMINY + 300)*0.2 ; scaled by SC."""
import json, math
from PIL import Image, ImageDraw, ImageFont
w = json.load(open('../world.json'))
meta = json.load(open('tiles.json')); m = meta[0]
SMINX = m[2] - m[0]*1830 + 100; SMINY = m[3] - m[1]*1215 + 300
SC = 3.0
W0, H0 = 2988, 2024
b = 0.9948376736367679; cb, sb = math.cos(b), math.sin(b); A, B = 5.5, 2.75
def P(x, y):
    X = x*cb - y*sb; Y = x*sb + y*cb
    return -(X - Y)*A, (X + Y)*B
def mp(x, y):
    sx, sy = P(x, y); sxu = -sx
    ox = (sxu - SMINX + 100)*0.2; oy = (sy - SMINY + 300)*0.2
    return ((W0 - ox)*SC, oy*SC)
im = Image.new('RGB', (int(W0*SC), int(H0*SC)), (40, 34, 58))
d = ImageDraw.Draw(im)
def poly(pts, fill, outline=None, width=1):
    q = [mp(x, y) for x, y in pts]
    if len(q) > 2: d.polygon(q, fill=fill, outline=outline, width=width)
for g in w['greens']:
    poly(g['e'], (52, 78, 62))
    for h in g.get('h') or []: poly(h, (40, 34, 58))
cols = {'path': (88, 80, 112), 'walk': (110, 102, 134), 'asph_small': (150, 142, 170), 'asph_mid': (182, 174, 200), 'asph_major': (205, 198, 222)}
for k in ('path', 'walk', 'asph_small', 'asph_mid', 'asph_major'):
    for r in w['ground'].get(k, []):
        poly(r['e'], cols[k])
        for h in r.get('h') or []: poly(h, (40, 34, 58))
for bl in w['bl']:
    special = bl.get('sp') or bl.get('k') == 'pub'
    poly(bl['p'], (236, 170, 96) if special else (226, 214, 190), outline=(90, 72, 60), width=2)
import os, json as J
os.makedirs('mm', exist_ok=True); TS = 2048; meta = []
for f in os.listdir('mm'): os.remove('mm/' + f)
for j in range(0, im.height, TS):
    for i in range(0, im.width, TS):
        t = im.crop((i, j, min(im.width, i + TS), min(im.height, j + TS)))
        if t.getbbox() is None or len(set(t.resize((64, 64)).getdata())) <= 1: continue
        n = 'mm/%d_%d.png' % (i//TS, j//TS); t.quantize(24, method=Image.Quantize.MEDIANCUT).save(n, optimize=True)
        meta.append([n, i/SC, j/SC, t.width/SC, t.height/SC])
J.dump(meta, open('mm/tiles.json', 'w'))
print(len(meta), sum(os.path.getsize('mm/' + f) for f in os.listdir('mm')))
print(im.size)
