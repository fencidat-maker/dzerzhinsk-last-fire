// ---------------------------------------------------------------- stop-motion puppet sprites
// Atlases: each sheet = 3 view rows (0 front 3/4 facing down-left, 1 side facing left, 2 back 3/4 facing up-left) x 6 frames.
// Right-facing views are mirrored.
const PUP = __ATLAS__;
const PUPIMG = {};
for (const k in PUP.atlases){ const im = new Image(); im.src = PUP.atlases[k].src; PUPIMG[k] = im; }
function pupReady(a){ const im = PUPIMG[a]; return im && im.complete && im.naturalWidth > 0; }
// world direction -> [viewRow, mirror]
function pupView(wx, wy){
  const a = P(wx, wy, 0), b = P(0, 0, 0), dx = a[0] - b[0], dy = a[1] - b[1];
  let row;
  if (Math.abs(dx) > Math.abs(dy)*1.6) row = 1; else row = dy > 0 ? 0 : 2;
  return [row, dx > 0];
}
// draw one frame; called inside drawSprite (context already scaled by CU, origin at feet)
// h = figure height in P units
function pupShadow(c, h, w){
  c.save(); c.globalAlpha *= 0.42; c.fillStyle = '#231c3a';
  c.beginPath(); c.ellipse(0, 0, h*(w || 0.27)/CU, h*0.095/CU, 0, 0, TAU); c.fill();
  c.globalAlpha *= 0.6; c.beginPath(); c.ellipse(0, 0, h*(w || 0.27)*0.6/CU, h*0.06/CU, 0, 0, TAU); c.fill();
  c.restore();
}
function drawPuppet(c, atlas, sheet, col, view, h, o){
  const A = PUP.atlases[atlas], im = PUPIMG[atlas];
  if (!A || !pupReady(atlas) || A.rows[sheet] == null) return false;
  o = o || {};
  if (!o.noShadow) pupShadow(c, h, o.shw);
  const fw = PUP.fw, fh = PUP.fh, k = h/110/CU;           // ~110 px figure height inside a frame
  const sy = (A.rows[sheet] + view[0])*fh, sx = col*fw;
  c.save();
  if (o.bob) c.translate(0, o.bob);
  if (view[1]) c.scale(-1, 1);
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  if (o.rot){ c.rotate(o.rot); }
  c.drawImage(im, sx, sy, fw, fh, -PUP.ax*k, -PUP.ay*k, fw*k, fh*k);
  if (o.flash){ c.globalCompositeOperation = 'lighter'; c.globalAlpha *= 0.55; c.drawImage(im, sx, sy, fw, fh, -PUP.ax*k, -PUP.ay*k, fw*k, fh*k); }
  c.restore();
  return true;
}
// weapon id -> hero sheet
const HERO_SHEET = {crowbar: 'walk', pm: 'pistol', ak: 'rifle', tozz: 'rifle', obrez: 'shotgun', molotov: 'walk'};
const HERO_H = 50;
const STRIDE = 1.05;               // screen distance of a full walk cycle, in figure heights
const WALK_N = {walk: 6, pistol: 4, rifle: 4, shotgun: 4};
function drawHeroPuppet(c){
  const w = curW(), wid = S.cur;
  const view = (hero.moving && !(hero.atkT > 0) && hero.fx != null) ? pupView(hero.fx, hero.fy) : pupView(Math.cos(hero.aim), Math.sin(hero.aim));
  const flash = hero.hitFlash > 0 && Math.floor(time*30)%2 === 0;
  if (S.dead){
    const t = Math.min(1, (hero.deadT || 0)/0.6);
    return drawPuppet(c, 'hero', 'misc', t < 0.5 ? 4 : 5, view, HERO_H, {});
  }
  // attack animations
  if (hero.atkT > 0){
    const p = 1 - hero.atkT/hero.atkDur;
    if (w.melee) return drawPuppet(c, 'hero', 'melee', Math.min(5, Math.floor(p*6)), view, HERO_H, {flash});
    if (w.throw) return drawPuppet(c, 'hero', 'misc', Math.min(2, Math.floor(p*3)), view, HERO_H, {flash});
    return drawPuppet(c, 'hero', HERO_SHEET[wid] || 'pistol', p < 0.45 ? 4 : 5, view, HERO_H, {flash});
  }
  if (hero.hurtT > 0) return drawPuppet(c, 'hero', 'misc', 3, view, HERO_H, {flash});
  const sheet = HERO_SHEET[wid] || 'walk', n = WALK_N[sheet] || 4;
  if (!hero.moving) return drawPuppet(c, 'hero', sheet, 0, view, HERO_H, {flash, bob: Math.sin(time*2)*0.12});
  const ph = (hero.walkPx || 0)/(HERO_H*STRIDE);
  if (PUP.atlases.hwalk && PUP.atlases.hwalk.rows[sheet] != null && pupReady('hwalk'))
    return drawPuppet(c, 'hwalk', sheet, Math.floor(ph*8)%8, view, HERO_H, {flash});
  const fr = Math.floor(ph*n)%n;
  return drawPuppet(c, 'hero', sheet, fr, view, HERO_H, {flash, bob: -Math.abs(Math.sin(ph*Math.PI*2))*0.9/CU});
}
const VSKIP = {chemist: [2]};   // video views that came out wrong -> use the sheet frames
const ZOMB_H = {walker: 48, runner: 47, brute: 62, chemist: 49, frost: 49, boss: 92};
function drawZombiePuppet(c, z){
  const view = pupView(z.fx || 0.3, z.fy || 0.6), h = ZOMB_H[z.type] || 40;
  if (z.dead) return drawPuppet(c, 'zomb', z.type, 5, view, h, {alpha: Math.min(1, z.deadT/1.2), noShadow: true});
  if (z.atkT > 0) return drawPuppet(c, 'zomb', z.type, 4, view, h, {flash: z.flash > 0});
  const ph = (z.walkPx || 0)/(h*(z.type === 'runner' ? 1.3 : 0.9));
  if (PUP.atlases.zwalk && PUP.atlases.zwalk.rows[z.type] != null && pupReady('zwalk') && !(VSKIP[z.type] && VSKIP[z.type].includes(view[0])))
    return drawPuppet(c, 'zwalk', z.type, Math.floor(ph*8)%8, view, h, {flash: z.flash > 0, shw: z.type === 'brute' || z.type === 'boss' ? 0.34 : 0.27});
  const fr = Math.floor(ph*4)%4;
  return drawPuppet(c, 'zomb', z.type, fr, view, h, {flash: z.flash > 0, shw: z.type === 'brute' || z.type === 'boss' ? 0.34 : 0.27, bob: -Math.abs(Math.sin(ph*Math.PI*2))*0.6/CU});
}
// NPC palette id -> npc sheet
const NPC_SHEET = {dvornik: 'dvornik', raisa: 'doctor', doctor: 'doctor', babka: 'babka', asya: 'asya', kid: 'radio', radio: 'radio',
  major: 'major', tech: 'engineer', engineer: 'engineer', kurator: 'babka', hunter: 'priest', priest: 'priest'};
function drawNpcPuppet(c, n){
  const sheet = NPC_SHEET[n.sheet || n.pal] || 'dvornik';
  const view = pupView(n.fx || 0.3, n.fy || 0.6);
  const fr = n.moving ? Math.floor(n.t*8)%4 : (Math.floor(n.t*0.7)%5 === 0 ? 5 : 4);
  return drawPuppet(c, 'npc', sheet, fr, view, n.h || 47, {flash: n.flash > 0});
}
