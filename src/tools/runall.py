exec(open('detect.py').read().split('if __name__')[0])
import cv2, json
res = {}
os.makedirs('/home/claude/w2/col/masks', exist_ok=True)
for m in meta:
    i, j = m[0], m[1]
    fin, (W, H) = detect(i, j)
    small = cv2.resize(fin*255, (W//4, H//4), interpolation=cv2.INTER_AREA)
    small = (small > 60).astype(np.uint8)*255
    cv2.imwrite('/home/claude/w2/rt/cm/%d_%d.png' % (i, j), small)
    res['%d_%d' % (i, j)] = int(fin.sum())
print(sorted(res.items(), key=lambda kv: -kv[1])[:8])
json.dump(res, open('counts.json', 'w'))
