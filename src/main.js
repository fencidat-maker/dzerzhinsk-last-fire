// ====================================================================== renderer, UI, loop
const cv = $('game'), cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, VWu = 430, K = 1, VHu = 800;
const ZOOM = 1.7, CHS = 0.6, SPD_S = 0.8;   // camera zoom; character scale vs. the painted city; movement scale
const CU = 1.75*CHS;                   // sprite unit in P-space
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2.2);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W*DPR); cv.height = Math.round(H*DPR);
  applyZoom();
}
let zoomApplied = 0;
function applyZoom(){
  const z = ZOOM/(typeof camZoomCur !== 'undefined' ? camZoomCur : 1); zoomApplied = z;
  VWu = (W < H ? 360 : Math.max(470, 360*W/H*0.62))/z; K = cv.width/VWu; VHu = cv.height/K;
}
addEventListener('resize', resize); resize();

// ---------------------------------------------------------------- tiles
const TW = 2048, TH = 1365;          // tile size in P units
const TILEMETA = __TILES__;           // [i, j, x0, y0] (un-mirrored draft coordinates)
const tiles = TILEMETA.map(m => ({i: m[0], j: m[1], x0: -(m[2] + TW), y0: m[3], img: null, state: 0, used: 0}));
let tileTick = 0, loadedCount = 0;
function tileTouch(t){
  t.used = ++tileTick;
  if (t.state === 0){
    t.state = 1; const im = new Image(); im.decoding = 'async';
    im.onload = () => { t.img = im; t.state = 2; loadedCount++; trimTiles(); };
    im.onerror = () => { t.state = 0; };
    im.src = 't/' + t.i + '_' + t.j + '.webp';
  }
}
function trimTiles(){
  const ld = tiles.filter(t => t.state === 2);
  if (ld.length > 9){ ld.sort((a, b) => a.used - b.used); for (let k = 0; k < ld.length - 9; k++){ ld[k].img = null; ld[k].state = 0; loadedCount--; } }
}
function tilesIn(x0, y0, x1, y1, load){
  const out = [];
  for (const t of tiles){
    if (t.x0 > x1 || t.x0 + TW < x0 || t.y0 > y1 || t.y0 + TH < y0) continue;
    if (load) tileTouch(t);
    out.push(t);
  }
  return out;
}
function drawTiles(c, x0, y0, x1, y1, load){
  for (const t of tilesIn(x0, y0, x1, y1, load)){
    if (t.state !== 2) continue;
    c.save(); c.translate(t.x0 + TW, t.y0); c.scale(-1, 1); c.drawImage(t.img, 0, 0, TW, TH); c.restore();
  }
}
// silhouette of a building prism redrawn from the tiles
function redrawSil(c, b){
  const p = b.p, n = p.length, T = b.top;
  const bs = p.map(q => P(q[0], q[1], 0)), ts = p.map(q => P(q[0], q[1], T));
  const bb = [1e9, 1e9, -1e9, -1e9];
  bs.concat(ts).forEach(q => { bb[0] = Math.min(bb[0], q[0]); bb[1] = Math.min(bb[1], q[1]); bb[2] = Math.max(bb[2], q[0]); bb[3] = Math.max(bb[3], q[1]); });
  const shapes = [ts];
  for (let i = 0; i < n; i++){ const j = (i + 1)%n; shapes.push([bs[i], bs[j], ts[j], ts[i]]); }
  shapes.push(bs);
  for (const sh of shapes){
    c.save(); c.beginPath(); sh.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.clip();
    drawTiles(c, bb[0], bb[1], bb[2], bb[3], false); c.restore();
  }
}

