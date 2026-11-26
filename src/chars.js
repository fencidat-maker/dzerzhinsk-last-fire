// ====================================================================== pixel characters
const HERO_PAL = {jacket: '#2f7f8a', jd: '#245f69', hat: '#8c6c4c', fur: '#d4c7ae', scarf: '#d9483b', pants: '#35384f', boots: '#2a2430', skin: '#f0c9a0', pack: '#b5652f'};
function drawChar(c, fx, fy, p, dir, fr, u, o){
  o = o || {};
  const R = [], side = dir === 'l' || dir === 'r', bob = (fr === 1 || fr === 3) ? -1 : 0, lf = fr === 1, rf = fr === 3;
  const add = (x, y, w, h, col) => R.push([x, y, w, h, col]);
  const zom = !!o.zombie;
  if (!side){
    add(-3, lf ? -5 : -6, 3, lf ? 3 : 4, p.pants); add(0, rf ? -5 : -6, 3, rf ? 3 : 4, p.pants);
    add(-3, lf ? -3 : -2, 3, 2, p.boots); add(0, rf ? -3 : -2, 3, 2, p.boots);
    if (dir === 'u' && p.pack) add(-3, -13 + bob, 6, 7, p.pack);
    add(-4, -13 + bob, 8, 8, p.jacket);
    if (dir === 'u' && p.pack) add(-3, -12 + bob, 6, 6, p.pack);
    add(-4, -6 + bob, 8, 1, p.jd);
    if (zom){ // arms stretched forward
      const dy = dir === 'd' ? 2 : -3;
      add(-6, -11 + bob + dy, 2, 5, p.jd); add(4, -11 + bob + dy, 2, 5, p.jd); add(-6, -7 + bob + dy, 2, 1, p.skin); add(4, -7 + bob + dy, 2, 1, p.skin);
    } else {
      add(-6, -12 + bob + (fr === 3 ? 1 : 0), 2, 6, p.jd); add(4, -12 + bob + (fr === 1 ? 1 : 0), 2, 6, p.jd);
      add(-6, -6 + bob + (fr === 3 ? 1 : 0), 2, 1, p.skin); add(4, -6 + bob + (fr === 1 ? 1 : 0), 2, 1, p.skin);
    }
    if (dir === 'd' && p.pack){ add(-3, -12 + bob, 1, 6, p.pack); add(2, -12 + bob, 1, 6, p.pack); }
    add(-3, -14 + bob, 6, 2, p.scarf);
    add(-3, -19 + bob, 6, 5, dir === 'u' ? p.hat : p.skin);
    if (dir === 'd'){ add(-2, -17 + bob, 1, 1, zom ? '#d8f060' : '#2a2233'); add(1, -17 + bob, 1, 1, zom ? '#d8f060' : '#2a2233'); if (zom) add(-1, -15 + bob, 2, 1, '#5a1f24'); }
    add(-4, -22 + bob, 8, 4, p.hat); add(-4, -22 + bob, 8, 1, p.fur);
    add(-5, -20 + bob, 2, 4, p.hat); add(3, -20 + bob, 2, 4, p.hat);
    if (dir === 'd') add(-4, -18 + bob, 8, 1, p.fur);
  } else {
    const f = dir === 'r' ? 1 : -1, m = (x, w) => f === 1 ? x : -(x + w), stride = (fr === 1) ? 2 : (fr === 3 ? -2 : 0);
    add(m(-2 - stride, 3), -6, 3, 4, p.pants); add(m(-2 + stride, 3), -6, 3, 4, p.pants);
    add(m(-2 - stride, 3), -2, 3, 2, p.boots); add(m(-2 + stride, 3), -2, 3, 2, p.boots);
    if (p.pack) add(m(-6, 3), -12 + bob, 3, 6, p.pack);
    add(m(-3, 6), -13 + bob, 6, 8, p.jacket); add(m(-3, 6), -6 + bob, 6, 1, p.jd);
    if (zom){ add(m(1, 6), -12 + bob, 6, 2, p.jd); add(m(6, 1), -12 + bob, 1, 2, p.skin); }
    else { add(m(-1 + (stride ? -stride/2 : 0), 2), -12 + bob, 2, 6, p.jd); add(m(-1 + (stride ? -stride/2 : 0), 2), -6 + bob, 2, 1, p.skin); }
    add(m(-3, 6), -14 + bob, 6, 2, p.scarf);
    add(m(-2, 5), -19 + bob, 5, 5, p.skin); add(m(3, 1), -17 + bob, 1, 2, p.skin); add(m(1, 1), -17 + bob, 1, 1, zom ? '#d8f060' : '#2a2233');
    add(m(-3, 7), -22 + bob, 7, 4, p.hat); add(m(-3, 7), -22 + bob, 7, 1, p.fur); add(m(-3, 2), -20 + bob, 2, 4, p.hat); add(m(2, 3), -19 + bob, 3, 1, p.fur);
  }
  c.save(); c.translate(Math.round(fx), Math.round(fy + (o.bobY || 0))); c.scale(u, u);
  c.fillStyle = 'rgba(24,16,44,.34)'; c.beginPath(); c.ellipse(0, 0, 7.5, 2.8, 0, 0, TAU); c.fill();
  if (o.flash){ c.fillStyle = '#fff'; for (const r of R) c.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2); }
  else {
    c.fillStyle = '#1d1528'; for (const r of R) c.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2);
    for (const r of R){ c.fillStyle = r[4]; c.fillRect(r[0], r[1], r[2], r[3]); }
  }
  if (o.gun){ // small gun sprite in the facing direction
    const gx = side ? (dir === 'r' ? 4 : -9) : (dir === 'd' ? 2 : -5), gy = dir === 'u' ? -12 : -9;
    if (dir !== 'u'){ c.fillStyle = '#1d1528'; c.fillRect(gx - 1, gy - 1, side ? 7 : 5, 4); c.fillStyle = '#7d7a88'; c.fillRect(gx, gy, side ? 5 : 3, 2); if (o.muzzle){ c.fillStyle = '#ffe9a0'; c.fillRect(side ? (dir === 'r' ? gx + 6 : gx - 4) : gx, side ? gy - 1 : gy + 4, 3, 3); } }
  }
  c.restore();
}
const ZTYPES = {
  walker:  {name: 'Ходячий', hp: 60,  spd: 2.1, dmg: 9,  u: 1, sight: 30, r: 0.5, coin: 3},
  runner:  {name: 'Бегун',   hp: 36,  spd: 5.3, dmg: 7,  u: 0.95, sight: 42, r: 0.45, coin: 4},
  brute:   {name: 'Громила', hp: 240, spd: 1.8, dmg: 24, u: 1.45, sight: 26, r: 0.85, coin: 12},
  chemist: {name: 'Химик',   hp: 85,  spd: 2.0, dmg: 6,  u: 1.05, sight: 34, r: 0.5, coin: 8, spit: true},
  frost:   {name: 'Ледяной', hp: 80,  spd: 3.0, dmg: 10, u: 1.0, sight: 32, r: 0.5, coin: 6, chill: true},
  boss:    {name: 'Аппаратчик', hp: 1100, spd: 2.5, dmg: 32, u: 2.1, sight: 60, r: 1.2, coin: 120, boss: true}
};
const ZPALS = {
  walker: [
    {jacket: '#6a7a52', jd: '#56633f', hat: '#4a3f3a', fur: '#6d6558', scarf: '#8a6a4a', pants: '#3b3f4f', boots: '#241f26', skin: '#9fb58a', pack: null},
    {jacket: '#7a5a6a', jd: '#5f4655', hat: '#3a3a44', fur: '#5a5a64', scarf: '#5a6a7a', pants: '#2f3446', boots: '#241f26', skin: '#a3b38c', pack: null},
    {jacket: '#8a7a5a', jd: '#6e6046', hat: '#5a4a3a', fur: '#8a7f6c', scarf: '#7a4a4a', pants: '#3b3a46', boots: '#241f26', skin: '#98ad84', pack: null}
  ],
  runner: [{jacket: '#4a4f66', jd: '#3b3f54', hat: '#35384c', fur: '#35384c', scarf: '#4a4f66', pants: '#2a2c3a', boots: '#d8d4e0', skin: '#a8bd94', pack: null}],
  brute:  [{jacket: '#8a8678', jd: '#6e6a5e', hat: '#5a5a5a', fur: '#6a665c', scarf: '#c8c4b4', pants: '#4a4a56', boots: '#2a2430', skin: '#8fa87c', pack: null}],
  chemist:[{jacket: '#d6b830', jd: '#a8901f', hat: '#d6b830', fur: '#c9a82a', scarf: '#3a3a3a', pants: '#b79a28', boots: '#2a2430', skin: '#76b86a', pack: '#4a4f52'}],
  frost:  [{jacket: '#7aa4c8', jd: '#5f86aa', hat: '#cfe4f4', fur: '#eaf4fc', scarf: '#b7d4ea', pants: '#4a6a8a', boots: '#2a3a52', skin: '#bcd8ea', pack: null}],
  boss:   [{jacket: '#3a2a3e', jd: '#2c1f30', hat: '#6a1f2a', fur: '#8a2a34', scarf: '#d6b830', pants: '#2a2230', boots: '#1a1520', skin: '#9bb88a', pack: null}]
};
