"""Shared helpers for interior levels: layout in grid metres -> blockout render (game projection) + json."""
import json, math
from PIL import Image, ImageDraw
A, B, ZS = 5.5, 2.75, 6.91
class Level:
    def __init__(self, ox, oy, gw, gh):
        self.OX, self.OY, self.GW, self.GH = ox, oy, gw, gh
        self.R, self.zones, self.pois, self.spawns, self.lights, self.floor = [], {}, {}, [], [], []
    def Pg(self, X, Y, z=0):
        X += self.OX; Y += self.OY; return (-(X - Y)*A, (X + Y)*B - z*ZS)
    def box(self, x0, y0, x1, y1, h, kind, col, **kw):
        d = dict(x0=x0, y0=y0, x1=x1, y1=y1, h=h, k=kind, c=col); d.update(kw); self.R.append(d); return d
    def area(self, x0, y0, x1, y1, kind, col):      # floor-level zone (pit, trampoline, balls ...)
        self.floor.append(dict(x0=x0, y0=y0, x1=x1, y1=y1, k=kind, c=col))
    def render(self, path, floor_cols=((196, 192, 186), (178, 174, 170)), tall=4.5, carpet=None):
        cs = [self.Pg(x, y, z) for x in (0, self.GW) for y in (0, self.GH) for z in (0, tall)]
        px0 = min(c[0] for c in cs) - 24; px1 = max(c[0] for c in cs) + 24; py0 = min(c[1] for c in cs) - 24; py1 = max(c[1] for c in cs) + 24
        IW = 2048; S = IW/(px1 - px0); IH = round((py1 - py0)*S)
        self.prect, self.img = [px0, py0, px1, py1], [IW, IH]
        ip = lambda X, Y, z=0: ((self.Pg(X, Y, z)[0] - px0)*S, (self.Pg(X, Y, z)[1] - py0)*S)
        self.ip = ip
        im = Image.new('RGB', (IW, IH), (24, 20, 34)); d = ImageDraw.Draw(im)
        for gx in range(0, self.GW, 2):
            for gy in range(0, self.GH, 2):
                c = floor_cols[(gx//2 + gy//2) % 2]
                if carpet and carpet[0] <= gx < carpet[2] and carpet[1] <= gy < carpet[3]: c = (140, 70, 60)
                d.polygon([ip(gx, gy), ip(gx + 2, gy), ip(gx + 2, gy + 2), ip(gx, gy + 2)], fill=c)
        shade = lambda c, f: tuple(max(0, min(255, int(v*f))) for v in c)
        for a in self.floor:
            x0, y0, x1, y1, c = a['x0'], a['y0'], a['x1'], a['y1'], a['c']
            if a['k'] == 'pit':      # sunken basin: draw inner walls
                dep = 1.6
                d.polygon([ip(x0, y0, -dep), ip(x1, y0, -dep), ip(x1, y1, -dep), ip(x0, y1, -dep)], fill=c)
                d.polygon([ip(x0, y0, 0), ip(x1, y0, 0), ip(x1, y0, -dep), ip(x0, y0, -dep)], fill=shade(c, 0.75))
                d.polygon([ip(x0, y0, 0), ip(x0, y1, 0), ip(x0, y1, -dep), ip(x0, y0, -dep)], fill=shade(c, 0.6))
            else:
                d.polygon([ip(x0, y0), ip(x1, y0), ip(x1, y1), ip(x0, y1)], fill=c)
        for r in sorted(self.R, key=lambda r: (r['x1'] + r['y1'], r['x0'] + r['y0'])):
            x0, y0, x1, y1, h, c = r['x0'], r['y0'], r['x1'], r['y1'], r['h'], r['c']
            if r.get('round'):
                cxm, cym, rr = (x0 + x1)/2, (y0 + y1)/2, (x1 - x0)/2
                ring = lambda z, s=1: [ip(cxm + math.cos(a/24*6.283)*rr*s, cym + math.sin(a/24*6.283)*rr*s, z) for a in range(24)]
                d.polygon(ring(0), fill=shade(c, 0.6)); d.polygon(ring(h), fill=shade(c, 1.1)); continue
            d.polygon([ip(x1, y0, 0), ip(x1, y1, 0), ip(x1, y1, h), ip(x1, y0, h)], fill=shade(c, 0.72))
            d.polygon([ip(x0, y1, 0), ip(x1, y1, 0), ip(x1, y1, h), ip(x0, y1, h)], fill=shade(c, 0.86))
            d.polygon([ip(x0, y0, h), ip(x1, y0, h), ip(x1, y1, h), ip(x0, y1, h)], fill=shade(c, 1.05))
        im.save(path); return im
    def export(self, path, **extra):
        d = dict(OX=self.OX, OY=self.OY, GW=self.GW, GH=self.GH, rects=self.R, floor=self.floor, zones=self.zones, pois=self.pois,
                 spawns=self.spawns, lights=self.lights, prect=self.prect, img=self.img); d.update(extra)
        json.dump(d, open(path, 'w'), ensure_ascii=False)