// ---------------------------------------------------------------- world dynamic drawables
function drawSprite(c, o, time){
  const s = P(o.x, o.y, 0);
  c.save(); c.translate(s[0], s[1] + (o.lift || 0)); c.scale(CU, CU);
  if (o.draw) o.draw(c, 0, 0, time);
  c.restore();
}
function drawPickup(c, p, time){
  const s = P(p.x, p.y, 0), bob = Math.sin(time*4 + p.x)*1.2;
  c.save(); c.translate(s[0], s[1]); c.scale(0.72, 0.72);
  c.fillStyle = 'rgba(30,20,50,.3)'; c.beginPath(); c.ellipse(0, 0, 5, 2, 0, 0, TAU); c.fill();
  if (p.kind === 'coin'){ c.fillStyle = '#1d1528'; c.fillRect(-4, -11 + bob, 8, 8); c.fillStyle = '#ffd36a'; c.fillRect(-3, -10 + bob, 6, 6); c.fillStyle = '#fff1b0'; c.fillRect(-2, -9 + bob, 2, 3); }
  else if (p.kind === 'ammo'){ c.fillStyle = '#1d1528'; c.fillRect(-6, -12 + bob, 12, 9); c.fillStyle = '#7a8a52'; c.fillRect(-5, -11 + bob, 10, 7); c.fillStyle = '#e8d070'; c.fillRect(-3, -9 + bob, 6, 2); }
  else if (p.kind === 'med'){ c.fillStyle = '#1d1528'; c.fillRect(-6, -13 + bob, 12, 10); c.fillStyle = '#f2f2f2'; c.fillRect(-5, -12 + bob, 10, 8); c.fillStyle = '#d33a3a'; c.fillRect(-1, -11 + bob, 2, 6); c.fillRect(-3, -9 + bob, 6, 2); }
  c.restore();
}
function drawQuestItem(c, it, time){
  const s = P(it.x, it.y, 0), bob = Math.sin(time*3)*2;
  c.save(); c.translate(s[0], s[1]);
  const g = c.createRadialGradient(0, -10, 2, 0, -10, 26); g.addColorStop(0, 'rgba(255,220,130,.7)'); g.addColorStop(1, 'rgba(255,220,130,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, -10, 26, 0, TAU); c.fill();
  c.fillStyle = '#1d1528'; c.fillRect(-7, -17 + bob, 14, 13); c.fillStyle = '#c8862f'; c.fillRect(-6, -16 + bob, 12, 11); c.fillStyle = '#ffe9b0'; c.fillRect(-4, -14 + bob, 8, 3);
  c.restore();
}
const corpseDraw = (c, cp) => {
  const s = P(cp.x, cp.y, 0); c.save(); c.translate(s[0], s[1]); c.globalAlpha = Math.max(0, 1 - cp.t/25);
  if (pupReady('zomb') && cp.type){ c.scale(CU, CU); drawPuppet(c, 'zomb', cp.type, 5, pupView(cp.fx || 0.3, cp.fy || 0.6), ZOMB_H[cp.type] || 40, {noShadow: true}); c.restore(); return; }
  c.fillStyle = 'rgba(70,16,24,.45)'; c.beginPath(); c.ellipse(0, 0, 11*cp.T.u, 4.5*cp.T.u, 0, 0, TAU); c.fill();
  c.fillStyle = cp.pal.jacket; c.fillRect(-9*cp.T.u, -4*cp.T.u, 14*cp.T.u, 4*cp.T.u); c.fillStyle = cp.pal.skin; c.fillRect(5*cp.T.u, -4*cp.T.u, 4*cp.T.u, 4*cp.T.u);
  c.restore();
};

// ---------------------------------------------------------------- frame
let camX = 0, camY = 0, camInit = false;
function render(){
  if (Math.abs(ZOOM/camZoomCur - zoomApplied) > 0.002) applyZoom();
  cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = LEVEL ? '#0e0a16' : '#c9b4c6'; cx.fillRect(0, 0, cv.width, cv.height);
  const hs = P(hero.x, hero.y, 0);
  let tx = hs[0] - VWu/2 + (hero.fx ? -hero.fx*0 : 0), ty = hs[1] - VHu*0.52;
  if (!camInit){ camX = tx; camY = ty; camInit = true; }
  camX += (tx - camX)*Math.min(1, dtLast*6); camY += (ty - camY)*Math.min(1, dtLast*6);
  const cX = Math.round(camX*K)/K, cY = Math.round(camY*K)/K;
  cx.setTransform(K, 0, 0, K, -cX*K, -cY*K);
  cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
  const vx0 = cX, vy0 = cY, vx1 = cX + VWu, vy1 = cY + VHu;
  if (LEVEL){ drawLevelBg(cx); drawLevelOverlay(cx); } else drawTiles(cx, vx0 - 300, vy0 - 300, vx1 + 300, vy1 + 300, true);   // loads neighbours too
  // footprints in the snow
  cx.save();
  for (const f of footprints){
    const s = P(f.x, f.y, 0); if (s[0] < vx0 - 10 || s[0] > vx1 + 10 || s[1] < vy0 - 10 || s[1] > vy1 + 10) continue;
    const e = P(f.x + f.dx, f.y + f.dy, 0), ang = Math.atan2(e[1] - s[1], e[0] - s[0]);
    const al = Math.max(0, 1 - f.t/40);
    cx.setTransform(K*Math.cos(ang), K*Math.sin(ang), -K*Math.sin(ang), K*Math.cos(ang), (s[0] - cX)*K, (s[1] - cY)*K);
    cx.globalAlpha = 0.5*al; cx.fillStyle = '#4a4872';
    cx.beginPath(); cx.ellipse(0.9*CHS, 0, 1.25*CHS, 0.85*CHS, 0, 0, TAU); cx.fill();     // sole
    cx.beginPath(); cx.ellipse(-1.2*CHS, 0, 0.75*CHS, 0.7*CHS, 0, 0, TAU); cx.fill();     // heel
    cx.globalAlpha = 0.28*al; cx.fillStyle = '#ffffff';
    cx.beginPath(); cx.ellipse(0.6, -0.8, 1.2, 0.3, 0, 0, TAU); cx.fill();
  }
  cx.restore();
  // dynamic drawables
  const items = [];
  const cs = [unrot(vx0 - 40, vy0 - 80), unrot(vx1 + 40, vy0 - 80), unrot(vx0 - 40, vy1 + 120), unrot(vx1 + 40, vy1 + 120)];
  const wx0 = Math.min(...cs.map(q => q[0])), wx1 = Math.max(...cs.map(q => q[0])), wy0 = Math.min(...cs.map(q => q[1])), wy1 = Math.max(...cs.map(q => q[1]));
  const inView = o => { const s = P(o.x, o.y, 0); return s[0] > vx0 - 60 && s[0] < vx1 + 60 && s[1] > vy0 - 40 && s[1] < vy1 + 100; };
  for (const z of zombies) if (inView(z)) items.push(z);
  for (const k in npcs) if (!npcs[k].hidden && inView(npcs[k])) items.push(npcs[k]);
  if (!hero.inCar) items.push(hero);
  if (hero.air){ const s = P(hero.x, hero.y, 0); cx.fillStyle = 'rgba(20,14,30,.35)'; cx.beginPath(); cx.ellipse(s[0], s[1], 8, 3.5, 0, 0, TAU); cx.fill(); }
  for (const c of CARS) if (inView(c)) items.push(c);
  for (const p of pickups) if (inView(p)){ p.dyn = true; p.draw = null; p.hgt = 1; p._pk = true; items.push(p); }
  for (const it of Quests.itemsToDraw()) if (inView(it)){ it.dyn = true; it._qi = true; it.hgt = 1; items.push(it); }
  for (const cp of corpses) if (inView(cp)){ cp.dyn = true; cp._cp = true; cp.hgt = 0.5; items.push(cp); }
  const vb = new Map();
  for (const o of items){
    if (o.depth == null) o.depth = depthOf(o.x, o.y);
    o.occ = occludersOf(o.x, o.y, o.hgt || 2);
    for (const b of o.occ) vb.set(b.id, b);
  }
  const vbl = Array.from(vb.values()).sort((a, b) => a.depth - b.depth);
  const rank = new Map(); vbl.forEach((b, i) => rank.set(b.id, i));
  const slots = []; for (let i = 0; i <= vbl.length; i++) slots.push([]);
  hero.hidden = false;
  for (const o of items){
    let slot = vbl.length; for (const b of o.occ){ const r = rank.get(b.id); if (r < slot) slot = r; }
    slots[slot].push(o); if (o === hero && slot < vbl.length) hero.hidden = true;
  }
  const drawItem = o => {
    o.depth = depthOf(o.x, o.y);
    if (o._car) drawCar(cx, o); else if (o._pk) drawPickup(cx, o, time); else if (o._qi) drawQuestItem(cx, o, time); else if (o._cp) corpseDraw(cx, o); else drawSprite(cx, o, time);
  };
  // ground effects first (fire pools, defend zone ring)
  for (const f of fires){ const s = P(f.x, f.y, 0); cx.save(); cx.translate(s[0], s[1]); const fl = 0.6 + Math.sin(time*18 + f.x)*0.2; cx.fillStyle = 'rgba(255,120,40,' + 0.35*fl + ')'; cx.beginPath(); cx.ellipse(0, 0, 28, 13, 0, 0, TAU); cx.fill(); cx.fillStyle = 'rgba(255,200,80,' + 0.5*fl + ')'; cx.beginPath(); cx.ellipse(0, -3, 16, 7, 0, 0, TAU); cx.fill(); cx.restore(); }
  const di = Quests.defendInfo(); if (di){ const s = P(di.p[0], di.p[1], 0); cx.save(); cx.translate(s[0], s[1]); cx.scale(1, 0.5); cx.strokeStyle = 'rgba(255,220,140,.55)'; cx.setLineDash([14, 10]); cx.lineWidth = 3; cx.beginPath(); cx.arc(0, 0, di.r*Math.hypot(5.5, 5.5)*0.72, 0, TAU); cx.stroke(); cx.restore(); }
  for (let i = 0; i <= vbl.length; i++){
    slots[i].sort((a, b) => depthOf(a.x, a.y) - depthOf(b.x, b.y)).forEach(drawItem);
    if (i < vbl.length) redrawSil(cx, vbl[i]);
  }
  if (LEVEL) drawLevelBeam(cx);
  { const hi = Quests.holdInfo(); if (hi) for (const v of hi){ if (v.p >= 1) continue; const s = P(v.x, v.y, 3.2); cx.save(); cx.lineWidth = 2.2; cx.strokeStyle = 'rgba(30,20,40,.7)'; cx.beginPath(); cx.arc(s[0], s[1], 6, 0, TAU); cx.stroke();
      cx.strokeStyle = '#ffd36a'; cx.beginPath(); cx.arc(s[0], s[1], 6, -Math.PI/2, -Math.PI/2 + TAU*v.p); cx.stroke(); cx.restore(); } }
  // bullets & particles
  for (const b of bullets){
    if (b.mol){ const s = P(b.x, b.y, b.z); cx.fillStyle = '#ffb04a'; cx.fillRect(s[0] - 3, s[1] - 3, 6, 6); continue; }
    const a = P(b.px, b.py, 1.4), c2 = P(b.x, b.y, 1.4); cx.strokeStyle = '#fff3b0'; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(c2[0], c2[1]); cx.stroke();
  }
  for (const s0 of spits){ const s = P(s0.x, s0.y, 1.4); cx.fillStyle = '#9bd44a'; cx.fillRect(s[0] - 2.5, s[1] - 2.5, 5, 5); }
  for (const p of parts){ const s = P(p.x, p.y, p.z); cx.globalAlpha = Math.max(0, 1 - p.t/p.life); cx.fillStyle = p.col; cx.fillRect(s[0] - 1.5, s[1] - 1.5, 3, 3); cx.globalAlpha = 1; }
  const LIGHTS = drawFireFX(cx, vx0, vy0, vx1, vy1);
  if (hero.hidden && !S.dead){ cx.globalAlpha = 0.42; drawSprite(cx, hero, time); cx.globalAlpha = 1; }
  for (const f of floaters){ const s = P(f.x, f.y, 3 + f.t*2); cx.globalAlpha = Math.max(0, 1 - f.t); cx.font = 'bold ' + (13/ZOOM).toFixed(1) + 'px system-ui'; cx.textAlign = 'center'; cx.fillStyle = '#1d1528'; cx.fillText(f.txt, s[0] + 0.7, s[1] + 0.7); cx.fillStyle = f.col; cx.fillText(f.txt, s[0], s[1]); cx.globalAlpha = 1; }
  drawLightMap(cx, LIGHTS, cX, cY);
  // dusk vignette
  cx.setTransform(1, 0, 0, 1, 0, 0);
  const vg = cx.createRadialGradient(cv.width/2, cv.height*0.5, Math.min(cv.width, cv.height)*0.35, cv.width/2, cv.height*0.5, Math.max(cv.width, cv.height)*0.75);
  vg.addColorStop(0, 'rgba(30,16,50,0)'); vg.addColorStop(1, 'rgba(30,16,50,.42)'); cx.fillStyle = vg; cx.fillRect(0, 0, cv.width, cv.height);
  if (hero.hitFlash > 0){ cx.fillStyle = 'rgba(200,30,40,' + hero.hitFlash*1.4 + ')'; cx.fillRect(0, 0, cv.width, cv.height); }
  drawArrows(cX, cY);
  if (tilesWaiting()){ cx.fillStyle = 'rgba(255,255,255,.7)'; cx.font = (12*DPR) + 'px system-ui'; cx.textAlign = 'center'; cx.fillText('Загрузка карты…', cv.width/2, cv.height - 20*DPR); }
}
function tilesWaiting(){ if (LEVEL) return !LEVEL.bgReady; const hs = P(hero.x, hero.y, 0); return tilesIn(hs[0] - 50, hs[1] - 50, hs[0] + 50, hs[1] + 50).some(t => t.state !== 2); }
function drawArrows(cX, cY){
  if (window.__cine) return;
  const tg = Quests.targets(); const cxm = cv.width/2, cym = cv.height*0.52;
  tg.forEach(t => {
    const s = P(t.x, t.y, 0), sx = (s[0] - cX)*K, sy = (s[1] - cY)*K;
    const m = 34*DPR, on = sx > m && sx < cv.width - m && sy > m*2 && sy < cv.height - m*2;
    cx.save();
    if (on){ const bob = Math.sin(time*4)*5*DPR; cx.translate(sx, sy - 56*DPR + bob); cx.fillStyle = t.main ? '#ffd36a' : '#9ad4ff'; cx.strokeStyle = '#2a1c3a'; cx.lineWidth = 2*DPR; cx.beginPath(); cx.moveTo(0, 14*DPR); cx.lineTo(-10*DPR, -4*DPR); cx.lineTo(10*DPR, -4*DPR); cx.closePath(); cx.fill(); cx.stroke(); }
    else {
      const dx = sx - cxm, dy = sy - cym, l = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx);
      const ex = Math.max(m, Math.min(cv.width - m, cxm + dx/l*5000)), ey = Math.max(m*2.4, Math.min(cv.height - m*2.4, cym + dy/l*5000));
      cx.translate(ex, ey); cx.rotate(a); cx.fillStyle = t.main ? '#ffd36a' : '#9ad4ff'; cx.strokeStyle = '#2a1c3a'; cx.lineWidth = 2*DPR;
      cx.beginPath(); cx.moveTo(14*DPR, 0); cx.lineTo(-8*DPR, -9*DPR); cx.lineTo(-8*DPR, 9*DPR); cx.closePath(); cx.fill(); cx.stroke();
      cx.rotate(-a); cx.font = 'bold ' + 10*DPR + 'px system-ui'; cx.textAlign = 'center'; cx.fillStyle = '#fff'; cx.strokeStyle = '#2a1c3a'; cx.lineWidth = 3*DPR;
      const dm = Math.round(Math.hypot(t.x - hero.x, t.y - hero.y)) + ' м'; cx.strokeText(dm, 0, -14*DPR); cx.fillText(dm, 0, -14*DPR);
    }
    cx.restore();
  });
}

