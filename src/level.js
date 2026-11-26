// ---------------------------------------------------------------- interior levels (ТЦ «Дзержинец»)
// An interior lives far away from the city in the same world space (grid offset OX/OY), so the usual
// systems (zombies, pickups, quests, projection) work unchanged; collision, background, light and map are swapped.
const LEVELS = {mall: __MALL__, pool: __POOL__, cinema: __JV__};
LEVELS.mall.outside = LEVELS.mall.outside || 'mall'; LEVELS.mall.enter = LEVELS.mall.enter || 'm_enter';
let MOVER = null;                         // entity currently being moved (zombies may walk in the pit, the hero may not)
let LEVEL = null;                         // null = city
function lvW(L, gx, gy){ const X = gx + L.OX, Y = gy + L.OY; return [X*cb + Y*sb, -X*sb + Y*cb]; }   // grid -> world
function lvG(L, x, y){ return [x*cb - y*sb - L.OX, x*sb + y*cb - L.OY]; }                         // world -> grid
(function(){ for (const id in LEVELS){ const L = LEVELS[id]; L.id = id; L.off = {}; if (Array.isArray(L.beam)){ L.beamAt = L.beam; L.beam = null; } L.floor = L.floor || []; L.bg = new Image(); L.bgReady = false; L.bg.onload = () => { L.bgReady = true; };
  for (const k in L.pois) POI[k] = lvW(L, L.pois[k][0], L.pois[k][1]); } })();
function levelBlocked(x, y, r){
  const L = LEVEL, g = lvG(L, x, y), X = g[0], Y = g[1];
  if (X < 0.3 + r || Y < 0.3 + r || X > L.GW - 0.3 - r || Y > L.GH - 0.3 - r) return true;
  for (const b of L.rects){ if (b.id && L.off[b.id]) continue; if (X > b.x0 - r && X < b.x1 + r && Y > b.y0 - r && Y < b.y1 + r) return true; }
  if (L.pit && !(MOVER && MOVER.T)){ const p = L.pit; if (X > p[0] - r*0.6 && X < p[2] + r*0.6 && Y > p[1] - r*0.6 && Y < p[3] + r*0.6) return true; }
  return false;
}
function levelFloor(x, y){ const L = LEVEL; if (!L) return null; const g = lvG(L, x, y);
  for (const a of L.floor){ if (g[0] > a.x0 && g[0] < a.x1 && g[1] > a.y0 && g[1] < a.y1) return a.k; } return null; }
function inPit(x, y){ const L = LEVEL; if (!L || !L.pit) return false; const g = lvG(L, x, y), p = L.pit; return g[0] > p[0] && g[0] < p[2] && g[1] > p[1] && g[1] < p[3]; }
function levelLos(x0, y0, x1, y1){
  const L = LEVEL, d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d/0.8);
  for (let i = 1; i < n; i++){ const t = i/n, g = lvG(L, x0 + (x1 - x0)*t, y0 + (y1 - y0)*t);
    for (const b of L.rects){ if (b.id && L.off[b.id]) continue; if (b.h >= 1.25 && g[0] > b.x0 && g[0] < b.x1 && g[1] > b.y0 && g[1] < b.y1) return false; } }
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
    LEVEL = L; L.cityPos = [hero.x, hero.y]; L.off = {}; L.flood = 0; L.flooding = false; L.beam = null;
    zombies.length = 0; footprints.length = 0; fires.length = 0; bullets.length = 0; spits.length = 0;
    const p = POI[L.enter]; hero.x = p[0]; hero.y = p[1]; hero.vx = hero.vy = 0; hero.air = null;
    for (const s of L.spawns){ const w = lvW(L, s[0], s[1]); MOVER = {T: 1}; const q = freeNear(w[0], w[1], 0.5); MOVER = null; const z = makeZombie(s[2], q[0], q[1]); z.keep = true; z.alert = 0; z.still = Math.random() < 0.5;
      if (L.pit && inPit(z.x, z.y)){ z.sleep = true; z.still = true; } }
    toast(L.title || {mall: 'ТЦ «Дзержинец»', pool: 'Бассейн «Заря»', cinema: '«Жюль Верн»'}[id], 2.5);
  };
  silent ? go() : fadeScreen(go);
}
let LEVEL_LAST = null;
function leaveLevel(silent){
  if (!LEVEL) return;
  LEVEL_LAST = LEVEL;
  const go = () => {
    LEVEL = null; zombies.length = 0; bullets.length = 0; spits.length = 0; fires.length = 0;
    const out = POI[LEVEL_LAST.outside]; const p = freeNear(out[0], out[1], 0.5); hero.x = p[0]; hero.y = p[1]; hero.vx = hero.vy = 0; hero.air = null; hero.lift = 0;
  };
  silent ? go() : fadeScreen(go);
}
// re-enter automatically if a mall step is active and the hero walks up to the entrance
function levelTick(){
  if (LEVEL || S.dead || dlgLines || slidesOn) return;
  const id = Quests.levelWanted(); if (!id) return;
  const p = POI[LEVELS[id].outside]; if (Math.hypot(hero.x - p[0], hero.y - p[1]) < 7) enterLevel(id);
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
  for (const a of L.floor) poly([W(a.x0, a.y0), W(a.x1, a.y0), W(a.x1, a.y1), W(a.x0, a.y1)], a.k === 'pit' ? (L.flood > 0.5 ? '#3a6a9a' : '#2c3448') : a.k === 'tramp' ? '#3b4aa0' : '#a05a48');
  for (const b of L.rects) if (!(b.id && L.off[b.id])) poly([W(b.x0, b.y0), W(b.x1, b.y0), W(b.x1, b.y1), W(b.x0, b.y1)], b.k === 'wall' ? '#d8cdb4' : '#8d7f9e');
  c.font = '600 ' + Math.round(7*DPR) + 'px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const k in L.zones){ const q = W(L.zones[k][0], L.zones[k][1]); c.lineWidth = 3*DPR; c.strokeStyle = 'rgba(28,20,40,.9)'; c.strokeText(k, q[0], q[1]); c.fillStyle = '#ffe2a0'; c.fillText(k, q[0], q[1]); }
}

