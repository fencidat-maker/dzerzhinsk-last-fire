// ---------------------------------------------------------------- interior levels (ТЦ «Дзержинец»)
// An interior lives far away from the city in the same world space (grid offset OX/OY), so the usual
// systems (zombies, pickups, quests, projection) work unchanged; collision, background, light and map are swapped.
const LEVELS = {mall: __MALL__, pool: __POOL__, cinema: __JV__};
LEVELS.mall.outside = LEVELS.mall.outside || 'mall'; LEVELS.mall.enter = LEVELS.mall.enter || 'm_enter';
const PIT_D = 5.0;                        // depth of the bowl, z-units
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
  if (L.pit){ const p = L.pit;
    if (MOVER && MOVER.T){ if (MOVER.trapped && !(X > p[0] + 0.5 && X < p[2] - 0.5 && Y > p[1] + 0.5 && Y < p[3] - 0.5)) return true; }   // the bowl is too deep to climb out
    else if (X > p[0] - r - 0.3 && X < p[2] + r + 0.3 && Y > p[1] - r - 0.3 && Y < p[3] + r + 0.3) return true;                          // nobody steps over the rim
  }
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
    LEVEL = L; L.cityPos = [hero.x, hero.y]; document.body.classList.toggle('sneakable', !!L.pit); L.off = {}; L.flood = 0; L.flooding = false; L.beam = null; L.valveOpen = {}; L.woke = false;
    zombies.length = 0; footprints.length = 0; fires.length = 0; bullets.length = 0; spits.length = 0;
    const p = POI[L.enter]; hero.x = p[0]; hero.y = p[1]; hero.vx = hero.vy = 0; hero.air = null;
    for (const s of L.spawns){ const w = lvW(L, s[0], s[1]); MOVER = {T: 1}; const q = freeNear(w[0], w[1], 0.5); MOVER = null; const z = makeZombie(s[2], q[0], q[1]); z.keep = true; z.alert = 0; z.still = Math.random() < 0.5;
      if (L.pit && inPit(z.x, z.y)){ z.sleep = true; z.still = true; z.trapped = true; } }
    if (L.pit){   // the bowl is packed with sleepers: flooding it is the whole point
      const pp = L.pit, types = ['walker', 'walker', 'walker', 'walker', 'walker', 'runner', 'runner', 'brute', 'chemist'];
      let seed = 7; const rnd = () => (seed = (seed*16807)%2147483647)/2147483647;
      for (let n = 0; n < 40; n++){
        const w = lvW(L, pp[0] + 1.5 + rnd()*(pp[2] - pp[0] - 3), pp[1] + 1.5 + rnd()*(pp[3] - pp[1] - 3)); MOVER = {T: 1}; const q = freeNear(w[0], w[1], 0.5); MOVER = null;
        if (!inPit(q[0], q[1])) continue;
        const z = makeZombie(types[Math.floor(rnd()*types.length)], q[0], q[1]); z.keep = true; z.alert = 0; z.sleep = true; z.still = true; z.trapped = true; }
    }
    Quests.updateUI();
    toast(L.title || {mall: 'ТЦ «Дзержинец»', pool: 'Бассейн «Заря»', cinema: '«Жюль Верн»'}[id], 2.5);
  };
  silent ? go() : fadeScreen(go);
}
let LEVEL_LAST = null;
function leaveLevel(silent){
  if (!LEVEL) return;
  LEVEL_LAST = LEVEL;
  const go = () => {
    LEVEL = null; AUD.water(0); document.body.classList.remove('sneakable'); if (hero.sneak) setSneak(false); zombies.length = 0; bullets.length = 0; spits.length = 0; fires.length = 0;
    setTimeout(() => Quests.updateUI(), 0);
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
  if (L.pit && hero.moving && noiseT <= 0){ const sprint = (input.sprint || keys['shift']) && !hero.sneak; makeNoise(hero.x, hero.y, hero.sneak ? 1.3 : sprint ? 16 : 6.5); noiseT = 0.35; if (!hero.sneak) L.noiseFx = sprint ? 0.5 : 0.25; }
  if (L.noiseFx > 0) L.noiseFx -= dt;
  // flooding the basin: each opened valve lets some water in, the last one opens the sluice
  if (L.pit){
    const opened = Object.values(L.valveOpen || {}).filter(Boolean).length, target = L.flooding ? 1 : opened*0.09;
    if (L.flood < target) L.flood = Math.min(target, L.flood + dt/(L.flooding ? 9 : 14));
    AUD.water(L.flood > 0 && L.flood < 1 ? 0.35 + 0.5*Math.min(1, opened/3) : 0);
    if (L.flood > 0.55) for (const z of zombies){ if (!z.dead && z.hp > 0 && z.trapped){ z.hp -= (z.maxHp/2.2)*dt; z.slowW = 1; if (z.hp <= 0){ z.drown = true; killZombie(z); } } }
    for (const z of zombies) z.lift = z.trapped ? PIT_D*ZS : 0;
  }
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
  if (k >= 1){ hero.air = null; hero.lift = 0; hero.trampCD = 0.45; if (blocked(hero.x, hero.y, 0.45)){ const p = freeNear(hero.x, hero.y, 0.45); hero.x = p[0]; hero.y = p[1]; } AUD.step(0.35); }
}
function drawLevelOverlay(cx){
  const L = LEVEL; if (!L) return;
  if (L.pit && (L.flood > 0 || Object.values(L.valveOpen || {}).some(Boolean))){   // water in the bowl
    const p = L.pit, q = (gx, gy, z) => { const w = lvW(L, gx, gy); return P(w[0], w[1], z); };
    const lvl = -PIT_D*(1 - L.flood), fl = -PIT_D;
    const rim = [[p[0], p[1]], [p[2], p[1]], [p[2], p[3]], [p[0], p[3]]];
    cx.save(); cx.beginPath(); rim.forEach((v, i) => { const s = q(v[0], v[1], 0); i ? cx.lineTo(s[0], s[1]) : cx.moveTo(s[0], s[1]); }); cx.closePath(); cx.clip();
    if (L.flood > 0.003){
      const body = new Path2D(), poly = (arr) => { arr.forEach((s, i) => i ? body.lineTo(s[0], s[1]) : body.moveTo(s[0], s[1])); body.closePath(); };
      poly(rim.map(v => q(v[0], v[1], lvl)));
      for (let k = 0; k < 4; k++){ const a = rim[k], b = rim[(k + 1)%4]; poly([q(a[0], a[1], lvl), q(b[0], b[1], lvl), q(b[0], b[1], fl), q(a[0], a[1], fl)]); }
      const top = q(p[0], p[1], 0), bot = q(p[2], p[3], fl);
      const g = cx.createLinearGradient(0, top[1], 0, bot[1]); g.addColorStop(0, 'rgba(120,196,224,.82)'); g.addColorStop(1, 'rgba(26,86,128,.9)');
      cx.fillStyle = g; cx.fill(body);
      // surface: moving wave lines, glints and foam at the walls
      cx.save(); const sp = rim.map(v => q(v[0], v[1], lvl)); cx.beginPath(); sp.forEach((s, i) => i ? cx.lineTo(s[0], s[1]) : cx.moveTo(s[0], s[1])); cx.closePath(); cx.clip();
      cx.lineWidth = 1; cx.strokeStyle = 'rgba(220,244,255,.38)';
      for (let i = 0; i < 26; i++){ const gy = p[1] + 0.9 + i*((p[3] - p[1] - 1.8)/25), a = q(p[0], gy, lvl), b = q(p[2], gy, lvl);
        cx.beginPath(); for (let t = 0; t <= 24; t++){ const u = t/24, x = a[0] + (b[0] - a[0])*u, y = a[1] + (b[1] - a[1])*u + Math.sin(u*22 + time*2.6 + i*1.7)*(1.2 + (1 - L.flood)*0.8); t ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); }
      cx.fillStyle = 'rgba(255,255,255,.55)';
      for (let i = 0; i < 40; i++){ if (Math.sin(time*3 + i*9.1) < 0.55) continue; const s = q(p[0] + ((i*13.7)%(p[2] - p[0])), p[1] + ((i*7.9)%(p[3] - p[1])), lvl); cx.fillRect(s[0], s[1], 2, 1); }
      cx.restore();
      cx.lineWidth = 2.4; cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.setLineDash([5, 4]); cx.lineDashOffset = -time*14;
      cx.beginPath(); rim.forEach((v, i) => { const s = q(v[0], v[1], lvl); i ? cx.lineTo(s[0], s[1]) : cx.moveTo(s[0], s[1]); }); cx.closePath(); cx.stroke(); cx.setLineDash([]);
    }
    // inflow from every opened valve: a pipe jet arcing into the bowl, a sheet down the wall, rings on the surface
    for (const k in L.pois){ if (!L.valveOpen || !L.valveOpen[k] || k.slice(0, 3) !== 'p_v') continue;
      const v = L.pois[k], tx = Math.max(p[0] + 0.4, Math.min(p[2] - 0.4, v[0])), ty = Math.max(p[1] + 0.4, Math.min(p[3] - 0.4, v[1]));
      const ez = Math.max(lvl, fl + 0.2), a0 = q(v[0], v[1], 1.4), edge = q(tx, ty, 0), land = q(tx, ty, ez);
      cx.strokeStyle = 'rgba(190,230,250,.75)'; cx.lineWidth = 3.2; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(edge[0], edge[1]); cx.lineTo(land[0], land[1]); cx.stroke();
      cx.strokeStyle = 'rgba(255,255,255,.7)'; cx.lineWidth = 1.2; cx.setLineDash([6, 5]); cx.lineDashOffset = -time*60; cx.beginPath(); cx.moveTo(edge[0] + 1, edge[1]); cx.lineTo(land[0] + 1, land[1]); cx.stroke(); cx.setLineDash([]);
      cx.fillStyle = 'rgba(235,248,255,.8)';
      for (let n = 0; n < 7; n++){ const u = ((time*1.6 + n/7)%1), x = a0[0] + (edge[0] - a0[0])*u, y = a0[1] + (edge[1] - a0[1])*u - Math.sin(u*Math.PI)*9; cx.fillRect(x - 1, y - 1, 2.2, 2.2); }
      for (let n = 0; n < 3; n++){ const u = (time*1.1 + n/3 + k.length*0.13)%1; cx.strokeStyle = 'rgba(230,246,255,' + (0.6*(1 - u)) + ')'; cx.lineWidth = 1.2; cx.beginPath(); cx.ellipse(land[0], land[1], 4 + u*20, 1.6 + u*8, 0, 0, TAU); cx.stroke(); }
    }
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