// ---------------------------------------------------------------- minimap
const MMT = __MMT__.map(t => { const im = new Image(); im.src = t[0]; return {im, x: t[1], y: t[2], w: t[3], h: t[4]}; });
const mm = $('mm'), mmc = mm.getContext('2d');
const OVS = __OVS__;     // [SMINX, SMINY, fullW(px of 0.2 overview), scale]
function mmPos(x, y){ const s = P(x, y, 0); const sxu = -s[0]; const ox = (sxu - OVS[0] + 100)*0.2, oy = (s[1] - OVS[1] + 300)*0.2; return [OVS[2] - ox, oy]; }
let bigMap = false;
const MM_LAB = [['flame', 'Вечный огонь'], ['square', 'пл. Дзержинского'], ['dkh', 'ДКХ'], ['mall', 'Дзержинец', 1], ['stadium', 'стадион', 1], ['park', 'парк'], ['pool', 'бассейн', 1],
  ['spire', 'шпиль'], ['uvd', 'УВД'], ['trauma', 'травмпункт'], ['kotel', 'котельная'], ['admin', 'администрация', 1], ['tracks', 'ж/д', 1], ['cinema', 'Жюль Верн', 1]];
function drawMini(){
  const size = bigMap ? Math.min(innerWidth, innerHeight)*0.92 : 140; if (mm.width !== Math.round(size*DPR)){ mm.width = mm.height = Math.round(size*DPR); mm.style.width = mm.style.height = size + 'px'; }
  const c = mmc, R = mm.width;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, R, R); c.save(); c.beginPath(); c.arc(R/2, R/2, R/2 - 2, 0, TAU); c.clip(); c.fillStyle = '#28223a'; c.fillRect(0, 0, R, R);
  const hp = mmPos(hero.x, hero.y);
  const WN = LEVEL ? 95 : 170, k = bigMap ? R/(OVS[2]*0.78) : R/WN, ox = bigMap ? OVS[2]*0.11 : hp[0] - WN/2, oy = bigMap ? 2024*0.5 - OVS[2]*0.39 : hp[1] - WN/2;
  c.imageSmoothingQuality = 'high';
  const toM = (x, y) => { const p = mmPos(x, y); return [(p[0] - ox)*k, (p[1] - oy)*k]; };
  if (LEVEL) drawLevelMini(c, toM, R); else
  for (const t of MMT){ if (!t.im.complete || !t.im.naturalWidth) continue; const x = (t.x - ox)*k, y = (t.y - oy)*k, w = t.w*k, h = t.h*k; if (x > R || y > R || x + w < 0 || y + h < 0) continue; c.drawImage(t.im, x, y, w + 0.5, h + 0.5); }
  c.font = '600 ' + Math.round((bigMap ? 10 : 8.5)*DPR) + 'px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  if (!LEVEL) for (const L of MM_LAB){ const p = POI[L[0]]; if (!p || (bigMap && L[2])) continue; const q = toM(p[0], p[1]); if (q[0] < -40 || q[0] > R + 40 || q[1] < -10 || q[1] > R + 10) continue;
    c.lineWidth = 3*DPR; c.strokeStyle = 'rgba(28,20,40,.9)'; c.strokeText(L[1], q[0], q[1]); c.fillStyle = '#ffe2a0'; c.fillText(L[1], q[0], q[1]); }
  Quests.targets().forEach(t => {
    const p = toM(t.x, t.y), col = t.main ? '#ffd36a' : '#9ad4ff', cxm = R/2, cym = R/2;
    const dx = p[0] - cxm, dy = p[1] - cym, dd = Math.hypot(dx, dy), rim = R/2 - 11*DPR;
    if (dd < rim){   // target inside the map: pulsing marker
      const pr = (4 + Math.sin(time*5)*1.2)*DPR;
      c.fillStyle = col; c.strokeStyle = '#2a1c3a'; c.lineWidth = 2*DPR; c.beginPath(); c.arc(p[0], p[1], pr, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = col; c.globalAlpha = 0.5; c.lineWidth = 1.5*DPR; c.beginPath(); c.arc(p[0], p[1], pr + 4*DPR + (time*8)%6*DPR, 0, TAU); c.stroke(); c.globalAlpha = 1;
    } else {         // off the map: arrow on the rim pointing towards the target
      const an = Math.atan2(dy, dx), ax = cxm + Math.cos(an)*rim, ay = cym + Math.sin(an)*rim, a = 9*DPR;
      c.save(); c.translate(ax, ay); c.rotate(an);
      c.fillStyle = col; c.strokeStyle = '#2a1c3a'; c.lineWidth = 2*DPR;
      c.beginPath(); c.moveTo(a, 0); c.lineTo(-a*0.75, a*0.75); c.lineTo(-a*0.35, 0); c.lineTo(-a*0.75, -a*0.75); c.closePath(); c.stroke(); c.fill();
      c.restore();
    }
    if (t.main && !bigMap){   // dashed guide line from hero to target (clipped by the circle)
      c.save(); c.setLineDash([3*DPR, 4*DPR]); c.strokeStyle = 'rgba(255,211,106,.55)'; c.lineWidth = 1.5*DPR;
      c.beginPath(); c.moveTo(cxm, cym); const e = dd < rim ? p : [cxm + dx/dd*rim*0.9, cym + dy/dd*rim*0.9]; c.lineTo(e[0], e[1]); c.stroke(); c.restore();
    }
  });
  zombies.forEach(z => { const p = toM(z.x, z.y); if (p[0] > 0 && p[0] < R && p[1] > 0 && p[1] < R){ c.fillStyle = '#e04a4a'; c.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3); } });
  const hp2 = toM(hero.x, hero.y), hf = toM(hero.x + (hero.fx || 0)*6, hero.y + (hero.fy || 1)*6); const an = Math.atan2(hf[1] - hp2[1], hf[0] - hp2[0]), a = 7*DPR;
  c.save(); c.translate(hp2[0], hp2[1]); c.rotate(an); c.fillStyle = '#4fe0ff'; c.strokeStyle = '#fff'; c.lineWidth = 1.5*DPR; c.beginPath(); c.moveTo(a, 0); c.lineTo(-a*0.7, a*0.65); c.lineTo(-a*0.35, 0); c.lineTo(-a*0.7, -a*0.65); c.closePath(); c.fill(); c.stroke(); c.restore();
  c.restore(); c.strokeStyle = 'rgba(255,214,140,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(R/2, R/2, R/2 - 2, 0, TAU); c.stroke();
}
mm.addEventListener('pointerdown', e => { e.stopPropagation(); bigMap = !bigMap; mm.classList.toggle('big', bigMap); });

