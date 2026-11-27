// 소리: 효과음과 배경음악을 모두 Web Audio로 즉석에서 만들어요 (소리 파일 없음).
'use strict';

const Sound = (() => {
  let ctx = null, comp = null, sfxBus = null, musicBus = null, musicFilter = null, noiseBuf = null;
  let sfxOn = true, musicOn = true;
  let combo = 0, comboT = 0;

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    comp.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 0.5 : 0; sfxBus.connect(comp);
    musicFilter = ctx.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 3200;
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.2 : 0;
    musicFilter.connect(musicBus); musicBus.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setInterval(tickMusic, 25);
  }

  function tone(o) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (o.at || 0);
    const dur = o.dur || 0.12;
    const osc = ctx.createOscillator();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f || 440, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + dur);
    const g = ctx.createGain();
    const vol = o.vol || 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }

  function noise(o) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (o.at || 0);
    const dur = o.dur || 0.2;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    const flt = ctx.createBiquadFilter();
    flt.type = o.filter || 'lowpass';
    flt.frequency.setValueAtTime(o.f || 1200, t0);
    if (o.f2) flt.frequency.exponentialRampToValueAtTime(Math.max(30, o.f2), t0 + dur);
    flt.Q.value = o.q || 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol || 0.3, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt); flt.connect(g); g.connect(o.bus || sfxBus);
    src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.03);
  }

  const N = (name) => {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
    if (!m) return 0;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
    const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
    const midi = 12 * (parseInt(m[3], 10) + 1) + base + acc;
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  const SFX = {
    jump() { tone({ f: 300, f2: 640, dur: 0.13, type: 'square', vol: 0.12 }); },
    hop() { tone({ f: 340, f2: 520, dur: 0.08, type: 'square', vol: 0.07 }); },
    whoosh() { noise({ filter: 'bandpass', f: 1600, f2: 500, dur: 0.09, vol: 0.18, q: 1.2 }); },
    hit() {
      tone({ f: 190, f2: 120, dur: 0.07, type: 'triangle', vol: 0.25 });
      noise({ f: 900, dur: 0.06, vol: 0.18 });
    },
    clink() {
      tone({ f: 1250, dur: 0.07, type: 'triangle', vol: 0.12 });
      tone({ f: 1870, dur: 0.06, type: 'triangle', vol: 0.08, at: 0.025 });
    },
    breakSoft() {
      noise({ f: 1000, f2: 260, dur: 0.15, vol: 0.38 });
      tone({ f: 150, f2: 60, dur: 0.11, type: 'sine', vol: 0.28 });
    },
    breakMedium() {
      noise({ filter: 'bandpass', f: 1900, f2: 500, dur: 0.17, vol: 0.4, q: 0.9 });
      tone({ f: 230, f2: 90, dur: 0.09, type: 'square', vol: 0.09 });
    },
    breakHard() {
      noise({ f: 700, f2: 120, dur: 0.25, vol: 0.5 });
      tone({ f: 95, f2: 40, dur: 0.22, type: 'sine', vol: 0.4 });
    },
    breakCrystal() {
      noise({ filter: 'highpass', f: 3000, dur: 0.2, vol: 0.18 });
      [1568, 2093, 2637].forEach((f, i) => tone({ f, dur: 0.12, type: 'triangle', vol: 0.09, at: i * 0.03 }));
    },
    breakGlass() {
      noise({ filter: 'highpass', f: 2500, f2: 6000, dur: 0.3, vol: 0.3 });
      [2200, 2900, 3500].forEach((f, i) => tone({ f, dur: 0.1, type: 'triangle', vol: 0.07, at: i * 0.04 }));
    },
    banana() {
      combo = comboT > 0 ? Math.min(combo + 1, 14) : 0;
      comboT = 0.6;
      const f = 880 * Math.pow(2, combo / 24);
      tone({ f, dur: 0.07, type: 'triangle', vol: 0.13 });
      tone({ f: f * 1.5, dur: 0.07, type: 'triangle', vol: 0.09, at: 0.045 });
    },
    bunch() { [988, 1319, 1568, 1976].forEach((f, i) => tone({ f, dur: 0.08, type: 'triangle', vol: 0.12, at: i * 0.04 })); },
    gem() {
      ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone({ f: N(n), dur: 0.16, type: 'square', vol: 0.09, at: i * 0.09 }));
      ['C5', 'E5', 'G5'].forEach((n) => tone({ f: N(n), dur: 0.9, type: 'triangle', vol: 0.08, at: 0.36 }));
      noise({ filter: 'highpass', f: 5000, dur: 0.6, vol: 0.06, at: 0.3 });
    },
    heart() { [660, 880, 1175].forEach((f, i) => tone({ f, dur: 0.1, type: 'sine', vol: 0.18, at: i * 0.06 })); },
    hurt() { tone({ f: 420, f2: 150, dur: 0.28, type: 'sawtooth', vol: 0.13 }); noise({ f: 600, dur: 0.12, vol: 0.18 }); },
    die() { ['E5', 'C5', 'A4', 'F4'].forEach((n, i) => tone({ f: N(n), dur: 0.2, type: 'square', vol: 0.09, at: i * 0.16 })); },
    boom() {
      noise({ f: 1400, f2: 70, dur: 0.85, vol: 0.65 });
      tone({ f: 85, f2: 30, dur: 0.55, type: 'sine', vol: 0.55 });
    },
    fuse() { noise({ filter: 'highpass', f: 4500, dur: 0.35, vol: 0.06 }); },
    clap() {
      noise({ filter: 'bandpass', f: 2100, dur: 0.05, vol: 0.45, q: 1.4 });
      noise({ filter: 'bandpass', f: 2300, dur: 0.05, vol: 0.45, q: 1.4, at: 0.12 });
      tone({ f: 1300, f2: 520, dur: 0.6, type: 'sine', vol: 0.06, at: 0.14 });
    },
    grab() { tone({ f: 200, f2: 420, dur: 0.09, type: 'square', vol: 0.09 }); noise({ f: 800, dur: 0.07, vol: 0.18 }); },
    throw() { noise({ filter: 'bandpass', f: 700, f2: 2200, dur: 0.14, vol: 0.25 }); },
    stomp() { tone({ f: 320, f2: 140, dur: 0.1, type: 'square', vol: 0.12 }); noise({ f: 900, dur: 0.06, vol: 0.2 }); },
    pop() { tone({ f: 620, f2: 1250, dur: 0.1, type: 'sine', vol: 0.2 }); tone({ f: 940, dur: 0.08, type: 'triangle', vol: 0.1, at: 0.06 }); },
    pound() { noise({ f: 800, f2: 90, dur: 0.3, vol: 0.5 }); tone({ f: 120, f2: 45, dur: 0.25, type: 'sine', vol: 0.45 }); },
    checkpoint() { ['G5', 'C6', 'E6'].forEach((n, i) => tone({ f: N(n), dur: 0.14, type: 'square', vol: 0.08, at: i * 0.08 })); },
    door() {
      noise({ f: 300, f2: 90, dur: 1.0, vol: 0.3 });
      ['C5', 'G5', 'C6'].forEach((n, i) => tone({ f: N(n), dur: 0.4, type: 'triangle', vol: 0.1, at: 0.3 + i * 0.12 }));
    },
    locked() { tone({ f: 220, dur: 0.12, type: 'square', vol: 0.08 }); tone({ f: 196, dur: 0.16, type: 'square', vol: 0.08, at: 0.12 }); },
    super() {
      ['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone({ f: N(n), dur: 0.12, type: 'square', vol: 0.08, at: i * 0.05 }));
      noise({ filter: 'highpass', f: 3000, dur: 0.7, vol: 0.08, at: 0.1 });
    },
    superEnd() { ['G5', 'E5', 'C5'].forEach((n, i) => tone({ f: N(n), dur: 0.12, type: 'triangle', vol: 0.1, at: i * 0.08 })); },
    bossHit() { tone({ f: 220, f2: 70, dur: 0.22, type: 'sawtooth', vol: 0.16 }); noise({ f: 1500, f2: 200, dur: 0.2, vol: 0.35 }); },
    bossRoar() {
      tone({ f: 140, f2: 90, dur: 0.7, type: 'sawtooth', vol: 0.14 });
      tone({ f: 147, f2: 95, dur: 0.7, type: 'sawtooth', vol: 0.1 });
    },
    drill() { tone({ f: 90, f2: 180, dur: 0.5, type: 'sawtooth', vol: 0.08 }); noise({ filter: 'bandpass', f: 1200, dur: 0.5, vol: 0.12 }); },
    crash() { noise({ f: 900, f2: 60, dur: 0.6, vol: 0.6 }); tone({ f: 70, f2: 35, dur: 0.4, type: 'sine', vol: 0.5 }); },
    rumble() { noise({ f: 220, f2: 120, dur: 0.6, vol: 0.25 }); },
    click() { tone({ f: 880, dur: 0.05, type: 'triangle', vol: 0.12 }); },
    win() { ['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'].forEach((n, i) => tone({ f: N(n), dur: 0.2, type: 'square', vol: 0.09, at: i * 0.12 })); },
  };

  function sfx(name) {
    if (!ctx || !sfxOn) return;
    const fn = SFX[name];
    if (fn) { try { fn(); } catch (e) { /* 소리 실패는 무시 */ } }
  }

  // ---------- 배경음악 (8분음표 단위의 아주 작은 시퀀서) ----------
  const SONGS = {
    title: {
      bpm: 116, lead: 'square',
      melody: 'G4 C5 E5 G5 - E5 C5 . A4 D5 F5 A5 - F5 D5 . G4 C5 E5 G5 - A5 G5 E5 F5 E5 D5 C5 - - . .',
      bass: 'C3 . G2 . C3 . G2 . D3 . A2 . D3 . A2 . E3 . C3 . A2 . C3 . F2 . G2 . C3 - . .',
      drum: 'k.h.s.h.k.h.s.hh',
    },
    jungle: {
      bpm: 124, lead: 'square',
      melody: 'F5 . A5 C6 . A5 F5 . G5 . A5 . F5 . D5 . C5 . F5 . A5 . C6 A5 G5 - F5 . . . . .',
      bass: 'F2 . C3 . F2 . C3 . Bb2 . F3 . Bb2 . F3 . A2 . E3 . D3 . A2 . C3 . G2 . C3 . E3 .',
      drum: 'k.h.s.h.k.k.s.h.',
    },
    sand: {
      bpm: 112, lead: 'square',
      melody: 'D5 . E5 F5 . E5 D5 A4 C5 . D5 . E5 . C5 . D5 . F5 . G5 A5 G5 F5 E5 - D5 . . . A4 .',
      bass: 'D3 . A2 . D3 . A2 . C3 . G2 . C3 . G2 . Bb2 . F2 . Bb2 . F2 . A2 . E2 . A2 . C3 .',
      drum: 'k..hs.h.k.khs.h.',
    },
    ice: {
      bpm: 100, lead: 'triangle',
      melody: 'B5 . G#5 . E5 . G#5 B5 A5 . F#5 . D#5 . F#5 A5 G#5 . E5 . B4 . E5 G#5 F#5 - - . B4 . . .',
      bass: 'E3 . . . B2 . . . D#3 . . . B2 . . . C#3 . . . G#2 . . . A2 . . . B2 . . .',
      drum: 'k...h...s...h...',
    },
    lava: {
      bpm: 132, lead: 'square',
      melody: 'A4 . C5 . E5 . D5 C5 B4 . G4 . B4 . D5 . A4 . C5 . E5 . A5 G5 F5 - E5 . D5 . E5 .',
      bass: 'A2 A3 A2 A3 A2 A3 A2 A3 G2 G3 G2 G3 G2 G3 G2 G3 F2 F3 F2 F3 F2 F3 F2 F3 E2 E3 E2 E3 E2 E3 G#2 G#3',
      drum: 'k.h.s.hkk.h.s.h.',
    },
    boss: {
      bpm: 150, lead: 'square',
      melody: 'E5 . E5 G5 . E5 D5 . E5 . B4 . D5 . E5 . C5 . C5 E5 . C5 B4 . C5 . D5 . D#5 . E5 .',
      bass: 'E2 E2 E3 E2 E2 E2 E3 E2 E2 E2 E3 E2 D2 D2 D3 D2 C2 C2 C3 C2 C2 C2 C3 C2 B1 B1 B2 B1 B1 B1 B2 B1',
      drum: 'kkhsk.hskkhsk.hs',
    },
    super: {
      bpm: 160, lead: 'square',
      melody: 'C5 E5 G5 C6 G5 E5 C5 E5 D5 F5 A5 D6 A5 F5 D5 F5 E5 G5 B5 E6 B5 G5 E5 G5 F5 A5 C6 F6 G5 B5 D6 G6',
      bass: 'C3 . C3 . C3 . C3 . D3 . D3 . D3 . D3 . E3 . E3 . E3 . E3 . F3 . F3 . G3 . G3 .',
      drum: 'khshkhshkhshkhsh',
    },
    win: {
      bpm: 104, lead: 'square',
      melody: 'C5 E5 G5 C6 - - G5 . A5 F5 A5 C6 - - A5 . G5 E5 C5 E5 G5 - E5 . D5 E5 F5 D5 C5 - - .',
      bass: 'C3 . G2 . C3 . G2 . F2 . C3 . F2 . C3 . C3 . G2 . E3 . C3 . G2 . B2 . C3 - . .',
      drum: 'k.h.s.h.k.h.s.h.',
    },
  };
  const parsed = {};
  for (const k in SONGS) {
    const s = SONGS[k];
    parsed[k] = { ...s, melody: s.melody.split(/\s+/), bass: s.bass.split(/\s+/), drum: s.drum.split('') };
  }

  let song = null, songName = '', step = 0, nextT = 0;

  function playMusic(name) {
    if (songName === name) return;
    songName = name;
    song = parsed[name] || null;
    step = 0;
    if (ctx) nextT = ctx.currentTime + 0.08;
  }
  function stopMusic() { songName = ''; song = null; }

  function noteLen(arr, i) {
    let n = 1;
    while (arr[(i + n) % arr.length] === '-' && n < 8) n++;
    return n;
  }

  function scheduleStep(i, t, dur) {
    const s = song;
    const m = s.melody[i % s.melody.length];
    if (m && m !== '.' && m !== '-') {
      const len = noteLen(s.melody, i % s.melody.length) * dur * 0.92;
      voice(N(m), t, len, s.lead, 0.14);
    }
    const b = s.bass[i % s.bass.length];
    if (b && b !== '.' && b !== '-') {
      const len = noteLen(s.bass, i % s.bass.length) * dur * 0.9;
      voice(N(b), t, len, 'triangle', 0.3);
    }
    const d = s.drum[i % s.drum.length];
    if (d === 'k') kick(t);
    else if (d === 's') snare(t);
    else if (d === 'h') hat(t);
  }

  function voice(f, t, len, type, vol) {
    if (!f) return;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + Math.max(0.02, len - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(musicFilter);
    o.start(t); o.stop(t + len + 0.02);
  }
  function kick(t) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.17);
  }
  function snare(t) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(f); f.connect(g); g.connect(musicBus); src.start(t, Math.random() * 0.5); src.stop(t + 0.14);
  }
  function hat(t) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.connect(f); f.connect(g); g.connect(musicBus); src.start(t, Math.random() * 0.5); src.stop(t + 0.05);
  }

  function tickMusic() {
    if (comboT > 0) comboT -= 0.025;
    if (!ctx || !song) return;
    if (ctx.state !== 'running') return;
    const dur = 60 / song.bpm / 2;
    if (nextT < ctx.currentTime - 0.3) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.12) {
      scheduleStep(step, nextT, dur);
      nextT += dur;
      step++;
    }
  }

  function setSfx(on) { sfxOn = on; if (sfxBus) sfxBus.gain.value = on ? 0.5 : 0; }
  function setMusic(on) { musicOn = on; if (musicBus) musicBus.gain.value = on ? 0.2 : 0; }
  function suspend() { if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); }

  return { init, sfx, playMusic, stopMusic, setSfx, setMusic, suspend, resume, get ready() { return !!ctx; } };
})();

