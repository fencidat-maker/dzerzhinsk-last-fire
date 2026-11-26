// ====================================================================== quests
const POI = {
  square: [-640, -420], admin: [-718, -516], apteka: [-60, 54], uvd: [-264, 156], kurd: [-440, 262], spire: [-504, 135],
  libch: [-545, 334], gen: [-175, -585], tir: [-391, -606], dkh: [-964, -593], flame: [-1570, 22], kotel: [-1213, 70],
  bania: [-175, -20], libpu: [-1335, -219], trauma: [25, 152], magnit: [-68, 0], blood: [120, 151], pyat: [5, 422],
  park: [-300, -590], tracks: [-1450, 120],
  mall: [-565, -600], pool: [-702, -690], cinema: [-651, -625], arch: [-527, -555], chapel: [-840, -570],
  stadium: [-640, -765], block: [-905, -545]
};
const NPC_PAL = {
  dvornik: {jacket: '#7a6a4a', jd: '#5f5238', hat: '#4a3f3a', fur: '#8a7f6c', scarf: '#c8c4b4', pants: '#3b3a46', boots: '#241f26', skin: '#e8c19a', pack: null},
  doctor:  {jacket: '#e8e4dc', jd: '#c8c2b8', hat: '#8a5a3a', fur: '#8a5a3a', scarf: '#9a8a7a', pants: '#4a3a4a', boots: '#2a2430', skin: '#f0cfae', pack: null},
  major:   {jacket: '#6a6e6a', jd: '#4e524e', hat: '#5a5e50', fur: '#6a6a60', scarf: '#2a2a2a', pants: '#3a3e3a', boots: '#1d1a20', skin: '#e5b992', pack: null},
  babka:   {jacket: '#6a4a3a', jd: '#52382c', hat: '#6a6a8a', fur: '#6a6a8a', scarf: '#8a6a4a', pants: '#4a4a50', boots: '#2a2430', skin: '#efcaa6', pack: null},
  engineer:{jacket: '#6a6a4a', jd: '#525238', hat: '#c8a86a', fur: '#c8a86a', scarf: '#3a3a3a', pants: '#34384a', boots: '#2a2430', skin: '#e8c19a', pack: '#8a6a3a'},
  priest:  {jacket: '#1d1a20', jd: '#141216', hat: '#1d1a20', fur: '#9a9a9a', scarf: '#c8c8c8', pants: '#1d1a20', boots: '#1d1a20', skin: '#e0b48c', pack: null},
  radio:   {jacket: '#5a6a5a', jd: '#465446', hat: '#7a4a2a', fur: '#7a4a2a', scarf: '#c8a86a', pants: '#35384f', boots: '#2a2430', skin: '#f3d2b0', pack: '#6a6a50'},
  asya:    {jacket: '#b03a30', jd: '#8a2c24', hat: '#6a3a2a', fur: '#6a3a2a', scarf: '#d9c9b0', pants: '#35384f', boots: '#2a2430', skin: '#f3d2b0', pack: null}
};
const NPCDEF = {
  dvornik:  {name: 'Леонтьич', pos: 'flame', pal: 'dvornik'},
  doctor:   {name: 'Раиса Павловна', pos: 'trauma', pal: 'doctor'},
  radio:    {name: 'Тимка-радист', pos: 'spire', pal: 'radio'},
  major:    {name: 'Майор Серёгин', pos: 'uvd', pal: 'major'},
  babka:    {name: 'Баба Нюра', pos: 'mall', pal: 'babka'},
  priest:   {name: 'Отец Николай', pos: 'chapel', pal: 'priest'},
  engineer: {name: 'Инженер Гордеев', pos: 'tir', pal: 'engineer', hidden: true},
  asya:     {name: 'Ася', pos: 'kotel', pal: 'asya', hidden: true}
};
const D1 = (n, t) => [n, t];
const L = 'Лёва';
// chapter labels = the ticking clock the player sees
const CH1 = 'Ночь первая', CH2 = 'Ночь первая · до зачистки 2 ночи', CH3 = 'Ночь вторая · до зачистки 1 ночь', CH4 = 'Последняя ночь · до рассвета';
const CHAINS = [
  {id: 'main', title: 'Последний огонь', main: true, steps: [
    // ---- Prologue
    {t: 'intro', ch: CH1, obj: 'Прослушайте голосовое от Аси', lines: [
      D1('Голосовое · Ася', 'Лёва… если ты это слышишь — я в ДКХ, тут свет. Папы больше нет. Не приходи ночью, слышишь? Они идут на шум…'),
      D1(L, 'Шесть лет я здесь не был. Площадь Героев… Ася, держись, я уже близко.'),
      D1(L, 'Там, у Вечного огня, кто-то жжёт костры. Значит, живые.')]},
    {t: 'goto', poi: 'flame', r: 9, obj: 'Идите к огню на площади Героев', spawn: ['flame', 3, ['walker'], 30]},
    {t: 'talk', who: 'dvornik', obj: 'Поговорите с дворником Леонтьичем', lines: [
      D1('Леонтьич', 'Сомов? Лёвка?! Вырос… Слушай правила, раз вернулся. Огня они боятся — к костру не подходят. Но идут на любой громкий звук, а голодной толпой лезут и в огонь.'),
      D1('Леонтьич', 'Днём ещё можно ходить. Ночью — только от костра к костру. На, монтировку держи. Стрелять будешь — сбежится весь квартал.')], give: {weapon: 'crowbar'}},
    {t: 'kill', n: 5, obj: 'Отбейте лагерь у Вечного огня', zone: ['flame', 70], spawn: ['flame', 6, ['walker'], 30]},
    {t: 'talk', who: 'dvornik', obj: 'Вернитесь к Леонтьичу', lines: [
      D1('Леонтьич', 'Руки помнят, а? У нас врачиха, Раиса Павловна, в травмпункте на Гайдара осталась. Отнеси ей хоть что-то из аптеки на Свердлова.'),
      D1('Леонтьич', 'А сестру твою… Видел её с фонарём, дня два назад. К центру шла.'),
      D1('Леонтьич', 'Помнишь сирену гражданской обороны на крыше администрации? Её на весь город было слышно. Мёртвые на такое сбегаются толпой. Учти.')], reward: {coins: 30}},
    {t: 'collect', obj: 'Найдите лекарства в аптеке на Свердлова', items: [{poi: 'apteka', name: 'Лекарства', dx: 4, dy: 3}], spawn: ['apteka', 5, ['walker', 'runner'], 22]},
    {t: 'talk', who: 'doctor', obj: 'Отнесите лекарства Раисе Павловне в травмпункт', lines: [
      D1('Раиса Павловна', 'Инсулин! Ты не представляешь… Слушай, мальчик на крыше дома со шпилем всю ночь крутит рацию. Он что-то поймал — сам не свой.'),
      D1('Раиса Павловна', 'И ещё. Ко мне приводили девочку в красном пальто. Ни царапины не взяла после укуса. Ни одной.')], reward: {coins: 40, med: 2}},
    {t: 'goto', poi: 'spire', r: 7, obj: 'Поднимитесь к радисту в доме со шпилем', spawn: ['spire', 5, ['walker', 'runner'], 24]},
    {t: 'talk', who: 'radio', obj: 'Поговорите с Тимкой-радистом', scene: 'radio', after: 'column', lines: [
      D1('Тимка', 'Военная частота! Слушай: «…центр Дзержинска — санитарная зачистка огнём, на рассвете третьих суток. Выживших не ожидается»…'),
      D1(L, 'Две ночи. У нас две ночи.'),
      D1('Тимка', 'Колонна эвакуации пойдёт с проспекта Ленина. Все побегут туда. Ты же тоже, да?'),
      D1(L, 'Нет. Я за сестрой.')], ch: CH2, reward: {coins: 40}},
    // ---- Act II-a
    {t: 'talk', who: 'major', obj: 'Найдите майора Серёгина в УВД на Гайдара', ch: CH2, lines: [
      D1('Серёгин', 'Сомов-младший. Отца твоего знал. Держи ПМ и не трать патроны на ерунду.'),
      D1('Серёгин', 'Девочку в красном видели у сквера Дзержинского. С ней мужик в очках — с завода, инженер. Найдёшь их — сообщи мне. Обязательно.')], give: {weapon: 'pm', ammo: 24}, reward: {coins: 50}},
    {t: 'kill', n: 7, obj: 'Прорвитесь через сквер Дзержинского', zone: ['square', 70], spawn: ['square', 9, ['walker', 'runner', 'chemist'], 34]},
    {t: 'collect', obj: 'Обыщите разграбленный «Дзержинец»', items: [{poi: 'mall', name: 'Батарейки', dx: 6, dy: 5}, {poi: 'mall', name: 'Бинты', dx: -8, dy: 4}, {poi: 'mall', name: 'Детская варежка', dx: 3, dy: -9}], spawn: ['mall', 7, ['walker', 'runner', 'chemist'], 30]},
    {t: 'talk', who: 'babka', obj: 'Поговорите с бабой Нюрой у «Дзержинца»', lines: [
      D1('Баба Нюра', 'Варежка-то красненькая… Видала я её. Девчушка с фонариком и очкастый. Шли к бассейну «Заря», он там внутри всё запирал.'),
      D1('Баба Нюра', 'Мертвяки воды боятся, что ли? Не знаю. Иди, иди, сынок.')], reward: {coins: 30}},
    {t: 'goto', poi: 'pool', r: 8, obj: 'Доберитесь до бассейна «Заря»', spawn: ['pool', 6, ['walker', 'runner'], 28]},
    {t: 'defend', poi: 'pool', r: 24, secs: 45, obj: 'Держитесь у бассейна, пока не стихнет', rate: 2.0, types: ['walker', 'runner', 'chemist']},
    {t: 'talk', who: 'priest', obj: 'Найдите отца Николая у часовни возле ДКХ', lines: [
      D1('Отец Николай', 'Девочку я благословил вчера. Она несла фонарь и всё повторяла: «Лёва приедет». Они ушли в Дворец культуры.'),
      D1('Отец Николай', 'Возьми свечи. И коктейли — прости меня, Господи, — у меня в сторожке их целый ящик.')], give: {mol: 4}, reward: {med: 1}},
    {t: 'defend', poi: 'cinema', r: 20, secs: 35, obj: 'Включите проектор в «Жюль Верне»: луч держит их', rate: 2.2, types: ['walker', 'runner', 'frost']},
    // ---- Midpoint
    {t: 'goto', poi: 'dkh', r: 9, obj: 'Войдите в ДКХ', scene: 'dkh', spawn: ['dkh', 7, ['walker', 'frost', 'chemist'], 30], ch: CH3, lines: [
      D1(L, 'Под ротондой… Это её фонарь. Ещё тёплый.'),
      D1('Кассета · Гордеев', '«Запись третья. Девочка не заражается. Её кровь — единственный шанс на сыворотку. Военные не должны узнать: они её не лечить будут, а резать.»'),
      D1('Кассета · Гордеев', '«Серёгин рыщет по городу. Прячу её там, где тепло. Если это слушает её брат — ищи меня в тире в парке.»')]},
    // ---- Act II-b
    {t: 'talk', who: 'engineer', obj: 'Найдите инженера Гордеева в тире Центрального парка', show: ['engineer'], lines: [
      D1('Гордеев', 'Ты Лёва? Похож… Я ранен, долго не протяну. Ася в котельной №42, там генератор и тепло.'),
      D1('Гордеев', 'Майор знает. Он хочет отдать её военным за место в колонне. Возьми мой автомат — и беги.')], give: {weapon: 'ak', ammo: 60}, reward: {coins: 80}},
    {t: 'goto', poi: 'kotel', r: 8, obj: 'Бегите в котельную №42', show: ['asya'], move: {major: 'kotel'}, spawn: ['kotel', 6, ['walker', 'brute'], 28]},
    {t: 'talk', who: 'major', obj: 'Майор Серёгин уже здесь', lines: [
      D1('Серёгин', 'Не дури, Сомов. Отдай девчонку. Военным нужен иммунный — нам всем дадут места в колонне. Всем!'),
      D1('Ася', 'Лёва!..'),
      D1(L, 'Нет.'),
      D1('Серёгин', 'Тогда сам и выкручивайся.'),
      D1('Ася', 'Он стреляет в воздух! Они услышат!')], hide: ['major'], reward: {}},
    {t: 'kill', n: 10, obj: 'Отбейтесь — выстрелы подняли весь квартал', zone: ['kotel', 70], spawn: ['kotel', 12, ['walker', 'runner', 'brute'], 30]},
    {t: 'escort', who: 'asya', poi: 'kotel', to: 'flame', obj: 'Отведите Асю к Вечному огню', spawn: ['flame', 7, ['walker', 'runner', 'frost'], 40]},
    {t: 'defend', poi: 'flame', r: 24, secs: 60, obj: 'Ночная атака! Удержите огонь', rate: 1.7, types: ['walker', 'runner', 'frost', 'brute', 'chemist'], onStart: 'flameOn'},
    {t: 'talk', who: 'dvornik', obj: 'Леонтьич ранен — подойдите к нему', after: 'leontich', lines: [
      D1('Леонтьич', 'Задели, черти… Ничего, Лёвка. Ты пришёл за ней. Не убежал.'),
      D1('Леонтьич', 'Огонь не должен погаснуть. Слышишь? Ни здесь… ни в тебе.')], hide: ['dvornik'], move: {radio: 'flame'}},
    {t: 'talk', who: 'radio', obj: 'Тимка бежит с рацией', ch: CH4, lines: [
      D1('Тимка', 'Зачистку перенесли! На ЭТОТ рассвет! Колонна уходит без нас — и вся орда тянется сюда, к огню!'),
      D1(L, 'Значит, уведу их сам. Сирена на администрации. А потом — стадион, там прожекторы.'),
      D1('Ася', 'Лёва, не уходи.'),
      D1(L, 'Я больше никуда не ухожу. Я просто иду вперёд.')]},
    // ---- Act III
    {t: 'defend', poi: 'admin', r: 22, secs: 45, obj: 'Включите сирену на крыше администрации и продержитесь', rate: 1.3, types: ['walker', 'runner', 'brute', 'chemist', 'frost']},
    {t: 'goto', poi: 'stadium', r: 10, obj: 'Уведите орду на стадион «Химик»', spawn: ['stadium', 8, ['walker', 'runner', 'brute'], 40]},
    {t: 'boss', poi: 'stadium', obj: 'Победите Аппаратчика на поле «Химика»', lines: [D1('Аппаратчик', '…СМЕНА… НЕ… ОКОНЧЕНА…')]},
    {t: 'choice', obj: 'Рассвет. Решите судьбу Аси', ch: CH4, opts: [
      {poi: 'block', r: 8, after: 'endA', label: 'Блокпост военных у ДКХ', lines: [
        D1('Военный', 'Иммунная? Грузите. Вы спасли, может быть, тысячи.'),
        D1('Ася', 'Ты же приедешь ко мне? Обещай.'),
        D1(L, 'Обещаю. Теперь — обещаю.')], end: 'Финал «Цена»: Ася уехала с колонной. Сыворотка будет.'},
      {poi: 'arch', r: 7, after: 'endB', label: 'Арка Центрального парка — путь к Оке', lines: [
        D1(L, 'Через парк — к Оке. Лодки у пристани. Никому тебя не отдам.'),
        D1('Ася', 'Смотри, Лёва… огонь на площади Героев ещё горит.'),
        D1(L, 'Пусть горит.')], end: 'Финал «Огонь»: вы ушли вдвоём. Город позади.'}
    ]},
    {t: 'intro', obj: 'Эпилог', after: 'epi', lines: [
      D1('', 'Рассвет над Дзержинском. Вечный огонь на площади Героев горит.'),
      D1('Ася', '…'),
      D1('', 'На секунду в глазах Аси вспыхивает зелёный свет. Конец первой главы.')], reward: {coins: 300}}
  ]},
  {id: 'side1', title: 'Самогон бабы Нюры', unlock: 12, steps: [
    {t: 'talk', who: 'babka', obj: 'Поговорите с бабой Нюрой', lines: [
      D1('Баба Нюра', 'Бугаи в трениках огня боятся пуще всего. Принеси три пустые бутылки с машин у «Дзержинца» — налью своего, крепкого, с тряпочкой.')]},
    {t: 'collect', obj: 'Соберите 3 бутылки у брошенных машин', items: [{poi: 'mall', name: 'Бутылка', dx: 14, dy: 10}, {poi: 'mall', name: 'Бутылка', dx: -15, dy: -6}, {poi: 'arch', name: 'Бутылка', dx: 6, dy: 6}], spawn: ['mall', 5, ['walker', 'runner'], 30]},
    {t: 'talk', who: 'babka', obj: 'Вернитесь к бабе Нюре', lines: [D1('Баба Нюра', 'Вот, держи. Не пей только — это для них.')], give: {weapon: 'obrez', ammo: 10, mol: 4}, reward: {coins: 60}}
  ]},
  {id: 'side2', title: 'Тир в парке', unlock: 17, steps: [
    {t: 'goto', poi: 'tir', r: 5, obj: 'Обыщите тир Центрального парка', lines: [D1('Тир', 'Под прилавком — коробка патронов и старая ТОЗ-8.')], give: {weapon: 'tozz', ammo: 25}, spawn: ['tir', 6, ['walker', 'frost'], 24]},
    {t: 'kill', n: 6, obj: 'Зачистите аллеи парка', zone: ['park', 110], spawn: ['park', 8, ['walker', 'runner', 'frost'], 40], reward: {coins: 80, ammo: 20}}
  ]}
];
const Quests = (function(){
  const ch = CHAINS.map(def => ({def, si: 0, done: false, active: !def.unlock, prog: 0, t: 0, started: false, items: [], npcSpawned: false}));
  let tracked = 0, completed = 0, dlg = null;
  const markers = [];
  function pos(p){ return Array.isArray(p) ? p : POI[p]; }
  function cur(c){ return c.done ? null : c.def.steps[c.si]; }
  function trackedChain(){ const c = ch[tracked]; if (c && c.active && !c.done) return c; for (let i = 0; i < ch.length; i++) if (ch[i].active && !ch[i].done){ tracked = i; return ch[i]; } return null; }
  function stepTarget(c){
    const s = cur(c); if (!s) return null;
    if (s.t === 'talk'){ const n = npcs[s.who]; return n ? [n.x, n.y] : null; }
    if (s.t === 'intro') return null;
    if (s.t === 'choice') return pos(s.opts[0].poi);
    if (s.t === 'collect'){ const it = c.items.find(i => !i.got); return it ? [it.x, it.y] : null; }
    if (s.t === 'escort'){ return c.escortGo ? pos(s.to) : [npcs[s.who].x, npcs[s.who].y]; }
    if (s.t === 'boss') return c.boss ? [c.boss.x, c.boss.y] : pos(s.poi);
    if (s.t === 'kill') return pos(s.zone ? s.zone[0] : (s.spawn ? s.spawn[0] : 'square'));
    return pos(s.poi);
  }
  function spawnRing(p, n, types, ring, tag){
    const c0 = pos(p);
    for (let k = 0; k < n; k++){
      for (let tr = 0; tr < 12; tr++){
        const a = Math.random()*TAU, r = ring*(0.35 + Math.random()*0.65), x = c0[0] + Math.cos(a)*r, y = c0[1] + Math.sin(a)*r;
        if (blocked(x, y, 0.6)) continue;
        const z = makeZombie(types[Math.floor(Math.random()*types.length)], x, y); z.keep = true; z.questTag = tag; z.still = Math.random() < 0.5; break;
      }
    }
  }
  function beginStep(c){
    const s = cur(c); if (!s) return; c.prog = 0; c.t = 0; c.items = []; c.escortGo = false; c.boss = null; c.begun = true; c.said = false;
    if (s.ch && c.def.main) S.chapter = s.ch;
    if (s.show) s.show.forEach(id => { if (npcs[id]) npcs[id].hidden = false; });
    if (s.move) for (const id in s.move){ const n = npcs[id]; if (n){ const p = freeNear(pos(s.move[id])[0] + 3, pos(s.move[id])[1] + 2, 0.5); n.x = p[0]; n.y = p[1]; n.hidden = false; n.follow = false; } }
    if (s.spawn) spawnRing(s.spawn[0], s.spawn[1], s.spawn[2], s.spawn[3], c.def.id);
    if (s.t === 'collect'){
      s.items.forEach(it => {
        const b = pos(it.poi), p = freeNear(b[0] + (it.dx || 0), b[1] + (it.dy || 0), 0.6);
        c.items.push({x: p[0], y: p[1], name: it.name, got: false});
      });
    }
    if (s.t === 'escort'){ const n = npcs[s.who]; const p = freeNear(...pos(s.poi), 0.6); n.x = p[0]; n.y = p[1]; n.follow = false; n.hp = 100; c.waitTalk = true; }
    if (s.t === 'boss'){ const p = freeNear(...pos(s.poi), 1.2); const z = makeZombie('boss', p[0], p[1]); z.keep = true; z.questTag = c.def.id; c.boss = z; z.alert = 999; }
    if (s.onStart === 'flameOn') flameLit = true;
    updateUI();
  }
  function finishStep(c){
    const s = cur(c); if (!s) return;
    if (s.hide) s.hide.forEach(id => { if (npcs[id]){ npcs[id].hidden = true; npcs[id].follow = false; } });
    if (s.give){
      if (s.give.weapon) { giveWeapon(s.give.weapon, s.give.ammo || 0); toast('Получено: ' + WEAPONS[s.give.weapon].name); }
      else if (s.give.ammo){ const id = S.owned.filter(i => WEAPONS[i].ammo && i !== 'molotov').pop(); if (id) S.ammo[WEAPONS[id].ammo] += s.give.ammo; }
      if (s.give.mol){ S.ammo['мол'] += s.give.mol; if (!S.owned.includes('molotov')) giveWeapon('molotov', 0); }
    }
    if (s.reward){
      if (s.reward.coins) S.coins += s.reward.coins;
      if (s.reward.med) S.med += s.reward.med;
      if (s.reward.weapon) giveWeapon(s.reward.weapon, s.reward.ammo || 0);
      if (s.reward.coins || s.reward.med) toast('+' + (s.reward.coins || 0) + ' ₽' + (s.reward.med ? ' · аптечки: ' + s.reward.med : '')); sfx('quest'); haptic('medium');
    }
    c.si++; completed++;
    zombies.forEach(z => { if (z.keep && z.questTag === c.def.id) z.keep = false; });
    if (c.si >= c.def.steps.length){ c.done = true; toast('Задание «' + c.def.title + '» выполнено!'); sfx('quest'); }
    else beginStep(c);
    // unlocks
    ch.forEach(o => { if (!o.active && o.def.unlock != null && completed >= o.def.unlock){ o.active = true; beginStep(o); toast('Новое задание: ' + o.def.title); } });
    hud(); updateUI();
  }
  function say(lines, cb, s){ const end = () => { if (s && s.after) playSlides(s.after, cb); else cb(); }; const go = () => { if (lines && lines.length && window.openDialog) openDialog(lines, end); else end(); }; if (s && s.scene) playSlides(s.scene, go); else go(); }
  function interact(){
    // returns true if consumed
    const c = trackedChain(); 
    for (const cc of [c].concat(ch.filter(o => o !== c && o.active && !o.done))){
      if (!cc) continue; const s = cur(cc); if (!s) continue;
      if (s.t === 'talk'){
        const n = npcs[s.who]; if (n && !n.hidden && Math.hypot(n.x - hero.x, n.y - hero.y) < 4.2){ say(s.lines, () => finishStep(cc), s); return true; }
      }
      if (s.t === 'escort' && cc.waitTalk){
        const n = npcs[s.who]; if (n && Math.hypot(n.x - hero.x, n.y - hero.y) < 4.2){ say([[n.name, 'Я с тобой. Только не оставляй меня одну.']], () => { n.follow = true; cc.waitTalk = false; toast(n.name + ' идёт за вами'); updateUI(); }); return true; }
      }
    }
    return false;
  }
  function canInteract(){
    for (const cc of ch){ if (!cc.active || cc.done) continue; const s = cur(cc); if (!s) continue;
      if (s.t === 'talk'){ const n = npcs[s.who]; if (n && !n.hidden && Math.hypot(n.x - hero.x, n.y - hero.y) < 4.2) return s.who; }
      if (s.t === 'escort' && cc.waitTalk){ const n = npcs[s.who]; if (n && Math.hypot(n.x - hero.x, n.y - hero.y) < 4.2) return s.who; }
    }
    return null;
  }
  function update(dt){
    for (const c of ch){
      if (!c.active || c.done) continue; const s = cur(c); if (!s) continue;
      if (!c.begun) beginStep(c);
      if (s.t === 'intro'){
        if (!c.said && !dlgLines){ c.said = true; say(s.lines, () => finishStep(c), s); }
      } else if (s.t === 'choice'){
        for (const o of s.opts){ const p = pos(o.poi); if (!c.said && Math.hypot(hero.x - p[0], hero.y - p[1]) < (o.r || 6)){ c.said = true; S.ending = o.end; say(o.lines, () => { toast(o.end, 6); finishStep(c); }, o); } }
      } else if (s.t === 'goto'){
        const p = pos(s.poi); if (Math.hypot(hero.x - p[0], hero.y - p[1]) < (s.r || 4)){
          if (s.lines && !c.said){ c.said = true; say(s.lines, () => { c.said = false; finishStep(c); }, s); } else if (!s.lines) finishStep(c);
        }
      } else if (s.t === 'collect'){
        for (const it of c.items){ if (!it.got && Math.hypot(hero.x - it.x, hero.y - it.y) < 1.8){ it.got = true; c.prog++; floater(it.x, it.y, it.name, '#ffe9b0'); sfx('pick'); haptic('light'); updateUI(); } }
        if (c.items.every(i => i.got)) finishStep(c);
      } else if (s.t === 'kill'){
        if (c.prog >= s.n) finishStep(c);
      } else if (s.t === 'defend'){
        const p = pos(s.poi), inz = Math.hypot(hero.x - p[0], hero.y - p[1]) < s.r;
        if (inz){ c.t += dt; c.spT = (c.spT || 0) - dt;
          if (c.spT <= 0 && zombies.length < 22){ c.spT = s.rate; spawnRing(s.poi, 1, s.types, s.r*1.5, c.def.id); const z = zombies[zombies.length - 1]; if (z){ z.alert = 20; z.still = false; z.keep = false; z.frenzy = true; } }
        }
        c.prog = Math.min(s.secs, c.t);
        if (c.t >= s.secs){ zombies.forEach(z => { if (z.questTag === c.def.id) z.hp = 0; }); finishStep(c); }
        if (c.t > 0.5 && c.lastToast !== inz){ c.lastToast = inz; if (!inz) toast('Вернитесь в зону обороны!'); }
      } else if (s.t === 'escort'){
        const n = npcs[s.who];
        if (n.follow){
          const p = pos(s.to); c.escortGo = true;
          if (Math.hypot(n.x - p[0], n.y - p[1]) < 7 && Math.hypot(hero.x - p[0], hero.y - p[1]) < 10){ n.follow = false; finishStep(c); }
        }
      } else if (s.t === 'boss'){
        if (c.boss && c.boss.hp <= 0){ finishStep(c); continue; }
        if (s.lines && !c.said && Math.hypot(hero.x - pos(s.poi)[0], hero.y - pos(s.poi)[1]) < 40){ c.said = true; say(s.lines, () => {}); }
      }
    }
  }
  function onKill(z){
    for (const c of ch){ if (!c.active || c.done) continue; const s = cur(c); if (!s) continue;
      if (s.t === 'kill'){ if (!s.zone || Math.hypot(z.x - pos(s.zone[0])[0], z.y - pos(s.zone[0])[1]) < s.zone[1]){ c.prog++; updateUI(); } }
      if (s.t === 'boss' && c.boss === z){ c.boss.hp = 0; }
    }
  }
  function onNpcDead(n){ toast(n.name + ' погибла. Миссия провалена — вернитесь и начните снова'); n.hp = 40; n.flash = 0.3; }
  function updateUI(){
    const c = trackedChain(); const elT = $('qt'), elO = $('qo'), elP = $('qp');
    if (!c){ elT.textContent = 'Все задания выполнены'; elO.textContent = 'Город свободен. Патрулируйте улицы.'; elP.style.width = '100%'; return; }
    const s = cur(c); let txt = s.obj;
    if (s.t === 'kill') txt += ' (' + Math.min(c.prog, s.n) + '/' + s.n + ')';
    if (s.t === 'collect') txt += ' (' + c.prog + '/' + c.items.length + ')';
    if (s.t === 'defend') txt += ' (' + Math.floor(c.prog) + '/' + s.secs + ' с)';
    if (s.t === 'escort' && c.waitTalk) txt = 'Подойдите к ' + (npcs[s.who] ? npcs[s.who].name : '') + ' и поговорите';
    if (s.t === 'choice') txt += ': ' + s.opts.map(o => o.label).join(' или ');
    elT.textContent = c.def.main ? (S.chapter || 'Основное') + ' · ' + c.def.title : 'Побочное · ' + c.def.title;
    elO.textContent = txt; elP.style.width = Math.round(100*c.si/c.def.steps.length) + '%';
  }
  function targets(){
    const out = []; const c = trackedChain(); if (c){ const s = cur(c); if (s && s.t === 'choice') s.opts.forEach(o => { const p = pos(o.poi); out.push({x: p[0], y: p[1], main: true}); }); else { const t = stepTarget(c); if (t) out.push({x: t[0], y: t[1], main: true}); } }
    ch.forEach(o => { if (o !== c && o.active && !o.done){ const t = stepTarget(o); if (t) out.push({x: t[0], y: t[1], main: false}); } });
    return out;
  }
  function itemsToDraw(){ const out = []; ch.forEach(c => { if (c.active && !c.done) c.items.forEach(i => { if (!i.got) out.push(i); }); }); return out; }
  function defendInfo(){ const c = trackedChain(); if (!c) return null; const s = cur(c); return s && s.t === 'defend' ? {p: pos(s.poi), r: s.r} : null; }
  return {update, interact, canInteract, onKill, onNpcDead, updateUI, targets, itemsToDraw, defendInfo, curType(){ const c = ch[0]; const s = c && cur(c); return s ? s.t : null; }, chains: ch, progressCount: () => completed, cycle(){ for (let k = 1; k <= ch.length; k++){ const i = (tracked + k)%ch.length; if (ch[i].active && !ch[i].done){ tracked = i; break; } } updateUI(); }, start(){ ch.forEach(c => { if (c.active) beginStep(c); }); updateUI(); }};
})();
let flameLit = false;