// ---------------------------------------------------------------- HUD / UI
const elHp = $('hpf'), elSt = $('stf'), elWp = $('wpn'), elCn = $('cn'), elToast = $('toast'), elAct = $('act');
let toastTimer = 0;
function toast(msg, secs){ elToast.textContent = msg; elToast.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => elToast.classList.remove('on'), (secs || 2.6)*1000); }
function hud(){
  elHp.style.width = Math.max(0, S.hp/S.maxHp*100) + '%'; elCn.textContent = S.coins;
  const w = curW(); let t = w.name;
  if (w.mag) t += ' · ' + (S.mag[S.cur] || 0) + '/' + S.ammo[w.ammo]; else if (w.throw) t += ' · ' + S.ammo['мол'];
  elWp.textContent = t; $('medn').textContent = S.med; $('bmed').classList.toggle('empty', !S.med);
  elHp.style.background = S.hp < 30 ? '#e04a4a' : '#7bd96a';
}
let dlgLines = null, dlgIdx = 0, dlgCb = null;
const elDlg = $('dlg'), elDN = $('dn'), elDX = $('dx');
function openDialog(lines, cb){ dlgLines = lines; dlgIdx = 0; dlgCb = cb; showLine(); elDlg.style.display = 'block'; input.x = input.y = 0; input.fire = false; }
function showLine(){ elDN.textContent = dlgLines[dlgIdx][0]; elDX.textContent = dlgLines[dlgIdx][1]; }
function nextLine(){ if (!dlgLines) return; dlgIdx++; if (dlgIdx >= dlgLines.length){ elDlg.style.display = 'none'; const cb = dlgCb; dlgLines = null; dlgCb = null; if (cb) cb(); } else showLine(); }
elDlg.addEventListener('pointerdown', e => { e.stopPropagation(); nextLine(); });
window.openDialog = openDialog;
function uiBlock(){ return !!dlgLines || !running; }
function interact(){ if (dlgLines){ nextLine(); return; } if (driving){ exitCar(); return; } if (Quests.interact()) return; const c = nearCar(3.4); if (c && !c.wrecked) enterCar(c); }
function onDeath(){ $('dead').style.display = 'flex'; input.x = input.y = 0; input.fire = false; }
function respawn(){
  if (LEVEL) leaveLevel(true);
  $('dead').style.display = 'none'; S.dead = false; S.hp = S.maxHp; S.coins = Math.floor(S.coins*0.8); const p = freeNear(POI.flame[0] + 6, POI.flame[1] - 6, 0.5); hero.x = p[0]; hero.y = p[1]; zombies.length = 0; spawnQuestZombies();
  hud();
}
function spawnQuestZombies(){ Quests.chains.forEach(c => { if (c.active && !c.done) c.begun = false; }); }
$('rs').addEventListener('click', respawn);