// 한국어 음성으로 안내를 읽어 줘요 (기기에 한국어 목소리가 있을 때만).
const Voice = (() => {
  const ok = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  let voice = null, on = true, last = '', lastT = 0;
  function pick() {
    if (!ok) return;
    try {
      const vs = window.speechSynthesis.getVoices();
      voice = vs.find((v) => /^ko/i.test(v.lang) && /female|여|yuna|heami|sun/i.test(v.name)) ||
              vs.find((v) => /^ko/i.test(v.lang)) || null;
    } catch (e) { voice = null; }
  }
  if (ok) {
    pick();
    try { window.speechSynthesis.addEventListener('voiceschanged', pick); } catch (e) { /* 일부 브라우저 */ }
  }
  function say(text) {
    if (!ok || !on || !voice || !text) return;
    const now = performance.now();
    if (text === last && now - lastT < 4000) return;
    last = text; lastT = now;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice.lang || 'ko-KR'; u.voice = voice; u.rate = 1.02; u.pitch = 1.15; u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch (e) { /* 읽기 실패는 무시 */ }
  }
  function stop() { if (ok) { try { window.speechSynthesis.cancel(); } catch (e) { /* 무시 */ } } }
  return {
    say, stop,
    set enabled(v) { on = v; if (!v) stop(); },
    get available() { return ok && !!voice; },
  };
})();