// ---------------------------------------------------------------- level mechanics
// noise wakes sleepers (pool): shots are loud, sprinting is noisy, walking is quiet
function makeNoise(x, y, R){
  if (!LEVEL) return;
  for (const z of zombies){ if (!z.sleep) continue; const d = Math.hypot(z.x - x, z.y - y);
    if (d < R){ z.sleep = false; z.still = false; z.alert = 8; z.wakeT = 0.9; spawnPart(z.x, z.y, 0.6, '#c9d6e0', 4, 2, 0.5); if (!LEVEL.woke){ LEVEL.woke = true; toast('Они просыпаются!', 2); } } }
}
function wakeAll(){ for (const z of zombies){ if (z.sleep){ z.sleep = false; z.still = false; z.alert = 12; z.wakeT = 0.6 + Math.random()*1.4; } } if (LEVEL) LEVEL.woke = true; }
let noiseT = 0;
function levelUpdate(dt){
  const L = LEVEL; if (!L) return;
  // hero noise
  noiseT -= dt;
  if (L.pit && hero.moving && noiseT <= 0){ const sprint = (input.sprint || keys['shift']); makeNoise(hero.x, hero.y, sprint ? 16 : 3.2); noiseT = 0.35; if (sprint) L.noiseFx = 0.5; }
  if (L.noiseFx > 0) L.noiseFx -= dt;
  // flooding the basin
  if (L.flooding && L.flood < 1){ L.flood = Math.min(1, L.flood + dt/3.5);
    if (L.flood > 0.45) for (const z of zombies){ if (!z.dead && z.hp > 0 && inPit(z.x, z.y)){ z.hp -= 160*dt; z.slowW = 1; if (z.hp <= 0) killZombie(z); } } }
  // projector beam
  if (L.beam){ const b = L.beam; b.t += dt; b.ang = b.base + Math.sin(b.t*0.9)*0.95;
    const o = lvW(L, L.beamAt[0], L.beamAt[1]);
    for (let i = zombies.length - 1; i >= 0; i--){ const z = zombies[i]; if (z.dead) continue;
      const g = lvG(L, z.x, z.y), dx = g[0] - L.beamAt[0], dy = g[1] - L.beamAt[1], d = Math.hypot(dx, dy); if (d > 60 || d < 1) continue;
      const da = Math.abs(angWrap(Math.atan2(dy, dx) - b.ang));
      if (da < 0.2 + 2/d){ z.hp -= 22*dt; z.flash = 0.05; const wx = z.x - o[0], wy = z.y - o[1], wl = Math.hypot(wx, wy) || 1; MOVER = z; moveEntity(z, wx/wl*7*dt, wy/wl*7*dt, z.T.r); MOVER = null; z.inBeam = 0.3; if (z.hp <= 0) killZombie(z, i); } }
  }
  // trampolines: launch the hero
  if (L.tramps && !hero.air && !S.dead){
    hero.trampCD = Math.max(0, (hero.trampCD || 0) - dt);
    const g = lvG(L, hero.x, hero.y);
    for (const t of L.tramps){ if (hero.trampCD > 0) break; if (g[0] > t[0] && g[0] < t[2] && g[1] > t[1] && g[1] < t[3]){
      let tx, ty; if (t.length > 4){ const w = lvW(L, t[4], t[5]); tx = w[0]; ty = w[1]; }
      else { const fx = hero.fx || 0.7, fy = hero.fy || 0.7, fl = Math.hypot(fx, fy) || 1; tx = hero.x + fx/fl*9; ty = hero.y + fy/fl*9; }
      hero.air = {t: 0, dur: t.length > 4 ? 1.0 : 0.75, x0: hero.x, y0: hero.y, x1: tx, y1: ty, h: t.length > 4 ? 6 : 3.6}; sfx('swing'); haptic('medium'); break; } }
  }
}
function heroAir(dt){
  const a = hero.air; a.t += dt; const k = Math.min(1, a.t/a.dur);
  hero.x = a.x0 + (a.x1 - a.x0)*k; hero.y = a.y0 + (a.y1 - a.y0)*k; hero.lift = -Math.sin(k*Math.PI)*a.h*ZS; hero.iframe = 0.1;
  hero.moving = true; hero.walkPx = (hero.walkPx || 0) + 0;
  if (k >= 1){ hero.air = null; hero.lift = 0; hero.trampCD = 0.45; if (blocked(hero.x, hero.y, 0.45)){ const p = freeNear(hero.x, hero.y, 0.45); hero.x = p[0]; hero.y = p[1]; } AUD.step(0.9); }
}
function drawLevelOverlay(cx){
  const L = LEVEL; if (!L) return;
  if (L.pit && L.flood > 0){   // water rising in the basin
    const p = L.pit, dep = 1.6*(1 - L.flood), q = (gx, gy) => { const w = lvW(L, gx, gy); return P(w[0], w[1], -dep); };
    cx.save(); cx.globalAlpha = 0.25 + 0.5*Math.min(1, L.flood*1.4); cx.fillStyle = '#3d86b8';
    cx.beginPath(); [q(p[0], p[1]), q(p[2], p[1]), q(p[2], p[3]), q(p[0], p[3])].forEach((v, i) => i ? cx.lineTo(v[0], v[1]) : cx.moveTo(v[0], v[1])); cx.closePath(); cx.fill();
    cx.globalAlpha = 0.25; cx.strokeStyle = '#cfe8ff'; cx.lineWidth = 1;
    for (let i = 0; i < 14; i++){ const gx = p[0] + ((i*7.3 + time*2.2)%(p[2] - p[0])), gy = p[1] + (i*5.1%(p[3] - p[1])); const v = q(gx, gy); cx.beginPath(); cx.ellipse(v[0], v[1], 6, 2, 0, 0, TAU); cx.stroke(); }
    cx.restore();
  }
  if (L.noiseFx > 0){ const s = P(hero.x, hero.y, 0), r = (0.5 - L.noiseFx)*90 + 10; cx.save(); cx.globalAlpha = L.noiseFx*1.4; cx.strokeStyle = '#ffd0a0'; cx.lineWidth = 1.2; cx.beginPath(); cx.ellipse(s[0], s[1], r, r*0.5, 0, 0, TAU); cx.stroke(); cx.restore(); }
}
function drawLevelBeam(cx){
  const L = LEVEL; if (!L) return;
  if (L.beam){   // projector beam cone
    const b = L.beam, o = lvW(L, L.beamAt[0], L.beamAt[1]), s0 = P(o[0], o[1], 2.2);
    const end = a => { const w = lvW(L, L.beamAt[0] + Math.cos(a)*55, L.beamAt[1] + Math.sin(a)*55); return P(w[0], w[1], 0); };
    const e1 = end(b.ang - 0.13), e2 = end(b.ang + 0.13), em = end(b.ang);
    cx.save(); cx.globalCompositeOperation = 'lighter';
    const g = cx.createLinearGradient(s0[0], s0[1], em[0], em[1]); g.addColorStop(0, 'rgba(255,250,220,.55)'); g.addColorStop(1, 'rgba(255,250,220,0)');
    cx.fillStyle = g; cx.beginPath(); cx.moveTo(s0[0], s0[1]); cx.lineTo(e1[0], e1[1]); cx.lineTo(e2[0], e2[1]); cx.closePath(); cx.fill(); cx.restore();
  }
}
function beamLights(){ const L = LEVEL; if (!L || !L.beam) return []; const out = [];
  for (let d = 8; d < 52; d += 11){ const w = lvW(L, L.beamAt[0] + Math.cos(L.beam.ang)*d, L.beamAt[1] + Math.sin(L.beam.ang)*d), s = P(w[0], w[1], 0); out.push({x: s[0], y: s[1], r: 40 + d*0.8, i: 1}); }
  return out; }
