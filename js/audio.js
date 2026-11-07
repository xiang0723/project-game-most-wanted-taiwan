// 音效：全部用 Web Audio 即時合成，不需要音檔
(() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('roc-chase-muted') === '1'; } catch { /* 忽略 */ }

  function ac() {
    if (muted) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, { type = 'sine', vol = 0.15, at = 0, slideTo = null } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, { vol = 0.08, at = 0, freq = 1800, freqTo = null } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(freq, t);
    if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
  }

  // ---- 擬真警笛：頻率曲線平滑起伏，方波＋鋸齒波疊出喇叭的刺耳感，再加一點街道回音 ----
  const LO = 620, HI = 1480;
  const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
  // 一個起伏週期：前段上升、後段下降（p = 0～1）
  const sweepAt = (p, rise = 0.45) => (p < rise ? LO + (HI - LO) * ease(p / rise) : HI - (HI - LO) * ease((p - rise) / (1 - rise)));
  const wailF = (t, period = 2.4) => sweepAt((t % period) / period);
  const yelpF = (t, period = 0.3) => sweepAt((t % period) / period, 0.5);
  const hiloF = (t) => (Math.floor(t / 0.5) % 2 ? 780 : 1000);
  function sirenTone(curve, dur, { vol = 0.06, at = 0, spinUp = 0.35 } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at;
    const N = Math.max(2, Math.ceil(dur * 300));
    const arr = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const s = (i / (N - 1)) * dur;
      // 剛啟動時馬達還沒轉到，頻率從低處爬上來
      const up = spinUp ? Math.min(1, s / spinUp) : 1;
      arr[i] = 260 + (curve(s) - 260) * (spinUp ? ease(up) * 0.4 + 0.6 * up : 1);
    }
    const o1 = c.createOscillator(); o1.type = 'square';
    const o2 = c.createOscillator(); o2.type = 'sawtooth';
    o1.frequency.setValueCurveAtTime(arr, t, dur);
    o2.frequency.setValueCurveAtTime(arr, t, dur);
    o2.detune.value = 8;
    const mix = c.createGain(); mix.gain.value = 0.5;
    const shaper = c.createWaveShaper();
    const k = new Float32Array(1024);
    for (let i = 0; i < k.length; i++) { const x = (i / (k.length - 1)) * 2 - 1; k[i] = Math.tanh(2.5 * x); }
    shaper.curve = k;
    const horn = c.createBiquadFilter(); horn.type = 'peaking'; horn.frequency.value = 1700; horn.Q.value = 1.1; horn.gain.value = 7;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3600; lp.Q.value = 0.7;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
    g.gain.setValueAtTime(vol, t + dur - 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    // 街道回音
    const dl = c.createDelay(1); dl.delayTime.value = 0.12;
    const fb = c.createGain(); fb.gain.value = 0.28;
    const wet = c.createGain(); wet.gain.value = 0.35;
    o1.connect(mix); o2.connect(mix);
    mix.connect(shaper).connect(hp).connect(horn).connect(lp).connect(g);
    g.connect(c.destination);
    g.connect(dl); dl.connect(fb).connect(dl); dl.connect(wet).connect(c.destination);
    [o1, o2].forEach((o) => { o.start(t); o.stop(t + dur + 0.05); });
    setTimeout(() => { try { g.disconnect(); dl.disconnect(); } catch { /* 忽略 */ } }, (at + dur + 2) * 1000);
  }

  const SFX = {
    radio() { noise(0.25, { vol: 0.12 }); tone(1400, 0.06, { type: 'square', vol: 0.04, at: 0.22 }); },
    tick() { tone(2200 + Math.random() * 400, 0.015, { type: 'square', vol: 0.015 }); },
    click() { tone(900, 0.05, { type: 'triangle', vol: 0.08 }); },
    // 遊戲裡用的：先一段長音（wail）拉上去，接快速的 yelp
    siren() { sirenTone((t) => (t < 0.9 ? LO + (HI - LO) * ease(t / 0.9) : yelpF(t - 0.9 + 0.15)), 2.5); },
    sirenWail() { sirenTone((t) => wailF(t), 4.8); },
    sirenYelp() { sirenTone((t) => yelpF(t), 2.4, { spinUp: 0.2 }); },
    sirenHiLo() { sirenTone(hiloF, 3, { spinUp: 0 }); },
    heartbeat() { tone(60, 0.12, { vol: 0.35 }); tone(55, 0.12, { vol: 0.25, at: 0.18 }); },
    alarm() { [0, 0.18, 0.36].forEach((t) => tone(880, 0.12, { type: 'square', vol: 0.07, at: t })); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.12, at: i * 0.13 })); },
    lose() { [440, 370, 311, 262].forEach((f, i) => tone(f, 0.4, { type: 'sawtooth', vol: 0.06, at: i * 0.2 })); },
    sms() { tone(1320, 0.08, { type: 'sine', vol: 0.12 }); tone(1760, 0.12, { type: 'sine', vol: 0.12, at: 0.1 }); },
    stamp() { noise(0.12, { vol: 0.3, freq: 300 }); tone(90, 0.15, { vol: 0.3 }); },
    // ---- 錢 ----
    cash() { tone(1800, 0.05, { type: 'square', vol: 0.035 }); tone(2400, 0.09, { type: 'square', vol: 0.035, at: 0.05 }); noise(0.08, { vol: 0.04, freq: 5000, at: 0.02 }); },
    kaching() {
      tone(160, 0.08, { type: 'square', vol: 0.06 }); noise(0.25, { vol: 0.06, freq: 6000, at: 0.05 });
      tone(2093, 0.18, { type: 'triangle', vol: 0.1, at: 0.08 }); tone(2637, 0.35, { type: 'triangle', vol: 0.1, at: 0.16 });
    },
    buzzer() { tone(140, 0.55, { type: 'sawtooth', vol: 0.07 }); tone(149, 0.55, { type: 'sawtooth', vol: 0.07 }); },
    // ---- 移動 ----
    travel(mode) {
      if (mode === 'air') { noise(1.6, { vol: 0.07, freq: 300, freqTo: 2600 }); tone(110, 1.5, { type: 'sawtooth', vol: 0.025, slideTo: 210 }); }
      else if (mode === 'boat') { tone(110, 0.9, { type: 'sawtooth', vol: 0.06 }); tone(165, 0.9, { type: 'sawtooth', vol: 0.035 }); noise(1.2, { vol: 0.04, freq: 500, at: 0.3 }); }
      else { for (let i = 0; i < 8; i++) noise(0.05, { vol: 0.12, freq: 900, at: i * 0.17 + (i % 2) * 0.06 }); }
    },
    arrive() { tone(784, 0.28, { vol: 0.1 }); tone(988, 0.4, { vol: 0.1, at: 0.22 }); },
    // ---- 調查 ----
    clue() { tone(660, 0.08, { type: 'triangle', vol: 0.08 }); tone(990, 0.14, { type: 'triangle', vol: 0.08, at: 0.07 }); },
    dud() { tone(230, 0.2, { type: 'triangle', vol: 0.08, slideTo: 150 }); },
    ping() { tone(1500, 0.7, { vol: 0.07 }); tone(1500, 0.7, { vol: 0.025, at: 0.38 }); },
    tock() { tone(1250, 0.03, { type: 'square', vol: 0.03 }); tone(830, 0.03, { type: 'square', vol: 0.03, at: 0.45 }); },
    barrier() { noise(0.1, { vol: 0.14, freq: 2500 }); tone(520, 0.28, { type: 'square', vol: 0.045, at: 0.03 }); tone(392, 0.28, { type: 'square', vol: 0.045, at: 0.33 }); },
    sleep() { [523, 440, 349].forEach((f, i) => tone(f, 0.45, { vol: 0.06, at: i * 0.28 })); },
    shutter() { noise(0.04, { vol: 0.2, freq: 4200 }); noise(0.05, { vol: 0.15, freq: 2000, at: 0.07 }); },
    whoosh() { noise(0.3, { vol: 0.12, freq: 600, freqTo: 3200 }); },
    // ---- 介面 ----
    paper() { noise(0.2, { vol: 0.07, freq: 2500, freqTo: 5000 }); },
    slam() { noise(0.07, { vol: 0.16, freq: 600 }); tone(120, 0.08, { vol: 0.14 }); },
    levelup() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.1, at: i * 0.07 }));
      [2637, 3136].forEach((f, i) => tone(f, 0.3, { vol: 0.04, at: 0.4 + i * 0.08 }));
    },
  };

  window.SFX = SFX;
  window.Sound = {
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem('roc-chase-muted', muted ? '1' : '0'); } catch { /* 忽略 */ }
      return muted;
    },
  };

  // 打字機效果：逐字顯示文字，每隔幾個字發出打字聲
  window.typeText = (el, text, speed = 22) => new Promise((resolve) => {
    el.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i % 3 === 0) SFX.tick();
      if (i >= text.length) { clearInterval(timer); resolve(); }
    }, speed);
    if (document.hidden) { clearInterval(timer); el.textContent = text; resolve(); }
  });
})();
