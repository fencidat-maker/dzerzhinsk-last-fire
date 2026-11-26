// ---------------------------------------------------------------- slideshow: intro + story cutscenes
const SCENES = {
  intro: [
    ['i0', 'Дзержинск — город химиков на Оке. Заводские трубы, пятиэтажки, площадь Героев с Вечным огнём. Здесь Лёва Сомов родился и вырос.'],
    ['i1', 'Шесть лет назад он поссорился с отцом и уехал. На перроне остались двое: отец и сестрёнка Ася в красном пальто. Ей тогда было десять.'],
    ['i2', 'Две недели назад на химзаводе случилась авария. Ночью над городом прошёл зелёный туман. В новостях о нём сказали один раз — и замолчали.'],
    ['i3', 'На третий день умершие поднялись. Город оцепили военные, связь оборвалась, а эвакуация захлебнулась в первую же ночь.'],
    ['i4', 'Неделю назад Лёве пришло голосовое от Аси. Последнее. Он сел в первый же поезд, хотя знал: дальше кордона поезда не идут.'],
    ['i5', 'Ночью он прошёл через оцепление вдоль железной дороги и вышел к площади Героев. Брошенный троллейбус, тишина — а у Вечного огня горят костры. Значит, кто-то ещё жив.']
  ],
  radio: [
    ['c_radio', 'Крыша дома со шпилем. Тимка третьи сутки не выпускает из рук рацию и ловит всё, что ещё звучит в эфире.']
  ],
  column: [
    ['c_column', 'Ночью по объездной прошла военная колонна: грузовики, прожекторы, люди в противогазах. Кольцо вокруг города сжимается.'],
    ['c_column', 'До зачистки осталось две ночи. Колонна эвакуации уйдёт без Лёвы: он поворачивает к центру, за сестрой.']
  ],
  dkh: [
    ['c_dkh', 'Дворец культуры химиков. Здесь Ася когда-то плясала на новогодних ёлках. На паркете — её фонарь, ещё тёплый, и магнитофон с кассетой.']
  ],
  leontich: [
    ['c_leontich', 'Всю ночь Леонтьич подбрасывал дрова в огонь. До рассвета он не дожил.'],
    ['c_leontich', 'Ася держала его за руку до конца. «Огонь не должен погаснуть» — это были его последние слова.']
  ],
  endA: [
    ['end_a', 'Грузовик уходил по объездной на запад. Ася смотрела назад, пока огни Дзержинска не растворились в снегу.'],
    ['end_a', 'Из её крови сделают сыворотку. Лёва пообещал приехать — и на этот раз собирался сдержать слово.']
  ],
  endB: [
    ['end_b', 'Арка Центрального парка. За ней — Ока, пристань и лодки. Позади — город, который сгорит на рассвете.'],
    ['end_b', 'Двое уходят по снегу и не оглядываются. Огонь на площади Героев ещё горит.']
  ],
  epi: [
    ['epi', 'Рассвет. Впервые за много дней Ася смеётся…'],
    ['epi', '…и на мгновение в её глазах вспыхивает зелёный свет.']
  ]
};
let slidesOn = false;
const SLIDE_CACHE = {};
function preloadScene(name, hi){ (SCENES[name] || []).forEach(s => { if (!SLIDE_CACHE[s[0]]){ const im = new Image(); if (hi) im.fetchPriority = 'high'; im.decoding = 'async'; im.src = 'slides/' + s[0] + '.webp'; SLIDE_CACHE[s[0]] = im; } }); }
preloadScene('intro', true);   // start fetching the intro while the title screen is shown
function playSlides(name, cb){
  const list = SCENES[name]; if (!list || !list.length){ cb && cb(); return; }
  if (window.__fastSlides){ (window.__scenes = window.__scenes || []).push(name); slidesOn = false; cb && cb(); return; }
  preloadScene(name, true);
  const el = document.getElementById('sl'), A = el.querySelector('.sla'), B = el.querySelector('.slb'), tx = el.querySelector('.slt'), dots = el.querySelector('.sld');
  slidesOn = true; input.x = input.y = 0; input.fire = false; el.style.display = 'block'; requestAnimationFrame(() => el.classList.add('on'));
  let i = -1, front = A, back = B, typer = 0, full = '', shown = 0, done = false;
  function type(){ clearInterval(typer); shown = 0; tx.textContent = ''; typer = setInterval(() => { shown += 2; tx.textContent = full.slice(0, shown); if (shown >= full.length) clearInterval(typer); }, 28); }
  function show(k){
    i = k; const s = list[i];
    const img = back, ki = i; const t = front; front = back; back = t;
    full = s[1]; type();
    const reveal = () => { if (done || i !== ki) return;
      img.style.backgroundImage = 'url(slides/' + s[0] + '.webp)';
      img.classList.remove('kb0', 'kb1'); void img.offsetWidth; img.classList.add(ki%2 ? 'kb1' : 'kb0');
      img.style.opacity = 1; t.style.opacity = 0; };
    const im = SLIDE_CACHE[s[0]];
    if (im && im.complete && im.naturalWidth) reveal();
    else if (im){ im.addEventListener('load', reveal, {once: true}); im.addEventListener('error', reveal, {once: true}); }
    else reveal();
    dots.innerHTML = list.map((_, j) => '<i' + (j === i ? ' class="on"' : '') + '></i>').join('');
  }
  function next(){
    if (done) return;
    if (shown < full.length){ clearInterval(typer); shown = full.length; tx.textContent = full; return; }
    if (i + 1 < list.length) show(i + 1); else finish();
  }
  function finish(){
    if (done) return; done = true; clearInterval(typer); el.classList.remove('on');
    el.removeEventListener('pointerdown', onTap); skip.removeEventListener('pointerdown', onSkip);
    setTimeout(() => { el.style.display = 'none'; A.style.opacity = B.style.opacity = 0; slidesOn = false; cb && cb(); }, 600);
  }
  const skip = el.querySelector('.sls');
  const onTap = e => { e.stopPropagation(); next(); };
  const onSkip = e => { e.stopPropagation(); finish(); };
  el.addEventListener('pointerdown', onTap); skip.addEventListener('pointerdown', onSkip);
  show(0);
}