// input
const input2 = null;
addEventListener('keydown', e => { if (slidesOn){ if (e.key === 'Escape') document.querySelector('#sl .sls').dispatchEvent(new Event('pointerdown')); else document.getElementById('sl').dispatchEvent(new Event('pointerdown')); return; }
  const k = e.key.toLowerCase();
  if ([' ', 'enter', 'e', 'у'].includes(k)){ e.preventDefault(); keys[k] = true; if (!e.repeat) interact(); return; }
  if (k === 'r' || k === 'к') startReload(); if (k === 'q' || k === 'й') switchWeapon(1); if (k === 'h' || k === 'р') useMed(); if (k === 'm' || k === 'ь'){ bigMap = !bigMap; mm.classList.toggle('big', bigMap); }
  if (k === 'tab'){ e.preventDefault(); Quests.cycle(); }
  if ((k === 'c' || k === 'с') && LEVEL && LEVEL.pit) setSneak(!hero.sneak);
  keys[k] = true;
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
const joy = {on: false, id: -1, ox: 0, oy: 0};
const elJB = $('joyBase'), elJK = $('joyKnob');
cv.addEventListener('pointerdown', e => {
  if (dlgLines || !running) return;
  if (e.pointerType === 'mouse'){ // mouse: click to aim+fire
    const hs = P(hero.x, hero.y, 0), sx = camX + e.clientX/innerWidth*VWu, sy = camY + e.clientY/innerHeight*VHu; const g = unrot(sx, sy), gh = unrot(hs[0], hs[1] - 0);
    hero.aim = Math.atan2(g[1] - hero.y, g[0] - hero.x); input.aimX = 1; input.aimA = hero.aim; input.fire = true; return;
  }
  if (e.clientX > innerWidth*0.55) return;
  joy.on = true; joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY;
  elJB.style.display = 'block'; elJB.style.left = joy.ox + 'px'; elJB.style.top = joy.oy + 'px'; elJK.style.transform = 'translate(0,0)';
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
});
cv.addEventListener('pointermove', e => {
  if (!joy.on || e.pointerId !== joy.id) return;
  let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const m = Math.hypot(dx, dy), R = 52; if (m > R){ dx *= R/m; dy *= R/m; }
  elJK.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; const mmv = Math.min(1, Math.hypot(dx, dy)/R), mg = Math.hypot(dx, dy) || 1;
  input.x = dx/mg*(mmv < 0.12 ? 0 : mmv); input.y = dy/mg*(mmv < 0.12 ? 0 : mmv);
  input.sprint = mmv > 0.97;
});
function joyEnd(e){ if (e.pointerType === 'mouse'){ input.fire = false; input.aimX = null; return; } if (e.pointerId !== joy.id) return; joy.on = false; input.x = input.y = 0; input.sprint = false; elJB.style.display = 'none'; }
cv.addEventListener('pointerup', joyEnd); cv.addEventListener('pointercancel', joyEnd);
function hold(el, on, off){ el.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); on(); try { el.setPointerCapture(e.pointerId); } catch (_) {} }); const o = e => { off && off(); }; el.addEventListener('pointerup', o); el.addEventListener('pointercancel', o); el.addEventListener('lostpointercapture', o); }
hold($('bfire'), () => { if (!dlgLines && running) input.fire = true; }, () => { input.fire = false; });
hold($('bact'), () => { input.act = true; interact(); }, () => { input.act = false; });
$('brel').addEventListener('pointerdown', e => { e.stopPropagation(); startReload(); });
$('bwp').addEventListener('pointerdown', e => { e.stopPropagation(); switchWeapon(1); });
$('bmed').addEventListener('pointerdown', e => { e.stopPropagation(); useMed(); });
$('bspr').addEventListener('pointerdown', e => { e.stopPropagation(); input.sprint = !input.sprint; $('bspr').classList.toggle('on', input.sprint); if (input.sprint && hero.sneak){ hero.sneak = false; $('bsnk').classList.remove('on'); } });
$('bsnk').addEventListener('pointerdown', e => { e.stopPropagation(); setSneak(!hero.sneak); });
function setSneak(on){ hero.sneak = on; $('bsnk').classList.toggle('on', on); if (on){ input.sprint = false; $('bspr').classList.remove('on'); toast('Тихий шаг: медленно, но бесшумно', 1.6); } }
{ const b = $('bsnd'); b.classList.toggle('off', !AUD.on); b.addEventListener('pointerdown', e => { e.stopPropagation(); AUD.init(); b.classList.toggle('off', !AUD.toggle()); }); }
$('quest').addEventListener('pointerdown', e => { e.stopPropagation(); Quests.cycle(); });
document.addEventListener('contextmenu', e => e.preventDefault());

