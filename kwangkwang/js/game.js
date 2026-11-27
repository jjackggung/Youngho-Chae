// 쾅쾅 뭉치 — 게임 본체
'use strict';

// ===================== 기본 값 =====================
const GRAV = 1900, MAX_FALL = 780, WALK = 215, JUMP_V = 650, CLIMB_V = 165;
const MAX_HEARTS = 4, METER_NEED = 40, STEP = 1 / 60;
const ROCK = 100; // 보스가 던진 바위를 들고 있을 때
const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const FONT = 'Jua, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

const TDEF = [];
TDEF[TILE.AIR] = { solid: false };
TDEF[TILE.BEDROCK] = { solid: true, hp: 0 };
TDEF[TILE.SOFT] = { solid: true, hp: 1, kind: 'soft', drop: 0.07 };
TDEF[TILE.SOFT_TOP] = { solid: true, hp: 1, kind: 'soft', drop: 0.07 };
TDEF[TILE.MEDIUM] = { solid: true, hp: 2, kind: 'medium', drop: 0.12 };
TDEF[TILE.HARD] = { solid: true, hp: 4, kind: 'hard', drop: 0.4 };
TDEF[TILE.BANANA] = { solid: true, hp: 1, kind: 'soft', bananas: 3 };
TDEF[TILE.CRYSTAL] = { solid: true, hp: 2, kind: 'crystal', bananas: 5 };
TDEF[TILE.BOOM] = { solid: true, hp: 1, kind: 'boom' };
TDEF[TILE.CRATE] = { solid: true, hp: 1, kind: 'wood', heart: true, bananas: 2 };
TDEF[TILE.PLATFORM] = { solid: false, oneway: true, hp: 0 };
TDEF[TILE.LAVA] = { solid: false, hazard: 'lava' };
TDEF[TILE.SPIKE] = { solid: false, hazard: 'spike' };
TDEF[TILE.GLASS] = { solid: true, hp: 1, kind: 'glass', onlyThrow: true };

// 지도 글자 → 블록 (MAP_LEGEND)
const CHAR_TILE = { '.': 0, '#': 1, d: 2, g: 3, s: 4, R: 5, b: 6, c: 7, x: 8, w: 9, '=': 10, L: 11, '^': 12, Y: 13 };
const GEM_INHERIT = { d: 2, g: 2, b: 2, s: 4, R: 5, c: 7 };

const STAGES = [
  { key: 'jungle', floor: '1층', name: '바나나 정글', music: 'jungle', gems: 5, need: 3, skyRows: 13, horizonRow: 13,
    reward: { title: '잡아 던지기', text: '{grab} 눌러 블록을 번쩍 들고, 한 번 더 눌러 휙 던져요!' } },
  { key: 'sand', floor: '2층', name: '반짝 모래 동굴', music: 'sand', gems: 5, need: 3,
    reward: { title: '슈퍼 뭉치', text: '바나나를 40개 모으면 {super} 눌러 슈퍼 뭉치로 변신해요!' } },
  { key: 'ice', floor: '3층', name: '꽁꽁 얼음 동굴', music: 'ice', gems: 5, need: 3,
    reward: { title: '왕주먹', text: '펀치가 더 세지고, 한 번에 더 넓게 부서져요!' } },
  { key: 'lava', floor: '4층', name: '부글부글 용암 동굴', music: 'lava', gems: 5, need: 3,
    reward: { title: '두더지 대왕의 방', text: '맨 아래층 문이 열렸어요. 두더지 대왕을 혼내 주러 가자!' } },
  { key: 'boss', floor: '맨 아래', name: '두더지 대왕의 방', music: 'boss', gems: 0, need: 0, boss: true },
];

const COSTUMES = [
  { name: '노란 안전모', bananas: 0 },
  { name: '빨간 모자', bananas: 150 },
  { name: '공룡 모자', bananas: 400 },
  { name: '해적 모자', bananas: 700 },
  { name: '우주 헬멧', bananas: 1000 },
  { name: '황금 왕관', gems: 20 },
];

const STORY = [
  { scene: 'village', text: '여기는 바나나 정글. 고릴라 뭉치는 바나나를 세상에서 제일 좋아해요.' },
  { scene: 'theft', text: '그런데 욕심쟁이 두더지 대왕이 바나나를 몽땅 훔쳐서 땅속 깊이 숨어 버렸어요!' },
  { scene: 'go', text: '{call}, 뭉치랑 같이 땅을 쾅쾅 부수며 내려가자! 층마다 반짝 보석 3개를 찾으면 아래층 문이 열려!' },
];

// ===================== 저장 =====================
const SAVE_KEY = 'kwangkwang-moongchi-v1';
const Save = {
  data: null,
  defaults() {
    return { name: '진우', cleared: {}, gems: {}, bananasTotal: 0, costume: 0, sfx: true, music: true, voice: true,
      touch: 'auto', storySeen: false, endingSeen: false };
  },
  fix() {
    for (const s of STAGES) {
      const g = this.data.gems[s.key];
      if (!Array.isArray(g) || g.length !== s.gems) this.data.gems[s.key] = new Array(s.gems).fill(false);
    }
    if (typeof this.data.cleared !== 'object' || !this.data.cleared) this.data.cleared = {};
  },
  load() {
    this.data = this.defaults();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) { const d = JSON.parse(raw); if (d && typeof d === 'object') Object.assign(this.data, d); }
    } catch (e) { /* 저장 공간을 못 쓰면 이번만 기억해요 */ }
    this.fix();
  },
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* 무시 */ } },
  reset() { const keep = { name: this.data.name, sfx: this.data.sfx, music: this.data.music, voice: this.data.voice, touch: this.data.touch }; this.data = Object.assign(this.defaults(), keep); this.fix(); this.save(); },
};

const hasGrab = () => !!Save.data.cleared.jungle;
const hasSuper = () => !!Save.data.cleared.sand;
const hasBigFist = () => !!Save.data.cleared.ice;
const gemCount = (key) => (Save.data.gems[key] || []).filter(Boolean).length;
const totalGems = () => STAGES.reduce((a, s) => a + (s.gems ? gemCount(s.key) : 0), 0);
const stageUnlocked = (i) => i === 0 || !!Save.data.cleared[STAGES[i - 1].key];
const costumeUnlocked = (i) => { const c = COSTUMES[i]; return c.gems ? totalGems() >= c.gems : Save.data.bananasTotal >= c.bananas; };

// ===================== 글자 도우미 =====================
function hasBatchim(word) {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xAC00 || c > 0xD7A3) return false;
  return (c - 0xAC00) % 28 !== 0;
}
function playerName() { return (Save.data.name || '').trim() || '친구'; }
function callName() { const n = playerName(); return n + (hasBatchim(n) ? '아' : '야'); }
function nameWith() { const n = playerName(); return n + (hasBatchim(n) ? '과' : '와'); }

function labels() {
  const d = Input.device;
  if (d === 'touch') return { move: '◀ ▶ 버튼', jump: '점프 버튼', punch: '펀치 버튼', grab: '잡기 버튼', clap: '짝짝 버튼', super: '슈퍼 버튼', down: '▼', up: '▲' };
  if (d === 'pad') return { move: '왼쪽 스틱', jump: 'B 버튼', punch: 'Y 버튼', grab: 'A 버튼', clap: 'X 버튼', super: 'L 버튼', down: '스틱 아래', up: '스틱 위' };
  return { move: '← → 키', jump: '스페이스바', punch: 'Z 키', grab: 'X 키', clap: 'C 키', super: 'V 키', down: '↓ 키', up: '↑ 키' };
}
const SPEAK = {
  '← → 키': '왼쪽 오른쪽 화살표', 'Z 키': '제트 키', 'X 키': '엑스 키', 'C 키': '씨 키', 'V 키': '브이 키',
  '↓ 키': '아래 화살표', '↑ 키': '위 화살표', '◀ ▶ 버튼': '왼쪽 오른쪽 버튼', '▼': '아래 버튼', '▲': '위 버튼',
  'B 버튼': '비 버튼', 'Y 버튼': '와이 버튼', 'A 버튼': '에이 버튼', 'X 버튼': '엑스 버튼', 'L 버튼': '엘 버튼',
};
function fill(tpl) {
  const L = labels();
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (k === 'call' ? callName() : k === 'name' ? playerName() : (L[k] || m)));
}
function speak(tpl) {
  const L = labels();
  const txt = tpl.replace(/\{(\w+)\}/g, (m, k) => {
    if (k === 'call') return callName();
    if (k === 'name') return playerName();
    const v = L[k] || '';
    return SPEAK[v] || v;
  });
  Voice.say(txt.replace(/[◀▶▲▼←→↑↓]/g, ''));
}

// ===================== 수학 도우미 =====================
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ===================== 지도 =====================
class Level {
  constructor(stage) {
    const map = MAPS[stage.key];
    const rows = map.rows;
    this.iw = rows[0].length; this.ih = rows.length;
    this.w = this.iw + 2; this.h = this.ih + 2;
    const n = this.w * this.h;
    this.t = new Uint8Array(n).fill(TILE.BEDROCK);
    this.hp = new Uint8Array(n);
    this.bg = new Uint8Array(n);
    this.v = new Uint8Array(n);
    this.spawns = [];
    this.signs = map.signs || {};
    for (let y = 0; y < this.ih; y++) {
      const row = rows[y];
      for (let x = 0; x < this.iw; x++) {
        const ch = row[x] || '.';
        let tile = CHAR_TILE[ch];
        if (tile === undefined) {
          this.spawns.push({ ch, tx: x + 1, ty: y + 1, key: x + ',' + y });
          tile = ch >= '1' && ch <= '5' ? (GEM_INHERIT[row[x - 1]] || 0) : 0;
        }
        const i = (y + 1) * this.w + x + 1;
        this.t[i] = tile; this.hp[i] = TDEF[tile].hp || 0;
      }
    }
    for (let ty = 0; ty < this.h; ty++) {
      for (let tx = 0; tx < this.w; tx++) {
        const i = ty * this.w + tx, tile = this.t[i];
        this.v[i] = hash2(tx, ty) & 3;
        let bg = TDEF[tile].solid || tile === TILE.LAVA || tile === TILE.SPIKE ? 1 : 0;
        if (stage.skyRows !== undefined && ty - 1 >= stage.skyRows) bg = 1;
        this.bg[i] = bg;
      }
    }
  }
  get(tx, ty) { return tx < 0 || ty < 0 || tx >= this.w || ty >= this.h ? TILE.BEDROCK : this.t[ty * this.w + tx]; }
  solid(tx, ty) { return TDEF[this.get(tx, ty)].solid; }
  set(tx, ty, tile) {
    if (tx < 1 || ty < 1 || tx >= this.w - 1 || ty >= this.h - 1) return;
    const i = ty * this.w + tx; this.t[i] = tile; this.hp[i] = TDEF[tile].hp || 0;
  }
}

// ===================== 게임 상태 =====================
const G = {
  state: 'title', paused: false, time: 0, uiTime: 0, stageT: 0,
  shake: 0, hitstop: 0, flash: 0, fade: 0, fadeDir: 0,
  camX: 0, camY: 0, banner: null, banners: [], bubble: null, activeSign: null,
  revealT: 0, compassT: 0, hintT: 0, saveT: 0, storyIdx: 0,
  stageBananas: 0, firstOpen: false, enemiesBeaten: 0,
};
let stage = STAGES[0], stageIndex = 0, theme = THEMES.jungle, L = null;
let player = null, boss = null, door = null;
let enemies = [], items = [], projectiles = [], parts = [], booms = [], flags = [], signs = [];
let checkpoint = null, startPos = null, floorY = 0;
const cam = { x: 0, y: 0 };
const sfxStep = new Set();
let breakCount = 0;

function sfx(name) { if (sfxStep.has(name)) return; sfxStep.add(name); Sound.sfx(name); }

// ===================== 화면 크기 =====================
const app = document.getElementById('app');
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const view = { cssW: 800, cssH: 450, dpr: 1, scale: 1, s: 1, w: 800, h: 450 };
const safe = { top: 0, right: 0, bottom: 0, left: 0 };
let atlas = null, menuAtlas = null;

function readSafe() {
  const probe = document.getElementById('safe-probe');
  if (!probe) return;
  const cs = getComputedStyle(probe);
  safe.top = parseFloat(cs.paddingTop) || 0; safe.right = parseFloat(cs.paddingRight) || 0;
  safe.bottom = parseFloat(cs.paddingBottom) || 0; safe.left = parseFloat(cs.paddingLeft) || 0;
}

function resize() {
  const r = app.getBoundingClientRect();
  const W = Math.max(240, r.width), H = Math.max(200, r.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const tilesH = clamp(H / 34, 11, 17);
  let scale = H / (tilesH * T);
  if (W / scale < 12 * T) scale = W / (12 * T);
  if (W / scale > 34 * T) scale = W / (34 * T);
  view.cssW = W; view.cssH = H; view.dpr = dpr; view.scale = scale; view.s = scale * dpr;
  view.w = W / scale; view.h = H / scale;
  readSafe();
  atlas = null; menuAtlas = null;
  document.body.classList.toggle('portrait', H > W * 1.05);
}

function getAtlas() {
  const P = Math.ceil(T * view.s);
  const key = (stage.boss ? 'boss' : stage.key) + P;
  if (!atlas || atlas.key !== key) { atlas = buildAtlas(stage.boss ? 'boss' : stage.key, P); atlas.key = key; }
  return atlas;
}

// ===================== 효과 (파티클) =====================
function addPart(p) { if (parts.length > 450) parts.splice(0, parts.length - 450); parts.push(p); }
function tileColors(tile) {
  const th = theme;
  switch (tile) {
    case TILE.MEDIUM: return [th.medium.base, th.medium.dark, th.medium.light];
    case TILE.HARD: return [th.hard.base, th.hard.dark, th.hard.light];
    case TILE.BANANA: return [th.soft.base, '#ffd93b', th.soft.dark];
    case TILE.CRYSTAL: return [th.crystal[0], th.crystal[1], th.crystal[2]];
    case TILE.BOOM: return ['#d93030', '#ffe27a', '#2a2a2a'];
    case TILE.CRATE: return ['#c98b4b', '#7d4f22', '#a86f36'];
    case TILE.GLASS: return ['#d9f6ff', '#ffffff', '#9fd8f0'];
    case ROCK: return ['#6f6577', '#8f859a', '#3e3645'];
    default: return [th.soft.base, th.soft.dark, th.soft.light];
  }
}
function debris(x, y, cols, n, power) {
  const k = power || 1;
  for (let i = 0; i < n; i++) {
    addPart({ k: 'chunk', x: x + rand(-10, 10), y: y + rand(-10, 10), vx: rand(-170, 170) * k, vy: rand(-330, -80) * k,
      life: rand(0.5, 0.9), max: 0.9, size: rand(3, 7), color: pick(cols), rot: rand(0, 6), vr: rand(-12, 12) });
  }
}
function dust(x, y, n) {
  for (let i = 0; i < n; i++) addPart({ k: 'dust', x: x + rand(-8, 8), y: y + rand(-4, 2), vx: rand(-40, 40), vy: rand(-40, -10), life: 0.5, max: 0.5, size: rand(5, 9) });
}
function sparkle(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(40, 170);
    addPart({ k: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.4, 0.8), max: 0.8, size: rand(2.5, 5), color: color || '#fff6b0' });
  }
}
function popText(x, y, text, color, size) {
  addPart({ k: 'text', x, y, vx: 0, vy: -46, life: 0.8, max: 0.8, text, color: color || '#ffffff', size: size || 18 });
}
function ring(x, y, maxR, color, dur) { addPart({ k: 'ring', x, y, vx: 0, vy: 0, life: dur || 0.5, max: dur || 0.5, size: maxR, color: color || '#ffffff' }); }
function shake(n) { G.shake = Math.max(G.shake, REDUCED ? n * 0.3 : n); }

