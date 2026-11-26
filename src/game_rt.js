// ====================================================================== game systems
const $ = id => document.getElementById(id);

// ---------------------------------------------------------------- collision
const WB = WORLD.bounds;
function blocked(x, y, r, ignoreOwn){
  if (LEVEL) return levelBlocked(x, y, r);
  if (x < WB[0] + 4 || x > WB[2] - 4 || y < WB[1] + 4 || y > WB[3] - 4) return true;
  const nb = nearBuildings(x, y, r + 1);
  for (const b of nb){
    if (x < b.minx - r || x > b.maxx + r || y < b.miny - r || y > b.maxy + r) continue;
    if (inPoly(x, y, b.p)) return true;
    const p = b.p;
    for (let i = 0; i < p.length; i++){ const q = p[(i + 1)%p.length]; if (distSeg(x, y, p[i][0], p[i][1], q[0], q[1]) < r) return true; }
  }
  if (colMask(x, y, r)) return true;
  if (CARS.length && carBlocks(x, y, r, ignoreOwn)) return true;
  for (const o of objsInRect(x - 3, y - 3, x + 3, y + 3)){
    if (o.dead || !o.r || o.t === 'lamp' || o === ignoreOwn) continue;
    if (Math.hypot(x - o.x, y - o.y) < r + o.r) return true;
  }
  return false;
}
function freeNear(x, y, r){
  r = r || 0.5; if (!blocked(x, y, r)) return [x, y];
  for (let rad = 0.8; rad < 25; rad += 0.8) for (let a = 0; a < TAU; a += 0.45){ const nx = x + Math.cos(a)*rad, ny = y + Math.sin(a)*rad; if (!blocked(nx, ny, r)) return [nx, ny]; }
  return [x, y];
}
function losClear(x0, y0, x1, y1){
  if (LEVEL) return levelLos(x0, y0, x1, y1);
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d/1.2);
  for (let i = 1; i < n; i++){ const t = i/n, x = x0 + (x1 - x0)*t, y = y0 + (y1 - y0)*t; for (const b of nearBuildings(x, y, 1)){ if (b.top > 2.5 && x > b.minx && x < b.maxx && y > b.miny && y < b.maxy && inPoly(x, y, b.p)) return false; } }
  return true;
}
// ---- footprints in the snow + screen-distance step counter
const footprints = [];
const SCREEN_REF = (() => { const g = unrot(1, 0), l = Math.hypot(g[0], g[1]) || 1, a = P(g[0]/l, g[1]/l, 0), b = P(0, 0, 0); return Math.hypot(a[0] - b[0], a[1] - b[1]); })();
function stepTrack(e, ox, oy, stride){
  const dx = e.x - ox, dy = e.y - oy, d = Math.hypot(dx, dy); if (d < 1e-4) return;
  const a = P(e.x, e.y, 0), b = P(ox, oy, 0); e.walkPx = (e.walkPx || 0) + Math.hypot(a[0] - b[0], a[1] - b[1]);
  e.fpD = (e.fpD || 0) + d;
  if (e.fpD > stride){ e.fpD = 0; e.fpSide = -(e.fpSide || 1); if (e === hero) AUD.step(0.5); else if (e.T && (e.type === 'brute' || e.type === 'boss')) AUD.at('step' + ((Math.random()*6)|0), e.x, e.y, 0.55, 16, 0.7);
    const nx = -dy/d, ny = dx/d, o = 0.42*e.fpSide;
    if (!LEVEL) footprints.push({x: e.x + nx*o, y: e.y + ny*o, dx: dx/d, dy: dy/d, t: 0});
    if (footprints.length > 500) footprints.splice(0, footprints.length - 500);
  }
}
function moveEntity(e, dx, dy, r){
  MOVER = e;
  let nx = e.x + dx, ny = e.y + dy;
  if (!blocked(nx, ny, r)){ e.x = nx; e.y = ny; return true; }
  if (!blocked(nx, e.y, r)){ e.x = nx; return true; }
  if (!blocked(e.x, ny, r)){ e.y = ny; return true; }
  const l = Math.hypot(dx, dy) || 1;
  for (const a of [0.6, -0.6, 1.2, -1.2]){ const ca = Math.cos(a), sa = Math.sin(a); const rx = e.x + (dx*ca - dy*sa), ry = e.y + (dx*sa + dy*ca); if (!blocked(rx, ry, r)){ e.x = rx; e.y = ry; return true; } }
  if (colAtP(...P(e.x, e.y, 0)) && !colAtP(...P(nx, ny, 0)) || colAtP(...P(e.x, e.y, 0)) && colDepth(e.x, e.y) > colDepth(nx, ny)){ e.x = nx; e.y = ny; return true; }   // stuck inside a painted prop: let it walk out
  return false;
}

