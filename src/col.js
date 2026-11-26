// ---------------------------------------------------------------- painted-obstacle collision (cars, barricades, fences, props)
// Masks are 1/4-res bitmaps in un-mirrored tile pixel space, detected from the stop-motion tiles (col/detect.py).
const CM = {tiles: [], ready: false};
function initColMasks(meta){
  let left = meta.length;
  meta.forEach(m => {
    const im = new Image(); im.src = 'cm/' + m[0] + '_' + m[1] + '.png';
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, im.width, im.height).data;
      const bits = new Uint8Array(im.width*im.height); for (let k = 0; k < bits.length; k++) bits[k] = d[k*4] > 127 ? 1 : 0;
      CM.tiles.push({x0: m[2], y0: m[3], w: im.width, h: im.height, k: im.width/2048, bits});
      if (--left === 0){ CM.ready = true; if (typeof onColReady === 'function') onColReady(); }
    };
    im.onerror = () => { if (--left === 0){ CM.ready = true; if (typeof onColReady === 'function') onColReady(); } };
  });
}
function colAtP(px, py){
  for (const t of CM.tiles){
    const u = Math.floor((-px - t.x0)*t.k), v = Math.floor((py - t.y0)*t.k);
    if (u < 2 || v < 2 || u >= t.w - 2 || v >= t.h - 2) continue;   // skip feathered border
    if (t.bits[v*t.w + u]) return true;
  }
  return false;
}
function colMask(x, y, r){
  if (!CM.tiles.length) return false;
  const p = P(x, y, 0); if (colAtP(p[0], p[1])) return true;
  const rr = r*0.85;
  for (let a = 0; a < 4; a++){ const q = P(x + Math.cos(a*1.5708)*rr, y + Math.sin(a*1.5708)*rr, 0); if (colAtP(q[0], q[1])) return true; }
  return false;
}
