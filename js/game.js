/* 全臺通緝令 MOST WANTED · TAIWAN — © 2026 Jax Huang・CC BY-NC 4.0（姓名標示-非商業性）・https://github.com/xiang0723/project-game-most-wanted-taiwan */
// 《全臺通緝令》遊戲主程式
(() => {
  const $ = (s) => document.querySelector(s);
  const LOC = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));
  const PROF = Object.fromEntries(PROFILES.map((p) => [p.id, p]));
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
  const START_HOUR = 8; // 星期一 08:00 接獲通報
  const INVESTIGATIONS = [
    { key: 'witness', label: '詢問目擊者', icon: '🗣️', cost: 1, heat: 2, hint: '他想去哪裡' },
    { key: 'camera', label: '調閱監視器', icon: '📹', cost: 2, heat: 3, hint: '票根、發票' },
    { key: 'phone', label: '調閱通聯紀錄', icon: '📱', cost: 2, heat: 2, hint: '方位＋交通工具' },
    { key: 'informant', label: '聯絡線民', icon: '🕶️', cost: 3, heat: 6, hint: '最準，但易打草驚蛇' },
  ];
  const TIER = { witness: 'c1', camera: 'c2', informant: 'c3' };
  const ZONE_R = { witness: 220, camera: 130, informant: 45 }; // 包圍網半徑（公里）
  const DIRS = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
  const BLOCK_HOURS = 24;
  // ---------- 行動經費（單位：萬元） ----------
  const FUND = { rookie: 30, detective: 50, master: 80 }; // 接案時公會撥的行動經費
  const FEE = { witness: 0, camera: 1, phone: 2 }; // 詢問目擊者免費；調閱要規費
  const INFORMANT_FEE = { rookie: [5, 12], detective: [8, 18], master: [12, 25] }; // 線民開價（浮動）
  // 封鎖調度費：看城市大小，3～6 萬
  const BLOCK_FEE_BY = {
    6: ['taipei', 'kaohsiung', 'taichung', 'tainan', 'taoyuan'],
    5: ['keelung', 'hsinchu', 'chiayi', 'hualien', 'yilan', 'taitung', 'magong', 'kinmen'],
    4: ['tamsui', 'miaoli', 'lukang', 'beigang', 'donggang', 'nangan', 'changhua', 'pingtung', 'douliu', 'jiaoxi'],
  };
  const blockFee = (id) => { const b = +(Object.keys(BLOCK_FEE_BY).find((k) => BLOCK_FEE_BY[k].includes(id)) || 3); return S && S.mod?.id === 'election' ? Math.round(b * 15) / 10 : b; };
  const isMod = (id) => !!S && S.mod?.id === id;
  const isMission = (id) => !!S && S.mission === id;
  // 偷渡時間提前：已知港口任務推估出來的時間窗也要一起提前
  function cutDeadline(h) { S.deadline -= h; if (S.port?.win) S.port.win = S.port.win.map((x) => x - h); }
  const shortClock = (h) => { const t = START_HOUR + h; return `週${WEEK[(1 + Math.floor(t / 24)) % 7]} ${String(Math.floor(((t % 24) + 24) % 24)).padStart(2, '0')}時`; };
  // 案件總賞金（集團＝所有成員合計）
  const caseReward = (c) => (c.gang ? c.gang.members.reduce((a, m) => a + m.fugitive.reward, 0) : c.fugitive.reward);
  const caseStops = (c) => (c.gang ? c.gang.members.reduce((a, m) => a + m.route.length, 0) : c.diff.stops);
  const DEBT_LIMIT = 200; // 負債超過就由公會強制紓困
  const START_GRANT = 100; // 入行補助
  const PAPER = '島嶼晨報';
  // 懸賞危險等級（取代難易度）：★ 小咖、★★ 要犯、★★★ 頭號要犯
  const STARS = { rookie: 1, detective: 2, master: 3 };
  const STAR_NAME = { rookie: '小咖', detective: '要犯', master: '頭號要犯' };
  const REWARD = { rookie: [50, 150], detective: [200, 400], master: [500, 900] }; // 懸賞金（萬元）
  const starStr = (k) => '★'.repeat(STARS[k]) + '☆'.repeat(3 - STARS[k]);
  // 抓捕追逐：聽聲音判斷他往哪裡跑
  // 嫌犯的簡訊：追得近他會慌，追得慢他會嗆
  const TAUNTS = {
    start: ['想抓我？先追得上再說。', '聽說有賞金獵人接了我的單？祝你好運，你會需要的。', '我的身價可不便宜，別讓我失望啊。'],
    late: ['你在{place}撲空了吧？我早就走啦。', '{place}的小吃不錯吧？我吃飽才走的。', '慢慢來，我不趕時間……你才要趕。', '又晚了一步，獵人。'],
    close: ['……剛剛那台車是你吧？', '怎麼這麼快就追來了？', '別再跟了！我警告你！', '你是怎麼找到這裡的？'],
    final: ['船快到了，再見啦，獵人。', '再撐幾個小時，我就自由了。'],
    wrong: ['{place}的風景不錯吧？可惜我不在那裡。', '方向錯囉，獵人。', '你去{place}幹嘛？哈哈。'],
    trapped: ['可惡！是你叫人封鎖的吧！', '封鎖線？算你狠……'],
    alert: ['你們動作很大嘛，我都聽說了。', '別以為我不知道有人在追我。'],
    raidfail: ['差一點點喔～', '撲空的感覺怎麼樣？', '下次記得看清楚再衝。'],
    nemesis: ['又是你？上次讓我跑了，這次也一樣。', '好久不見啊，獵人。我可沒忘記你。', '上次的帳，我們慢慢算。'],
  };
  // 偷渡倒數的模糊情資（取代只看數字）
  const ESCAPE_HINTS = [[36, '📡 情資：蛇頭開始在港口附近找船了。'], [18, '📡 情資：有人看到漁港在加油、搬補給，船快準備好了。'], [8, '📡 情資：走私船已經在外海待命，他隨時會走！']];
  // 被他的眼線看到的機率（動作越大越容易）
  const WATCH_P = { witness: 0.04, camera: 0.08, phone: 0.08, informant: 0.2, block: 0.25 };
  const NEWS_FILLER = ['氣象局：明日各地晴到多雲', '高鐵今日班次正常', '今日油價不調整', '立法院今日休會', '颱風動態持續觀察中', '夜市人潮回流，攤商笑開懷'];
  const mpick = (a) => a[Math.floor(Math.random() * a.length)]; // 純文字用，不影響每日挑戰的亂數

  // _staging（測試版）用自己的存檔，不影響線上版；第一次進來先複製一份線上版的進度
  const STG = location.pathname.includes('/_staging/');
  const keyOf = (k) => (STG ? k.replace(/^roc-chase-/, 'roc-stg-') : k);
  if (STG) {
    try {
      if (!localStorage.getItem('roc-stg-copied')) {
        Object.keys(localStorage).filter((k) => k.startsWith('roc-chase-') && k !== 'roc-chase-muted').forEach((k) => localStorage.setItem(keyOf(k), localStorage.getItem(k)));
        localStorage.setItem('roc-stg-copied', '1');
      }
    } catch { /* 無痕模式等情況忽略 */ }
  }
  const store = {
    get(k, d) { try { const v = localStorage.getItem(keyOf(k)); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(keyOf(k), JSON.stringify(v)); } catch { /* 無痕模式等情況忽略 */ } },
  };

  let map = null;
  const markers = {};
  let S = null;        // 目前案件狀態
  let pending = null;  // 已產生、尚未接下的案件
  let selected = null;
  let busy = false;
  let raidTimer = null;
  let raidLeft = 0;
  let unread = 0;
  let bubbleTimer = null;
  let hot = new Set(); // 包圍網內的可疑地點
  const mq = window.matchMedia('(max-width: 900px)');
  const isMobile = () => mq.matches;
  const vibrate = (p) => { try { if (navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate(p); } catch { /* 不支援就略過 */ } };

  // ---------- 工具 ----------
  // R：亂數來源。看板上的案子用固定種子，同一張通緝令每次重建都一樣
  let R = Math.random;
  const rand = (n) => Math.floor(R() * n);
  const pick = (a) => a[rand(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const half = (h) => Math.round(h * 2) / 2;
  const weighted = (items, ws) => { let t = R() * ws.reduce((a, b) => a + b, 0); for (let i = 0; i < items.length; i++) { t -= ws[i]; if (t <= 0) return items[i]; } return items[items.length - 1]; };
  function mulberry32(a) {
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  function km(a, b) {
    const Rr = 6371, r = Math.PI / 180;
    const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
    return 2 * Rr * Math.asin(Math.sqrt(h));
  }

  function bearing(a, b) {
    const r = Math.PI / 180;
    const y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r);
    const x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r);
    return (Math.atan2(y, x) / r + 360) % 360;
  }

  // 交通方式與耗時（小時）
  function travelPlan(a, b) {
    const d = km(a, b);
    let mode, hours;
    if (a.zone === b.zone && a.zone === 'main') {
      if (d < 60) { mode = '🚓 警車'; hours = 0.5 + d / 50; }
      else { mode = '🚄 高鐵／臺鐵'; hours = 1 + d / 120; }
    } else if (a.zone === b.zone) {
      mode = '⛴️ 島際交通船'; hours = 1 + d / 35;
    } else if (BOAT_ZONES.includes(a.zone) || BOAT_ZONES.includes(b.zone)) {
      mode = '⛴️ 轉乘交通船'; hours = 2 + d / 60;
    } else {
      mode = '✈️ 國內線班機'; hours = 2.5 + d / 400;
    }
    return { km: Math.round(d), mode, hours: Math.max(1, half(hours)) };
  }
  const modeKey = (m) => (m.includes('✈️') ? 'air' : m.includes('⛴️') ? 'boat' : 'land');

  function clock(h) {
    const total = START_HOUR + h;
    const day = Math.floor(total / 24);
    const hh = Math.floor(total % 24), mm = Math.round((total % 1) * 60);
    return `星期${WEEK[(1 + day) % 7]} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
  const hourOfDay = (h) => (((START_HOUR + h) % 24) + 24) % 24;
  const fmtH = (h) => (h % 1 ? h.toFixed(1) : h) + ' 小時';

  // ---------- 獵人檔案（經驗值、技能、專案進度、累計賞金） ----------
  const PROFILE_KEY = 'roc-chase-profile';
  const me = { xp: 0, skills: [], saga: 0, money: 0, ...store.get(PROFILE_KEY, {}) };
  // 獵人等級：每輪懸賞結算時升降（舊存檔依逮捕數換算，最高先給到金牌）
  const RANKS = ['見習獵人', '銅牌獵人', '銀牌獵人', '金牌獵人', '傳奇獵人'];
  // 等級越高，看板上的通緝犯越危險
  const RANK_MIX = [
    ['rookie', 'rookie', 'detective', 'detective'],
    ['rookie', 'detective', 'detective', 'master'],
    ['rookie', 'detective', 'master', 'master'],
    ['detective', 'detective', 'master', 'master'],
    ['detective', 'master', 'master', 'master'],
  ];
  if (me.rank == null) {
    const n = store.get('roc-chase-stats', { solved: 0 }).solved;
    me.rank = n >= 12 ? 3 : n >= 7 ? 2 : n >= 3 ? 1 : 0;
  }
  const rankName = (r = me.rank) => RANKS[clamp(r, 0, RANKS.length - 1)];
  const saveMe = () => store.set(PROFILE_KEY, me);
  if (!me.granted) { me.granted = true; me.money = (me.money || 0) + START_GRANT; saveMe(); }
  me.probation = me.probation || 0;
  // 金額到小數第一位（0.1 萬 = 1 千元）
  const r1 = (n) => Math.round(n * 10) / 10;
  const fmtMoney = (n) => `${n < 0 ? '−' : ''}${Math.abs(r1(n))} 萬`;
  // 每項技能花多少點記在 paid（舊存檔的技能都是 1 點換來的）
  if (!me.paid) { me.paid = {}; me.skills.forEach((id) => { me.paid[id] = 1; }); }
  me.skills = me.skills.filter((id) => SKILLS.some((k) => k.id === id));
  const spentPoints = () => me.skills.reduce((a, id) => a + (me.paid[id] || 1), 0);
  const skillPoints = () => Math.floor(me.xp / XP_PER_POINT) - spentPoints();
  const has = (id) => !!S && !S.noSkills && me.skills.includes(id);
  const isProf = (id) => !!S && S.profile.id === id;

  // ---------- 花錢：先用行動經費，不夠再從存款扣（可以扣到負數＝負債） ----------
  function charge(amt, what) {
    if (!S || S.free || amt <= 0) return;
    const fromFund = Math.min(S.fund, amt);
    S.fund = r1(S.fund - fromFund);
    const rest = r1(amt - fromFund);
    if (rest) me.money = r1(me.money - rest);
    S.spentTotal = r1(S.spentTotal + amt);
    saveMe();
    if (rest && me.money < 0) SFX.buzzer(); else SFX.cash();
    radio(`💸 ${what}：支出 ${amt} 萬${rest ? `（經費不夠，${rest} 萬${me.money < 0 ? '先賒帳' : '從存款支付'}）` : ''}`, rest && me.money < 0 ? 'hot' : '');
  }
  function travelFee(from, to) {
    const p = travelPlan(from, to); const mk = modeKey(p.mode);
    // 控制在 0.1～1 萬之間
    const v = mk === 'air' ? 0.4 + p.km * 0.0018 : mk === 'boat' ? 0.3 + p.km * 0.002 : p.km * 0.002;
    return Math.min(1, Math.max(0.1, r1(v * (isMod('holiday') ? 2 : 1)))); // 連假加倍，但仍不超過 1 萬
  }
  // 線民每次開價不同（同一站同一次調查內不變）；用 Math.random，不影響案件亂數
  function invFee(kind) {
    if (!S || S.free) return 0;
    if (kind !== 'informant') return FEE[kind] || 0;
    if (S.quote[S.current] == null) { const [lo, hi] = INFORMANT_FEE[S.diffKey] || INFORMANT_FEE.rookie; S.quote[S.current] = lo + Math.floor(Math.random() * (hi - lo + 1)); if (isMod('tipline')) S.quote[S.current] = Math.max(1, Math.round(S.quote[S.current] / 2)); }
    const q = S.quote[S.current];
    return S.cb && S.cb.informant ? r1(q * (100 - S.cb.informant) / 100) : q;
  }
  // 負債超過上限：公會代償，依序沒收技能 → 扣技能點 → 降級 → 保護管束
  function bailout() {
    if (me.money > -DEBT_LIMIT) return null;
    const debt = -me.money;
    me.money = 0;
    let cost;
    if (me.skills.length) {
      const id = me.skills.pop(); const c = me.paid[id] || 1; delete me.paid[id];
      me.xp = Math.max(0, me.xp - XP_PER_POINT * c);
      const k = SKILLS.find((s) => s.id === id);
      cost = `沒收技能 ${k ? `${k.icon} ${k.name}` : ''}`;
    } else if (skillPoints() > 0) { me.xp = Math.max(0, me.xp - XP_PER_POINT); cost = '扣除 1 個技能點'; }
    else if (me.rank > 0) { me.rank--; cost = `降級為「${rankName()}」`; }
    else { me.probation += 3; cost = `進入保護管束，接下來 ${me.probation} 張逮捕成功的懸賞金會被公會抽走 50%`; }
    saveMe();
    return { debt, cost };
  }

  // ---------- 案件產生 ----------
  // 依嫌犯側寫挑選逃亡路線
  function routeWeight(from, to, prof) {
    const d = km(from, to);
    if (prof === 'flyer') return to.zone !== from.zone ? 5 : 0.6;
    if (prof === 'local') return Math.exp(-d / 90) + 0.005;
    if (prof === 'mountain') return MOUNTAIN.includes(to.id) ? 6 : to.zone === 'main' ? 1 : 0.25;
    return 1;
  }

  // 舊看板的案子用第一版地點重建（同一個種子才會得到同一個案子）
  const POOL_V1 = LOCATIONS.filter((l) => LOC_V1.includes(l.id));
  function buildRoute(n, prof, pool = LOCATIONS) {
    for (let tries = 0; tries < 300; tries++) {
      const route = [pick(pool).id];
      while (route.length < n) {
        const from = LOC[route[route.length - 1]];
        const cands = pool.filter((l) => !route.includes(l.id));
        route.push(weighted(cands, cands.map((l) => routeWeight(from, l, prof))).id);
      }
      if (NO_FINAL.includes(route[route.length - 1])) continue;
      if (prof !== 'local' && prof !== 'mountain' && !route.some((id) => LOC[id].zone !== 'main')) continue;
      return route;
    }
    return pool.slice(0, n).map((l) => l.id);
  }

  const PREFERRED_HIDE = { mountain: ['mountain', 'temple', 'bnb'], nightowl: ['market', 'netcafe', 'station'] };
  function pickHideout(locId, prof) {
    const ok = HIDEOUTS.filter((h) => !(h.coastOnly && INLAND.includes(locId)));
    const pref = ok.filter((h) => (PREFERRED_HIDE[prof] || []).includes(h.id));
    return pick(pref.length && R() < 0.75 ? pref : ok);
  }

  // mode：normal＝一般案件、bounty＝懸賞看板、saga＝連續劇專案、tutorial＝新手教學
  const TUT_ROUTE = ['taipei', 'taichung', 'kaohsiung'];
  const TUT_PROFILE = { id: 'tutor', icon: '🎓', name: '菜鳥逃犯', desc: '第一次逃亡，沒什麼反偵查經驗，很適合練手。' };
  // ---------- 嫌犯頭像 ----------
  // 從頭像的外觀挑兩個不同類型的特徵當通緝海報線索
  function pickClues(seed) {
    const all = shuffle(Avatar.clues(seed));
    const vivid = all.filter((c) => /^(kind|hair|acc-|facial|build)/.test(c.cat));
    const first = (vivid.length ? vivid : all)[0];
    const second = all.find((c) => c.cat !== first.cat && !(c.cat === 'age' && first.cat === 'height'));
    return [first.text, second.text];
  }
  const faceOf = (f, opt) => (f.avatar ? Avatar.svg(f.avatar, opt) : `<span class="emoji-face">${f.face || '👤'}</span>`);
  const sexBadge = (male) => `<i class="sex ${male ? 'm' : 'f'}" title="${male ? '男' : '女'}">${male ? '♂' : '♀'}</i>`;

  function makeFugitive(rewardKey, tutorial = false) {
    const avatar = 1 + Math.floor(R() * 2147483646);
    const look = Avatar.describe(avatar);
    return {
      name: pick(SURNAMES) + pick(look.male ? GIVEN_M : GIVEN_F), alias: (() => { const a = pick(look.male ? ALIASES_M : ALIASES_F); return a === '阿嬤' && look.age < 55 ? '大姊頭' : a === '阿伯' && look.age < 55 ? '老K' : a; })(),
      avatar, male: look.male, look,
      traits: pickClues(avatar),
      reward: tutorial ? 30 : (() => { const [lo, hi] = REWARD[rewardKey]; return lo + rand((hi - lo) / 10 + 1) * 10; })(),
    };
  }

  function makeCase(diffKey, mode = 'normal', seed = null, pool = LOCATIONS, missionId = null) {
    const mission = mode === 'bounty' && missionId && MISSIONS[missionId] ? missionId : null;
    R = seed != null ? mulberry32(seed) : Math.random;
    let chapter = null;
    const tutorial = mode === 'tutorial';
    if (mode === 'saga') { chapter = SAGA.chapters[me.saga % SAGA.chapters.length]; diffKey = chapter.diff; }
    if (tutorial) diffKey = 'rookie';
    const diff = tutorial ? { ...DIFFICULTIES.rookie, label: '新手教學', stops: TUT_ROUTE.length } : DIFFICULTIES[diffKey];
    const profile = tutorial ? TUT_PROFILE : chapter ? PROF[chapter.profile] : pick(PROFILES);
    const route = tutorial ? TUT_ROUTE.slice() : buildRoute(mission === 'gang' ? 3 : diff.stops, profile.id, pool);
    // 每一站都有藏身處（提前追上時攻堅用），最後一站是最終藏身處
    const hideouts = route.map((id) => pickHideout(id, profile.id));
    const fugitive = makeFugitive(diffKey, tutorial);
    const caseFile = chapter ? { crime: chapter.crime, intro: chapter.intro } : mission === 'hostage' ? HOSTAGE_CASE : mission === 'gang' ? GANG_CASE : pick(CASES);
    const head = tutorial ? 3 : 4 + rand(4) + (diffKey === 'master' ? 2 : 0); // 逃犯領先的時數
    // 集團：其他成員（最後一個是老大，賞金最高、路線最長）
    let gang = null;
    if (mission === 'gang') {
      const n = 2 + rand(2);
      fugitive.reward = (() => { const [lo, hi] = REWARD.rookie; return lo + rand((hi - lo) / 10 + 1) * 10; })();
      const members = [{ profile, route, hideouts, fugitive }];
      for (let j = 1; j < n; j++) {
        const boss = j === n - 1;
        const prof = pick(PROFILES.filter((p) => !members.some((m) => m.profile.id === p.id)));
        const r = buildRoute(boss ? (diffKey === 'master' ? 5 : 4) : 3, prof.id, pool);
        members.push({ profile: prof, route: r, hideouts: r.map((id) => pickHideout(id, prof.id)), fugitive: makeFugitive(boss ? diffKey : 'rookie') });
      }
      gang = { members, idx: 0, pay: 0, score: 0, caught: [] };
    }
    const fill = (t) => t.replaceAll('{name}', fugitive.name).replaceAll('{place}', LOC[route[0]].name).replaceAll('{n}', gang ? gang.members.length : '');
    // 案件狀況：見習難度有一半機率沒有；特殊任務、教學與連續劇不抽
    const mod = mission || tutorial || chapter || (diffKey === 'rookie' && R() < 0.5) ? null : pick(CASE_MODS);
    const rewardX = mod?.id === 'election' ? 1.2 : mission === 'hostage' ? 1.3 : 1;
    if (rewardX > 1) fugitive.reward = Math.round((fugitive.reward * rewardX) / 10) * 10;
    let deadline = diff.deadline - (mission === 'hostage' ? 15 : 0);
    if (gang) deadline = gang.members.reduce((a, m) => a + m.route.length, 0) * 13 + 10;
    // 贓物：藏在中途某一站（不是第一站、也不是最後一站）
    let loot = null;
    if (mission === 'loot') {
      const at = 1 + rand(route.length - 2);
      const stash = pick(STASHES.filter((s) => !(s.coastOnly && INLAND.includes(route[at]))));
      loot = { at, stash: stash.id, hint: 0, tried: [], found: false, opts: null };
    }
    const port = mission === 'port' ? { final: route[route.length - 1], win: null, switched: false } : null;
    return {
      mode, chapter, diffKey, diff, profile, fugitive, caseFile, route, hideouts,
      noSkills: tutorial,
      free: tutorial, fund: tutorial ? 0 : FUND[diffKey], quote: {}, spentTotal: 0,
      intro: fill(caseFile.intro), outro: chapter ? fill(chapter.outro) : '',
      fug: { idx: 0, arrive: [-head - 6], depart: [-head] },
      deadline, mod, mission, loot, port, gang, payRate: 1,
      stage: 0, current: route[0], time: 0,
      alert: mod?.id === 'media' ? 35 : 10, blocksLeft: Math.max(1, diff.blocks - (mod?.id === 'election' ? 1 : 0)), blocks: [],
      decoys: {}, known: {}, rerouted: {},
      used: {}, zones: {}, notes: [], trail: [{ lat: LOC[route[0]].lat, lng: LOC[route[0]].lng }],
      visited: new Set([route[0]]), seenHere: {}, alarmed: {}, flags: {}, eventsSeen: [],
      strikes: 0, raiding: null, over: false, early: false, descs: {},
      chase: null, taunted: {}, lastTaunt: -99,
      cb: {}, cardsUsed: {}, cardLog: [], // 本案用過的卡牌效果
    };
  }

  function startCase(c) {
    S = c;
    if (has('stamina')) S.deadline += 6;
    if (has('extrablock')) S.blocksLeft += 1;
    selected = null;
    $('#log').innerHTML = '';
    $('#notes').innerHTML = '<li class="empty">尚無線索。先在當地展開調查。</li>';
    unread = 0; updateBadge(); closeDrawer();
    $('#bubble').hidden = true;
    radio(`📟 ${clock(0)}　${S.intro}你接下了這張懸賞！`);
    radio(`🧠 犯罪側寫：${S.profile.icon} ${S.profile.name}——${S.profile.desc}`);
    if (S.mod) radio(`⚠️ 案件狀況：${S.mod.icon} ${S.mod.name}——${S.mod.desc}`, 'hot');
    if (S.mission) radio(`⭐ 特殊任務：${MISSIONS[S.mission].icon} ${MISSIONS[S.mission].name}——${MISSIONS[S.mission].desc}`, 'hot');
    tut = S.mode === 'tutorial' ? { i: 0 } : null;
    $('#coach').hidden = !tut;
    map.clearRaid(); map.clearZones();
    map.setTrail(S.trail);
    map.focus(LOC[S.route[0]].lat, LOC[S.route[0]].lng, 8);
    refreshZones();
    if (S.port) addNote('🚢 偷渡情資', `情資指出：他最後會從${LOC[S.port.final].name}（${LOC[S.port.final].county}）偷渡出境，但不知道船什麼時候來。太早去那裡盯梢，或封鎖那裡，他可能改走別的港口。`, true);
    if (S.loot) addNote('🎒 贓物', '他把贓物藏在逃亡途中的某一站。調查時留意有沒有人看到他搬運、寄放東西，查到了再「🔦 搜查贓物」。', true);
    if (S.gang) addNote('🕸️ 集團', `集團共 ${S.gang.members.length} 人。第一個目標：${S.fugitive.name}（綽號「${S.fugitive.alias}」）。`, true);
    if (S.nemesis) radio(`🔁 宿敵回歸：上次讓${S.fugitive.name}跑了，這次他記得你，一開始就特別警覺。`, 'hot');
    $('#news').hidden = true; S.newsAt = null;
    newsUpdate();
    render();
    if (S.mode !== 'tutorial') { const c = S; setTimeout(() => { if (S === c && !S.over) taunt(S.nemesis ? 'nemesis' : 'start'); }, 2600); }
  }

  // ---------- 嫌犯簡訊（嗆聲／慌張） ----------
  // 文字用 Math.random 挑，不影響每日挑戰的亂數
  let smsTimer = null;
  function taunt(kind, place = '', force = false) {
    if (!S || S.over || S.mode === 'tutorial') return;
    if (!force && S.time - S.lastTaunt < 4) return; // 別太吵
    S.lastTaunt = S.time;
    const pool = TAUNTS[kind];
    const text = pool[Math.floor(Math.random() * pool.length)].replaceAll('{place}', place);
    $('#sms-face').innerHTML = faceOf(S.fugitive);
    $('#sms-text').textContent = text;
    const box = $('#sms');
    box.hidden = true; void box.offsetWidth; box.hidden = false;
    clearTimeout(smsTimer);
    smsTimer = setTimeout(() => { box.hidden = true; }, 5200);
    SFX.sms();
    vibrate([40, 60, 40]);
    radio(`📵 ${S.fugitive.name}傳來簡訊：「${text}」`);
  }

  // ---------- 逃犯行動 ----------
  const lastIdx = () => S.route.length - 1;
  const budget = () => S.diff.budget + (has('network') ? 1 : 0) + (S.cb.extra && S.cb.extra.loc === S.current ? S.cb.extra.n : 0);
  const invCost = (inv) => (S.cb.quick > 0 ? 0 : Math.max(1, inv.cost - (has('quick') && (inv.key === 'camera' || inv.key === 'phone') ? 1 : 0)));

  function stayHours() {
    if (S.mode === 'tutorial') return 1; // 教學：他每站只停一下，讓玩家練習「追到下一站」
    const [mn, mx] = S.diff.stay;
    return Math.max(3, half((mn + R() * (mx - mn)) * (1 - S.alert / 250))) + (isMod('holiday') ? 2 : 0);
  }

  // 夜貓子只在 20:00～02:00 之間出發
  function nightSnap(t) {
    if (!isProf('nightowl')) return t;
    const h = hourOfDay(t);
    if (h >= 20 || h < 2) return t;
    return t + (20 - h) + half(R() * 5);
  }

  // 颱風：星期二（開局後 16～40 小時）出發的跨海移動多 8 小時
  const stormDelay = (a, b, t) => (isMod('typhoon') && a.zone !== b.zone && t >= 16 && t < 40 ? 8 : 0);

  // 依側寫挑一個「看起來合理」的地點（假線索、改路線用）
  function plausibleStop(from, exclude) {
    const cands = LOCATIONS.filter((l) => !exclude.includes(l.id));
    return weighted(cands, cands.map((l) => routeWeight(from, l, S.profile.id))).id;
  }

  // 逃犯離開一站時的反應：警覺越高，越可能留假線索、臨時改變路線
  function reactOnDepart(i) {
    if (S.mode === 'tutorial') return;
    const F = S.fug, here = LOC[S.route[i]];
    const easy = S.diffKey === 'rookie' ? 0.5 : 1;
    // 留假線索：讓這一站的目擊者、監視器指向另一個地方
    const decoyP = ((S.alert >= 55 ? 0.35 : S.alert >= 35 ? 0.15 : 0) + (isProf('fox') ? 0.25 : 0) + (isMod('accomplice') ? 0.4 : 0)) * easy;
    if (R() < decoyP) S.decoys[i] = plausibleStop(here, [here.id, S.route[i + 1]]);
    // 改變路線：最後一站（偷渡點）不變；你已經搶先到下一站埋伏就不改
    if (i + 1 >= lastIdx() || S.stage > i) return;
    const nextId = S.route[i + 1];
    const blockedNext = S.blocks.some((b) => b.loc === nextId && b.until > F.depart[i]);
    let p = Math.max(0, S.alert - 30) / 100 + (isProf('fox') ? 0.1 : 0) + (S.diffKey === 'master' ? 0.05 : 0) + (isMission('port') ? 0.15 : 0);
    if (blockedNext && S.alert >= 25) p += 0.5; // 聽到下一站被封鎖的風聲
    if (R() >= p * easy) return;
    const later = S.route.slice(i + 1);
    // 三成機率折返到之前待過的地方，讓人意想不到
    const back = S.route.slice(0, i).filter((id) => id !== here.id && id !== S.current && !later.includes(id));
    const busyNow = S.blocks.filter((b) => b.until > F.depart[i]).map((b) => b.loc);
    const to = back.length && R() < 0.3 ? pick(back) : plausibleStop(here, [...S.route, ...busyNow]);
    S.route[i + 1] = to;
    S.hideouts[i + 1] = pickHideout(to, S.profile.id);
    S.rerouted[i] = true;
  }

  // 這個地點重新有新足跡：調查次數與包圍網重置
  function resetSpot(id) { S.used[id] = []; S.zones[id] = []; if (S.quote) delete S.quote[id]; }

  // 依目前時間推進逃犯的位置（含封鎖判定）
  function advanceFugitive() {
    const F = S.fug;
    while (F.idx < lastIdx() && S.time >= F.depart[F.idx]) {
      const i = F.idx;
      const here = S.route[i];
      const blk = S.blocks.find((b) => b.loc === here && !b.triggered && b.from <= F.depart[i] && F.depart[i] < b.until);
      if (blk) {
        blk.triggered = true;
        if (R() < Math.max(has('block') ? 0.65 : 0.45, (S.cb.wall || 0) / 100)) {
          // 封鎖成功：他被困住 4～9 小時
          F.depart[i] = Math.min(blk.until, F.depart[i] + 4 + rand(6));
          heat(10);
          radio(`🚧 ${LOC[here].name}的封鎖線攔下一名形跡可疑的人，對方轉身逃回市區！他被困住了！`, 'hot');
          taunt('trapped', '', true);
          continue;
        }
        heat(5);
        radio(`🚧 ${LOC[here].name}回報：有可疑人士搭漁船繞過了封鎖線……`, 'hot');
      }
      reactOnDepart(i);
      const tr = travelPlan(LOC[here], LOC[S.route[i + 1]]).hours + stormDelay(LOC[here], LOC[S.route[i + 1]], F.depart[i]);
      F.idx = i + 1;
      F.arrive[i + 1] = F.depart[i] + tr;
      F.depart[i + 1] = nightSnap(F.arrive[i + 1] + stayHours());
      if (S.current === here && S.stage === i) {
        // 他離開後留下新的足跡，可以重新調查
        resetSpot(here);
        if (S.time - F.depart[i] < 6) radio('📻 線報：嫌犯剛剛離開這裡了！快追！', 'hot');
      }
    }
  }

  // 玩家所在站與逃犯的關係：ahead＝他還沒到、present＝他就在這、left＝他已離開、off＝走錯地方
  function trackState() {
    if (S.current !== S.route[S.stage]) return 'off';
    const k = S.stage, F = S.fug;
    if (F.idx < k || S.time < F.arrive[k]) return 'ahead';
    if (k === lastIdx() || S.time < F.depart[k]) return 'present';
    return 'left';
  }
  const sinceLeft = () => S.time - S.fug.depart[S.stage];

  function heat(n) {
    if (n > 0 && isProf('jumpy')) n *= 1.3;
    if (n > 0 && S.cb.hush) n *= 1 - S.cb.hush / 100;
    S.alert = clamp(S.alert + n, 0, 100);
    if (S.alert >= 70 && !S.flags.a70) {
      S.flags.a70 = true; cutDeadline(8);
      radio('⚠️ 情資：嫌犯已經察覺有人在追他，聯絡蛇頭把偷渡時間提前了 8 小時！', 'hot');
      taunt('alert', '', true);
    }
    if (S.alert >= 90 && !S.flags.a90) {
      S.flags.a90 = true; cutDeadline(8);
      radio('⚠️ 情資：嫌犯極度警覺，偷渡時間再度提前 8 小時！', 'hot');
    }
    if (isMission('hostage') && !S.over) {
      if (S.alert >= 60 && !S.flags.h60) { S.flags.h60 = true; radio('🆘 警告：嫌犯情緒越來越不穩，人質處境危險！警覺到 80% 就來不及了。', 'alarm'); }
      if (S.alert >= 80 && !S.flags.h80) {
        S.flags.h80 = true;
        radio('🆘 嫌犯察覺警方逼近，情緒失控了！', 'alarm');
        const c = S;
        setTimeout(() => { if (S === c && !S.over) { map.clearRaid(); endGame(false, `${S.fugitive.name}察覺警方逼近而情緒失控，人質受傷送醫，嫌犯趁亂逃逸、偷渡出境。`); } }, 900);
      }
    }
  }

  // 花費時間；回傳 false 表示遊戲已結束
  function spend(h) {
    const was = trackState();
    S.time += h;
    S.alert = clamp(S.alert - h * 0.5, 0, 100);
    advanceFugitive();
    // 你埋伏的地方他剛好抵達：有新的足跡可以調查
    if (was === 'ahead' && trackState() === 'present') { resetSpot(S.current); refreshZones(); }
    portWatch(h);
    if (S.time >= S.deadline) {
      endGame(false, `時間到了！${S.fugitive.name}已經在深夜搭上走私船，逃離國境。`);
      return false;
    }
    escapeHints();
    newsUpdate();
    checkEncounter();
    return true;
  }

  // ---------- 緊張感 ----------
  // 偷渡倒數到某個程度，傳來模糊的情資
  function escapeHints() {
    if (S.port || S.mode === 'tutorial' || S.over) return;
    const left = S.deadline - S.time;
    let msg = '';
    ESCAPE_HINTS.forEach(([h, t], i) => { if (left <= h && !S.flags['eh' + i]) { S.flags['eh' + i] = true; msg = t; } });
    if (msg) radio(msg, 'hot');
  }

  // 新聞快報：每 6 小時換一次，有時夾帶真假難辨的目擊消息
  function newsUpdate() {
    if (S.mode === 'tutorial' || S.over) return;
    if (S.newsAt != null && S.time - S.newsAt < 6) return;
    S.newsAt = S.time;
    const f = S.fugitive, F = S.fug;
    const lines = [`警方追緝${S.caseFile.crime}嫌犯${f.name}進入第 ${Math.max(1, Math.round(S.time))} 小時`];
    if (S.alert >= 60) lines.push(`消息人士：${f.name}已察覺遭到追緝，行蹤更加隱密`);
    let tip = '';
    if (S.time > 0 && R() < 0.45) {
      const truth = S.route[F.idx];
      const real = F.arrive[F.idx] <= S.time && R() < 0.5;
      const place = real ? LOC[truth] : pick(LOCATIONS.filter((l) => l.id !== truth));
      tip = `網路瘋傳：有民眾在${place.name}拍到疑似${f.name}的身影，警方表示查證中`;
      lines.push(tip);
    }
    lines.push(isMod('typhoon') ? '颱風逼近，多條航線停駛' : mpick(NEWS_FILLER));
    $('#news-text').textContent = lines.join('　　◆　　');
    $('#news').hidden = false;
    if (tip && isMobile()) radio(`📺 ${tip}`);
  }

  // 擦身而過：抵達時他剛走不到 2 小時，留下的痕跡指出他的方向
  function nearMiss() {
    if (S.mode === 'tutorial' || trackState() !== 'left' || S.stage >= lastIdx()) return false;
    const ago = sinceLeft();
    if (ago > 2 || S.flags['near' + S.stage]) return false;
    S.flags['near' + S.stage] = true;
    const here = LOC[S.current], next = LOC[S.route[S.stage + 1]];
    const brg = bearing(here, next);
    const dir = DIRS[Math.round(brg / 45) % 8];
    S.seenHere[S.current] = true; S.known[S.current] = true;
    (S.zones[S.current] ||= []).push({ type: 'sector', brg: (Math.round(brg / 45) * 45) % 360, r: 600 });
    const sign = mpick(['他喝到一半的茶還是溫的', '床鋪上還留著他的體溫', '菸灰缸裡的菸還在冒煙', '櫃台說他剛剛才退房']);
    addNote(`🔥 ${here.name}・擦身而過`, `${sign}……他${ago < 1 ? '不到 1 小時前' : `約 ${Math.round(ago)} 小時前`}才離開，往${dir}方走了！`, true);
    showAlarm('🔥 差一點！他剛走');
    SFX.heartbeat(); vibrate([80, 60, 80]);
    radio(`🔥 ${clock(S.time)}　擦身而過！他剛離開${here.name}，往${dir}方去了！`, 'hot');
    return true;
  }

  // 被他的眼線看到：警覺上升
  function watched(kind) {
    if (S.over || S.mode === 'tutorial') return;
    const p = WATCH_P[kind] * (S.alert >= 50 ? 1.5 : 1) * (has('stealth') ? 0.6 : 1);
    if (R() >= p) return;
    heat(6);
    showAlarm('👁 有人在看你');
    radio(`👁 ${clock(S.time)}　街角有人一直盯著你，講了幾句電話就走了……他的眼線把你的動向傳回去了（警覺 +6）。`, 'hot');
  }

  // 緊急線報：限時 10 秒決定要不要搭警車趕過去（可能是真的，也可能認錯人）
  function maybeSighting(p = 0.15) {
    if (!S || S.over || S.mode === 'tutorial' || S.raiding || S.chase || busy || (S.flags.sight || 0) >= 2) return false;
    if (!$('#event').hidden || trackState() === 'present') return false;
    if (R() >= p) return false;
    const F = S.fug, truth = S.route[F.idx];
    const canReal = F.arrive[F.idx] <= S.time && truth !== S.current;
    const real = canReal && R() < (has('tipster') ? 0.7 : 0.5);
    const near = LOCATIONS.filter((l) => l.id !== truth && l.id !== S.current && km(LOC[S.current], l) < 350);
    const place = real ? LOC[truth] : pick(near.length ? near : LOCATIONS.filter((l) => l.id !== truth && l.id !== S.current));
    S.flags.sight = (S.flags.sight || 0) + 1;
    const rushH = Math.max(1, half(travelPlan(LOC[S.current], place).hours * 0.6));
    const skip = () => addNote('📞 緊急線報（未查證）', `有人說在${place.name}看到他，真假不明。`, null);
    showEvent('📞 緊急線報！', `派出所來電：「有人在${place.name}看到一個很像通緝犯的人，就在剛剛！」\n\n警車可以載你直奔${place.name}（約 ${fmtH(rushH)}，加收 3 萬調度費）。可能是真的，也可能只是長得像。`, [
      { label: '🚓 立刻趕過去', run: () => { S.rush = rushH; selected = place.id; travel(); } },
      { label: '先記下來', run: skip },
    ], { sec: 10, run: () => { radio('📞 你猶豫太久，對方掛斷了……', 'hot'); skip(); } });
    return true;
  }

  // 已知港口：他還沒到之前就在港口盯梢，風聲會傳出去
  function portWatch(h) {
    if (!S.port || S.port.switched || S.over) return;
    if (S.current !== S.port.final || S.fug.idx >= lastIdx()) return;
    heat(h * 1.5);
    if (S.alert >= 75) switchPort('港口的蛇頭回報最近有便衣在盯');
  }
  function switchPort(why) {
    if (!S.port || S.port.switched || S.fug.idx >= lastIdx()) return;
    S.port.switched = true;
    const last = lastIdx(), from = LOC[S.route[last - 1]];
    const cands = LOCATIONS.filter((l) => !S.route.includes(l.id) && !INLAND.includes(l.id) && !NO_FINAL.includes(l.id));
    const to = weighted(cands, cands.map((l) => routeWeight(from, l, S.profile.id))).id;
    S.route[last] = to;
    S.hideouts[last] = pickHideout(to, S.profile.id);
    S.port.win = null;
    if (S.stage >= last) S.stage = Math.max(0, S.fug.idx - 1);
    radio(`📡 情資：${why}，他取消了原本的船，改從別的港口出境！`, 'hot');
    addNote('📡 偷渡點變更', `他放棄從${LOC[S.port.final].name}出境，改走別的港口。新的偷渡點和時間都要重新查。`, false);
  }

  function checkEncounter() {
    if (S.over || trackState() !== 'present' || S.alarmed[S.stage]) return;
    S.alarmed[S.stage] = true;
    SFX.siren();
    const fin = S.stage === lastIdx();
    radio(fin ? '🚨 情資確認：嫌犯就躲在這一帶，準備偷渡出境！查出藏身處，申請搜索票攻堅！'
      : '🚨 他還在這裡！嫌犯尚未離開，現在攻堅就能提前逮人！', 'alarm');
    flash();
    showAlarm(fin ? '🚨 嫌犯就在這一帶！' : '🚨 他還在這裡！');
    vibrate([200, 100, 200, 100, 400]);
  }

  // ---------- 包圍網 ----------
  function circleZone(t, r) {
    r *= (S.diffKey === 'master' ? 1.2 : 1) * (has('tight') ? 0.8 : 1);
    const ang = R() * Math.PI * 2, off = R() * 0.55 * r;
    return { type: 'circle', lat: t.lat + (off * Math.cos(ang)) / 111, lng: t.lng + (off * Math.sin(ang)) / (111 * Math.cos((t.lat * Math.PI) / 180)), r };
  }

  function inZone(z, l) {
    const here = LOC[S.current];
    switch (z.type) {
      case 'circle': return km(z, l) <= z.r;
      case 'sector': { const d = Math.abs(((bearing(here, l) - z.brg + 540) % 360) - 180); return d <= 30 && km(here, l) <= z.r; }
      case 'name': return l.name.includes(z.ch);
      case 'county': return l.county.includes(z.ch) && l.county.endsWith(z.suffix);
      case 'mode': return modeKey(travelPlan(here, l).mode) === z.key;
      default: return false;
    }
  }

  // 找出符合最多條線索的地點，在地圖上標成可疑
  function refreshZones() {
    const zs = (S && S.zones[S.current]) || [];
    hot = new Set();
    if (zs.length) {
      let best = 0; const cnt = {};
      LOCATIONS.forEach((l) => {
        if (l.id === S.current) return;
        cnt[l.id] = zs.filter((z) => inZone(z, l)).length;
        best = Math.max(best, cnt[l.id]);
      });
      if (best) hot = new Set(Object.keys(cnt).filter((id) => cnt[id] === best));
    }
    if (S) map.setZones(zs, LOC[S.current]);
    refreshMarkers();
    frameHot();
  }

  // ---------- 線索 ----------
  function pickFresh(pool) {
    const fresh = pool.filter((t) => !S.notes.includes(t));
    return pick(fresh.length ? fresh : pool);
  }

  const pickDecoy = (next) => pick(LOCATIONS.filter((l) => l.id !== next.id && l.id !== S.current));

  function phoneClue(from, to) {
    let brg = bearing(from, to);
    // 警覺高時嫌犯可能使用假手機，訊號方位失準
    if (S.alert >= 40 && R() < 0.35 && !has('gpsfix') && !S.truthNow) brg = (brg + 90 + R() * 180) % 360;
    const dir = DIRS[Math.round(brg / 45) % 8];
    const d = km(from, to);
    let dist = '', radius = 450;
    if (S.diff.phone === 'exact') { const r = Math.max(10, Math.round(d / 10) * 10); dist = `，距離約 ${r} 公里`; radius = r * 1.25; }
    else if (S.diff.phone === 'range') {
      const lo = Math.floor(d / 100) * 100;
      dist = lo === 0 ? '，距離不到 100 公里' : `，距離約 ${lo}～${lo + 100} 公里`;
      radius = lo + 120;
    }
    const mk = modeKey(travelPlan(from, to).mode);
    const pay = mk === 'air' ? '信用卡有一筆國內線機票的消費紀錄'
      : mk === 'boat' ? '信用卡有一筆交通船船票的消費紀錄'
      : '沒有機票或船票的購買紀錄，應該是走陸路';
    return { text: `基地台訊號顯示他往${dir}方移動${dist}。${pay}。`, good: true, zone: { type: 'sector', brg: Math.round(brg / 45) * 45, r: radius * (has('gpsfix') ? 0.75 : 1) } };
  }

  // 物證推理題：只露出目的地的一部分
  function evidenceClue(t) {
    const mk = modeKey(travelPlan(LOC[S.current], t).mode);
    if (R() < 0.5) {
      const chars = [...t.name];
      const k = rand(chars.length);
      const masked = chars.map((c, i) => (i === k ? c : '□')).join('');
      const word = mk === 'air' ? '登機證' : mk === 'boat' ? '船票' : '車票';
      return { text: `🧩 監視器拍到他丟掉一張${word}。撿回來只剩殘片，目的地只看得到「${masked}」。`, good: true, zone: { type: 'name', ch: chars[k] } };
    }
    const cc = [...t.county];
    const k = rand(cc.length - 1);
    const masked = cc.map((c, i) => (i === k || i === cc.length - 1 ? c : '□')).join('');
    return { text: `🧩 他在超商丟掉的發票背面，手寫著一個地址開頭：「${masked}……」`, good: true, zone: { type: 'county', ch: cc[k], suffix: cc[cc.length - 1] } };
  }

  function makeClue(kind) {
    const st = trackState();
    if (st === 'off') return { text: pick(kind === 'phone' ? PHONE_DEAD_ENDS : DEAD_ENDS), good: false };
    if (st === 'ahead') return { text: kind === 'phone' ? '基地台還沒有收到他的手機訊號……他可能還在路上。' : '這裡還沒人見過他。也許他還沒到？可以考慮埋伏。', good: true };
    const hide = S.hideouts[S.stage];
    if (st === 'present') {
      if (kind === 'phone') return { text: '他的手機訊號就在附近的基地台！他還在這一帶！', good: true };
      if (kind === 'camera' && isMod('holiday') && R() < 0.3) return { text: '連假人潮太多，畫面裡全是人頭，找不到他。', good: false };
      return { text: pickFresh(hide[TIER[kind]]), good: true };
    }
    // left：線索指向下一站；時間拖太久，線索會變冷
    const ago = sinceLeft();
    if (kind === 'camera' && ago > (has('sharpeye') ? 96 : 48)) return { text: '監視器畫面已經被覆蓋，什麼都沒留下。', good: false };
    const next = LOC[S.route[S.stage + 1]];
    if (kind === 'phone') return phoneClue(LOC[S.current], next);
    if (kind === 'camera' && isMod('holiday') && R() < 0.3) return { text: '連假人潮太多，監視器畫面裡找不到他。', good: false };
    let decoyP = 0;
    if (kind === 'informant') decoyP = S.diff.falseLead * (has('liar') ? 0.5 : 1) * (isMod('tipline') ? 0.5 : 1) + (isProf('fox') ? 0.1 : 0);
    if (kind === 'camera' && isProf('fox')) decoyP = 0.2;
    // 他（或共犯）在這站留下的假線索：監視器容易被騙，線民偶爾也會
    if (S.truthNow) decoyP = 0;
    const planted = S.truthNow ? null : S.decoys[S.stage];
    let target = R() < decoyP ? pickDecoy(next) : next;
    if (planted && target === next && R() < (kind === 'camera' ? 0.5 : 0.15)) target = LOC[planted];
    if (kind === 'camera' && (isProf('jumpy') || R() < 0.4)) return evidenceClue(target);
    const c = { text: pickFresh(target[TIER[kind]]), good: true, zone: circleZone(target, ZONE_R[kind]) };
    if (kind === 'informant') {
      if (S.rerouted[S.stage]) c.text += '（線民補充：他本來不是要去那裡，是臨時改變計畫的。）';
      // 線民獨有：有機會問出他最後要從哪裡偷渡（每案一次）
      if (!S.flags.finalTip && !S.port && S.stage + 1 < lastIdx() && R() < 0.35) {
        S.flags.finalTip = true;
        c.text += `　另外聽說：他最後打算從「${LOC[S.route[lastIdx()]].county}」一帶偷渡出境。`;
      }
    }
    return c;
  }

  // ---------- 目擊者問答 ----------
  function witnessQuestions(st, liar, planted = null) {
    // 含糊的回答：走錯地方和他還沒到時都可能出現，分不出是哪一種
    const vagueP = S.mode === 'tutorial' ? 0 : S.diffKey === 'rookie' ? 0.3 : 0.55;
    const vague = () => (R() < vagueP ? { text: pick(WIT_VAGUE), good: null, vague: true } : null);
    const dead = (q) => ({ q, a: () => vague() || { text: pick(WIT_DEAD), good: false } });
    if (st === 'off') return [dead('有看過照片上這個人嗎？'), dead('最近有可疑的外地人嗎？'), dead('這附近有什麼地方可以躲人？')];
    if (st === 'ahead') {
      const a = () => vague() || { text: pick(['沒看過耶。不過剛剛有人打電話來問今晚還有沒有空房……', '還沒看過這個人。你要不要在這裡等等看？', '沒見過。他會來這裡嗎？']), good: true };
      return [{ q: '有看過照片上這個人嗎？', a }, { q: '最近有可疑的外地人嗎？', a }, { q: '有人打聽過住宿嗎？', a }];
    }
    const hide = S.hideouts[S.stage];
    if (st === 'present') {
      const fin = S.stage === lastIdx();
      const left = Math.max(1, Math.round(fin ? S.deadline - S.time : S.fug.depart[S.stage] - S.time));
      return [
        { q: '最近有看到他嗎？', a: () => ({ text: pickFresh(hide.c2), good: true }) },
        { q: '他平常都在哪一帶活動？', a: () => ({ text: pickFresh(hide.c1), good: true }) },
        { q: '他有說要待多久嗎？', a: () => ({ text: fin ? `他說再過 ${left} 小時左右，會有船來接他。` : `他說大概再待 ${left} 個小時就要走了。`, good: true }) },
      ];
    }
    // left
    const ago = sinceLeft();
    if (ago > (has('memory') ? 48 : 24)) {
      const a = () => ({ text: '想了很久：「太久了，我記不清楚了……」', good: false });
      return [{ q: '他往哪裡去了？', a }, { q: '他什麼時候離開的？', a }, { q: '他是怎麼離開的？', a }];
    }
    const next = LOC[S.route[S.stage + 1]];
    const target = liar ? pickDecoy(next) : planted ? LOC[planted] : next;
    return [
      { q: '他有說要去哪裡嗎？', a: () => {
        // 目擊者只看到片段：可能是他說的話、在地特色、交通方式或大概的方向，要和其他調查交叉比對
        const tv = (window.LOC_TRIVIA || {})[target.id];
        const easy = S.mode === 'tutorial' ? 1 : S.diffKey === 'rookie' ? 0.6 : 0.3;
        const r = R();
        if (r < easy) return { text: pickFresh(target.c1), good: true, zone: circleZone(target, ZONE_R.witness) };
        if (tv && r < easy + 0.25) return { text: pickFresh(tv) + (has('trivia') ? `（聽口音，應該是${target.county}一帶）` : ''), good: true, zone: circleZone(target, 160), trivia: true };
        const here = LOC[S.current];
        if (r < easy + 0.5) {
          const mk = modeKey(travelPlan(here, target).mode);
          const text = mk === 'air' ? '他沒說要去哪，只看到他拖著行李箱，叫了一台往機場的計程車。'
            : mk === 'boat' ? '他沒說要去哪，只問我碼頭怎麼走，說要趕船。' : '他沒說要去哪，只看到他往火車站和客運站那個方向走了。';
          return { text, good: true, zone: { type: 'mode', key: mk } };
        }
        const brg = Math.round(bearing(here, target) / 45) * 45;
        return { text: `他沒說要去哪，只聽他講電話說要「往${DIRS[(brg / 45) % 8]}邊走」。`, good: true, zone: { type: 'sector', brg: brg % 360, r: 600 } };
      } },
      { q: '他什麼時候離開的？', a: () => {
        const v = liar ? Math.max(1, Math.round(ago) + (R() < 0.5 ? -1 : 1) * (5 + rand(8))) : Math.max(1, Math.round(ago));
        return { text: `他大概是 ${v} 個小時前走的。`, good: true };
      } },
      { q: '他是怎麼離開的？', a: () => {
        const mk = modeKey(travelPlan(LOC[S.current], target).mode);
        const text = mk === 'air' ? '我看到他拖著行李箱，叫了一台往機場的計程車。'
          : mk === 'boat' ? '他問我碼頭怎麼走，說要趕船。' : '他往火車站和客運站那個方向走了。';
        return { text, good: true, zone: { type: 'mode', key: mk } };
      } },
    ];
  }

  // 詢問目擊者：跟其他調查一樣，點了直接取得線索
  // 他離開後＝「他有說要去哪裡嗎？」；他還在＝「最近有看到他嗎？」
  function openWitness(inv) {
    const st = trackState();
    const w = pick(WITNESSES);
    const liarP = st !== 'left' || S.mode === 'tutorial' ? 0 : ({ rookie: 0.1, detective: 0.2, master: 0.3 }[S.diffKey] || 0.2) + (isProf('fox') ? 0.2 : 0);
    const liar = !S.truthNow && R() < liarP;
    const tell = liar ? (has('liar') || R() < 0.65) : (S.mode !== 'tutorial' && !has('liar') && R() < 0.1);
    // 他（或共犯）事先收買、套好話的目擊者：講得很自然，看不出破綻
    const planted = st === 'left' && !liar && !S.truthNow && S.decoys[S.stage] && R() < 0.5 ? S.decoys[S.stage] : null;
    const c = witnessQuestions(st, liar, planted)[0].a();
    c.text = `${w.face} ${w.role}${tell ? `（${pick(TELLS)}，神色可疑）` : ''}：「${c.text}」${c.trivia ? '　💡在地線索' : ''}`;
    applyClue(inv, c);
  }

  // ---------- 行動 ----------
  function investigate(kind) {
    if (busy || S.over || S.raiding || S.chase) return;
    const inv = INVESTIGATIONS.find((i) => i.key === kind);
    const used = (S.used[S.current] ||= []);
    if (used.includes(kind) || used.length >= budget()) return;
    SFX.click();
    const present = trackState() === 'present';
    const quick = S.cb.quick > 0;
    if (quick) S.cb.quick--;
    S.truthNow = S.cb.truth > 0;
    if (S.truthNow) S.cb.truth--;
    if (!spend(quick ? 0 : invCost(inv))) return;
    const fee = invFee(kind);
    (S.used[S.current] ||= []).push(kind);
    S.seenHere[S.current] = true;
    charge(fee, kind === 'informant' ? '線民開價' : kind === 'witness' ? '請目擊者喝飲料' : `${inv.label}規費`);
    // 他就在附近時打草驚蛇的風險加倍
    heat((present ? inv.heat * 2 : inv.heat) * (has('stealth') ? 0.6 : 1));
    // 他就在附近時，打聽太多可能讓他察覺而逃走
    const spook = (0.15 + S.alert / 150 + (isProf('jumpy') ? 0.15 : 0)) * (has('ghost') ? 0.5 : 1);
    if (S.mode !== 'tutorial' && present && trackState() === 'present' && R() < spook && S.stage < lastIdx()) {
      addNote(`${inv.icon} ${LOC[S.current].name}・${inv.label}`, '糟了！他察覺有人在打聽他的下落，連夜溜走了！', false);
      SFX.lose();
      S.fug.depart[S.stage] = S.time;
      advanceFugitive();
      refreshZones();
      render();
      return;
    }
    if (kind === 'witness') openWitness(inv);
    else applyClue(inv, makeClue(kind));
    S.truthNow = false;
  }

  // 已知港口：通聯、線民可以推估開船時間
  function portHint(kind, c) {
    if (!S.port || S.port.switched || (kind !== 'phone' && kind !== 'informant') || trackState() === 'off') return;
    const w = kind === 'informant' ? 6 : 16;
    if (S.port.win && S.port.win[1] - S.port.win[0] <= w) return;
    if (kind === 'phone' && R() < 0.4) return;
    const lo = Math.max(S.time, half(S.deadline - w * (0.2 + R() * 0.6)));
    S.port.win = [lo, lo + w];
    c.text += kind === 'phone' ? `　📞 通聯裡有一通打給蛇頭的電話，約好「${shortClock(lo)}～${shortClock(lo + w)}」之間開船。`
      : `　🚢 線民還說：船大概「${shortClock(lo)}～${shortClock(lo + w)}」之間來。`;
  }
  // 追回贓物：在藏匿的那一站調查，有機會查到搬運、寄放的線索
  function lootHint(kind, c) {
    const L = S.loot;
    if (!L || L.found || S.stage !== L.at || S.current !== S.route[L.at] || kind === 'phone') return;
    const st = trackState();
    if (st !== 'present' && st !== 'left') return;
    const k = STASHES.find((s) => s.id === L.stash);
    if (kind === 'informant') { L.hint = 2; c.text += `　🎒 ${k.h2}`; return; }
    if (R() < (kind === 'camera' ? 0.7 : 0.6)) { L.hint = Math.max(L.hint, 1); c.text += `　🎒 ${k.h1}`; }
  }
  const lootReady = () => !!S && !!S.loot && !S.loot.found && S.loot.hint > 0 && S.current === S.route[S.loot.at] && !S.over;
  function searchLoot() {
    if (busy || S.over || S.raiding || S.chase || !lootReady()) return;
    SFX.click();
    if (!spend(2)) return;
    const L = S.loot;
    if (!L.opts) {
      const real = STASHES.find((s) => s.id === L.stash);
      const others = shuffle(STASHES.filter((s) => s.id !== real.id && !(s.coastOnly && INLAND.includes(S.current)))).slice(0, 2);
      L.opts = shuffle([real, ...others]).map((s) => s.id);
    }
    const left = L.opts.filter((id) => !L.tried.includes(id));
    showEvent('🔦 搜查贓物', `花了 2 小時調查附近，鎖定幾個可能藏東西的地方。\n\n要搜哪一處？（搜錯不會怎樣，但要再花 2 小時才能重新搜）`, left.map((id) => {
      const s = STASHES.find((x) => x.id === id);
      return { label: `${s.icon} ${s.name}`, cls: 'btn', run: () => {
        if (id === L.stash) {
          L.found = true;
          SFX.stamp(); setTimeout(() => SFX.kaching(), 300);
          addNote(`🎒 ${LOC[S.current].name}・搜查贓物`, `在${s.name}找到了贓物！全數查扣。`, true);
          radio(`🎒 ${clock(S.time)}　在${s.name}起出贓物！現在只差把人抓回來。`, 'hot');
        } else {
          L.tried.push(id);
          SFX.dud();
          addNote(`🎒 ${LOC[S.current].name}・搜查贓物`, `${s.name}搜遍了，什麼都沒有。`, false);
          radio(`🎒 ${clock(S.time)}　搜查${s.name}撲空。`);
        }
      } };
    }));
    render();
  }

  function applyClue(inv, c) {
    portHint(inv.key, c);
    lootHint(inv.key, c);
    addNote(`${inv.icon} ${LOC[S.current].name}・${inv.label}`, c.text, c.good);
    if (!c.vague) S.known[S.current] = true;
    // 查到走錯地方：他偶爾會傳簡訊嘲笑（每個地點最多一次）
    if (!c.vague && trackState() === 'off' && !S.taunted[S.current] && Math.random() < 0.35) { S.taunted[S.current] = true; taunt('wrong', LOC[S.current].name); }
    if (c.zone) { (S.zones[S.current] ||= []).push(c.zone); refreshZones(); }
    c.good ? SFX.clue() : SFX.dud(); // 含糊（null）也算沒用
    if (c.zone && hot.size && hot.size <= 8) setTimeout(() => SFX.ping(), 350);
    radio(`${inv.icon} ${clock(S.time)}　在${LOC[S.current].name}${inv.label}。`);
    if (hot.size && c.zone) radio(hot.size <= 8 ? `🎯 包圍網縮小：符合線索的地點剩下 ${hot.size} 處（地圖上閃紅光）。` : `🎯 包圍網：還有 ${hot.size} 處符合，再多查一些線索。`);
    watched(inv.key);
    render();
    const cs = S;
    setTimeout(() => { if (S === cs) maybeSighting(0.1); }, 1600);
  }

  // 已經查到「他還沒到」：埋伏就會一直等到他現身（最多 12 小時）
  const AMBUSH_MAX = 12;
  const ambushSuggested = () => !!S && !S.over && trackState() === 'ahead' && !!S.known[S.current];
  // 埋伏按鈕的提示：只用玩家已經知道的資訊（調查過、或已經響過警報）說明現在適不適合等
  function waitHint() {
    const st = trackState();
    if (st === 'present' && S.alarmed[S.stage]) return { t: '他就在這裡！別等，快攻堅', no: true };
    if (!S.known[S.current]) return { t: '還沒調查，先查再決定', no: false };
    if (st === 'left') return { t: '他已經離開，等也沒用', no: true };
    if (st === 'off') return { t: '這裡沒他的蹤跡，他不會來', no: true };
    if (st === 'present') return { t: '他就在這裡！別等，快攻堅', no: true };
    return null;
  }
  function wait() {
    if (busy || S.over || S.raiding || S.chase) return;
    SFX.click();
    const h = has('ambush') ? 1 : 2;
    if (ambushSuggested()) {
      SFX.tock();
      radio(`🕵️ ${clock(S.time)}　你在${LOC[S.current].name}找了個隱密的位置，開始埋伏……`);
      let total = 0;
      while (total < AMBUSH_MAX && trackState() === 'ahead') {
        if (trackState() !== 'ahead') break;
        if (!spend(h)) return;
        total += h;
      }
      const came = trackState() === 'present';
      radio(came ? `⏳ ${clock(S.time)}　埋伏 ${total} 小時後，他出現了！` : `⏳ ${clock(S.time)}　埋伏了 ${total} 小時，他還沒出現。可以繼續埋伏，或重新推理。`, came ? 'hot' : '');
      render();
      return;
    }
    if (!spend(h)) return;
    SFX.tock();
    radio(`⏳ ${clock(S.time)}　你在${LOC[S.current].name}埋伏了 ${h} 小時。`);
    render();
  }

  function blockade(id) {
    if (busy || S.over || S.raiding || S.blocksLeft <= 0 || !id) return;
    if (S.blocks.some((b) => b.loc === id && b.until > S.time)) return;
    S.blocksLeft--;
    charge(blockFee(id), `${LOC[id].name}封鎖調度費`);
    const bh = BLOCK_HOURS + (has('longblock') ? 12 : 0);
    S.blocks.push({ loc: id, from: S.time, until: S.time + bh, triggered: false });
    SFX.radio(); SFX.barrier();
    radio(`🚧 ${clock(S.time)}　已通報${LOC[id].name}的機場、港口與車站全面管制 ${bh} 小時。`);
    heat(5); // 大規模臨檢難免走漏風聲
    watched('block');
    if (S.port && id === S.port.final) switchPort('港口突然大規模臨檢');
    if (!spend(1)) return;
    refreshMarkers();
    render();
  }

  async function travel() {
    if (busy || S.over || S.raiding || !selected || selected === S.current) return;
    SFX.click();
    const from = LOC[S.current], to = LOC[selected];
    const plan = travelPlan(from, to);
    let hours = has('express') ? Math.max(1, half(plan.hours * 0.85)) : plan.hours, delay = '';
    const rush = S.rush; S.rush = 0;
    delete S.cb.extra;
    const storm = rush ? 0 : stormDelay(from, to, S.time);
    if (rush) { hours = rush; delay = '（🚓 警車鳴笛開道）'; charge(3, '警車調度費'); }
    else if (storm) { hours += storm; delay = `（🌀 颱風來襲，班次大亂，延誤 ${storm} 小時）`; }
    else if (from.zone !== to.zone && !has('noDelay') && R() < 0.12) {
      const extra = 3 + rand(4);
      hours += extra;
      delay = `（${pick(['東北季風浪大', '濃霧', '颱風外圍環流', '班機機械故障'])}，延誤 ${extra} 小時）`;
    }
    if (S.cb.express) { hours = Math.max(0.5, half(hours * (1 - S.cb.express / 100))); delay += '（🚄 專車接送）'; delete S.cb.express; }
    if (S.cb.ticket > 0) { S.cb.ticket--; radio(`🎫 免費車票：這段不用交通費（還剩 ${S.cb.ticket} 段）`); }
    else charge(travelFee(from, to), `${plan.mode.split(' ')[0]} 前往${to.name}的交通費`);
    SFX.travel(modeKey(plan.mode));
    busy = true; render();
    map.clearZones();
    await map.animateTravel(from, to, 1000);
    busy = false;
    showArrive(to);
    S.current = to.id;
    delete S.descs[to.id];
    resetSpot(to.id); // 每次重新抵達都是新的調查：清掉上次留下的調查次數與包圍網（舊線索仍在筆記裡）
    S.visited.add(to.id);
    S.trail.push({ lat: to.lat, lng: to.lng });
    map.setTrail(S.trail);
    selected = null;
    // 前往下一站，或跳到他已經到過的更後面的站（例如依民眾報案直接追過去）
    for (let k = S.stage + 1; k < S.route.length; k++) {
      if (S.route[k] === to.id && (k === S.stage + 1 || k <= S.fug.idx || (S.port && !S.port.switched && k === lastIdx()))) { S.stage = k; break; }
    }
    SFX.radio();
    radio(`${plan.mode.split(' ')[0]} ${clock(S.time + hours)}　抵達${to.name}（${plan.km} 公里，${fmtH(hours)}）${delay}`);
    if (!spend(hours)) return;
    const near = nearMiss();
    refreshZones();
    map.focus(to.lat, to.lng);
    render();
    // 突發事件等抵達轉場播完再跳出
    const c = S;
    if (near) arrivalTaunt();
    else if (!S.over && S.mode !== 'tutorial' && trackState() !== 'present' && R() < (isMod('media') ? 0.5 : 0.3)) setTimeout(() => { if (S === c && !S.over && !S.raiding) randomEvent(); }, 1300);
    else if (!S.over) { arrivalTaunt(); setTimeout(() => { if (S === c) maybeSighting(); }, 2600); }
  }

  // 抵達後嫌犯的反應：追很近會慌、落後太多會嗆
  function arrivalTaunt() {
    const st = trackState();
    if (st === 'present') { setTimeout(() => taunt(S.stage === lastIdx() ? 'final' : 'close'), 2200); return; }
    if (st !== 'left') return;
    const ago = sinceLeft();
    const prev = LOC[S.route[S.stage]].name;
    if (ago < 3) setTimeout(() => taunt('close'), 1600);
    else if (ago >= 8 && Math.random() < 0.7) setTimeout(() => taunt('late', prev), 1600);
  }

  function showArrive(to) {
    const a = $('#arrive');
    $('#arrive-name').textContent = to.name;
    $('#arrive-county').textContent = to.county;
    a.hidden = true; void a.offsetWidth; a.hidden = false;
    vibrate([30, 40, 60]);
    SFX.arrive();
    setTimeout(() => { a.hidden = true; }, 1500);
  }

  // ---------- 突發事件 ----------
  function randomEvent() {
    const types = ['tip', 'reporter', 'boss'].filter((t) => t === 'tip' || !S.eventsSeen.includes(t)).filter((t) => !(isMod('media') && t === 'reporter'));
    const type = pick(types);
    S.eventsSeen.push(type);
    if (type === 'tip') {
      const F = S.fug;
      const real = R() < (has('tipster') ? 0.85 : isMod('media') ? 0.75 : 0.55);
      const truth = S.route[F.idx];
      const place = real ? LOC[truth] : pick(LOCATIONS.filter((l) => l.id !== truth));
      showEvent('📞 民眾報案', `一位民眾打電話到 110：「我在${place.name}看到一個很像通緝海報上的人！」`, [
        { label: '派當地警力查證（1 小時）', run: () => {
          if (!spend(1)) return;
          const ok = real && F.arrive[F.idx] <= S.time;
          addNote(`📞 民眾報案・${place.name}`, ok ? `查證屬實！當地警方確認他最近在${place.name}出沒。` : `查證結果：認錯人了，${place.name}的那個人不是他。`, ok);
          radio(`📞 ${clock(S.time)}　完成${place.name}報案查證。`);
        } },
        { label: '記錄下來就好', run: () => addNote('📞 民眾報案（未查證）', `有民眾說在${place.name}看到他，真假不明。`, true) },
      ]);
    } else if (type === 'reporter') {
      showEvent('📰 記者盯上了', '一名社會線記者打聽到這起案子，準備發布獨家新聞。新聞一播出，嫌犯一定會看到。', [
        { label: '花 2 小時說服他延後報導', run: () => { if (spend(2)) radio('📰 記者同意延後報導。'); } },
        { label: '不理會（警覺值 +15）', run: () => { heat(15); radio('📰 晚間新聞播出了案件追緝進度……嫌犯警覺升高！', 'hot'); } },
      ]);
    } else {
      showEvent('☎️ 長官來電', '分局長在電話裡大吼：「媒體一直在問，給我加快速度！」他願意調派更多警力支援，但要求你提早結案。', [
        { label: '接受（期限 −6 小時，封鎖 +1）', run: () => { cutDeadline(6); S.blocksLeft++; radio('☎️ 獲得額外一次封鎖支援，但結案期限提前了。'); } },
        { label: '婉拒', run: () => radio('☎️ 你婉拒了長官的要求，繼續照自己的步調辦案。') },
      ]);
    }
  }

  let evTimer = null;
  function showEvent(title, body, choices, timer = null) {
    SFX.alarm();
    clearInterval(evTimer);
    $('#event-title').textContent = title;
    $('#event-body').textContent = body;
    const box = $('#event-choices');
    box.innerHTML = '';
    choices.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = c.cls || (i === 0 ? 'btn primary' : 'btn'); // 猜答案的選項全部同一種樣式，不暗示答案
      b.textContent = c.label;
      b.onclick = () => { clearInterval(evTimer); $('#event').hidden = true; SFX.click(); c.run(); render(); };
      box.appendChild(b);
    });
    $('#event').hidden = false;
    // 限時事件：標題顯示倒數，時間到自動選「沒反應」
    if (timer) {
      let left = timer.sec;
      const tick = () => {
        if (left <= 0) { clearInterval(evTimer); $('#event').hidden = true; timer.run(); render(); return; }
        $('#event-title').textContent = `${title}　⏱️ ${left}`;
        if (left <= 3) { SFX.tick(); vibrate(40); }
        left--;
      };
      tick();
      evTimer = setInterval(tick, 1000);
    }
  }

  // ---------- 攻堅 ----------
  function requestRaid() {
    if (busy || S.over || S.raiding || S.chase) return;
    SFX.click();
    if (trackState() !== 'present') {
      if (!spend(1)) return;
      radio(`⚖️ ${clock(S.time)}　檢察官駁回搜索票：「沒有證據顯示嫌犯在這裡！」`);
      render();
      // 跳出警示框，不然玩家（尤其手機）只看到按了沒反應
      const tip = ambushSuggested()
        ? '你比他先到了，他還沒出現。先按發光的「⏳ 埋伏到他現身」，等他出現再申請。'
        : '要先查到他「現在就在這裡」（例如有人說剛剛才看到他、或跳出「他還在這裡」的警報），才申請得到搜索票。';
      showEvent('⚖️ 搜索票被駁回', `檢察官：「沒有證據顯示嫌犯在這裡！」\n\n${tip}\n\n（這次申請花掉 1 小時）`, [{ label: '知道了', run: () => {} }]);
      return;
    }
    const loc = LOC[S.current];
    const hide = S.hideouts[S.stage];
    const pool = HIDEOUTS.filter((h) => h.id !== hide.id && !(h.coastOnly && INLAND.includes(loc.id)));
    const decoys = Math.max(0, (has('swat') ? 2 : 3) - (S.cb.sniff || 0));
    const spots = shuffle([hide, ...shuffle(pool).slice(0, decoys)]).map((h, i) => {
      const ang = (Math.PI * 2 * i) / (decoys + 1) + R() * 0.6;
      const r = 0.012 + R() * 0.008;
      return { ...h, lat: loc.lat + Math.sin(ang) * r, lng: loc.lng + Math.cos(ang) * r };
    });
    S.raiding = spots;
    map.focus(loc.lat, loc.lng, 13);
    map.showRaid(spots, raid);
    SFX.siren();
    const fin = S.stage === lastIdx();
    radio(fin ? '🚨 搜索票核准！先比對監視器畫面，再點選藏身處攻堅！' : '🚨 搜索票核准！霹靂小組就位，在倒數結束前點選藏身處攻堅！', 'alarm');
    startRaidTimer(fin ? 10 : 0);
    if (fin) openCctv();
    render();
  }

  // ---------- 最後一站：監視器比對小遊戲 ----------
  function openCctv() {
    const f = S.fugitive;
    const people = [{ traits: shuffle(f.traits), real: true, avatar: f.avatar }];
    // 路人：自己的長相＋自己的特徵，有時故意混進一個嫌犯的特徵來混淆
    let guard = 0;
    while (people.length < 6 && guard++ < 200) {
      const av = 1 + Math.floor(R() * 2147483646);
      const own = Avatar.clues(av).map((c) => c.text).filter((t) => !f.traits.includes(t));
      if (own.length < 2) continue;
      const t1 = R() < 0.65 ? pick(f.traits) : pick(own);
      let t2 = pick(own);
      while (t2 === t1) t2 = pick(own);
      if (f.traits.includes(t1) && f.traits.includes(t2)) continue;
      people.push({ traits: shuffle([t1, t2]), real: false, avatar: av });
    }
    const box = $('#cctv-grid');
    box.innerHTML = '';
    shuffle(people).forEach((p, i) => {
      const b = document.createElement('button');
      b.className = 'cam';
      b.innerHTML = `<span class="cam-id">CAM-0${i + 1}</span><span class="cam-face">${Avatar.svg(p.avatar)}</span><ul>${p.traits.map((t) => `<li>${t}</li>`).join('')}</ul>`;
      b.onclick = () => cctvPick(p.real, b);
      box.appendChild(b);
    });
    $('#cctv-traits').innerHTML = `📋 通緝海報特徵：<b>${f.traits.join('</b>、<b>')}</b>${has('cctvpro') ? '　<small>（影像鑑識）</small>' : ''}`;
    $('#cctv-traits').hidden = !has('cctvpro');
    $('#cctv-peek').disabled = has('cctvpro');
    $('#cctv').hidden = false;
  }

  // 翻看通緝海報：要花 3 秒
  function cctvPeek() {
    if (!S.raiding) return;
    raidLeft = Math.max(1, raidLeft - 3);
    $('#cctv-count').textContent = raidLeft;
    $('#raid-count').textContent = raidLeft;
    $('#cctv-traits').innerHTML = `📋 通緝海報特徵：<b>${S.fugitive.traits.join('</b>、<b>')}</b>`;
    $('#cctv-traits').hidden = false;
    $('#cctv-peek').disabled = true;
  }

  function cctvPick(real, btn) {
    if (!S.raiding) return;
    SFX.shutter();
    $('#cctv').hidden = true;
    if (real) {
      SFX.stamp();
      const hide = S.hideouts[S.stage];
      const wrong = shuffle(S.raiding.filter((s) => s.id !== hide.id));
      S.raiding = S.raiding.filter((s) => s.id === hide.id || s === wrong[0]);
      map.showRaid(S.raiding, raid);
      radio('📹 比對成功！確認嫌犯的行蹤，可疑地點縮小到 2 處！', 'hot');
    } else {
      btn.classList.add('wrong');
      raidLeft = Math.max(1, raidLeft - 5);
      $('#raid-count').textContent = raidLeft;
      SFX.lose();
      radio('📹 比對錯誤，浪費了寶貴的 5 秒！只能從 4 處可疑地點中猜了！', 'hot');
    }
    tutTick();
  }

  function startRaidTimer(bonus = 0) {
    stopRaidTimer();
    raidLeft = S.diff.raidSec + bonus + (S.cb.swat || 0) + (has('calm') ? 5 : 0) - (S.alert >= 60 ? 5 : 0) + (S.mode === 'tutorial' ? 30 : 0);
    const el = $('#raid-overlay');
    el.hidden = false;
    document.body.classList.add('raiding');
    const tickFn = () => {
      $('#raid-count').textContent = raidLeft;
      $('#cctv-count').textContent = raidLeft;
      el.classList.toggle('urgent', raidLeft <= 5);
      SFX.heartbeat();
      if (raidLeft <= 5) vibrate(60);
      if (raidLeft-- <= 0) { stopRaidTimer(); $('#cctv').hidden = true; raidFail(null); }
    };
    tickFn();
    raidTimer = setInterval(tickFn, 1000);
  }

  function stopRaidTimer() {
    clearInterval(raidTimer); raidTimer = null;
    $('#raid-overlay').hidden = true;
    document.body.classList.remove('raiding');
  }

  function raid(spot) {
    if (S.over || !S.raiding || !$('#cctv').hidden) return;
    stopRaidTimer();
    const hide = S.hideouts[S.stage];
    if (spot.id === hide.id) {
      map.clearRaid();
      S.raiding = null;
      S.time += 1;
      S.early = S.stage < lastIdx();
      const score = Math.round((S.deadline - S.time) * 10 + S.diff.stops * 100 - S.strikes * 150
        + S.blocksLeft * 50 + (100 - S.alert) * 2 + (S.early ? 500 : 0));
      const msg = `${S.early ? '賞金獵人在他抵達最終藏身處前就提前攔截。' : ''}賞金獵人會同警方在${LOC[S.current].name}的${spot.name}將${S.fugitive.name}逮捕歸案。`;
      if (isMission('hostage')) startNegotiation(spot, score, msg); else startChase(spot, score, msg);
      return;
    }
    raidFail(spot);
  }

  function raidFail(spot) {
    const what = spot ? `攻堅${spot.name}撲空！` : '猶豫太久，攻堅行動曝光了！';
    S.time += 1;
    heat(25);
    if (spot) charge(10 + Math.floor(Math.random() * 11), `賠償${spot.name}的損失`);
    SFX.lose();
    vibrate(400);
    if (S.stage < lastIdx()) {
      // 還沒到最後一站：他立刻逃往下一站
      map.clearRaid();
      S.raiding = null;
      S.fug.depart[S.stage] = S.time;
      S.alarmed[S.stage] = true;
      resetSpot(S.current);
      radio(`💥 ${clock(S.time)}　${what}嫌犯趁亂逃離${LOC[S.current].name}，繼續追！`, 'hot');
      setTimeout(() => taunt('raidfail', '', true), 1500);
      advanceFugitive();
      refreshZones();
      map.focus(LOC[S.current].lat, LOC[S.current].lng, 8);
      render();
      return;
    }
    if (isMission('hostage')) {
      map.clearRaid();
      endGame(false, `${what}${S.fugitive.name}押著人質從${S.hideouts[S.stage].name}的後門脫逃，人質受到驚嚇送醫，嫌犯偷渡出境。`);
      return;
    }
    S.strikes++;
    const maxStrikes = (has('second') ? 3 : 2) + (S.cb.strike || 0);
    if (S.strikes >= maxStrikes) {
      map.clearRaid();
      endGame(false, `${what}${S.fugitive.name}察覺警方行動，從${S.hideouts[S.stage].name}趁亂逃走，偷渡出境。`);
      return;
    }
    cutDeadline(6);
    if (S.time >= S.deadline) { map.clearRaid(); endGame(false, `${what}${S.fugitive.name}趁亂逃離，搭上走私船出境了。`); return; }
    if (spot) S.raiding = S.raiding.filter((s) => s.id !== spot.id);
    map.showRaid(S.raiding, raid);
    radio(`💥 ${clock(S.time)}　${what}嫌犯起了戒心，偷渡時間提前了！${S.strikes >= maxStrikes - 1 ? '這是最後一次機會！' : '還有機會，冷靜再找一次！'}`, 'hot');
    taunt('raidfail', '', true);
    startRaidTimer();
    render();
  }

  // ---------- 人質談判：攻堅成功後，看他的狀態選做法 ----------
  function startNegotiation(spot, score, msg) {
    map.clearRaid();
    S.raiding = null;
    SFX.siren();
    vibrate([120, 60, 120]);
    const qs = shuffle(NEGOTIATION).slice(0, 2);
    let good = 0, i = 0;
    const finish = () => {
      const miss = qs.length - good;
      S.payRate = [1, 0.85, 0.7][miss];
      const sub = miss ? `人質平安獲救・賞金打 ${S.payRate * 10} 折` : '💯 人質毫髮無傷！';
      const extra = miss ? '談判過程一度緊張，所幸人質平安獲救。' : '經過冷靜的談判，嫌犯放下刀械，人質毫髮無傷。';
      showBust(sub, () => endGame(true, msg + extra, score + (miss ? -150 * miss : 300), spot));
    };
    const ask = () => {
      const q = qs[i];
      const wrong = shuffle(NEGOTIATION.filter((n) => n !== q)).slice(0, 2).map((n) => n.good);
      showEvent(`🆘 人質談判（第 ${i + 1} / ${qs.length} 回合）`, `${S.fugitive.name}把人質擋在身前。\n\n${q.cue}\n\n你要怎麼做？`, shuffle([q.good, ...wrong]).map((o) => ({ label: o, cls: 'btn', run: () => {
        const ok = o === q.good;
        if (ok) good++;
        radio(ok ? `🆘 ${o}——他的情緒稍微緩和了。` : `🆘 ${o}——他更激動了，人質嚇得大哭！`, ok ? '' : 'hot');
        if (ok) SFX.clue(); else SFX.alarm();
        i++;
        setTimeout(i < qs.length ? ask : finish, 700);
      } })));
    };
    ask();
  }

  // ---------- 集團：抓到一個，偵訊後追下一個 ----------
  function gangNext(score, rate) {
    const g = S.gang;
    if (!g || g.idx >= g.members.length - 1) return false;
    g.pay += S.fugitive.reward * rate * (has('bounty') ? 1.15 : 1);
    g.score += score;
    g.caught.push(S.fugitive.name);
    const prev = S.fugitive.name;
    g.idx++;
    const m = g.members[g.idx];
    S.chase = null; S.raiding = null;
    Object.assign(S, {
      fugitive: m.fugitive, profile: m.profile, route: m.route.slice(), hideouts: m.hideouts.slice(),
      fug: { idx: 0, arrive: [S.time - 8], depart: [S.time + 2 + rand(5)] },
      stage: 0, alarmed: {}, decoys: {}, rerouted: {}, known: {}, seenHere: {}, used: {}, zones: {}, strikes: 0, early: false,
      alert: Math.max(25, Math.round(S.alert * 0.5)),
    });
    S.flags.finalTip = false;
    const county = LOC[S.route[0]].county;
    S.zones[S.current] = [{ type: 'county', ch: county.slice(0, -1), suffix: county.slice(-1) }];
    const left = g.members.length - g.idx;
    const boss = g.idx === g.members.length - 1;
    addNote('🗣️ 偵訊', `${prev}招供：「${m.fugitive.name}（綽號「${m.fugitive.alias}」）應該躲在${county}一帶。」`, true);
    radio(`🕸️ ${clock(S.time)}　${prev}落網！下一個目標：${m.fugitive.name}・${m.profile.icon}${m.profile.name}${boss ? '（集團老大）' : ''}`, 'hot');
    map.clearRaid();
    map.focus(LOC[S.current].lat, LOC[S.current].lng, 7);
    refreshZones();
    render();
    showEvent('🕸️ 偵訊結果', `${prev}落網！集團還剩 ${left} 人。\n\n他招出下一個成員：${m.fugitive.name}（綽號「${m.fugitive.alias}」）${boss ? '，就是集團老大' : ''}。\n側寫：${m.profile.icon} ${m.profile.name}——${m.profile.desc}\n\n他應該躲在「${county}」一帶，地圖上閃紅光的地方最可疑。\n（時間、經費、封鎖都接續使用）`, [{ label: '繼續追緝', run: () => {} }]);
    return true;
  }

  // ---------- 最後追捕：攻堅成功後他破窗逃跑 ----------
  // 每回合一個狀況（js/chase-data.js），判斷對了拉近距離、錯了拉開；距離歸零就抓到，
  // 超過上限或追太久他就跑了，整個案件失敗。追丟次數越多賞金打越多折。
  let chaseTimer = null;
  const CHASE_MAX_ROUNDS = 12;
  function chaseCfg() {
    const tut = S.mode === 'tutorial', easy = tut || S.diffKey === 'rookie', hard = S.diffKey === 'master';
    return {
      start: tut ? 20 : easy ? 25 : 30, // 起始距離
      limit: 60, // 超過就跟丟
      gain: () => 10 + rand(5) + (has('tackle') ? 3 : 0), // 追對拉近
      loss: () => 12 + rand(5) + (easy ? -3 : hard ? 3 : 0), // 追錯拉開
      late: 16 + (hard ? 3 : 0), // 猶豫太久
      sec: tut ? 15 : 7 + (has('calm') ? 1 : 0) + (has('sprinter') ? 1.5 : 0) + (S.cb.sprint || 0),
    };
  }

  function startChase(spot, score, msg) {
    map.clearRaid();
    S.raiding = null;
    const cfg = chaseCfg();
    S.chase = { round: 0, hits: 0, miss: 0, res: [], spot, score, msg, locked: false, ans: null, ev: null,
      dist: cfg.start, limit: cfg.limit, net: S.cb.net || 0, deck: shuffle(CHASE_EVENTS.map((_, i) => i)) };
    SFX.siren();
    vibrate([120, 60, 120]);
    $('#chase-title').textContent = `🏃 ${S.fugitive.name}破窗逃跑了！`;
    $('#cd-limit').textContent = `超過 ${cfg.limit} m 就跟丟了`;
    $('#chase').hidden = false;
    render();
    drawChaseDist();
    chaseRound();
  }

  // 距離條：左邊是你，右邊紅色區域是跟丟
  function drawChaseDist() {
    const c = S.chase;
    const p = Math.max(0, Math.min(1, c.dist / c.limit));
    $('#cd-fug').style.left = `calc(18px + (100% - 36px) * ${p.toFixed(3)})`;
    $('#cd-m').textContent = `${Math.max(0, Math.round(c.dist))} m`;
    $('#chase-dist').classList.toggle('danger', p >= 0.75);
    $('#chase-dist').classList.toggle('close', p <= 0.25);
  }

  function chaseRound() {
    const c = S.chase;
    const cfg = chaseCfg();
    const ev = CHASE_EVENTS[c.deck[c.round % c.deck.length]];
    let opts = ev[1].map((o, i) => { const sp = o.indexOf(' '); return { id: String(i), icon: o.slice(0, sp), name: o.slice(sp + 1) }; });
    if (has('hunch')) opts = opts.slice(0, 2); // 直覺：少一個錯的選項
    opts = shuffle(opts);
    c.ans = '0'; c.ev = ev; c.locked = false;
    $('#chase-round').textContent = `第 ${c.round + 1} 回合`;
    $('#chase-cue').textContent = `👀 ${ev[0]}`;
    $('#chase-cue').className = 'chase-cue';
    $('#chase-dots').innerHTML = c.res.map((r) => `<i class="${r}"></i>`).join('') + '<i class="now"></i>';
    const box = $('#chase-opts');
    box.innerHTML = '';
    opts.forEach((o) => {
      const b = document.createElement('button');
      b.className = 'chase-opt';
      b.dataset.id = o.id;
      b.innerHTML = `<span>${o.icon}</span><b>${o.name}</b>`;
      b.onclick = () => chaseAnswer(o.id);
      box.appendChild(b);
    });
    const bar = $('#chase-bar');
    bar.style.transition = 'none'; bar.style.width = '100%';
    void bar.offsetWidth;
    bar.style.transition = `width ${cfg.sec}s linear`; bar.style.width = '0%';
    clearTimeout(chaseTimer);
    chaseTimer = setTimeout(() => chaseAnswer(null), cfg.sec * 1000);
    SFX.heartbeat();
  }

  function chaseAnswer(id) {
    const c = S && S.chase;
    if (!c || c.locked) return;
    c.locked = true;
    clearTimeout(chaseTimer);
    const cfg = chaseCfg();
    const bar = $('#chase-bar');
    bar.style.transition = 'none'; bar.style.width = getComputedStyle(bar).width;
    const ok = id === c.ans;
    let d = 0, netted = false;
    if (ok) { c.hits++; d = -cfg.gain(); }
    else if (c.net > 0) { c.net--; netted = true; } // 圍捕網：這次追丟不算
    else { c.miss++; d = id ? cfg.loss() : cfg.late; }
    c.res.push(ok ? 'hit' : netted ? 'net' : 'miss');
    c.dist = Math.max(0, c.dist + d);
    if (S.mode === 'tutorial') c.dist = Math.min(c.dist, c.limit - 5); // 教學不會跟丟
    drawChaseDist();
    document.querySelectorAll('#chase-opts .chase-opt').forEach((b) => {
      b.disabled = true;
      if (b.dataset.id === c.ans) b.classList.add('right');
      else if (b.dataset.id === id) b.classList.add('wrong');
    });
    const cue = $('#chase-cue');
    cue.className = `chase-cue ${ok || netted ? 'ok' : 'bad'}`;
    cue.textContent = ok ? `${c.ev[2]}（拉近 ${-d} m）`
      : netted ? '🕸️ 圍捕網發揮作用！他被包圍的警力逼了回來，距離沒有拉開。'
      : `${id ? c.ev[3] : '你猶豫了一下，他跑遠了……'}（拉開 ${d} m）`;
    if (ok) { SFX.whoosh(); setTimeout(() => SFX.stamp(), 120); } else SFX.alarm();
    vibrate(ok ? 50 : [30, 50, 30]);
    setTimeout(() => {
      if (S.chase !== c) return;
      c.round++;
      if (c.dist <= 0) finishChase();
      else if (c.dist >= c.limit) chaseEscape(false);
      else if (c.round >= CHASE_MAX_ROUNDS) { if (S.mode === 'tutorial') finishChase(true); else chaseEscape(true); }
      else chaseRound();
    }, 1700);
  }

  // 距離歸零：逮捕；support＝教學模式追太久，由支援警力攔下
  function finishChase(support) {
    const c = S.chase;
    $('#chase').hidden = true;
    const miss = c.miss;
    c.payRate = support ? 0.5 : [1, 0.8, 0.6, 0.5][Math.min(3, Math.max(0, miss - (has('tackle') ? 1 : 0)))];
    const score = c.score + (miss === 0 ? 300 : -100 * miss);
    const extra = support ? '他一度甩開追捕，幸好支援警力在巷口將他攔下。'
      : miss === 0 ? '獵人一個飛撲將他壓制在地，完美逮捕！'
      : '經過一番追逐，獵人在巷尾將他壓制在地。';
    const sub = support ? '支援警力代為攔截・賞金減半' : miss === 0 ? '💯 完美逮捕！' : `追丟 ${miss} 次・賞金打 ${c.payRate * 10} 折`;
    showBust(sub, () => { if (!gangNext(score, c.payRate)) endGame(true, `${c.msg}${extra}`, score, c.spot); });
  }

  // 距離超過上限（或追太久）：他跑了，整個案件失敗
  function chaseEscape(tired) {
    const name = S.fugitive.name, gone = Math.round(S.chase.dist);
    clearTimeout(chaseTimer);
    $('#chase').hidden = true;
    S.chase = null;
    SFX.lose(); vibrate(400);
    endGame(false, tired
      ? `追了十幾條街，${name}的體力比你好，最後消失在巷弄裡。他又跑了，再也找不到人。`
      : `${name}和你的距離拉開到 ${gone} 公尺，轉個彎就消失在人群裡。他又跑了，再也找不到人。`);
  }

  // 背景心跳：緊張程度 2 每 2.2 秒一下，程度 3 每 1.1 秒一下並加上時鐘滴答（攻堅、追逐時有自己的音效）
  let pulseTimer = null, pulseN = 0;
  function pulseLoop() {
    clearInterval(pulseTimer);
    pulseTimer = setInterval(() => {
      if (!S || S.over || document.hidden || S.raiding || S.chase || !$('#start').hidden || !$('#poster').hidden) return;
      const lvl = +document.body.dataset.tension || 0;
      pulseN++;
      if (lvl >= 3) { SFX.heartbeat(); if (pulseN % 2) setTimeout(() => SFX.tock(), 500); }
      else if (lvl === 2 && pulseN % 2 === 0) SFX.heartbeat();
    }, 1100);
  }

  // 慢動作＋「已逮捕」印章
  function showBust(sub, then) {
    const el = $('#bust');
    $('#bust-face').innerHTML = faceOf(S.fugitive, { mug: true });
    $('#bust-name').textContent = S.fugitive.name;
    $('#bust-sub').textContent = sub;
    el.hidden = true; void el.offsetWidth; el.hidden = false;
    let done = false;
    const go = () => { if (done) return; done = true; el.hidden = true; then(); };
    setTimeout(() => { SFX.stamp(); vibrate(250); }, 900);
    setTimeout(go, 2600);
    el.onclick = () => { if (!el.classList.contains('ready')) return; go(); };
    el.classList.remove('ready');
    setTimeout(() => el.classList.add('ready'), 1000);
  }

  // ---------- 結算（報紙頭條） ----------
  function endGame(win, msg, score = 0, spot = null) {
    S.over = true;
    clearTimeout(chaseTimer);
    $('#chase').hidden = true;
    S.raiding = null;
    stopRaidTimer();
    $('#cctv').hidden = true;
    document.body.classList.remove('danger');
    const tutorial = S.mode === 'tutorial';
    const stats = store.get('roc-chase-stats', { solved: 0, failed: 0, best: 0 });
    if (!tutorial) {
      if (win) { stats.solved++; stats.best = Math.max(stats.best, score); } else stats.failed++;
      store.set('roc-chase-stats', stats);
    } else if (win) store.set(TUT_KEY, true);
    S.won = win;
    $('#news').hidden = true;
    clearInterval(evTimer);
    // 連勝：連續逮捕，賞金加成越疊越高（每多一連勝 +10%，最多 +50%）；失手歸零。教學不算
    const streakable = !tutorial;
    const streakBefore = me.streak || 0;
    const streakX = win && streakable ? Math.min(5, streakBefore) * 0.1 : 0;
    if (streakable) me.streak = win ? streakBefore + 1 : 0;
    // 宿敵：懸賞看板上讓他跑掉的逃犯，兩輪後會升級回來
    if (!win && S.mode === 'bounty' && !S.gang && round) {
      const f = S.fugitive;
      (me.nemeses ||= []).push({ fug: { name: f.name, alias: f.alias, avatar: f.avatar, male: f.male, traits: f.traits, reward: f.reward }, diffKey: S.diffKey, crime: S.caseFile.crime, at: round.no, times: (S.nemesis?.times || 0) });
      if (me.nemeses.length > 3) me.nemeses.shift();
    }

    // 經驗值與技能點（教學不計）
    const ptsBefore = skillPoints();
    const gain = tutorial ? 0 : Math.round((win ? score : has('insurance') ? 400 : 150) * (has('scholar') ? 1.2 : 1) * (1 + (S.cb.xp || 0) / 100));
    me.xp += gain;
    let sagaLine = '';
    if (S.mode === 'saga' && win) {
      me.saga++;
      const done = me.saga % SAGA.chapters.length === 0;
      sagaLine = `<p class="saga-line">📂 【${SAGA.title}】${S.outro}${done ? '<br><b>🎖️ 專案全數偵破！</b>' : `<br>👉 第 ${(me.saga % SAGA.chapters.length) + 1} 案已解鎖。`}</p>`;
    }
    saveMe();
    // 懸賞金入帳（追逐中追丟會打折）
    let pay = 0, cut = 0, refund = 0, bail = null;
    if (!tutorial) {
      const rate = (S.chase ? S.chase.payRate : S.payRate || 1) * (has('bounty') ? 1.15 : 1) * (1 + (S.cb.bounty || 0) / 100);
      let raw = 0;
      if (S.gang) {
        raw = S.gang.pay + (win ? S.fugitive.reward * rate : 0);
        if (win) raw += caseReward(S) * 0.2; // 全員落網加碼
      } else if (win) raw = S.fugitive.reward * rate * (S.loot ? (S.loot.found ? 1.2 : 0.5) : 1);
      else if (S.loot && S.loot.found) raw = S.fugitive.reward * 0.3; // 只追回贓物的安慰獎
      raw *= 1 + streakX;
      pay = Math.round(raw / 10) * 10;
      if (pay && me.probation > 0 && !S.free) { cut = Math.round(pay * 0.5 / 10) * 10; pay -= cut; me.probation--; }
      me.money += pay;
    }
    if (S.gang && win) S.gang.caught.push(S.fugitive.name);
    const drops = dropCards();
    if (S.gang) score += S.gang.score;
    let missionLine = '';
    if (S.loot) missionLine = S.loot.found ? '<p class="saga-line">🎒 贓物已全數追回。</p>' : '<p class="saga-line">🎒 贓物下落不明，仍在追查中。</p>';
    if (S.mission === 'hostage') missionLine = win ? '<p class="saga-line">🆘 人質平安獲救。</p>' : '';
    if (S.nemesis) missionLine += win ? '<p class="saga-line">🔁 宿敵終於落網，舊帳一筆勾銷！</p>' : '<p class="saga-line">🔁 宿敵又溜了……他還會再回來。</p>';
    if (!win && S.mode === 'bounty' && !S.gang && !S.nemesis) missionLine += '<p class="saga-line">🔁 他記住你了。過兩輪他會帶著更高的懸賞回到看板上。</p>';
    if (streakable && win) missionLine += `<p class="saga-line">🔥 ${me.streak} 連勝！${streakX ? `賞金加成 +${Math.round(streakX * 100)}%` : '下一案抓到就有賞金加成'}</p>`;
    else if (streakable && streakBefore >= 2) missionLine += `<p class="saga-line">💔 ${streakBefore} 連勝中斷了。</p>`;
    if (S.gang) missionLine = `<p class="saga-line">🕸️ 集團 ${S.gang.members.length} 人中，落網 ${S.gang.caught.length} 人${S.gang.caught.length ? `：${S.gang.caught.join('、')}` : ''}${win ? '<br><b>全員落網，加碼兩成賞金！</b>' : ''}</p>`;
    // 剩下的行動經費：抓到人才歸你，沒抓到要繳回公會
    if (!S.free) { refund = r1(S.fund); if (win) me.money = r1(me.money + refund); S.fund = 0; bail = bailout(); }
    saveMe();
    const newPts = skillPoints() - ptsBefore;
    // 本輪懸賞：記下這張通緝令的結果
    let roundLine = '';
    if (S.mode === 'bounty' && round && round.cases[S.roundIdx] && !round.cases[S.roundIdx].result) {
      Object.assign(round.cases[S.roundIdx], { result: win ? 'win' : 'fail', score: win ? score : S.gang ? S.gang.score : 0, pay });
      saveRound();
      const done = round.cases.filter((c) => c.result).length;
      roundLine = `<p class="saga-line">🎯 第 ${round.no} 輪懸賞：已結案 ${done} / ${round.cases.length} 張${done >= round.cases.length ? '<br><b>四張通緝令全部結案，回到看板進行本輪結算！</b>' : ''}</p>`;
    }

    const f = S.fugitive, place = LOC[S.current].name;
    const day = Math.floor((START_HOUR + S.time) / 24) + 1;
    const headline = S.gang ? (win ? `犯罪集團 ${S.gang.members.length} 人全數落網` : `犯罪集團落網 ${S.gang.caught.length} 人　${f.name}偷渡出境`)
      : win ? `${S.caseFile.crime}嫌犯${f.name}${place}落網` : `${S.caseFile.crime}嫌犯${f.name}偷渡出境`;
    const kicker = win ? (S.early ? '賞金獵人提前攔截！' : '賞金獵人出擊！') : '獵人撲空！';
    const route = S.route.map((id) => LOC[id].name).join(' → ');
    const facts = S.route.map((id) => `<li><b>${LOC[id].name}</b>　${LOC[id].fact}</li>`).join('');
    $('#paper').innerHTML = `
      <div class="masthead"><span>追緝第 ${day} 天</span><h1>${PAPER}</h1><span>社會版</span></div>
      <div class="kicker">${kicker}</div>
      <h2 class="headline">${headline}</h2>
      <div class="cols">
        <div class="article">
          <div class="photo ${win ? 'caught' : 'escaped'}"><span class="f">${faceOf(f, { mug: true })}</span><span class="tag">${win ? '已逮捕' : '在逃'}</span></div>
          <p><b>【本報訊】</b>${S.intro}${msg}</p>
          <p>嫌犯逃亡路線：${route}。${win ? `落網地點為${(spot || S.hideouts[S.stage]).name}。` : `據了解，嫌犯出境前藏身於${S.hideouts[lastIdx()].name}。`}</p>
          <p>警方側寫指出，嫌犯屬於「${S.profile.name}」型逃犯：${S.profile.desc}</p>
          <p>本案追緝 ${fmtH(S.time)}，嫌犯警覺程度 ${Math.round(S.alert)}%，攻堅失手 ${S.strikes} 次。</p>
          ${missionLine}
          ${win ? `<p class="score">本案績效 <b>${score}</b> 分</p>` : ''}
          ${pay ? `<p class="pay-line">💰 懸賞金入帳 <b>NT$ ${pay} 萬</b>${cut ? `（保護管束，公會抽走 ${cut} 萬）` : pay < caseReward(S) ? `（原價 ${caseReward(S)} 萬）` : ''}</p>` : ''}
          ${S.free ? '' : `<p class="pay-line money-line">🧾 本案開銷 <b>${S.spentTotal} 萬</b>・${win ? `經費結餘 ${refund} 萬歸你` : `剩餘經費 ${refund} 萬繳回公會`}・目前存款 <b class="${me.money < 0 ? 'neg' : ''}">${fmtMoney(me.money)}</b></p>`}
          ${bail ? `<p class="bail-line">🏦 負債 ${bail.debt} 萬超過上限，公會出面代償！代價：<b>${bail.cost}</b></p>` : ''}
          ${!bail && me.money < 0 ? `<p class="pay-line neg-line">⚠️ 你目前負債 ${-me.money} 萬，超過 ${DEBT_LIMIT} 萬時公會會強制紓困（沒收技能或降級）。</p>` : ''}
          ${dropHTML(drops)}
          ${sagaLine}${roundLine}
          ${tutorial ? '<p class="xp-line">🎓 新手教學不列入生涯紀錄。</p>' : `<p class="xp-line">🎖️ 經驗值 +${gain}${newPts > 0 ? `　<b>獲得 ${newPts} 個技能點！到「獵人檔案」解鎖新技能</b>` : ''}</p>`}
        </div>
        <aside class="sidebar">
          <h3>💡 你知道嗎？</h3>
          <ul>${facts}</ul>
        </aside>
      </div>
      <div class="paper-foot">獵人紀錄：逮捕 ${stats.solved}・失手 ${stats.failed}・最高分 ${stats.best}・存款 ${fmtMoney(me.money)}・${rankName()}<br>
        本報導情節與人物純屬虛構；地點歷史為真實資料。</div>`;
    win ? SFX.win() : SFX.lose();
    setTimeout(() => SFX.stamp(), 400);
    if (pay) setTimeout(() => SFX.kaching(), 1000);
    if (bail) setTimeout(() => SFX.buzzer(), 1500);
    R = Math.random;
    $('#end').hidden = false;
    render();
  }


  // ---------- 畫面 ----------
  function radio(text, cls = '') {
    const li = document.createElement('li');
    if (cls) li.className = cls;
    $('#log').prepend(li);
    typeText(li, text, 12);
    if (cls === 'alarm' || cls === 'hot') SFX.radio();
    const tk = $('#ticker');
    tk.className = `m-ticker ${cls}`;
    $('#ticker-text').textContent = text;
  }

  function addNote(title, text, good) {
    if (!S.notes.length) $('#notes').innerHTML = '';
    S.notes.push(text);
    const li = document.createElement('li');
    li.className = good ? 'clue' : good === null ? 'clue meh' : 'clue dead';
    li.innerHTML = '<small></small><span></span>';
    li.querySelector('small').textContent = title;
    $('#notes').prepend(li);
    typeText(li.querySelector('span'), text, 24);
    vibrate(good ? 25 : [15, 50, 15]); // 手機：拿到線索輕震一下
    const drawerOnNotes = $('#panel').classList.contains('open') && $('#panel').dataset.tab === 'notes';
    if (isMobile() && !drawerOnNotes) {
      unread++;
      showBubble(title, text, good);
    }
    updateBadge();
  }

  function updateBadge() {
    const b = $('#badge');
    b.hidden = unread === 0;
    b.textContent = unread;
  }

  // 手機版：新線索以對話泡泡浮在地圖上
  async function showBubble(title, text, good) {
    const bb = $('#bubble');
    clearTimeout(bubbleTimer);
    bb.hidden = false;
    bb.classList.toggle('dead', !good);
    $('#bubble-title').textContent = title;
    await typeText($('#bubble-text'), text, 28);
    bubbleTimer = setTimeout(() => { bb.hidden = true; }, 6000);
  }

  function showAlarm(text) {
    const a = $('#alarm');
    $('#alarm-text').textContent = text;
    a.hidden = true;
    void a.offsetWidth;
    a.hidden = false;
    setTimeout(() => { a.hidden = true; }, 1900);
  }

  // 手機版抽屜（筆記／無線電／目的地）
  function openDrawer(tab) {
    const p = $('#panel');
    p.dataset.tab = tab;
    p.classList.add('open');
    p.scrollTop = 0;
    $('#drawer-bg').hidden = false;
    if (tab === 'notes') { unread = 0; updateBadge(); }
  }
  function closeDrawer() {
    $('#panel').classList.remove('open');
    $('#drawer-bg').hidden = true;
  }

  function flash() {
    document.body.classList.remove('flash');
    void document.body.offsetWidth;
    document.body.classList.add('flash');
  }

  function refreshMarkers() {
    for (const id in markers) {
      let st = 'normal';
      if (S && id === S.current) st = 'current';
      else if (id === selected) st = 'selected';
      else if (S && S.visited.has(id)) st = 'visited';
      const blocked = !!S && S.blocks.some((b) => b.loc === id && b.until > S.time);
      markers[id].setState(st, blocked, !!S && !S.over && hot.size <= 8 && hot.has(id));
    }
  }

  function select(id) {
    if (!S || S.over || busy || S.raiding || S.chase) return;
    selected = id === S.current ? null : id;
    if (selected && isMobile()) { closeDrawer(); $('#bubble').hidden = true; }
    refreshMarkers();
    render();
  }

  function render() {
    if (!S) return;
    const f = S.fugitive;
    $('#hud-case').innerHTML = `<span class="mug" title="${S.profile.name}">${faceOf(f)}</span><span class="who"><b>${f.avatar ? sexBadge(f.male) : ''}${f.name}</b><small>${S.caseFile.crime}・${S.profile.icon}${S.profile.name}${S.mod ? `・${S.mod.icon}${S.mod.name}` : ''}${S.mission ? `・${MISSIONS[S.mission].icon}${S.gang ? `集團 ${S.gang.idx + 1}/${S.gang.members.length}` : MISSIONS[S.mission].name}` : ''}${S.loot?.found ? ' ✔' : ''}</small></span>`;
    $('#clock').textContent = clock(S.time);
    const left = Math.max(0, S.deadline - S.time);
    const eb = $('#escape-bar');
    if (S.port && !S.over) {
      // 已知港口：不知道確切時間，只顯示推估的時間窗
      $('#escape').textContent = S.port.win ? `${shortClock(S.port.win[0])}～${shortClock(S.port.win[1])}` : '？？（時間不明）';
      eb.style.width = '100%'; eb.className = 'unknown';
      document.body.classList.remove('danger');
    } else {
      $('#escape').textContent = fmtH(left);
      eb.style.width = `${clamp((left / Math.max(S.deadline, S.diff.deadline)) * 100, 0, 100)}%`;
      eb.className = left < 12 ? 'danger' : left < 30 ? 'warn' : '';
      document.body.classList.toggle('danger', !S.over && left < 12);
    }
    // 緊張程度：剩餘時間越少、警覺越高，畫面邊緣越紅，背景心跳越急
    const tLeft = S.port ? 99 : left;
    document.body.dataset.tension = S.over || S.mode === 'tutorial' ? 0 : tLeft < 12 ? 3 : tLeft < 24 || S.alert >= 70 ? 2 : tLeft < 36 || S.alert >= 50 ? 1 : 0;
    $('#alert-val').textContent = `${Math.round(S.alert)}%${isMission('hostage') ? ' / 80' : ''}`;
    const ab = $('#alert-bar');
    ab.style.width = `${S.alert}%`;
    ab.className = S.alert >= 70 ? 'danger' : S.alert >= 40 ? 'warn' : '';
    $('#money').innerHTML = S.free ? '<small>本案免費</small>'
      : `<b class="${S.fund ? '' : 'out'}">${S.fund}</b><small>萬</small><i class="${me.money < 0 ? 'neg' : ''}">存款 ${fmtMoney(me.money)}</i>`;
    $('#blocks').innerHTML = S.blocksLeft ? `${'🚧'.repeat(S.blocksLeft)}<small>剩 ${S.blocksLeft}</small>` : '<small>用完了</small>';

    const cur = LOC[S.current];
    const pool = (window.LOC_DESC || {})[cur.id] || [];
    if (S.descs[cur.id] == null && pool.length) S.descs[cur.id] = pool[Math.floor(Math.random() * pool.length)]; // 不用 R，避免影響每日挑戰的亂數
    $('#here').innerHTML = `<b>${cur.name}</b><small>${cur.county}</small>`;
    $('#here-desc').textContent = S.descs[cur.id] || '';
    const st = trackState();
    const status = $('#status');
    status.className = 'status';
    if (st === 'present' && S.alarmed[S.stage]) {
      status.classList.add('alarm');
      status.textContent = S.stage === lastIdx() ? '🚨 嫌犯就躲在這一帶！查出藏身處後攻堅' : '🚨 嫌犯還在這裡！把握機會提前攻堅';
    } else if (S.seenHere[S.current] && !S.known[S.current]) {
      status.textContent = '🤔 目擊者說不清楚，還不能確定他有沒有來過';
    } else if (S.seenHere[S.current]) {
      if (st === 'left') {
        const ago = sinceLeft();
        status.classList.add(ago > 24 ? 'cold' : 'warm');
        status.textContent = `👣 他約 ${Math.max(1, Math.round(ago))} 小時前離開${ago > 24 ? '（線索變冷了）' : ''}`;
      } else if (st === 'ahead') {
        status.classList.add('warm');
        status.textContent = '👀 這裡還沒有他的蹤影……也許你搶先一步了？';
      } else {
        status.classList.add('cold');
        status.textContent = '❌ 這裡沒有他的足跡';
      }
    } else {
      status.textContent = '🔍 這裡還沒調查過';
    }

    const used = S.used[S.current] || [];
    const remain = Math.max(0, budget() - used.length);
    const lock = S.over || busy || !!S.raiding || !!S.chase;
    $('#budget').innerHTML = `🔍 本站還能調查 <b>${remain}</b> / ${budget()} 項${remain ? '' : '（下次再來，或他抵達／離開時，可以重新調查）'}`;
    $('#budget').classList.toggle('empty', !remain);
    $('#actions').innerHTML = '';
    INVESTIGATIONS.forEach((inv) => {
      const b = document.createElement('button');
      b.className = 'act';
      b.dataset.inv = inv.key;
      b.disabled = lock || used.includes(inv.key) || !remain;
      const hint = inv.key === 'witness' && st === 'present' ? '他躲在哪裡' : inv.hint;
      const fee = invFee(inv.key);
      b.title = `${inv.label}：${hint}（花 ${invCost(inv)} 小時${fee ? `、${fee} 萬` : ''}）`;
      b.innerHTML = `<span class="ico">${ICON(inv.key)}</span><span>${inv.label}</span><em class="cost">${used.includes(inv.key) ? '✔' : '⏱' + invCost(inv) + 'h'}</em>`
        + `<small>${used.includes(inv.key) ? '已完成' : hint}</small>${!used.includes(inv.key) && fee ? `<i class="fee${inv.key === 'informant' ? ' quote' : ''}">💰${fee} 萬</i>` : ''}`;
      b.onclick = () => investigate(inv.key);
      $('#actions').appendChild(b);
    });
    const lr = lootReady();
    $('#loot-btn').hidden = !lr; $('#hb-loot').hidden = !lr;
    $('#loot-btn').disabled = lock; $('#hb-loot').disabled = lock;
    $('#hotbar').classList.toggle('has-loot', lr);
    $('#loot-btn').innerHTML = `<span class="bt">${ICON('loot')} 搜查贓物</span><small>${S.loot && S.loot.tried.length ? `已排除 ${S.loot.tried.length} 處・` : ''}花 2 小時</small>`;
    $('#wait-btn').disabled = lock;
    const amb = ambushSuggested() && !lock;
    const wh = amb || lock ? null : waitHint();
    $('#wait-btn').classList.toggle('suggest', amb);
    $('#wait-btn').classList.toggle('w-no', !!wh && wh.no);
    $('#wait-btn').classList.toggle('w-hint', !!wh);
    $('#wait-btn').innerHTML = amb ? `<span class="bt">${ICON('wait')} 埋伏到他現身</span><small>你比他先到了！最多等 ${AMBUSH_MAX} 小時</small>`
      : `<span class="bt">${ICON('wait')} 埋伏 ${has('ambush') ? 1 : 2} 小時</span>${wh ? `<small>${wh.t}</small>` : ''}`;
    // 手機版埋伏鍵：短字說明適不適合等
    const hw = $('#hb-wait');
    hw.disabled = lock;
    hw.classList.toggle('suggest', amb);
    hw.classList.toggle('no', !!wh && wh.no);
    hw.querySelector('b').textContent = amb ? '等他現身' : '埋伏';
    hw.querySelector('small').textContent = amb ? '他還沒到！' : wh ? (wh.no ? '現在別等' : '先調查') : `${has('ambush') ? 1 : 2} 小時`;
    hw.title = amb ? `你比他先到了！最多等 ${AMBUSH_MAX} 小時` : wh ? wh.t : '';
    const blockedHere = S.blocks.some((b) => b.loc === S.current && b.until > S.time);
    $('#block-here').disabled = lock || S.blocksLeft <= 0 || blockedHere;
    const rb = $('#raid-btn');
    rb.disabled = lock;
    const ready = st === 'present' && !!S.alarmed[S.stage];
    rb.classList.toggle('ready', ready);
    rb.innerHTML = ready ? `<span class="bt">${ICON('raid')} 他就在這！申請搜索票攻堅</span>` : `<span class="bt">${ICON('warrant')} 申請搜索票並攻堅</span><small>確定他就在這一帶時再用，失手兩次他會逃走</small>`;

    // 下一步提示：告訴玩家現在該做什麼
    const nx = nextStep(st, remain);
    $('#next').className = `next ${nx.cls || ''}`;
    $('#next').innerHTML = `<b>下一步</b><span>${nx.text}</span>`;

    // 包圍網提示
    const net = $('#net');
    net.hidden = !hot.size || S.over;
    net.textContent = `🎯 包圍網：${hot.size} 處可疑`;

    // 手機版：快捷列、位置標籤、行程卡
    document.querySelectorAll('#hotbar [data-inv]').forEach((b) => {
      const done = used.includes(b.dataset.inv);
      const inv = INVESTIGATIONS.find((x) => x.key === b.dataset.inv), fee = invFee(inv.key);
      b.disabled = lock || done || !remain;
      b.classList.toggle('done', done);
      b.querySelector('small').textContent = done ? '已查過' : `${invCost(inv)}h${fee ? `・${fee}萬` : ''}`;
    });
    $('#hb-raid').disabled = lock;
    $('#hb-raid').classList.toggle('ready', ready);
    $('#hb-raid').querySelector('b').textContent = ready ? '攻堅！' : '申請攻堅';
    $('#hb-raid').querySelector('small').textContent = ready ? '他就在這裡' : '搜索票';
    $('#hb-raid > span').innerHTML = ICON(ready ? 'raid' : 'warrant');
    $('#hb-block').disabled = $('#block-here').disabled;
    $('#hb-block').querySelector('small').innerHTML = blockedHere ? '已封鎖' : S.blocksLeft <= 0 ? '用完了' : `剩${S.blocksLeft}次${S.free ? '' : `<span class="hb-fee">・${blockFee(S.current)}萬</span>`}`;
    $('#hb-notes').disabled = $('#hb-log').disabled = false;
    $('#block-here').innerHTML = `${ICON('block')} 封鎖此地${S.free ? '' : `<small class="bfee">💰 ${blockFee(S.current)} 萬</small>`}`;
    const chip = $('#chip');
    chip.className = `m-chip ${[...status.classList].filter((c) => c !== 'status').join(' ')}`;
    chip.innerHTML = `<b>📍 ${cur.name}</b><i class="chip-budget">🔍${remain}</i>`;
    chip.appendChild(document.createTextNode(status.textContent));
    const cn = document.createElement('em');
    cn.className = 'chip-next';
    cn.textContent = '👉 ' + nx.text;
    chip.appendChild(cn);
    const trip = $('#trip');
    if (selected && !S.over) {
      const p = travelPlan(cur, LOC[selected]);
      const blk = S.blocks.some((b) => b.loc === selected && b.until > S.time);
      trip.innerHTML = `<div class="dest"><b>${LOC[selected].name}</b><small>${LOC[selected].county}</small>${hot.has(selected) ? '<em class="hot-tag">🎯 包圍網內</em>' : ''}
        <div class="plan"><span>${p.mode}</span><span>${p.km} 公里</span><span>約 ${fmtH(p.hours)}</span>${S.free ? '' : `<span class="fee">💰 ${travelFee(cur, LOC[selected])} 萬</span>`}</div></div>
        <div class="row"><button class="btn" id="m-cancel">✕</button><button class="btn" id="m-block">🚧 ${blk ? '封鎖中' : `封鎖${S.free ? '' : `<small class="bfee">💰 ${blockFee(selected)} 萬</small>`}`}</button>
        <button class="btn primary" id="m-go">${busy ? '移動中…' : '🚀 出發'}</button></div>`;
      $('#m-go').disabled = lock;
      $('#m-go').onclick = travel;
      $('#m-block').disabled = lock || S.blocksLeft <= 0 || blk;
      $('#m-block').onclick = () => blockade(selected);
      $('#m-cancel').onclick = () => select(null);
      trip.hidden = false;
    } else trip.hidden = true;

    const tv = $('#travel');
    if (selected) {
      const p = travelPlan(cur, LOC[selected]);
      const blk = S.blocks.some((b) => b.loc === selected && b.until > S.time);
      tv.innerHTML = `<div class="dest"><b>${LOC[selected].name}</b><small>${LOC[selected].county}</small>${hot.has(selected) ? '<em class="hot-tag">🎯 包圍網內</em>' : ''}
        <div class="plan"><span>${p.mode}</span><span>${p.km} 公里</span><span>約 ${fmtH(p.hours)}</span>${S.free ? '' : `<span class="fee">💰 ${travelFee(cur, LOC[selected])} 萬</span>`}</div></div>
        <div class="row"><button class="btn primary" id="go-btn">${busy ? '移動中…' : '🚀 出發'}</button>
        <button class="btn" id="block-sel" title="管制當地機場、港口與車站 ${BLOCK_HOURS} 小時">🚧 ${blk ? '封鎖中' : `封鎖此地${S.free ? '' : `<small class="bfee">💰 ${blockFee(selected)} 萬</small>`}`}</button></div>`;
      $('#go-btn').disabled = lock;
      $('#go-btn').onclick = travel;
      $('#block-sel').disabled = lock || S.blocksLeft <= 0 || blk;
      $('#block-sel').onclick = () => blockade(selected);
    } else {
      tv.innerHTML = '<p class="hint">點選地圖上的地點，這裡會顯示交通方式、時間和費用。</p>';
    }
    renderCardCta(lock);
    tutTick();
  }

  function nextStep(st, remain) {
    const n = hot.size, seen = S.known[S.current], mob = isMobile();
    if (busy) return { text: '移動中……' };
    if (st === 'present' && S.alarmed[S.stage]) {
      const btn = mob ? '右下角「🚨 攻堅」' : '下方紅色按鈕';
      return remain ? { cls: 'alarm', text: `他就在附近！先🗣️問目擊者查出藏身處，再按${btn}。` }
        : { cls: 'alarm', text: `他就在附近！按${btn}申請搜索票。` };
    }
    if (st === 'ahead' && seen) return { cls: 'warm', text: `你比他先到了！${mob ? '按下方發光的「⏳ 等他現身」' : '按發光的「⏳ 埋伏到他現身」'}，他一出現就能攻堅。` };
    if (st === 'off' && seen) return { cls: 'cold', text: '走錯地方了。看筆記重新推理，或回到上一站再查一次。' };
    if (S.seenHere[S.current] && !seen && remain) return { text: '目擊者說不清楚。換一種調查（監視器、通聯、線民）確認他有沒有來過。' };
    if (!seen || (!n && remain)) return { text: `從${mob ? '下方' : '上方'}四種調查挑一項，問出他的去向。` };
    if (n && n <= 8) return { cls: 'warm', text: `地圖上閃紅光的 ${n} 處最可疑，點一處 → 按「🚀 出發」。` };
    if (n && remain) return { text: `可疑地點還有 ${n} 處，再調查一項把範圍縮小。` };
    return { text: '這站查不出更多了。依筆記推理，在地圖上點選目的地出發。' };
  }

  // 包圍網縮小時，把鏡頭拉到可疑地點
  let lastFrame = '';
  function frameHot() {
    const key = S ? [S.current, ...hot].join(',') : '';
    if (!S || key === lastFrame) return;
    lastFrame = key;
    if (!hot.size || hot.size > 8) return;
    map.fitPoints([LOC[S.current], ...[...hot].map((id) => LOC[id])], isMobile());
  }

  // ---------- 通緝海報 ----------
  function showPoster(diffKey, mode = 'normal', ready = null) {
    pending = ready || makeCase(diffKey, mode);
    const f = pending.fugitive;
    $('#poster-face').innerHTML = faceOf(f, { mug: true });
    $('#poster-name').textContent = f.name;
    $('#poster-alias').textContent = `綽號「${f.alias}」`;
    $('#poster-meta').innerHTML = f.look ? `${sexBadge(f.male)}${f.look.line}` : '';
    $('#poster-crime').textContent = pending.caseFile.crime;
    $('#poster-traits').innerHTML = f.traits.map((t) => `<li>${t}</li>`).join('');
    $('#poster-last').textContent = LOC[pending.route[0]].name;
    $('#poster-profile').textContent = `${pending.profile.icon} ${pending.profile.name}：${pending.profile.desc}`;
    $('#poster-reward').textContent = `新臺幣 ${caseReward(pending)} 萬元${pending.gang ? `（${pending.gang.members.length} 人合計）` : ''}`;
    const tag = mode === 'tutorial' ? '🎓 新手教學・' : mode === 'saga' ? `📂 ${SAGA.title} 第 ${(me.saga % SAGA.chapters.length) + 1} 案・` : mode === 'bounty' && round ? `🎯 第 ${round.no} 輪懸賞・` : '';
    const danger = mode === 'tutorial' ? '練習用' : `危險等級 ${starStr(pending.diffKey)} ${STAR_NAME[pending.diffKey]}`;
    $('#poster-diff').innerHTML = `${tag ? `<span class="pd-tag">${tag.replace(/・$/, '')}</span>` : ''}<span class="pd-star">${danger}</span>`
      + `${pending.free ? '' : `<span>💼 行動經費 ${pending.fund} 萬</span>`}<span>🚩 逃亡 ${caseStops(pending)} 站${pending.gang ? `・${pending.gang.members.length} 人` : ''}</span><span>🔍 每站查 ${pending.diff.budget} 項</span><span>⏳ ${pending.port ? '出境時間不明' : `${pending.deadline} 小時後出境`}</span>`
      + (pending.mission ? `<span class="pd-mod pd-mission">⭐ 特殊任務：${MISSIONS[pending.mission].icon} ${MISSIONS[pending.mission].name}<small>${MISSIONS[pending.mission].desc}</small></span>` : '')
      + (pending.mod ? `<span class="pd-mod">⚠️ 案件狀況：${pending.mod.icon} ${pending.mod.name}<small>${pending.mod.desc}</small></span>` : '')
      + (pending.nemesis ? `<span class="pd-mod pd-nemesis">🔁 宿敵回歸：上次讓他跑了，這次他記得你<small>${pending.nemesis.from && pending.nemesis.from !== pending.diffKey ? '危險等級升一級、' : ''}懸賞加倍，一開始就比較警覺。</small></span>` : '')
      + (me.streak && mode !== 'tutorial' ? `<span class="pd-streak">🔥 目前 ${me.streak} 連勝・抓到賞金 +${Math.min(5, me.streak) * 10}%</span>` : '');
    $('#reroll').hidden = true;
    $('#start').hidden = true;
    $('#poster').hidden = false;
    SFX.paper(); setTimeout(() => SFX.stamp(), 150);
    typeText($('#poster-intro'), pending.intro, 28);
  }

  // ---------- 懸賞看板：每輪四張通緝令，全部結案後結算 ----------
  const ROUND_KEY = 'roc-chase-round';
  let round = store.get(ROUND_KEY, null);
  const saveRound = () => store.set(ROUND_KEY, round);
  const roundDone = () => !!round && round.cases.every((c) => c.result);
  // 通緝令只存種子，每次用同一個種子重建，案子內容不會變
  const bountyCase = (i) => { const c = makeCase(round.cases[i].diffKey, 'bounty', round.cases[i].seed, round.cases[i].lv >= 2 ? LOCATIONS : POOL_V1, round.cases[i].mission); c.roundIdx = i; if (round.cases[i].nemesis) applyNemesis(c, round.cases[i].nemesis); R = Math.random; return c; };
  // 宿敵：沿用上次逃走的那個人（名字、長相、特徵），案子本身重新產生
  function applyNemesis(c, n) {
    c.fugitive = { ...n.fug, look: Avatar.describe(n.fug.avatar) };
    const intro = `${n.fug.name}又回來了！上次讓他從賞金獵人手上溜走，這次他帶著更多反偵查經驗重出江湖——而且他記得你。`;
    c.caseFile = { crime: n.crime, intro };
    c.intro = intro;
    c.nemesis = n;
    c.alert += 15;
  }
  // 特殊任務：依獵人等級挑一種，放在一張還沒結案的通緝令上（人質、集團不給 ★ 小咖）
  function pickMission(cases) {
    const types = Object.keys(MISSIONS).filter((k) => me.rank >= MISSIONS[k].minRank);
    const open = cases.map((_, i) => i).filter((i) => !cases[i].result && !cases[i].nemesis);
    if (!types.length || !open.length) return;
    let t = types[Math.floor(Math.random() * types.length)];
    let cand = open.filter((i) => !((t === 'gang' || t === 'hostage') && cases[i].diffKey === 'rookie'));
    if (!cand.length) { t = 'loot'; cand = open; }
    cases[cand[Math.floor(Math.random() * cand.length)]].mission = t;
  }

  function newRound() {
    const keys = RANK_MIX[clamp(me.rank, 0, RANK_MIX.length - 1)];
    const cases = [];
    for (const k of keys) {
      let seed, c, tries = 0;
      // 看板上的名字、綽號、長相不重複
      do { seed = Math.floor(Math.random() * 2 ** 31); c = makeCase(k, 'bounty', seed); }
      while (tries++ < 20 && (cases.some((o) => o.name === c.fugitive.name || o.alias === c.fugitive.alias)
        || (cases.length >= 2 && cases.every((o) => o.male === c.fugitive.male)))); // 四張裡男女都要有
      cases.push({ seed, lv: 2, diffKey: k, name: c.fugitive.name, alias: c.fugitive.alias, avatar: c.fugitive.avatar, male: c.fugitive.male, reward: c.fugitive.reward, result: null, score: 0, pay: 0 });
    }
    R = Math.random;
    const no = (round ? round.no : 0) + 1;
    // 宿敵回歸：兩輪前讓他跑掉的逃犯，升一級、懸賞加倍回到看板
    const ni = (me.nemeses || []).findIndex((n) => no >= n.at + 2);
    if (ni >= 0) {
      const n = me.nemeses.splice(ni, 1)[0];
      saveMe();
      const up = { rookie: 'detective', detective: 'master', master: 'master' }[n.diffKey];
      const fug = { ...n.fug, reward: Math.min(2000, Math.round((n.fug.reward * 2) / 10) * 10) };
      let slot = cases.findIndex((o) => o.diffKey === up);
      if (slot < 0) slot = cases.length - 1;
      cases[slot] = { seed: Math.floor(Math.random() * 2 ** 31), lv: 2, diffKey: up, name: fug.name, alias: fug.alias, avatar: fug.avatar, male: fug.male, reward: fug.reward, result: null, score: 0, pay: 0, nemesis: { fug, crime: n.crime, times: n.times + 1, from: n.diffKey } };
    }
    pickMission(cases);
    round = { no, rank: me.rank, cases, mv: 1 };
    saveRound();
  }

  function renderBoard() {
    if (!round || !Array.isArray(round.cases) || round.cases.length !== 4) newRound();
    // 舊版存的通緝令沒有頭像：用種子重建一次，名字和長相跟實際案子對齊
    if (round.cases.some((rc) => !rc.avatar)) {
      round.cases.forEach((rc, i) => { if (rc.avatar) return; const f = bountyCase(i).fugitive; Object.assign(rc, { name: f.name, alias: f.alias, avatar: f.avatar, male: f.male, reward: f.reward }); delete rc.face; });
      saveRound();
    }
    // 舊的看板：補一張特殊任務（只補一次）
    if (round.mv !== 1) { pickMission(round.cases); round.mv = 1; saveRound(); }
    const done = round.cases.filter((c) => c.result).length;
    $('#board-round').innerHTML = `<small>ROUND</small><b>${String(round.no).padStart(2, '0')}</b>`
      + `<span class="pips">${round.cases.map((rc) => `<i class="${rc.result || ''}"></i>`).join('')}</span><small>${done} / 4 結案</small>`;
    const box = $('#board');
    box.innerHTML = '';
    if (!$('#start').hidden) round.cases.forEach((_, i) => setTimeout(() => SFX.slam(), 120 + i * 90));
    round.cases.forEach((rc, i) => {
      const c = bountyCase(i);
      const f = c.fugitive;
      const b = document.createElement('button');
      const tier = STARS[c.diffKey];
      b.className = `wc t${tier}${rc.result ? ` closed ${rc.result}` : ''}`;
      b.style.setProperty('--tilt', `${[-1.6, 1.2, -0.8, 1.6][i % 4]}deg`);
      b.style.setProperty('--i', i);
      const stamp = rc.result === 'win' ? `<span class="wc-stamp"><b>逮捕成功</b><small>+${rc.pay} 萬・${rc.score} 分</small></span>`
        : rc.result === 'fail' ? '<span class="wc-stamp"><b>失　手</b><small>ESCAPED</small></span>' : '';
      b.innerHTML = `<span class="wc-head"><span class="no">FILE No.${String(round.no).padStart(2, '0')}${i + 1}-${'ABCD'[i]}</span><span class="tier"><em>${'★'.repeat(tier)}</em>${STAR_NAME[c.diffKey]}</span></span>
        <span class="wc-word">WANTED</span>
        <span class="wc-photo">${faceOf(f, { mug: true, tight: true })}<span class="wc-crime">${c.caseFile.crime}</span>${tier === 3 ? '<span class="wc-danger">DANGER</span>' : ''}</span>
        <span class="wc-id"><b>${f.avatar ? sexBadge(f.male) : ''}${f.name}</b><small>綽號「${f.alias}」${f.look ? `・${f.look.line}` : ''}</small></span>
        <span class="wc-stats"><span><small>ROUTE 逃亡</small><b>🚩 ${caseStops(c)} 站${c.gang ? `・${c.gang.members.length}人` : ''}</b></span><span><small>DEADLINE 出境</small><b>⏳ ${c.port ? '？？' : `${c.deadline} 小時`}</b></span></span>
        <span class="wc-prof">側寫：${c.profile.icon} ${c.profile.name}${c.nemesis ? '<i class="wc-mod wc-nemesis">🔁 宿敵回歸</i>' : c.mission ? `<i class="wc-mod wc-mission">${MISSIONS[c.mission].icon} ${MISSIONS[c.mission].name}</i>` : c.mod ? `<i class="wc-mod">${c.mod.icon} ${c.mod.name}</i>` : ''}</span>
        <span class="wc-reward"><small>REWARD<br>懸賞金</small><b>${caseReward(c)}</b><em>萬</em><span class="wc-cta">🎯 接下懸賞 →</span></span>${stamp}`;
      if (rc.result) { b.disabled = true; b.title = rc.result === 'win' ? '已逮捕歸案' : '這張通緝令失敗了'; }
      else b.onclick = () => { SFX.click(); showPoster(null, 'bounty', bountyCase(i)); };
      box.appendChild(b);
    });
  }

  // 本輪結算：依結果升降等級，失手太多沒收技能，然後發新一輪通緝令
  const ROUND_BONUS = 100; // 四張全抓到的加碼獎金（萬）
  function settleRound() {
    if (!roundDone()) return;
    const wins = round.cases.filter((c) => c.result === 'win').length;
    const fails = round.cases.length - wins;
    const before = me.rank;
    me.rank = clamp(me.rank + (wins >= 3 ? 1 : wins <= 1 ? -1 : 0), 0, RANKS.length - 1);
    const delta = me.rank - before;
    // 失手 3 張以上：沒收最近學會的一項技能（連同換到它的 1000 點經驗值）
    let lost = null;
    if (fails >= 3) {
      if (me.skills.length) { const id = me.skills.pop(); const cost = me.paid[id] || 1; delete me.paid[id]; lost = SKILLS.find((k) => k.id === id); me.xp = Math.max(0, me.xp - XP_PER_POINT * cost); }
      else if (skillPoints() > 0) { lost = { icon: '🎖️', name: '1 個還沒用的技能點' }; me.xp = Math.max(0, me.xp - XP_PER_POINT); }
    }
    const bonus = wins === 4 ? ROUND_BONUS : 0;
    me.money += bonus;
    saveMe();
    const total = round.cases.reduce((a, c) => a + c.pay, 0) + bonus;
    const score = round.cases.reduce((a, c) => a + c.score, 0);
    const verdict = wins === 4 ? '🏆 完美的一輪！四名通緝犯全部落網' : wins === 3 ? '👍 表現優秀，公會對你刮目相看' : wins === 2 ? '😐 表現普通，等級維持不變' : '😓 表現太差，公會要給你降級';
    $('#rd-title').textContent = `第 ${round.no} 輪懸賞結算`;
    $('#rd-list').innerHTML = round.cases.map((c) => `<li class="${c.result}"><span class="rd-face">${faceOf(c)}</span>
      <span class="rd-who"><b>${c.avatar ? sexBadge(c.male) : ''}${c.name}</b><small>${starStr(c.diffKey)} ${STAR_NAME[c.diffKey]}・懸賞 ${c.reward} 萬</small></span>
      <span class="rd-res">${c.result === 'win' ? `<b>逮捕成功</b><small>+${c.pay} 萬・${c.score} 分</small>` : '<b>失敗</b><small>讓他跑了</small>'}</span></li>`).join('');
    $('#rd-sum').innerHTML = `<div><small>逮捕</small><b>${wins} / 4</b></div><div><small>本輪賞金</small><b>${total} 萬</b></div><div><small>總績效</small><b>${score}</b></div>`;
    const arrow = delta > 0 ? '<i class="up">▲ 升級</i>' : delta < 0 ? '<i class="down">▼ 降級</i>' : '<i>＝ 維持</i>';
    const notes = [];
    if (delta === 0 && wins <= 1) notes.push('<p class="rd-note">已經是最低等級，沒有再降。</p>');
    if (delta === 0 && wins >= 3) notes.push('<p class="rd-note good">已經是最高等級！</p>');
    if (bonus) notes.push(`<p class="rd-note good">💰 全數逮捕，加碼獎金 +${bonus} 萬</p>`);
    if (lost) notes.push(`<p class="rd-note bad">⚠️ 失手 ${fails} 張，公會沒收了你的技能：${lost.icon} ${lost.name}</p>`);
    else if (fails >= 3) notes.push(`<p class="rd-note bad">⚠️ 失手 ${fails} 張！還好你沒有技能可以被沒收。</p>`);
    $('#rd-rank').className = `rd-rank ${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}`;
    $('#rd-rank').innerHTML = `<p class="rd-verdict">${verdict}</p>
      <div class="rd-change"><span>${rankName(before)}</span><em>→</em><b>${rankName()}</b>${arrow}</div>
      ${notes.join('')}
      <p class="rd-next">下一輪看板：${RANK_MIX[me.rank].map((k) => `${'★'.repeat(STARS[k])} ${STAR_NAME[k]}`).join('、')}</p>`;
    newRound();
    refreshTitle();
    $('#round').hidden = false;
    delta >= 0 ? SFX.win() : SFX.lose();
    setTimeout(() => SFX.stamp(), 300);
  }

  // ---------- 獵人檔案 ----------
  let pfTab = 'all', pfArmed = null, pfArmTimer = null;
  function renderProfile() {
    const st = store.get('roc-chase-stats', { solved: 0, failed: 0, best: 0 });
    const into = me.xp % XP_PER_POINT;
    const pts = skillPoints();
    $('#pf-head').innerHTML = `<div class="pf-id"><span class="pf-rank">${rankName()}</span>
        <span class="pf-stats">破案 <b>${st.solved}</b>・失手 <b>${st.failed}</b>・最高分 <b>${st.best}</b>・存款 <b class="${me.money < 0 ? 'neg' : ''}">${fmtMoney(me.money)}</b>${me.probation ? `・⚖️ 保護管束剩 <b>${me.probation}</b> 張` : ''}</span>
        <div class="xpbar"><div style="width:${(into / XP_PER_POINT) * 100}%"></div></div>
        <small>經驗值 ${me.xp}・距離下一個技能點還差 ${XP_PER_POINT - into}・已學會 ${me.skills.length} / ${SKILLS.length} 項</small></div>
      <div class="pf-pts${pts > 0 ? ' has' : ''}">
        <div class="pf-token"><b>${pts}</b></div>
        <div class="pf-pts-txt"><small>SKILL POINTS</small><strong>可用技能點</strong>
          <em>${pts > 0 ? '👉 點下方卡片解鎖技能' : `下一點還差 ${XP_PER_POINT - into} 經驗值`}</em></div>
      </div>`;
    const cats = Object.entries(SKILL_CATS);
    $('#pf-tabs').innerHTML = [['all', { icon: '📋', name: '全部' }], ...cats].map(([k, c]) => {
      const list = SKILLS.filter((s) => k === 'all' || s.cat === k);
      const own = list.filter((s) => me.skills.includes(s.id)).length;
      return `<button data-k="${k}" class="${pfTab === k ? 'on' : ''}" style="--c:${c.color || '#fff'}">${c.icon} ${c.name}<small>${own}/${list.length}</small></button>`;
    }).join('');
    $('#pf-tabs').querySelectorAll('button').forEach((b) => { b.onclick = () => { pfTab = b.dataset.k; pfArmed = null; SFX.click(); renderProfile(); }; });
    const box = $('#pf-skills');
    box.innerHTML = '';
    SKILLS.filter((s) => pfTab === 'all' || s.cat === pfTab).forEach((sk, i) => {
      const own = me.skills.includes(sk.id);
      const ready = !own && pts >= sk.cost;
      const armed = pfArmed === sk.id && ready;
      const c = SKILL_CATS[sk.cat];
      const b = document.createElement('button');
      b.className = `skc ${own ? 'own' : ready ? 'ready' : 'locked'}${armed ? ' armed' : ''}`;
      b.style.setProperty('--c', c.color);
      b.style.setProperty('--i', i);
      const pips = Array.from({ length: 5 }, (_, n) => `<i class="${n < sk.cost ? 'on' : ''}"></i>`).join('');
      const act = own ? '✔ 已學會' : armed ? `再按一次確認（−${sk.cost} 點）` : ready ? `解鎖・${sk.cost} 點` : `還差 ${sk.cost - pts} 點`;
      b.innerHTML = `<span class="skc-top"><span class="skc-cat">${c.icon} ${c.name}</span><span class="skc-cost" title="需要 ${sk.cost} 點">${pips}</span></span>
        <span class="skc-ico">${sk.icon}</span><b class="skc-name">${sk.name}</b><small class="skc-desc">${sk.desc}</small>
        <span class="skc-act">${act}</span>`;
      b.disabled = own;
      b.onclick = () => {
        if (own) return;
        if (!ready) { SFX.alarm(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; }
        if (!armed) { pfArmed = sk.id; SFX.click(); clearTimeout(pfArmTimer); pfArmTimer = setTimeout(() => { pfArmed = null; if (!$('#profile').hidden) renderProfile(); }, 3000); renderProfile(); return; }
        pfArmed = null; clearTimeout(pfArmTimer);
        me.skills.push(sk.id); me.paid[sk.id] = sk.cost; saveMe();
        SFX.levelup(); renderProfile(); refreshTitle();
        const nb = [...box.children].find((x) => x.querySelector('.skc-name').textContent === sk.name);
        if (nb) nb.classList.add('just');
      };
      box.appendChild(b);
    });
  }

  // ---------- 卡牌收藏：逮捕的逃犯變成卡牌，每張有一種輔助效果 ----------
  // 一張牌用一次就消失；同一種效果每個案子只能用一張；今日挑戰、新手教學不能用
  const DECK_MAX = 30;
  const RARITY = { n: { name: '普通', color: '#9fb3c8' }, r: { name: '稀有', color: '#c084ff' }, l: { name: '傳說', color: '#ffd400' } };
  const RAR_ORDER = { l: 0, r: 1, n: 2 };
  const SHARD = { n: 1, r: 4, l: 12 };   // 分解得到的碎片
  const CRAFT = { n: 6, r: 18, l: 48 };  // 合成要花的碎片
  const DROP_W = { rookie: [78, 20, 2], detective: [55, 37, 8], master: [32, 48, 20] }; // 普通／稀有／傳說
  const CARD_CATS = {
    money: { icon: '💰', name: '經費', color: '#ffd400' },
    time: { icon: '⏱️', name: '時間', color: '#2fbf5a' },
    intel: { icon: '🔍', name: '情報', color: '#3aa0ff' },
    ops: { icon: '🚨', name: '追捕', color: '#ff3b4e' },
    dep: { icon: '🚧', name: '部署', color: '#ff8a1f' },
    stealth: { icon: '🤫', name: '隱密', color: '#5fd0c8' },
  };
  const LEVEL = (arr) => (v) => (typeof v === 'number' ? arr[v] : arr.slice(1).join(' / '));
  const TIP_TXT = LEVEL(['', '立即得知他現在往哪個方向', '立即得知他現在在哪個縣市', '立即得知他現在的確切位置']);
  const PORT_TXT = LEVEL(['', '得知他最後從本島還是離島偷渡', '得知他最後從哪個縣市偷渡', '得知他最後的偷渡地點']);
  const cb = () => S.cb;
  // v：各稀有度的數值範圍 [最小, 最大]；step：數值的級距
  const CARD_FX = [
    { id: 'fund', cat: 'money', icon: '💵', name: '贓款充公', v: { n: [5, 15], r: [15, 30], l: [30, 50] }, desc: (v) => `行動經費立即 +${v} 萬`,
      use: (v) => { S.fund = r1(S.fund + v); return `行動經費 +${v} 萬`; } },
    { id: 'bounty', cat: 'money', icon: '💎', name: '懸賞加碼', step: 5, v: { n: [10, 20], r: [20, 35], l: [35, 60] }, desc: (v) => `本案抓到時賞金 +${v}%`,
      use: (v) => { cb().bounty = v; return `本案賞金 +${v}%`; } },
    { id: 'informant', cat: 'money', icon: '🕶️', name: '線民之友', step: 10, v: { n: [30, 40], r: [50, 70], l: [100, 100] }, desc: (v) => (v === 100 ? '本案線民全部免費' : `本案線民開價 −${v}%`),
      use: (v) => { cb().informant = v; return v === 100 ? '本案線民全部免費' : `線民開價 −${v}%`; } },
    { id: 'ticket', cat: 'money', icon: '🎫', name: '免費車票', v: { n: [2, 3], r: [4, 6], l: [10, 10] }, desc: (v) => `接下來 ${v} 段移動不用交通費`,
      use: (v) => { cb().ticket = v; return `接下來 ${v} 段移動免交通費`; } },
    { id: 'delay', cat: 'time', icon: '⛓️', name: '蛇頭落網', v: { n: [3, 5], r: [6, 10], l: [12, 18] }, desc: (v) => `偷渡出境時間延後 ${v} 小時`,
      use: (v) => { cutDeadline(-v); return `接應的蛇頭被抓，偷渡時間延後 ${v} 小時`; } },
    { id: 'express', cat: 'time', icon: '🚄', name: '專車接送', step: 10, v: { n: [20, 30], r: [40, 50], l: [60, 70] }, desc: (v) => `下一次移動的時間 −${v}%`,
      use: (v) => { cb().express = v; return `下一次移動時間 −${v}%`; } },
    { id: 'quick', cat: 'time', icon: '⚡', name: '調閱特權', v: { n: [2, 2], r: [3, 4], l: [6, 6] }, desc: (v) => `接下來 ${v} 次調查不花時間`,
      use: (v) => { cb().quick = v; return `接下來 ${v} 次調查不花時間`; } },
    { id: 'tip', cat: 'intel', icon: '📞', name: '線報直送', v: { n: [1, 1], r: [2, 2], l: [3, 3] }, desc: TIP_TXT, use: (v) => cardTip(v) },
    { id: 'port', cat: 'intel', icon: '🚢', name: '偷渡情報', v: { n: [1, 1], r: [2, 2], l: [3, 3] }, desc: PORT_TXT,
      can: () => (S.port ? '這個案子已經知道偷渡港口' : null), use: (v) => cardPort(v) },
    { id: 'extra', cat: 'intel', icon: '🤝', name: '人脈卡', v: { n: [1, 1], r: [2, 2], l: [3, 3] }, desc: (v) => `目前這一站可以多調查 ${v} 項`,
      use: (v) => { cb().extra = { loc: S.current, n: v }; return `${LOC[S.current].name}可以多調查 ${v} 項`; } },
    { id: 'truth', cat: 'intel', icon: '🔦', name: '測謊儀', v: { n: [1, 1], r: [2, 2], l: [3, 3] }, desc: (v) => `接下來 ${v} 次調查不會被假線索、說謊的人誤導`,
      use: (v) => { cb().truth = v; return `接下來 ${v} 次調查不會被誤導`; } },
    { id: 'strike', cat: 'ops', icon: '🛡️', name: '再給一次機會', v: { n: [1, 1], r: [1, 1], l: [2, 2] }, desc: (v) => `最後一站攻堅可以多失手 ${v} 次`,
      can: () => (isMission('hostage') ? '人質救援只有一次攻堅機會' : null), use: (v) => { cb().strike = v; return `攻堅可以多失手 ${v} 次`; } },
    { id: 'swat', cat: 'ops', icon: '🪖', name: '霹靂小組', v: { n: [5, 5], r: [8, 10], l: [15, 15] }, desc: (v) => `攻堅倒數多 ${v} 秒`,
      use: (v) => { cb().swat = v; return `攻堅倒數 +${v} 秒`; } },
    { id: 'sprint', cat: 'ops', icon: '👟', name: '運動飲料', v: { n: [1, 1], r: [2, 2], l: [3, 3] }, desc: (v) => `追捕時每回合多 ${v} 秒判斷`,
      use: (v) => { cb().sprint = v; return `追捕判斷時間 +${v} 秒`; } },
    { id: 'net', cat: 'ops', icon: '🕸️', name: '圍捕網', v: { n: [1, 1], r: [2, 2], l: [3, 3] }, desc: (v) => `追捕時有 ${v} 次追丟不算`,
      use: (v) => { cb().net = v; return `追捕時 ${v} 次追丟不算`; } },
    { id: 'sniff', cat: 'ops', icon: '🐕', name: '警犬隊', v: { n: [1, 1], r: [2, 2], l: [3, 3] }, desc: (v) => `攻堅時可疑地點少 ${v} 處`,
      use: (v) => { cb().sniff = v; return `攻堅時可疑地點少 ${v} 處`; } },
    { id: 'block', cat: 'dep', icon: '🚓', name: '警力支援', v: { n: [1, 1], r: [2, 2], l: [3, 3] }, desc: (v) => `封鎖令 +${v} 次`,
      use: (v) => { S.blocksLeft += v; return `封鎖令 +${v} 次`; } },
    { id: 'wall', cat: 'dep', icon: '🧱', name: '天羅地網', step: 5, v: { n: [60, 60], r: [75, 75], l: [90, 90] }, desc: (v) => `本案封鎖攔下他的機率提高到 ${v}%`,
      use: (v) => { cb().wall = v; return `封鎖攔截率提高到 ${v}%`; } },
    { id: 'hold', cat: 'dep', icon: '🪤', name: '線民絆住他', v: { n: [2, 4], r: [5, 8], l: [10, 14] }, desc: (v) => `讓他在目前的地方多耽擱 ${v} 小時`, use: (v) => cardHold(v) },
    { id: 'calm', cat: 'stealth', icon: '🤫', name: '放假消息', step: 5, v: { n: [10, 15], r: [20, 30], l: [40, 50] }, desc: (v) => `嫌犯警覺立即 −${v}%`,
      use: (v) => { S.alert = clamp(S.alert - v, 0, 100); return `嫌犯警覺 −${v}%`; } },
    { id: 'hush', cat: 'stealth', icon: '🤐', name: '保密協定', step: 5, v: { n: [20, 20], r: [35, 35], l: [50, 50] }, desc: (v) => `本案警覺上升的幅度 −${v}%`,
      use: (v) => { cb().hush = v; return `警覺上升幅度 −${v}%`; } },
    { id: 'drop', cat: 'money', icon: '🎁', name: '線人網絡', v: { n: [1, 1], r: [1, 1], l: [2, 2] }, desc: (v) => `本案抓到時多掉 ${v} 張卡牌`,
      use: (v) => { cb().drop = v; return `抓到時多掉 ${v} 張卡牌`; } },
    { id: 'xp', cat: 'money', icon: '🎖️', name: '表揚狀', step: 10, v: { n: [20, 30], r: [40, 60], l: [80, 100] }, desc: (v) => `本案經驗值 +${v}%`,
      use: (v) => { cb().xp = v; return `本案經驗值 +${v}%`; } },
  ];
  const FX = Object.fromEntries(CARD_FX.map((f) => [f.id, f]));
  // 逃犯的案由、側寫決定比較容易掉哪些卡
  const CRIME_FX = [
    [/運鈔|搶/, ['fund', 'bounty', 'swat', 'net']],
    [/擄人|勒贖|挾持/, ['calm', 'hush', 'hold', 'delay']],
    [/越獄/, ['strike', 'sprint', 'net']],
    [/詐騙|洗錢/, ['informant', 'fund', 'tip', 'extra']],
    [/珠寶|竊/, ['bounty', 'sniff', 'quick', 'truth']],
    [/走私/, ['port', 'ticket', 'delay', 'express']],
    [/文物/, ['port', 'tip', 'xp', 'truth']],
    [/肇事/, ['express', 'ticket', 'hold']],
    [/內線|掏空/, ['fund', 'bounty', 'informant', 'drop']],
    [/槍擊/, ['swat', 'sniff', 'strike', 'sprint']],
    [/集團/, ['block', 'wall', 'extra', 'drop']],
  ];
  const PROFILE_FX = { flyer: ['express', 'ticket', 'port'], local: ['hold', 'block', 'wall'], mountain: ['quick', 'extra'], nightowl: ['sprint', 'hold'], fox: ['truth', 'tip', 'calm'], jumpy: ['hush', 'calm', 'quick'] };
  const mr = (n) => Math.floor(Math.random() * n);
  const mw = (ws) => { let t = Math.random() * ws.reduce((a, b) => a + b, 0); for (let i = 0; i < ws.length; i++) { t -= ws[i]; if (t <= 0) return i; } return ws.length - 1; };
  const rollValue = (fx, rar) => { const [lo, hi] = fx.v[rar], st = fx.step || 1; return lo + mr(Math.floor((hi - lo) / st) + 1) * st; };
  const cardPool = (crime) => (CRIME_FX.find(([re]) => re.test(crime || '')) || [null, []])[1];
  function makeCard(fug, crime, prof, diffKey, minRar = null) {
    let rar = ['n', 'r', 'l'][mw(DROP_W[diffKey] || DROP_W.rookie)];
    if (minRar === 'r' && rar === 'n') rar = 'r';
    const a = cardPool(crime), b = PROFILE_FX[prof] || [];
    const r = Math.random();
    const list = r < 0.55 && a.length ? a : r < 0.8 && b.length ? b : CARD_FX.map((f) => f.id);
    const fx = FX[list[mr(list.length)]];
    return { id: Date.now().toString(36) + mr(1e6).toString(36), fx: fx.id, rar, v: rollValue(fx, rar),
      from: { name: fug.name, alias: fug.alias, avatar: fug.avatar, male: fug.male, crime: crime || '' }, at: Date.now() };
  }
  me.shards = me.shards || 0;
  // 已移除的卡（例如提神飲料）換成碎片
  me.cards = (me.cards || []).filter((c) => FX[c.fx] || ((me.shards += SHARD[c.rar] || 0), false));
  const sortCards = (a) => a.slice().sort((x, y) => RAR_ORDER[x.rar] - RAR_ORDER[y.rar] || CARD_FX.indexOf(FX[x.fx]) - CARD_FX.indexOf(FX[y.fx]) || y.v - x.v);
  // 加入牌庫；滿了就自動分解成碎片。回傳 true＝放進牌庫
  function addCard(c) {
    if (me.cards.length >= DECK_MAX) { me.shards += SHARD[c.rar]; return false; }
    me.cards.push(c); return true;
  }

  function cardHTML(c, extra = '') {
    const fx = FX[c.fx], cat = CARD_CATS[fx.cat], rr = RARITY[c.rar];
    const face = c.from && c.from.avatar ? faceOf(c.from, { mug: true }) : `<span class="emoji-face">${fx.icon}</span>`;
    return `<span class="gc-top"><span class="gc-rar">${rr.name}</span><span class="gc-cat">${cat.icon} ${cat.name}</span></span>
      <span class="gc-art"><span class="gc-face">${face}</span><span class="gc-ico">${fx.icon}</span></span>
      <b class="gc-name">${fx.name}</b><small class="gc-desc">${fx.desc(c.v)}</small>
      <span class="gc-from">${c.from ? `${c.from.name}「${c.from.alias}」${c.from.crime ? `・${c.from.crime}` : ''}` : '公會合成'}</span>${extra}`;
  }
  const cardStyle = (c) => `--c:${CARD_CATS[FX[c.fx].cat].color};--rc:${RARITY[c.rar].color}`;

  // ---- 立即生效的效果 ----
  function cardTip(v) {
    const F = S.fug, idx = F.idx, t = LOC[S.route[idx]];
    const moving = S.time < F.arrive[idx];
    const here = LOC[S.current];
    let text, zone = null;
    if (t.id === S.current) text = moving ? '他正在前往你現在的位置！' : '他就在你現在的位置附近！';
    else if (v >= 3) { text = `他${moving ? '正在前往' : '現在在'}「${t.name}」（${t.county}）。`; zone = { type: 'name', ch: t.name }; }
    else if (v === 2) { text = `他${moving ? '正在前往' : '現在在'}${t.county}。`; zone = { type: 'county', ch: t.county.slice(0, -1), suffix: t.county.slice(-1) }; }
    else { const brg = Math.round(bearing(here, t) / 45) * 45; text = `他${moving ? '正往' : '在'}你的${DIRS[(brg / 45) % 8]}方${moving ? '移動' : ''}。`; zone = { type: 'sector', brg: brg % 360, r: 700 }; }
    addNote('📞 卡牌・線報直送', text, true);
    if (zone) { (S.zones[S.current] ||= []).push(zone); refreshZones(); }
    return text;
  }
  function cardPort(v) {
    const t = LOC[S.route[lastIdx()]];
    const text = v >= 3 ? `他最後會從「${t.name}」（${t.county}）偷渡出境。` : v === 2 ? `他最後會從${t.county}一帶偷渡出境。` : `他最後會從${t.zone === 'main' ? '臺灣本島' : '離島'}偷渡出境。`;
    addNote('🚢 卡牌・偷渡情報', text, true);
    return text;
  }
  function cardHold(v) {
    const F = S.fug, i = F.idx;
    if (i >= lastIdx()) { cutDeadline(-Math.ceil(v / 2)); return `他已經在等船了，線民拖住蛇頭，偷渡時間延後 ${Math.ceil(v / 2)} 小時`; }
    if (S.time < F.arrive[i]) { F.arrive[i] += v; F.depart[i] += v; return `他在路上被耽擱，晚 ${v} 小時才會到下一站`; }
    F.depart[i] += v;
    return `他在目前的藏身處多待 ${v} 小時`;
  }

  // ---- 使用 ----
  function cardBlock(c) {
    if (!S || S.over) return '要在辦案中才能使用';
    if (S.free) return '新手教學不能用卡牌';
    if (busy || S.raiding || S.chase) return '攻堅、追捕、移動中不能用';
    if (S.cardsUsed[c.fx]) return '這個案子已經用過同效果的卡';
    return FX[c.fx].can ? FX[c.fx].can() : null;
  }
  function useCard(id) {
    const c = me.cards.find((x) => x.id === id);
    if (!c || cardBlock(c)) return;
    const fx = FX[c.fx];
    const msg = fx.use(c.v);
    me.cards = me.cards.filter((x) => x.id !== id);
    S.cardsUsed[c.fx] = true;
    (S.cardLog ||= []).push(`${fx.icon}${fx.name}`);
    saveMe();
    SFX.levelup();
    radio(`🃏 ${clock(S.time)}　使用卡牌「${fx.icon} ${fx.name}」（${RARITY[c.rar].name}）：${msg}`, 'hot');
    render();
    renderDeck();
  }

  // ---- 卡牌庫畫面 ----
  let dkTab = 'all', dkArmed = null, dkArmTimer = null;
  // 點第一下只把那張卡標成「待確認」，不重畫整個牌庫（避免所有卡重新跑進場動畫）
  function refreshArm() {
    document.querySelectorAll('#dk-grid [data-key]').forEach((b) => {
      const on = b.dataset.key === dkArmed;
      b.classList.toggle('armed', on);
      const t = b.querySelector('.gc-act, em');
      if (t) t.innerHTML = on ? b.dataset.confirm : b.dataset.idle;
    });
  }
  const arm = (key) => {
    dkArmed = key; clearTimeout(dkArmTimer); refreshArm();
    dkArmTimer = setTimeout(() => { dkArmed = null; refreshArm(); }, 3000);
  };
  const disarm = () => { dkArmed = null; clearTimeout(dkArmTimer); };
  function renderDeckHead() {
    const inCase = !!S && !S.over;
    const used = inCase && S.cardLog && S.cardLog.length ? `<div class="dk-used">本案已使用：${S.cardLog.join('、')}</div>` : '';
    $('#dk-head').innerHTML = `<div class="dk-stat"><small>持有</small><b>${me.cards.length}</b><em>/ ${DECK_MAX}</em></div>
      <div class="dk-stat"><small>碎片</small><b>💠 ${me.shards}</b></div>
      <p class="dk-rule">${inCase ? (S.free ? '⚠️ 新手教學不能用卡牌。' : '點卡牌兩下使用。<b>同一種效果每個案子只能用一張</b>，用了就永久消失。') : '辦案時按「使用卡牌」打開來用。牌庫最多 30 張，滿了新卡會自動分解成碎片；不要的卡可以點兩下分解，碎片可以合成指定的卡。'}</p>${used}`;
    const tabs = [['all', { icon: '🃏', name: '全部', color: '#f4f2ec' }], ...Object.entries(CARD_CATS), ['craft', { icon: '💠', name: '合成', color: '#c084ff' }]];
    $('#dk-tabs').innerHTML = tabs.map(([k, c]) => {
      const n = k === 'all' ? me.cards.length : k === 'craft' ? '' : me.cards.filter((x) => FX[x.fx].cat === k).length;
      return `<button data-k="${k}" class="${dkTab === k ? 'on' : ''}" style="--c:${c.color}">${c.icon} ${c.name}${n !== '' ? `<small>${n}</small>` : ''}</button>`;
    }).join('');
    $('#dk-tabs').querySelectorAll('button').forEach((b) => { b.onclick = () => { if (dkTab === b.dataset.k) return; dkTab = b.dataset.k; disarm(); SFX.click(); renderDeck(); }; });
  }
  function renderDeck() {
    if ($('#deck').hidden) return;
    const inCase = !!S && !S.over;
    renderDeckHead();
    const box = $('#dk-grid');
    box.innerHTML = '';
    box.classList.toggle('craft', dkTab === 'craft');
    if (dkTab === 'craft') { renderCraft(box); return; }
    const list = sortCards(me.cards.filter((c) => dkTab === 'all' || FX[c.fx].cat === dkTab));
    if (!list.length) { box.innerHTML = `<p class="dk-empty">${me.cards.length ? '這一類還沒有卡牌。' : '還沒有卡牌。逮捕逃犯就會拿到他的卡牌！'}</p>`; return; }
    list.forEach((c, i) => {
      const b = document.createElement('button');
      const block = inCase ? cardBlock(c) : null;
      b.className = `gcard r-${c.rar}${inCase && block ? ' off' : ''}`;
      b.style.cssText = cardStyle(c) + `;--i:${i}`;
      if (!block) {
        b.dataset.key = c.id;
        b.dataset.idle = inCase ? '▶ 使用' : `分解 +${SHARD[c.rar]} 💠`;
        b.dataset.confirm = inCase ? '再按一次確認使用' : `再按一次確認分解（+${SHARD[c.rar]} 💠）`;
      }
      b.innerHTML = cardHTML(c, `<span class="gc-act">${block ? `🚫 ${block}` : b.dataset.idle}</span>`);
      b.onclick = () => {
        if (block) { SFX.alarm(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; }
        if (dkArmed !== c.id) { arm(c.id); SFX.click(); return; }
        disarm();
        if (inCase) { useCard(c.id); closeDeck(); return; }
        // 分解：只把這張卡淡出移除，其他卡不重畫
        me.cards = me.cards.filter((x) => x.id !== c.id); me.shards += SHARD[c.rar]; saveMe(); SFX.cash(); refreshTitle();
        renderDeckHead();
        b.classList.add('gone-out'); b.disabled = true;
        setTimeout(() => { b.remove(); if (!box.querySelector('.gcard')) renderDeck(); }, 260);
      };
      box.appendChild(b);
    });
  }
  function renderCraft(box) {
    CARD_FX.forEach((fx, i) => {
      const cat = CARD_CATS[fx.cat];
      const row = document.createElement('div');
      row.className = 'cr-row';
      row.style.cssText = `--c:${cat.color};--i:${i}`;
      row.innerHTML = `<span class="cr-ico">${fx.icon}</span><span class="cr-txt"><b>${fx.name}</b><small>${cat.icon} ${cat.name}</small></span><span class="cr-btns"></span>`;
      ['n', 'r', 'l'].forEach((rar) => {
        const key = `${fx.id}:${rar}`, [lo, hi] = fx.v[rar];
        const b = document.createElement('button');
        b.className = `cr-btn r-${rar}${me.shards >= CRAFT[rar] ? '' : ' off'}`;
        b.style.setProperty('--rc', RARITY[rar].color);
        b.dataset.key = key; b.dataset.idle = `💠 ${CRAFT[rar]}`; b.dataset.confirm = '再按一次確認';
        b.innerHTML = `<i>${RARITY[rar].name}</i><span>${fx.desc(lo === hi ? lo : `${lo}～${hi}`)}</span><em>${b.dataset.idle}</em>`;
        b.onclick = () => {
          if (me.shards < CRAFT[rar]) { SFX.alarm(); return; }
          if (dkArmed !== key) { arm(key); SFX.click(); return; }
          disarm();
          if (me.cards.length >= DECK_MAX) { SFX.alarm(); refreshArm(); showToastDeck('牌庫滿了，先用掉或分解幾張'); return; }
          me.shards -= CRAFT[rar];
          me.cards.push({ id: Date.now().toString(36) + mr(1e6).toString(36), fx: fx.id, rar, v: rollValue(fx, rar), from: null, at: Date.now() });
          saveMe(); SFX.levelup(); dkTab = 'all'; renderDeck(); refreshTitle();
        };
        row.querySelector('.cr-btns').appendChild(b);
      });
      box.appendChild(row);
    });
  }
  function showToastDeck(t) { const el = $('#dk-head .dk-rule'); if (el) { el.textContent = '⚠️ ' + t; el.classList.add('warn'); } }
  function openDeck() { disarm(); $('#deck').hidden = false; renderDeck(); }
  function closeDeck() { $('#deck').hidden = true; refreshTitle(); }
  // 辦案畫面的大卡牌按鈕（電腦：右側面板；手機：地圖右下角的浮動按鈕）
  // 有卡、這案還沒用過時會發光提醒新手
  function renderCardCta(lock) {
    const n = me.cards.length, used = (S.cardLog || []).length;
    const sub = S.free ? '新手教學不能用' : !n ? '' : used ? `持有 ${n} 張・本案已用 ${used} 張` : `持有 ${n} 張・點開來使用`;
    const glow = !!n && !used && !S.free && !S.over;
    const btn = $('#card-btn');
    btn.innerHTML = `${CARD_ART()}<span class="cc-txt"><b>使用卡牌</b>${sub ? `<small>${sub}</small>` : ''}</span>${n ? `<em class="cc-badge">${n}</em>` : ''}<i class="cc-go">›</i>`;
    btn.classList.toggle('glow', glow);
    btn.disabled = S.over;
    const fab = $('#card-fab');
    fab.innerHTML = `${CARD_ART()}<b>卡牌</b>${n ? `<em class="cc-badge">${n}</em>` : ''}`;
    fab.classList.toggle('glow', glow);
    fab.hidden = S.over || !$('#trip').hidden || !!S.raiding || !!S.chase;
    void lock;
  }
  // 結案掉卡：一般案件一張（宿敵至少稀有），集團每抓到一人一張，「線人網絡」多掉幾張
  function dropCards() {
    if (!S.won || S.free || S.mode === 'tutorial') return [];
    const got = [];
    if (S.gang) S.gang.members.slice(0, S.gang.caught.length).forEach((m, i) => got.push(makeCard(m.fugitive, '犯罪集團', m.profile.id, i === S.gang.members.length - 1 ? S.diffKey : 'rookie')));
    else got.push(makeCard(S.fugitive, S.caseFile.crime, S.profile.id, S.diffKey, S.nemesis ? 'r' : null));
    for (let k = 0; k < (S.cb.drop || 0); k++) got.push(makeCard(S.fugitive, S.caseFile.crime, S.profile.id, S.diffKey));
    return got.map((c) => ({ c, kept: addCard(c) }));
  }
  function dropHTML(list) {
    if (!list.length) return '';
    const lost = list.filter((x) => !x.kept);
    return `<div class="card-drop"><p>🃏 查扣到 ${list.length} 張卡牌，已放進卡牌庫${lost.length ? `（牌庫已滿，${lost.length} 張自動分解成 💠 ${lost.reduce((a, x) => a + SHARD[x.c.rar], 0)} 碎片）` : ''}</p>
      <div class="cd-row">${list.map((x, i) => `<div class="gcard mini r-${x.c.rar}${x.kept ? '' : ' gone'}" style="${cardStyle(x.c)};--i:${i}">${cardHTML(x.c)}</div>`).join('')}</div></div>`;
  }

  // ---------- 新手教學（前輩引導） ----------
  const TUT_KEY = 'roc-chase-tutorial';
  const usedAt = (k) => S.used[S.route[k]] || [];
  const atStage = (k) => S.stage >= k && S.current === S.route[S.stage];
  const tName = (k) => LOC[S.route[k]].name;
  const invSel = (key) => (isMobile() ? `#hotbar [data-inv="${key}"]` : `#actions [data-inv="${key}"]`);
  const TUT = [
    { text: () => `歡迎入行，菜鳥獵人！我是帶你入門的前輩。<br>通緝犯${S.fugitive.name}剛從<b>${tName(0)}</b>逃走，我們一步一步把他抓回來領賞金。`, next: true },
    { text: '上方是<b>現在時間</b>、<b>距偷渡出境</b>的剩餘時間，和<b>嫌犯警覺</b>。<br>調查、移動都會花時間；時間歸零他就逃出國了。', target: () => '.hud', next: true },
    { text: () => `你現在在<b>${tName(0)}</b>。到了一個地方，第一件事就是<b>調查</b>。<br>👉 點「🗣️ 詢問目擊者」。`, target: () => invSel('witness'), done: () => usedAt(0).includes('witness') || S.stage > 0 },
    { text: '目擊者告訴你他想去的地方，線索會記在📒<b>辦案筆記</b>。地圖上的<b>紅色圓圈</b>是「包圍網」：他可能去的範圍。<br>👉 再點「📱 調閱通聯紀錄」。', target: () => invSel('phone'), done: () => usedAt(0).includes('phone') || S.stage > 0 },
    { text: '<b>金色扇形</b>是手機訊號的方向。<br>同時落在圓圈和扇形裡的地點會<b>放大閃紅光🎯</b>——那就是最可疑的地方。<br>👉 最後點「🕶️ 聯絡線民」確認。', target: () => invSel('informant'), done: () => usedAt(0).includes('informant') || S.stage > 0 },
    { text: () => `每一站能調查的次數有限（🔍），這站用完了。<br>線索都指向<b>${tName(1)}</b>！👉 在地圖上點閃紅光的「${tName(1)}」。`, target: () => null, done: () => selected === S.route[1] || S.stage >= 1 },
    { text: '這裡會顯示交通方式和要花的時間。<br>👉 按「🚀 出發」！', target: () => (isMobile() ? '#m-go' : '#go-btn'), done: () => atStage(1) },
    { text: () => `抵達${tName(1)}！每到新的一站，都要<b>重新調查</b>。<br>👉 先「🗣️ 詢問目擊者」看看他還在不在。`, target: () => invSel('witness'), done: () => usedAt(1).length > 0 || S.stage >= 2 },
    { text: () => `看${isMobile() ? '左上角' : '「📍 目前位置」'}：<b>👣 他已經離開了</b>，你晚了一步。<br>👉 用剩下的調查找出他的下一站，選定後出發。<br>（提示：詢問目擊者、聯絡線民最能看出他去哪）`, target: () => (isMobile() ? '#chip' : '#status'), done: () => atStage(2) },
    { text: () => `🚨 他就躲在<b>${tName(2)}</b>！這是最後一站，他在等偷渡的船。<br>攻堅前要先知道他<b>躲在哪種地方</b>。👉 點「📹 調閱監視器」取得藏身處線索。`, target: () => invSel('camera'), done: () => usedAt(2).length > 0 || !!S.raiding || S.over },
    { text: '筆記裡寫著他藏身處的特徵，記住它！<br>👉 按「⚖️ 申請搜索票」攻堅。', target: () => (isMobile() ? '#hb-raid' : '#raid-btn'), done: () => !!S.raiding || S.over },
    { text: () => `<b>監視器比對</b>：找出<b>同時</b>符合海報兩個特徵的人——「${S.fugitive.traits.join('」＋「')}」。<br>比對成功，可疑地點會從 4 處縮小到 2 處。`, target: () => '#cctv-grid', done: () => $('#cctv').hidden || S.over },
    { text: '地圖上標出了可疑地點。對照筆記裡的藏身處線索，<br>👉 在倒數結束前點一個地點<b>攻堅</b>！', done: () => S.over || !!S.chase },
    { text: '🏃 他破窗逃跑了！<b>看清楚狀況，判斷他往哪裡跑</b>：線索都藏在描述裡（腳印、聲音、目擊者、破綻）。<br>👉 追對拉近距離、追錯拉開距離，<b>距離歸零就抓到他</b>；正式案件距離超過上限他就跑了，案件失敗！', target: () => '#chase-opts', done: () => S.over },
    { text: () => (S.won
      ? '🎉 <b>破案了！教學完成。</b><br>你學會了：調查 → 看包圍網 → 追到下一站 → 最後一站查藏身處、攻堅、追捕。<br>正式案件還有<b>🚧 封鎖</b>（擋住他的去路）和<b>⏳ 埋伏</b>（在原地等他出現），去懸賞看板挑一個 <b>★ 小咖</b>試試看吧！'
      : '可惜讓他跑了！沒關係，教學可以再玩一次。<br>記得：最後一站先查藏身處線索，攻堅時對照筆記挑地點。'), next: '完成教學', final: true },
  ];
  let tut = null, tutHl = null;

  function tutTick() {
    if (!tut || !S || S.mode !== 'tutorial') return;
    while (tut.i < TUT.length - 1 && TUT[tut.i].done && TUT[tut.i].done()) tut.i++;
    if (S.over) tut.i = TUT.length - 1;
    const step = TUT[tut.i];
    let text = typeof step.text === 'function' ? step.text() : step.text;
    let target = step.target ? step.target() : null;
    // 走錯地方：提醒回去
    if (!S.over && !busy && !S.raiding && tut.i >= 6 && trackState() === 'off') {
      text = `❌ ${LOC[S.current].name}沒有他的足跡，走錯地方了。<br>👉 回到<b>${LOC[S.route[S.stage]].name}</b>，照筆記裡的線索重新判斷。`;
      target = null;
    }
    const box = $('#coach');
    box.hidden = false;
    box.classList.toggle('final', !!step.final);
    $('#coach-step').textContent = step.final ? '' : `${tut.i + 1} / ${TUT.length - 1}`;
    const ct = $('#coach-text');
    if (ct.dataset.html !== text) { ct.innerHTML = text; ct.dataset.html = text; }
    const nb = $('#coach-next');
    nb.hidden = !step.next;
    nb.textContent = step.next === true ? '下一步 ▶' : step.next || '';
    const el = target ? document.querySelector(target) : null;
    if (tutHl && tutHl !== el) tutHl.classList.remove('tut-hl');
    tutHl = el;
    if (el) el.classList.add('tut-hl');
  }

  function endTutorial() {
    tut = null;
    $('#coach').hidden = true;
    if (tutHl) tutHl.classList.remove('tut-hl');
    tutHl = null;
  }

  // ---------- 啟動 ----------
  function careerText() {
    const st = store.get('roc-chase-stats', { solved: 0 });
    const pts = skillPoints();
    return `獵人等級：${rankName()}　已逮捕 ${st.solved} 名・${me.money < 0 ? `⚠️ 負債 ${-me.money} 萬` : `存款 ${me.money} 萬`}${me.probation ? `　⚖️ 保護管束中・剩 ${me.probation} 張` : ''}${pts > 0 ? `　🎖️ 有 ${pts} 個技能點可用！` : ''}`;
  }

  function refreshTitle() {
    $('#career').textContent = careerText();
    const pts = skillPoints();
    $('#mode-profile').innerHTML = `<b>🎖️ 獵人檔案</b><small>${pts > 0 ? `有 ${pts} 個技能點可用！` : `已學會 ${me.skills.length} / ${SKILLS.length} 項技能`}</small>`;
    $('#mode-profile').classList.toggle('glow', pts > 0);
    $('#mode-deck').innerHTML = `<b>🃏 卡牌庫</b><small>${me.cards.length ? `持有 ${me.cards.length} / ${DECK_MAX} 張・💠 ${me.shards}` : '逮捕的逃犯會變成卡牌'}</small>`;
    const tdone = store.get(TUT_KEY, false);
    $('#mode-tutorial').innerHTML = `<b>🎓 新手教學</b><small>${tdone ? '已完成・想複習可以再玩一次' : '第一次玩？前輩帶你一步步學會追緝（約 5 分鐘）'}</small>`;
    $('#mode-tutorial').classList.toggle('glow', !tdone);
    // 教學完成後移到選單最下面（特別任務之後），沒完成就放最上面
    const tb = $('#mode-tutorial');
    tb.classList.toggle('done', !!tdone);
    if (tdone) $('.tp-menu .modes').after(tb);
    else $('.tp-menu .tp-file').after(tb);
  }

  function boot() {
    map = new GameMap($('#map'));
    LOCATIONS.forEach((l) => { markers[l.id] = map.addMarker(l, () => select(l.id)); });
    refreshMarkers();
    refreshTitle();
    pulseLoop();
    // 測試版專用：重新生成懸賞看板（正式版不會出現）
    if (STG) {
      const btn = document.createElement('button');
      btn.id = 'dev-reroll';
      btn.className = 'btn dev-reroll';
      btn.textContent = '🔧 重新生成看板（測試版）';
      btn.onclick = () => {
        SFX.click();
        const no = round ? round.no : 1;
        newRound();
        round.no = no;
        saveRound();
        renderBoard();
        refreshTitle();
      };
      $('#board-round').parentElement.appendChild(btn);
    }

    renderBoard();
    if (roundDone()) settleRound();
    $('#rd-close').onclick = () => { SFX.click(); $('#round').hidden = true; renderBoard(); };
    $('#mode-tutorial').onclick = () => { SFX.click(); showPoster(null, 'tutorial'); };
    $('#coach-next').onclick = () => {
      SFX.click();
      if (!tut) return;
      if (TUT[tut.i].final) { endTutorial(); return; }
      tut.i++; tutTick();
    };
    $('#coach-skip').onclick = () => { SFX.click(); endTutorial(); };
    $('#mode-profile').onclick = () => { SFX.click(); renderProfile(); $('#profile').hidden = false; };
    $('#pf-close').onclick = () => { $('#profile').hidden = true; refreshTitle(); };
    $('#mode-deck').onclick = () => { SFX.click(); openDeck(); };
    $('#card-btn').onclick = () => { SFX.click(); openDeck(); };
    $('#card-fab').onclick = () => { SFX.click(); openDeck(); };
    $('#dk-close').onclick = () => { SFX.click(); closeDeck(); };
    $('#accept').onclick = () => { $('#poster').hidden = true; SFX.siren(); startCase(pending); };

    $('#back').onclick = () => { $('#poster').hidden = true; $('#start').hidden = false; R = Math.random; };
    $('#raid-btn').onclick = requestRaid;
    $('#wait-btn').onclick = wait;
    $('#block-here').onclick = () => S && blockade(S.current);
    $('#again').onclick = () => {
      $('#end').hidden = true; map.clearRaid(); map.clearZones(); map.fitAll();
      endTutorial();
      hot = new Set(); refreshMarkers();
      refreshTitle();
      renderBoard();
      $('#start').hidden = false;
      if (roundDone()) setTimeout(settleRound, 400);
    };
    $('#help-btn').onclick = () => { $('#help').hidden = false; };
    $('#help-close').onclick = () => { $('#help').hidden = true; };
    $('#cctv-peek').onclick = cctvPeek;
    $('#cctv-skip').onclick = () => { $('#cctv').hidden = true; radio('📹 放棄比對監視器，直接從 4 處可疑地點中攻堅！', 'hot'); tutTick(); };
    // 手機版控制
    document.querySelectorAll('#hotbar [data-inv]').forEach((b) => { b.onclick = () => investigate(b.dataset.inv); });
    $('#hb-raid').onclick = requestRaid;
    $('#hb-notes').onclick = () => openDrawer('notes');
    $('#hb-wait').onclick = wait;
    $('#hb-loot').onclick = () => searchLoot();
    $('#loot-btn').onclick = () => searchLoot();
    $('#hb-block').onclick = () => { if (S) blockade(S.current); };
    $('#hb-log').onclick = () => openDrawer('log');
    $('#ticker').onclick = () => openDrawer('log');
    $('#bubble').onclick = () => { $('#bubble').hidden = true; };
    $('#drawer-bg').onclick = closeDrawer;
    $('#drawer-close').onclick = closeDrawer;
    $('#drawer-help').onclick = () => { closeDrawer(); $('#help').hidden = false; };
    document.querySelectorAll('.drawer-head [data-tab]').forEach((b) => { b.onclick = () => openDrawer(b.dataset.tab); });
    // 抽屜往下滑關閉
    let y0 = null;
    $('#drawer-head').addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    $('#drawer-head').addEventListener('touchend', (e) => {
      if (y0 !== null && e.changedTouches[0].clientY - y0 > 60) closeDrawer();
      y0 = null;
    });
    mq.addEventListener('change', () => { closeDrawer(); render(); });

    const mb = $('#mute-btn');
    mb.innerHTML = ICON(Sound.muted ? 'mute' : 'sound');
    mb.onclick = () => { mb.innerHTML = ICON(Sound.toggle() ? 'mute' : 'sound'); };
    document.querySelectorAll('[data-ico]').forEach((el) => { el.innerHTML = ICON(el.dataset.ico); });
  }

  // ---------- 自動更新：發現線上有新版時，在不打斷案件的時機重新整理 ----------
  // 版本號＝index.html 裡 game.js 的 ?v=N；每次更新都會調整，拿來比對最準
  const verOf = (html) => (html.match(/js\/game\.js\?v=([\w.-]+)/) || [])[1] || null;
  const MY_VER = verOf(document.documentElement.innerHTML);
  let updateReady = false;
  // 沒有進行中的案件、停在開始畫面時才算安全，可以直接重新整理
  const safeToReload = () => (!S || S.over) && !$('#start').hidden && $('#round').hidden && $('#poster').hidden;
  function applyUpdate() {
    try { sessionStorage.setItem('roc-chase-updated', '1'); } catch { /* 略過 */ }
    location.reload();
  }
  async function checkUpdate() {
    if (updateReady || !MY_VER) return;
    try {
      const res = await fetch(location.pathname + '?_=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const v = verOf(await res.text());
      if (!v || v === MY_VER) return;
    } catch { return; }
    updateReady = true;
    if (safeToReload()) { applyUpdate(); return; }
    $('#update-bar').hidden = false; // 案件進行中：先提示，這局結束回到看板時再更新
  }
  function bootUpdater() {
    try { if (sessionStorage.getItem('roc-chase-updated')) { sessionStorage.removeItem('roc-chase-updated'); $('#update-done').hidden = false; setTimeout(() => { $('#update-done').hidden = true; }, 4000); } } catch { /* 略過 */ }
    $('#update-now').onclick = applyUpdate;
    setInterval(checkUpdate, 3 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(); });
    // 回到開始畫面（結案後按「接下一個案子」、關掉海報、看完結算）就套用新版
    new MutationObserver(() => { if (updateReady && safeToReload()) applyUpdate(); })
      .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  }

  boot();
  bootUpdater();
})();
