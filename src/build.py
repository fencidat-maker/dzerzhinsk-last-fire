import json
w=json.load(open('../world.json'))
world={k:w[k] for k in ('bl','trees','lamps','cars','pois','bounds')}
wj=json.dumps(world,separators=(',',':'),ensure_ascii=False)
tiles=open('tiles.json').read()
# overview params: SMINX,SMINY from draft  (x0 = SMINX+i*1830-100 => SMINX = x0(0,0)+100 ; y0 = SMINY-300)
meta=json.loads(tiles); t00=[m for m in meta if m[0]==0 and m[1]==0]
import math
# find SMINX/SMINY via any tile
m=meta[0]; SMINX=m[2]-m[0]*1830+100; SMINY=m[3]-m[1]*1215+300
ovs=json.dumps([SMINX,SMINY,2988,0.2])
js=''
for f in ('rt_core.js','audio.js','chars.js','game_rt.js','puppet.js','quests.js','slides.js','main.js','fx.js'):
    s=open(f).read()
    if f=='rt_core.js': s=s.replace('__WORLD__',wj)
    if f=='main.js': s=s.replace('__TILES__',tiles).replace('__OVS__',ovs).replace('__MMT__',open('mm/tiles.json').read())
    if f=='fx.js': s=s.replace('__FIRES__',open('fires.json').read())
    if f=='puppet.js': s=s.replace('__ATLAS__',open('sp/atlas.json').read())
    js+=s+'\n'
html=open('tpl.html').read().replace('__JS__',js)
open('index.html','w').write(html); print(len(html)/1e3,'KB',SMINX,SMINY)
