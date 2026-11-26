import json, sys
from PIL import Image, ImageDraw
A, B, ZS = 5.5, 2.75, 6.91
def ov(jsonf, imgf, out):
    J = json.load(open(jsonf)); px0, py0, px1, py1 = J['prect']; IW, IH = J['img']; S = IW/(px1 - px0)
    ip = lambda X, Y, z=0: ((-(X + J['OX'] - Y - J['OY'])*A - px0)*S, ((X + J['OX'] + Y + J['OY'])*B - z*ZS - py0)*S)
    im = Image.open(imgf).convert('RGB').resize((IW, IH)); d = ImageDraw.Draw(im)
    for r in J['rects']: d.polygon([ip(r['x0'], r['y0']), ip(r['x1'], r['y0']), ip(r['x1'], r['y1']), ip(r['x0'], r['y1'])], outline=(0, 255, 0), width=3)
    for r in J['floor']: d.polygon([ip(r['x0'], r['y0']), ip(r['x1'], r['y0']), ip(r['x1'], r['y1']), ip(r['x0'], r['y1'])], outline=(255, 255, 0), width=3)
    d.polygon([ip(0, 0), ip(J['GW'], 0), ip(J['GW'], J['GH']), ip(0, J['GH'])], outline=(255, 0, 255), width=3)
    im.resize((1000, int(1000*IH/IW))).save(out)
ov(sys.argv[1], sys.argv[2], sys.argv[3])
