// ====================================================================== core: projection, helpers, world data
const WORLD = __WORLD__;
const A = 5.5, B = 2.75, ZS = 6.91;
const BETA = 0.9948376736367679, cb = Math.cos(BETA), sb = Math.sin(BETA);
const TAU = Math.PI*2;
function rot(x, y){ return [x*cb - y*sb, x*sb + y*cb]; }
function P(x, y, z){ const X = x*cb - y*sb, Y = x*sb + y*cb; return [-(X - Y)*A, (X + Y)*B - (z||0)*ZS]; }
function depthOf(x, y){ return (x*cb - y*sb) + (x*sb + y*cb); }
const CAMX = (cb + sb)/Math.SQRT2, CAMY = (cb - sb)/Math.SQRT2;       // ground direction toward the camera
function unrot(sx, sy){ // screen->ground (z=0)
  const D = -sx/A, S = sy/B;           // X-Y , X+Y
  const X = (D + S)/2, Y = (S - D)/2;
  return [X*cb + Y*sb, -X*sb + Y*cb];
}
function hash(n){ n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0)/4294967296; }
function RNG(seed){ let s = (seed*2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s/4294967296; }; }
function mix(c1, c2, t){
  const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
  const r = Math.round(((a >> 16) & 255)*(1 - t) + ((b >> 16) & 255)*t), g = Math.round(((a >> 8) & 255)*(1 - t) + ((b >> 8) & 255)*t), bl = Math.round((a & 255)*(1 - t) + (b & 255)*t);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}
