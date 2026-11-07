/* 通緝犯頭像產生器：日系 Q 版，男女、老中少、高矮胖瘦、誇張表情，依種子固定長相（純 SVG，不需圖檔） */
(function (g) {
  let UID = 0;
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const shade = (hex, p) => {
    const n = parseInt(hex.slice(1), 16); const f = p < 0 ? 0 : 255; const t = Math.abs(p);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round((f - v) * t + v));
    return '#' + ((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1);
  };
  const mirror = (s) => `<g transform="matrix(-1 0 0 1 200 0)">${s}</g>`;
  const scaleX = (k, s) => (Math.abs(k - 1) < 0.001 ? s : `<g transform="matrix(${k.toFixed(3)} 0 0 1 ${(100 - 100 * k).toFixed(2)} 0)">${s}</g>`);
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- 調色盤（偏柔和的日系配色）----------
  const HAIR_FUN = [['粉紅', '#ffb3c9'], ['銀白', '#dfe3ee'], ['天藍', '#8ec5ff'], ['薰衣草', '#b9a2f0'], ['櫻紅', '#f2707e'], ['薄荷', '#8fe0cc'], ['蜜橘', '#ffb070'], ['奶金', '#ffe08f']];
  const HAIR_NAT = [['黑', '#3a3646'], ['栗棕', '#94603f'], ['深棕', '#5c4033'], ['黑紫', '#4a3a66'], ['亞麻', '#d9b98a']];
  const HAIR_OLD = [['灰白', '#c8c8d0'], ['雪白', '#f4f4f7'], ['灰黑', '#6b6b76']];
  const EYES = [['紅', '#e8404f'], ['金', '#f0a820'], ['紫', '#9a5cf0'], ['青', '#1fbfd0'], ['綠', '#3fbf6a'], ['粉', '#f668a8'], ['藍', '#4a7ff0'], ['琥珀', '#c07a3a']];
  const SKIN = ['#fff0e6', '#ffe8da', '#fde0cc', '#f6d0b4', '#e2b08a'];
  const CLOTH = ['#2c2d38', '#4a4f6a', '#9a3040', '#3f6a54', '#e8e8ee', '#6e52a0', '#d9a040', '#2f5a9a', '#a07a5a', '#ff8fa8'];

  // ---------- 表情 ----------
  const EXPR = {
    smug: { n: '得意', b: ['up', 'flat'], e: 'half', m: 'smirk' },
    rage: { n: '暴怒', b: ['rage', 'rage'], e: 'small', m: 'shout', fx: ['vein', 'puff'] },
    maniac: { n: '癲狂', b: ['high', 'high'], e: 'small', m: 'evil', fx: ['shadow', 'sweat'] },
    crying: { n: '大哭', b: ['worry', 'worry'], e: 'cry', m: 'wail', fx: ['tears'] },
    shocked: { n: '驚嚇', b: ['high', 'high'], e: 'blank', m: 'O', fx: ['gloom', 'sweat'] },
    laugh: { n: '狂笑', b: ['up', 'up'], e: 'happy', m: 'D' },
    panic: { n: '慌張', b: ['worry', 'worry'], e: 'swirl', m: 'wavy', fx: ['sweat'] },
    xx: { n: '氣噗噗', b: ['angry', 'angry'], e: 'xx', m: 'tri', fx: ['puff'] },
    deadpan: { n: '無言', b: ['flat', 'flat'], e: 'dot', m: 'flat', fx: ['sweat'] },
    playful: { n: '挑釁', b: ['up', 'calm'], e: 'normal', m: 'tongue', wink: true },
    sinister: { n: '陰笑', b: ['angry', 'angry'], e: 'glow', m: 'evil', fx: ['shadow'] },
    money: { n: '見錢眼開', b: ['up', 'up'], e: 'money', m: 'D', fx: ['sparkle'] },
    sneer: { n: '輕蔑', b: ['angry', 'high'], e: 'half', m: 'sneer' },
  };
  const BROW = { // [外端 dx,dy] [中段] [內端]（相對眼睛中心，dx 正值朝外側）
    calm: [[10, -20], [1, -24], [-9, -21]], up: [[10, -19], [1, -27], [-9, -23]], high: [[10, -25], [1, -32], [-9, -28]],
    angry: [[10, -25], [1, -23], [-9, -17]], rage: [[12, -28], [1, -24], [-10, -14]], worry: [[10, -18], [1, -21], [-9, -27]], flat: [[10, -21], [1, -21], [-9, -21]],
  };

  // ---------- 嘴巴（中心約 100,128）----------
  const RED = '#8a2c3c'; const TONGUE = '#ff8a9a';
  const MOUTH = {
    smirk: (L) => `<path d="M95,129 Q101,132 106,125.5" fill="none" stroke="${L}" stroke-width="1.7" stroke-linecap="round"/>`,
    cat: (L) => `<path d="M92,127 Q96,131 100,127 Q104,131 108,127" fill="none" stroke="${L}" stroke-width="1.6" stroke-linecap="round"/>`,
    D: (L) => `<path d="M91,124.5 L109,124.5 Q109,139 100,139 Q91,139 91,124.5Z" fill="${RED}" stroke="${L}" stroke-width="1.4" stroke-linejoin="round"/><path d="M94,134.5 Q100,130.5 106,134.5 Q104,139 100,139 Q96,139 94,134.5Z" fill="${TONGUE}"/>`,
    shout: (L) => `<path d="M87,123 L113,123 L109.5,139.5 Q100,142.5 90.5,139.5Z" fill="${RED}" stroke="${L}" stroke-width="1.4" stroke-linejoin="round"/><path d="M88,123.6 L112,123.6 L111.2,127.4 L88.8,127.4Z M90.5,139 L91.4,135.6 L108.6,135.6 L109.5,139Z" fill="#fff"/><path d="M95,136.5 Q100,133.5 105,136.5" fill="${TONGUE}"/>`,
    O: (L) => `<ellipse cx="100" cy="131" rx="4.6" ry="6.2" fill="${RED}" stroke="${L}" stroke-width="1.4"/><ellipse cx="100" cy="134.6" rx="2.6" ry="2" fill="${TONGUE}"/>`,
    wail: (L) => `<path d="M89,125 Q100,122 111,125 Q109,139 100,139 Q91,139 89,125Z" fill="${RED}" stroke="${L}" stroke-width="1.4" stroke-linejoin="round"/><path d="M89.5,125.5 q2.6,2 5.2,0 q2.6,-2 5.2,0 q2.6,2 5.2,0 q2.6,-2 5.2,0" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M94,135 Q100,131.5 106,135 Q104,139 100,139 Q96,139 94,135Z" fill="${TONGUE}"/>`,
    wavy: (L) => `<path d="M90,129 l3.4,-2.6 l3.3,2.6 l3.3,-2.6 l3.3,2.6 l3.3,-2.6 l3.4,2.6" fill="none" stroke="${L}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`,
    tri: (L) => `<path d="M94,125.5 L106,125.5 L100,134Z" fill="${RED}" stroke="${L}" stroke-width="1.4" stroke-linejoin="round"/>`,
    flat: (L) => `<path d="M96,129 L104,129" stroke="${L}" stroke-width="1.7" stroke-linecap="round"/>`,
    tongue: (L) => `<path d="M101,128.6 Q100.6,136 105,135.4 Q107.6,131.6 105.6,128Z" fill="${TONGUE}" stroke="${L}" stroke-width="1.1"/><path d="M93,127 Q100,131.5 107,126.5" fill="none" stroke="${L}" stroke-width="1.6" stroke-linecap="round"/>`,
    evil: (L) => `<path d="M83,122 Q100,130 117,120 Q110,141 100,141 Q89,141 83,122Z" fill="${RED}" stroke="${L}" stroke-width="1.4" stroke-linejoin="round"/><path d="M84.4,122.8 Q100,130.8 115.6,121 L114,125.4 L111,123.6 L108.6,127.4 L105,125.6 L102.4,129 L99,127 L96.4,129 L93.6,126 L90.6,127.8 L88.6,124.4 L86,125.4Z" fill="#fff"/>`,
    sneer: (L) => `<path d="M93,130.5 Q99,130.5 107,124.5" fill="none" stroke="${L}" stroke-width="1.7" stroke-linecap="round"/><path d="M101.6,128.6 L103.2,132.4 L105,127.6Z" fill="#fff" stroke="${L}" stroke-width=".7"/>`,
  };

  // ---------- 髮型 ----------
  const DOME = 'M44,104 C38,44 66,22 100,22 C134,22 162,44 156,104';
  const BACK = {
    long: 'M43,90 C34,140 40,178 32,202 L168,202 C160,178 166,140 157,90 C158,40 42,40 43,90Z',
    bob: 'M41,92 C37,126 42,150 56,156 Q64,150 70,146 L130,146 Q136,150 144,156 C158,150 163,126 159,92 C160,36 40,36 41,92Z',
    pony: 'M46,92 C44,120 50,134 60,138 L140,138 C150,134 156,120 154,92 C156,36 44,36 46,92Z M134,36 C186,40 188,110 170,160 C166,172 154,174 156,160 C170,118 164,72 132,58Z',
    twin: 'M46,92 C44,120 50,134 60,138 L140,138 C150,134 156,120 154,92 C156,36 44,36 46,92Z M50,46 C16,52 6,110 18,160 C22,176 34,180 38,168 C30,130 36,86 58,64Z M150,46 C184,52 194,110 182,160 C178,176 166,180 162,168 C170,130 164,86 142,64Z',
    bun: 'M46,92 C44,120 50,134 60,138 L140,138 C150,134 156,120 154,92 C156,36 44,36 46,92Z M78,24 C78,-2 122,-2 122,24 C122,34 78,34 78,24Z',
    short: 'M46,92 C44,120 50,134 60,138 L140,138 C150,134 156,120 154,92 C156,36 44,36 46,92Z',
    none: '',
  };
  // 瀏海：V 為髮縫（右→左），T 為髮尖
  const BANGS = {
    soft: { V: [[156, 104], [140, 70], [122, 64], [102, 62], [82, 64], [62, 70], [44, 104]], T: [[149, 97], [132, 87], [113, 91], [92, 91], [71, 87], [51, 97]] },
    swept: { V: [[156, 104], [142, 66], [124, 58], [104, 56], [84, 60], [64, 68], [44, 104]], T: [[151, 93], [129, 88], [107, 92], [85, 95], [63, 97], [49, 102]] },
    center: { V: [[156, 104], [140, 68], [118, 56], [100, 46], [82, 56], [60, 68], [44, 104]], T: [[150, 97], [131, 90], [111, 79], [89, 79], [69, 90], [50, 97]] },
    hime: { V: [[156, 104], [146, 80], [132, 80], [118, 80], [104, 80], [90, 80], [76, 80], [62, 80], [50, 80], [44, 104]], T: [[152, 97], [139, 90], [125, 90], [111, 90], [97, 90], [83, 90], [69, 90], [56, 90], [47, 98]] },
    cover: { V: [[156, 104], [140, 68], [120, 60], [102, 58], [60, 66], [44, 104]], T: [[148, 94], [130, 88], [112, 90], [80, 126], [50, 100]] },
    mshort: { V: [[156, 100], [142, 66], [122, 58], [100, 56], [78, 58], [58, 66], [44, 100]], T: [[150, 88], [132, 79], [111, 81], [89, 81], [68, 79], [50, 88]] },
    mmessy: { V: [[156, 100], [146, 70], [132, 60], [116, 62], [100, 54], [84, 62], [68, 60], [54, 70], [44, 100]], T: [[152, 87], [140, 81], [124, 77], [108, 81], [92, 75], [76, 81], [61, 79], [48, 89]] },
  };
  const bangsPath = ({ V, T }) => {
    let d = `M${V[V.length - 1]} ${DOME.replace(/^M44,104/, 'M44,104')}`.replace(/^M[\d.,]+ /, '');
    d = DOME;
    for (let i = 0; i < T.length; i++) {
      const [ax, ay] = V[i]; const [tx, ty] = T[i]; const [bx, by] = V[i + 1];
      d += ` C${ax},${lerp(ay, ty, 0.62).toFixed(1)} ${(tx + (ax - tx) * 0.22).toFixed(1)},${ty - 6} ${tx},${ty}`;
      d += ` C${(tx + (bx - tx) * 0.26).toFixed(1)},${ty - 9} ${bx},${lerp(by, ty, 0.5).toFixed(1)} ${bx},${by}`;
    }
    return d + 'Z';
  };
  const FRONT = {
    slick: 'M44,100 C38,40 66,20 100,20 C134,20 162,40 156,100 L150,84 C146,64 126,54 100,54 C74,54 54,64 50,84Z',
    buzz: 'M48,96 C44,46 70,32 100,32 C130,32 156,46 152,96 C146,72 126,60 100,60 C74,60 54,72 48,96Z',
    bald: '',
  };
  const SPIKES = 'M56,62 L42,34 L64,40 L64,14 L84,30 L97,4 L109,29 L126,12 L130,38 L154,30 L146,62Z';
  const frontPath = (k) => (BANGS[k] ? bangsPath(BANGS[k]) : FRONT[k === 'spiky' ? 'x' : k] || (k === 'spiky' ? bangsPath(BANGS.mshort) : ''));
  const SIDE = {
    long: 'M53,76 C43,112 46,146 40,170 Q49,165 56,170 C59,140 59,106 62,84Z',
    short: 'M53,76 C46,100 48,122 46,136 Q52,132 58,136 C59,118 59,98 62,84Z',
  };
  const TOP = { slick: 20, buzz: 32, bald: 34 };
  const NAME = {
    back: { long: '長髮', bob: '鮑伯頭', twin: '雙馬尾', pony: '馬尾', bun: '包頭', short: '短髮' },
    front: { spiky: '刺蝟頭', slick: '油頭', buzz: '平頭', bald: '光頭', mshort: '短髮', mmessy: '亂髮' },
  };

  // ---------- 衣服（以半寬 36 為準，再依體型縮放）----------
  const BODY = 'M63,202 C63,172 75,150 100,150 C125,150 137,172 137,202Z';
  const CLOTHES = {
    hoodie: (c) => `<path d="${BODY}" fill="${c}"/><path d="M79,155 Q100,172 121,155 Q119,148 110,150 Q100,161 90,150 Q81,148 79,155Z" fill="${shade(c, -0.22)}"/><path d="M95,162 L94,178 M105,162 L106,178" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`,
    jacket: (c) => `<path d="${BODY}" fill="${c}"/><path d="M90,152 L100,178 L110,152Z" fill="#fafafa"/><path d="M90,151 L82,160 L98,184 L100,178Z M110,151 L118,160 L102,184 L100,178Z" fill="${shade(c, -0.25)}"/>`,
    suit: (c) => `<path d="${BODY}" fill="${c}"/><path d="M90,152 L100,180 L110,152Z" fill="#fafafa"/><path d="M98,156 L102,156 L104,176 L100,181 L96,176Z" fill="#d23a48"/><path d="M90,151 L82,160 L98,186 L100,180Z M110,151 L118,160 L102,186 L100,180Z" fill="${shade(c, -0.28)}"/>`,
    turtle: (c) => `<path d="${BODY}" fill="${c}"/><path d="M89,142 L89,157 Q100,162 111,157 L111,142 Q100,147 89,142Z" fill="${shade(c, 0.1)}"/><path d="M93,147 v12 M97,148 v13 M100,148 v13 M103,148 v13 M107,147 v12" stroke="${shade(c, -0.2)}" stroke-width=".9"/>`,
    tee: (c) => `<path d="${BODY}" fill="${c}"/><path d="M90,151 Q100,161 110,151" fill="${shade(c, -0.15)}"/><path d="M94,176 l6,-8 l6,8 l-6,8Z" fill="${shade(c, 0.45)}" stroke="none"/>`,
    aloha: () => `<path d="${BODY}" fill="#3fb6a8"/><g fill="#ffe08a" stroke="none"><circle cx="74" cy="182" r="4"/><circle cx="126" cy="178" r="4"/><circle cx="84" cy="196" r="3"/><circle cx="120" cy="196" r="3"/></g><path d="M90,151 L84,162 L100,172Z M110,151 L116,162 L100,172Z" fill="#f2fbf9"/>`,
  };
  const CLOTH_NAME = { hoodie: '連帽衫', jacket: '外套', suit: '西裝領帶', turtle: '高領毛衣', tee: 'T 恤', aloha: '花襯衫' };

  // ---------- 隨機特徵 ----------
  function traits(seed) {
    const r = rng(seed * 7919 + 13);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const male = r() < 0.5;
    const ar = r(); const age = ar < 0.45 ? 'young' : ar < 0.78 ? 'mid' : 'old';
    const years = age === 'young' ? 18 + Math.floor(r() * 10) : age === 'mid' ? 32 + Math.floor(r() * 17) : 58 + Math.floor(r() * 18);
    const br = r(); const build = br < 0.25 ? 'thin' : br < 0.72 ? 'normal' : 'fat';
    let height = Math.round((male ? 172 : 159) + (r() + r() + r() - 1.5) * (male ? 14 : 11) - (age === 'old' ? 3 : 0));
    height = Math.max(146, Math.min(192, height));
    const hairPool = age === 'old' ? (r() < 0.75 ? HAIR_OLD : HAIR_NAT) : age === 'mid' ? (r() < 0.65 ? HAIR_NAT : HAIR_FUN) : (r() < 0.7 ? HAIR_FUN : HAIR_NAT);
    const t = { male, age, years, build, height, hair: pick(hairPool), eye: pick(EYES), skin: pick(SKIN), cloth: pick(CLOTH) };
    if (male) {
      t.back = age === 'young' && r() < 0.12 ? 'pony' : 'short';
      t.front = age === 'old' ? pick(['slick', 'bald', 'buzz', 'mshort']) : pick(['spiky', 'slick', 'buzz', 'mshort', 'mmessy', 'mmessy', age === 'young' ? 'spiky' : 'bald']);
      if (t.front === 'bald' || t.front === 'buzz') t.back = 'none';
      t.clothes = pick(['hoodie', 'jacket', 'suit', 'turtle', 'aloha', 'tee']);
      const fr = r();
      t.facial = age === 'young' ? (fr < 0.2 ? 'stubble' : null) : fr < 0.22 ? 'stubble' : fr < 0.45 ? 'mustache' : fr < 0.62 ? 'beard' : null;
    } else {
      t.back = age === 'old' ? pick(['bun', 'short', 'bob']) : age === 'mid' ? pick(['long', 'bob', 'pony', 'bun', 'short']) : pick(['long', 'bob', 'twin', 'pony', 'long']);
      t.front = pick(age === 'young' ? ['soft', 'swept', 'center', 'hime', 'cover'] : ['soft', 'swept', 'center', 'hime']);
      t.clothes = pick(['hoodie', 'jacket', 'turtle', 'tee', age === 'young' ? 'hoodie' : 'suit']);
      t.facial = null;
    }
    t.expr = pick(Object.keys(EXPR));
    t.wink = !!EXPR[t.expr].wink && r() < 0.6;
    t.blush = t.expr === 'crying' || t.expr === 'xx' || (male ? r() < 0.35 : r() < 0.8) || build === 'fat';
    t.ahoge = age !== 'old' && r() < 0.3;
    t.mole = r() < 0.2;
    const acc = []; const roll = r();
    if (roll < 0.11) acc.push('mask'); else if (roll < 0.19) acc.push('patch'); else if (roll < (age === 'old' ? 0.62 : 0.34)) acc.push('glasses'); else if (roll < (age === 'old' ? 0.68 : 0.42)) acc.push('shades');
    const r2 = r();
    if (r2 < 0.09) acc.push('cap'); else if (r2 < 0.16) acc.push('beanie'); else if (!male && r2 < 0.34) acc.push('clip');
    if (r() < 0.22) acc.push('bandage');
    if (male && r() < 0.18) acc.push('scar');
    if (acc.includes('cap') || acc.includes('beanie')) t.ahoge = false;
    // 眼睛被遮住時，不用會被擋掉的眼神表情
    if (acc.includes('shades') || acc.includes('patch')) t.wink = false;
    if (acc.includes('shades') && ['money', 'swirl', 'xx'].includes(EXPR[t.expr].e)) acc.splice(acc.indexOf('shades'), 1);
    if (acc.includes('mask') && t.facial !== 'stubble') t.facial = null;
    t.acc = acc;
    return t;
  }

  // ---------- 畫圖 ----------
  const HEADTOP = 30; const REF = 168; const PX = 1.0;
  function svg(seed, opt = {}) {
    const t = traits(seed); const id = 'av' + (++UID);
    const H = t.hair[1]; const HL = shade(H, -0.42); const HB = shade(H, -0.16);
    const E = t.eye[1]; const S = t.skin; const SL = shade(S, -0.4); const L = '#3e2630';
    const has = (a) => t.acc.includes(a); const ex = EXPR[t.expr]; const fx = (k) => (ex.fx || []).includes(k);
    const W = t.build === 'fat' ? 54 : t.build === 'thin' ? 44 : (t.male ? 47 : 48);
    const Cy = t.build === 'fat' ? 142 : t.build === 'thin' ? 142 : 140;
    const FACE = `M${100 - W},96 C${100 - W},${Cy - 14} ${100 - W * 0.55},${Cy} 100,${Cy} C${100 + W * 0.55},${Cy} ${100 + W},${Cy - 14} ${100 + W},96 C${100 + W},60 ${100 + W * 0.5},46 100,46 C${100 - W * 0.5},46 ${100 - W},60 ${100 - W},96Z`;
    const kx = W / 48;
    const kb = ((t.male ? 40 : 36) + (t.build === 'fat' ? 11 : t.build === 'thin' ? -4 : 0)) / 36;
    const dy = HEADTOP - (TOP[t.front] || 22) + (REF - t.height) * PX;
    const isz = t.age === 'old' ? 0.82 : t.age === 'mid' ? 0.92 : 1;
    const o = [];
    o.push(`<defs>`
      + `<linearGradient id="${id}i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(E, -0.65)}"/><stop offset=".5" stop-color="${E}"/><stop offset="1" stop-color="${shade(E, 0.55)}"/></linearGradient>`
      + `<linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(H, 0.18)}"/><stop offset=".6" stop-color="${H}"/><stop offset="1" stop-color="${shade(H, -0.1)}"/></linearGradient>`
      + `<radialGradient id="${id}k" cx=".5" cy=".42" r=".6"><stop offset=".6" stop-color="${S}"/><stop offset="1" stop-color="${shade(S, -0.06)}"/></radialGradient>`
      + `<radialGradient id="${id}b"><stop offset="0" stop-color="#ff7a98" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a98" stop-opacity="0"/></radialGradient>`
      + `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0f40" stop-opacity=".75"/><stop offset="1" stop-color="#2a0f40" stop-opacity="0"/></linearGradient>`
      + `<clipPath id="${id}f"><path d="${FACE}"/></clipPath></defs>`);
    if (opt.mug) {
      o.push(`<rect width="200" height="200" fill="#e4dfd2"/>`); // 純色背景（不畫身高線）
    } else if (opt.bg) o.push(`<rect width="200" height="200" fill="${opt.bg}"/>`);
    o.push(`<g transform="translate(0,${dy.toFixed(1)})">`);
    const hairA = (fill = `url(#${id}h)`) => `fill="${fill}" stroke="${HL}" stroke-width="1.4" stroke-linejoin="round"`;

    // 後髮
    if (BACK[t.back]) o.push(scaleX(kx, `<path d="${BACK[t.back]}" ${hairA(HB)}/>`
      + (t.back === 'twin' ? `<circle cx="54" cy="56" r="5" fill="${shade(t.cloth, 0.25)}" stroke="${L}" stroke-width="1"/><circle cx="146" cy="56" r="5" fill="${shade(t.cloth, 0.25)}" stroke="${L}" stroke-width="1"/>` : '')));
    // 身體
    o.push(scaleX(kb, `<g stroke="${L}" stroke-width="1.4" stroke-linejoin="round">${CLOTHES[t.clothes](t.cloth)}</g>`));
    o.push(`<path d="M94,132 L94,${t.clothes === 'turtle' ? 146 : 152} L106,${t.clothes === 'turtle' ? 146 : 152} L106,132Z" fill="${S}" stroke="${SL}" stroke-width="1.2"/><path d="M94,136 Q100,${Cy + 4} 106,136 L106,${Cy + 6} Q100,${Cy + 9} 94,${Cy + 6}Z" fill="${shade(S, -0.12)}"/>`);
    // 臉
    if (t.male && (t.front === 'bald' || t.front === 'buzz' || t.front === 'slick')) o.push(`<ellipse cx="${100 - W + 1}" cy="106" rx="6" ry="8.5" fill="${S}" stroke="${SL}" stroke-width="1.2"/><ellipse cx="${100 + W - 1}" cy="106" rx="6" ry="8.5" fill="${S}" stroke="${SL}" stroke-width="1.2"/>`);
    o.push(`<path d="${FACE}" fill="url(#${id}k)" stroke="${SL}" stroke-width="1.3"/>`);
    if (t.front === 'bald') o.push(scaleX(kx, `<path d="M50,98 C46,48 72,34 100,34 C128,34 154,48 150,98Z" fill="${S}"/><path d="M50,98 C46,48 72,34 100,34 C128,34 154,48 150,98" fill="none" stroke="${SL}" stroke-width="1.3"/><path d="M74,52 Q88,42 104,43" fill="none" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>`));
    if (t.build === 'fat') o.push(`<path d="M86,${Cy - 1} Q100,${Cy + 5} 114,${Cy - 1}" fill="none" stroke="${SL}" stroke-width="1" opacity=".7"/>`);
    // 額頭陰影
    const fp = t.front === 'spiky' ? bangsPath(BANGS.mshort) : frontPath(t.front);
    if (fp) o.push(`<g clip-path="url(#${id}f)">${scaleX(kx, `<path d="${fp}" fill="${shade(S, -0.14)}" transform="translate(1,5)"/>`)}</g>`);
    // 腮紅
    if (t.blush) o.push(`<ellipse cx="${100 - W * 0.62}" cy="123" rx="11" ry="6" fill="url(#${id}b)"/><ellipse cx="${100 + W * 0.62}" cy="123" rx="11" ry="6" fill="url(#${id}b)"/>`
      + (t.expr === 'xx' || t.expr === 'crying' ? `<path d="M${96 - W * 0.62},125 l2.6,-4 M${100 - W * 0.62},125 l2.6,-4 M${104 - W * 0.62},125 l2.6,-4 M${96 + W * 0.62},125 l2.6,-4 M${100 + W * 0.62},125 l2.6,-4 M${104 + W * 0.62},125 l2.6,-4" stroke="#f0607e" stroke-width="1" stroke-linecap="round"/>` : ''));
    // 老人紋路
    if (t.age === 'old') o.push(`<path d="M64,104 l-4,-2 M64,108 l-4,1 M136,104 l4,-2 M136,108 l4,1 M90,120 Q87,125 89,129 M110,120 Q113,125 111,129" fill="none" stroke="${SL}" stroke-width="1" stroke-linecap="round" opacity=".75"/>`);

    // 眼睛
    const CY = 108; const male = t.male;
    const eye = (cx, s, mode) => {
      const P = (dx, dy2) => `${(cx + s * dx).toFixed(1)},${(CY + dy2).toFixed(1)}`;
      const rx = male ? 10 : 11; const ry = male ? 10.5 : 13; const ec = male ? CY + 1 : CY;
      const lash = male
        ? `<path d="M${P(12.5, -3)} Q${P(4, -13)} ${P(-11, -8)} L${P(-11.5, -5)} Q${P(4, -9.5)} ${P(11, 0)}Z" fill="${L}"/>`
        : `<path d="M${P(13.5, 1)} Q${P(9, -15)} ${P(-3, -14.5)} Q${P(-10, -13)} ${P(-12.5, -4)} L${P(-10.5, -3)} Q${P(-6, -10.5)} ${P(0, -11)} Q${P(8, -10.5)} ${P(11.5, 3)}Z" fill="${L}"/><path d="M${P(12.5, -2)} L${P(17.5, -6.5)} L${P(13.6, 2)}Z" fill="${L}"/>`;
      const low = `<path d="M${P(9, 8)} Q${P(7, 12)} ${P(3, 12.6)}" fill="none" stroke="${L}" stroke-width="1" stroke-linecap="round" opacity=".6"/>`;
      const white = `<ellipse cx="${cx}" cy="${ec}" rx="${rx}" ry="${ry}" fill="#fff"/>`;
      if (mode === 'happy') return `<path d="M${P(11, 4)} Q${P(0, -11)} ${P(-11, 4)}" fill="none" stroke="${L}" stroke-width="3.2" stroke-linecap="round"/>`;
      if (mode === 'cry') return `<path d="M${P(11, -3)} Q${P(0, 7)} ${P(-11, -3)}" fill="none" stroke="${L}" stroke-width="3.2" stroke-linecap="round"/>`;
      if (mode === 'xx') return `<path d="M${P(10, -8)} L${P(-7, 0)} L${P(10, 8)}" fill="none" stroke="${L}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (mode === 'dot') return `<ellipse cx="${cx}" cy="${CY + 2}" rx="2.8" ry="3.8" fill="${L}"/>`;
      if (mode === 'blank') return `<ellipse cx="${cx}" cy="${ec}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${L}" stroke-width="1.8"/>`;
      if (mode === 'swirl') return `${white}<path d="M${cx},${ec} m-1,0 a1.2,1.2 0 1,1 2.4,0 a3.2,3.2 0 1,1 -6.4,0 a5.2,5.2 0 1,1 10.4,0 a7.2,7.2 0 1,1 -14.4,0" fill="none" stroke="${L}" stroke-width="1.7"/>${lash}`;
      if (mode === 'money') return `${white}<text x="${cx}" y="${ec + 8.5}" font-size="25" font-weight="900" text-anchor="middle" fill="#f5b800" stroke="#7a5200" stroke-width="1.2" font-family="Arial Black, Arial, sans-serif">$</text>${lash}`;
      if (mode === 'small' || mode === 'glow') return `${white}<ellipse cx="${cx}" cy="${ec + 1}" rx="3.6" ry="4.4" fill="${mode === 'glow' ? E : shade(E, -0.4)}"/><circle cx="${cx - 1}" cy="${ec - 0.6}" r="1.1" fill="#fff"/>${lash}`;
      const irx = (male ? 7.6 : 9.2) * isz; const iry = (male ? 9 : 11.5) * isz;
      let e = `${white}<g clip-path="url(#${id}e${s < 0 ? 'l' : 'r'})"><ellipse cx="${cx}" cy="${ec + 1.5}" rx="${irx}" ry="${iry}" fill="url(#${id}i)"/>`
        + `<ellipse cx="${cx}" cy="${ec + 2.5}" rx="${irx * 0.47}" ry="${iry * 0.52}" fill="${shade(E, -0.72)}"/>`
        + `<ellipse cx="${cx}" cy="${ec + iry * 0.62}" rx="${irx * 0.62}" ry="${iry * 0.24}" fill="${shade(E, 0.6)}" opacity=".7"/>`
        + `<ellipse cx="${cx}" cy="${ec - ry + 2}" rx="${rx}" ry="4" fill="${shade(E, -0.5)}" opacity=".35"/>`;
      if (mode === 'half' || t.age === 'old') { const ly = ec - (mode === 'half' ? 3 : 7); e += `<rect x="${cx - 14}" y="${ec - 16}" width="28" height="${ly - ec + 16}" fill="${S}"/>`; }
      e += `</g>`;
      if (mode === 'half' || t.age === 'old') { const ly = ec - (mode === 'half' ? 3 : 7); e += `<path d="M${P(12.5, ly - CY)} Q${P(0, ly - CY - 2.5)} ${P(-11.5, ly - CY)}" fill="none" stroke="${L}" stroke-width="${mode === 'half' ? 3 : 2.4}" stroke-linecap="round"/>`; }
      e += `<ellipse cx="${cx - 3.4}" cy="${ec - 3.6}" rx="${3.4 * isz}" ry="${4.3 * isz}" fill="#fff"/><circle cx="${cx + 3.8}" cy="${ec + 6}" r="${1.7 * isz}" fill="#fff"/>`;
      if (mode !== 'half' && t.age !== 'old') e += lash;
      return e + low;
    };
    const rx0 = male ? 10 : 11; const ry0 = male ? 10.5 : 13; const ec0 = male ? CY + 1 : CY;
    o.splice(1, 0, `<defs><clipPath id="${id}el"><ellipse cx="78" cy="${ec0}" rx="${rx0}" ry="${ry0}"/></clipPath><clipPath id="${id}er"><ellipse cx="122" cy="${ec0}" rx="${rx0}" ry="${ry0}"/></clipPath></defs>`);
    const em = ex.e;
    o.push(eye(78, -1, em));
    o.push(eye(122, 1, t.wink ? 'happy' : em));
    if (fx('shadow')) o.push(`<g clip-path="url(#${id}f)"><rect x="40" y="46" width="120" height="70" fill="url(#${id}s)"/></g>`);
    if (em === 'glow') o.push(`<circle cx="78" cy="109" r="2.4" fill="#fff"/><circle cx="122" cy="109" r="2.4" fill="#fff"/>`);
    // 嘴、鬍子
    if (!has('mask')) {
      o.push(`<circle cx="100" cy="119" r=".9" fill="${SL}"/>`);
      o.push(MOUTH[ex.m](L));
    }
    if (t.facial === 'stubble') o.push(`<g clip-path="url(#${id}f)"><path d="M40,124 Q70,118 88,126 Q100,142 112,126 Q130,118 160,124 L160,170 L40,170Z" fill="${HL}" opacity=".12"/></g>`);
    if (t.facial === 'beard') o.push(`<path d="M${100 - W},108 C${100 - W},${Cy - 6} ${100 - W * 0.55},${Cy + 8} 100,${Cy + 8} C${100 + W * 0.55},${Cy + 8} ${100 + W},${Cy - 6} ${100 + W},108 L${100 + W - 5},116 C${100 + W - 8},132 114,${Cy - 3} 100,${Cy - 3} C86,${Cy - 3} ${100 - W + 8},132 ${100 - W + 5},116Z" ${hairA(H)}/>`);
    if (t.facial === 'mustache' || t.facial === 'beard') o.push(`<path d="M89,124 Q94,119 100,122 Q106,119 111,124 Q106,125 100,123.6 Q94,125 89,124Z" ${hairA(H)}/>`);
    if (t.mole) o.push(`<circle cx="${100 + W * 0.42}" cy="120" r="1.1" fill="${L}"/>`);
    if (has('scar')) o.push(`<path d="M116,92 L126,122 M118,100 l6,-2 M120,108 l6,-2 M122,116 l6,-2" stroke="#c45a6a" stroke-width="1.5" fill="none" stroke-linecap="round"/>`);
    if (has('bandage')) o.push(`<g transform="translate(${t.male ? 72 : 128},123) rotate(${t.male ? 20 : -20})"><rect x="-9" y="-3.6" width="18" height="7.2" rx="3" fill="#fbe2c4" stroke="${SL}" stroke-width="1"/><rect x="-3" y="-3.6" width="6" height="7.2" fill="#f0cfa6"/></g>`);
    if (fx('tears')) o.push(`<path d="M72,113 C70,128 74,140 70,158 M128,113 C130,128 126,140 130,158" fill="none" stroke="#8fd6ff" stroke-width="7" opacity=".75" stroke-linecap="round"/><path d="M72,114 C71,128 74,140 71,156 M128,114 C129,128 126,140 129,156" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8" stroke-linecap="round"/>`);
    if (has('mask')) {
      const mc = rng(seed * 31 + 7)() < 0.5 ? '#f6f6f8' : '#2a2a32';
      o.push(`<path d="M60,116 Q100,108 140,116 L138,131 Q100,150 62,131Z" fill="${mc}" stroke="${L}" stroke-width="1.2"/><path d="M68,123 Q100,117 132,123 M70,131 Q100,126 130,131" fill="none" stroke="${shade(mc, mc === '#f6f6f8' ? -0.12 : 0.2)}" stroke-width="1"/>`);
    }
    if (has('patch')) o.push(scaleX(kx, `<path d="M156,92 L46,80" stroke="#22222a" stroke-width="2.2"/>`), `<ellipse cx="122" cy="108" rx="13" ry="14" fill="#22222a" stroke="${L}" stroke-width="1.2"/><path d="M116,102 l12,12 M128,102 l-12,12" stroke="#e03040" stroke-width="1.6"/>`);

    // 前髮
    let front = '';
    if (t.front === 'spiky') front += `<path d="${SPIKES}" ${hairA()}/>`;
    if (fp) {
      front += `<path d="${fp}" ${hairA()}/>`;
      if (t.front === 'buzz') front += `<path d="${fp}" fill="none" stroke="${HL}" stroke-width="4" stroke-dasharray="1 3" opacity=".3"/>`;
      else front += `<path d="M64,48 Q100,30 136,48 Q100,40 64,54Z" fill="#fff" opacity=".5"/><path d="M70,58 l4,-3 M128,56 l4,3 M98,40 h5" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>`;
      if (BANGS[t.front] || t.front === 'spiky') {
        const B = BANGS[t.front] || BANGS.mshort;
        front += B.V.slice(1, -1).map(([x, y]) => `<path d="M${x},${y} Q${x + (x < 100 ? 3 : -3)},${y - 10} ${x + (x < 100 ? 2 : -2)},${y - 18}" fill="none" stroke="${HL}" stroke-width="1" opacity=".55" stroke-linecap="round"/>`).join('');
      }
      if (t.front === 'slick') front += `<path d="M64,60 Q84,44 108,42 M72,66 Q94,52 122,50 M124,48 Q140,58 146,74" fill="none" stroke="${HL}" stroke-width="1" opacity=".55"/>`;
    }
    if (t.front === 'bald' && t.age === 'old') front += `<path d="M50,88 C47,100 49,112 52,118 L58,112 C56,104 57,96 60,90Z" ${hairA()}/>` + mirror(`<path d="M50,88 C47,100 49,112 52,118 L58,112 C56,104 57,96 60,90Z" ${hairA()}/>`);
    if (t.ahoge) front += `<path d="M100,24 Q102,2 122,0 Q108,8 108,24Z" ${hairA()}/>`;
    if (!t.male && SIDE[t.back === 'long' || t.back === 'twin' ? 'long' : 'short']) { const sd = SIDE[t.back === 'long' || t.back === 'twin' ? 'long' : 'short']; front += `<path d="${sd}" ${hairA()}/>` + mirror(`<path d="${sd}" ${hairA()}/>`); }
    o.push(scaleX(kx, front));
    // 眉毛
    const bw = t.age === 'old' ? 3.6 : t.male ? 3.2 : 2.3; const bc = t.age === 'old' ? shade(H, -0.2) : HL;
    const brow = (cx, s, k) => { const [a, m, b] = BROW[k]; const P = ([dx, d2]) => `${cx + s * dx},${CY + d2}`; return `<path d="M${P(a)} Q${P(m)} ${P(b)}" fill="none" stroke="${bc}" stroke-width="${bw}" stroke-linecap="round" opacity=".92"/>`; };
    o.push(brow(78, -1, ex.b[0]), brow(122, 1, ex.b[1]));
    // 配件
    if (has('glasses')) o.push(`<g fill="rgba(255,255,255,.15)" stroke="#4a3440" stroke-width="1.8"><circle cx="78" cy="109" r="14"/><circle cx="122" cy="109" r="14"/></g><path d="M92,107 Q100,103 108,107 M64,106 L${100 - W},102 M136,106 L${100 + W},102" stroke="#4a3440" stroke-width="1.8" fill="none"/>`);
    if (has('shades')) o.push(`<g fill="#1c1820"><path d="M62,100 L95,100 Q95,120 78,121 Q62,120 62,100Z"/><path d="M105,100 L138,100 Q138,120 122,121 Q105,120 105,100Z"/></g><path d="M95,102 L105,102 M62,101 L${100 - W},98 M138,101 L${100 + W},98" stroke="#1c1820" stroke-width="2.2"/><path d="M67,104 l9,0 M110,104 l9,0" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>`);
    let hat = '';
    if (has('cap')) { const cc = shade(t.cloth, 0.08); hat += `<path d="M42,70 C40,16 160,16 158,70 Q100,58 42,70Z" fill="${cc}" stroke="${L}" stroke-width="1.4"/><path d="M36,72 Q100,52 164,72 Q156,84 100,76 Q44,84 36,72Z" fill="${shade(cc, -0.22)}" stroke="${L}" stroke-width="1.4"/><circle cx="100" cy="24" r="3" fill="${shade(cc, -0.22)}"/><text x="100" y="56" font-size="15" font-weight="900" text-anchor="middle" fill="#fff" font-family="Arial Black, Arial, sans-serif">X</text>`; }
    if (has('beanie')) { const bc2 = shade(t.cloth, 0.15); hat += `<path d="M44,66 C40,10 160,10 156,66Z" fill="${bc2}" stroke="${L}" stroke-width="1.4"/><circle cx="100" cy="12" r="7" fill="${shade(bc2, 0.3)}" stroke="${L}" stroke-width="1.2"/><rect x="40" y="58" width="120" height="15" rx="7" fill="${shade(bc2, -0.18)}" stroke="${L}" stroke-width="1.4"/>`; }
    if (has('clip')) hat += `<path d="M122,64 l12,-7 M124,55 l9,11" stroke="#ffd34a" stroke-width="3" stroke-linecap="round"/>`;
    if (hat) o.push(scaleX(kx, hat));
    // 漫畫效果
    if (fx('vein')) o.push(`<g stroke="#e8364a" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M126,60 q5,5 0,10 M140,60 q-5,5 0,10 M128,58 q5,5 10,0 M128,72 q5,-5 10,0"/></g>`);
    if (fx('puff')) o.push(`<g fill="#fff" stroke="#9a9aa8" stroke-width="1.2"><path d="M${108 + W},132 a6,6 0 1,1 8,-6 a5,5 0 1,1 4,9 a5,5 0 1,1 -12,-3Z"/><path d="M${92 - W},132 a6,6 0 1,0 -8,-6 a5,5 0 1,0 -4,9 a5,5 0 1,0 12,-3Z"/></g>`);
    if (fx('gloom')) o.push(`<g clip-path="url(#${id}f)"><g stroke="#5a6ae0" stroke-width="1.6" opacity=".6"><path d="M74,50 v30 M81,48 v34 M88,47 v30 M95,46 v36 M102,46 v32 M109,47 v34 M116,48 v30 M123,50 v32"/></g></g>`);
    if (fx('sweat')) o.push(`<path d="M${104 + W},64 Q${97 + W},78 ${104 + W},84 Q${111 + W},78 ${104 + W},64Z" fill="#c4ecff" stroke="#4a9ad8" stroke-width="1.2"/><path d="M${101 + W},76 q0,3 2,5" stroke="#fff" stroke-width="1.3" fill="none"/>`);
    if (fx('sparkle')) { const st = (x, y, r2) => `<path d="M${x},${y - r2} Q${x + r2 * 0.18},${y - r2 * 0.18} ${x + r2},${y} Q${x + r2 * 0.18},${y + r2 * 0.18} ${x},${y + r2} Q${x - r2 * 0.18},${y + r2 * 0.18} ${x - r2},${y} Q${x - r2 * 0.18},${y - r2 * 0.18} ${x},${y - r2}Z" fill="#ffd84a" stroke="#c99200" stroke-width=".8"/>`; o.push(st(108 + W, 70, 8), st(94 - W, 84, 6), st(116 + W, 92, 4)); }
    o.push('</g>');
    const vb = opt.mug && !opt.tight ? '0 0 200 200' : `30 ${(18 + dy).toFixed(1)} 140 140`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" class="avatar">${o.join('')}</svg>`;
  }

  function describe(seed) {
    const t = traits(seed);
    const ACC = { mask: '口罩', patch: '眼罩', glasses: '眼鏡', shades: '墨鏡', cap: '棒球帽', beanie: '毛帽', clip: '髮夾', bandage: 'OK 繃', scar: '刀疤' };
    const FAC = { stubble: '鬍渣', mustache: '八字鬍', beard: '大鬍子' };
    const BLD = { thin: '瘦', normal: '中等身材', fat: '胖' };
    const hairName = t.male ? NAME.front[t.front] : NAME.back[t.back];
    return {
      male: t.male, sex: t.male ? '♂' : '♀', age: t.years, height: t.height, build: BLD[t.build], expr: EXPR[t.expr].n,
      line: `${t.years} 歲・${t.height} cm・${BLD[t.build]}`,
      tags: [t.front === 'bald' ? '光頭' : `${t.hair[0]}${hairName}`, `${t.eye[0]}眼`, CLOTH_NAME[t.clothes], ...(t.facial ? [FAC[t.facial]] : []), ...t.acc.map((a) => ACC[a])],
    };
  }

  // 外觀線索（通緝海報、監視器比對用）：[{ cat, text }]
  function clues(seed) {
    const t = traits(seed);
    const BACKN = { long: '長髮', bob: '鮑伯頭', twin: '雙馬尾', pony: '馬尾', bun: '包頭', short: '短髮' };
    const FRONTN = { spiky: '刺蝟頭', slick: '油頭', buzz: '平頭', mshort: '短髮', mmessy: '亂髮' };
    const ACC = { mask: '戴著口罩', patch: '右眼戴眼罩', glasses: '戴圓框眼鏡', shades: '戴墨鏡', cap: '戴棒球帽', beanie: '戴毛帽', clip: '頭上別著髮夾', bandage: '臉上貼著 OK 繃', scar: '右臉有一道刀疤' };
    const FAC = { stubble: '滿臉鬍渣', mustache: '留八字鬍', beard: '留大鬍子' };
    const CL = { hoodie: '穿連帽衫', jacket: '穿外套', suit: '穿西裝打領帶', turtle: '穿高領毛衣', tee: '穿 T 恤', aloha: '穿花襯衫' };
    const out = [];
    const hairWord = t.male ? FRONTN[t.front] : BACKN[t.back];
    out.push({ cat: 'hair', text: t.front === 'bald' ? '光頭' : `${t.hair[0]}色${hairWord}` });
    out.push({ cat: 'height', text: `身高約 ${Math.round(t.height / 5) * 5} 公分` });
    if (t.build !== 'normal') out.push({ cat: 'build', text: t.build === 'fat' ? '身材微胖' : '身材瘦削' });
    if (!t.acc.includes('shades') && !t.acc.includes('patch')) out.push({ cat: 'eye', text: `${t.eye[0]}色眼睛` });
    t.acc.forEach((a) => out.push({ cat: 'acc-' + a, text: ACC[a] }));
    if (t.facial) out.push({ cat: 'facial', text: FAC[t.facial] });
    out.push({ cat: 'age', text: `看起來 ${Math.floor(t.years / 10) * 10} 多歲` });
    out.push({ cat: 'cloth', text: CL[t.clothes] });
    return out;
  }

  g.Avatar = { svg, traits, describe, clues };
})(window);
