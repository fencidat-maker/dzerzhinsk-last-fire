"""Interior level 'ТЦ Дзержинец': layout in grid metres (X,Y axis-aligned with the iso grid) -> mall.json + blockout.png"""
import json, math
from PIL import Image, ImageDraw
A, B, ZS = 5.5, 2.75, 6.91
OX = OY = 3000.0              # grid offset: puts the interior far away from the city
GW, GH = 84, 52
def Pg(X, Y, z=0):            # grid -> P (same as game P after rotation)
    X += OX; Y += OY
    return (-(X - Y)*A, (X + Y)*B - z*ZS)
R = []                        # rects: x0,y0,x1,y1,h,kind,col
def box(x0, y0, x1, y1, h, kind, col): R.append(dict(x0=x0, y0=y0, x1=x1, y1=y1, h=h, k=kind, c=col))
T = 0.4
WALL_BACK, WALL_LOW, PART = 4.2, 1.0, 1.3
# outer walls (back = low X / low Y sides are far from camera; front = high X / high Y are near camera)
box(0, 0, GW, T, WALL_BACK, 'wall', (150, 140, 160))          # back-right (Y=0)
box(0, 0, T, GH, WALL_BACK, 'wall', (150, 140, 160))          # back-left (X=0)
box(GW - T, 0, GW, GH, WALL_LOW, 'wall', (150, 140, 160))     # front (X=GW)
box(0, GH - T, 36, GH, WALL_LOW, 'wall', (150, 140, 160))     # front (Y=GH) left of entrance
box(48, GH - T, GW, GH, WALL_LOW, 'wall', (150, 140, 160))    # right of entrance
# shops along back wall Y 0..12: partitions at X=20,44,64 ; shop fronts at Y=12 with 4 m doors
for x in (20, 44, 64): box(x - T/2, 0, x + T/2, 12, PART, 'wall', (170, 160, 175))
for (a, b, door) in ((0, 20, 10), (20, 44, 32), (44, 64, 54), (64, 84, 74)):
    box(a, 12 - T/2, door - 2, 12 + T/2, PART, 'wall', (170, 160, 175)); box(door + 2, 12 - T/2, b, 12 + T/2, PART, 'wall', (170, 160, 175))
# left wing: service corridor / storage X 0..14, Y 12..30
box(14 - T/2, 12, 14 + T/2, 19, PART, 'wall', (170, 160, 175)); box(14 - T/2, 23, 14 + T/2, 30, PART, 'wall', (170, 160, 175))
box(0, 30 - T/2, 14, 30 + T/2, PART, 'wall', (170, 160, 175))
# right wing: clothing X 70..84, Y 12..40
box(70 - T/2, 12, 70 + T/2, 22, PART, 'wall', (170, 160, 175)); box(70 - T/2, 26, 70 + T/2, 40, PART, 'wall', (170, 160, 175))
box(70, 40 - T/2, 84, 40 + T/2, PART, 'wall', (170, 160, 175))
# hardware shop front-right X 60..84, Y 40..52 opens to the hall
box(60 - T/2, 44, 60 + T/2, 52, PART, 'wall', (170, 160, 175))
# atrium: fountain + dead escalator
box(40, 22, 46, 28, 0.9, 'fountain', (120, 150, 170))
box(30, 15, 33, 25, 2.2, 'escalator', (110, 110, 120))
# pharmacy (X0..20): counters + shelves
box(2, 2, 18, 3.4, 1.8, 'shelf', (200, 210, 200)); box(6, 7, 14, 8.2, 1.1, 'counter', (220, 220, 225))
# groceries (20..44): shelf rows
for y in (3, 6.5): box(22, y, 42, y + 1.2, 1.6, 'shelf', (190, 120, 90))
box(24, 9.6, 30, 10.6, 1.0, 'counter', (160, 160, 170)); box(34, 9.6, 40, 10.6, 1.0, 'counter', (160, 160, 170))
# electronics (44..64)
box(46, 2, 62, 3.2, 1.7, 'shelf', (90, 110, 150)); box(48, 6, 54, 8, 1.0, 'table', (80, 90, 120)); box(56, 6, 62, 8, 1.0, 'table', (80, 90, 120))
# kids (64..84)
box(66, 2, 82, 3.2, 1.6, 'shelf', (220, 140, 160)); box(68, 6, 72, 9, 0.8, 'table', (240, 200, 120)); box(76, 6, 81, 8, 0.9, 'table', (120, 190, 200))
# storage: crates
for (x, y) in ((2, 14), (5, 14), (2, 18), (8, 25), (2, 25)): box(x, y, x + 2.4, y + 2.4, 1.4, 'crate', (150, 120, 80))
# clothing racks
for y in (15, 21, 29, 34): box(73, y, 81, y + 0.8, 1.5, 'rack', (160, 100, 140))
# food court tables (X 2..24, Y 34..50)
for x in (4, 10, 16):
    for y in (36, 42): box(x, y, x + 2.5, y + 2.5, 0.8, 'table', (200, 170, 110))