function updateParts(dt) {
  for (const p of parts) {
    p.life -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.k === 'chunk') { p.vy += 1500 * dt; p.rot += p.vr * dt; }
    else if (p.k === 'spark') { p.vx *= 0.92; p.vy *= 0.92; }
    else if (p.k === 'dust') { p.vx *= 0.95; p.size += dt * 10; }
  }
  if (parts.length && parts[0].life <= 0) parts = parts.filter((p) => p.life > 0);
}

function drawParts(list) {
  for (const p of list) {
    if (p.life <= 0) continue;
    const a = clamp(p.life / p.max, 0, 1);
    ctx.globalAlpha = p.k === 'chunk' ? Math.min(1, a * 2) : a;
    switch (p.k) {
      case 'chunk':
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore();
        break;
      case 'dust':
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; circ(ctx, p.x, p.y, p.size);
        break;
      case 'spark':
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 8); starPath(ctx, p.size, p.size * 0.4, 4); ctx.fillStyle = p.color; ctx.fill(); ctx.restore();
        break;
      case 'text': {
        const sc = 1 + Math.max(0, (p.life - p.max + 0.15)) * 4;
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(sc, sc);
        ctx.font = `${p.size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
        ctx.lineWidth = p.size * 0.28; ctx.strokeStyle = '#2b1d14'; ctx.strokeText(p.text, 0, 0);
        ctx.fillStyle = p.color; ctx.fillText(p.text, 0, 0);
        ctx.restore();
        break;
      }
      case 'ring': {
        const r = p.size * (1 - a);
        ctx.strokeStyle = p.color; ctx.lineWidth = 3 + 6 * a;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, r), 0, Math.PI * 2); ctx.stroke();
        break;
      }
      default: break;
    }
  }
  ctx.globalAlpha = 1;
}

// ===================== 충돌 =====================
function rectSolid(x, y, w, h) {
  const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.01) / T);
  const y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.01) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (L.solid(tx, ty)) return true;
  return false;
}
function forTiles(r, fn) {
  const x0 = Math.floor(r.x / T), x1 = Math.floor((r.x + r.w - 0.01) / T);
  const y0 = Math.floor(r.y / T), y1 = Math.floor((r.y + r.h - 0.01) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) fn(tx, ty);
}
function moveX(e, dx) {
  e.x += dx;
  const y0 = Math.floor((e.y + 0.01) / T), y1 = Math.floor((e.y + e.h - 0.01) / T);
  if (dx > 0) {
    const tx = Math.floor((e.x + e.w - 0.0001) / T);
    for (let ty = y0; ty <= y1; ty++) if (L.solid(tx, ty)) { e.x = tx * T - e.w; return 1; }
  } else if (dx < 0) {
    const tx = Math.floor(e.x / T);
    for (let ty = y0; ty <= y1; ty++) if (L.solid(tx, ty)) { e.x = (tx + 1) * T; return -1; }
  }
  return 0;
}
function moveY(e, dy) {
  const prevBottom = e.y + e.h;
  e.y += dy;
  const x0 = Math.floor((e.x + 0.01) / T), x1 = Math.floor((e.x + e.w - 0.01) / T);
  if (dy > 0) {
    const ty = Math.floor((e.y + e.h - 0.0001) / T);
    for (let tx = x0; tx <= x1; tx++) {
      const d = TDEF[L.get(tx, ty)];
      if (d.solid || (d.oneway && !(e.dropT > 0) && prevBottom <= ty * T + 0.5)) { e.y = ty * T - e.h; return 1; }
    }
  } else if (dy < 0) {
    const ty = Math.floor(e.y / T);
    for (let tx = x0; tx <= x1; tx++) if (L.solid(tx, ty)) { e.y = (ty + 1) * T; return -1; }
  }
  return 0;
}
function moveBody(e, dt, isPlayer) {
  e.hitWall = 0;
  const dx = e.vx * dt;
  if (dx) {
    const h = moveX(e, dx);
    if (h) {
      e.hitWall = h;
      if (isPlayer) {
        if (e.superT > 0 && bulldoze(e, h)) moveX(e, dx);
        else if (e.onGround && e.state === 'normal' && stepFree(e, h)) { e.vy = -420; e.onGround = false; sfx('hop'); }
        else if (e.state !== 'climb') e.vx = 0;
      } else e.vx = 0;
    }
  }
  const r = moveY(e, e.vy * dt);
  e.landV = 0;
  if (r === 1) { if (e.vy > 0) { e.landV = e.vy; e.vy = 0; } e.onGround = true; }
  else { e.onGround = false; if (r === -1 && e.vy < 0) e.vy = 0; }
}
// 슈퍼 뭉치는 걸어가기만 해도 앞의 블록을 부숴요
function bulldoze(p, dir) {
  const tx = dir > 0 ? Math.floor((p.x + p.w + 1) / T) : Math.floor((p.x - 1) / T);
  const y0 = Math.floor((p.y + 1) / T), y1 = Math.floor((p.y + p.h - 1) / T);
  let clear = true;
  for (let ty = y0; ty <= y1; ty++) {
    const d = TDEF[L.get(tx, ty)];
    if (!d.solid) continue;
    if (d.hp && !d.onlyThrow) damageTile(tx, ty, 9, 'punch');
    if (L.solid(tx, ty)) clear = false;
  }
  if (clear) shake(2.5);
  return clear;
}
function stepFree(e, dir) {
  if (rectSolid(e.x, e.y - T - 2, e.w, T + 2)) return false;
  return !rectSolid(e.x + dir * 3, e.y - T - 2, e.w, e.h);
}
function wallBand(e, dir, y0, y1) {
  const tx = dir > 0 ? Math.floor((e.x + e.w + 1) / T) : Math.floor((e.x - 1) / T);
  for (let ty = Math.floor(y0 / T); ty <= Math.floor(y1 / T); ty++) if (L.solid(tx, ty)) return true;
  return false;
}
const wallAt = (e, dir) => wallBand(e, dir, e.y + 4, e.y + e.h - 4);
function underFeet(e) {
  const ty = Math.floor((e.y + e.h + 1) / T), out = [];
  for (let tx = Math.floor((e.x + 1) / T); tx <= Math.floor((e.x + e.w - 1) / T); tx++) out.push(L.get(tx, ty));
  return out;
}
function hazardIn(r) {
  let h = null;
  forTiles(r, (tx, ty) => { const z = TDEF[L.get(tx, ty)].hazard; if (z === 'lava' || (z && !h)) h = z; });
  return h;
}

// ===================== 블록 부수기 =====================
function damageTile(tx, ty, dmg, src) {
  const tile = L.get(tx, ty), d = TDEF[tile];
  if (!d.solid) return 'none';
  if (!d.hp) return 'clink';
  if (d.onlyThrow && src !== 'throw' && src !== 'boom') return 'clink';
  if (tile === TILE.BOOM) { armBoom(tx, ty, src === 'boom' ? 0.14 : 0.55); return 'armed'; }
  const i = ty * L.w + tx;
  const left = L.hp[i] - dmg;
  if (left <= 0) { breakTile(tx, ty, src); return 'broke'; }
  L.hp[i] = left;
  debris(tx * T + T / 2, ty * T + T / 2, tileColors(tile), 3, 0.6);
  sfx('hit');
  return 'hit';
}

function breakTile(tx, ty, src) {
  const tile = L.get(tx, ty), d = TDEF[tile];
  L.set(tx, ty, TILE.AIR);
  const cx = tx * T + T / 2, cy = ty * T + T / 2;
  debris(cx, cy, tileColors(tile), d.kind === 'hard' ? 10 : 7, src === 'boom' ? 1.5 : 1);
  if (Math.random() < 0.5) dust(cx, cy, 1);
  sfx(d.kind === 'hard' ? 'breakHard' : d.kind === 'medium' ? 'breakMedium' : d.kind === 'crystal' ? 'breakCrystal' : d.kind === 'glass' ? 'breakGlass' : 'breakSoft');
  let nb = d.bananas || 0;
  if (!nb && d.drop && (hash2(tx * 7 + 3, ty * 13 + 5) % 1000) / 1000 < d.drop) nb = d.kind === 'hard' ? 2 : 1;
  for (let k = 0; k < nb; k++) spawnItem('banana', cx, cy, true);
  if (d.heart) spawnItem('heart', cx, cy, true);
  if (d.kind === 'crystal') sparkle(cx, cy, 8, theme.crystal[1]);
  breakCount++;
  if (src !== 'boom' && (d.kind === 'hard' || breakCount % 5 === 0)) popText(cx, cy - 6, pick(['쾅!', '퍽!', '콰직!', '와장창!']), '#ffe066', d.kind === 'hard' ? 22 : 17);
  if (tile === TILE.GLASS) {
    // 유리는 붙어 있는 판 전체가 한꺼번에 와장창
    for (const [nx, ny] of [[tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1]]) if (L.get(nx, ny) === TILE.GLASS) breakTile(nx, ny, src);
    if (src === 'throw') popText(cx, cy - 10, '와장창!', '#bfefff', 22);
  }
  for (const it of items) {
    if (it.embedded && it.tx === tx && it.ty === ty) {
      it.embedded = false; sparkle(it.x, it.y, 14, '#ffc2e6'); sfx('pop');
      if (it.type === 'gem' && !it.ghost) popText(it.x, it.y - 22, '반짝!', '#ff9fd2', 20);
    }
  }
}

function armBoom(tx, ty, fuse) {
  if (booms.some((b) => b.tx === tx && b.ty === ty)) return;
  booms.push({ tx, ty, t: fuse, max: fuse });
  sfx('fuse');
}
function updateBooms(dt) {
  for (let i = booms.length - 1; i >= 0; i--) {
    const b = booms[i];
    b.t -= dt;
    if (b.t <= 0) { booms.splice(i, 1); explode(b.tx * T + T / 2, b.ty * T + T / 2); }
  }
}
function explode(x, y) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T), R = 2.6;
  if (L.get(tx, ty) === TILE.BOOM) L.set(tx, ty, TILE.AIR);
  for (let yy = ty - 3; yy <= ty + 3; yy++) {
    for (let xx = tx - 3; xx <= tx + 3; xx++) {
      if ((xx - tx) * (xx - tx) + (yy - ty) * (yy - ty) > R * R) continue;
      const t = L.get(xx, yy);
      if (t === TILE.BOOM) armBoom(xx, yy, 0.13);
      else if (TDEF[t].solid && TDEF[t].hp) damageTile(xx, yy, 4, 'boom');
    }
  }
  const rad = R * T + 12;
  for (const e of enemies) if (!e.dead && Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y) < rad) hurtEnemy(e, 3, Math.sign(e.x + e.w / 2 - x) || 1);
  if (boss && boss.state !== 'under' && boss.state !== 'defeated' && Math.hypot(boss.x + boss.w / 2 - x, boss.y + boss.h / 2 - y) < rad + 30) bossHurt(1);
  const p = player;
  const pd = Math.hypot(p.cx - x, p.cy - y);
  if (pd < rad + 10 && p.state !== 'dead') { p.vx = (Math.sign(p.cx - x) || 1) * 300; p.vy = Math.min(p.vy, -380); if (p.state === 'climb') p.state = 'normal'; }
  addPart({ k: 'ring', x, y, vx: 0, vy: 0, life: 0.45, max: 0.45, size: rad + 20, color: '#ffe066' });
  for (let i = 0; i < 6; i++) addPart({ k: 'dust', x: x + rand(-30, 30), y: y + rand(-30, 30), vx: rand(-60, 60), vy: rand(-80, -10), life: 0.8, max: 0.8, size: rand(10, 18) });
  sparkle(x, y, 10, '#ffb000');
  popText(x, y - 10, '펑!', '#ffb000', 28);
  Sound.sfx('boom'); shake(11); G.hitstop = Math.max(G.hitstop, 0.04); if (!REDUCED) G.flash = Math.max(G.flash, 0.25);
}

// ===================== 아이템 =====================
function spawnItem(type, x, y, pop, extra) {
  const it = { type, x, y, vx: 0, vy: 0, phys: !!pop, t: rand(0, 6), delay: pop ? 0.32 : 0, embedded: false, dead: false };
  if (pop) { it.vx = rand(-130, 130); it.vy = rand(-400, -220); }
  if (extra) Object.assign(it, extra);
  items.push(it);
  return it;
}
function updateItems(dt) {
  const p = player;
  const alive = p.state !== 'dead' && p.state !== 'door';
  for (const it of items) {
    if (it.dead) continue;
    it.t += dt;
    if (it.embedded) {
      if (!L.solid(it.tx, it.ty)) it.embedded = false;
      else {
        if (it.type === 'gem' && !it.ghost && Math.random() < dt * 1.2 && Math.abs(it.x - p.cx) < 9 * T && Math.abs(it.y - p.cy) < 7 * T) {
          addPart({ k: 'spark', x: it.x + rand(-12, 12), y: it.y + rand(-12, 12), vx: 0, vy: -20, life: 0.6, max: 0.6, size: 3.5, color: '#ffc2e6' });
        }
        continue;
      }
    }
    if (it.delay > 0) it.delay -= dt;
    const dx = p.cx - it.x, dy = p.y + p.h * 0.45 - it.y, dist = Math.hypot(dx, dy) || 1;
    let mag = 0;
    if (it.type === 'banana' || it.type === 'bunch') mag = p.superT > 0 ? 135 : 74;
    else if (it.type === 'heart') mag = 60;
    else if (it.type === 'gem') mag = 44;
    if (alive && it.delay <= 0 && mag && dist < mag) {
      it.phys = false;
      const sp = 560 * dt;
      it.x += (dx / dist) * Math.min(dist, sp); it.y += (dy / dist) * Math.min(dist, sp);
    } else if (it.phys) {
      itemPhysics(it, dt);
    }
    if (alive && it.delay <= 0 && it.type !== 'rock' && dist < (it.type === 'gem' ? 28 : 21)) collect(it);
  }
  if (items.some((i) => i.dead)) items = items.filter((i) => !i.dead);
}
function itemPhysics(it, dt) {
  const r = it.type === 'rock' ? 12 : 7;
  it.vy = Math.min(it.vy + 1300 * dt, 700);
  const nx = it.x + it.vx * dt;
  if (L.solid(Math.floor((nx + Math.sign(it.vx) * r) / T), Math.floor(it.y / T))) it.vx *= -0.45;
  else it.x = nx;
  let ny = it.y + it.vy * dt;
  if (it.vy > 0) {
    const ty = Math.floor((ny + r) / T), tx = Math.floor(it.x / T);
    const d = TDEF[L.get(tx, ty)];
    if (d.solid || d.oneway) {
      ny = ty * T - r; it.vy = -it.vy * 0.35; it.vx *= 0.7;
      if (Math.abs(it.vy) < 60) { it.vy = 0; if (Math.abs(it.vx) < 15) it.vx = 0; }
    } else if (d.hazard === 'lava' && it.type !== 'gem') { it.dead = true; return; }
  } else if (it.vy < 0 && L.solid(Math.floor(it.x / T), Math.floor((ny - r) / T))) { it.vy = 0; ny = it.y; }
  it.y = ny;
  if (L.solid(Math.floor(it.x / T), Math.floor(it.y / T))) it.y -= 4;
}
function addBananas(n) {
  G.stageBananas += n; Save.data.bananasTotal += n;
  if (hasSuper() && player.superT <= 0) {
    const was = player.meter;
    player.meter = Math.min(1, player.meter + n / METER_NEED);
    if (was < 1 && player.meter >= 1) { popText(player.cx, player.y - 30, '슈퍼 준비!', '#ffe066', 20); sfx('heart'); if (!G.superTold) { G.superTold = true; say(`{super} 누르면 슈퍼 뭉치로 변신!`, true); } }
  }
}
function collect(it) {
  it.dead = true;
  switch (it.type) {
    case 'banana': addBananas(1); Sound.sfx('banana'); addPart({ k: 'spark', x: it.x, y: it.y, vx: 0, vy: -30, life: 0.3, max: 0.3, size: 4, color: '#fff3a0' }); break;
    case 'bunch': addBananas(5); Sound.sfx('bunch'); sparkle(it.x, it.y, 6); popText(it.x, it.y - 10, '+5', '#ffe066'); break;
    case 'heart':
      if (player.hearts < MAX_HEARTS) { player.hearts++; Sound.sfx('heart'); popText(it.x, it.y - 10, '하트!', '#ff7b9c'); }
      else { addBananas(3); Sound.sfx('bunch'); popText(it.x, it.y - 10, '+3', '#ffe066'); }
      break;
    case 'gem': collectGem(it); break;
    default: break;
  }
}
function collectGem(it) {
  if (it.ghost) { addBananas(5); Sound.sfx('bunch'); popText(it.x, it.y - 12, '+5', '#ffe066'); return; }
  const arr = Save.data.gems[stage.key];
  arr[it.id - 1] = true;
  Save.save();
  const n = gemCount(stage.key);
  const p = player;
  if (p.state === 'normal' || p.state === 'climb') { p.state = 'celebrate'; p.stateT = 1.5; p.vx = 0; }
  p.invuln = Math.max(p.invuln, 2);
  if (p.hold) dropHeld(p);
  Sound.sfx('gem'); sparkle(it.x, it.y, 24, '#ffc2e6'); ring(it.x, it.y, 90, '#ff9fd2', 0.6);
  if (!REDUCED) G.flash = Math.max(G.flash, 0.3);
  G.hintT = 0;
  const all = n >= stage.gems;
  pushBanner(`반짝 보석을 찾았다!`, all ? `${stage.name}의 보석을 모두 찾았어요!` : `${n} / ${stage.gems}개`, '#ff9fd2');
  if (n === stage.need && !G.firstOpen) {
    G.firstOpen = true;
    pushBanner('문이 열렸어요!', '보석 3개를 모았어요. 짝짝으로 문 위치를 알 수 있어요.', '#ffe066');
    say(`보석 세 개를 다 모았어! 이제 문으로 가자!`);
    G.compassT = 9;
  } else say(all ? '보석을 모두 찾았어! 최고야!' : `보석을 찾았어! 지금 ${n}개야.`);
}

// ===================== 주인공 =====================
function makePlayer(x, y) {
  return {
    x, y, w: 24, h: 38, vx: 0, vy: 0, facing: 1, onGround: false, coyote: 0, jumpBuf: 0,
    state: 'normal', stateT: 0, climbDir: 1, climbPh: 0, punchCd: 0, punchT: 0, punchDir: 'fwd', punchBuf: 0,
    hold: 0, hearts: MAX_HEARTS, invuln: 0, superT: 0, meter: 0, clapCd: 0, clapT: 0, walkPh: 0,
    poundDepth: 0, poundHang: 0, dropT: 0, mantleT: 0, rot: 0, alpha: 1, safeX: x, safeY: y, landV: 0,
    get cx() { return this.x + this.w / 2; }, get cy() { return this.y + this.h / 2; },
  };
}

function updatePlayer(dt) {
  const p = player, S = Input.state;
  p.invuln = Math.max(0, p.invuln - dt);
  p.punchCd -= dt; p.punchT = Math.max(0, p.punchT - dt); p.clapCd -= dt; p.clapT = Math.max(0, p.clapT - dt);
  p.dropT -= dt; p.mantleT -= dt; p.punchBuf -= dt;
  if (p.superT > 0) { p.superT -= dt; if (p.superT <= 0) endSuper(); else if (Math.random() < dt * 20) addPart({ k: 'spark', x: p.cx + rand(-16, 16), y: p.y + rand(-10, p.h), vx: 0, vy: -40, life: 0.5, max: 0.5, size: 3, color: '#ffe066' }); }

  switch (p.state) {
    case 'dead':
      p.stateT -= dt; p.vy = Math.min(p.vy + GRAV * dt, MAX_FALL); p.y += p.vy * dt; p.rot += dt * 7 * p.facing;
      if (p.stateT < 0.5) G.fade = Math.max(G.fade, 1 - p.stateT / 0.5);
      if (p.stateT <= 0) respawn();
      return;
    case 'door':
      p.stateT -= dt; p.vx = 0;
      p.x = approach(p.x, door.x + door.w / 2 - p.w / 2, 70 * dt);
      p.alpha = clamp(p.stateT / 0.9, 0, 1);
      G.fade = clamp(1 - p.stateT / 0.9, 0, 1);
      if (p.stateT <= 0) stageClear();
      return;
    case 'celebrate':
      p.stateT -= dt; p.vx = approach(p.vx, 0, 2000 * dt);
      p.vy = Math.min(p.vy + GRAV * dt, MAX_FALL); moveBody(p, dt, false);
      if (p.stateT <= 0) p.state = 'normal';
      return;
    case 'hurt':
      p.stateT -= dt; p.vy = Math.min(p.vy + GRAV * dt, MAX_FALL); moveBody(p, dt, false); checkHazards(p);
      if (p.stateT <= 0 && p.state === 'hurt') p.state = 'normal';
      return;
    default: break;
  }

  const ax = (S.right.down ? 1 : 0) - (S.left.down ? 1 : 0);
  const sup = p.superT > 0;
  if (S.jump.pressed) p.jumpBuf = 0.14; else p.jumpBuf -= dt;

  if (p.state === 'climb') {
    climbUpdate(p, ax);
  } else if (p.state === 'pound') {
    p.vx = 0;
    if (p.poundHang > 0) { p.poundHang -= dt; p.vy = 0; } else p.vy = 980;
  } else {
    if (ax) p.facing = ax;
    const ice = p.onGround && theme.slippery && underFeet(p).includes(TILE.MEDIUM);
    const spd = sup ? 290 : WALK;
    if (ax) p.vx = approach(p.vx, ax * spd, (p.onGround ? (ice ? 700 : 2300) : 1500) * dt);
    else if (p.mantleT <= 0) p.vx = approach(p.vx, 0, (p.onGround ? (ice ? 240 : 2600) : 700) * dt);
    if (p.onGround) p.coyote = 0.1; else p.coyote -= dt;
    if (p.jumpBuf > 0 && p.coyote > 0) {
      const feet = underFeet(p);
      if (S.down.down && feet.includes(TILE.PLATFORM) && !feet.some((t) => TDEF[t].solid)) { p.dropT = 0.3; p.y += 3; }
      else { p.vy = -(sup ? 730 : JUMP_V); Sound.sfx('jump'); dust(p.cx, p.y + p.h, 3); }
      p.jumpBuf = 0; p.coyote = 0; p.onGround = false;
    }
    let g = GRAV;
    if (p.vy < 0 && !S.jump.down && p.mantleT <= 0) g *= 2.2;
    else if (p.vy > 0) g *= 1.08;
    p.vy = Math.min(p.vy + g * dt, MAX_FALL);
    if (!p.onGround && ax && !p.hold && p.vy > -150 && wallAt(p, ax)) {
      p.state = 'climb'; p.climbDir = ax; p.vy = Math.max(p.vy * 0.3, -CLIMB_V);
    }
  }
  playerActions(p);
  const wasPound = p.state === 'pound';
  moveBody(p, dt, true);
  if (wasPound && p.onGround) poundImpact(p);
  if (p.landV > 560 && p.state === 'normal') { dust(p.cx, p.y + p.h, 4); sfx('stomp'); }
  checkHazards(p);
  if (p.state === 'climb') p.climbPh += Math.abs(p.vy) * dt * 0.11;
  if (p.onGround && p.state === 'normal') {
    p.walkPh += Math.abs(p.vx) * dt * 0.085;
    const feet = underFeet(p);
    if (feet.some((t) => TDEF[t].solid) && !hazardIn({ x: p.x - T, y: p.y, w: p.w + 2 * T, h: p.h + 4 })) { p.safeX = p.x; p.safeY = p.y; }
  }
}

function climbUpdate(p, ax) {
  const S = Input.state, d = p.climbDir;
  p.facing = d;
  if (!wallAt(p, d)) { p.state = 'normal'; return; }
  if (p.jumpBuf > 0) {
    p.jumpBuf = 0; p.state = 'normal'; p.vy = -600; p.vx = -d * 240; p.facing = -d; p.mantleT = 0.16; Sound.sfx('jump');
    return;
  }
  if (ax === -d) { p.state = 'normal'; p.vx = -d * 110; return; }
  const up = ax === d || S.up.down;
  if (up) p.vy = -CLIMB_V * (p.superT > 0 ? 1.4 : 1);
  else if (S.down.down) p.vy = CLIMB_V;
  else p.vy = 42;
  if (p.onGround && !up) { p.state = 'normal'; return; }
  if (up && !wallBand(p, d, p.y + 2, p.y + 13)) {
    p.state = 'normal'; p.vy = -450; p.vx = d * 150; p.mantleT = 0.3; sfx('hop');
    return;
  }
  p.vx = d * 25;
}

function playerActions(p) {
  const S = Input.state;
  if (p.state === 'pound') return;
  if (S.punch.pressed && p.hold) { throwHeld(p); p.punchCd = 0.25; return; }
  if (S.punch.pressed && p.punchCd > 0) p.punchBuf = 0.12;
  if ((S.punch.pressed || S.punch.down || p.punchBuf > 0) && p.punchCd <= 0 && !p.hold) {
    p.punchBuf = 0;
    let dir = 'fwd';
    if (S.up.down) dir = 'up';
    else if (S.down.down) dir = p.onGround || p.state === 'climb' ? 'down' : 'pound';
    if (dir === 'pound') { if (S.punch.pressed) startPound(p); }
    else doPunch(p, dir);
  }
  if (S.grab.pressed && hasGrab()) doGrab(p);
  if (S.clap.pressed) doClap(p);
  if (S.super.pressed) startSuper();
}

function punchRect(p, dir) {
  const sup = p.superT > 0, big = hasBigFist() || sup;
  const reach = sup ? 44 : big ? 34 : 28;
  if (dir === 'fwd') {
    const h = big ? p.h + 14 : p.h - 4;
    const y = big ? p.y - 10 : p.y + 2;
    return { x: p.facing > 0 ? p.x + p.w : p.x - reach, y, w: reach, h };
  }
  const w = big ? p.w + 40 : p.w + 8;
  if (dir === 'up') return { x: p.cx - w / 2, y: p.y - reach, w, h: reach };
  return { x: p.cx - w / 2, y: p.y + p.h, w, h: sup ? 40 : big ? 28 : 22 };
}

function doPunch(p, dir) {
  const sup = p.superT > 0, big = hasBigFist();
  p.punchCd = sup ? 0.15 : 0.21; p.punchT = 0.16; p.punchDir = dir;
  const dmg = sup ? 9 : big ? 2 : 1;
  const r = punchRect(p, dir);
  let broke = false, hit = false, clink = false;
  forTiles(r, (tx, ty) => {
    const res = damageTile(tx, ty, dmg, 'punch');
    if (res === 'broke' || res === 'armed') broke = true; else if (res === 'hit') hit = true; else if (res === 'clink') clink = true;
  });
  let hitEnemy = false;
  for (const e of enemies) {
    if (!e.dead && overlap(r, e)) { hurtEnemy(e, sup ? 5 : big ? 2 : 1, dir === 'fwd' ? p.facing : (Math.sign(e.x - p.x) || 1)); hitEnemy = true; }
  }
  for (const pr of projectiles) {
    if (!pr.dead && pr.enemy && overlap(r, pr)) { pr.dead = true; sparkle(pr.x + pr.w / 2, pr.y + pr.h / 2, 8, '#ffffff'); popText(pr.x, pr.y, '팡!', '#ffffff'); hitEnemy = true; }
  }
  if (boss && boss.state !== 'under' && overlap(r, bossBox())) { punchBoss(sup ? 2 : 1); hitEnemy = true; }
  const fx = dir === 'fwd' ? (p.facing > 0 ? r.x + r.w : r.x) : p.cx;
  const fy = dir === 'up' ? r.y : dir === 'down' ? r.y + r.h : p.cy;
  if (broke || hitEnemy) { shake(sup ? 5 : 3); G.hitstop = Math.max(G.hitstop, 0.035); ring(fx, fy, 26, '#ffffff', 0.25); }
  else if (hit) { shake(1.5); ring(fx, fy, 18, '#ffffff', 0.2); }
  else if (clink) { sfx('clink'); popText(fx, fy, '팅!', '#d8e6f0', 15); }
  else sfx('whoosh');
}

function startPound(p) {
  p.state = 'pound'; p.poundDepth = 0; p.poundHang = 0.1; p.vx = 0; p.vy = 0;
  sfx('whoosh');
}
function poundImpact(p) {
  const sup = p.superT > 0;
  const ty = Math.floor((p.y + p.h + 2) / T), cx = Math.floor(p.cx / T);
  for (let tx = cx - 1; tx <= cx + 1; tx++) damageTile(tx, ty, sup ? 9 : 2, 'pound');
  for (const e of enemies) {
    if (!e.dead && Math.abs(e.x + e.w / 2 - p.cx) < 64 && Math.abs(e.y + e.h - (p.y + p.h)) < 40) hurtEnemy(e, 2, Math.sign(e.x - p.x) || 1);
  }
  if (boss && boss.state !== 'under' && Math.abs(boss.x + boss.w / 2 - p.cx) < boss.w / 2 + 30 && Math.abs(boss.y + boss.h - (p.y + p.h)) < 40) punchBoss(1);
  dust(p.cx - 14, p.y + p.h, 3); dust(p.cx + 14, p.y + p.h, 3);
  ring(p.cx, p.y + p.h, 60, '#ffffff', 0.35);
  sfx('pound'); shake(sup ? 8 : 6);
  const below = L.get(cx, ty);
  if (!TDEF[below].solid && p.poundDepth < (sup ? 6 : 3)) { p.poundDepth++; p.onGround = false; p.vy = 980; }
  else { p.state = 'normal'; p.vy = -170; p.poundDepth = 0; popText(p.cx, p.y + p.h - 4, '쿵!', '#ffe066', 22); }
}

function doGrab(p) {
  if (p.hold) { throwHeld(p); return; }
  const S = Input.state;
  // 1) 바닥에 놓인 바위 (보스 방)
  for (const it of items) {
    if (it.type === 'rock' && !it.dead && Math.abs(it.x - (p.cx + p.facing * 18)) < 34 && Math.abs(it.y - (p.y + p.h - 12)) < 30) {
      it.dead = true; p.hold = ROCK; sfx('grab'); p.punchT = 0.12; p.punchDir = 'fwd';
      return;
    }
  }
  const fx = p.facing > 0 ? Math.floor((p.x + p.w + 4) / T) : Math.floor((p.x - 4) / T);
  const cands = [];
  if (S.down.down) cands.push([Math.floor(p.cx / T), Math.floor((p.y + p.h + 2) / T)]);
  cands.push([fx, Math.floor((p.y + p.h - 6) / T)], [fx, Math.floor((p.y + 6) / T)]);
  if (!S.down.down) cands.push([Math.floor(p.cx / T), Math.floor((p.y + p.h + 2) / T)]);
  for (const [tx, ty] of cands) {
    const t = L.get(tx, ty), d = TDEF[t];
    if (d.solid && d.hp && !d.onlyThrow) {
      L.set(tx, ty, TILE.AIR);
      booms.splice(0, booms.length, ...booms.filter((b) => !(b.tx === tx && b.ty === ty)));
      for (const it of items) if (it.embedded && it.tx === tx && it.ty === ty) { it.embedded = false; sparkle(it.x, it.y, 12, '#ffc2e6'); }
      p.hold = t; sfx('grab');
      debris(tx * T + T / 2, ty * T + T / 2, tileColors(t), 4, 0.6);
      return;
    }
  }
  popText(p.cx + p.facing * 20, p.y, '?', '#ffffff', 16);
}
function throwHeld(p) {
  const S = Input.state, up = S.up.down;
  projectiles.push({
    kind: 'chunk', tile: p.hold, x: p.cx - 12 + p.facing * 6, y: up ? p.y - 22 : p.y - 4, w: 24, h: 24,
    vx: up ? p.facing * 110 + p.vx * 0.3 : p.facing * 580, vy: up ? -760 : -70, g: 1300, t: 0, rot: 0, enemy: false,
  });
  p.hold = 0; p.punchT = 0.14; p.punchDir = up ? 'up' : 'fwd';
  sfx('throw');
}
function dropHeld(p) {
  projectiles.push({ kind: 'chunk', tile: p.hold, x: p.cx - 12, y: p.y - 22, w: 24, h: 24, vx: p.facing * 60, vy: -120, g: 1300, t: 0, rot: 0, enemy: false });
  p.hold = 0;
}

function doClap(p) {
  if (p.clapCd > 0) return;
  p.clapCd = 1.0; p.clapT = 0.3;
  Sound.sfx('clap');
  ring(p.cx, p.cy, 14 * T, 'rgba(255,240,180,0.9)', 0.9);
  ring(p.cx, p.cy, 9 * T, 'rgba(255,200,230,0.8)', 0.7);
  G.revealT = 6; G.compassT = 7; G.hintT = 0;
  if (!G.clapUsed) {
    G.clapUsed = true;
    if (stage.gems) say('보석이 있는 쪽으로 화살표가 생겼어!');
  }
}

function startSuper() {
  const p = player;
  if (!hasSuper()) return;
  if (p.superT > 0) return;
  if (p.meter < 1) { if (!G.meterHintT || G.time - G.meterHintT > 3) { G.meterHintT = G.time; popText(p.cx, p.y - 24, '바나나가 더 필요해!', '#ffe066', 15); } return; }
  p.superT = 12; p.meter = 0; p.invuln = 0;
  Sound.sfx('super'); Sound.playMusic('super');
  sparkle(p.cx, p.cy, 30, '#ffe066'); ring(p.cx, p.cy, 120, '#ffe066', 0.6);
  shake(6); if (!REDUCED) G.flash = 0.45;
  pushBanner('슈퍼 뭉치!', '무엇이든 한 방에 쾅!', '#ffe066');
  say('슈퍼 뭉치로 변신!');
}
function endSuper() {
  player.superT = 0;
  Sound.sfx('superEnd');
  Sound.playMusic(stage.music);
  sparkle(player.cx, player.cy, 12, '#ffe066');
}

function checkHazards(p) {
  if (p.state === 'dead' || p.state === 'door') return;
  const h = hazardIn({ x: p.x + 3, y: p.y + 6, w: p.w - 6, h: p.h - 6 });
  if (!h) return;
  if (h === 'lava') {
    if (p.superT > 0) { p.vy = -820; return; }
    const died = hurtPlayer(0, true);
    popText(p.cx, p.y - 10, '앗 뜨거!', '#ffb347', 20);
    if (!died) {
      let sx = p.safeX, sy = p.safeY;
      if (!rectSolid(sx, sy + p.h + 1, p.w, 4) || rectSolid(sx, sy, p.w, p.h)) { sx = checkpoint.x; sy = checkpoint.y; }
      p.x = sx; p.y = sy; p.vx = 0; p.vy = 0; p.state = 'normal';
      sparkle(p.cx, p.cy, 10, '#ffffff');
    }
  } else if (h === 'spike') {
    if (p.superT > 0) return;
    if (hurtPlayer(-p.facing)) return;
    p.vy = -520;
  }
}

function hurtPlayer(dir, lava) {
  const p = player;
  if (p.state === 'dead' || p.state === 'door' || p.superT > 0) return false;
  if (p.invuln > 0) return false;
  p.hearts -= 1; p.invuln = 1.7;
  Sound.sfx('hurt'); shake(5);
  if (p.hold) dropHeld(p);
  if (p.hearts <= 0) { die(); return true; }
  if (!lava) { p.state = 'hurt'; p.stateT = 0.35; p.vx = (dir || -p.facing) * 230; p.vy = -330; }
  if (p.hearts === 1 && !G.lowTold) { G.lowTold = true; say('하트가 하나 남았어! 나무 상자를 부수면 하트가 나와.'); }
  return false;
}
function die() {
  const p = player;
  p.state = 'dead'; p.stateT = 1.5; p.vy = -520; p.vx = 0; p.rot = 0;
  Sound.sfx('die');
  say('앗! 괜찮아, 다시 해 보자!');
}
function respawn() {
  const p = player;
  p.x = checkpoint.x; p.y = checkpoint.y; p.vx = 0; p.vy = 0; p.rot = 0;
  p.hearts = MAX_HEARTS; p.invuln = 2.2; p.state = 'normal'; p.hold = 0;
  G.fade = 1; G.fadeDir = -1;
  updateCamera(0, true);
  pushBanner('다시 힘내자!', '하트가 가득 찼어요', '#ffffff');
}

// ===================== 적 =====================
const EDEF = {
  e: { type: 'mole', w: 26, h: 24, hp: 1, speed: 46, bananas: 2 },
  k: { type: 'crab', w: 30, h: 22, hp: 2, speed: 34, bananas: 4 },
  v: { type: 'bat', w: 26, h: 18, hp: 1, speed: 80, bananas: 2, fly: true },
  n: { type: 'snow', w: 26, h: 26, hp: 1, speed: 0, bananas: 3 },
  f: { type: 'jelly', w: 24, h: 22, hp: 1, speed: 95, bananas: 2 },
};
function spawnEnemy(ch, tx, ty) {
  const d = EDEF[ch];
  const e = Object.assign({}, d, {
    x: tx * T + (T - d.w) / 2, y: (ty + 1) * T - d.h, vx: 0, vy: 0, dir: Math.random() < 0.5 ? -1 : 1,
    t: rand(0, 5), flash: 0, stun: 0, dead: false, deadT: 0, onGround: false, cool: rand(1, 2.5), hopT: rand(0.5, 1.5),
    throwT: 0, squash: 1, rot: 0, moving: false, dropT: 0,
  });
  if (d.fly) { e.y = ty * T + (T - d.h) / 2; e.homeX = e.x; e.homeY = e.y; }
  enemies.push(e);
}
function updateEnemies(dt) {
  const p = player;
  for (const e of enemies) {
    if (e.dead) {
      if (e.deadT > 0) { e.deadT -= dt; e.vy += GRAV * dt; e.x += e.vx * dt; e.y += e.vy * dt; e.rot += dt * 9; }
      continue;
    }
    if (Math.abs(e.x - p.x) > view.w + 260 || Math.abs(e.y - p.y) > view.h + 260) continue;
    e.t += dt; e.flash -= dt; e.stun -= dt; e.throwT -= dt;
    if (e.type === 'mole' || e.type === 'crab') walker(e, dt);
    else if (e.type === 'bat') batAI(e, dt);
    else if (e.type === 'snow') snowAI(e, dt);
    else if (e.type === 'jelly') jellyAI(e, dt);
    if (hazardIn(e) === 'lava') { killEnemy(e, 0, true); continue; }
    if (rectSolid(e.x + 2, e.y + 2, e.w - 4, e.h - 4) && e.type !== 'bat') { e.y -= 2; }
    if (p.state !== 'dead' && p.state !== 'door') {
      const box = { x: e.x + 3, y: e.y + 3, w: e.w - 6, h: e.h - 3 };
      if (overlap(p, box)) contactEnemy(p, e);
    }
  }
  if (enemies.length > 0 && enemies.some((e) => e.dead && e.deadT <= 0)) enemies = enemies.filter((e) => !e.dead || e.deadT > 0);
}
function walker(e, dt) {
  if (e.stun > 0) e.vx = approach(e.vx, 0, 900 * dt);
  else {
    e.vx = e.dir * e.speed;
    if (e.onGround) {
      const fx = e.dir > 0 ? e.x + e.w + 2 : e.x - 2;
      const ftx = Math.floor(fx / T);
      const below = TDEF[L.get(ftx, Math.floor((e.y + e.h + 4) / T))];
      if (L.solid(ftx, Math.floor((e.y + e.h - 4) / T)) || !(below.solid || below.oneway)) e.dir *= -1;
    }
  }
  e.vy = Math.min(e.vy + GRAV * dt, MAX_FALL);
  moveBody(e, dt, false);
  if (e.hitWall && e.stun <= 0) e.dir = -e.hitWall;
  e.moving = Math.abs(e.vx) > 5;
}
function batAI(e, dt) {
  const p = player;
  const dx = p.cx - (e.x + e.w / 2), dy = p.cy - (e.y + e.h / 2), d = Math.hypot(dx, dy) || 1;
  if (e.stun > 0) { e.vx *= 0.9; e.vy *= 0.9; }
  else if (d < 7 * T && p.state !== 'dead') {
    e.vx = approach(e.vx, (dx / d) * e.speed, 320 * dt);
    e.vy = approach(e.vy, (dy / d) * e.speed + Math.sin(e.t * 5) * 50, 320 * dt);
  } else {
    const tx = e.homeX + Math.sin(e.t * 1.3) * 40, ty = e.homeY + Math.sin(e.t * 2.1) * 14;
    e.vx = (tx - e.x) * 1.6; e.vy = (ty - e.y) * 1.6;
  }
  e.dir = e.vx >= 0 ? 1 : -1;
  moveBody(e, dt, false);
}
function snowAI(e, dt) {
  const p = player;
  const dx = p.cx - (e.x + e.w / 2), dy = p.cy - (e.y + e.h / 2);
  e.dir = dx >= 0 ? 1 : -1;
  e.cool -= dt;
  if (e.cool <= 0 && Math.abs(dx) < 9 * T && Math.abs(dy) < 6 * T && p.state !== 'dead' && e.stun <= 0) {
    e.cool = rand(2.6, 3.6); e.throwT = 0.35;
    const tf = clamp(Math.abs(dx) / 250, 0.6, 1.3), g = 1100;
    const vx = dx / tf, vy = (dy - 0.5 * g * tf * tf) / tf;
    projectiles.push({ kind: 'snow', x: e.x + e.w / 2 - 7, y: e.y - 8, w: 14, h: 14, vx, vy: Math.max(vy, -720), g, t: 0, rot: 0, enemy: true });
    sfx('throw');
  }
  e.vy = Math.min(e.vy + GRAV * dt, MAX_FALL); e.vx = approach(e.vx, 0, 900 * dt);
  moveBody(e, dt, false);
}
function jellyAI(e, dt) {
  const p = player;
  if (e.onGround) {
    e.vx = 0; e.hopT -= dt; e.squash = approach(e.squash, 1, dt * 3);
    if (e.hopT <= 0 && e.stun <= 0) {
      const dx = p.cx - (e.x + e.w / 2);
      if (Math.abs(dx) < 8 * T) e.dir = Math.sign(dx) || e.dir;
      const ahead = Math.floor((e.x + e.w / 2 + e.dir * 3 * T) / T);
      const landing = L.get(ahead, Math.floor((e.y + e.h + 4) / T));
      if (TDEF[landing].hazard === 'lava' || TDEF[L.get(ahead - e.dir, Math.floor((e.y + e.h + 4) / T))].hazard === 'lava') e.dir *= -1;
      e.vy = -430; e.vx = e.dir * e.speed; e.hopT = rand(1.1, 1.9); e.squash = 0.72;
    }
  } else e.squash = approach(e.squash, 1.12, dt * 4);
  e.vy = Math.min(e.vy + GRAV * dt, MAX_FALL);
  moveBody(e, dt, false);
  if (e.hitWall) e.dir = -e.hitWall;
}
function contactEnemy(p, e) {
  if (p.superT > 0) { killEnemy(e, Math.sign(e.x - p.x) || 1); return; }
  const stomp = p.vy > 40 && p.y + p.h - e.y < 15 && p.state !== 'climb';
  if (stomp) {
    hurtEnemy(e, p.state === 'pound' ? 2 : 1, 0);
    p.vy = Input.state.jump.down ? -580 : -430;
    if (p.state === 'pound') p.state = 'normal';
    sfx('stomp'); popText(e.x + e.w / 2, e.y - 4, '꾹!', '#ffffff', 16);
    return;
  }
  if (e.stun > 0.3) return;
  hurtPlayer(Math.sign(p.cx - (e.x + e.w / 2)) || -p.facing);
}
function hurtEnemy(e, dmg, dir) {
  if (e.dead) return;
  e.hp -= dmg; e.flash = 0.15; e.stun = 0.55;
  if (dir) { e.vx = dir * 220; if (e.type !== 'bat') e.vy = -240; }
  if (e.hp <= 0) killEnemy(e, dir || 1);
  else { sfx('hit'); popText(e.x + e.w / 2, e.y - 6, '한 번 더!', '#ffffff', 14); }
}
function killEnemy(e, dir, noDrop) {
  if (e.dead) return;
  e.dead = true; e.deadT = 1.2; e.vy = -380; e.vx = (dir || 1) * 140;
  sfx('pop');
  sparkle(e.x + e.w / 2, e.y + e.h / 2, 8, '#ffffff');
  if (!noDrop) {
    for (let i = 0; i < e.bananas; i++) spawnItem('banana', e.x + e.w / 2, e.y + e.h / 2, true);
    if (player.hearts < MAX_HEARTS && Math.random() < 0.22) spawnItem('heart', e.x + e.w / 2, e.y, true);
    popText(e.x + e.w / 2, e.y - 6, '퍽!', '#ffffff', 18);
  }
  G.enemiesBeaten++;
}

// ===================== 던진 것들 =====================
function updateProjectiles(dt) {
  const p = player;
  for (const pr of projectiles) {
    if (pr.dead) continue;
    pr.t += dt;
    pr.vy = Math.min(pr.vy + pr.g * dt, 900);
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    pr.rot += pr.vx * 0.012 * dt;
    if (pr.kind === 'chunk') {
      const hits = [];
      forTiles(pr, (tx, ty) => { if (L.solid(tx, ty)) hits.push([tx, ty]); });
      if (hits.length) { for (const [tx, ty] of hits) damageTile(tx, ty, 3, 'throw'); shatter(pr); continue; }
      for (const e of enemies) if (!e.dead && overlap(pr, e)) { hurtEnemy(e, 2, Math.sign(pr.vx) || 1); shatter(pr); break; }
      if (!pr.dead && boss && boss.state !== 'under' && boss.state !== 'defeated' && overlap(pr, bossBox())) { bossHurt(1); shatter(pr); }
      if (!pr.dead && (pr.t > 3 || hazardIn(pr) === 'lava')) shatter(pr);
    } else {
      if (rectSolid(pr.x, pr.y, pr.w, pr.h)) {
        if (pr.kind === 'rock') landRock(pr);
        else { sparkle(pr.x + 7, pr.y + 7, 6, '#ffffff'); sfx('hit'); }
        pr.dead = true; continue;
      }
      if (p.state !== 'dead' && p.state !== 'door' && overlap(pr, { x: p.x + 3, y: p.y + 3, w: p.w - 6, h: p.h - 4 })) {
        if (p.invuln <= 0 && p.superT <= 0) hurtPlayer(Math.sign(pr.vx) || 1);
        sparkle(pr.x + pr.w / 2, pr.y + pr.h / 2, 6, '#ffffff');
        pr.dead = true; continue;
      }
      if (pr.t > 4) pr.dead = true;
    }
  }
  if (projectiles.some((q) => q.dead)) projectiles = projectiles.filter((q) => !q.dead);
}
function shatter(pr) {
  pr.dead = true;
  const x = pr.x + pr.w / 2, y = pr.y + pr.h / 2;
  debris(x, y, tileColors(pr.tile), 9, 1);
  sfx(pr.tile === TILE.CRYSTAL ? 'breakCrystal' : pr.tile === ROCK ? 'breakHard' : 'breakSoft');
  shake(3);
  const d = TDEF[pr.tile] || {};
  if (pr.tile === TILE.BOOM) { explode(x, y); return; }
  for (let i = 0; i < (d.bananas || 0); i++) spawnItem('banana', x, y - 4, true);
  if (d.heart) spawnItem('heart', x, y - 4, true);
  popText(x, y - 8, '와장창!', '#ffe066', 16);
}
function landRock(pr) {
  const rocks = items.filter((i) => i.type === 'rock' && !i.dead);
  if (rocks.length >= 4) { rocks[0].dead = true; debris(rocks[0].x, rocks[0].y, tileColors(ROCK), 5, 0.6); }
  let x = pr.x + pr.w / 2, y = pr.y + pr.h / 2;
  if (rectSolid(x - 1, y - 1, 2, 2)) y -= T * 0.6;
  spawnItem('rock', x, y, false, { phys: true, vx: 0, vy: 0 });
  shake(3); sfx('hit'); dust(x, y + 8, 3);
  if (!G.rockTold && hasGrab()) { G.rockTold = true; bubbleAt(x, y - 30, fill('바위를 {grab} 눌러 들고 던져 봐!'), 4); speak('바위를 {grab} 눌러 들고 던져 봐!'); }
}

// ===================== 보스: 두더지 대왕 =====================
function spawnBoss(tx, ty) {
  boss = { x: tx * T, y: ty * T, w: 72, h: 60, vx: 0, vy: 0, facing: -1, hp: 8, maxHp: 8, state: 'intro', t: 0,
    onGround: false, flash: 0, inv: 0, drill: 0, sink: 0, moundX: 0, cycle: 0, rocks: 0, landed: false, angry: false,
    hitWall: 0, dropT: 0, rainT: 0, exploded: 0 };
}
function bossBox() { const b = boss; return { x: b.x + 6, y: b.y + b.sink * b.h, w: b.w - 12, h: Math.max(4, b.h * (1 - b.sink)) }; }
function setBoss(s) { boss.state = s; boss.t = 0; boss.rocks = 0; if (s === 'stunned' || s === 'tired') boss.openHits = 0; }
const bossOpen = () => boss && (boss.state === 'stunned' || boss.state === 'tired');

function updateBoss(dt) {
  const b = boss, p = player;
  b.t += dt; b.flash -= dt; b.inv -= dt;
  b.drill += dt * (b.state === 'prep' || b.state === 'charge' || b.state === 'burrow' ? 32 : 6);
  const ph2 = b.hp <= b.maxHp / 2;
  const face = () => { b.facing = p.cx < b.x + b.w / 2 ? -1 : 1; };
  const fall = () => { b.vy = Math.min(b.vy + GRAV * dt, MAX_FALL); moveBody(b, dt, false); };
  switch (b.state) {
    case 'intro':
      fall();
      if (b.onGround && !b.landed) {
        b.landed = true; b.t = 0; shake(12); Sound.sfx('crash'); Sound.sfx('bossRoar');
        pushBanner('두더지 대왕이 나타났다!', '벽에 쿵 부딪혀 어지러울 때 펀치!', '#ff9fd2');
        say('두더지 대왕이 나타났다! 대왕이 벽에 쿵 부딪혀서 어지러울 때 펀치해!');
      }
      if (b.landed && b.t > 2.8) setBoss('idle');
      break;
    case 'idle':
      face(); if (b.onGround && b.vy >= 0) b.vx = 0; fall();
      if (b.t > (ph2 ? 0.55 : 0.95)) {
        const seq = ['prep', 'throw', 'prep', 'burrow'];
        setBoss(seq[b.cycle++ % seq.length]);
      }
      break;
    case 'prep':
      b.vx = 0; fall();
      if (b.t < dt * 1.5) { Sound.sfx('drill'); popText(b.x + b.w / 2, b.y - 40, '!', '#ff4d6d', 30); }
      if (b.t > (ph2 ? 0.7 : 1.05)) { setBoss('charge'); }
      break;
    case 'charge':
      b.vx = b.facing * (ph2 ? 470 : 380); fall();
      if (Math.random() < dt * 30) dust(b.x + b.w / 2 - b.facing * 30, b.y + b.h, 1);
      if (b.hitWall) {
        const tx = b.hitWall > 0 ? Math.floor((b.x + b.w + 2) / T) : Math.floor((b.x - 2) / T);
        for (let ty = Math.floor(b.y / T); ty <= Math.floor((b.y + b.h - 1) / T); ty++) damageTile(tx, ty, 9, 'boss');
        setBoss('stunned'); b.vx = -b.facing * 140; b.vy = -260;
        shake(14); Sound.sfx('crash'); popText(b.x + b.w / 2, b.y - 20, '쿵!', '#ffe066', 30);
        if (!G.stunTold) { G.stunTold = true; bubbleAt(b.x + b.w / 2, b.y - 50, '지금이야! 펀치!', 2.5); say('지금이야! 펀치!'); }
      }
      if (b.t > 4) setBoss('idle');
      break;
    case 'stunned':
      b.vx = approach(b.vx, 0, 600 * dt); fall();
      if (b.t > (ph2 ? 2.7 : 3.3)) setBoss('idle');
      break;
    case 'throw': {
      face(); b.vx = 0; fall();
      const n = ph2 ? 5 : 3, gap = ph2 ? 0.45 : 0.62;
      if (b.rocks < n && b.t > 0.35 + b.rocks * gap) { bossThrow(b); b.rocks++; }
      if (b.t > 0.35 + n * gap + 0.5) setBoss('idle');
      break;
    }
    case 'burrow':
      b.vx = 0; b.sink = Math.min(1, b.t / 0.6);
      if (b.t < dt * 1.5) Sound.sfx('drill');
      if (Math.random() < dt * 25) debris(b.x + rand(0, b.w), floorY - 4, tileColors(TILE.SOFT), 1, 0.6);
      if (b.sink >= 1) { setBoss('under'); b.moundX = b.x + b.w / 2; }
      break;
    case 'under': {
      b.sink = 1;
      b.moundX = approach(b.moundX, p.cx, (ph2 ? 230 : 165) * dt);
      if (Math.random() < dt * 22) dust(b.moundX + rand(-20, 20), floorY - 2, 1);
      if ((b.t % 0.6) < dt) sfx('rumble');
      if (b.t > (ph2 ? 1.7 : 2.3)) {
        setBoss('popup');
        b.x = clamp(b.moundX - b.w / 2, T + 2, (L.w - 1) * T - b.w - 2); b.y = floorY - b.h; b.vy = -780; b.sink = 0;
        shake(10); Sound.sfx('crash'); debris(b.moundX, floorY - 8, tileColors(TILE.SOFT), 12, 1.3);
      }
      break;
    }
    case 'popup':
      fall();
      if (b.onGround && b.t > 0.2) setBoss('tired');
      break;
    case 'tired':
      b.vx = 0; fall();
      if (b.t > 1.8) setBoss('idle');
      break;
    case 'defeated':
      b.vx = 0; fall();
      if (b.t - b.exploded > 0.22 && b.t < 2.4) {
        b.exploded = b.t;
        const x = b.x + rand(0, b.w), y = b.y + rand(0, b.h);
        addPart({ k: 'ring', x, y, vx: 0, vy: 0, life: 0.4, max: 0.4, size: 50, color: '#ffe066' });
        sparkle(x, y, 8, '#ffb000'); Sound.sfx('boom'); shake(6);
      }
      if (b.t > 2.4) {
        b.rainT -= dt;
        if (b.rainT <= 0 && b.t < 4.6) { b.rainT = 0.05; spawnItem('banana', rand(2 * T, (L.w - 2) * T), T * 1.5, true, { vy: 0, vx: rand(-30, 30), delay: 0.1 }); }
      }
      if (b.t > 6) finishGame();
      break;
    default: break;
  }
  // 몸통 부딪힘
  if (b.state !== 'defeated' && p.state !== 'dead' && p.state !== 'door' && !(b.state === 'under' || (b.state === 'burrow' && b.sink > 0.6))) {
    const box = bossBox();
    if (overlap(p, box)) {
      const stomp = p.vy > 40 && p.y + p.h - box.y < 18;
      if (stomp) {
        if (bossOpen() || p.superT > 0) bossHurt(1); else { sfx('clink'); popText(p.cx, p.y + p.h, '팅!', '#d8e6f0', 16); }
        p.vy = -560; if (p.state === 'pound') p.state = 'normal';
      } else if (bossOpen() || p.superT > 0) {
        p.vx = (Math.sign(p.cx - (b.x + b.w / 2)) || 1) * 160;
        if (p.superT > 0 && b.inv <= 0) bossHurt(1);
      } else hurtPlayer(Math.sign(p.cx - (b.x + b.w / 2)) || -1);
    }
  }
}
function bossThrow(b) {
  const p = player;
  const x = b.x + b.w / 2 + b.facing * 14, y = b.y - 26;
  const target = p.cx + rand(-36, 36), tf = 0.95, g = 1300;
  const ty = p.y + p.h - 14;
  projectiles.push({ kind: 'rock', x: x - 12, y: y - 12, w: 24, h: 24, vx: (target - x) / tf, vy: (ty - y - 0.5 * g * tf * tf) / tf, g, t: 0, rot: 0, enemy: true });
  sfx('throw');
}
function punchBoss(dmg) {
  if (!boss || boss.state === 'defeated') return;
  if (bossOpen() || player.superT > 0) bossHurt(dmg);
  else {
    sfx('clink'); popText(boss.x + boss.w / 2, boss.y - 10, '팅!', '#d8e6f0', 18);
    if (!G.bossTip || G.time - G.bossTip > 8) { G.bossTip = G.time; bubbleAt(boss.x + boss.w / 2, boss.y - 46, '너무 단단해! 벽에 부딪힐 때를 노려!', 3); }
  }
}
function bossHurt(n) {
  const b = boss;
  if (!b || b.inv > 0 || b.state === 'defeated' || b.state === 'intro') return;
  b.hp -= n; b.inv = 0.3; b.flash = 0.2;
  Sound.sfx('bossHit'); shake(8); G.hitstop = Math.max(G.hitstop, 0.06);
  popText(b.x + b.w / 2, b.y - 16, '쾅!', '#ffe066', 30);
  for (let i = 0; i < 3; i++) spawnItem('banana', b.x + b.w / 2, b.y + 10, true);
  if (bossOpen() && b.hp > 0) {
    b.openHits = (b.openHits || 0) + 1;
    if (b.openHits >= 3) {
      // 세 번 맞으면 정신을 차리고 뒤로 폴짝
      setBoss('idle'); b.inv = 0.8;
      b.vx = (Math.sign(b.x + b.w / 2 - player.cx) || 1) * 220; b.vy = -380;
      popText(b.x + b.w / 2, b.y - 40, '으악!', '#ffffff', 22);
    }
  }
  if (b.hp <= 0) {
    b.hp = 0; setBoss('defeated'); b.exploded = 0;
    Sound.stopMusic(); Sound.sfx('win');
    pushBanner('해냈다!', '두더지 대왕을 물리쳤어요!', '#ffe066');
    say(`해냈다! ${callName()}, 두더지 대왕을 물리쳤어!`);
    player.invuln = 10;
  } else if (!b.angry && b.hp <= b.maxHp / 2) {
    b.angry = true;
    pushBanner('두더지 대왕이 화났다!', '더 빨라졌어요. 조심!', '#ff9fd2');
  }
}

// ===================== 문, 깃발, 표지판 =====================
function updateObjects(dt) {
  const p = player;
  G.activeSign = null;
  for (const s of signs) {
    s.near = Math.abs(p.cx - (s.x + T / 2)) < 1.6 * T && Math.abs(p.y + p.h - (s.y + T)) < 2.4 * T && p.state !== 'dead';
    if (s.near) { G.activeSign = s; if (!s.spoken) { s.spoken = true; speak(s.text); } }
  }
  for (const f of flags) {
    if (f.active) f.raise = Math.min(1, f.raise + dt * 2);
    if (!f.active && overlap(p, { x: f.x, y: f.y - T, w: T, h: 2 * T }) && p.state !== 'dead') {
      f.active = true;
      checkpoint = { x: f.x + (T - p.w) / 2, y: f.y + T - p.h };
      Sound.sfx('checkpoint'); sparkle(f.x + T / 2, f.y - 10, 10, '#ffe066');
      popText(f.x + T / 2, f.y - 30, '여기서 다시 시작!', '#ffe066', 15);
    }
  }
  if (door) {
    const n = gemCount(stage.key);
    door.lit = Math.min(n, stage.need);
    door.msgT -= dt;
    if (door.state === 'opening') { door.open = Math.min(1, door.open + dt * 1.3); if (door.open >= 1) door.state = 'open'; }
    if ((p.state === 'normal' || p.state === 'climb') && overlap(p, { x: door.x + 12, y: door.y + 10, w: door.w - 24, h: door.h - 10 })) {
      if (n >= stage.need) {
        if (door.state === 'locked') { door.state = 'opening'; Sound.sfx('door'); }
        if (door.state === 'open' && p.onGround) {
          p.state = 'door'; p.stateT = 0.9; p.vx = 0;
          if (p.superT > 0) { p.superT = 0; }
        }
      } else if (door.msgT <= 0) {
        door.msgT = 4.5;
        const msg = `보석이 ${stage.need}개 있어야 열려요. 지금 ${n}개!`;
        bubbleAt(door.x + door.w / 2, door.y - 16, msg, 3.5);
        Sound.sfx('locked');
        say(`보석이 ${stage.need}개 있어야 문이 열려. 지금은 ${n}개야. 짝짝으로 보석을 찾아봐!`);
      }
    }
  }
}

// ===================== 안내 문구 =====================
function pushBanner(text, sub, color) {
  G.banners.push({ text, sub: sub || '', color: color || '#ffffff', t: 0, dur: 2.6 });
}
function bubbleAt(x, y, text, dur) { G.bubble = { x, y, text, t: 0, dur: dur || 3 }; }
function say(tpl, show) { speak(tpl); if (show) bubbleAt(player.cx, player.y - 30, fill(tpl), 3); }

function updateHints(dt) {
  if (G.banner) { G.banner.t += dt; if (G.banner.t > G.banner.dur) G.banner = null; }
  if (!G.banner && G.banners.length) G.banner = G.banners.shift();
  if (G.bubble) { G.bubble.t += dt; if (G.bubble.t > G.bubble.dur) G.bubble = null; }
  G.revealT = Math.max(0, G.revealT - dt);
  G.compassT = Math.max(0, G.compassT - dt);
  if (G.fadeDir < 0) { G.fade = Math.max(0, G.fade - dt * 2.5); if (G.fade <= 0) G.fadeDir = 0; }
  if (stage.gems && gemCount(stage.key) < stage.gems && player.state === 'normal') {
    G.hintT += dt;
    if (G.hintT > 55) {
      G.hintT = 0;
      say('{clap} 누르면 짝짝! 보석이 어디 있는지 알려 줄게.', true);
    }
  }
  G.saveT += dt;
  if (G.saveT > 8) { G.saveT = 0; Save.save(); }
}

// ===================== 카메라 =====================
function updateCamera(dt, snap) {
  const p = player;
  const lookY = Input.state.down.down && p.onGround ? 70 : 0;
  let fx = p.cx + p.facing * 50;
  if (boss && boss.state !== 'under' && boss.state !== 'defeated') {
    // 보스 싸움에서는 뭉치와 대왕이 같이 보이게
    const margin = Math.min(140, view.w * 0.25);
    fx = clamp((p.cx + boss.x + boss.w / 2) / 2, p.cx - view.w / 2 + margin, p.cx + view.w / 2 - margin);
  }
  let tx = fx - view.w / 2;
  let ty = p.cy - 24 + lookY - view.h / 2;
  const minX = 0, maxX = L.w * T - view.w;
  const minY = stage.skyRows !== undefined ? T : 0, maxY = L.h * T - view.h;
  tx = maxX < minX ? (minX + maxX) / 2 : clamp(tx, minX, maxX);
  ty = maxY < minY ? (minY + maxY) / 2 : clamp(ty, minY, maxY);
  if (snap) { cam.x = tx; cam.y = ty; return; }
  cam.x += (tx - cam.x) * (1 - Math.exp(-dt * 7));
  cam.y += (ty - cam.y) * (1 - Math.exp(-dt * 6));
}

// ===================== 스테이지 시작 / 끝 =====================
function startStage(i) {
  stageIndex = i; stage = STAGES[i];
  theme = THEMES[stage.boss ? 'boss' : stage.key];
  L = new Level(stage);
  atlas = null;
  enemies = []; items = []; projectiles = []; parts = []; booms = []; flags = []; signs = [];
  boss = null; door = null; floorY = 0;
  Object.assign(G, { time: 0, stageT: 0, shake: 0, hitstop: 0, flash: 0, fade: 1, fadeDir: -1, banner: null, banners: [], bubble: null,
    revealT: 0, compassT: 0, hintT: 0, stageBananas: 0, firstOpen: gemCount(stage.key) >= stage.need, enemiesBeaten: 0,
    clapUsed: false, lowTold: false, rockTold: false, stunTold: false, superTold: false, bossTip: 0 });
  const gemsSaved = Save.data.gems[stage.key] || [];
  for (const s of L.spawns) {
    const x = s.tx * T, y = s.ty * T;
    switch (s.ch) {
      case 'P': startPos = { x: x + (T - 24) / 2, y: y + T - 38 }; break;
      case 'B': spawnItem('banana', x + T / 2, y + T / 2, false); break;
      case 'Q': spawnItem('bunch', x + T / 2, y + T / 2, false); break;
      case 'h': spawnItem('heart', x + T / 2, y + T / 2, false); break;
      case 'F': flags.push({ x, y, active: false, raise: 0 }); break;
      case 'D': door = { x, y, w: 2 * T, h: 3 * T, state: 'locked', open: 0, lit: 0, msgT: 0 }; break;
      case 'T': signs.push({ x, y, text: L.signs[s.key] || '', near: false, spoken: false }); break;
      case 'K': spawnBoss(s.tx, s.ty); break;
      default:
        if (EDEF[s.ch]) spawnEnemy(s.ch, s.tx, s.ty);
        else if (s.ch >= '1' && s.ch <= '5') {
          const id = +s.ch;
          const it = spawnItem('gem', x + T / 2, y + T / 2, false, { id, ghost: !!gemsSaved[id - 1], tx: s.tx, ty: s.ty });
          it.embedded = L.solid(s.tx, s.ty);
        }
    }
  }
  if (!startPos) startPos = { x: 3 * T, y: 3 * T };
  player = makePlayer(startPos.x, startPos.y);
  checkpoint = { ...startPos };
  if (boss) {
    const mid = Math.floor(L.w / 2);
    for (let ty = 2; ty < L.h; ty++) if (L.solid(mid, ty)) { floorY = ty * T; break; }
  }
  updateCamera(0, true);
  G.state = 'play'; G.paused = false;
  UI.hideAll();
  UI.inGame(true);
  Input.clearAll();
  Sound.playMusic(stage.music);
  pushBanner(`${stage.floor} ${stage.name}`, stage.boss ? '두더지 대왕을 물리쳐요!' : `반짝 보석 ${stage.need}개를 찾아 문을 열어요`, '#ffe066');
  say(stage.boss ? `${stage.name}! 두더지 대왕을 혼내 주자!` : `${stage.floor} ${stage.name}! 반짝 보석 세 개를 찾아서 문을 열자!`);
  requestWake();
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

function stageClear() {
  const first = !Save.data.cleared[stage.key];
  Save.data.cleared[stage.key] = true;
  Save.save();
  G.state = 'clear';
  UI.inGame(false);
  // 클리어 화면 뒤로 문 앞에서 기뻐하는 뭉치
  const p = player;
  p.state = 'celebrate'; p.stateT = 999; p.alpha = 1; p.hold = 0; p.superT = 0;
  if (door) { p.x = door.x + door.w / 2 - p.w / 2; p.y = door.y + door.h - p.h; p.facing = 1; }
  G.fade = 0; G.banner = null; G.banners = []; G.bubble = null; G.activeSign = null;
  updateCamera(0, true);
  Sound.playMusic('win');
  Sound.sfx('win');
  const n = gemCount(stage.key);
  const el = UI.screens.clear;
  el.querySelector('.clear-title').textContent = `${stage.floor} 클리어!`;
  el.querySelector('.clear-bananas').textContent = `${G.stageBananas}개`;
  el.querySelector('.clear-gems').textContent = `${n} / ${stage.gems}개`;
  el.querySelector('.clear-tip').textContent = n < stage.gems ? `숨은 보석이 ${stage.gems - n}개 더 있어요. 나중에 다시 찾아봐요!` : '이 층의 보석을 모두 찾았어요!';
  const rw = el.querySelector('.reward');
  if (first && stage.reward) {
    rw.hidden = false;
    rw.querySelector('.reward-title').textContent = stage.reward.title;
    rw.querySelector('.reward-text').textContent = fill(stage.reward.text);
  } else rw.hidden = true;
  const next = STAGES[stageIndex + 1];
  const nb = el.querySelector('[data-act="next"]');
  nb.hidden = !next;
  if (next) nb.textContent = next.boss ? '대왕의 방으로!' : '다음 층으로!';
  UI.show('clear');
  say(first && stage.reward ? `${stage.floor} 클리어! 새로운 힘, ${stage.reward.title}!` : `${stage.floor} 클리어! 잘했어, ${callName()}!`);
  releaseWake();
}

function finishGame() {
  Save.data.cleared.boss = true; Save.data.endingSeen = true; Save.save();
  G.state = 'ending'; UI.inGame(false);
  const el = UI.screens.ending;
  el.querySelector('.end-text').textContent = `해냈다! ${nameWith()} 뭉치 덕분에 바나나가 정글로 돌아왔어요. 두더지 대왕도 "미안해!" 하고 사과했대요.`;
  el.querySelector('.end-gems').textContent = `${totalGems()} / 20개`;
  el.querySelector('.end-bananas').textContent = `${Save.data.bananasTotal}개`;
  el.querySelector('.end-tip').textContent = totalGems() < 20 ? '숨은 보석을 모두 모으면 황금 왕관을 받을 수 있어요!' : '보석을 모두 모았어요! 옷장에서 황금 왕관을 써 봐요!';
  UI.show('ending');
  Sound.playMusic('win');
  say(`해냈다! ${callName()}, 바나나가 모두 돌아왔어! 고마워!`);
  releaseWake();
}

function pauseGame() {
  if (G.state !== 'play') return;
  G.state = 'pause'; UI.show('pause'); UI.inGame(false, true);
  Voice.stop();
}
function resumeGame() {
  if (G.state !== 'pause') return;
  G.state = 'play'; UI.hideAll(); UI.inGame(true); Input.clearAll();
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}
function goMap() {
  Save.save(); releaseWake(); Voice.stop();
  G.state = 'map'; UI.inGame(false); buildMap(); UI.show('map'); Sound.playMusic('title');
}
function goTitle() {
  Save.save(); releaseWake(); Voice.stop();
  G.state = 'title'; UI.inGame(false); updateTitleBubble(); UI.show('title'); Sound.playMusic('title');
}

// ===================== 그리기: 세계 =====================
function drawLava(x0, y0, w, h, tx, ty) {
  const top = L.get(tx, ty - 1) !== TILE.LAVA;
  ctx.fillStyle = '#e2400f'; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x0, y0 + h * 0.35, w, h * 0.3);
  if (top) {
    ctx.fillStyle = '#ffc23a';
    ctx.beginPath(); ctx.moveTo(x0, y0 + h * 0.42);
    for (let k = 0; k <= 4; k++) ctx.lineTo(x0 + (w * k) / 4, y0 + h * (0.14 + 0.08 * Math.sin(G.time * 3 + tx * 1.7 + k * 1.3)));
    ctx.lineTo(x0 + w, y0 + h * 0.42); ctx.closePath(); ctx.fill();
  }
  const hs = hash2(tx, ty);
  const ph = (G.time * 0.7 + (hs % 100) / 100) % 1;
  ctx.fillStyle = '#ffd36e';
  circ(ctx, x0 + w * (((hs >> 8) % 80) / 100 + 0.1), y0 + h * (0.95 - ph * 0.7), w * 0.07 * (1 - ph * 0.5));
}

function drawTiles(A, ox, oy, s) {
  const tx0 = Math.max(0, Math.floor(-ox / s / T) - 1), tx1 = Math.min(L.w - 1, Math.floor((-ox / s + view.w) / T) + 1);
  const ty0 = Math.max(0, Math.floor(-oy / s / T) - 1), ty1 = Math.min(L.h - 1, Math.floor((-oy / s + view.h) / T) + 1);
  const X = (tx) => Math.round(tx * T * s + ox), Y = (ty) => Math.round(ty * T * s + oy);
  for (let ty = ty0; ty <= ty1; ty++) {
    const y0 = Y(ty), hh = Y(ty + 1) - y0;
    for (let tx = tx0; tx <= tx1; tx++) {
      const i = ty * L.w + tx;
      if (!TDEF[L.t[i]].solid && L.bg[i]) { const x0 = X(tx); ctx.drawImage(A.wall[L.v[i]], x0, y0, X(tx + 1) - x0, hh); }
    }
  }
  const lw = Math.max(1, Math.round(2 * s));
  const armed = new Set(booms.map((b) => b.ty * L.w + b.tx));
  for (let ty = ty0; ty <= ty1; ty++) {
    const y0 = Y(ty), hh = Y(ty + 1) - y0;
    for (let tx = tx0; tx <= tx1; tx++) {
      const i = ty * L.w + tx, t = L.t[i];
      if (t === TILE.AIR) continue;
      const x0 = X(tx), ww = X(tx + 1) - x0;
      if (t === TILE.LAVA) { drawLava(x0, y0, ww, hh, tx, ty); continue; }
      const imgs = A.tiles[t];
      if (imgs) ctx.drawImage(imgs[L.v[i]], x0, y0, ww, hh);
      const d = TDEF[t];
      if (!d.solid) continue;
      if (d.hp > 1 && L.hp[i] < d.hp) {
        const r = 1 - L.hp[i] / d.hp;
        ctx.drawImage(A.cracks[r > 0.7 ? 2 : r > 0.4 ? 1 : 0], x0, y0, ww, hh);
      }
      if (armed.has(i) && Math.floor(G.time * 16) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fillRect(x0, y0, ww, hh); }
      const up = !TDEF[L.get(tx, ty - 1)].solid, dn = !TDEF[L.get(tx, ty + 1)].solid;
      const lf = !TDEF[L.get(tx - 1, ty)].solid, rt = !TDEF[L.get(tx + 1, ty)].solid;
      ctx.fillStyle = theme.outline;
      if (up) ctx.fillRect(x0, y0, ww, lw);
      if (dn) ctx.fillRect(x0, y0 + hh - lw, ww, lw);
      if (lf) ctx.fillRect(x0, y0, lw, hh);
      if (rt) ctx.fillRect(x0 + ww - lw, y0, lw, hh);
      if (up) {
        if (t === TILE.SOFT_TOP) ctx.drawImage(A.top[L.v[i]], x0, y0 - Math.round(8 * s), ww, Math.round(20 * s));
        else { ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x0, y0 + lw, ww, lw); }
      }
    }
  }
}

function drawHeld(tile, x, y, size, rot, A) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
  if (tile === ROCK) drawRock(ctx, 0, 0, size / 24, 0);
  else if (A.tiles[tile]) {
    ctx.drawImage(A.tiles[tile][0], -size / 2, -size / 2, size, size);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(-size / 2, -size / 2, size, size);
  }
  ctx.restore();
}

function playerPose(p) {
  if (p.state === 'dead') return 'dead';
  if (p.state === 'hurt') return 'hurt';
  if (p.state === 'celebrate') return 'cheer';
  if (p.state === 'pound') return 'pound';
  if (p.state === 'climb') return 'climb';
  if (p.punchT > 0) return p.punchDir === 'up' ? 'punchU' : p.punchDir === 'down' ? 'punchD' : 'punchF';
  if (p.clapT > 0) return 'clap';
  if (p.hold) return 'hold';
  if (!p.onGround) return p.vy < 0 ? 'jump' : 'fall';
  if (Math.abs(p.vx) > 20) return 'walk';
  return 'idle';
}

function drawWorld() {
  const A = getAtlas();
  const s = view.s;
  let sx = 0, sy = 0;
  if (G.shake > 0.2) { sx = rand(-G.shake, G.shake); sy = rand(-G.shake, G.shake); }
  G.camX = cam.x + sx; G.camY = cam.y + sy;
  const ox = -G.camX * s, oy = -G.camY * s;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  drawBackground(ctx, theme, G.camX, G.camY, view.w, view.h, G.time, stage.horizonRow !== undefined ? (stage.horizonRow + 1) * T : 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawTiles(A, ox, oy, s);
  ctx.setTransform(s, 0, 0, s, ox, oy);
  const vx0 = G.camX - 80, vx1 = G.camX + view.w + 80, vy0 = G.camY - 120, vy1 = G.camY + view.h + 120;
  const vis = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
  if (door && vis(door.x, door.y)) drawDoor(ctx, door.x, door.y, door.w, door.h, door.lit, stage.need, door.open, G.time, theme);
  for (const f of flags) if (vis(f.x, f.y)) drawFlag(ctx, f.x + T / 2, f.y + T, f.active, f.raise, G.time);
  for (const sg of signs) if (vis(sg.x, sg.y)) drawSign(ctx, sg.x + T / 2, sg.y + T, sg.near, G.time);
  for (const it of items) {
    if (it.embedded || !vis(it.x, it.y)) continue;
    const bob = it.phys || it.magnet ? 0 : Math.sin(it.t * 3) * 3;
    switch (it.type) {
      case 'banana': drawBanana(ctx, it.x, it.y + bob, 1, Math.sin(it.t * 2) * 0.3); break;
      case 'bunch': drawBunch(ctx, it.x, it.y + bob, 1.1, it.t); break;
      case 'heart': drawHeartItem(ctx, it.x, it.y + bob, 1, it.t); break;
      case 'gem': drawGem(ctx, it.x, it.y + bob, it.ghost ? 0.9 : 1.05, it.t, it.ghost ? 0.38 : 1); break;
      case 'rock': drawRock(ctx, it.x, it.y, 1, 0); break;
      default: break;
    }
  }
  for (const e of enemies) {
    if (!vis(e.x, e.y)) continue;
    const cx = e.x + e.w / 2;
    ctx.save();
    if (e.dead) { ctx.translate(cx, e.y + e.h / 2); ctx.rotate(e.rot); ctx.translate(-cx, -(e.y + e.h / 2)); ctx.globalAlpha = clamp(e.deadT, 0, 1); }
    const o = { facing: e.dir, t: e.t, flash: e.flash, moving: e.moving, throwT: e.throwT, squash: e.squash, kind: e.type };
    if (e.type === 'mole' || e.type === 'snow') drawMole(ctx, cx, e.y + e.h, o);
    else if (e.type === 'crab') drawCrab(ctx, cx, e.y + e.h, o);
    else if (e.type === 'bat') drawBat(ctx, cx, e.y + e.h / 2, o);
    else if (e.type === 'jelly') drawJelly(ctx, cx, e.y + e.h, o);
    ctx.restore();
  }
  if (boss) {
    const b = boss;
    if (b.state === 'under') {
      const mx = b.moundX;
      ctx.fillStyle = theme.soft.dark; ell(ctx, mx, floorY, 34, 12 + Math.sin(G.time * 20) * 2);
      ctx.fillStyle = theme.soft.base; ell(ctx, mx, floorY - 2, 26, 8);
    } else {
      ctx.save();
      if (b.sink > 0) { ctx.beginPath(); ctx.rect(b.x - 80, b.y - 140, b.w + 160, floorY - (b.y - 140)); ctx.clip(); }
      ctx.translate(0, b.sink * (b.h + 30));
      if (b.state === 'defeated') ctx.globalAlpha = clamp(1 - (b.t - 2.2) / 1.5, 0, 1);
      drawBoss(ctx, b.x + b.w / 2, b.y + b.h, b, G.time);
      ctx.restore();
    }
  }
  const p = player;
  const blink = p.invuln > 0 && p.state !== 'dead' && p.state !== 'celebrate' && Math.floor(G.time * 14) % 2 === 0;
  if (!blink) {
    drawMoongchi(ctx, p.cx, p.y + p.h, {
      facing: p.facing, pose: playerPose(p), t: G.time, walk: p.walkPh, climb: p.climbPh, superT: p.superT,
      costume: Save.data.costume, rot: p.state === 'dead' ? p.rot : 0, alpha: p.state === 'door' ? p.alpha : 1,
    });
    if (p.hold) drawHeld(p.hold, p.cx + p.facing * 2, p.y - 20, 24, 0, A);
    if (p.state === 'celebrate') drawGem(ctx, p.cx + p.facing * 1, p.y - 34 - Math.sin(G.time * 8) * 2, 1.15, G.time * 3);
  }
  for (const pr of projectiles) {
    if (pr.kind === 'chunk') drawHeld(pr.tile, pr.x + 12, pr.y + 12, 24, pr.rot, A);
    else if (pr.kind === 'snow') drawSnowball(ctx, pr.x + 7, pr.y + 7, 7);
    else if (pr.kind === 'rock') drawRock(ctx, pr.x + 12, pr.y + 12, 1, pr.rot);
  }
  drawParts(parts);
  if (G.revealT > 0) {
    const a = Math.min(1, G.revealT / 1.2);
    for (const it of items) {
      if (it.type !== 'gem' || !it.embedded || it.ghost) continue;
      if (Math.abs(it.x - p.cx) > 16 * T || Math.abs(it.y - p.cy) > 12 * T) continue;
      ctx.save(); ctx.globalAlpha = a * (0.55 + 0.35 * Math.sin(G.time * 8));
      drawGem(ctx, it.x, it.y, 1, G.time);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.lineDashOffset = -G.time * 20;
      ctx.beginPath(); ctx.arc(it.x, it.y, 22, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
  }
  if (p.superT <= 0 && theme.key !== 'jungle' && p.state !== 'dead') {
    const lx = p.cx + p.facing * 9, ly = p.y - 3;
    const gl = ctx.createRadialGradient(lx, ly, 2, lx, ly, 90);
    gl.addColorStop(0, 'rgba(255,245,190,0.28)'); gl.addColorStop(1, 'rgba(255,245,190,0)');
    ctx.fillStyle = gl; circ(ctx, lx, ly, 90);
  }
}

// ===================== 그리기: 화면 위 글씨 (HUD) =====================
function text(str, x, y, size, color, align, stroke) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.24); ctx.strokeStyle = stroke || '#2b1d14';
  ctx.strokeText(str, x, y); ctx.fillStyle = color || '#ffffff'; ctx.fillText(str, x, y);
}
function wrapLines(str, maxW, size) {
  ctx.font = `${size}px ${FONT}`;
  const words = str.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const tryL = cur ? cur + ' ' + w : w;
    if (ctx.measureText(tryL).width <= maxW || !cur) cur = tryL;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
function speech(str, x, y, maxW) {
  const size = view.cssW < 560 ? 16 : 19;
  const lines = wrapLines(str, maxW, size);
  ctx.font = `${size}px ${FONT}`;
  const w = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width))) + 26;
  const lh = size * 1.3, h = lines.length * lh + 18;
  let bx = clamp(x - w / 2, 10 + safe.left, view.cssW - w - 10 - safe.right);
  let by = y - h - 14;
  if (by < 60 + safe.top) by = 60 + safe.top;
  ctx.fillStyle = 'rgba(43,29,20,0.35)'; rrect(ctx, bx + 3, by + 5, w, h, 14); ctx.fill();
  ctx.fillStyle = '#fff8e1'; rrect(ctx, bx, by, w, h, 14); ctx.fill();
  ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 3; ctx.stroke();
  const tx = clamp(x, bx + 18, bx + w - 18);
  ctx.fillStyle = '#fff8e1';
  ctx.beginPath(); ctx.moveTo(tx - 9, by + h - 1.5); ctx.lineTo(tx, by + h + 11); ctx.lineTo(tx + 9, by + h - 1.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(tx - 9, by + h); ctx.lineTo(tx, by + h + 11); ctx.lineTo(tx + 9, by + h); ctx.stroke();
  ctx.fillStyle = '#2b1d14'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, bx + 13, by + 9 + lh * (i + 0.5)));
}
function toScreen(wx, wy) { return [(wx - G.camX) * view.scale, (wy - G.camY) * view.scale]; }

function drawCompass() {
  if (G.compassT <= 0) return;
  const p = player;
  const targets = [];
  let best = null, bd = Infinity;
  for (const it of items) {
    if (it.type !== 'gem' || it.ghost || it.dead) continue;
    const d = Math.hypot(it.x - p.cx, it.y - p.cy);
    if (d < bd) { bd = d; best = it; }
  }
  if (best) targets.push({ x: best.x, y: best.y, kind: 'gem' });
  if (door && gemCount(stage.key) >= stage.need) targets.push({ x: door.x + door.w / 2, y: door.y + door.h / 2, kind: 'door' });
  const [px, py] = toScreen(p.cx, p.cy);
  const a = Math.min(1, G.compassT / 1.2);
  targets.forEach((tg, i) => {
    const ang = Math.atan2(tg.y - p.cy, tg.x - p.cx);
    const dist = Math.hypot(tg.x - p.cx, tg.y - p.cy);
    if (dist < 40) return;
    const r = 62 + i * 26 + Math.sin(G.uiTime * 6) * 4;
    const ax = px + Math.cos(ang) * r, ay = py + Math.sin(ang) * r;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(ax, ay); ctx.rotate(ang);
    ctx.fillStyle = tg.kind === 'gem' ? '#ff4fa3' : '#ffd23f'; ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-6, -13); ctx.lineTo(-1, 0); ctx.lineTo(-6, 13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a;
    const ix = px + Math.cos(ang) * (r - 26), iy = py + Math.sin(ang) * (r - 26);
    if (tg.kind === 'gem') drawGem(ctx, ix, iy, 0.5, G.uiTime * 2);
    else { ctx.fillStyle = '#7d4f28'; rrect(ctx, ix - 7, iy - 9, 14, 18, 4); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();
  });
}

function drawHUD() {
  const W = view.cssW, H = view.cssH, p = player;
  const x0 = 14 + safe.left, y0 = 12 + safe.top;
  const big = W >= 700 ? 1.15 : W < 480 ? 0.85 : 1;
  for (let i = 0; i < MAX_HEARTS; i++) {
    const hx = x0 + 18 * big + i * 34 * big, hy = y0 + 17 * big;
    const full = i < p.hearts;
    drawHeartShape(ctx, hx, hy, 1.32 * big * (full && p.hearts === 1 ? 1 + Math.sin(G.uiTime * 9) * 0.08 : 1), full ? '#ff4d6d' : 'rgba(40,20,20,0.45)');
  }
  const by = y0 + 50 * big;
  ctx.fillStyle = 'rgba(43,29,20,0.55)'; rrect(ctx, x0, by - 16 * big, 108 * big, 32 * big, 16 * big); ctx.fill();
  drawBanana(ctx, x0 + 19 * big, by + 1, 1.15 * big, -0.2);
  text(String(G.stageBananas), x0 + 40 * big, by + 1, 21 * big, '#ffe066', 'left');
  if (hasSuper()) {
    const my = by + 32 * big, mw = 108 * big, mh = 14 * big;
    ctx.fillStyle = 'rgba(43,29,20,0.55)'; rrect(ctx, x0, my - mh / 2, mw, mh, mh / 2); ctx.fill();
    const k = p.superT > 0 ? p.superT / 12 : p.meter;
    const full = p.superT <= 0 && p.meter >= 1;
    ctx.fillStyle = full ? (Math.floor(G.uiTime * 6) % 2 ? '#fff3a0' : '#ffd23f') : '#ffd23f';
    if (k > 0) { rrect(ctx, x0 + 2, my - mh / 2 + 2, Math.max(mh - 4, (mw - 4) * k), mh - 4, (mh - 4) / 2); ctx.fill(); }
    ctx.save(); ctx.translate(x0 + mw + 12 * big, my); starPath(ctx, 10 * big, 4.5 * big, 5);
    ctx.fillStyle = full || p.superT > 0 ? '#ffd23f' : 'rgba(255,255,255,0.4)'; ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    if (full && Input.device !== 'touch') text(`${labels().super} 슈퍼!`, x0 + mw + 28 * big, my, 14 * big, '#ffe066', 'left');
  }
  const sb = document.querySelector('.tb-super');
  const ready = hasSuper() && p.meter >= 1 && p.superT <= 0;
  if (sb && sb.dataset.ready !== String(ready)) { sb.dataset.ready = String(ready); sb.classList.toggle('ready', ready); }
  if (stage.gems) {
    const arr = Save.data.gems[stage.key];
    const gw = 30 * big;
    const half = ((stage.gems - 1) * gw) / 2 + gw * 0.75;
    const heartsRight = x0 + MAX_HEARTS * 34 * big + 6;
    const gcx = Math.max(W / 2, heartsRight + half);
    const gx = gcx - ((stage.gems - 1) * gw) / 2, gy = y0 + 18 * big;
    ctx.fillStyle = 'rgba(43,29,20,0.55)'; rrect(ctx, gx - gw * 0.75, gy - 17 * big, gw * (stage.gems - 1) + gw * 1.5, 34 * big, 17 * big); ctx.fill();
    for (let i = 0; i < stage.gems; i++) {
      const cx = gx + i * gw;
      if (arr[i]) drawGem(ctx, cx, gy, 0.62 * big, G.uiTime * 2 + i);
      else {
        ctx.save(); ctx.translate(cx, gy); starPath(ctx, 10 * big, 5 * big, 5);
        ctx.fillStyle = i < stage.need ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)'; ctx.fill();
        ctx.strokeStyle = i < stage.need ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
      }
    }
    const n = gemCount(stage.key);
    text(n >= stage.need ? '문이 열렸어요!' : `보석 ${stage.need}개면 문이 열려요`, gcx, gy + 30 * big, 14 * big, n >= stage.need ? '#ffe066' : '#ffffff');
  }
  if (boss) {
    const bw = Math.min(320, W * 0.5), bx = W / 2 - bw / 2, byy = y0 + 14;
    ctx.fillStyle = 'rgba(43,29,20,0.65)'; rrect(ctx, bx - 4, byy - 4, bw + 8, 22, 11); ctx.fill();
    ctx.fillStyle = '#5b3a6e'; rrect(ctx, bx, byy, bw, 14, 7); ctx.fill();
    if (boss.hp > 0) { ctx.fillStyle = '#ff4fa3'; rrect(ctx, bx, byy, bw * (boss.hp / boss.maxHp), 14, 7); ctx.fill(); }
    text('두더지 대왕', W / 2, byy + 34, 15, '#ffffff');
  }
  drawCompass();
  if (G.activeSign && G.activeSign.text) {
    const [sx, sy] = toScreen(G.activeSign.x + T / 2, G.activeSign.y - 10);
    speech(fill(G.activeSign.text), sx, sy, Math.min(340, W * 0.6));
  } else if (G.bubble) {
    const [sx, sy] = toScreen(G.bubble.x, G.bubble.y);
    speech(G.bubble.text, sx, sy, Math.min(320, W * 0.6));
  }
  if (G.banner) {
    const b = G.banner;
    const k = Math.min(1, b.t / 0.25, (b.dur - b.t) / 0.3);
    ctx.save(); ctx.globalAlpha = clamp(k, 0, 1);
    const yy = H * 0.3 - (1 - clamp(k, 0, 1)) * 20;
    const sz = W < 560 ? 30 : 40;
    text(b.text, W / 2, yy, sz, b.color);
    if (b.sub) text(b.sub, W / 2, yy + sz * 0.95, sz * 0.5, '#ffffff');
    ctx.restore();
  }
  if (G.state === 'play' && Input.device === 'keyboard' && G.stageT < 45 && !G.banner && !G.activeSign && !touchVisible()) {
    const L2 = labels();
    const parts2 = [`${L2.move} 이동`, `${L2.jump} 점프`, `${L2.punch} 펀치`, `↓+Z 파기`, `${L2.clap} 짝짝`];
    if (hasGrab()) parts2.push(`${L2.grab} 잡기`);
    if (hasSuper()) parts2.push(`${L2.super} 슈퍼`);
    const str = parts2.join('  ·  ');
    ctx.font = `15px ${FONT}`;
    const tw = ctx.measureText(str).width + 28;
    ctx.globalAlpha = clamp((45 - G.stageT) / 3, 0, 1) * 0.92;
    ctx.fillStyle = 'rgba(43,29,20,0.7)'; rrect(ctx, W / 2 - tw / 2, H - 44 - safe.bottom, tw, 30, 15); ctx.fill();
    ctx.fillStyle = '#fff8e1'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, W / 2, H - 29 - safe.bottom);
    ctx.globalAlpha = 1;
  }
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.7, G.flash)})`; ctx.fillRect(0, 0, W, H); }
  if (G.fade > 0) { ctx.fillStyle = `rgba(20,12,8,${clamp(G.fade, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
}

// ===================== 그리기: 메뉴 장면 =====================
const menu = { camX: 0, punchT: 0, blockT: 0, blockOn: true, parts: [], next: 1.2 };
function updateMenu(dt) {
  menu.camX += dt * 14;
  menu.next -= dt;
  if (menu.next <= 0) {
    if (menu.blockOn) { menu.punchT = 0.18; menu.blockOn = false; menu.blockT = 0.9; menu.burst = true; menu.next = 1.6; }
    else menu.next = 0.3;
  }
  menu.punchT = Math.max(0, menu.punchT - dt);
  if (!menu.blockOn) { menu.blockT -= dt; if (menu.blockT <= 0) { menu.blockOn = true; menu.pop = 0.25; } }
  if (menu.pop > 0) menu.pop -= dt;
  for (const p of menu.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; if (p.k === 'chunk') p.rot += p.vr * dt; }
  menu.parts = menu.parts.filter((p) => p.life > 0);
}
function renderMenu() {
  const W = view.cssW, H = view.cssH, dpr = view.dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (G.state === 'story') { drawStoryScene(ctx, STORY[G.storyIdx].scene, W, H, G.uiTime); return; }
  if (G.state === 'ending') { drawStoryScene(ctx, 'ending', W, H, G.uiTime); return; }
  const sc = clamp(Math.min(W, H) / 300, 0.9, 3);
  const vw = W / sc, vh = H / sc;
  const groundY = Math.round(vh * 0.8 / T) * T;
  const P = Math.ceil(T * sc * dpr);
  if (!menuAtlas || menuAtlas.P !== P) menuAtlas = buildAtlas('jungle', P);
  ctx.setTransform(sc * dpr, 0, 0, sc * dpr, 0, 0);
  drawBackground(ctx, THEMES.jungle, menu.camX, 0, vw, vh, G.uiTime, groundY);
  const off = (menu.camX % T);
  for (let x = -T; x < vw + T; x += T) {
    for (let y = groundY; y < vh + T; y += T) {
      const id = y === groundY ? TILE.SOFT_TOP : TILE.SOFT;
      const v = hash2(Math.floor((x + menu.camX) / T), y / T) & 3;
      ctx.drawImage(menuAtlas.tiles[id][v], x - off, y, T, T);
      if (y === groundY) ctx.drawImage(menuAtlas.top[v], x - off, y - 8, T, 20);
    }
  }
  const portrait = H > W * 1.05;
  const cxm = portrait ? vw * 0.5 : vw * 0.74;
  const mx = cxm - 18, bx = cxm + 12;
  if (menu.burst) {
    menu.burst = false;
    for (let i = 0; i < 9; i++) menu.parts.push({ k: 'chunk', x: bx + 16, y: groundY - 16, vx: rand(-60, 220), vy: rand(-380, -160), life: 1, max: 1, size: rand(3, 6), color: pick([THEMES.jungle.soft.base, '#ffd93b']), rot: 0, vr: rand(-10, 10) });
    for (let i = 0; i < 3; i++) menu.parts.push({ k: 'banana', x: bx + 16, y: groundY - 16, vx: rand(20, 160), vy: rand(-420, -260), life: 1.3, max: 1.3, rot: rand(0, 6) });
    Sound.ready && G.state === 'title' && Sound.sfx('breakSoft');
  }
  if (menu.blockOn) {
    const k = menu.pop > 0 ? 1 - menu.pop / 0.25 : 1;
    ctx.save(); ctx.translate(bx + 16, groundY - 16); ctx.scale(k, k);
    ctx.drawImage(menuAtlas.tiles[TILE.BANANA][1], -16, -16, 32, 32); ctx.restore();
  }
  drawMoongchi(ctx, mx, groundY, { facing: 1, pose: menu.punchT > 0 ? 'punchF' : 'idle', t: G.uiTime, costume: Save.data.costume, scale: 1 });
  for (const p of menu.parts) {
    ctx.globalAlpha = clamp(p.life / p.max * 2, 0, 1);
    if (p.k === 'banana') drawBanana(ctx, p.x, p.y, 1, p.rot + p.life * 6);
    else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore(); }
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const vg = ctx.createLinearGradient(0, 0, 0, H);
  vg.addColorStop(0, 'rgba(20,12,30,0.0)'); vg.addColorStop(1, 'rgba(20,12,30,0.25)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if ((G.state === 'play' || G.state === 'pause' || G.state === 'clear') && L && player) {
    drawWorld();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    drawHUD();
  } else renderMenu();
}

// ===================== 화면 (메뉴) =====================
let isTouch = !!((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0);
function touchVisible() {
  const m = Save.data.touch;
  return m === 'on' || (m === 'auto' && isTouch);
}
const UI = {
  screens: {}, cur: null,
  init() { document.querySelectorAll('.screen').forEach((s) => { this.screens[s.id.replace('scr-', '')] = s; }); },
  show(name) {
    for (const k in this.screens) this.screens[k].hidden = k !== name;
    this.cur = name;
    const s = this.screens[name];
    if (s && Input.device !== 'touch') {
      const pf = s.querySelector('[data-primary]:not([hidden])');
      if (pf) setTimeout(() => { try { pf.focus({ preventScroll: true }); } catch (e) { pf.focus(); } }, 40);
    }
  },
  hideAll() { for (const k in this.screens) this.screens[k].hidden = true; this.cur = null; },
  inGame(on, keepPauseBtn) {
    document.getElementById('topbar').hidden = !on && !keepPauseBtn ? true : !on;
    const tc = document.getElementById('touch');
    tc.hidden = !(on && touchVisible());
    if (on) {
      tc.querySelector('[data-act="grab"]').hidden = !hasGrab();
      tc.querySelector('[data-act="super"]').hidden = !hasSuper();
    }
    if (!on) { tc.querySelectorAll('.on').forEach((n) => n.classList.remove('on')); Input.clearAll(); }
  },
};

function updateTitleBubble() {
  const b = document.getElementById('title-bubble');
  if (b) b.textContent = Save.data.endingSeen ? `${callName()}, 숨은 보석을 더 찾아볼까?` : `${callName()}, 같이 바나나 찾으러 가자!`;
}

function buildMap() {
  const list = document.getElementById('map-list');
  list.textContent = '';
  document.getElementById('map-gems').textContent = `${totalGems()} / 20`;
  document.getElementById('map-bananas').textContent = `${Save.data.bananasTotal}`;
  let nextIdx = STAGES.findIndex((s, i) => stageUnlocked(i) && !Save.data.cleared[s.key]);
  if (nextIdx < 0) nextIdx = -1;
  STAGES.forEach((s, i) => {
    const open = stageUnlocked(i), done = !!Save.data.cleared[s.key];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `layer layer-${s.key}` + (open ? '' : ' locked') + (i === nextIdx ? ' next' : '');
    card.disabled = !open;
    if (i === nextIdx) card.dataset.primary = '';
    const gems = s.gems ? Save.data.gems[s.key].map((g, k) => `<span class="star ${g ? 'got' : ''} ${k < s.need ? 'need' : ''}" aria-hidden="true">★</span>`).join('') : '';
    const status = !open ? '잠겨 있어요' : done ? (s.boss ? '물리쳤어요!' : '클리어!') : i === nextIdx ? '여기로 가자!' : '';
    card.innerHTML = `<span class="layer-floor">${s.floor}</span><span class="layer-name">${s.name}</span>` +
      `<span class="layer-gems" aria-label="보석 ${s.gems ? gemCount(s.key) : 0}개">${gems}</span>` +
      `<span class="layer-status">${open ? '' : '<span class="lock" aria-hidden="true">🔒</span>'}${status}</span>`;
    card.addEventListener('click', () => { Sound.init(); Sound.sfx('click'); startStage(i); });
    list.appendChild(card);
  });
}

function buildCloset() {
  const grid = document.getElementById('closet-grid');
  grid.textContent = '';
  COSTUMES.forEach((c, i) => {
    const ok = costumeUnlocked(i);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'costume' + (ok ? '' : ' locked') + (Save.data.costume === i ? ' selected' : '');
    b.disabled = !ok;
    const cvs = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = 96 * dpr; cvs.height = 96 * dpr; cvs.style.width = '96px'; cvs.style.height = '96px';
    const g = cvs.getContext('2d');
    g.setTransform(dpr * 1.55, 0, 0, dpr * 1.55, 0, 0);
    drawMoongchi(g, 31, 58, { facing: 1, pose: 'idle', t: 0, costume: i, alpha: ok ? 1 : 0.35 });
    b.appendChild(cvs);
    const name = document.createElement('span'); name.className = 'costume-name'; name.textContent = c.name; b.appendChild(name);
    const req = document.createElement('span'); req.className = 'costume-req';
    req.textContent = ok ? (Save.data.costume === i ? '쓰고 있어요' : '입어 보기') : c.gems ? `보석 ${c.gems}개 모두 모으면` : `바나나 ${c.bananas}개 모으면`;
    b.appendChild(req);
    b.addEventListener('click', () => { Save.data.costume = i; Save.save(); Sound.sfx('click'); buildCloset(); });
    grid.appendChild(b);
  });
  document.getElementById('closet-bananas').textContent = `${Save.data.bananasTotal}`;
}

function syncSettings() {
  document.getElementById('set-name').value = Save.data.name || '';
  document.getElementById('set-sfx').checked = !!Save.data.sfx;
  document.getElementById('set-music').checked = !!Save.data.music;
  document.getElementById('set-voice').checked = !!Save.data.voice;
  document.getElementById('set-touch').value = Save.data.touch || 'auto';
  document.getElementById('voice-note').hidden = Voice.available;
  const rb = document.getElementById('btn-reset'); rb.dataset.arm = ''; rb.textContent = '처음부터 다시 하기';
}
function applySettings() {
  Sound.setSfx(!!Save.data.sfx); Sound.setMusic(!!Save.data.music); Voice.enabled = !!Save.data.voice;
}

function showStory(i) {
  G.state = 'story'; G.storyIdx = i;
  const el = UI.screens.story;
  el.querySelector('.story-text').textContent = fill(STORY[i].text);
  el.querySelector('[data-act="story-next"]').textContent = i < STORY.length - 1 ? '다음 ▶' : '출발!';
  el.querySelector('.story-dots').textContent = STORY.map((_, k) => (k === i ? '●' : '○')).join(' ');
  UI.show('story');
  speak(STORY[i].text);
}

function bindUI() {
  const on = (sel, fn) => document.querySelectorAll(sel).forEach((n) => n.addEventListener('click', (e) => { Sound.init(); Sound.sfx('click'); fn(e); }));
  on('[data-act="start"]', () => { if (!Save.data.storySeen) showStory(0); else goMap(); });
  on('[data-act="story-next"]', () => {
    if (G.storyIdx < STORY.length - 1) showStory(G.storyIdx + 1);
    else { Save.data.storySeen = true; Save.save(); goMap(); }
  });
  on('[data-act="story-skip"]', () => { Save.data.storySeen = true; Save.save(); goMap(); });
  on('[data-act="story-again"]', () => showStory(0));
  on('[data-act="closet"]', () => { G.state = 'closet'; buildCloset(); UI.show('closet'); });
  on('[data-act="help"]', () => { G.state = 'help'; UI.show('help'); });
  on('[data-act="settings"]', () => { G.state = 'settings'; syncSettings(); UI.show('settings'); });
  on('[data-act="title"]', () => goTitle());
  on('[data-act="map"]', () => goMap());
  on('[data-act="resume"]', () => resumeGame());
  on('[data-act="retry"]', () => startStage(stageIndex));
  on('[data-act="next"]', () => { if (STAGES[stageIndex + 1]) startStage(stageIndex + 1); else goMap(); });
  on('#btn-pause', () => pauseGame());
  on('[data-act="fullscreen"]', () => {
    const d = document.documentElement;
    try {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (d.requestFullscreen) d.requestFullscreen().catch(() => {});
      else if (d.webkitRequestFullscreen) d.webkitRequestFullscreen();
    } catch (e) { /* 전체 화면을 못 쓰는 곳 */ }
  });
  document.getElementById('set-name').addEventListener('input', (e) => {
    Save.data.name = e.target.value.slice(0, 10); Save.save(); updateTitleBubble();
  });
  document.getElementById('set-sfx').addEventListener('change', (e) => { Save.data.sfx = e.target.checked; Save.save(); applySettings(); });
  document.getElementById('set-music').addEventListener('change', (e) => { Save.data.music = e.target.checked; Save.save(); applySettings(); });
  document.getElementById('set-voice').addEventListener('change', (e) => { Save.data.voice = e.target.checked; Save.save(); applySettings(); if (e.target.checked) Voice.say('목소리 안내를 켰어요.'); });
  document.getElementById('set-touch').addEventListener('change', (e) => { Save.data.touch = e.target.value; Save.save(); });
  document.getElementById('btn-reset').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (b.dataset.arm !== '1') { b.dataset.arm = '1'; b.textContent = '정말 지울까요? 한 번 더 누르면 지워져요'; return; }
    Save.reset(); applySettings(); syncSettings(); updateTitleBubble();
    b.textContent = '모두 지웠어요';
  });
  const pauseSfx = document.getElementById('pause-sfx'), pauseMusic = document.getElementById('pause-music');
  pauseSfx.addEventListener('change', (e) => { Save.data.sfx = e.target.checked; Save.save(); applySettings(); });
  pauseMusic.addEventListener('change', (e) => { Save.data.music = e.target.checked; Save.save(); applySettings(); });
  const obs = new MutationObserver(() => { pauseSfx.checked = !!Save.data.sfx; pauseMusic.checked = !!Save.data.music; });
  obs.observe(UI.screens.pause, { attributes: true, attributeFilter: ['hidden'] });
  Input.bindTouch(document.getElementById('touch'));
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') {
      Input.device = 'touch';
      if (!isTouch) { isTouch = true; if (G.state === 'play') UI.inGame(true); }
    }
    Sound.init();
  }, { capture: true });
  // 휴대폰은 손가락을 뗄 때 소리를 켤 수 있어요
  window.addEventListener('pointerup', () => Sound.init(), { capture: true });
  window.addEventListener('touchend', () => Sound.init(), { capture: true, passive: true });
  window.addEventListener('keydown', (e) => {
    Sound.init();
    if (G.state === 'play') return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    const scr = UI.cur && UI.screens[UI.cur];
    if (!scr) return;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      if (G.state === 'pause') resumeGame();
      else if (['closet', 'help', 'settings'].includes(G.state)) goTitle();
      return;
    }
    const btns = focusables(scr);
    if (!btns.length) return;
    if (/^Arrow/.test(e.code)) {
      e.preventDefault();
      const i = btns.indexOf(document.activeElement);
      const d = e.code === 'ArrowDown' || e.code === 'ArrowRight' ? 1 : -1;
      btns[(i < 0 ? 0 : i + d + btns.length) % btns.length].focus();
    } else if ((e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') && !btns.includes(document.activeElement)) {
      e.preventDefault();
      const pf = scr.querySelector('[data-primary]:not([hidden]):not([disabled])') || btns[0];
      pf.click();
    }
  });
  Input.onPress((a, dev) => {
    if (dev !== 'pad' || G.state === 'play') return;
    const scr = UI.cur && UI.screens[UI.cur];
    if (!scr) return;
    const btns = focusables(scr);
    if (!btns.length) return;
    const i = btns.indexOf(document.activeElement);
    if (a === 'down' || a === 'right') btns[(i + 1 + btns.length) % btns.length].focus();
    else if (a === 'up' || a === 'left') btns[(i - 1 + btns.length * 2) % btns.length].focus();
    else if (a === 'jump' || a === 'punch' || a === 'grab') { (i >= 0 ? btns[i] : (scr.querySelector('[data-primary]:not([hidden]):not([disabled])') || btns[0])).click(); }
    else if (a === 'pause' && G.state === 'pause') resumeGame();
  });
}
function focusables(scr) {
  return [...scr.querySelectorAll('button, input, select')].filter((b) => !b.disabled && !b.hidden && b.offsetParent !== null);
}

// ===================== 화면 켜짐 유지 =====================
let wakeLock = null;
function requestWake() {
  try { if (navigator.wakeLock && !wakeLock) navigator.wakeLock.request('screen').then((l) => { wakeLock = l; l.addEventListener('release', () => { wakeLock = null; }); }).catch(() => {}); } catch (e) { /* 무시 */ }
}
function releaseWake() { try { if (wakeLock) wakeLock.release(); } catch (e) { /* 무시 */ } wakeLock = null; }

// ===================== 반복 =====================
let last = performance.now(), acc = 0;
function step(dt) {
  sfxStep.clear();
  if (Input.state.pause.pressed) { pauseGame(); return; }
  G.time += dt; G.stageT += dt;
  if (G.hitstop > 0) { G.hitstop -= dt; updateParts(dt * 0.25); return; }
  updatePlayer(dt);
  if (G.state !== 'play') return;
  updateEnemies(dt);
  if (boss) updateBoss(dt);
  if (G.state !== 'play') return;
  updateProjectiles(dt);
  updateItems(dt);
  updateBooms(dt);
  updateObjects(dt);
  updateParts(dt);
  updateCamera(dt);
  updateHints(dt);
  G.shake = Math.max(0, G.shake - dt * 32);
  G.flash = Math.max(0, G.flash - dt * 2.2);
}
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now;
  if (!(dt > 0)) dt = 0; if (dt > 0.1) dt = 0.1;
  Input.readPad();
  G.uiTime += dt;
  if (G.state === 'play') {
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) { Input.poll(); step(STEP); acc -= STEP; n++; if (G.state !== 'play') break; }
    if (n >= 5) acc = 0;
  } else {
    acc = 0; Input.poll();
    if (G.state === 'pause' && Input.state.pause.pressed) resumeGame();
    if (G.state === 'clear' && L) {
      G.time += dt;
      if (Math.random() < dt * 14) {
        addPart({ k: 'chunk', x: cam.x + rand(0, view.w), y: cam.y - 10, vx: rand(-40, 40), vy: rand(-60, 40),
          life: 1.6, max: 1.6, size: rand(4, 8), color: pick(['#ff4d6d', '#ffd23f', '#4fc3f7', '#7bd88f', '#c77dff']), rot: rand(0, 6), vr: rand(-8, 8) });
      }
      updateParts(dt);
    }
    updateMenu(dt);
  }
  try { render(); } catch (e) { if (!frame.warned) { frame.warned = true; console.error(e); } }
}

// ===================== 시작 =====================
function boot(data) {
  Save.load();
  if (data && data.save && typeof data.save === 'object') { Object.assign(Save.data, data.save); Save.fix(); }
  if (isTouch) Input.device = 'touch';
  applySettings();
  UI.init();
  bindUI();
  resize();
  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (G.state === 'play') pauseGame(); Save.save(); Sound.suspend(); Voice.stop(); }
    else { Sound.resume(); if (G.state === 'play') requestWake(); }
  });
  window.addEventListener('pagehide', () => Save.save());
  if (document.fonts && document.fonts.load) { document.fonts.load(`20px Jua`).catch(() => {}); document.fonts.load(`20px "Black Han Sans"`).catch(() => {}); }
  updateTitleBubble();
  UI.inGame(false);
  UI.show('title');
  G.state = 'title';
  Sound.playMusic('title');
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
    try { window.claude.hot.snapshot(() => ({ save: Save.data })); } catch (e) { /* 무시 */ }
  }
  requestAnimationFrame((t) => { last = t; frame(t); });
}
(function start() {
  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(boot);
  else boot((hot && hot.data) || {});
})();
