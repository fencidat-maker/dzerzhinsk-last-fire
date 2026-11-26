// ---------------------------------------------------------------- living fire + flickering light
// FIRES: painted bonfires/barrels found on the map tiles (P-space x,y at flame base, s = flame size in P units)
const FIRES = __FIRES__;
let firesInit = false;
function initFires(){
  firesInit = true;
  for (const f of FIRES){
    f.seed = Math.random()*100;
    const w = unrot(f.x, f.y); f.wx = w[0]; f.wy = w[1];
    try { f.hidden = occludersOf(f.wx, f.wy, 2).length > 0; } catch (_) { f.hidden = false; }
  }
}
let lightCv = null, lightCx = null;
function flick(seed, t){ return 0.72 + 0.14*Math.sin(t*7.3 + seed) + 0.09*Math.sin(t*13.1 + seed*2.3) + 0.05*Math.sin(t*23.7 + seed*0.7); }
function fireLights(vx0, vy0, vx1, vy1){
  if (!firesInit) initFires();
  const L = [];
  for (const f of FIRES) if (f.x > vx0 - 200 && f.x < vx1 + 200 && f.y > vy0 - 200 && f.y < vy1 + 200) L.push({x: f.x, y: f.y - f.s*0.3, r: 70 + f.s*3.2, i: flick(f.seed, time), f});
  for (const f of fires){ const s = P(f.x, f.y, 0); L.push({x: s[0], y: s[1] - 6, r: 110, i: flick(f.x, time)*Math.min(1, (f.life - f.t)/1.5), dyn: true}); }
  if (typeof flameLit !== 'undefined' && flameLit){ const s = P(POI.flame[0], POI.flame[1], 0); L.push({x: s[0], y: s[1] - 10, r: 160, i: flick(3, time)}); }
  if (LEVEL) L.push(...levelLights());
  if (typeof carLights === 'function') L.push(...carLights());
  if (LEVEL) L.push(...beamLights());
  if (hero.muzzle > 0){ const s = P(hero.x, hero.y, 1.2); L.push({x: s[0], y: s[1], r: 90, i: 1.2, muzzle: true}); }
  return L;
}
// called in world space (cx transformed), after characters are drawn
function drawFireFX(cx, vx0, vy0, vx1, vy1){
  const L = fireLights(vx0, vy0, vx1, vy1);
  cx.save();
  cx.globalCompositeOperation = 'lighter';
  for (const l of L){
    // warm light pool on the ground, characters and walls
    const g = cx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r*l.i);
    const a = l.muzzle ? 0.35 : 0.30*l.i;
    g.addColorStop(0, 'rgba(255,150,60,' + a + ')'); g.addColorStop(0.35, 'rgba(255,110,40,' + a*0.45 + ')'); g.addColorStop(1, 'rgba(255,80,20,0)');
    cx.fillStyle = g; cx.beginPath(); cx.ellipse(l.x, l.y, l.r*l.i, l.r*l.i*0.6, 0, 0, TAU); cx.fill();
  }
  // flame tongues over the painted fires
  for (const l of L){
    const f = l.f; if (!f || f.hidden) continue;
    const s = f.s, bx = f.x, by = f.y - s*0.25;
    for (let k = 0; k < 4; k++){
      const ph = time*(5 + k*1.7) + f.seed + k*2.1;
      const h = s*(0.75 + 0.25*Math.sin(ph) + 0.12*Math.sin(ph*2.3))*(k === 0 ? 1.15 : 0.8);
      const w = s*(0.26 - k*0.03), sw = Math.sin(ph*0.8)*s*0.12, ox = (k - 1.5)*s*0.11;
      const g = cx.createLinearGradient(0, by, 0, by - h);
      g.addColorStop(0, 'rgba(255,245,190,0.55)'); g.addColorStop(0.35, 'rgba(255,170,60,0.45)'); g.addColorStop(1, 'rgba(255,70,20,0)');
      cx.fillStyle = g; cx.beginPath();
      cx.moveTo(bx + ox - w, by);
      cx.bezierCurveTo(bx + ox - w, by - h*0.45, bx + ox + sw - w*0.3, by - h*0.7, bx + ox + sw*1.6, by - h);
      cx.bezierCurveTo(bx + ox + sw + w*0.3, by - h*0.7, bx + ox + w, by - h*0.45, bx + ox + w, by);
      cx.closePath(); cx.fill();
    }
    // sparks
    for (let k = 0; k < 6; k++){
      const ph = ((time*0.55 + k/6 + f.seed) % 1);
      const sx = bx + Math.sin(ph*9 + k*1.7 + f.seed)*s*0.35, sy = by - s*0.4 - ph*s*2.6;
      cx.fillStyle = 'rgba(255,' + (190 - ph*120 | 0) + ',70,' + (1 - ph)*0.9 + ')';
      cx.fillRect(sx - 0.9, sy - 0.9, 1.8, 1.8);
    }
  }
  cx.restore();
  return L;
}
// screen-space darkness with light holes (low-res light map), drawn after the world
function drawLightMap(cx, L, cX, cY){
  const W = Math.ceil(cv.width/4), H = Math.ceil(cv.height/4);
  if (!lightCv){ lightCv = document.createElement('canvas'); lightCx = lightCv.getContext('2d'); }
  if (lightCv.width !== W || lightCv.height !== H){ lightCv.width = W; lightCv.height = H; }
  const c = lightCx, k = K/4;
  c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H);
  c.fillStyle = LEVEL ? 'rgba(8,5,18,0.72)' : 'rgba(18,10,40,0.30)'; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'destination-out';
  const hl = P(hero.x, hero.y, 0);
  const all = L.concat([{x: hl[0], y: hl[1] - 8, r: LEVEL ? 70 : 55, i: 1}]);   // a little personal light around the hero
  for (const l of all){
    const x = (l.x - cX)*k, y = (l.y - cY)*k, r = l.r*l.i*k*1.25;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r*0.62, 0, 0, TAU); c.fill();
  }
  cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.imageSmoothingEnabled = true;
  cx.drawImage(lightCv, 0, 0, W, H, 0, 0, W*4, H*4);
  // coloured glow of emergency lights (additive)
  cx.globalCompositeOperation = 'lighter';
  for (const l of L){ if (!l.tint) continue; const x = (l.x - cX)*K, y = (l.y - cY)*K, r = l.r*K*1.1;
    const col = l.tint === 'red' ? '255,40,40' : l.tint === 'warm' ? '255,150,60' : '120,170,255';
    const g = cx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + col + ',' + (0.22*l.i).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
    cx.fillStyle = g; cx.beginPath(); cx.ellipse(x, y, r, r*0.62, 0, 0, TAU); cx.fill(); }
  cx.globalCompositeOperation = 'source-over'; cx.restore();
}
