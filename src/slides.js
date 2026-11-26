// ---------------------------------------------------------------- slideshow: intro + story cutscenes
const SCENES = {
  intro: [
    ['i0', 'Дзержинск. Город химиков на Оке. Трубы заводов, панельки, площадь Героев с Вечным огнём. Зима.'],
    ['i1', 'Шесть лет назад Лёва Сомов уехал отсюда и не оглянулся. На перроне остались отец и младшая сестра Ася в красном пальто.'],
    ['i2', 'Две недели назад на заводе случилась авария. Ночью над городом прошёл зелёный туман. Об этом сказали один раз в новостях, а потом не говорили больше ничего.'],
    ['i3', 'На третий день мёртвые встали. Город закрыли кордоном. Связь пропала.'],
    ['i4', 'Последнее голосовое от Аси пришло неделю назад. Лёва слушал его в поезде до самой Москвы, а потом сошёл и поехал обратно.'],
    ['i5', 'Последний троллейбус встал на площади Героев. Дальше пешком. Пока горит огонь, кто-то ещё жив.']
  ],
  radio: [
    ['c_radio', 'Крыша дома со шпилем. Тимка уже третьи сутки не выпускает из рук рацию: ловит всё, что ещё звучит в эфире.']
  ],
  column: [
    ['c_column', 'Ночью по объездной прошла колонна: техника, люди в противогазах, прожекторы. Город стали обводить по кругу.'],
    ['c_column', 'До зачистки две ночи. Колонна эвакуации пойдёт без него, а Лёва повернул к центру.']
  ],
  dkh: [
    ['c_dkh', 'ДКХ. Дворец, где Ася когда-то танцевала на новогодних ёлках. На паркете тёплый фонарь, рядом магнитофон с кассетой.']
  ],
  leontich: [
    ['c_leontich', 'Леонтьич до последнего подкидывал дрова в огонь. До рассвета он не дожил.'],
    ['c_leontich', 'Ася сидела рядом и держала его за руку. «Огонь не должен погаснуть», — это было последнее, что он сказал.']
  ],
  endA: [
    ['end_a', 'Грузовик уходил по объездной на запад. Ася смотрела назад, пока огни Дзержинска не скрылись в снегу.'],
    ['end_a', 'Сыворотку сделают. Лёва пообещал приехать и в этот раз собирался сдержать слово.']
  ],
  endB: [
    ['end_b', 'Арка Центрального парка. За ней Ока, пристань и лодки. Позади город, который должен сгореть на рассвете.'],
    ['end_b', 'Двое уходят по снегу и не оглядываются. Огонь на площади Героев ещё горит.']
  ],
  epi: [
    ['epi', 'Рассвет. Ася смеётся впервые за много дней…'],
    ['epi', '…и на секунду в её глазах вспыхивает зелёный свет.']
  ]
};
let slidesOn = false;
const SLIDE_CACHE = {};
function preloadScene(name){ (SCENES[name] || []).forEach(s => { if (!SLIDE_CACHE[s[0]]){ const im = new Image(); im.src = 'slides/' + s[0] + '.webp'; SLIDE_CACHE[s[0]] = im; } }); }
function playSlides(name, cb){
  const list = SCENES[name]; if (!list || !list.length){ cb && cb(); return; }
  if (window.__fastSlides){ (window.__scenes = window.__scenes || []).push(name); slidesOn = false; cb && cb(); return; }
  preloadScene(name);
  const el = document.getElementById('sl'), A = el.querySelector('.sla'), B = el.querySelector('.slb'), tx = el.querySelector('.slt'), dots = el.querySelector('.sld');
  slidesOn = true; input.x = input.y = 0; input.fire = false; el.style.display = 'block'; requestAnimationFrame(() => el.classList.add('on'));
  let i = -1, front = A, back = B, typer = 0, full = '', shown = 0, done = false;
  function type(){ clearInterval(typer); shown = 0; tx.textContent = ''; typer = setInterval(() => { shown += 2; tx.textContent = full.slice(0, shown); if (shown >= full.length) clearInterval(typer); }, 28); }
  function show(k){
    i = k; const s = list[i];
    const img = back; img.style.backgroundImage = 'url(slides/' + s[0] + '.webp)';
    img.classList.remove('kb0', 'kb1'); void img.offsetWidth; img.classList.add(i%2 ? 'kb1' : 'kb0');
    img.style.opacity = 1; front.style.opacity = 0; const t = front; front = back; back = t;
    full = s[1]; type();
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