box(2, 47, 22, 49, 1.1, 'counter', (180, 90, 70))
# hardware
box(62, 49, 82, 50.6, 1.8, 'shelf', (120, 140, 100)); box(66, 43, 72, 45, 1.0, 'table', (110, 110, 110))
# barricade of carts/benches in hall
box(50, 34, 56, 35.4, 1.1, 'barricade', (90, 90, 100)); box(18, 26, 24, 27.4, 1.1, 'barricade', (90, 90, 100))
ZONES = {'Аптека': (10, 6), 'Продукты': (32, 6), 'Электроника': (54, 6), 'Детский мир': (74, 6), 'Склад': (7, 21), 'Одежда': (77, 26),
         'Фуд-корт': (13, 40), 'Хозтовары': (72, 46), 'Атриум': (42, 31)}
POIS = {'m_enter': (42, 49), 'm_exit': (42, 50.5), 'm_apteka': (9, 9.5), 'm_electro': (51, 9.5), 'm_kids': (70, 10.5), 'm_food': (13, 45)}
SPAWNS = [(10, 6, 'walker'), (32, 8, 'brute'), (26, 4.8, 'walker'), (55, 4.5, 'runner'), (77, 10, 'walker'), (7, 21, 'chemist'), (77, 31, 'walker'),
          (12, 39, 'walker'), (18, 44, 'runner'), (66, 47, 'walker'), (60, 28, 'walker'), (24, 30, 'walker')]
LIGHTS = [(42, 25, 'cold'), (10, 10, 'red'), (54, 10, 'red'), (74, 10, 'cold'), (13, 44, 'warm'), (42, 46, 'cold'), (77, 30, 'red')]
# ---- P rect of the image
cs = [Pg(x, y, z) for x in (0, GW) for y in (0, GH) for z in (0, WALL_BACK)]
px0 = min(c[0] for c in cs) - 24; px1 = max(c[0] for c in cs) + 24; py0 = min(c[1] for c in cs) - 24; py1 = max(c[1] for c in cs) + 24
IW = 2048; S = IW/(px1 - px0); IH = round((py1 - py0)*S)
print('P rect', px0, py0, px1, py1, 'img', IW, IH, 'ratio', IW/IH)
def ip(X, Y, z=0): p = Pg(X, Y, z); return ((p[0] - px0)*S, (p[1] - py0)*S)
im = Image.new('RGB', (IW, IH), (24, 20, 34)); d = ImageDraw.Draw(im)
# floor: tiles checker
for gx in range(0, GW, 2):
    for gy in range(0, GH, 2):
        c = (196, 192, 186) if (gx//2 + gy//2) % 2 else (178, 174, 170)
        if 36 <= gx < 48 and gy >= 40: c = (140, 70, 60) if (gx//2 + gy//2) % 2 else (125, 62, 55)   # entrance mat / red carpet
        d.polygon([ip(gx, gy), ip(gx + 2, gy), ip(gx + 2, gy + 2), ip(gx, gy + 2)], fill=c)
def shade(c, f): return tuple(max(0, min(255, int(v*f))) for v in c)
for r in sorted(R, key=lambda r: (r['x1'] + r['y1'], r['x0'] + r['y0'])):
    x0, y0, x1, y1, h, c = r['x0'], r['y0'], r['x1'], r['y1'], r['h'], r['c']
    if r['k'] == 'fountain':
        cxm, cym, rr = (x0 + x1)/2, (y0 + y1)/2, (x1 - x0)/2
        ring = lambda z, s=1: [ip(cxm + math.cos(a/24*6.283)*rr*s, cym + math.sin(a/24*6.283)*rr*s, z) for a in range(24)]
        d.polygon(ring(0), fill=shade(c, 0.6)); d.polygon(ring(h), fill=shade(c, 1.1)); d.polygon(ring(h, 0.75), fill=(60, 90, 110)); continue
    # visible faces: +X face (x=x1) and +Y face (y=y1), then top
    d.polygon([ip(x1, y0, 0), ip(x1, y1, 0), ip(x1, y1, h), ip(x1, y0, h)], fill=shade(c, 0.72))
    d.polygon([ip(x0, y1, 0), ip(x1, y1, 0), ip(x1, y1, h), ip(x0, y1, h)], fill=shade(c, 0.86))
    d.polygon([ip(x0, y0, h), ip(x1, y0, h), ip(x1, y1, h), ip(x0, y1, h)], fill=shade(c, 1.05))
im.save('/home/claude/w2/mall/blockout.png')
json.dump(dict(OX=OX, OY=OY, GW=GW, GH=GH, rects=R, zones=ZONES, pois=POIS, spawns=SPAWNS, lights=LIGHTS,
               prect=[px0, py0, px1, py1], img=[IW, IH]), open('/home/claude/w2/mall/mall.json', 'w'), ensure_ascii=False)