// ---------------------------------------------------------------- state
const WEAPONS = {
  crowbar: {name: 'Монтировка', melee: true, dmg: 34, range: 2.6, rate: 0.5},
  pm:      {name: 'ПМ',          dmg: 24, rate: 0.26, range: 32, mag: 8,  reload: 1.1, spread: 0.04, ammo: '9мм', speed: 95},
  obrez:   {name: 'Обрез',       dmg: 13, rate: 0.85, range: 17, mag: 2,  reload: 1.5, spread: 0.24, pellets: 6, ammo: '12к', speed: 80},
  ak:      {name: 'АК-74',       dmg: 21, rate: 0.1,  range: 38, mag: 30, reload: 1.9, spread: 0.07, ammo: '5,45', speed: 110, auto: true},
  tozz:    {name: 'ТОЗ-8',       dmg: 70, rate: 0.75, range: 55, mag: 5,  reload: 1.6, spread: 0.01, ammo: '.22', speed: 120},
  molotov: {name: 'Коктейль',    throw: true, dmg: 90, rate: 1.0, range: 20, ammo: 'мол', mag: 1, reload: 0.4}
};
const S = {
  hp: 100, maxHp: 100, stamina: 100, coins: 0, kills: 0,
  owned: ['crowbar'], cur: 'crowbar', mag: {}, ammo: {'9мм': 0, '12к': 0, '5,45': 0, '.22': 0, 'мол': 0}, med: 0,
  items: {}, dead: false, slow: 0
};
const hero = {x: 0, y: 0, dir: 'd', step: 0, moving: false, aim: 0, vx: 0, vy: 0, fireT: 0, reloadT: 0, hitFlash: 0, muzzle: 0, dyn: true, isHero: true, hgt: 2};
const input = {x: 0, y: 0, fire: false, sprint: false, aimX: null, aimY: null};
let time = 0, running = false;
const zombies = [], bullets = [], parts = [], pickups = [], npcs = {}, floaters = [], spits = [], fires = [];
let zombieCap = 14, safeX = 0, safeY = 0;

function giveWeapon(id, ammo){
  if (!S.owned.includes(id)) S.owned.push(id);
  const w = WEAPONS[id]; if (w.mag != null && S.mag[id] == null) S.mag[id] = w.mag;
  if (ammo && w.ammo) S.ammo[w.ammo] += ammo;
  hud();
}
function curW(){ return WEAPONS[S.cur]; }
function switchWeapon(dir){
  const i = S.owned.indexOf(S.cur); S.cur = S.owned[(i + (dir || 1) + S.owned.length)%S.owned.length]; hero.reloadT = 0; hud(); sfx('click');
}

// ---------------------------------------------------------------- sound (tiny synth)
let AC = null;
function sfx(kind){
  if (typeof AUD !== 'undefined' && AUD.sfxKind(kind)) return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    const t = AC.currentTime, g = AC.createGain(); g.connect(AC.destination);
    if (kind === 'shot' || kind === 'shotgun' || kind === 'ak'){
      const len = kind === 'shotgun' ? 0.25 : 0.12, buf2 = AC.createBuffer(1, AC.sampleRate*len, AC.sampleRate), d = buf2.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/d.length, kind === 'shotgun' ? 2 : 3);
      const s = AC.createBufferSource(); s.buffer = buf2; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = kind === 'ak' ? 2400 : 1800; s.connect(f); f.connect(g); g.gain.value = 0.25; s.start(t);
    } else {
      const o = AC.createOscillator(); o.connect(g);
      if (kind === 'hit'){ o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.12); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14); o.start(t); o.stop(t + 0.15); }
      else if (kind === 'hurt'){ o.type = 'square'; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.2); g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22); o.start(t); o.stop(t + 0.25); }
      else if (kind === 'pick'){ o.type = 'triangle'; o.frequency.setValueAtTime(520, t); o.frequency.setValueAtTime(780, t + 0.07); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.start(t); o.stop(t + 0.2); }
      else if (kind === 'click'){ o.type = 'square'; o.frequency.value = 420; g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); o.start(t); o.stop(t + 0.06); }
      else if (kind === 'quest'){ o.type = 'triangle'; o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(660, t + 0.1); o.frequency.setValueAtTime(880, t + 0.2); g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45); o.start(t); o.stop(t + 0.5); }
      else if (kind === 'boom'){ o.type = 'sawtooth'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.4); g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45); o.start(t); o.stop(t + 0.5); }
    }
  } catch (_) {}
}
function haptic(k){ try { const h = window.Telegram.WebApp.HapticFeedback; if (h) h.impactOccurred(k || 'light'); } catch (_) {} }

// ---------------------------------------------------------------- effects
function spawnPart(x, y, z, col, n, spd, life){
  for (let i = 0; i < n; i++){ const a = Math.random()*TAU, s = (0.4 + Math.random())*spd; parts.push({x, y, z, vx: Math.cos(a)*s, vy: Math.sin(a)*s, vz: 2 + Math.random()*4, col, life: life*(0.6 + Math.random()*0.6), t: 0}); }
}
function floater(x, y, txt, col){ floaters.push({x, y, txt, col: col || '#fff', t: 0}); }