function inPoly(x, y, p){
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++){
    const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi)*(y - yi)/(yj - yi) + xi)) c = !c;
  }
  return c;
}
function distSeg(px, py, ax, ay, bx, by){
  const dx = bx - ax, dy = by - ay, l2 = dx*dx + dy*dy;
  let t = l2 ? ((px - ax)*dx + (py - ay)*dy)/l2 : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t*dx), py - (ay + t*dy));
}
function offsetPoly(pts, d){ // CCW polygon inset by d (miter)
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++){
    const a = pts[(i + n - 1)%n], b = pts[i], c = pts[(i + 1)%n];
    let e1x = b[0] - a[0], e1y = b[1] - a[1], e2x = c[0] - b[0], e2y = c[1] - b[1];
    const l1 = Math.hypot(e1x, e1y) || 1, l2 = Math.hypot(e2x, e2y) || 1; e1x /= l1; e1y /= l1; e2x /= l2; e2y /= l2;
    const n1x = -e1y, n1y = e1x, n2x = -e2y, n2y = e2x;       // inward normals (CCW)
    let bx = n1x + n2x, by = n1y + n2y; const bl = bx*bx + by*by;
    const k = bl < 1e-6 ? 1 : 2/bl;
    let m = Math.min(2.2, k);
    out.push([b[0] + bx*m*d, b[1] + by*m*d]);
  }
  return out;
}
function polyArea(p){ let a = 0; for (let i = 0; i < p.length; i++){ const q = p[(i + 1)%p.length]; a += p[i][0]*q[1] - q[0]*p[i][1]; } return a/2; }
function polyPath(c, pts, proj){ pts.forEach((q, i) => { const s = proj(q); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath(); }
function mkCanvas(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

// ---------------------------------------------------------------- buildings data
const BL = WORLD.bl.map(b => {
  const p = b.p; let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9, cx = 0, cy = 0;
  p.forEach(q => { minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]); cx += q[0]; cy += q[1]; });
  cx /= p.length; cy /= p.length;
  const FH = {res: 3.3, school: 4.0, kg: 3.2, pub: 3.6, house: 2.9, garage: 2.7, shed: 2.4}[b.k] || 3.3;
  let H = b.k === 'garage' || b.k === 'shed' ? FH : b.lv*FH + (b.k === 'res' ? 0.7 : 0.3);
  if (b.sp === 'dkh') H = 14; if (b.sp === 'chapel') H = 6; if (b.sp === 'mall' || b.sp === 'mall2') H = 11;
  const o = Object.assign({}, b, {minx, miny, maxx, maxy, cx, cy, H, FH});
  o.roofH = (b.k === 'res' || b.k === 'school' || b.k === 'house' || b.k === 'kg') ? (b.k === 'house' ? 1.8 : 2.4) : 0;
  o.top = H + o.roofH + (b.sp === 'spire' ? 20 : 0);
  o.depth = depthOf(cx, cy);
  o.img = null;
  return o;
});
const BL_BY_ID = {}; BL.forEach(b => BL_BY_ID[b.id] = b);
// spatial grid of buildings
const GC = 40, GRID = new Map();
function gkey(i, j){ return i*4096 + j; }
BL.forEach((b, i) => { for (let gx = Math.floor(b.minx/GC); gx <= Math.floor(b.maxx/GC); gx++) for (let gy = Math.floor(b.miny/GC); gy <= Math.floor(b.maxy/GC); gy++){ const k = gkey(gx + 100, gy + 100); if (!GRID.has(k)) GRID.set(k, []); GRID.get(k).push(b); } });
function nearBuildings(x, y, r){
  const out = new Set();
  for (let gx = Math.floor((x - r)/GC); gx <= Math.floor((x + r)/GC); gx++) for (let gy = Math.floor((y - r)/GC); gy <= Math.floor((y + r)/GC); gy++){ const l = GRID.get(gkey(gx + 100, gy + 100)); if (l) l.forEach(b => out.add(b)); }
  return out;
}

// ---------------------------------------------------------------- static objects with spatial grid
const OBJ = [];       // {t, x, y, ...}
const OGC = 40, OGRID = new Map();
function addObj(o){ o.depth = depthOf(o.x, o.y); OBJ.push(o); const k = gkey(Math.floor(o.x/OGC) + 100, Math.floor(o.y/OGC) + 100); if (!OGRID.has(k)) OGRID.set(k, []); OGRID.get(k).push(o); return o; }
WORLD.trees.forEach(t => addObj({t: t[2] ? 'spruce' : 'bare', x: t[0], y: t[1], v: t[3], r: 0.55}));
WORLD.lamps.forEach(l => addObj({t: 'lamp', x: l[0], y: l[1], a: l[2], r: 0.25}));
WORLD.cars.forEach(cr => addObj({t: 'car', x: cr[0], y: cr[1], a: cr[2], v: cr[3], r: 1.2}));
function objsInRect(x0, y0, x1, y1){
  const out = [];
  for (let gx = Math.floor(x0/OGC); gx <= Math.floor(x1/OGC); gx++) for (let gy = Math.floor(y0/OGC); gy <= Math.floor(y1/OGC); gy++){ const l = OGRID.get(gkey(gx + 100, gy + 100)); if (l) for (const o of l) out.push(o); }
  return out;
}
// who stands in front of a point (from the camera's point of view)?
function occludersOf(x, y, hgt){
  const out = [];
  const cand = nearBuildings(x + CAMX*12, y + CAMY*12, 16);
  cand.forEach(b => {
    for (let s = 0.6; s <= 34; s += 0.7){
      const px = x + CAMX*s, py = y + CAMY*s;
      if (px < b.minx || px > b.maxx || py < b.miny || py > b.maxy) continue;
      if (inPoly(px, py, b.p)){ if (b.top >= (hgt || 1.8)*0.4 + s*0.82 - 1.0) out.push(b); return; }
    }
  });
  return out;
}


function nearBuildingsRect(x0, y0, x1, y1){
  const out = new Set();
  for (let gx = Math.floor(x0/GC); gx <= Math.floor(x1/GC); gx++) for (let gy = Math.floor(y0/GC); gy <= Math.floor(y1/GC); gy++){ const l = GRID.get(gkey(gx + 100, gy + 100)); if (l) l.forEach(b => out.add(b)); }
  return out;
}
