"""Detect painted obstacles (cars, barricades, fences, props) in stop-motion tiles -> per-tile collision masks.
Mask is stored in UNMIRRORED tile pixel space at 1/4 res; runtime maps world -> P -> (u,v)."""
import json, math, sys, os
import numpy as np, cv2
os.chdir('/home/claude/w2/rt')
w = json.load(open('../world.json')); meta = json.load(open('tiles.json'))
b = 0.9948376736367679; cb, sb = math.cos(b), math.sin(b); A, B, ZS = 5.5, 2.75, 6.91
FHT = {'res': 3.3, 'school': 4.0, 'kg': 3.2, 'pub': 3.6, 'house': 2.9, 'garage': 2.7, 'shed': 2.4} 
def P(x, y, z=0):
    X = x*cb - y*sb; Y = x*sb + y*cb
    return -(X - Y)*A, (X + Y)*B - z*ZS
S = 1900/2048
def bheight(bl):
    FH = FHT.get(bl['k'], 3.3)
    return FH if bl['k'] in ('garage', 'shed') else bl['lv']*FH + (0.7 if bl['k'] == 'res' else 0.3)
def detect(i, j, dbg=False):
    m = [t for t in meta if t[0] == i and t[1] == j][0]; x0, y0 = m[2], m[3]
    im = cv2.imread('t/%d_%d.webp' % (i, j), cv2.IMREAD_UNCHANGED)
    alpha = im[:, :, 3] if im.shape[2] == 4 else np.full(im.shape[:2], 255, np.uint8)
    bgr = im[:, :, :3]; H, W = alpha.shape
    tp = lambda px, py: ((-px - x0)*S, (py - y0)*S)
    g = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    gx = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3); gy = cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.hypot(gx, gy)
    edge = (mag > 70).astype(np.uint8)
    dens = cv2.blur(edge.astype(np.float32), (9, 9))
    dark = (hsv[:, :, 2] < 150) & (hsv[:, :, 1] > 40)   # coloured/dark object surfaces (not snow, not grey road)
    sat = hsv[:, :, 1].astype(np.float32)
    satv = cv2.blur(sat*sat, (11, 11)) - cv2.blur(sat, (11, 11))**2   # colour variety (objects), roads/snow are flat
    cand = ((dens > 0.30) & (satv > 120)).astype(np.uint8)
    cand[alpha < 128] = 0
    # exclude buildings: footprint extruded to roof
    ex = np.zeros((H, W), np.uint8)
    for bl in w['bl']:
        h = bheight(bl)
        base = [tp(*P(x, y, 0)) for x, y in bl['p']]; top = [tp(*P(x, y, h)) for x, y in bl['p']]
        pts = np.array(base + top, np.float32)
        if pts[:, 0].max() < -50 or pts[:, 0].min() > W + 50 or pts[:, 1].max() < -50 or pts[:, 1].min() > H + 50: continue
        hull = cv2.convexHull(pts).astype(np.int32)
        cv2.fillPoly(ex, [hull], 1)
    for t in w['trees'] + w['lamps']:
        u, v = tp(*P(t[0], t[1]))
        if -40 < u < W + 40 and -80 < v < H + 40:
            hw = 16 if len(t) > 3 else 8; cv2.rectangle(ex, (int(u - hw), int(v - 70)), (int(u + hw), int(v + 6)), 1, -1)
    exr = np.zeros((H, W), np.uint8)
    for kk in ('asph_major', 'asph_mid', 'asph_small', 'walk'):
        for r in w['ground'].get(kk, []):
            for ring in [r['e']] + (r.get('h') or []):
                pts = np.array([tp(*P(x, y)) for x, y in ring], np.float32)
                if pts[:, 0].max() < -50 or pts[:, 0].min() > W + 50 or pts[:, 1].max() < -50 or pts[:, 1].min() > H + 50: continue
                cv2.polylines(exr, [pts.astype(np.int32)], True, 1, 12)
    ex = cv2.dilate(ex, np.ones((9, 9), np.uint8))
    cand[ex > 0] = 0
    cand[exr > 0] = 0
    exall = (ex > 0) | (exr > 0)
    k = lambda n: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (n, n))
    cand = cv2.morphologyEx(cand, cv2.MORPH_OPEN, k(5))        # drop thin branches before joining
    cand = cv2.morphologyEx(cand, cv2.MORPH_CLOSE, k(11))
    ff = cand.copy(); h2, w2 = ff.shape; msk = np.zeros((h2 + 2, w2 + 2), np.uint8); cv2.floodFill(ff, msk, (0, 0), 1)
    cand = cand | (1 - ff)                                  # fill holes inside objects
    cand[exall] = 0
    cand = cv2.morphologyEx(cand, cv2.MORPH_OPEN, k(9))       # drop thin branches, curbs, footprints
    n, lab, st, _ = cv2.connectedComponentsWithStats(cand)
    out = np.zeros_like(cand)
    for c in range(1, n):
        x, y, ww, hh, area = st[c]
        if area < 220: continue
        cnt = np.column_stack(np.where(lab[y:y + hh, x:x + ww] == c))[:, ::-1].astype(np.float32)
        (_, _), (rw, rh), _ = cv2.minAreaRect(cnt)
        sh, lo = min(rw, rh), max(rw, rh)
        if (sh < 26 and lo > 2.2*sh) or (sh < 45 and lo > 4.5*sh): continue           # kerb / road-edge strip
        if area < 0.35*rw*rh and sh < 22: continue       # sparse stringy thing
        sel = lab[y:y + hh, x:x + ww] == c
        vv = hsv[y:y + hh, x:x + ww, 2][sel]; mm = mag[y:y + hh, x:x + ww][sel]
        darkf = float((vv < 85).mean()); strong = float((mm > 160).mean())
        if darkf < 0.07 or strong < 0.06: continue      # trampled snow, shadows, light pools: no dark solid parts
        out[lab == c] = 1
    # keep only lower 65% of each blob (ground contact) so tall props don't block the cells behind them
    n, lab, st, _ = cv2.connectedComponentsWithStats(out)
    fin = np.zeros_like(out)
    for c in range(1, n):
        x, y, ww, hh, area = st[c]
        cut = y + int(hh*(0.55 if area > 8000 else 0.35))
        sl = (lab[cut:y + hh, x:x + ww] == c)
        fin[cut:y + hh, x:x + ww][sl] = 1
    if dbg:
        v = bgr.copy(); v[fin > 0] = (v[fin > 0]*0.4 + np.array([255, 0, 255])*0.6).astype(np.uint8)
        v[ex > 0] = (v[ex > 0]*0.8 + np.array([0, 0, 120])*0.2).astype(np.uint8)
        cv2.imwrite('/tmp/det.jpg', cv2.resize(v, (W//2, H//2)))
    return fin, (W, H)
if __name__ == '__main__':
    detect(int(sys.argv[1]), int(sys.argv[2]), True)