// ---------------------------------------------------------------- loop
let last = 0, dtLast = 0.016;
function onColReady(){   // painted-obstacle masks arrived: push anything standing inside a prop to the nearest free spot
  const fix = e => { if (e && blocked(e.x, e.y, 0.45)){ const p = freeNear(e.x, e.y, 0.45); e.x = p[0]; e.y = p[1]; } };
  fix(hero); for (const k in npcs) fix(npcs[k]); zombies.forEach(fix);
  for (const k in POI){ if (blocked(POI[k][0], POI[k][1], 0.6)){ const p = freeNear(POI[k][0], POI[k][1], 0.7); POI[k] = [p[0], p[1]]; } }
}
function init(){
  initColMasks(TILEMETA);
  for (const k in POI){ const p = freeNear(POI[k][0], POI[k][1], 0.7); POI[k] = [p[0], p[1]]; }
  for (const k in NPCDEF){ const d = NPCDEF[k]; const n = addNpc(k, d.name, NPC_PAL[d.pal], POI[d.pos][0] + 2, POI[d.pos][1] + 2); n.sheet = k; n.hidden = !!d.hidden; }
  const p = freeNear(POI.flame[0] + 14, POI.flame[1] + 10, 0.5); hero.x = p[0]; hero.y = p[1]; safeX = POI.flame[0]; safeY = POI.flame[1];
  giveWeapon('crowbar', 0); S.cur = 'crowbar'; Quests.start(); hud();
}
function frame(ts){
  const dt = Math.min(0.05, (ts - last)/1000 || 0.016); last = ts; dtLast = dt; time += dt;
  if (running){
    if (!dlgLines && !slidesOn){
      levelTick(); updateHero(dt); levelUpdate(dt); updateCars(dt); updateZombies(dt); updateNpcs(dt); updateBullets(dt); updatePickups(dt); spawnTick(dt); Quests.update(dt);
      zombieCap = 12 + Math.min(10, Math.floor(Quests.progressCount()/2));
      S.stamina = Math.max(0, Math.min(100, S.stamina)); elSt.style.width = S.stamina + '%';
      for (const cp of corpses) cp.t += dt; for (const f of footprints) f.t += dt; while (footprints.length && footprints[0].t > 40) footprints.shift();
    } else { updateNpcs(dt*0); }
    const w = curW(); const nc = nearCar(3.4), can = Quests.canInteract() || driving || (nc && !nc.wrecked); elAct.classList.toggle('ready', !!can);
    $('bact').classList.toggle('ready', !!can);
    if (hero.reloadT > 0) $('brel').textContent = '…'; else $('brel').textContent = '↻';
    zombies.forEach(z => z.depth = depthOf(z.x, z.y));
  }
  if (running){ const ct = Quests.curType(); AUD.setMusic(S.dead ? 'theme' : (ct === 'defend' || ct === 'boss') ? 'tension' : 'theme'); AUD.update(dt); }
  if (running){ render(); } if (running && (frame.n = (frame.n || 0) + 1)%3 === 0) drawMini();
  requestAnimationFrame(frame);
}
$('go').addEventListener('click', () => {
  $('start').style.display = 'none'; AUD.init(); running = true; init(); slidesOn = true; playSlides('intro', () => { toast('Идите на свет костров у Вечного огня', 4); for (const k in SCENES) preloadScene(k); });
  try { const w = window.Telegram.WebApp; w.ready(); w.expand(); if (w.disableVerticalSwipes) w.disableVerticalSwipes(); } catch (_) {}
});
requestAnimationFrame(frame);
window.__dbg = {AUD, makeNoise, wakeAll, inPit, CARS, makeCar, enterCar, exitCar, get driving(){ return driving; }, enterLevel, leaveLevel, LEVELS, get LEVEL(){ return LEVEL; }, colMask, nearestFire, CM, hero, S, zombies, Quests, tiles, P, POI, blocked, occludersOf, input, freeNear, npcs, bullets, pickups, giveWeapon, makeZombie, nextLine, interact, killZombie, hud, get dlg(){ return dlgLines; }, get zlist(){ return zombies; }, step(dt){ updateHero(dt); updateCars(dt); updateZombies(dt); updateNpcs(dt); updateBullets(dt); updatePickups(dt); Quests.update(dt); }};
