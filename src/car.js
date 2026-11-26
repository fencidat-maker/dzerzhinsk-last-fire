// ---------------------------------------------------------------- «Нива»: drivable car with slippery-road physics
// Arcade-sim model: velocity and heading are separate, sideways grip on snow is low -> the car slides and drifts.
// Joystick = desired direction (car steers towards it, gas = stick tilt; pulling backwards = reverse),
// «Бег» = handbrake (kills rear grip -> handbrake turns), «Действие» = get in / out, «Огонь» = horn.
const NIVA = __NIVA__;                       // {frames:[[x,y,w,h] x8], fh}
const nivaImg = new Image(); nivaImg.src = 'sp/niva.webp';
const CARS = [];
let driving = null, camZoomCur = 1;
const CARP = {acc: 26, brake: 36, rev: 9, vmax: 40, drag: 0.16, grip: 3.6, gripHB: 0.6, steer: 3.1, len: 1.3, r: 0.85};
const carTracks = [];                         // tyre marks in the snow: {x0,y0,x1,y1,t,w}
const CAR_H = 44;                            // on-screen height of the side view, P units
function makeCar(x, y, h){ const c = {x, y, h: h || 0, vx: 0, vy: 0, w: 0, hp: 100, lean: 0, bob: 0, _car: true, hgt: 1.6, r: 1.6, horn: 0, smoke: 0}; CARS.push(c); return c; }
function carPoints(c, x, y, h){ const fx = Math.cos(h), fy = Math.sin(h); return [[x + fx*CARP.len, y + fy*CARP.len], [x, y], [x - fx*CARP.len, y - fy*CARP.len]]; }
// cars as obstacles for everything else
function carBlocks(x, y, r, self){
  for (const c of CARS){ if (c === self || c.dead) continue;
    if (Math.abs(x - c.x) > 4 || Math.abs(y - c.y) > 4) continue;
    for (const p of carPoints(c, c.x, c.y, c.h)) if (Math.hypot(x - p[0], y - p[1]) < r + CARP.r) return true; }
  return false;
}
function carBlockedAt(c, x, y, h){ for (const p of carPoints(c, x, y, h)) if (blocked(p[0], p[1], CARP.r, c)) return true; return false; }
function nearCar(maxD){ let best = null, bd = maxD; for (const c of CARS){ if (c.dead || c.locked) continue; const d = Math.hypot(hero.x - c.x, hero.y - c.y); if (d < bd){ bd = d; best = c; } } return best; }
function enterCar(c){
  driving = c; hero.inCar = true; hero.moving = false; input.sprint = false; $('bspr').classList.remove('on');
  document.body.classList.add('driving'); toast('Газ — джойстик · Ручник — «Бег» · Выйти — «Действие»', 3.5); sfx('click');
}
function exitCar(force){
  const c = driving; if (!c) return false;
  const sp = Math.hypot(c.vx, c.vy); if (sp > 3.5 && !force){ toast('Сначала остановитесь', 1.2); return true; }
  driving = null; hero.inCar = false; document.body.classList.remove('driving');
  const sx = -Math.sin(c.h), sy = Math.cos(c.h); const p = freeNear(c.x + sx*2.4, c.y + sy*2.4, 0.45); hero.x = p[0]; hero.y = p[1];
  return true;
}
function angWrap(a){ while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }
function updateCars(dt){
  for (const c of CARS){
    if (c.dead) continue;
    const fx = Math.cos(c.h), fy = Math.sin(c.h), rx = -fy, ry = fx;
    let vf = c.vx*fx + c.vy*fy, vr = c.vx*rx + c.vy*ry;
    let thr = 0, steer = 0, hb = false;
    if (c === driving && !S.dead && !uiBlock()){
      let ix = input.x, iy = input.y;
      if (keys['arrowleft'] || keys['a'] || keys['ф']) ix -= 1; if (keys['arrowright'] || keys['d'] || keys['в']) ix += 1;
      if (keys['arrowup'] || keys['w'] || keys['ц']) iy -= 1; if (keys['arrowdown'] || keys['s'] || keys['ы']) iy += 1;
      const mag = Math.min(1, Math.hypot(ix, iy));
      hb = !!(input.sprint || keys['shift']);
      if (mag > 0.12){
        const g = unrot(ix, iy), want = Math.atan2(g[1], g[0]); let diff = angWrap(want - c.h);
        if (Math.abs(diff) < 2.1 || vf > 4){ thr = mag; steer = Math.max(-1, Math.min(1, diff*1.7)); }
        else { thr = -0.7*mag; steer = Math.max(-1, Math.min(1, -angWrap(diff - Math.PI)*1.7)); }
      }
      if (input.fire || keys[' ']){ if (c.horn <= 0){ c.horn = 0.9; AUD.horn(); if (typeof makeNoise === 'function') makeNoise(c.x, c.y, 40); alertNearby(c.x, c.y, 35); } }
    }
    c.horn = Math.max(0, c.horn - dt);
    // longitudinal
    if (thr > 0){ if (vf < -0.5) vf += CARP.brake*thr*dt; else vf += CARP.acc*thr*(1 - Math.max(0, vf)/CARP.vmax)*dt; }
    else if (thr < 0){ if (vf > 0.5) vf -= CARP.brake*(-thr)*dt; else vf = Math.max(-CARP.rev, vf + CARP.acc*0.6*thr*dt); }
    vf -= vf*CARP.drag*dt + Math.sign(vf)*Math.min(Math.abs(vf), 0.6*dt);
    if (hb) vf -= vf*1.1*dt;
    // lateral grip: snow lets the tail slide; handbrake almost frees it
    const grip = hb ? CARP.gripHB : CARP.grip;
    vr -= vr*Math.min(1, grip*dt);
    // steering: yaw rate builds up with lag (ice), scales with speed, reverses in reverse
    const sgn = vf >= 0 ? 1 : -1, spd = Math.abs(vf);
    const wTarget = steer*CARP.steer*Math.min(1, spd/5)*sgn*(hb ? 1.5 : 1);
    c.w += (wTarget - c.w)*Math.min(1, dt*(hb ? 6 : 3.2));
    c.h = angWrap(c.h + c.w*dt);
    // back to world velocity (heading changed -> momentum stays, so the car slides)
    c.vx = fx*vf + rx*vr; c.vy = fy*vf + ry*vr; c.vf = vf; c.vr = vr; c.thr = thr; c.hb = hb;
    c.lean += ((-c.w*Math.min(1, Math.abs(vf)/12)*0.06) - c.lean)*Math.min(1, dt*6); c.bob = (c.bob || 0) + Math.abs(vf)*dt*0.9;
    { const slide = Math.abs(vr), spd0 = Math.hypot(c.vx, c.vy);
      if (spd0 > 1.2 && !c.wrecked){
        c.trk = (c.trk || 0) + spd0*dt;
        if (c.trk > 0.55){ c.trk = 0;
          const bx = c.x - fx*CARP.len*0.55, by = c.y - fy*CARP.len*0.55, W = slide > 2.5 || hb ? 1.9 : 1.2;
          const pts = [[bx + rx*0.55, by + ry*0.55], [bx - rx*0.55, by - ry*0.55]];
          if (c.lastTr && Math.hypot(c.lastTr[0][0] - pts[0][0], c.lastTr[0][1] - pts[0][1]) < 3) for (let k = 0; k < 2; k++) carTracks.push({x0: c.lastTr[k][0], y0: c.lastTr[k][1], x1: pts[k][0], y1: pts[k][1], t: 0, w: W});
          c.lastTr = pts; }
        if ((spd0 > 7 || slide > 3) && Math.random() < dt*26) spawnPart(c.x - fx*CARP.len*0.8 + rx*(Math.random() - 0.5), c.y - fy*CARP.len*0.8 + ry*(Math.random() - 0.5), 0.4, Math.random() < 0.5 ? '#ffffff' : '#dcd4ee', 1, 2.5 + spd0*0.08, 0.7);
      } else c.lastTr = null;
    }
    // integrate with collision
    const nx = c.x + c.vx*dt, ny = c.y + c.vy*dt;
    if (!carBlockedAt(c, nx, ny, c.h)){ c.x = nx; c.y = ny; }
    else {
      const imp = Math.hypot(c.vx, c.vy);
      if (!carBlockedAt(c, nx, c.y, c.h)){ c.x = nx; c.vy *= 0.45; }
      else if (!carBlockedAt(c, c.x, ny, c.h)){ c.y = ny; c.vx *= 0.45; }
      else { c.vx *= -0.2; c.vy *= -0.2; }
      c.w *= 0.4;
      if (imp > 7){ c.hp -= (imp - 6)*1.6; c.shake = 0.25; AUD.thud(imp); haptic('heavy'); spawnPart(c.x, c.y, 1.2, '#c9c3b5', 8, 4, 0.5); }
    }
    if (carBlockedAt(c, c.x, c.y, c.h)){ const p = freeNear(c.x, c.y, 2.2); c.x = p[0]; c.y = p[1]; }
    // ramming zombies
    const sp = Math.hypot(c.vx, c.vy);
    for (let i = zombies.length - 1; i >= 0; i--){
      const z = zombies[i]; if (z.dead) continue;
      let hit = false; for (const p of carPoints(c, c.x, c.y, c.h)) if (Math.hypot(z.x - p[0], z.y - p[1]) < CARP.r + z.T.r + 0.2) hit = true;
      if (!hit) continue;
      const a = Math.atan2(z.y - c.y, z.x - c.x);
      if (sp > 5){ damageZombie(z, sp*(z.type === 'boss' ? 2 : 7), Math.atan2(c.vy, c.vx)); c.hp -= z.type === 'brute' ? 6 : 1.2; c.vx *= 0.9; c.vy *= 0.9; haptic('medium'); }
      else { z.x += Math.cos(a)*0.15; z.y += Math.sin(a)*0.15; }
    }
    c.shake = Math.max(0, (c.shake || 0) - dt);
    if (c.hp <= 30) c.smoke += dt; if (c.hp <= 30 && c.smoke > 0.12){ c.smoke = 0; spawnPart(c.x, c.y, 1.6, '#55505a', 1, 1.2, 1.2); }
    if (c.hp <= 0 && !c.dead){ c.hp = 0; c.wrecked = true; if (c === driving){ exitCar(true); toast('«Нива» разбита! Дальше пешком', 3); } c.locked = true; }
    c.depth = depthOf(c.x, c.y);
    c.speed = sp;
  }
  if (driving){ hero.x = driving.x; hero.y = driving.y; hero.fx = Math.cos(driving.h); hero.fy = Math.sin(driving.h); hero.depth = driving.depth; }
  if (driving){ const d = driving; AUD.engUpdate(Math.min(1, Math.abs(d.vf || 0)/CARP.vmax), d.thr || 0, Math.min(1.5, Math.abs(d.vr || 0)/6 + (d.hb ? 0.6 : 0))); } else AUD.engStop();
  for (const t of carTracks) t.t += dt; while (carTracks.length && carTracks[0].t > 28) carTracks.shift();
  const want = driving ? 1.3 + Math.min(0.3, Math.hypot(driving.vx, driving.vy)/CARP.vmax*0.3) : 1; camZoomCur += (want - camZoomCur)*Math.min(1, dt*1.2);
}
function drawCarTracks(cx){
  cx.save(); cx.lineCap = 'round';
  for (const t of carTracks){
    const a = P(t.x0, t.y0, 0), b = P(t.x1, t.y1, 0), al = Math.max(0, 1 - t.t/28);
    cx.globalAlpha = 0.5*al; cx.strokeStyle = '#4a4872'; cx.lineWidth = t.w*1.2; cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(b[0], b[1]); cx.stroke();
    cx.globalAlpha = 0.35*al; cx.strokeStyle = '#ffffff'; cx.lineWidth = 0.5; cx.beginPath(); cx.moveTo(a[0], a[1] - 0.8); cx.lineTo(b[0], b[1] - 0.8); cx.stroke();
  }
  cx.restore();
}
function drawCar(cx, c){
  if (!nivaImg.complete || !nivaImg.naturalWidth) return;
  const d = P(Math.cos(c.h), Math.sin(c.h), 0), o = P(0, 0, 0), ang = Math.atan2((d[1] - o[1])*2, d[0] - o[0]);
  const q = (ang - Math.PI/2)/(Math.PI/4), idx = ((Math.round(q)%8) + 8)%8, res = (q - Math.round(q))*(Math.PI/4), f = NIVA.frames[idx];
  const k = CAR_H/NIVA.frames[2][3], s = P(c.x, c.y, 0), sh = c.shake ? (Math.random() - 0.5)*1.5 : 0, wd = f[2]*k, ht = f[3]*k;
  const bob = c.speed > 0.8 ? Math.sin(c.bob*3.1)*0.5 : 0;
  cx.save(); cx.translate(s[0] + sh, s[1]);
  // ground shadow: a soft dark pool under the body, stretched along the heading, plus a contact patch under the wheels
  cx.save(); cx.scale(1, 0.42); cx.rotate(Math.atan2(d[1] - o[1], d[0] - o[0]));
  const sg = cx.createRadialGradient(0, 0, 2, 0, 0, 20*1.45); sg.addColorStop(0, 'rgba(22,14,36,.62)'); sg.addColorStop(0.7, 'rgba(22,14,36,.4)'); sg.addColorStop(1, 'rgba(22,14,36,0)');
  cx.fillStyle = sg; cx.beginPath(); cx.ellipse(0, 0, 25, 14.5, 0, 0, TAU); cx.fill(); cx.restore();
  if (c.wrecked) cx.filter = 'brightness(0.55) saturate(0.4)';
  // body: nearest of the 8 painted views, turned a little towards the true heading, with lean and suspension bounce
  cx.translate(0, ht*0.04 + bob); cx.rotate(res*0.5 + c.lean);
  cx.drawImage(nivaImg, f[0], f[1], f[2], f[3], -wd/2, -ht, wd, ht);
  cx.filter = 'none';
  if (c === driving && c.speed > 0.5){   // headlights glow
    cx.globalCompositeOperation = 'lighter'; const hx = (d[0] - o[0])*14, hy = (d[1] - o[1])*14;
    const g = cx.createRadialGradient(hx, hy - 6, 0, hx, hy - 6, 46); g.addColorStop(0, 'rgba(255,240,190,.28)'); g.addColorStop(1, 'rgba(255,240,190,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(hx, hy - 6, 46, 0, TAU); cx.fill(); cx.globalCompositeOperation = 'source-over';
  }
  cx.restore();
}
function carLights(){ const L = []; if (driving){ const c = driving, s = P(c.x + Math.cos(c.h)*5, c.y + Math.sin(c.h)*5, 0); L.push({x: s[0], y: s[1], r: 95, i: 1}); } return L; }
