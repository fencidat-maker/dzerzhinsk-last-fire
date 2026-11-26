// ---------------------------------------------------------------- audio: generated samples + music
const AUD = (function(){
  const FILES = ['step0', 'step1', 'step2', 'step3', 'step4', 'step5', 'hit', 'swing', 'pm', 'ak', 'shotgun', 'zmoan', 'zattack', 'zdie', 'molotov', 'hurt', 'fire', 'wind'];
  const buf = {}; let ctx = null, master, sfxBus, musBus, ambBus, fireG, windG, loaded = false;
  let on = true; try { on = localStorage.getItem('dz_snd') !== '0'; } catch (_) {}
  const mus = {}; let musCur = null, musWant = 'theme';
  function init(){
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return; }
    AC = ctx;   // share with the synth fallback
    master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.85; sfxBus.connect(comp);
    ambBus = ctx.createGain(); ambBus.gain.value = 0.9; ambBus.connect(comp);
    musBus = ctx.createGain(); musBus.gain.value = 0.55; musBus.connect(master);
    Promise.all(FILES.map(n => fetch('snd/' + n + '.mp3').then(r => r.arrayBuffer()).then(a => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no))).then(b => { buf[n] = b; }).catch(() => {})))
      .then(() => { loaded = true; startLoops(); });
    // music via media elements (streaming, no big decode)
    for (const n of ['theme', 'tension']){ const a = new Audio('snd/' + n + '.mp3'); a.loop = true; a.preload = 'auto'; a.crossOrigin = 'anonymous';
      const src = ctx.createMediaElementSource(a), g = ctx.createGain(); g.gain.value = 0; src.connect(g); g.connect(musBus); mus[n] = {a, g}; }
  }
  function loop(name, bus){ if (!buf[name]) return null; const s = ctx.createBufferSource(); s.buffer = buf[name]; s.loop = true; const g = ctx.createGain(); g.gain.value = 0; s.connect(g); g.connect(bus); s.start(); return g; }
  function startLoops(){ fireG = loop('fire', ambBus); windG = loop('wind', ambBus); }
  function play(name, vol = 1, rate = 1, pan = 0){
    if (!ctx || !buf[name]) return false;
    const s = ctx.createBufferSource(); s.buffer = buf[name]; s.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.value = vol; let node = g;
    if (pan && ctx.createStereoPanner){ const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); node = p; }
    s.connect(g); node.connect(sfxBus); s.start(); return true;
  }
  const rnd = (a, b) => a + Math.random()*(b - a);
  // spatial helpers (world -> distance / screen pan)
  function at(name, x, y, vol = 1, maxD = 30, rate = 1){
    const d = Math.hypot(x - hero.x, y - hero.y); if (d > maxD) return;
    const a = P(x, y, 0), b = P(hero.x, hero.y, 0);
    play(name, vol*Math.pow(1 - d/maxD, 1.6), rate*rnd(0.92, 1.08), (a[0] - b[0])/180);
  }
  // returns true if the kind was handled by samples
  function sfxKind(kind){
    if (!loaded) return false;
    switch (kind){
      case 'shot': return play('pm', 0.8, rnd(0.95, 1.05));
      case 'ak': return play('ak', 0.7, rnd(0.96, 1.06));
      case 'shotgun': return play('shotgun', 0.9, rnd(0.95, 1.03));
      case 'hit': return play('hit', 0.75, rnd(0.9, 1.1));
      case 'swing': return play('swing', 0.6, rnd(0.9, 1.15));
      case 'hurt': return play('hurt', 0.8, rnd(0.92, 1.08));
      case 'boom': return play('molotov', 0.9, rnd(0.95, 1.05));
    }
    return false;
  }
  let stepN = 0, moanT = 3, lastFp = 0;
  function step(vol = 0.2, pan = 0){ if (!loaded) return; stepN = (stepN + 1 + Math.floor(Math.random()*4))%6; play('step' + stepN, vol*rnd(0.85, 1), rnd(0.94, 1.04), pan); }
  function setMusic(name){ musWant = name; }
  function update(dt){
    if (!ctx || !loaded) return;
    const t = ctx.currentTime;
    // fire loop: nearest painted/molotov/eternal fire
    let fd = 1e9;
    if (typeof FIRES !== 'undefined') for (const f of FIRES){ if (f.wx === undefined) continue; const d = Math.hypot(f.wx - hero.x, f.wy - hero.y); if (d < fd) fd = d; }
    for (const f of fires){ const d = Math.hypot(f.x - hero.x, f.y - hero.y) - 2; if (d < fd) fd = d; }
    if (flameLit && POI.flame){ const d = Math.hypot(POI.flame[0] - hero.x, POI.flame[1] - hero.y) - 3; if (d < fd) fd = d; }
    if (fireG) fireG.gain.setTargetAtTime(0.75*Math.max(0, 1 - Math.max(0, fd)/22), t, 0.3);
    if (windG) windG.gain.setTargetAtTime(LEVEL ? 0.03 : 0.16 + 0.12*Math.max(0, Math.min(1, (fd - 10)/30)), t, 0.8);
    // zombie moans
    moanT -= dt;
    if (moanT <= 0 && zombies.length){
      let best = null, bd = 1e9; for (const z of zombies){ const d = Math.hypot(z.x - hero.x, z.y - hero.y); if (d < bd && Math.random() < 0.6){ bd = d; best = z; } }
      if (best && bd < 32){ at('zmoan', best.x, best.y, best.type === 'brute' || best.type === 'boss' ? 0.9 : 0.6, 32, best.type === 'brute' || best.type === 'boss' ? 0.75 : best.type === 'runner' ? 1.15 : 1); }
      moanT = rnd(2.2, 5.5) - Math.min(1.8, zombies.length*0.12);
    }
    // music crossfade
    for (const n in mus){ const m = mus[n], want = n === musWant ? 1 : 0;
      if (want && m.a.paused) m.a.play().catch(() => {});
      m.g.gain.setTargetAtTime(want*(n === 'tension' ? 0.85 : 0.7), t, 1.6);
      if (!want && m.g.gain.value < 0.01 && !m.a.paused) m.a.pause(); }
  }
  function toggle(){ on = !on; try { localStorage.setItem('dz_snd', on ? '1' : '0'); } catch (_) {} if (master) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.1); return on; }
  return {init, play, at, sfxKind, step, update, setMusic, toggle, get on(){ return on; }, dbg(){ return {loaded, n: Object.keys(buf).length, st: ctx && ctx.state, mus: musWant, th: mus.theme && !mus.theme.a.paused, fire: fireG && fireG.gain.value}; }};
})();
['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => AUD.init(), {capture: true, passive: true}));
