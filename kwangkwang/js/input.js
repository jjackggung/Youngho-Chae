// 조작: 키보드, 화면 터치 버튼, 게임패드를 하나로 합쳐요.
'use strict';

const Input = (() => {
  const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'punch', 'grab', 'clap', 'super', 'pause'];
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Space: 'jump', KeyK: 'jump',
    KeyZ: 'punch', KeyJ: 'punch',
    KeyX: 'grab', KeyL: 'grab',
    KeyC: 'clap', KeyH: 'clap',
    KeyV: 'super', KeyU: 'super', ShiftLeft: 'super', ShiftRight: 'super',
    Escape: 'pause', KeyP: 'pause',
  };
  const state = {};
  const latch = {}, prev = {}, keyHeld = {}, touchHeld = {};
  let padHeld = {};
  let device = 'keyboard';
  let enabled = true;
  const listeners = [];
  for (const a of ACTIONS) {
    state[a] = { down: false, pressed: false };
    latch[a] = false; prev[a] = false; keyHeld[a] = new Set(); touchHeld[a] = false;
  }

  function isFormTarget(t) {
    if (!t || !t.tagName) return false;
    const n = t.tagName;
    return n === 'INPUT' || n === 'TEXTAREA' || n === 'SELECT' || n === 'BUTTON' || n === 'A';
  }

  window.addEventListener('keydown', (e) => {
    const a = KEYMAP[e.code];
    if (!a) return;
    if (isFormTarget(e.target)) return; // 메뉴 버튼과 글자 입력은 브라우저 기본 동작에 맡겨요
    e.preventDefault();
    if (!e.repeat) { latch[a] = true; listeners.forEach((fn) => fn(a, 'keyboard')); }
    keyHeld[a].add(e.code);
    device = 'keyboard';
  });
  window.addEventListener('keyup', (e) => {
    const a = KEYMAP[e.code];
    if (!a) return;
    keyHeld[a].delete(e.code);
  });
  window.addEventListener('blur', clearAll);

  function clearAll() {
    for (const a of ACTIONS) { keyHeld[a].clear(); touchHeld[a] = false; latch[a] = false; }
    padHeld = {};
  }

  function setTouch(a, v) {
    if (v && !touchHeld[a]) { latch[a] = true; listeners.forEach((fn) => fn(a, 'touch')); }
    touchHeld[a] = v;
    device = 'touch';
  }

  let padPrev = {};
  function readPad() {
    padHeld = {};
    let pads = [];
    try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { pads = []; }
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      const h = {
        left: ax < -0.45 || b(14), right: ax > 0.45 || b(15),
        up: ay < -0.6 || b(12), down: ay > 0.6 || b(13),
        jump: b(0), punch: b(2), grab: b(1), clap: b(3),
        super: b(4) || b(5) || b(6) || b(7), pause: b(9) || b(8),
      };
      for (const a in h) if (h[a]) padHeld[a] = true;
    }
    let any = false;
    for (const a of ACTIONS) {
      if (padHeld[a] && !padPrev[a]) { any = true; listeners.forEach((fn) => fn(a, 'pad')); }
    }
    if (any) device = 'pad';
    padPrev = { ...padHeld };
  }

  // 고정 시간 간격(1/60초)마다 한 번씩 불러요.
  function poll() {
    for (const a of ACTIONS) {
      const h = enabled && (keyHeld[a].size > 0 || touchHeld[a] || !!padHeld[a]);
      state[a].down = h;
      state[a].pressed = enabled && (latch[a] || (h && !prev[a]));
      latch[a] = false;
      prev[a] = h;
    }
  }

  function bindTouch(root) {
    // 방향 패드: 손가락을 떼지 않고 미끄러져도 방향이 바뀌어요
    const dpad = root.querySelector('#dpad');
    const marks = {
      left: dpad.querySelector('.left'), right: dpad.querySelector('.right'),
      up: dpad.querySelector('.up'), down: dpad.querySelector('.down'),
    };
    let dpadId = null;
    const setDir = (l, r, u, d) => {
      setTouch('left', l); setTouch('right', r); setTouch('up', u); setTouch('down', d);
      marks.left.classList.toggle('on', l); marks.right.classList.toggle('on', r);
      marks.up.classList.toggle('on', u); marks.down.classList.toggle('on', d);
    };
    const upd = (e) => {
      const r = dpad.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const dead = r.width * 0.13;
      const l = dx < -dead && Math.abs(dx) > Math.abs(dy) * 0.5;
      const rt = dx > dead && Math.abs(dx) > Math.abs(dy) * 0.5;
      const u = dy < -dead && Math.abs(dy) > Math.abs(dx) * 0.75;
      const d = dy > dead && Math.abs(dy) > Math.abs(dx) * 0.75;
      setDir(l, rt, u, d);
    };
    dpad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dpadId = e.pointerId;
      try { dpad.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      upd(e);
    });
    dpad.addEventListener('pointermove', (e) => { if (e.pointerId === dpadId) upd(e); });
    const end = (e) => { if (e.pointerId === dpadId) { dpadId = null; setDir(false, false, false, false); } };
    dpad.addEventListener('pointerup', end);
    dpad.addEventListener('pointercancel', end);
    dpad.addEventListener('lostpointercapture', end);

    root.querySelectorAll('.tb').forEach((btn) => {
      const a = btn.dataset.act;
      const on = (e) => {
        e.preventDefault();
        try { btn.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
        setTouch(a, true); btn.classList.add('on');
      };
      const off = () => { setTouch(a, false); btn.classList.remove('on'); };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('lostpointercapture', off);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }

  return {
    state, poll, readPad, clearAll, bindTouch,
    onPress(fn) { listeners.push(fn); },
    get device() { return device; },
    set device(v) { device = v; },
    set enabled(v) { enabled = v; if (!v) clearAll(); },
  };
})();
