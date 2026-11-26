// ---------------------------------------------------------------- interior levels (ТЦ «Дзержинец»)
// An interior lives far away from the city in the same world space (grid offset OX/OY), so the usual
// systems (zombies, pickups, quests, projection) work unchanged; collision, background, light and map are swapped.
const LEVELS = {mall: __MALL__};
let LEVEL = null;                         // null = city
function lvW(L, gx, gy){ const X = gx + L.OX, Y = gy + L.OY; return [X*cb + Y*sb, -X*sb + Y*cb]; }   // grid -> world
function lvG(L, x, y){ return [x*cb - y*sb - L.OX, x*sb + y*cb - L.OY]; }                         // world -> grid
(function(){ for (const id in LEVELS){ const L = LEVELS[id]; L.id = id; L.bg = new Image(); L.bgReady = false; L.bg.onload = () => { L.bgReady = true; };
  for (const k in L.pois) POI[k] = lvW(L, L.pois[k][0], L.pois[k][1]); } })();
function levelBlocked(x, y, r){
  const L = LEVEL, g = lvG(L, x, y), X = g[0], Y = g[1];
  if (X < 0.3 + r || Y < 0.3 + r || X > L.GW - 0.3 - r || Y > L.GH - 0.3 - r) return true;
  for (const b of L.rects){ if (X > b.x0 - r && X < b.x1 + r && Y > b.y0 - r && Y < b.y1 + r) return true; }
  return false;
}
function levelLos(x0, y0, x1, y1){
  const L = LEVEL, d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d/0.8);
  for (let i = 1; i < n; i++){ const t = i/n, g = lvG(L, x0 + (x1 - x0)*t, y0 + (y1 - y0)*t);
    for (const b of L.rects){ if (b.h >= 1.25 && g[0] > b.x0 && g[0] < b.x1 && g[1] > b.y0 && g[1] < b.y1) return false; } }
  return true;
}
function fadeScreen(cb){
  if (window.__fastSlides){ cb(); camInit = false; return; }
  const f = document.getElementById('fade'); f.style.opacity = 1;
  setTimeout(() => { cb(); camInit = false; setTimeout(() => { f.style.opacity = 0; }, 120); }, 450);
}
function enterLevel(id, silent){
  const L = LEVELS[id]; if (!L || LEVEL === L) return;
  if (!L.bg.src) L.bg.src = 'lv/' + id + '.webp';
  const go = () => {
    LEVEL = L; L.cityPos = [hero.x, hero.y];
    zombies.length = 0; footprints.length = 0; fires.length = 0; bullets.length = 0; spits.length = 0;
    const p = POI.m_enter; hero.x = p[0]; hero.y = p[1]; hero.vx = hero.vy = 0;
    for (const s of L.spawns){ const w = lvW(L, s[0], s[1]); const q = freeNear(w[0], w[1], 0.5); const z = makeZombie(s[2], q[0], q[1]); z.keep = true; z.alert = 0; z.still = Math.random() < 0.5; }
    toast('ТЦ «Дзержинец»', 2.5);
  };
  silent ? go() : fadeScreen(go);
}
function leaveLevel(silent){
  if (!LEVEL) return;
  const go = () => {
    LEVEL = null; zombies.length = 0; bullets.length = 0; spits.length = 0; fires.length = 0;
    const p = freeNear(POI.mall[0], POI.mall[1], 0.5); hero.x = p[0]; hero.y = p[1]; hero.vx = hero.vy = 0;
  };
  silent ? go() : fadeScreen(go);
}
// re-enter automatically if a mall step is active and the hero walks up to the entrance
function levelTick(){
  if (LEVEL || S.dead || dlgLines || slidesOn) return;
  const id = Quests.levelWanted(); if (!id) return;
  const p = POI.mall; if (Math.hypot(hero.x - p[0], hero.y - p[1]) < 7) enterLevel(id);
}
function drawLevelBg(cx){
  const L = LEVEL; if (!L.bgReady) return;
  const r = L.prect; cx.drawImage(L.bg, r[0], r[1], r[2] - r[0], r[3] - r[1]);
}
const LV_LIGHT = {red: 'red', cold: 'cold', warm: 'warm'};
function levelLights(){
  const L = LEVEL, out = [];
  for (const l of L.lights){ const w = lvW(L, l[0], l[1]), s = P(w[0], w[1], 0);
    const fl = l[2] === 'red' ? 0.75 + 0.25*Math.sin(time*3 + l[0]) : (Math.sin(time*23 + l[1]) > 0.93 ? 0.35 : 0.85);   // red blink, cold flicker
    out.push({x: s[0], y: s[1] - 20, r: l[2] === 'warm' ? 95 : 80, i: fl, tint: l[2]}); }
  return out;
}
// mini-map: schematic of the interior
function drawLevelMini(c, toM, R){
  const L = LEVEL, W = (gx, gy) => { const w = lvW(L, gx, gy); return toM(w[0], w[1]); };
  const poly = (pts, fill) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fill; c.fill(); };
  c.fillStyle = '#1c1628'; c.fillRect(0, 0, R, R);
  poly([W(0, 0), W(L.GW, 0), W(L.GW, L.GH), W(0, L.GH)], '#4a4260');
  for (const b of L.rects) poly([W(b.x0, b.y0), W(b.x1, b.y0), W(b.x1, b.y1), W(b.x0, b.y1)], b.k === 'wall' ? '#d8cdb4' : '#8d7f9e');
  c.font = '600 ' + Math.round(7*DPR) + 'px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const k in L.zones){ const q = W(L.zones[k][0], L.zones[k][1]); c.lineWidth = 3*DPR; c.strokeStyle = 'rgba(28,20,40,.9)'; c.strokeText(k, q[0], q[1]); c.fillStyle = '#ffe2a0'; c.fillText(k, q[0], q[1]); }
}
