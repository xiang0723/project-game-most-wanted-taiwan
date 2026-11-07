// 《全臺通緝令》介面圖示：自己畫的線條圖示（24×24，跟著文字顏色走），取代表情符號
// ICON(name, cls) → <svg>；CARD_ART() → 卡牌按鈕用的彩色插圖
(function (g) {
  const S = (body, vb = '0 0 24 24') => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const T = 'fill="currentColor" stroke="none" opacity=".22"'; // 淡色填滿（雙色調）
  const P = {
    // 詢問目擊者：人像＋對話框
    witness: `<circle cx="8" cy="9" r="3.2"/><path d="M2.5 20c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><path ${T} d="M13 3h8a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 21 10h-4l-2.5 2.2V10H13a1.5 1.5 0 0 1-1.5-1.5v-4A1.5 1.5 0 0 1 13 3z"/><path d="M13 3h8a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 21 10h-4l-2.5 2.2V10H13a1.5 1.5 0 0 1-1.5-1.5v-4A1.5 1.5 0 0 1 13 3z"/><path d="M15 6.5h4"/>`,
    // 調閱監視器：牆上的監視攝影機
    camera: `<path ${T} d="M3.5 7.5l12-3.6 1.6 5.2-12 3.6z"/><path d="M3.5 7.5l12-3.6 1.6 5.2-12 3.6z"/><path d="M17.1 9.1l3.4-1"/><path d="M9.5 11.1l1.3 4.4"/><path d="M10.8 15.5H6.5"/><path d="M4 15.5v5"/><circle cx="7" cy="8.2" r=".9" fill="currentColor"/>`,
    // 調閱通聯紀錄：手機＋訊號
    phone: `<rect ${T} x="4" y="5" width="9.5" height="16" rx="2"/><rect x="4" y="5" width="9.5" height="16" rx="2"/><path d="M7.5 18h2.5"/><path d="M16.5 7.5a4 4 0 0 1 0 5.5"/><path d="M19 5a7.5 7.5 0 0 1 0 10.5"/>`,
    // 聯絡線民：紳士帽＋墨鏡
    informant: `<path ${T} d="M6.5 9.5l1.2-5.2c.2-.8 1-1.2 1.8-.9l2.5.9 2.5-.9c.8-.3 1.6.1 1.8.9l1.2 5.2z"/><path d="M6.5 9.5l1.2-5.2c.2-.8 1-1.2 1.8-.9l2.5.9 2.5-.9c.8-.3 1.6.1 1.8.9l1.2 5.2"/><path d="M2.5 10h19"/><path ${T} d="M4.5 13.5h6v1.5a3 3 0 0 1-6 0zM13.5 13.5h6v1.5a3 3 0 0 1-6 0z"/><path d="M4.5 13.5h6v1.5a3 3 0 0 1-6 0zM13.5 13.5h6v1.5a3 3 0 0 1-6 0zM10.5 14h3"/>`,
    // 埋伏：望遠鏡
    wait: `<circle ${T} cx="6.5" cy="15.5" r="4"/><circle ${T} cx="17.5" cy="15.5" r="4"/><circle cx="6.5" cy="15.5" r="4"/><circle cx="17.5" cy="15.5" r="4"/><path d="M4 12l2-6.5h3.5l1 4M20 12l-2-6.5h-3.5l-1 4"/><path d="M10.5 14.5h3"/>`,
    // 封鎖：路障
    block: `<rect ${T} x="2.5" y="7" width="19" height="6" rx="1"/><rect x="2.5" y="7" width="19" height="6" rx="1"/><path d="M7 7l-3 6M12.5 7l-3 6M18 7l-3 6"/><path d="M5.5 13v7.5M18.5 13v7.5M3.5 20.5h4M16.5 20.5h4"/><path d="M5.5 7V4.5M18.5 7V4.5"/>`,
    // 攻堅：警示燈
    raid: `<path ${T} d="M6.5 18v-6a5.5 5.5 0 0 1 11 0v6z"/><path d="M6.5 18v-6a5.5 5.5 0 0 1 11 0v6"/><path d="M4 18h16v3H4z"/><path d="M12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4M2 11.5h2M20 11.5h2"/><path d="M10 12a2 2 0 0 1 2-2"/>`,
    // 搜索票：天秤
    warrant: `<path d="M12 3v17M8 20.5h8M5 6.5h14"/><path d="M5 6.5l-2.8 6.2M5 6.5l2.8 6.2M19 6.5l-2.8 6.2M19 6.5l2.8 6.2"/><path ${T} d="M2 12.7a3 3 0 0 0 6 0zM16 12.7a3 3 0 0 0 6 0z"/><path d="M2 12.7a3 3 0 0 0 6 0zM16 12.7a3 3 0 0 0 6 0z"/>`,
    // 筆記
    notes: `<path ${T} d="M6 2.5h11.5A1.5 1.5 0 0 1 19 4v16a1.5 1.5 0 0 1-1.5 1.5H6z"/><path d="M6 2.5h11.5A1.5 1.5 0 0 1 19 4v16a1.5 1.5 0 0 1-1.5 1.5H6z"/><path d="M6 2.5v19M3.5 6.5H6M3.5 12H6M3.5 17.5H6M10 7.5h5.5M10 11h5.5M10 14.5h3.5"/>`,
    // 更多
    more: `<circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/>`,
    // 卡牌：三張扇形展開，前面那張有星星
    cards: `<path ${T} d="M3.2 7.6l5.6-2 4.3 12-5.6 2z"/><path d="M3.2 7.6l5.6-2 4.3 12-5.6 2z"/><rect x="10" y="3" width="10" height="15" rx="1.6" transform="rotate(12 15 10.5)"/><path fill="currentColor" stroke="none" d="M15.3 7.4l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2.1 1 .5-2.3-1.6-1.6 2.3-.3z"/>`,
    // 無線電
    log: `<rect ${T} x="6" y="8" width="12" height="14" rx="2"/><rect x="6" y="8" width="12" height="14" rx="2"/><path d="M15 8V2.5"/><path d="M9 12h6M9 15h6"/><circle cx="12" cy="18.5" r="1" fill="currentColor"/>`,
    // 說明
    help: `<circle ${T} cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.3a2.8 2.8 0 0 1 5.4 1c0 2-2.7 2.3-2.7 4"/><circle cx="12" cy="17.6" r="1" fill="currentColor"/>`,
    // 音效
    sound: `<path ${T} d="M3 9.5h4l5-4.5v14l-5-4.5H3z"/><path d="M3 9.5h4l5-4.5v14l-5-4.5H3z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.3 6.3a8 8 0 0 1 0 11.4"/>`,
    mute: `<path ${T} d="M3 9.5h4l5-4.5v14l-5-4.5H3z"/><path d="M3 9.5h4l5-4.5v14l-5-4.5H3z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>`,
    // 搜查贓物：手電筒
    loot: `<path ${T} d="M9 3h6l-1 6h-4z"/><path d="M9 3h6l-1 6h-4zM10 9v11.5h4V9"/><path d="M12 13v2"/><path d="M5 4l1.5 1M19 4l-1.5 1M4.5 8.5h1.5M18 8.5h1.5"/>`,
  };
  g.ICON = (name, cls = '') => (P[name] ? S(P[name]).replace('<svg ', `<svg class="ico-svg ${cls}" `) : '');

  // 卡牌按鈕的彩色插圖：三張扇形展開的卡（藍、紫、金），金卡上有星星和閃光
  g.CARD_ART = () => `<svg class="card-art" viewBox="0 0 64 48" aria-hidden="true">
    <g stroke="#0b0b0d" stroke-width="2" stroke-linejoin="round">
      <g transform="rotate(-18 22 30)"><rect x="12" y="10" width="20" height="28" rx="3" fill="#3aa0ff"/><rect x="15" y="13" width="14" height="22" rx="2" fill="none" stroke="#bfe0ff" stroke-width="1.4"/></g>
      <g transform="rotate(14 42 30)"><rect x="32" y="10" width="20" height="28" rx="3" fill="#c084ff"/><rect x="35" y="13" width="14" height="22" rx="2" fill="none" stroke="#ecd9ff" stroke-width="1.4"/></g>
      <rect x="22" y="6" width="20" height="30" rx="3" fill="#ffd400"/>
      <rect x="25" y="9" width="14" height="24" rx="2" fill="#fff3b0" stroke-width="1.4"/>
      <path d="M32 13.5l2.3 4.6 5 .7-3.6 3.5.9 5-4.6-2.4-4.6 2.4.9-5-3.6-3.5 5-.7z" fill="#ff8a1f" stroke-width="1.4"/>
    </g>
    <path class="card-art-spark" d="M54 4l1.3 3.2L58.5 8.5l-3.2 1.3L54 13l-1.3-3.2L49.5 8.5l3.2-1.3z" fill="#fff"/>
    <path class="card-art-spark b" d="M9 3l.8 2 2 .8-2 .8L9 8.6l-.8-2-2-.8 2-.8z" fill="#fff"/>
  </svg>`;
})(window);
