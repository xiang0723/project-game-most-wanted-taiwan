// 《全臺通緝令》角色頭像 v3：極簡扁平向量（畫風照 _samples/girl-sample.html）
// 純色塊＋深藍黑描邊，不用漸層、不用半透明（腮紅除外），陰影只留下巴在脖子上的那一塊。
// 大圓頭、寬臉圓下巴、低而分開的大眼（粗上眼線＋眼尾小翹、瞳孔下緣一彎淺色、兩顆白色高光）、
// 側分長瀏海、頭頂兩道亮色髮光、露出脖子的小身體。
// 物種：人類／獸耳族。表情、手勢可指定，也可由種子決定。
// API（跟 v2 一樣）：Avatar3.svg(seed, opt) / traits(seed) / describe(seed) / clues(seed)
//   opt.expr、opt.pose 可覆寫；opt.plain 拿掉遮臉配件；opt.mug 整張＋依身高上下移（tight 時裁臉）；opt.full 整張；opt.bg 畫圓形底色；預設裁到頭肩
(function (g) {
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hex2 = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const rgb2 = (r, gg, b) => '#' + ((1 << 24) | (r << 16) | (gg << 8) | b).toString(16).slice(1);
  const shade = (hex, p) => { const f = (c) => Math.round(p < 0 ? c * (1 + p) : c + (255 - c) * p); const [r, gg, b] = hex2(hex); return rgb2(f(r), f(gg), f(b)); };
  const mix = (a, b, p) => { const A = hex2(a), B = hex2(b); return rgb2(...A.map((v, i) => Math.round(v + (B[i] - v) * p))); };
  const O = '#2b2a45';      // 描邊色（深藍黑）
  const LINER = '#1f1d33';  // 上眼線
  const SW = 2.2;           // 描邊粗細
  const LIP = '#9c4a4a', MOUTH_IN = '#c8505a', TONGUE = '#f2949a', BLUSH = '#f7a1a6';
  const P = (d, fill, x = '') => `<path d="${d}" fill="${fill}" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${x}/>`;
  const F = (d, fill, x = '') => `<path d="${d}" fill="${fill}" ${x}/>`; // 只填色
  const L = (d, w = SW, c = O, x = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${x}/>`;
  const E = (cx, cy, rx, ry, fill, x = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${O}" stroke-width="${SW}" ${x}/>`;
  const EF = (cx, cy, rx, ry, fill, x = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${x}/>`;
  // 有描邊的膠囊（手指、袖子）
  const CAP = (x1, y1, x2, y2, w, fill, ow = SW) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${O}" stroke-width="${w + ow * 2}" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fill}" stroke-width="${w}" stroke-linecap="round"/>`;
  const G = (t, s) => `<g transform="${t}">${s}</g>`;
  const mirror = (s) => G('matrix(-1 0 0 1 200 0)', s);
  const both = (one) => one + mirror(one);
  const star4 = (x, y, r, fill = '#ffd86b') => P(`M${x},${y - r} Q${x + r * 0.22},${y - r * 0.22} ${x + r},${y} Q${x + r * 0.22},${y + r * 0.22} ${x},${y + r} Q${x - r * 0.22},${y + r * 0.22} ${x - r},${y} Q${x - r * 0.22},${y - r * 0.22} ${x},${y - r}Z`, fill, 'stroke-width="1.6"');
  const star5 = (x, y, r, fill = '#ffd86b') => { let d = ''; for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r * 0.48 : r; d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)} `; } return P(d + 'Z', fill, 'stroke-width="1.6"'); };
  const heart = (x, y, s, fill = '#ff7a96') => P(`M${x},${y + 7 * s} C${x - 11 * s},${y - 1 * s} ${x - 8 * s},${y - 10 * s} ${x},${y - 4 * s} C${x + 8 * s},${y - 10 * s} ${x + 11 * s},${y - 1 * s} ${x},${y + 7 * s}Z`, fill, 'stroke-width="1.6"');

  // ---------- 調色盤（全部純色，偏柔和）----------
  // 顏色往 girl-sample 的低彩度靛藍／灰靠（#3e5186、#c9cdd6）
  const HAIR_FUN = [['粉紅', '#e3a2b6'], ['薰衣草', '#8f86c2'], ['天藍', '#759fcf'], ['薄荷', '#78baa6'], ['蜜橘', '#dc9e6c'], ['奶金', '#e3c68c'], ['櫻紅', '#c9707c'], ['銀白', '#d0d4de']];
  const HAIR_NAT = [['黑', '#33364f'], ['栗棕', '#88614a'], ['深棕', '#574438'], ['亞麻', '#c0a482'], ['紅棕', '#9e5a42']];
  const HAIR_OLD = [['灰白', '#c4c7d1'], ['雪白', '#ebecf2'], ['灰黑', '#6a6979']];
  const EYES = [['藍', '#5d76ad'], ['紫', '#7c6ab4'], ['綠', '#5a8c5e'], ['琥珀', '#b38b4c'], ['紅', '#b35656'], ['青', '#428c99'], ['粉', '#bb6a8e'], ['棕', '#83654d']];
  const SKIN = ['#fff0e4', '#fde4cf', '#f7d6bd', '#ebc09f', '#d2a07c'];
  const CLOTH = [['紅', '#d06c74'], ['藍', '#6087c0'], ['黃', '#e3c068'], ['綠', '#82a97a'], ['紫', '#9184bc'], ['橘', '#dc9462'], ['黑', '#4a4a5a'], ['白', '#ffffff'], ['粉', '#e6aabd'], ['藏青', '#465685']];
  // 獸耳族的耳朵名稱
  const ANIMALS = { cat: { n: '貓' }, dog: { n: '狗' }, bear: { n: '熊' }, rabbit: { n: '兔子' }, fox: { n: '狐狸' } };

  // ---------- 表情：眼、眉、嘴、特效 ----------
  const EXPR = {
    happy: { n: '開心', eye: 'open', brow: 'up', mouth: 'laugh', blush: 1 },
    giggle: { n: '偷笑', eye: 'happy', brow: 'up', mouth: 'cat', blush: 1 },
    smug: { n: '得意', eye: 'half', brow: 'smug', mouth: 'smirk' },
    wink: { n: '眨眼', eye: 'wink', brow: 'up', mouth: 'tongue', blush: 1 },
    sparkle: { n: '兩眼發光', eye: 'star', brow: 'up', mouth: 'o', fx: ['sparkles'], blush: 1 },
    cry: { n: '大哭', eye: 'xx', brow: 'sad', mouth: 'wail', fx: ['tears'] },
    angry: { n: '生氣', eye: 'angry', brow: 'angry', mouth: 'grit', fx: ['anger'] },
    panic: { n: '慌張', eye: 'dot', brow: 'sad', mouth: 'wavy', fx: ['sweat', 'lines'] },
    dizzy: { n: '頭暈', eye: 'swirl', brow: 'sad', mouth: 'wavy', fx: ['stars'] },
    love: { n: '花癡', eye: 'heart', brow: 'up', mouth: 'laugh', fx: ['hearts'], blush: 1 },
    shock: { n: '嚇到', eye: 'shock', brow: 'up', mouth: 'bigO', fx: ['burst'] },
    sulk: { n: '不爽', eye: 'half', brow: 'flat', mouth: 'pout', fx: ['dots'] },
    xx: { n: '被逮到', eye: 'xx', brow: 'sad', mouth: 'shout', fx: ['sweat'] },
    evil: { n: '壞笑', eye: 'angry', brow: 'angry', mouth: 'grin', fx: ['shadow'] },
    sleepy: { n: '想睡', eye: 'closed', brow: 'flat', mouth: 'o', fx: ['zzz'] },
    teary: { n: '委屈', eye: 'teary', brow: 'sad', mouth: 'wavySmall', blush: 1 },
  };
  const POSES = { none: '無', wave: '揮手', peace: '比 YA', thumb: '比讚', cheeks: '捧臉', chin: '托下巴', cover: '摀嘴', fists: '握拳', idea: '豎指', cross: '雙手抱胸', pray: '拜託', head: '抱頭' };
  const POSE_FOR = {
    happy: ['wave', 'peace', 'fists', 'thumb', 'none'], giggle: ['cover', 'cover', 'none'], smug: ['cross', 'chin', 'thumb', 'none'], wink: ['peace', 'thumb', 'wave'],
    sparkle: ['cheeks', 'fists', 'pray'], cry: ['none', 'fists'], angry: ['fists', 'cross', 'none'], panic: ['head', 'cheeks', 'none'],
    dizzy: ['head', 'none'], love: ['cheeks', 'pray', 'none'], shock: ['cheeks', 'head', 'none'], sulk: ['cross', 'chin', 'none'],
    xx: ['head', 'none'], evil: ['chin', 'cover', 'cross', 'idea'], sleepy: ['none', 'chin'], teary: ['pray', 'none', 'fists'],
  };

  // ---------- 屬性（抽籤順序跟 v2 一樣，同一個種子的角色設定不變）----------
  function traits(seed) {
    const r = rng(seed * 7919 + 101);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const male = r() < 0.5;
    const ar = r(); const age = ar < 0.5 ? 'young' : ar < 0.82 ? 'mid' : 'old';
    const years = age === 'young' ? 18 + Math.floor(r() * 10) : age === 'mid' ? 30 + Math.floor(r() * 20) : 58 + Math.floor(r() * 18);
    const br = r(); const build = br < 0.25 ? 'thin' : br < 0.75 ? 'normal' : 'fat';
    let height = Math.round((male ? 172 : 159) + (r() + r() + r() - 1.5) * (male ? 14 : 11) - (age === 'old' ? 3 : 0));
    height = Math.max(146, Math.min(192, height));
    const kr = r();
    const kind = kr < 0.5 ? 'human' : kr < 0.7 ? 'kemo' : 'human'; // 原本擬人動物、外星人、鬼族的區段併回人類，其他種子的角色不變
    const hairPool = age === 'old' ? (r() < 0.75 ? HAIR_OLD : HAIR_NAT) : age === 'mid' ? (r() < 0.6 ? HAIR_NAT : HAIR_FUN) : (r() < 0.65 ? HAIR_FUN : HAIR_NAT);
    const t = { male, age, years, build, height, kind, hair: pick(hairPool), eye: pick(EYES), skin: pick(SKIN), cloth: pick(CLOTH), cloth2: pick(CLOTH) };
    if (kind === 'kemo') t.ears = pick(['cat', 'cat', 'fox', 'rabbit', 'bear', 'dog']);
    if (male) {
      t.back = 'short';
      t.front = age === 'old' ? pick(['short', 'bald', 'buzz', 'short']) : pick(['spiky', 'messy', 'short', 'short', 'side', 'buzz']);
      if (age === 'young' && r() < 0.1) t.back = 'pony';
    } else {
      t.back = age === 'old' ? pick(['bun', 'bob', 'short']) : pick(['long', 'long', 'bob', 'twin', 'pony', 'bun', 'curly']);
      t.front = pick(['soft', 'soft', 'hime', 'swept', 'center']);
    }
    if (t.front === 'bald' || t.front === 'buzz') t.back = 'none';
    t.clothes = pick(male ? ['hoodie', 'tee', 'shirt', 'jacket', 'sailor', 'turtle', 'aloha'] : ['hoodie', 'tee', 'shirt', 'jacket', 'sailor', 'turtle', 'yukata']);
    const fr = r();
    t.facial = male && age !== 'young' ? (fr < 0.2 ? 'stubble' : fr < 0.42 ? 'mustache' : fr < 0.55 ? 'beard' : null) : null;
    t.expr = pick(Object.keys(EXPR));
    t.pose = pick(POSE_FOR[t.expr]);
    t.fang = kind === 'kemo' && r() < 0.6;
    t.ahoge = age !== 'old' && r() < 0.3;
    const acc = []; const roll = r();
    if (roll < 0.08) acc.push('mask'); else if (roll < 0.14) acc.push('patch'); else if (roll < (age === 'old' ? 0.6 : 0.3)) acc.push('glasses'); else if (roll < (age === 'old' ? 0.66 : 0.38)) acc.push('shades');
    const r2 = r();
    const earsOnTop = kind === 'kemo';
    if (!earsOnTop && r2 < 0.12) acc.push('cap'); else if (!earsOnTop && r2 < 0.2) acc.push('beanie'); else if (!male && r2 < 0.42) acc.push(r() < 0.5 ? 'clip' : 'flower');
    if (r() < 0.18) acc.push('bandage');
    if (male && r() < 0.14) acc.push('scar');
    if (acc.includes('cap') || acc.includes('beanie')) t.ahoge = false;
    if (acc.includes('shades') && !['happy', 'giggle', 'smug', 'evil', 'angry', 'sulk'].includes(t.expr)) acc.splice(acc.indexOf('shades'), 1);
    if (acc.includes('patch') && ['wink', 'xx', 'swirl'].includes(EXPR[t.expr].eye)) acc.splice(acc.indexOf('patch'), 1);
    if (acc.includes('mask')) { t.facial = t.facial === 'stubble' ? 'stubble' : null; if (t.pose === 'cover') t.pose = 'none'; }
    t.acc = acc;
    return t;
  }

  // ---------- 版面（200 單位畫布，跟 girl-sample 同比例）----------
  // 頭髮外緣 x 33～167、頭頂 y 19；臉 x 49～151、下巴 y 159；眼睛 (100±24, 118)；腮紅 y 137；鼻 y 131；嘴 y 143；脖子 148～168；衣服 167 以下
  const EYE_Y = 118, EYE_X = 24, MOUTH_Y = 143, NOSE_Y = 131, BLUSH_Y = 137, BLUSH_X = 35, BROW_Y = 94;
  // 臉的下半：女生圓下巴、男生下顎比較方
  const LOW_F = 'M49,88 C49,114 53,134 69,147 C81,156 91,159 100,159 C109,159 119,156 131,147 C147,134 151,114 151,88';
  const LOW_M = 'M49,88 C49,118 51,137 62,148 C72,156 87,158 100,158 C113,158 128,156 138,148 C149,137 151,118 151,88';
  const faceD = (male, full) => (male ? LOW_M : LOW_F) + (full ? ' C153,46 130,22 100,22 C70,22 47,46 49,88Z' : ' C151,62 128,50 100,50 C72,50 49,62 49,88Z');
  const DOME = 'M37,112 C33,54 63,19 100,19 C137,19 167,54 163,112';

  // ---------- 眼睛 ----------
  // X(dx)：dx 正＝往外（眼尾）、負＝往內（鼻樑）
  function eye(side, kind, t, lidCol, gx) {
    const cx = 100 + side * EYE_X, cy = EYE_Y, X = (dx) => cx + side * dx;
    const ec = t.eye[1], ecL = shade(ec, 0.45), pup = shade(ec, -0.62);
    // 男生：眼睛小一點、扁一點，眼線平直、沒有眼尾翹
    const liner = t.male
      ? L(`M${X(13.5)},${cy - 2} Q${X(12)},${cy - 13.5} ${cx},${cy - 14} Q${X(-10)},${cy - 14} ${X(-13.5)},${cy - 9}`, 4.4, LINER)
      : L(`M${X(14.5)},${cy - 5} Q${X(12)},${cy - 17} ${cx},${cy - 17} Q${X(-10)},${cy - 17} ${X(-14.5)},${cy - 11}`, 4, LINER) + L(`M${X(13.5)},${cy - 8} L${X(18.5)},${cy - 10.5}`, 2.4, LINER);
    const openEye = () => {
      const ix = cx - side * 1 + gx;
      return (t.male ? (s) => G(`translate(${cx} ${cy + 2}) scale(0.9 0.8) translate(${-cx} ${-cy - 2})`, s) : (s) => s)(EF(cx, cy, 14, 17, '#fff')
        + EF(ix, cy + 2.5, 11, 14.5, ec)
        + F(`M${ix - 9.5},${cy + 7} Q${ix},${cy + 19} ${ix + 9.5},${cy + 7} Q${ix + 7},${cy + 16.5} ${ix},${cy + 16.5} Q${ix - 7},${cy + 16.5} ${ix - 9.5},${cy + 7}Z`, ecL)
        + EF(ix, cy - 1.5, 6.6, 8.6, pup)
        + `<circle cx="${ix + 5}" cy="${cy - 6.5}" r="4.5" fill="#fff"/><circle cx="${ix - 5}" cy="${cy + 9}" r="1.9" fill="#fff"/>`);
    };
    const arcUp = () => L(`M${X(-13)},${cy + 3} Q${cx},${cy - 13} ${X(13)},${cy + 3}`, 4, LINER) + (t.male ? '' : L(`M${X(12.5)},${cy + 1.5} L${X(17)},${cy - 1}`, 2.4, LINER));
    const arcDown = () => L(`M${X(-13)},${cy + 1} Q${cx},${cy + 11} ${X(13)},${cy + 1}`, 4, LINER) + (t.male ? '' : L(`M${X(12.5)},${cy + 2} L${X(17)},${cy + 4.5}`, 2.4, LINER));
    switch (kind) {
      case 'happy': return arcUp();
      case 'closed': return arcDown();
      case 'wink': return side > 0 ? arcUp() : openEye() + liner;
      case 'teary': return openEye() + liner + L(`M${cx - 10},${cy + 13} q5,3.5 10,0 t10,0`, 2, '#5fa8e0')
        + P(`M${X(-8)},${cy + 15} q${-3.5 * side},5.5 0,8 q${3.5 * side},-2.5 0,-8Z`, '#8fcaf2', 'stroke-width="1.4"');
      case 'half': case 'angry': {
        const lo = kind === 'half' ? cy - 3 : cy - 12, li = cy - 2;
        return openEye() + F(`M${X(-17)},${cy - 26} L${X(22)},${cy - 26} L${X(22)},${lo} Q${cx},${(lo + li) / 2 - 3} ${X(-17)},${li} Z`, lidCol)
          + L(`M${X(-14.5)},${li} Q${cx},${(lo + li) / 2 - 3} ${X(15)},${lo}`, 4, LINER) + (t.male ? '' : L(`M${X(14.5)},${lo} L${X(19)},${lo - 2.5}`, 2.4, LINER));
      }
      case 'star': return star5(cx, cy + 1, 15) + `<circle cx="${cx - 3.5}" cy="${cy - 3}" r="2" fill="#fff"/>`;
      case 'heart': return heart(cx, cy - 1, 1.6);
      case 'xx': return L(`M${cx + side * 12},${cy - 10} L${cx - side * 10},${cy} L${cx + side * 12},${cy + 10}`, 4.5, LINER);
      case 'dot': return EF(cx, cy + 1, 4.2, 5.6, LINER) + `<circle cx="${cx + 1.2}" cy="${cy - 1.2}" r="1.4" fill="#fff"/>` + L(`M${X(-11)},${cy - 9} Q${cx},${cy - 14} ${X(11)},${cy - 9}`, 2, LINER);
      case 'shock': return E(cx, cy, 12.5, 15, '#fff', 'stroke-width="2"') + EF(cx, cy + 1, 2.6, 3.2, LINER) + liner;
      case 'swirl': return L(`M${cx},${cy + 1} m-1.3,0 a1.3,1.3 0 1,1 2.6,0 a3.9,3.9 0 1,1 -7.8,0 a6.5,6.5 0 1,1 13,0 a9.1,9.1 0 1,1 -18.2,0`, 2.2, LINER);
      default: return openEye() + liner;
    }
  }
  function brows(kind, col, male) {
    const w = male ? 3 : 2, y = BROW_Y;
    const one = (side) => {
      const cx = 100 + side * 26, i = cx - side * 10, o = cx + side * 10;
      switch (kind) {
        case 'up': return L(`M${i},${y} Q${cx},${y - 5} ${o},${y}`, w, col);
        case 'angry': return L(`M${i},${y + 5} Q${cx},${y} ${o},${y - 3}`, w + 0.3, col);
        case 'sad': return L(`M${i},${y - 3} Q${cx},${y - 2} ${o},${y + 3}`, w, col);
        case 'flat': return L(`M${i},${y} L${o},${y}`, w, col);
        case 'smug': return side < 0 ? L(`M${i},${y + 3} L${o},${y - 2}`, w, col) : L(`M${i},${y - 3} Q${cx},${y - 7} ${o},${y - 2}`, w, col);
        default: return L(`M${i},${y + 1} Q${cx},${y - 3} ${o},${y + 1}`, w, col);
      }
    };
    return one(-1) + one(1);
  }
  // 嘴：照 girl-sample 用暗紅線，張嘴的才有填色
  function mouth(kind, fang) {
    const y = MOUTH_Y, M = (d, w = 1.9) => L(d, w, LIP);
    const PM = (d, fill) => `<path d="${d}" fill="${fill}" stroke="${LIP}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
    const f = fang ? F(`M101.5,${y + 0.5} l1.6,3.4 l1.6,-3.4Z`, '#fff', `stroke="${LIP}" stroke-width="1"`) : '';
    switch (kind) {
      case 'cat': return M(`M94,${y - 1} Q97,${y + 2.5} 100,${y} Q103,${y + 2.5} 106,${y - 1}`) + f;
      case 'laugh': return PM(`M94,${y - 1.5} Q100,${y - 0.5} 106,${y - 1.5} Q105,${y + 6.5} 100,${y + 6.5} Q95,${y + 6.5} 94,${y - 1.5}Z`, MOUTH_IN) + F(`M96.5,${y + 4} Q100,${y + 2} 103.5,${y + 4} Q102,${y + 5.6} 100,${y + 5.6} Q98,${y + 5.6} 96.5,${y + 4}Z`, TONGUE) + (fang ? F(`M95.6,${y - 1.2} L97,${y + 1.6} L98.2,${y - 1}Z`, '#fff') : '');
      case 'o': return PM(`M100,${y - 3} A2.7,3.4 0 1 1 100,${y + 3.8} A2.7,3.4 0 1 1 100,${y - 3}Z`, MOUTH_IN);
      case 'bigO': return EF(100, y + 2, 4.8, 6.2, MOUTH_IN, `stroke="${LIP}" stroke-width="1.8"`) + EF(100, y + 5.2, 2.8, 1.9, TONGUE);
      case 'wail': return PM(`M91,${y - 2} Q95.5,${y - 5} 100,${y - 2} Q104.5,${y - 5} 109,${y - 2} Q108,${y + 8} 100,${y + 8} Q92,${y + 8} 91,${y - 2}Z`, MOUTH_IN) + F(`M95,${y + 5} Q100,${y + 2} 105,${y + 5} Q103,${y + 7.4} 100,${y + 7.4} Q97,${y + 7.4} 95,${y + 5}Z`, TONGUE);
      case 'shout': return PM(`M92,${y - 3} Q100,${y - 5} 108,${y - 3} Q107,${y + 6} 100,${y + 6} Q93,${y + 6} 92,${y - 3}Z`, MOUTH_IN) + F(`M95,${y + 3} Q100,${y} 105,${y + 3} Q103,${y + 5.4} 100,${y + 5.4} Q97,${y + 5.4} 95,${y + 3}Z`, TONGUE) + F(`M94.5,${y - 3.2} L96.5,${y + 0.5} L98,${y - 3.7}Z`, '#fff');
      case 'grit': return PM(`M92,${y - 2.5} L108,${y - 2.5} Q108,${y + 4.5} 100,${y + 4.5} Q92,${y + 4.5} 92,${y - 2.5}Z`, '#fff') + L(`M92.5,${y + 0.8} L107.5,${y + 0.8} M96,${y - 2.5} L96,${y + 4} M100,${y - 2.5} L100,${y + 4.5} M104,${y - 2.5} L104,${y + 4}`, 1, LIP);
      case 'wavy': return M(`M93,${y} q1.75,-2.4 3.5,0 t3.5,0 t3.5,0 t3.5,0`, 1.7);
      case 'wavySmall': return M(`M95,${y} q1.25,-2 2.5,0 q1.25,2 2.5,0 q1.25,-2 2.5,0 q1.25,2 2.5,0`, 1.6);
      case 'smirk': return M(`M95,${y} Q101,${y + 3} 106,${y - 3}`) + f;
      case 'pout': return M(`M96,${y + 2} L100,${y - 2} L104,${y + 2}`);
      case 'tongue': return F(`M99,${y + 0.5} Q101,${y + 6.5} 104.5,${y + 1}Z`, TONGUE, `stroke="${LIP}" stroke-width="1.3"`) + M(`M95,${y - 1} Q99,${y + 2.5} 104,${y - 1}`);
      case 'grin': return PM(`M91,${y - 3} Q100,${y + 1} 109,${y - 3} Q107,${y + 5} 100,${y + 5} Q93,${y + 5} 91,${y - 3}Z`, '#fff') + L(`M93,${y} Q100,${y + 2.5} 107,${y}`, 1, LIP);
      default: return M(`M96,${y} Q100,${y + 3.5} 104,${y}`) + f;
    }
  }
  function fx(list) {
    let s = '';
    for (const k of list || []) {
      if (k === 'sweat') s += G('translate(160 84)', P('M0,-10 C4.5,-3 6.5,1 6.5,5 A6.5,6.5 0 0 1 -6.5,5 C-6.5,1 -4.5,-3 0,-10Z', '#9fd4fa', 'stroke-width="1.8"') + `<circle cx="-2.2" cy="4" r="1.6" fill="#fff"/>`);
      if (k === 'lines') s += L('M58,126 l-2,6 M63,126 l-2,6 M68,126 l-2,6', 1.4);
      if (k === 'anger') s += G('translate(160 56)', L('M-8,-3 Q-3,-3 -3,-8 M3,-8 Q3,-3 8,-3 M8,3 Q3,3 3,8 M-3,8 Q-3,3 -8,3', 3, '#e04a5a'));
      if (k === 'sparkles') s += star4(22, 54, 8) + star4(178, 42, 6) + star4(184, 100, 4.5);
      if (k === 'stars') s += star5(36, 26, 6) + star5(100, 10, 6) + star5(164, 26, 6);
      if (k === 'hearts') s += heart(20, 58, 1) + heart(178, 42, 0.85) + heart(184, 96, 0.6);
      if (k === 'tears') s += [-1, 1].map((sd) => { const x = 100 + sd * EYE_X; return P(`M${x - 9},${EYE_Y + 8} L${x + 9},${EYE_Y + 8} C${x + 8},${EYE_Y + 18} ${x + 11},${EYE_Y + 28} ${x + 9},${EYE_Y + 40} L${x - 9},${EYE_Y + 40} C${x - 11},${EYE_Y + 28} ${x - 8},${EYE_Y + 18} ${x - 9},${EYE_Y + 8}Z`, '#7cc4f2', 'stroke-width="1.8"'); }).join('');
      if (k === 'burst') s += L('M166,36 l8,-9 M174,50 l11,-3 M156,30 l2,-11', 2.6);
      if (k === 'dots') s += [[162, 46], [172, 37], [182, 28]].map(([x, y]) => E(x, y, 3.4, 3.4, '#fff', 'stroke-width="1.8"')).join('');
      if (k === 'zzz') s += L('M156,42 h10 l-10,10 h10 M172,26 h7 l-7,7 h7', 2.4);
      if (k === 'shadow') s += L('M64,64 v-12 M72,62 v-14 M80,64 v-12', 2.4, '#6a52a0');
    }
    return s;
  }

  // ---------- 頭髮 ----------
  // 瀏海：tips 由右到左的髮尖（第一個、最後一個是臉側的髮尾）、notch 髮尖之間的凹口
  const TOP = 'M41,110 C37,56 66,24 100,24 C134,24 163,56 159,110';
  const SPIKY_TOP = 'M41,110 L28,90 L43,84 L32,60 L56,62 L58,36 L80,46 L100,16 L120,46 L142,36 L144,62 L168,60 L157,84 L172,90 L159,110';
  function bangs(tips, notch, top = TOP) {
    const T0 = tips[0], TN = tips[tips.length - 1];
    let d = top + ` C158,116 ${T0[0] + 2},${T0[1] - 3} ${T0[0]},${T0[1]}`;
    for (let i = 0; i < notch.length; i++) {
      const T = tips[i], N = notch[i], U = tips[i + 1];
      d += ` C${T[0] - 3},${T[1] - 12} ${N[0] + 4},${N[1] + 4} ${N[0]},${N[1]}`;
      d += ` C${N[0] - 2},${N[1] + 7} ${U[0] + 4},${U[1] - 6} ${U[0]},${U[1]}`;
    }
    return d + ` C${TN[0] - 2},${TN[1] - 3} 42,116 41,110Z`;
  }
  const FRONTS = {
    // 空氣瀏海：細細碎碎的六束，縫隙深、看得到額頭
    soft: { side: 'long', tips: [[153, 125], [136, 100], [118, 103], [100, 99], [82, 103], [64, 100], [47, 125]], notch: [[146, 84], [127, 80], [109, 82], [91, 82], [73, 80], [54, 84]] },
    // 公主切：齊瀏海一刀平，兩側鬢角也是平切
    hime: { side: 'hime', tips: [[154, 126], [133, 100], [111, 100.5], [89, 100.5], [67, 100], [46, 126]], notch: [[140, 97], [122, 97.5], [100, 97.5], [78, 97.5], [60, 97]] },
    // 斜瀏海：直接用 girl-sample 的那片（左邊分線，左一束往左撥、右兩束往右斜蓋）
    swept: { side: 'long', path: 'M41,112 C37,58 66,24 100,24 C134,24 163,58 159,112 C158,118 156,122 153,125 C149,108 140,96 125,85 C123,91 121,96 118,101 C104,98 90,88 81,70 C76,82 62,100 54,116 C51,121 49,124 47,125 C44,121 42,117 41,112Z',
      strands: 'M88,52 C96,72 106,84 116,92 M114,50 C124,66 134,78 144,92' },
    // 中分：兩片窗簾往兩邊撥開，額頭中間露出來
    center: { side: 'long', path: 'M41,112 C37,58 66,24 100,24 C134,24 163,58 159,112 C158,118 156,122 153,125 C151,104 136,78 120,64 C112,57 104,50 100,44 C96,50 88,57 80,64 C64,78 49,104 47,125 C44,121 42,117 41,112Z',
      strands: 'M93,38 C80,54 66,76 58,104 M107,38 C120,54 134,76 142,104' },
    short: { side: 'short', tips: [[153, 112], [130, 99], [108, 102], [86, 99], [64, 101], [47, 112]], notch: [[142, 86], [120, 84], [97, 86], [75, 84], [56, 88]] },
    side: { side: 'short', tips: [[153, 106], [134, 100], [112, 102], [88, 100], [64, 98], [47, 110]], notch: [[144, 84], [124, 86], [100, 88], [76, 86], [54, 88]] },
    messy: { side: 'short', tips: [[154, 112], [140, 98], [124, 104], [110, 94], [96, 104], [82, 94], [68, 102], [46, 110]], notch: [[147, 88], [132, 86], [117, 88], [103, 82], [89, 88], [75, 82], [58, 88]] },
    spiky: { side: 'short', top: SPIKY_TOP, tips: [[153, 110], [128, 100], [104, 94], [80, 100], [47, 110]], notch: [[142, 86], [116, 84], [92, 82], [64, 86]] },
  };
  const FRONT_NAME = { soft: '空氣瀏海', hime: '公主切', swept: '斜瀏海', center: '中分', short: '短髮', side: '旁分短髮', messy: '亂髮', spiky: '刺蝟頭', buzz: '平頭', bald: '光頭' };
  const BACK_NAME = { long: '長髮', bob: '鮑伯頭', twin: '雙馬尾', pony: '馬尾', bun: '包頭', curly: '捲髮', short: '短髮' };
  // 後髮比前髮暗一階（girl-sample：#2f3f6e / #3e5186）
  const backCol = (c) => shade(c, -0.22);
  function backHair(k, c) {
    const d = backCol(c);
    const SHORT = `${DOME} C164,124 160,134 154,140 L46,140 C40,134 36,124 37,112Z`;
    switch (k) {
      case 'long': return P(`${DOME} C162,148 167,176 165,200 L165,232 L35,232 L35,200 C33,176 38,148 37,112Z`, d);
      case 'bob': return P(`${DOME} C164,130 168,150 164,164 C152,168 140,166 134,160 L66,160 C60,166 48,168 36,164 C32,150 36,130 37,112Z`, d);
      case 'curly': return P(`${DOME} C166,130 168,150 164,168 L36,168 C32,150 34,130 37,112Z`, d)
        + [[38, 170], [162, 170], [44, 192], [156, 192]].map(([x, y]) => E(x, y, 15, 15, d)).join('');
      case 'twin': return both(P('M48,58 C18,62 6,104 14,146 C18,168 30,180 26,198 C46,188 50,162 46,138 C42,116 48,94 58,76Z', d) + E(48, 68, 6, 6, '#ff8aa6', 'stroke-width="1.8"')) + P(SHORT, d);
      case 'pony': return P('M150,46 C186,52 194,100 184,140 C178,164 186,178 176,196 C164,180 158,158 160,128 C162,102 158,78 144,62Z', d) + P(SHORT, d);
      case 'bun': return E(100, 20, 20, 16, d) + P(SHORT, d);
      case 'short': return P(SHORT, d);
      default: return '';
    }
  }
  // 垂在臉兩側、肩膀前的髮束（長髮系才有）
  function sideLocks(c, back, hime) {
    const long = back === 'long' || back === 'curly' || back === 'twin';
    const lock = hime ? 'M43,92 C40,118 41,138 43,154 L60,154 C57,138 57,124 59,112 Z' : long
      ? 'M43,92 C39,130 39,162 45,195 C50,197 56,196 61,192 C56,164 56,134 59,112 Z'
      : 'M43,92 C40,118 41,138 45,156 C50,158 56,157 60,153 C57,138 57,124 59,112 Z';
    return both(P(lock, c));
  }
  function frontHair(t, c, ahoge) {
    const Lt = shade(c, 0.38);
    if (t.front === 'bald') return '';
    if (t.front === 'buzz') return P('M49,96 C45,52 70,24 100,24 C130,24 155,52 151,96 C142,78 124,70 100,70 C76,70 58,78 49,96Z', c)
      + L('M66,44 Q82,33 97,31 M111,32 Q124,34 134,42', 3, Lt);
    const f = FRONTS[t.front];
    let s = f.side === 'short' ? '' : sideLocks(c, t.back, f.side === 'hime');
    s += P(f.path || bangs(f.tips, f.notch, f.top), c);
    // 髮絲線（凹口往上延伸）＋頭頂兩道亮色髮光
    s += f.strands ? L(f.strands, 1.6)
      : f.notch.filter((N) => N[1] > 60 && N[1] < 95).map((N) => L(`M${N[0] - 6},${N[1] - 30} C${N[0] - 2},${N[1] - 18} ${N[0]},${N[1] - 8} ${N[0]},${N[1]}`, 1.6)).join('');
    if (f.side === 'hime') s += L('M60,60 C62,72 64,86 66,97 M100,52 L100,97 M140,60 C138,72 136,86 134,97', 1.6);
    s += L('M64,46 Q80,33 97,31', 3.2, Lt) + L('M111,32 Q126,34 138,44', 3.2, Lt);
    if (ahoge) s += P('M100,26 C95,12 104,7 114,10 C106,13 105,18 106,26Z', c, 'stroke-width="1.8"');
    return s;
  }

  // ---------- 耳朵 ----------
  function kemoEars(k, c, back) {
    const D = shade(c, -0.2), pink = '#f9b8c0';
    // 耳朵往上、往外放大，大部分露在頭髮外面，40px 也看得出來
    const at = (s) => both(G('translate(2 -4) scale(1.1)', s));
    switch (k) {
      case 'cat': return back ? at(P('M34,60 C31,42 30,24 33,10 C35,5 39,5 43,8 C54,16 64,26 72,36 Z', c) + F('M39,50 C37,38 37,26 38,17 C47,23 56,31 62,38 Z', pink)) : '';
      case 'fox': return back ? at(P('M32,62 C26,42 22,20 24,6 C36,8 58,20 72,36Z', c) + F('M37,52 C33,38 31,24 31,15 C42,19 54,28 62,38Z', '#fff4ea')) : '';
      case 'rabbit': return back ? both(P('M58,46 C48,22 50,3 63,3 C76,3 82,22 80,44Z', '#fff') + F('M62,40 C55,24 57,10 63,10 C70,10 74,24 75,40Z', pink)) : '';
      case 'bear': return back ? both(E(46, 34, 17, 17, c) + EF(46, 34, 8.5, 8.5, D)) : '';
      case 'dog': return back ? '' : both(G('translate(14 18)', P('M36,46 C16,48 8,82 16,106 C26,110 36,94 46,64Z', D)));
      default: return '';
    }
  }

  // ---------- 手勢 ----------
  // 本地座標：掌心在 (0,0)，手指朝上（-y），袖子往 +y 延伸；side=1 右手（拇指在左）
  // cuffOnly：手臂另外畫（jointed），這裡只畫袖口
  function hand(kind, skin, cloth, cuffOnly) {
    const sleeve = (cuffOnly ? '' : CAP(0, 14, 0, 160, 16, cloth)) + CAP(0, 13, 0, cuffOnly ? 18 : 16, 18, shade(cloth, -0.12));
    const palm = (rx = 9, ry = 9) => E(0, 1, rx, ry, skin);
    const palmFill = (rx = 9, ry = 9) => EF(0, 1, rx - 1.3, ry - 1.3, skin);
    const fing = (x, ang, len, w = 5.4) => { const a = (ang * Math.PI) / 180; return CAP(x, -4, x + Math.sin(a) * len, -4 - Math.cos(a) * len, w, skin); };
    const thumbSide = (ang = -60, len = 9) => { const a = (ang * Math.PI) / 180; return CAP(-7, 3, -7 + Math.sin(a) * len, 3 - Math.cos(a) * len, 5.6, skin); };
    // 拳頭是手背朝鏡頭：上緣四顆指節＋指縫線，看不到拇指
    const knuckles = L('M-7,-4.5 q1.75,-2.6 3.5,0 q1.75,-2.6 3.5,0 q1.75,-2.6 3.5,0 q1.75,-2.6 3.5,0', 1.3) + L('M-3.5,-4.5 v4 M0,-4.5 v4.5 M3.5,-4.5 v4', 1.1);
    switch (kind) {
      case 'open': return sleeve + palm() + fing(-6, -14, 9) + fing(-2, -5, 11) + fing(2, 4, 10.5) + fing(6, 13, 8.5) + thumbSide() + palmFill();
      case 'fist': return sleeve + palm(9.5, 8.5) + palmFill(9.5, 8.5) + knuckles;
      case 'peace': return sleeve + palm() + fing(-3, -12, 13) + fing(2.6, 10, 13) + palmFill() + L('M-1,-5 q1.8,-2.6 3.6,0 M2.6,-5 q1.8,-2.6 3.6,0', 1.2) + CAP(-6.5, 3.5, -3, 1.5, 4.8, skin);
      case 'thumb': return sleeve + CAP(-4.5, -2, -6, -16, 5.8, skin) + palm(9.5, 8.5) + palmFill(9.5, 8.5) + L('M-5,-3 h10 M-5,1 h10 M-5,5 h9', 1.2); // 拇指在拳頭後面
      case 'point': return sleeve + palm(9, 8.5) + fing(-2, -3, 14) + palmFill(9, 8.5) + L('M1.5,-4.5 q1.75,-2.6 3.5,0 q1.75,-2.6 3.5,0', 1.3) + L('M5,-4.5 v4', 1.1); // 手背朝鏡頭，看不到拇指
      default: return '';
    }
  }
  const put = (x, y, rot, side, s, inner) => G(`translate(${x} ${y}) rotate(${rot}) scale(${side * s} ${s})`, inner);
  // 有關節的手臂：肩膀 → 手肘 → 手腕，一條連續的袖子（先畫整條描邊再填色，手肘不會有接縫）
  const SHOULDER = [134, 181];
  const limb = (d, w, fill) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + SW * 2}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round"/>`;
  // H＝手的位置、E＝手肘位置（都用右手座標寫；side=-1 時自動左右鏡射）
  // 手臂是一條圓滑的弧線（二次曲線，剛好在中間經過手肘），手肘不會有硬角；手順著弧線末端的方向轉
  function jointed(kind, H, E, side, s, skin, cloth) {
    const m = (p) => (side < 0 ? [200 - p[0], p[1]] : p);
    const h = m(H), e = m(E), sh = m(SHOULDER);
    const c = [2 * e[0] - (sh[0] + h[0]) / 2, 2 * e[1] - (sh[1] + h[1]) / 2].map((v) => +v.toFixed(1));
    const rot = (Math.atan2(-(c[0] - h[0]), c[1] - h[1]) * 180) / Math.PI;
    return limb(`M${sh} Q${c} ${h}`, 14, cloth) + put(h[0], h[1], rot.toFixed(1), side, s, hand(kind, skin, cloth, true));
  }
  function pose(k, skin, cloth) {
    const H = (kind) => hand(kind, skin, cloth);
    const J = (kind, h, e, side = 1, s = 0.92) => jointed(kind, h, e, side, s, skin, cloth);
    switch (k) {
      // 舉起來的手都從肩膀接出去，不會跟身體分開
      case 'wave': return J('open', [166, 126], [175, 186]);
      case 'peace': return J('peace', [163, 144], [173, 192]);
      case 'thumb': return J('thumb', [160, 176], [164, 200]);
      case 'cheeks': return J('open', [143, 149], [154, 200], -1, 0.88) + J('open', [143, 149], [154, 200], 1, 0.88);
      case 'chin': return put(112, 169, -28, 1, 0.88, H('fist'));
      case 'cover': return put(100, 149, 4, 1, 0.86, H('open'));
      case 'fists': return put(70, 189, 6, -1, 0.92, H('fist')) + put(130, 189, -6, 1, 0.92, H('fist'));
      case 'idea': return J('point', [163, 142], [173, 192]);
      case 'pray': return put(96, 187, 8, -1, 0.88, H('open')) + put(104, 187, -8, 1, 0.88, H('open'));
      case 'head': return J('open', [157, 72], [183, 126], -1, 0.9) + J('open', [157, 72], [183, 126], 1, 0.9);
      case 'cross': {
        const c2 = shade(cloth, -0.12);
        return CAP(36, 214, 130, 189, 17, c2) + E(133, 189, 7, 6, skin) + CAP(164, 214, 70, 191, 17, cloth) + E(67, 191, 7, 6, skin);
      }
      default: return '';
    }
  }

  // ---------- 衣服（body → neck → 領口細節）----------
  function clothes(k, c, c2, neck) {
    const body = P('M52,232 L52,200 C52,182 64,171 86,167 L114,167 C136,171 148,182 148,200 L148,232Z', c); // 往下延伸到畫面外，通緝照依身高上移時底下不會露空
    const white = c === '#ffffff';
    const sl = white ? '#c9cdd6' : shade(c, -0.15), dark = white ? '#b3b8c3' : shade(c, -0.25), light = shade(c, 0.35);
    const acc2 = c2 === c ? (white ? '#5d76ad' : '#ffffff') : c2; // 胸前小圖案用的第二色
    const sleeves = P('M52,232 L52,200 C52,185 59,175 71,169 L85,232Z', sl) + P('M148,232 L148,200 C148,185 141,175 129,169 L115,232Z', sl);
    const collar = (col) => L('M86,167 Q100,182 114,167', 4, col);
    switch (k) {
      case 'hoodie': return body + P('M72,170 C78,182 90,188 100,190 C110,188 122,182 128,170 C122,166 116,166 114,167 L86,167 C84,166 78,166 72,170Z', dark) + neck
        + L('M94,182 L93,196 M106,182 L107,196', 1.8) + E(93, 197, 1.8, 1.8, '#fff', 'stroke-width="1.2"') + E(107, 197, 1.8, 1.8, '#fff', 'stroke-width="1.2"');
      case 'tee': return body + sleeves + neck + collar(dark) + star4(120, 188, 5.5, acc2);
      case 'shirt': return body + neck + P('M86,167 L100,180 L114,167 L120,176 L104,186 L100,182 L96,186 L80,176Z', '#fff') + P('M96,184 L100,181 L104,184 L107,198 L100,204 L93,198Z', c2)
        + L('M120,186 h11 v9 h-11Z', 1.6, dark);
      case 'jacket': return body + P('M86,167 L100,196 L114,167Z', '#fff') + neck + L('M86,167 L96,200 L96,232 M114,167 L104,200 L104,232', 2.2) + L('M68,186 v10 M132,186 v10', 1.6, dark)
        + E(118, 184, 3.6, 3.6, acc2, 'stroke-width="1.6"');
      case 'sailor': return body + neck + P('M62,180 L86,167 L100,186 L114,167 L138,180 L128,192 L100,200 L72,192Z', '#44558a') + L('M68,183 L100,197 L132,183', 1.6, '#fff')
        + P('M100,190 L90,184 L89,194Z M100,190 L110,184 L111,194Z', '#e0606c', 'stroke-width="1.6"');
      case 'turtle': return body + sleeves + neck + P('M84,160 Q100,166 116,160 L118,176 Q100,183 82,176Z', light)
        + L('M90,164 v12 M100,166 v13 M110,164 v12', 1.4, shade(light, -0.25)) + L('M70,190 Q100,196 130,190', 1.4, dark);
      case 'aloha': return body + neck + P('M86,167 L100,184 L114,167 L120,176 L100,194 L80,176Z', light)
        + [[68, 188], [132, 190], [122, 182]].map(([x, y]) => EF(x, y, 3.8, 3.8, '#fff') + EF(x, y, 1.5, 1.5, '#f2c84a')).join('');
      case 'yukata': return body + neck + P('M86,167 L116,200 L104,200 L82,173Z', light) + P('M114,167 L98,190 L92,184 L108,167Z', light) + P('M57,190 L143,190 L145,202 L55,202Z', c2);
      default: return body + neck + collar(dark);
    }
  }

  // ---------- 主繪圖 ----------
  function svg(seed, opt = {}) {
    const t = { ...traits(seed) };
    if (opt.expr && EXPR[opt.expr]) t.expr = opt.expr;
    if (opt.pose && POSES[opt.pose]) t.pose = opt.pose;
    if (opt.plain) t.acc = t.acc.filter((k) => !['mask', 'shades', 'patch'].includes(k));
    const ex = EXPR[t.expr];
    const A = (k) => t.acc.includes(k);
    const face = t.skin;
    const hc = t.hair[1];
    const gx = (seed % 3) - 1;
    const cloth = t.cloth[1], cloth2 = t.cloth2[1];
    const w = t.build === 'fat' ? 1.07 : t.build === 'thin' ? 0.95 : 1;
    const W = (s) => G(`matrix(${w} 0 0 1 ${100 - 100 * w} 0)`, s);
    const bareHead = t.front === 'bald' || t.front === 'buzz';
    const shortSide = bareHead || FRONTS[t.front]?.side === 'short';
    // 唯一的陰影：下巴落在脖子上的影子
    const shadowCol = mix(face, '#d9805c', 0.3);
    const neck = P('M88.9,148 L88.9,168 Q100,176.5 111.1,168 L111.1,148Z', face) + F('M90,148 L110,148 L110,162 Q100,169 90,162Z', shadowCol);
    let s = '';
    if (opt.bg) s += `<circle cx="100" cy="100" r="96" fill="${opt.bg}"/>`;
    // 1. 後面：後髮、獸耳
    s += backHair(t.back, hc);
    if (t.kind === 'kemo') s += kemoEars(t.ears, hc, true);
    // 2. 身體＋脖子＋領口
    s += W(clothes(t.clothes, cloth, cloth2, neck));
    // 3. 耳朵（短髮露出人耳）
    if (shortSide && t.kind !== 'kemo') s += both(E(48, 121, 7, 10, face) + L('M47,116 q3.5,4 0,9', 1.4));
    // 4. 臉
    s += W(P(faceD(t.male, bareHead), face));
    // 5. 五官：腮紅、眼、鼻、嘴、鬍子
    s += t.male && !ex.blush
      ? both(EF(100 - BLUSH_X, BLUSH_Y, 7.5, 3.8, BLUSH, 'opacity=".5"'))
      : both(EF(100 - BLUSH_X, BLUSH_Y, ex.blush ? 10 : 9, ex.blush ? 5.4 : 4.8, BLUSH, `opacity="${ex.blush ? 0.9 : 0.75}"`));
    s += eye(-1, ex.eye, t, face, gx) + eye(1, ex.eye, t, face, gx);
    s += `<circle cx="100" cy="${NOSE_Y}" r="1.3" fill="#c98472"/>`;
    if (t.age === 'old') s += both(L('M57,124 l-5,1 M58,129 l-4,3', 1.4));
    if (t.facial === 'beard') s += P('M52,130 C58,152 80,164 100,164 C120,164 142,152 148,130 C140,140 126,146 116,143 Q100,150 84,143 C74,146 60,140 52,130Z', hc);
    s += mouth(ex.mouth, t.fang && !['wail', 'grit', 'grin', 'bigO', 'o', 'shout'].includes(ex.mouth));
    if (t.facial === 'stubble') s += [[86, 150], [92, 153], [98, 154], [104, 154], [110, 153], [116, 150], [89, 147], [113, 147]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9" fill="${shade(face, -0.4)}"/>`).join('');
    if (t.facial === 'mustache') s += P('M100,137 C95,133 86,134 84,139 C90,138 95,140 100,138.5 C105,140 110,138 116,139 C114,134 105,133 100,137Z', hc, 'stroke-width="1.8"');
    // 6. 前髮
    s += frontHair(t, hc, t.ahoge);
    // 7. 眉毛（畫在瀏海上面）
    s += brows(ex.brow, shade(hc, -0.55), t.male);
    // 8. 頭上的東西
    if (t.kind === 'kemo') s += kemoEars(t.ears, hc, false);
    s += accessories(t);
    // 9. 手勢
    s += pose(t.pose, face, cloth);
    // 10. 特效
    s += fx(ex.fx);
    // 取景（跟舊版遊戲一致）：
    //   opt.full → 整張 200×200（樣品頁的表情、手勢一覽）
    //   opt.mug → 整張；沒有 tight 時再依身高上下移，對齊通緝照背景的身高尺（tight＝看板卡片，不移）
    //   其他（HUD、簡訊、監視器、結算列表）→ 裁到頭和肩膀，小尺寸也看得清楚臉
    const whole = opt.full || opt.mug; // 通緝照、看板卡片都看得到半身
    const dy = opt.mug && !opt.tight ? Math.max(-14, Math.min(14, (168 - t.height) * 0.5)) : 0;
    // 裁臉時對齊上緣：框比較寬（看板卡片）時從下面裁，頭頂不會被切掉
    const vb = whole ? '0 0 200 200' : '22 12 156 156';
    return `<svg class="avatar" viewBox="${vb}" preserveAspectRatio="${whole ? 'xMidYMid' : 'xMidYMin'} slice" xmlns="http://www.w3.org/2000/svg">${dy ? G(`translate(0 ${dy})`, s) : s}</svg>`;
  }

  function accessories(t) {
    let s = '';
    const A = (k) => t.acc.includes(k);
    const eL = 100 - EYE_X, eR = 100 + EYE_X, y = EYE_Y;
    if (A('glasses')) s += E(eL, y, 18, 17.5, 'none', 'stroke-width="2.4"') + E(eR, y, 18, 17.5, 'none', 'stroke-width="2.4"') + L(`M${eL + 18},${y - 3} Q100,${y - 7} ${eR - 18},${y - 3}`, 2.4) + L(`M${eL - 10},${y - 8} l5,-3 M${eR - 10},${y - 8} l5,-3`, 2, '#fff');
    if (A('shades')) { const lens = P(`M${eL - 19},${y - 12} L95,${y - 12} Q95,${y + 14} ${eL},${y + 14} Q${eL - 19},${y + 14} ${eL - 19},${y - 12}Z`, '#3a3646'); s += lens + mirror(lens) + L(`M95,${y - 10} L105,${y - 10}`, 2.6) + L(`M${eL - 10},${y - 6} l6,9 M${eR - 10},${y - 6} l6,9`, 2, '#7d7a8c'); }
    if (A('patch')) s += L('M42,92 L158,114', 2.4) + E(eR, y + 1, 15, 16, '#3a3646');
    if (A('mask') && t.pose !== 'cover') s += P('M56,130 Q100,122 144,130 L138,152 Q100,166 62,152Z', '#f6f6fa') + L('M68,137 Q100,131 132,137 M68,145 Q100,140 132,145', 1.3, '#c8c8d4') + L('M56,130 L46,122 M144,130 L154,122', 1.8);
    if (A('cap')) { const c = t.cloth2[1], D = shade(c, -0.18); s += P('M35,92 C33,46 63,16 100,16 C137,16 167,46 165,92 Q100,76 35,92Z', c) + P('M98,84 Q150,72 196,90 Q196,102 178,100 Q140,90 102,94Z', D) + E(100, 17, 5, 4, D) + L('M100,21 Q98,50 100,78', 1.4, shade(c, -0.3)); }
    if (A('beanie')) { const c = t.cloth2[1], D = shade(c, -0.18); s += P('M37,96 C37,44 66,18 100,18 C134,18 163,44 163,96Z', c) + P('M33,88 Q100,74 167,88 L169,104 Q100,90 31,104Z', D) + L('M50,86 v9 M70,82 v9 M90,80 v9 M110,80 v9 M130,82 v9 M150,86 v9', 1.3, shade(c, -0.35)) + E(100, 18, 9, 8, '#fff'); }
    if (A('clip')) s += G('rotate(-25 150 70)', P('M138,67 L162,67 Q165,70 162,73 L138,73 Q135,70 138,67Z', '#ff8aa6', 'stroke-width="1.8"') + P('M139,77 L161,77 Q164,80 161,83 L139,83 Q136,80 139,77Z', '#fff', 'stroke-width="1.8"'));
    if (A('flower')) s += G('translate(54 66)', [0, 72, 144, 216, 288].map((a) => E(Math.sin(a * Math.PI / 180) * 6.5, -Math.cos(a * Math.PI / 180) * 6.5, 5.5, 5.5, '#ffa58c', 'stroke-width="1.8"')).join('') + E(0, 0, 3.6, 3.6, '#ffe08a', 'stroke-width="1.8"'));
    if (A('bandage')) s += G('translate(140 142) rotate(-25)', P('M-10,-3.8 L10,-3.8 Q13,0 10,3.8 L-10,3.8 Q-13,0 -10,-3.8Z', '#f3d2a2', 'stroke-width="1.8"') + `<circle cx="-2.5" cy="0" r="1" fill="${O}"/><circle cx="2.5" cy="0" r="1" fill="${O}"/>`);
    if (A('scar')) s += L('M58,114 L68,140', 2.4, '#c25a5a') + L('M59,122 l6,-2 M62,131 l6,-2', 1.6, '#c25a5a');
    return s;
  }

  // ---------- 文字描述（海報、監視器比對用；跟 v2 相同）----------
  function describe(seed) {
    const t = traits(seed);
    const ACC = { mask: '口罩', patch: '眼罩', glasses: '眼鏡', shades: '墨鏡', cap: '棒球帽', beanie: '毛帽', clip: '髮夾', flower: '花朵髮飾', bandage: 'OK 繃', scar: '刀疤' };
    const FAC = { stubble: '鬍渣', mustache: '八字鬍', beard: '大鬍子' };
    const BLD = { thin: '瘦', normal: '中等身材', fat: '胖' };
    const KIND = { human: '人類', kemo: `${ANIMALS[t.ears]?.n || ''}耳族` };
    const hairName = t.male ? FRONT_NAME[t.front] : BACK_NAME[t.back];
    const CL = { hoodie: '連帽衫', tee: 'T 恤', shirt: '襯衫領帶', jacket: '外套', sailor: '水手服', turtle: '高領毛衣', aloha: '花襯衫', yukata: '浴衣' };
    return {
      male: t.male, sex: t.male ? '♂' : '♀', age: t.years, height: t.height, build: BLD[t.build], expr: EXPR[t.expr].n, pose: POSES[t.pose], kind: KIND[t.kind],
      line: `${t.years} 歲・${t.height} cm・${BLD[t.build]}`,
      tags: [KIND[t.kind], t.front === 'bald' ? '光頭' : `${t.hair[0]}${hairName}`, `${t.eye[0]}眼`, `${t.cloth[0]}色${CL[t.clothes]}`, ...(t.facial ? [FAC[t.facial]] : []), ...t.acc.map((a) => ACC[a])],
    };
  }
  function clues(seed) {
    const t = traits(seed);
    const ACC = { mask: '戴著口罩', patch: '右眼戴眼罩', glasses: '戴圓框眼鏡', shades: '戴墨鏡', cap: '戴棒球帽', beanie: '戴毛帽', clip: '頭上別著髮夾', flower: '頭上別著花朵髮飾', bandage: '臉上貼著 OK 繃', scar: '左臉有一道刀疤' };
    const FAC = { stubble: '滿臉鬍渣', mustache: '留八字鬍', beard: '留大鬍子' };
    const CL = { hoodie: '穿連帽衫', tee: '穿 T 恤', shirt: '穿襯衫打領帶', jacket: '穿外套', sailor: '穿水手服', turtle: '穿高領毛衣', aloha: '穿花襯衫', yukata: '穿浴衣' };
    const out = [];
    if (t.kind === 'kemo') out.push({ cat: 'kind', text: `頭上有${ANIMALS[t.ears].n}耳朵` });
    out.push({ cat: 'hair', text: t.front === 'bald' ? '光頭' : `${t.hair[0]}色${t.male ? FRONT_NAME[t.front] : BACK_NAME[t.back]}` });
    out.push({ cat: 'height', text: `身高約 ${Math.round(t.height / 5) * 5} 公分` });
    if (t.build !== 'normal') out.push({ cat: 'build', text: t.build === 'fat' ? '身材微胖' : '身材瘦削' });
    if (!t.acc.includes('shades') && !t.acc.includes('patch')) out.push({ cat: 'eye', text: `${t.eye[0]}色眼睛` });
    t.acc.forEach((a) => out.push({ cat: 'acc-' + a, text: ACC[a] }));
    if (t.facial) out.push({ cat: 'facial', text: FAC[t.facial] });
    out.push({ cat: 'age', text: `看起來 ${Math.floor(t.years / 10) * 10} 多歲` });
    out.push({ cat: 'cloth', text: `${t.cloth[0]}色${CL[t.clothes].slice(1)}`.replace(/^/, '穿') });
    return out;
  }

  g.Avatar3 = { svg, traits, describe, clues, EXPR, POSES };
  g.Avatar = g.Avatar3; // 遊戲（js/game.js）用的名字
})(window);