// ---------------------------------------------------------------- zombies
function makeZombie(type, x, y){
  const T = ZTYPES[type], pals = ZPALS[type], z = {type, T, x, y, hp: T.hp, maxHp: T.hp, dir: 'd', step: Math.random()*4, cool: 0, wander: Math.random()*6, wa: Math.random()*TAU, flash: 0, dyn: true, hgt: 2*T.u, pal: pals[Math.floor(Math.random()*pals.length)], spitT: 2 + Math.random()*2, stuck: 0, vx: 0, vy: 0, kb: 0, burn: 0, spawnT: 0};
  z.draw = (c, sx, sy) => {
    const fr = Math.floor(z.step)%4;
    if (!drawZombiePuppet(c, z)) drawChar(c, sx, sy, z.pal, z.dir, fr, T.u, {zombie: true, flash: z.flash > 0, bobY: Math.sin(time*5 + z.wander)*0.4});
    if (z.hp < z.maxHp){ const w = 14*T.u; c.fillStyle = '#1d1528'; c.fillRect(Math.round(sx - w/2) - 1, Math.round(sy - 26*T.u) - 1, w + 2, 4); c.fillStyle = '#5a1f24'; c.fillRect(Math.round(sx - w/2), Math.round(sy - 26*T.u), w, 2); c.fillStyle = T.boss ? '#e8b04a' : '#d94c3a'; c.fillRect(Math.round(sx - w/2), Math.round(sy - 26*T.u), w*z.hp/z.maxHp, 2); }
    if (z.burn > 0){ c.fillStyle = (Math.floor(time*12)%2) ? '#ffb23a' : '#ff6a2a'; c.fillRect(Math.round(sx) - 2, Math.round(sy - 22*T.u) - 3, 4, 5); }
  };
  zombies.push(z); return z;
}
function screenDirOf(wx, wy){ const a = P(wx, wy, 0), b = P(0, 0, 0), dx = a[0] - b[0], dy = a[1] - b[1]; return Math.abs(dx) > Math.abs(dy)*1.15 ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u'); }
function fireList(){
  const L = [];
  if (typeof FIRES !== 'undefined'){ if (!firesInit) initFires(); for (const f of FIRES) L.push({x: f.wx, y: f.wy, R: 3.2 + Math.min(3, (f.s || 20)/18)}); }
  for (const f of fires) L.push({x: f.x, y: f.y, R: 3.2});
  if (flameLit) L.push({x: POI.flame[0], y: POI.flame[1], R: 6});
  return L;
}
let FIRE_CACHE = null, FIRE_CACHE_T = -1;
function nearestFire(x, y){
  if (FIRE_CACHE_T !== time){ FIRE_CACHE = fireList(); FIRE_CACHE_T = time; }
  let best = null, bd = 1e9; for (const f of FIRE_CACHE){ const d = Math.hypot(x - f.x, y - f.y) - f.R; if (d < bd){ bd = d; best = f; } }
  return bd < 4 ? best : null;
}
function updateZombies(dt){
  for (let i = zombies.length - 1; i >= 0; i--){
    const z = zombies[i], T = z.T;
    z.flash = Math.max(0, z.flash - dt); z.cool = Math.max(0, z.cool - dt); z.atkT = Math.max(0, (z.atkT || 0) - dt);
    const dx = hero.x - z.x, dy = hero.y - z.y, d = Math.hypot(dx, dy);
    if (d > 150 && !z.keep){ zombies.splice(i, 1); continue; }
    if (z.burn > 0){ z.burn -= dt; z.hp -= 18*dt; if (z.hp <= 0){ killZombie(z, i); continue; } }
    if (z.spawnT < 0.6){ z.spawnT += dt; }
    let mvx = 0, mvy = 0, sp = T.spd*SPD_S;
    if (LEVEL){ const fl = levelFloor(z.x, z.y); if (fl === 'balls') sp *= 0.45; else if (fl === 'pit') sp *= 0.6; }
    if (z.sleep){ z.depth = depthOf(z.x, z.y); continue; }
    if (z.wakeT > 0){ z.wakeT -= dt; z.depth = depthOf(z.x, z.y); continue; }
    const chasing = !S.dead && (d < T.sight*(LEVEL ? 0.45 : 1) && (d < 9 || losClear(z.x, z.y, hero.x, hero.y)) || z.alert > 0 || z.boss);
    if (z.alert > 0) z.alert -= dt;
    if (hero.air) { /* can't reach a flying hero */ }
    if (chasing){
      const l = d || 1; mvx = dx/l; mvy = dy/l;
      if (T.spit && d < 15 && d > 5){ mvx = mvy = 0; z.spitT -= dt; if (z.spitT <= 0 && losClear(z.x, z.y, hero.x, hero.y)){ z.spitT = 2.6; z.atkT = 0.4; z.fx = dx; z.fy = dy; const a = Math.atan2(dy, dx); spits.push({x: z.x, y: z.y, vx: Math.cos(a)*13, vy: Math.sin(a)*13, life: 1.6}); } }
      if (d < T.r + (hero.inCar ? 2.4 : 1.05)){ mvx = mvy = 0; if (z.cool <= 0){ z.cool = 0.9; z.atkT = 0.35; z.fx = dx; z.fy = dy; AUD.at('zattack', z.x, z.y, 0.7, 20, z.type === 'brute' || z.type === 'boss' ? 0.8 : 1); hurtHero(T.dmg*(z.hardness || 1), T.chill); hero.vx += dx/(d||1)*2; hero.vy += dy/(d||1)*2; z.dir = screenDirOf(dx, dy); } }
    } else {
      z.wander -= dt; if (z.wander <= 0){ z.wander = 2 + Math.random()*4; z.wa = Math.random()*TAU; z.still = Math.random() < 0.35; }
      if (!z.still){ mvx = Math.cos(z.wa); mvy = Math.sin(z.wa); sp *= 0.4; }
    }
    // fear of fire: zombies stop at the edge of firelight; frenzied wave zombies push in but burn
    { const f = nearestFire(z.x, z.y);
      if (f && !z.boss){
        const fx = z.x - f.x, fy = z.y - f.y, fd = Math.hypot(fx, fy) || 0.01, edge = f.R + 2.5;
        if (fd < edge){
          let wgt = Math.min(1, (edge - fd)/2.5); if (z.frenzy) wgt *= 0.3;
          const ax = fx/fd, ay = fy/fd, toward = mvx*(-ax) + mvy*(-ay);
          if (toward > 0){ mvx += ax*toward*wgt*1.6; mvy += ay*toward*wgt*1.6; }   // cancel the step into the fire
          if (fd < f.R){ mvx += ax*wgt*1.4; mvy += ay*wgt*1.4; if (!z.frenzy) sp = Math.max(sp, T.spd*1.1); }
          if (fd < f.R*0.7){ z.burn = Math.max(z.burn || 0, 0.6); }
          z.scared = 0.4;
        }
      }
    }
    if (z.scared > 0) z.scared -= dt;
    if (z.kb > 0){ z.kb -= dt; mvx = z.kvx; mvy = z.kvy; sp = 6*z.kb/0.2; }
    if (mvx || mvy){
      const ox = z.x, oy = z.y; moveEntity(z, mvx*sp*dt, mvy*sp*dt, T.r); stepTrack(z, ox, oy, 1.8);
      if (Math.hypot(z.x - ox, z.y - oy) < sp*dt*0.3){ z.stuck += dt; if (z.stuck > 0.5){ z.wa += 1.2 + Math.random()*2; z.stuck = 0; const a = Math.atan2(mvy, mvx) + (Math.random() < 0.5 ? 1.4 : -1.4); moveEntity(z, Math.cos(a)*2, Math.sin(a)*2, T.r); } } else z.stuck = 0;
      z.step += dt*(2 + sp*1.3)*0.55; z.dir = screenDirOf(mvx, mvy); if (!z.kb || z.kb <= 0){ z.fx = mvx; z.fy = mvy; }
    }
    // separation
    for (let j = i - 1; j >= Math.max(0, i - 14); j--){ const o = zombies[j], ddx = z.x - o.x, ddy = z.y - o.y, dd = Math.hypot(ddx, ddy), mr = T.r + o.T.r; if (dd < mr && dd > 0.01){ const push = (mr - dd)*0.5; z.x += ddx/dd*push; z.y += ddy/dd*push; o.x -= ddx/dd*push; o.y -= ddy/dd*push; } }
    z.depth = depthOf(z.x, z.y);
    if (z.boss && !z.addT) z.addT = 6;
    if (z.boss){ z.addT -= dt; if (z.addT <= 0){ z.addT = 9; for (let k = 0; k < 2; k++){ const a = Math.random()*TAU; const p = freeNear(z.x + Math.cos(a)*5, z.y + Math.sin(a)*5, 0.5); const nz = makeZombie('walker', p[0], p[1]); nz.alert = 12; nz.questTag = z.questTag; } } }
  }
}
function killZombie(z, idx){
  const i = idx != null ? idx : zombies.indexOf(z); if (i < 0) return;
  zombies.splice(i, 1); S.kills++; AUD.at('zdie', z.x, z.y, 0.75, 30, z.type === 'brute' || z.type === 'boss' ? 0.8 : 1);
  spawnPart(z.x, z.y, 1.2, z.type === 'chemist' ? '#9bd44a' : '#8a1f2a', 14, 5, 0.7);
  corpses.push({x: z.x, y: z.y, pal: z.pal, T: z.T, t: 0, dir: z.dir, type: z.type, fx: z.fx, fy: z.fy});
  if (corpses.length > 40) corpses.shift();
  const r = Math.random();
  if (r < 0.11) pickups.push({x: z.x, y: z.y, kind: 'ammo', t: 0}); else if (r < 0.17) pickups.push({x: z.x, y: z.y, kind: 'med', t: 0}); else if (r < 0.55) pickups.push({x: z.x, y: z.y, kind: 'coin', v: z.T.coin, t: 0});
  if (z.T.boss){ for (let k = 0; k < 6; k++) pickups.push({x: z.x + (Math.random() - 0.5)*5, y: z.y + (Math.random() - 0.5)*5, kind: 'coin', v: 20, t: 0}); pickups.push({x: z.x, y: z.y, kind: 'med', t: 0}); }
  if (Quests.onKill) Quests.onKill(z);
  hud();
}
const corpses = [];
function hurtHero(d, chill){
  if (S.dead || hero.iframe > 0) return;
  if (hero.inCar && driving){ driving.hp -= d*0.45; driving.shake = 0.2; hero.iframe = 0.3; sfx('hit'); haptic('light'); return; }
  S.hp -= d; hero.hitFlash = 0.18; hero.hurtT = 0.22; hero.iframe = 0.35; sfx('hurt'); haptic('medium'); if (chill) S.slow = 2.2;
  spawnPart(hero.x, hero.y, 1.4, '#a02a34', 6, 3, 0.5);
  if (S.hp <= 0){ S.hp = 0; S.dead = true; onDeath(); }
  hud();
}
// spawner
function spawnTick(dt){
  spawnTick.t = (spawnTick.t || 0) - dt; if (spawnTick.t > 0) return; spawnTick.t = 0.45;
  if (zombies.length >= zombieCap || S.dead || LEVEL) return;
  for (let k = 0; k < 6; k++){
    const a = Math.random()*TAU, dist = 62 + Math.random()*40, x = hero.x + Math.cos(a)*dist, y = hero.y + Math.sin(a)*dist;
    if (blocked(x, y, 0.6)) continue;
    if (Math.hypot(x - safeX, y - safeY) < 55) continue;
    if (zombies.some(o => Math.hypot(o.x - x, o.y - y) < 4)) continue;
    const r = Math.random(); let type = 'walker';
    const danger = Math.min(1, (S.kills + Quests.progressCount())/60);
    if (r < 0.14 + danger*0.1) type = 'runner'; else if (r < 0.22 + danger*0.12) type = 'frost'; else if (r < 0.28 + danger*0.12) type = 'chemist'; else if (r < 0.33 + danger*0.1) type = 'brute';
    makeZombie(type, x, y); break;
  }
}

// ---------------------------------------------------------------- shooting
function nearestTarget(range, cone){
  let best = null, bd = 1e9;
  for (const z of zombies){
    const dx = z.x - hero.x, dy = z.y - hero.y, d = Math.hypot(dx, dy);
    if (d > range) continue;
    let score = d;
    if (cone){ const da = Math.abs(((Math.atan2(dy, dx) - hero.aim + Math.PI*3)%TAU) - Math.PI); if (da > cone) score += 50; }
    if (!losClear(hero.x, hero.y, z.x, z.y)) score += 100;
    if (score < bd){ bd = score; best = z; }
  }
  return bd < 100 ? best : null;
}
function fire(){
  const w = curW(); if (S.dead || hero.fireT > 0 || hero.reloadT > 0) return;
  if (w.melee){
    hero.fireT = w.rate; hero.swing = 0.2; hero.atkT = hero.atkDur = 0.4; sfx('swing'); if (LEVEL) makeNoise(hero.x, hero.y, 6);
    const tgt = nearestTarget(w.range + 1.2, 1.6);
    if (tgt) hero.aim = Math.atan2(tgt.y - hero.y, tgt.x - hero.x);
    let hit = false;
    for (const z of zombies){ const dx = z.x - hero.x, dy = z.y - hero.y, d = Math.hypot(dx, dy); if (d < w.range + z.T.r){ const da = Math.abs(((Math.atan2(dy, dx) - hero.aim + Math.PI*3)%TAU) - Math.PI); if (da < 1.2){ damageZombie(z, w.dmg, hero.aim); hit = true; } } }
    return;
  }
  if (w.throw){
    if (S.ammo['мол'] <= 0){ toast('Нет коктейлей'); hero.fireT = 0.3; return; }
    const tgt = nearestTarget(w.range, 2.4); let tx, ty;
    if (tgt){ tx = tgt.x; ty = tgt.y; hero.aim = Math.atan2(ty - hero.y, tx - hero.x); } else { tx = hero.x + Math.cos(hero.aim)*10; ty = hero.y + Math.sin(hero.aim)*10; }
    S.ammo['мол']--; hero.fireT = w.rate; hero.atkT = hero.atkDur = 0.36; bullets.push({mol: true, x: hero.x, y: hero.y, tx, ty, t: 0, dur: 0.6, z: 1.5}); sfx('swing'); hud(); return;
  }
  const id = S.cur;
  if ((S.mag[id] || 0) <= 0){ if (S.ammo[w.ammo] > 0) startReload(); else { toast('Нет патронов: ' + w.ammo); hero.fireT = 0.4; sfx('click'); } return; }
  const tgt = nearestTarget(w.range, 1.7);
  if (input.aimX != null){ hero.aim = input.aimA; }
  else if (tgt) hero.aim = Math.atan2(tgt.y - hero.y, tgt.x - hero.x);
  S.mag[id]--; hero.fireT = w.rate; hero.muzzle = 0.07; hero.atkT = hero.atkDur = Math.max(0.12, Math.min(0.26, w.rate*0.9)); sfx(id === 'obrez' ? 'shotgun' : id === 'ak' ? 'ak' : 'shot'); if (LEVEL) makeNoise(hero.x, hero.y, 60); haptic('light');
  const n = w.pellets || 1;
  for (let i = 0; i < n; i++){ const a = hero.aim + (Math.random() - 0.5)*2*w.spread; bullets.push({x: hero.x + Math.cos(a)*0.8, y: hero.y + Math.sin(a)*0.8, px: hero.x, py: hero.y, vx: Math.cos(a)*w.speed, vy: Math.sin(a)*w.speed, life: w.range/w.speed, dmg: w.dmg, a}); }
  hero.recoil = 0.1;
  alertNearby(hero.x, hero.y, 28);
  if (S.mag[id] <= 0 && S.ammo[w.ammo] > 0) startReload();
  hud();
}
function alertNearby(x, y, r){ for (const z of zombies) if (!z.alert && Math.hypot(z.x - x, z.y - y) < r) z.alert = 6; }
function startReload(){ const w = curW(); if (!w.mag || S.mag[S.cur] >= w.mag || S.ammo[w.ammo] <= 0 || hero.reloadT > 0) return; hero.reloadT = w.reload; hero.reloadFor = S.cur; toast('Перезарядка…', 0.8); sfx('click'); }
function finishReload(){
  const w = WEAPONS[hero.reloadFor]; if (!w) return; const need = w.mag - (S.mag[hero.reloadFor] || 0), take = Math.min(need, S.ammo[w.ammo]);
  S.mag[hero.reloadFor] = (S.mag[hero.reloadFor] || 0) + take; S.ammo[w.ammo] -= take; hud();
}
function damageZombie(z, dmg, ang){
  if (z.sleep){ z.sleep = false; z.still = false; z.alert = 10; if (LEVEL) makeNoise(z.x, z.y, 10); }
  z.hp -= dmg; z.flash = 0.08; z.alert = 8; z.kb = 0.12; z.kvx = Math.cos(ang); z.kvy = Math.sin(ang);
  sfx('hit'); spawnPart(z.x, z.y, 1.4, z.type === 'chemist' ? '#9bd44a' : '#8a1f2a', 4, 3, 0.4);
  if (z.hp <= 0) killZombie(z);
}
function updateBullets(dt){
  for (let i = bullets.length - 1; i >= 0; i--){
    const b = bullets[i];
    if (b.mol){
      b.t += dt; const k = b.t/b.dur; b.x = hero.x + (b.tx - hero.x)*Math.min(1, k) ; b.y = hero.y + (b.ty - hero.y)*Math.min(1, k); b.z = 1.5 + Math.sin(Math.min(1, k)*Math.PI)*4;
      if (k >= 1){ bullets.splice(i, 1); fires.push({x: b.tx, y: b.ty, t: 0, life: 5}); sfx('boom'); spawnPart(b.tx, b.ty, 1, '#ff8a2a', 20, 6, 0.9); for (const z of zombies) if (Math.hypot(z.x - b.tx, z.y - b.ty) < 4.5) { damageZombie(z, 60, Math.atan2(z.y - b.ty, z.x - b.tx)); z.burn = 4; } alertNearby(b.tx, b.ty, 40); }
      continue;
    }
    b.px = b.x; b.py = b.y;
    const steps = 3; let dead = false;
    for (let s = 0; s < steps && !dead; s++){
      b.x += b.vx*dt/steps; b.y += b.vy*dt/steps;
      for (const z of zombies){ if (Math.hypot(z.x - b.x, z.y - b.y) < z.T.r + 0.35){ damageZombie(z, b.dmg, b.a); dead = true; break; } }
      if (!dead){ for (const o of nearBuildings(b.x, b.y, 0.5)){ if (b.x > o.minx && b.x < o.maxx && b.y > o.miny && b.y < o.maxy && inPoly(b.x, b.y, o.p) && o.top > 2.2){ dead = true; spawnPart(b.x, b.y, 1.4, '#ffe9a0', 3, 3, 0.25); break; } } }
      if (!dead && Quests.onShot && Quests.onShot(b)) dead = true;
    }
    b.life -= dt; if (dead || b.life <= 0) bullets.splice(i, 1);
  }
  for (let i = spits.length - 1; i >= 0; i--){
    const s = spits[i]; s.x += s.vx*dt; s.y += s.vy*dt; s.life -= dt;
    if (Math.hypot(s.x - hero.x, s.y - hero.y) < 0.9){ hurtHero(12); spits.splice(i, 1); spawnPart(s.x, s.y, 1, '#9bd44a', 6, 3, 0.5); continue; }
    if (s.life <= 0 || blocked(s.x, s.y, 0.2)) spits.splice(i, 1);
  }
  for (let i = fires.length - 1; i >= 0; i--){ const f = fires[i]; f.t += dt; if (f.t > f.life){ fires.splice(i, 1); continue; } for (const z of zombies) if (Math.hypot(z.x - f.x, z.y - f.y) < 3.5) z.burn = Math.max(z.burn, 1.5); }
  for (let i = parts.length - 1; i >= 0; i--){ const p = parts[i]; p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt; p.z += p.vz*dt; p.vz -= 14*dt; if (p.z < 0){ p.z = 0; p.vx *= 0.3; p.vy *= 0.3; p.vz = 0; } if (p.t > p.life) parts.splice(i, 1); }
  for (let i = floaters.length - 1; i >= 0; i--){ floaters[i].t += dt; if (floaters[i].t > 1.1) floaters.splice(i, 1); }
}
function updatePickups(dt){
  for (let i = pickups.length - 1; i >= 0; i--){
    const p = pickups[i]; p.t += dt; if (p.t > 60){ pickups.splice(i, 1); continue; }
    const d = Math.hypot(p.x - hero.x, p.y - hero.y);
    if (d < 5 && p.kind === 'coin'){ p.x += (hero.x - p.x)*Math.min(1, dt*6); p.y += (hero.y - p.y)*Math.min(1, dt*6); }
    if (d < 1.2){
      if (p.kind === 'coin'){ S.coins += p.v || 5; floater(p.x, p.y, '+' + (p.v || 5) + ' ₽', '#ffd36a'); }
      else if (p.kind === 'ammo'){ const owned = S.owned.filter(id => WEAPONS[id].ammo && id !== 'molotov'); const id = owned.length ? owned[Math.floor(Math.random()*owned.length)] : null; if (id){ const w = WEAPONS[id], n = Math.max(4, Math.round(w.mag*1.2)); S.ammo[w.ammo] += n; floater(p.x, p.y, '+' + n + ' ' + w.ammo, '#cfe39a'); } else { S.coins += 5; } }
      else if (p.kind === 'med'){ S.med++; floater(p.x, p.y, '+аптечка', '#ff8a8a'); }
      else if (p.kind === 'mol'){ S.ammo['мол'] += 2; floater(p.x, p.y, '+2 коктейля', '#ffb04a'); }
      sfx('pick'); pickups.splice(i, 1); hud();
    }
  }
}
function useMed(){ if (S.med > 0 && S.hp < S.maxHp && !S.dead){ S.med--; S.hp = Math.min(S.maxHp, S.hp + 55); floater(hero.x, hero.y, '+55 HP', '#ff8a8a'); sfx('pick'); hud(); } }

// ---------------------------------------------------------------- hero update
function updateHero(dt){
  hero.fireT = Math.max(0, hero.fireT - dt); hero.hitFlash = Math.max(0, hero.hitFlash - dt); hero.muzzle = Math.max(0, hero.muzzle - dt); hero.iframe = Math.max(0, (hero.iframe || 0) - dt); hero.swing = Math.max(0, (hero.swing || 0) - dt); hero.atkT = Math.max(0, (hero.atkT || 0) - dt); hero.hurtT = Math.max(0, (hero.hurtT || 0) - dt); if (S.dead) hero.deadT = (hero.deadT || 0) + dt; else hero.deadT = 0; hero.recoil = Math.max(0, (hero.recoil || 0) - dt);
  if (hero.reloadT > 0){ hero.reloadT -= dt; if (hero.reloadT <= 0) finishReload(); }
  if (S.slow > 0) S.slow -= dt;
  let ix = input.x, iy = input.y;
  if (keys['arrowleft'] || keys['a'] || keys['ф']) ix -= 1; if (keys['arrowright'] || keys['d'] || keys['в']) ix += 1;
  if (keys['arrowup'] || keys['w'] || keys['ц']) iy -= 1; if (keys['arrowdown'] || keys['s'] || keys['ы']) iy += 1;
  const mag = Math.min(1, Math.hypot(ix, iy));
  hero.moving = false;
  if (hero.inCar){ hero.depth = depthOf(hero.x, hero.y); return; }
  if (hero.air){ heroAir(dt); hero.depth = depthOf(hero.x, hero.y); return; }
  if (!S.dead && !uiBlock() && mag > 0.06){
    const g = unrot(ix, iy), gl = Math.hypot(g[0], g[1]) || 1, gx = g[0]/gl, gy = g[1]/gl;
    const sprint = (input.sprint || keys['shift']) && S.stamina > 2;
    let sp = (sprint ? 13.5 : 9.0)*mag*SPD_S; if (S.slow > 0) sp *= 0.55; if (LEVEL && levelFloor(hero.x, hero.y) === 'balls') sp *= 0.42;
    { const a = P(gx, gy, 0), b = P(0, 0, 0); sp *= Math.min(2.1, SCREEN_REF/Math.max(0.001, Math.hypot(a[0] - b[0], a[1] - b[1]))); }
    if (sprint){ S.stamina = Math.max(0, S.stamina - 22*dt); }
    const ox = hero.x, oy = hero.y;
    if (moveEntity(hero, gx*sp*dt + hero.vx*dt, gy*sp*dt + hero.vy*dt, 0.45)) hero.moving = true;
    stepTrack(hero, ox, oy, 1.6);
    hero.step += dt*(sprint ? 14 : 10.5)*mag;
    hero.dir = Math.abs(ix) > Math.abs(iy)*0.9 ? (ix > 0 ? 'r' : 'l') : (iy > 0 ? 'd' : 'u');
    hero.aim = Math.atan2(gy, gx); hero.face = hero.aim;
    hero.fx = gx; hero.fy = gy;
  } else if (hero.vx || hero.vy){ moveEntity(hero, hero.vx*dt, hero.vy*dt, 0.45); }
  hero.vx *= Math.pow(0.001, dt); hero.vy *= Math.pow(0.001, dt);
  if (!(input.sprint || keys['shift']) || !hero.moving) S.stamina = Math.min(100, S.stamina + 14*dt);
  // facing sprite follows aim when firing
  if (hero.fireT > 0 || input.fire){ const sd = screenDirOf(Math.cos(hero.aim), Math.sin(hero.aim)); hero.dir = sd; }
  if (input.fire || keys[' '] || keys['j']) fire();
  hero.depth = depthOf(hero.x, hero.y);
  hero.draw = (c, sx, sy) => {
    const fr = hero.moving ? Math.floor(hero.step)%4 : 0;
    const w = curW();
    if (drawHeroPuppet(c)) return;
    drawChar(c, sx, sy, HERO_PAL, hero.dir, fr, 1, {flash: hero.hitFlash > 0 && Math.floor(time*30)%2 === 0, gun: !w.melee && !w.throw, muzzle: hero.muzzle > 0});
    if (w.melee && hero.swing > 0){ c.strokeStyle = '#e9e4f4'; c.lineWidth = 2; const a = -1 + (0.2 - hero.swing)*10; c.beginPath(); c.arc(sx, sy - 10, 12, a - 0.8, a + 0.2); c.stroke(); }
  };
}
const keys = {};

// ---------------------------------------------------------------- NPCs
function addNpc(id, name, pal, x, y, o){
  const p = freeNear(x, y, 0.5);
  const n = Object.assign({id, name, pal, x: p[0], y: p[1], dir: 'd', dyn: true, hgt: 2, t: Math.random()*6, follow: false, hp: 60}, o || {});
  n.depth = depthOf(n.x, n.y);
  n.draw = (c, sx, sy) => { if (!drawNpcPuppet(c, n)) drawChar(c, sx, sy, n.pal, n.dir, n.moving ? Math.floor(n.t*8)%4 : 0, 1, {bobY: Math.sin(time*2 + n.t)*0.3, flash: n.flash > 0}); if (n.name && !n.hideName && Math.hypot(n.x - hero.x, n.y - hero.y) < 12){ c.font = '6px monospace'; c.textAlign = 'center'; c.fillStyle = '#1d1528'; c.fillText(n.name, sx + 1, sy - 28); c.fillStyle = '#ffe9b0'; c.fillText(n.name, sx, sy - 29); } };
  npcs[id] = n; return n;
}
function updateNpcs(dt){
  for (const k in npcs){
    const n = npcs[k]; n.t += dt; n.moving = false; n.flash = Math.max(0, (n.flash || 0) - dt);
    if (n.hidden) continue;
    if (n.follow && !S.dead){
      const d = Math.hypot(hero.x - n.x, hero.y - n.y);
      if (d > 3.2){ const dx = (hero.x - n.x)/d, dy = (hero.y - n.y)/d, sp = Math.min(9.5, 3 + d*0.7)*SPD_S; moveEntity(n, dx*sp*dt, dy*sp*dt, 0.45); n.moving = true; n.dir = screenDirOf(dx, dy); n.fx = dx; n.fy = dy; }
      for (const z of zombies){ const zd = Math.hypot(z.x - n.x, z.y - n.y); if (zd < 1.4 && z.cool <= 0 && !z.alert) { } if (zd < z.T.r + 0.9){ if (!z.npcCool || z.npcCool < time){ z.npcCool = time + 1.0; n.hp -= z.T.dmg*0.5; n.flash = 0.15; } } }
      if (n.hp <= 0 && Quests.onNpcDead) Quests.onNpcDead(n);
    } else if (!n.follow){ const dx = hero.x - n.x, dy = hero.y - n.y; if (Math.hypot(dx, dy) < 14){ n.dir = screenDirOf(dx, dy); n.fx = dx; n.fy = dy; } }
    n.depth = depthOf(n.x, n.y);
  }
}
