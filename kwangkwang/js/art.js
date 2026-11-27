// 그림: 블록 무늬, 뭉치, 적, 아이템, 배경을 모두 캔버스 코드로 그려요.
'use strict';

const T = 32; // 블록 한 칸 크기 (게임 세계 픽셀)

const TILE = {
  AIR: 0, BEDROCK: 1, SOFT: 2, SOFT_TOP: 3, MEDIUM: 4, HARD: 5, BANANA: 6, CRYSTAL: 7,
  BOOM: 8, CRATE: 9, PLATFORM: 10, LAVA: 11, SPIKE: 12, GLASS: 13,
};

const THEMES = {
  jungle: {
    key: 'jungle', sky: true,
    bgTop: '#6fc8f5', bgBot: '#d4f3ff', far: '#a5dca0', farDark: '#6cc070', tree: '#3f9e55', treeDark: '#2f7d44',
    soft: { base: '#9c6839', dark: '#7a4f2b', light: '#bb8550', speck: '#6b4423' },
    top: { base: '#5cc94a', dark: '#3a9b37', light: '#8be06d' },
    medium: { base: '#9aa4ad', dark: '#76808a', light: '#c6ced5' },
    hard: { base: '#5d6571', dark: '#424852', light: '#808a97', accent: '#6cb46a' },
    wall: { base: '#553a23', dark: '#45301c', light: '#64462b' },
    bedrock: { base: '#3a3440', dark: '#27222c', light: '#4e4757' },
    crystal: ['#b77bff', '#f1d4ff', '#7b3fd0'],
    outline: 'rgba(35,20,8,0.62)', platform: '#b07a42', spike: '#c8d0d8',
  },
  sand: {
    key: 'sand',
    bgTop: '#f2b56e', bgBot: '#8e4f25', far: '#d08744', farDark: '#a5602c',
    soft: { base: '#eec67a', dark: '#d6aa5c', light: '#fbe2a6', speck: '#c99a4c' },
    top: { base: '#ffe7b0', dark: '#e6c37e', light: '#fff5d8' },
    medium: { base: '#d98d4a', dark: '#b8703a', light: '#f0ad6d' },
    hard: { base: '#a5442b', dark: '#7e301d', light: '#c8644a', accent: '#e2805f' },
    wall: { base: '#80502a', dark: '#6a4021', light: '#8f5c33' },
    bedrock: { base: '#4a3226', dark: '#33221a', light: '#5d4033' },
    crystal: ['#4fd1c5', '#c6fff9', '#1f8f86'],
    outline: 'rgba(70,30,10,0.55)', platform: '#a46b3a', spike: '#e8d8c0',
  },
  ice: {
    key: 'ice', slippery: true,
    bgTop: '#c9ecff', bgBot: '#5b9fd6', far: '#9fd0f2', farDark: '#76b0de',
    soft: { base: '#f2f9ff', dark: '#d3e6f5', light: '#ffffff', speck: '#c3dcef' },
    top: { base: '#ffffff', dark: '#d9ecfa', light: '#ffffff' },
    medium: { base: '#8fd6f0', dark: '#5fb5da', light: '#d9f6ff' },
    hard: { base: '#3f5f8c', dark: '#2d466c', light: '#5a7fb0', accent: '#a9d8ff' },
    wall: { base: '#4b6f96', dark: '#3b5b80', light: '#5a7fa8' },
    bedrock: { base: '#2c3a52', dark: '#1e283a', light: '#3c4d6a' },
    crystal: ['#7fd3ff', '#ffffff', '#3d8fd0'],
    outline: 'rgba(20,40,80,0.5)', platform: '#a07850', spike: '#dff6ff',
  },
  lava: {
    key: 'lava',
    bgTop: '#3a1420', bgBot: '#140709', far: '#2e1118', farDark: '#200b10', glow: '#ff5a1f',
    soft: { base: '#5b4a47', dark: '#463735', light: '#6f5d59', speck: '#3a2c2a' },
    top: { base: '#7a6660', dark: '#5d4c48', light: '#ff8c42' },
    medium: { base: '#3d2b2b', dark: '#2b1d1d', light: '#55403f', accent: '#ff7a2a' },
    hard: { base: '#2a1f3d', dark: '#1a1328', light: '#4b3a6e', accent: '#8f7fd0' },
    wall: { base: '#2a1719', dark: '#1f1012', light: '#351d20' },
    bedrock: { base: '#1b1418', dark: '#120d10', light: '#2a2026' },
    crystal: ['#ff9f43', '#fff1c1', '#d1611a'],
    outline: 'rgba(0,0,0,0.62)', platform: '#6b5048', spike: '#9a8f8c',
  },
  boss: {
    key: 'boss',
    bgTop: '#2a1b40', bgBot: '#0f0a18', far: '#231636', farDark: '#180f26', glow: '#ff5a1f',
    soft: { base: '#5b4a47', dark: '#463735', light: '#6f5d59', speck: '#3a2c2a' },
    top: { base: '#7a6660', dark: '#5d4c48', light: '#ff8c42' },
    medium: { base: '#3d2b2b', dark: '#2b1d1d', light: '#55403f', accent: '#ff7a2a' },
    hard: { base: '#2a1f3d', dark: '#1a1328', light: '#4b3a6e', accent: '#8f7fd0' },
    wall: { base: '#2a1d3a', dark: '#1f142c', light: '#352646' },
    bedrock: { base: '#3a3152', dark: '#272038', light: '#4d4270' },
    crystal: ['#ff9f43', '#fff1c1', '#d1611a'],
    outline: 'rgba(0,0,0,0.6)', platform: '#8a6a4a', spike: '#9a8f8c',
  },
};

// ---------- 작은 도우미 ----------
function rng32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}
function ell(g, x, y, rx, ry, rot) {
  g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2); g.fill();
}
function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2); g.fill(); }
function rrect(g, x, y, w, h, r) {
  g.beginPath();
  if (g.roundRect) { g.roundRect(x, y, w, h, r); return; }
  r = Math.min(r, w / 2, h / 2);
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function poly(g, pts) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath(); g.fill();
}

// ---------- 블록 무늬 ----------
function drawSoftBase(g, c, r) {
  g.fillStyle = c.base; g.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 7; i++) {
    g.fillStyle = r() < 0.5 ? c.dark : c.speck;
    ell(g, r() * 28 + 2, r() * 28 + 2, 1.2 + r() * 1.8, 0.8 + r() * 1.2);
  }
  g.fillStyle = c.light;
  for (let i = 0; i < 4; i++) ell(g, r() * 28 + 2, r() * 28 + 2, 0.9 + r() * 1.3, 0.7 + r());
}

function drawBananaShape(g, x, y, s, rot, outline) {
  g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
  g.beginPath();
  g.moveTo(-8.5, -3.5);
  g.quadraticCurveTo(-1, 10, 9.5, -4.5);
  g.quadraticCurveTo(0.5, 3.5, -8.5, -3.5);
  g.closePath();
  g.fillStyle = '#ffd93b'; g.fill();
  g.lineWidth = 1.3; g.strokeStyle = outline || '#b9850f'; g.stroke();
  g.beginPath(); g.moveTo(-5, -0.5); g.quadraticCurveTo(0, 4.4, 6, -1.6);
  g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 1.1; g.stroke();
  g.fillStyle = '#6b4a1c'; circ(g, -8.7, -3.7, 1.3); circ(g, 9.7, -4.7, 1.1);
  g.restore();
}

function drawTileArt(g, id, th, v, r) {
  switch (id) {
    case TILE.SOFT: case TILE.SOFT_TOP:
      drawSoftBase(g, th.soft, r);
      break;
    case TILE.BANANA:
      drawSoftBase(g, th.soft, r);
      g.fillStyle = 'rgba(255,214,70,0.5)'; rrect(g, 2, 2, 28, 28, 6); g.fill();
      g.strokeStyle = '#c58a12'; g.lineWidth = 2.2; rrect(g, 2.5, 2.5, 27, 27, 6); g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.18)'; ell(g, 16.5, 18, 11, 6);
      drawBananaShape(g, 16, 16, 1.25, -0.35 + v * 0.22);
      break;
    case TILE.MEDIUM: {
      const c = th.medium;
      g.fillStyle = c.base; g.fillRect(0, 0, 32, 32);
      g.fillStyle = c.light; g.globalAlpha = 0.45;
      poly(g, [[2, 2], [18 + r() * 6, 2], [13, 11], [2, 13]]);
      g.globalAlpha = 1;
      if (th.key === 'sand') {
        g.fillStyle = c.dark; g.globalAlpha = 0.35;
        [8, 17, 25].forEach((y) => g.fillRect(0, y + r() * 2, 32, 2.4));
        g.globalAlpha = 1;
      }
      g.strokeStyle = th.key === 'lava' ? c.accent : c.dark;
      g.lineWidth = th.key === 'lava' ? 1.5 : 1.6;
      g.beginPath();
      const x0 = 4 + r() * 10;
      g.moveTo(x0, 0); g.lineTo(x0 + 4 + r() * 6, 12 + r() * 4); g.lineTo(x0 + r() * 12, 32);
      g.moveTo(x0 + 6, 14); g.lineTo(32, 16 + r() * 8);
      g.stroke();
      if (th.key === 'ice') {
        g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(5, 26); g.lineTo(14, 17); g.moveTo(17, 28); g.lineTo(27, 18); g.stroke();
      }
      break;
    }
    case TILE.HARD: {
      const c = th.hard;
      g.fillStyle = c.dark; g.fillRect(0, 0, 32, 32);
      const lumps = [[1, 1, 16, 15], [17, 2, 14, 13], [2, 17, 14, 14], [16, 16, 15, 15]];
      for (const [x, y, w, h] of lumps) {
        g.fillStyle = c.base; rrect(g, x + r(), y + r(), w - 1, h - 1, 5); g.fill();
        g.fillStyle = c.light; g.globalAlpha = 0.55; rrect(g, x + 2, y + 1.5, w * 0.55, 3, 1.5); g.fill(); g.globalAlpha = 1;
      }
      g.fillStyle = c.accent;
      if (th.key === 'jungle') {
        for (let i = 0; i < 3; i++) ell(g, 3 + r() * 26, 2 + r() * 6, 2.5 + r() * 2, 1.6);
      } else if (th.key === 'ice') {
        for (let i = 0; i < 5; i++) circ(g, 2 + r() * 28, 2 + r() * 28, 0.9);
      } else if (th.key === 'lava' || th.key === 'boss') {
        g.strokeStyle = c.accent; g.globalAlpha = 0.7; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(5, 6); g.lineTo(11, 3); g.moveTo(20, 21); g.lineTo(27, 18); g.stroke(); g.globalAlpha = 1;
      }
      break;
    }
    case TILE.BEDROCK: {
      const c = th.bedrock;
      g.fillStyle = c.dark; g.fillRect(0, 0, 32, 32);
      const off = v % 2 ? 8 : 0;
      g.fillStyle = c.base;
      rrect(g, 1, 1, 30, 14, 3); g.fill();
      rrect(g, 1 - off, 17, 22, 14, 3); g.fill();
      rrect(g, 25 - off, 17, 22, 14, 3); g.fill();
      g.fillStyle = c.light; g.globalAlpha = 0.6;
      g.fillRect(3, 2.5, 26, 2); g.fillRect(3 - off, 18.5, 18, 2); g.fillRect(27 - off, 18.5, 18, 2);
      g.globalAlpha = 1;
      break;
    }
    case TILE.CRYSTAL: {
      const [mid, hi, lo] = th.crystal;
      g.fillStyle = th.medium.dark; g.fillRect(0, 0, 32, 32);
      g.fillStyle = th.medium.base; g.globalAlpha = 0.6; rrect(g, 1, 1, 30, 30, 4); g.fill(); g.globalAlpha = 1;
      const shards = [[8, 31, 7, 22, -0.28], [17, 31, 8, 27, 0.04], [25.5, 31, 6, 17, 0.32]];
      for (const [x, y, w, h, a] of shards) {
        g.save(); g.translate(x, y); g.rotate(a);
        g.fillStyle = mid; poly(g, [[-w / 2, 0], [-w / 2, -h * 0.72], [0, -h], [w / 2, -h * 0.72], [w / 2, 0]]);
        g.fillStyle = lo; poly(g, [[0, 0], [0, -h], [w / 2, -h * 0.72], [w / 2, 0]]);
        g.fillStyle = hi; g.globalAlpha = 0.85; poly(g, [[-w / 2 + 1.3, -2], [-w / 2 + 1.3, -h * 0.68], [-1, -h * 0.86], [-1, -2]]);
        g.globalAlpha = 1;
        g.restore();
      }
      break;
    }
    case TILE.BOOM: {
      g.fillStyle = '#d93030'; g.fillRect(0, 0, 32, 32);
      g.fillStyle = '#ff6b5e'; g.fillRect(0, 0, 32, 3); g.fillRect(0, 0, 3, 32);
      g.fillStyle = '#8e1717'; g.fillRect(0, 29, 32, 3); g.fillRect(29, 0, 3, 32);
      g.fillStyle = '#ffe27a'; circ(g, 16, 17, 10.5);
      g.fillStyle = '#2a2a2a'; circ(g, 15.5, 18.5, 6.6);
      g.fillStyle = '#6a6a6a'; circ(g, 13.3, 16.3, 1.7);
      g.strokeStyle = '#7a4a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(19, 13.5); g.quadraticCurveTo(21, 9, 23.5, 9.5); g.stroke();
      g.fillStyle = '#ff8a00'; circ(g, 24, 9, 2.3); g.fillStyle = '#fff3a0'; circ(g, 24, 9, 1);
      break;
    }
    case TILE.CRATE: {
      g.fillStyle = '#c98b4b'; g.fillRect(0, 0, 32, 32);
      g.fillStyle = '#a86f36'; [9, 18, 27].forEach((y) => g.fillRect(2, y, 28, 1.6));
      g.strokeStyle = '#b97b40'; g.lineWidth = 4; g.beginPath(); g.moveTo(4, 28); g.lineTo(28, 4); g.stroke();
      g.strokeStyle = '#7d4f22'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 29, 29);
      drawHeartShape(g, 16, 16.5, 0.62);
      break;
    }
    case TILE.PLATFORM: {
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(5, 9, 3, 13); g.fillRect(24, 9, 3, 13);
      g.fillStyle = th.platform; rrect(g, 0, 1, 32, 9, 3); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(2, 2.5, 28, 1.5);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 8, 32, 2);
      g.fillStyle = '#5a3a1a'; circ(g, 5, 5.5, 1); circ(g, 27, 5.5, 1);
      break;
    }
    case TILE.SPIKE: {
      g.fillStyle = th.spike; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const x = i * 10.67;
        g.beginPath(); g.moveTo(x + 0.5, 32); g.lineTo(x + 5.33, 13); g.lineTo(x + 10.17, 32); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.beginPath(); g.moveTo(x + 2.5, 31); g.lineTo(x + 5.33, 16); g.lineTo(x + 5.8, 31); g.closePath(); g.fill();
        g.fillStyle = th.spike;
      }
      break;
    }
    case TILE.GLASS: {
      g.fillStyle = 'rgba(185,232,255,0.6)'; g.fillRect(0, 0, 32, 32);
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2; g.strokeRect(1, 1, 30, 30);
      g.lineWidth = 2.4; g.beginPath(); g.moveTo(5, 13); g.lineTo(13, 5); g.moveTo(6, 22); g.lineTo(22, 6); g.stroke();
      g.strokeStyle = 'rgba(40,80,120,0.75)'; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(20, 18); g.lineTo(27, 14); g.moveTo(20, 18); g.lineTo(25, 27); g.moveTo(20, 18); g.lineTo(13, 24); g.moveTo(20, 18); g.lineTo(18, 9); g.stroke();
      break;
    }
    default:
      break;
  }
}

function drawWallArt(g, th, r) {
  const c = th.wall;
  g.fillStyle = c.base; g.fillRect(0, 0, 32, 32);
  g.fillStyle = c.dark; g.globalAlpha = 0.55;
  [5, 15, 25].forEach((y) => { g.beginPath(); g.ellipse(16, y + r() * 3, 18, 1.6, r() * 0.2 - 0.1, 0, Math.PI * 2); g.fill(); });
  g.globalAlpha = 0.35; g.fillStyle = c.light;
  for (let i = 0; i < 4; i++) circ(g, r() * 30 + 1, r() * 30 + 1, 0.8 + r());
  g.globalAlpha = 1;
}

function drawTopDeco(g, th, v, r) {
  // 32 x 20 영역, 블록 윗면은 y=8
  const c = th.top;
  if (th.key === 'jungle') {
    g.fillStyle = c.dark;
    g.beginPath(); g.moveTo(0, 8);
    for (let x = 0; x <= 32; x += 4) g.lineTo(x, 15 + Math.sin(x * 0.9 + v) * 1.6);
    g.lineTo(32, 8); g.closePath(); g.fill();
    g.fillStyle = c.base; g.fillRect(0, 7, 32, 6);
    for (let i = 0; i < 7; i++) {
      const x = i * 5 + r() * 3, h = 3 + r() * 4;
      g.beginPath(); g.moveTo(x - 1.6, 8); g.lineTo(x + r() - 0.5, 8 - h); g.lineTo(x + 1.6, 8); g.closePath(); g.fill();
    }
    g.fillStyle = c.light; g.fillRect(0, 7, 32, 1.4);
    if (v === 1) { g.fillStyle = '#ff7eb6'; circ(g, 22, 5, 2); g.fillStyle = '#fff6a0'; circ(g, 22, 5, 0.8); }
    if (v === 3) { g.fillStyle = '#fff6a0'; circ(g, 9, 5.5, 1.8); g.fillStyle = '#ff9f1c'; circ(g, 9, 5.5, 0.7); }
  } else if (th.key === 'sand') {
    g.fillStyle = c.dark; g.fillRect(0, 8, 32, 5);
    g.fillStyle = c.base; g.fillRect(0, 6.5, 32, 4.5);
    g.strokeStyle = c.light; g.lineWidth = 1;
    g.beginPath(); g.moveTo(2, 9); g.quadraticCurveTo(8, 7, 14, 9); g.moveTo(17, 9.5); g.quadraticCurveTo(23, 7.5, 30, 9.5); g.stroke();
  } else if (th.key === 'ice') {
    g.fillStyle = c.dark; ell(g, 16, 12, 17, 4);
    g.fillStyle = c.base;
    ell(g, 6, 9, 8, 5); ell(g, 17, 8, 9, 5.5); ell(g, 27, 9.5, 7, 4.5); g.fillRect(0, 9, 32, 4);
    g.fillStyle = 'rgba(180,220,255,0.8)'; g.fillRect(0, 12.5, 32, 1.4);
  } else {
    g.fillStyle = c.dark; g.fillRect(0, 8, 32, 4);
    g.fillStyle = c.base; g.fillRect(0, 7, 32, 3);
    g.fillStyle = c.light;
    for (let i = 0; i < 4; i++) circ(g, 3 + r() * 26, 8.5 + r() * 2, 0.9);
  }
}

function drawCrackArt(g, level, r) {
  g.strokeStyle = 'rgba(20,10,0,0.6)'; g.lineWidth = 1.6; g.lineCap = 'round';
  const n = level === 1 ? 2 : level === 2 ? 4 : 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.6;
    let x = 16, y = 16;
    g.beginPath(); g.moveTo(x, y);
    const len = 6 + level * 3 + r() * 4;
    for (let k = 1; k <= 3; k++) {
      x = 16 + Math.cos(a + (r() - 0.5) * 0.6) * len * k / 3;
      y = 16 + Math.sin(a + (r() - 0.5) * 0.6) * len * k / 3;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  if (level === 3) { g.fillStyle = 'rgba(20,10,0,0.35)'; circ(g, 16, 16, 3); }
}

function buildAtlas(themeKey, P) {
  const th = THEMES[themeKey];
  const A = { P, th, tiles: {}, wall: [], cracks: [], top: [] };
  const sc = P / 32;
  const ids = [TILE.BEDROCK, TILE.SOFT, TILE.SOFT_TOP, TILE.MEDIUM, TILE.HARD, TILE.BANANA, TILE.CRYSTAL,
    TILE.BOOM, TILE.CRATE, TILE.PLATFORM, TILE.SPIKE, TILE.GLASS];
  for (const id of ids) {
    A.tiles[id] = [0, 1, 2, 3].map((v) => {
      const c = makeCanvas(P, P), g = c.getContext('2d');
      g.scale(sc, sc);
      drawTileArt(g, id, th, v, rng32(id * 977 + v * 131 + 7));
      return c;
    });
  }
  A.wall = [0, 1, 2, 3].map((v) => {
    const c = makeCanvas(P, P), g = c.getContext('2d'); g.scale(sc, sc);
    drawWallArt(g, th, rng32(4111 + v * 17)); return c;
  });
  A.cracks = [1, 2, 3].map((lv) => {
    const c = makeCanvas(P, P), g = c.getContext('2d'); g.scale(sc, sc);
    drawCrackArt(g, lv, rng32(lv * 53 + 9)); return c;
  });
  A.top = [0, 1, 2, 3].map((v) => {
    const c = makeCanvas(P, P * 20 / 32), g = c.getContext('2d'); g.scale(sc, sc);
    drawTopDeco(g, th, v, rng32(v * 71 + 3)); return c;
  });
  return A;
}

// ---------- 하트 / 바나나 / 보석 ----------
function drawHeartShape(g, x, y, s, color) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath();
  g.moveTo(0, 9);
  g.bezierCurveTo(-13, 0, -9, -11, 0, -5);
  g.bezierCurveTo(9, -11, 13, 0, 0, 9);
  g.closePath();
  g.fillStyle = color || '#ff4d6d'; g.fill();
  g.lineWidth = 1.6; g.strokeStyle = 'rgba(90,10,30,0.7)'; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.7)'; ell(g, -4.5, -3.5, 2.2, 1.6, -0.6);
  g.restore();
}

function drawBanana(ctx, x, y, s, rot) { drawBananaShape(ctx, x, y, s, rot); }

function drawBunch(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 3) * 0.08);
  drawBananaShape(ctx, -3, 2, 1, -0.9);
  drawBananaShape(ctx, 3, 2, 1, 0.9 + Math.PI * 0.05);
  drawBananaShape(ctx, 0, 4, 1.05, 0.05);
  ctx.fillStyle = '#5b8f2e'; rrect(ctx, -2, -9, 4, 6, 2); ctx.fill();
  ctx.restore();
}

function starPath(g, r1, r2, n) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 === 0 ? r1 : r2;
    if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r); else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
}

function drawGem(ctx, x, y, s, t, alpha) {
  ctx.save(); ctx.translate(x, y);
  if (alpha !== undefined) ctx.globalAlpha *= alpha;
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 26 * s);
  glow.addColorStop(0, 'rgba(255,120,200,0.55)'); glow.addColorStop(1, 'rgba(255,120,200,0)');
  ctx.fillStyle = glow; circ(ctx, 0, 0, 26 * s);
  ctx.scale(s * (0.78 + 0.22 * Math.cos(t * 2.6)), s);
  ctx.lineJoin = 'round';
  starPath(ctx, 15, 7.5, 5);
  ctx.fillStyle = '#ff4fa3'; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = '#8f0f55'; ctx.stroke();
  starPath(ctx, 9, 4.5, 5); ctx.fillStyle = '#ff9fd2'; ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.globalAlpha *= 0.9; ell(ctx, -3, -5, 2.6, 1.8, -0.5);
  ctx.restore();
}

function drawHeartItem(ctx, x, y, s, t) {
  const b = 1 + Math.sin(t * 5) * 0.06;
  drawHeartShape(ctx, x, y, s * b);
}

// ---------- 뭉치 (주인공 고릴라) ----------
const MC_PAL = { fur: '#4a5878', furD: '#333d55', skin: '#f2cda4', skinD: '#c99a6d', belly: '#d8b893', muzzle: '#f8dfbf', band: '#2fb36b', bandD: '#1f8a4f' };
const MC_SUPER = { fur: '#f0b429', furD: '#b9780b', skin: '#fff0c8', skinD: '#e0b064', belly: '#ffe7a3', muzzle: '#fff6dc', band: '#ff4d6d', bandD: '#c2183f' };

function drawHat(ctx, id, x, y, t) {
  ctx.save(); ctx.translate(x, y);
  ctx.lineWidth = 1.5;
  switch (id) {
    case 1: { // 빨간 모자
      ctx.fillStyle = '#b71c2b'; ell(ctx, 10, 3.5, 9, 2.6);
      ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.ellipse(0, 3.5, 11.5, 10, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#8c1220'; ctx.stroke();
      ctx.fillStyle = '#ffffff'; circ(ctx, 0, -6.2, 1.8);
      ctx.fillStyle = '#ffd23f'; drawBananaShape(ctx, 1, -1, 0.42, 0);
      break;
    }
    case 2: { // 공룡 모자
      ctx.fillStyle = '#f7e35a';
      for (let i = 0; i < 4; i++) poly(ctx, [[-10 + i * 5, -2 - i * 0.6], [-7.5 + i * 5, -10 - i], [-5 + i * 5, -2 - i * 0.6]]);
      ctx.fillStyle = '#58c25a'; ctx.beginPath(); ctx.ellipse(1, 4, 13, 11, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#2e8a35'; ctx.stroke();
      ctx.fillStyle = '#ffffff'; circ(ctx, 5, -2, 2.4); circ(ctx, 10, -1, 2.2);
      ctx.fillStyle = '#1b1b1b'; circ(ctx, 5.6, -2, 1.1); circ(ctx, 10.5, -1, 1);
      ctx.fillStyle = '#ffffff'; poly(ctx, [[-11, 4], [-9, 7.5], [-7, 4]]); poly(ctx, [[-6, 4], [-4, 7.5], [-2, 4]]);
      break;
    }
    case 3: { // 해적 모자
      ctx.fillStyle = '#26232e';
      ctx.beginPath(); ctx.moveTo(-15, 4); ctx.quadraticCurveTo(-8, -14, 1, -11); ctx.quadraticCurveTo(10, -14, 17, 4);
      ctx.quadraticCurveTo(1, -1, -15, 4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f0c04a'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-13, 2.5); ctx.quadraticCurveTo(1, -2.5, 15, 2.5); ctx.stroke();
      ctx.fillStyle = '#ffffff'; circ(ctx, 1, -5, 3);
      ctx.fillStyle = '#26232e'; circ(ctx, 0, -5.4, 0.8); circ(ctx, 2.2, -5.4, 0.8);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(5, -8.5); ctx.moveTo(5, -1); ctx.lineTo(-3, -8.5); ctx.stroke();
      break;
    }
    case 4: { // 우주 헬멧
      ctx.strokeStyle = '#d8f3ff'; ctx.lineWidth = 2.2;
      ctx.fillStyle = 'rgba(200,240,255,0.16)';
      ctx.beginPath(); ctx.arc(0, 11, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 11, 13, -2.6, -1.9); ctx.stroke();
      ctx.strokeStyle = '#9aa7b4'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-6, -5); ctx.lineTo(-9, -14); ctx.stroke();
      ctx.fillStyle = '#ff4d6d'; circ(ctx, -9, -14.5, 2.4 + Math.sin(t * 6) * 0.4);
      break;
    }
    case 5: { // 황금 왕관
      ctx.fillStyle = '#ffcc33'; ctx.strokeStyle = '#b8860b';
      ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(-11, -8); ctx.lineTo(-5, -2); ctx.lineTo(0, -11); ctx.lineTo(5, -2);
      ctx.lineTo(11, -8); ctx.lineTo(10, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff4d6d'; circ(ctx, 0, 0, 2.2);
      ctx.fillStyle = '#4fc3f7'; circ(ctx, -6, 1, 1.6); circ(ctx, 6, 1, 1.6);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; circ(ctx, -7, -6, 1); circ(ctx, 0, -9, 1); circ(ctx, 9, -6, 1);
      break;
    }
    default: { // 노란 안전모
      ctx.fillStyle = '#e8a91a'; rrect(ctx, -13.5, 1.5, 27.5, 4.2, 2); ctx.fill();
      ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.ellipse(0, 3, 11.5, 10.5, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#b97f0e'; ctx.stroke();
      ctx.fillStyle = '#ffe08a'; rrect(ctx, -1.6, -6.8, 3.2, 9, 1.6); ctx.fill();
      ctx.fillStyle = '#fff7c2'; circ(ctx, 9.5, -1.5, 3.1);
      ctx.strokeStyle = '#a5740c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(9.5, -1.5, 3.1, 0, Math.PI * 2); ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

function drawArm(ctx, sx, sy, hx, hy, fist, pal, back) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = pal.furD; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.strokeStyle = back ? pal.furD : pal.fur; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.fillStyle = pal.skinD; circ(ctx, hx, hy, fist + 1.3);
  ctx.fillStyle = back ? pal.skinD : pal.skin; circ(ctx, hx, hy, fist);
  if (!back && fist > 6) {
    ctx.strokeStyle = pal.skinD; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(hx - fist * 0.35, hy - fist * 0.5); ctx.lineTo(hx - fist * 0.35, hy + fist * 0.4);
    ctx.moveTo(hx + fist * 0.15, hy - fist * 0.55); ctx.lineTo(hx + fist * 0.15, hy + fist * 0.45); ctx.stroke();
  }
}

function drawLeg(ctx, x, lift, pal, back) {
  ctx.fillStyle = back ? pal.furD : pal.fur;
  rrect(ctx, x - 4.5, -12 - lift, 9, 11, 4); ctx.fill();
  ctx.fillStyle = pal.furD; ell(ctx, x + 1.2, -1.8 - lift, 5.6, 2.9);
}

// o: {facing, pose, t, walk, climb, superT, costume, scale, alpha, rot}
function drawMoongchi(ctx, x, y, o) {
  const pal = o.superT > 0 ? MC_SUPER : MC_PAL;
  const t = o.t || 0;
  ctx.save();
  ctx.translate(x, y);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  if (o.superT > 0) {
    const r = 40 + Math.sin(t * 10) * 3;
    const gl = ctx.createRadialGradient(0, -24, 4, 0, -24, r);
    gl.addColorStop(0, 'rgba(255,230,120,0.55)'); gl.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = gl; circ(ctx, 0, -24, r);
  }
  if (o.rot) ctx.rotate(o.rot);
  const sc = (o.scale || 1) * (o.superT > 0 ? 1.2 : 1);
  ctx.scale((o.facing || 1) * sc, sc);

  let bob = 0, lean = 0, sq = 1, eyes = 'open', mouth = 'smile';
  let hb = [-12, -11], hf = [13, -11], fb = 5, ff = 5.5, lb = [-6, 0], lf = [5, 0];
  switch (o.pose) {
    case 'walk': {
      const ph = o.walk || 0, s1 = Math.sin(ph);
      bob = -Math.abs(Math.cos(ph)) * 1.6;
      lb = [-6 + s1 * 4, Math.max(0, -Math.cos(ph)) * 3]; lf = [5 - s1 * 4, Math.max(0, Math.cos(ph)) * 3];
      hb = [-12 - s1 * 5, -12]; hf = [13 + s1 * 5, -12];
      break;
    }
    case 'jump': hb = [-14, -43]; hf = [15, -43]; lb = [-6, 4]; lf = [6, 4]; mouth = 'open'; break;
    case 'fall': hb = [-19, -31]; hf = [20, -31]; lb = [-7, 1]; lf = [6, 2]; mouth = 'open'; break;
    case 'punchF': hf = [28, -23]; ff = 8.5; hb = [-8, -16]; lean = 0.1; mouth = 'yell'; break;
    case 'punchU': hf = [7, -64]; ff = 8.5; hb = [-11, -18]; mouth = 'yell'; break;
    case 'punchD': hf = [9, 3]; hb = [-5, 3]; ff = 7.5; fb = 7; sq = 0.86; mouth = 'yell'; break;
    case 'pound': hf = [9, 6]; hb = [-4, 6]; ff = 7.5; fb = 7; sq = 0.8; lb = [-7, 3]; lf = [7, 3]; mouth = 'yell'; break;
    case 'climb': {
      const c = Math.sin(o.climb || 0) * 6;
      hf = [14, -45 + c]; hb = [12, -32 - c]; lb = [4, 0]; lf = [9, 4 + c * 0.4]; lean = -0.05;
      break;
    }
    case 'hold': hb = [-7, -48]; hf = [11, -48]; break;
    case 'hurt': hb = [-19, -27]; hf = [18, -27]; lean = -0.22; eyes = 'shut'; mouth = 'open'; break;
    case 'cheer': hb = [-13, -53]; hf = [15, -53]; eyes = 'happy'; mouth = 'open'; bob = -2 * Math.abs(Math.sin(t * 8)); break;
    case 'clap': hb = [9, -31]; hf = [12, -32]; eyes = 'happy'; break;
    case 'dead': hb = [-19, -21]; hf = [19, -21]; eyes = 'x'; mouth = 'open'; break;
    default: {
      const br = Math.sin(t * 3) * 0.8;
      bob = br * 0.5; hb = [-12, -11 + br]; hf = [13, -11 + br];
    }
  }
  ctx.rotate(lean);
  const shY = (-27 + bob) * sq;
  drawArm(ctx, -5, shY, hb[0], hb[1], fb, pal, true);
  drawLeg(ctx, lb[0], lb[1], pal, true);
  drawLeg(ctx, lf[0], lf[1], pal, false);

  ctx.save();
  ctx.scale(1, sq);
  ctx.lineWidth = 1.6;
  ctx.fillStyle = pal.fur; ell(ctx, 0, -19 + bob, 13.5, 13.5);
  ctx.strokeStyle = pal.furD; ctx.beginPath(); ctx.ellipse(0, -19 + bob, 13.5, 13.5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = pal.belly; ell(ctx, 3, -16.5 + bob, 8.5, 9);
  ctx.fillStyle = pal.band; rrect(ctx, -9, -29 + bob, 21, 5, 2.5); ctx.fill();
  ctx.fillStyle = pal.bandD; poly(ctx, [[-9, -27 + bob], [-15, -30 + bob], [-14, -23 + bob]]);
  // 머리
  const hy = -35 + bob;
  ctx.fillStyle = pal.fur; circ(ctx, 3, hy, 11.5);
  ctx.strokeStyle = pal.furD; ctx.beginPath(); ctx.arc(3, hy, 11.5, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = pal.fur; circ(ctx, -7, hy, 3.8);
  ctx.fillStyle = pal.skinD; circ(ctx, -7, hy, 2);
  ctx.fillStyle = pal.skin; ell(ctx, 6.5, hy + 1, 8, 7.3);
  ctx.fillStyle = pal.muzzle; ell(ctx, 8.6, hy + 5.6, 5.6, 3.9);
  ctx.fillStyle = '#5a3a2a'; circ(ctx, 7.6, hy + 4.6, 0.9); circ(ctx, 10.2, hy + 4.6, 0.9);
  ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 1.2;
  if (mouth === 'smile') { ctx.beginPath(); ctx.arc(8.6, hy + 6.2, 2.6, 0.25, Math.PI - 0.25); ctx.stroke(); }
  else if (mouth === 'yell') { ctx.fillStyle = '#7a2b2b'; ell(ctx, 9, hy + 7.4, 2.4, 1.8); }
  else { ctx.fillStyle = '#7a2b2b'; ell(ctx, 8.8, hy + 7.3, 2.2, 2.4); }
  ctx.fillStyle = pal.furD; rrect(ctx, 0, hy - 5.8, 15.5, 3, 1.5); ctx.fill();
  if (eyes === 'open') {
    ctx.fillStyle = '#ffffff'; circ(ctx, 5.5, hy - 1.6, 2.7); circ(ctx, 11.2, hy - 1.6, 2.7);
    ctx.fillStyle = '#1b1b1b'; circ(ctx, 6.3, hy - 1.4, 1.5); circ(ctx, 12, hy - 1.4, 1.5);
    ctx.fillStyle = '#ffffff'; circ(ctx, 6.8, hy - 2.1, 0.55); circ(ctx, 12.5, hy - 2.1, 0.55);
  } else {
    ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 1.4; ctx.beginPath();
    if (eyes === 'happy') {
      ctx.arc(5.5, hy - 0.8, 2.2, Math.PI + 0.3, -0.3); ctx.moveTo(13.4, hy - 1.2); ctx.arc(11.2, hy - 0.8, 2.2, Math.PI + 0.3, -0.3);
    } else if (eyes === 'x') {
      ctx.moveTo(4, hy - 3); ctx.lineTo(7, hy); ctx.moveTo(7, hy - 3); ctx.lineTo(4, hy);
      ctx.moveTo(10, hy - 3); ctx.lineTo(13, hy); ctx.moveTo(13, hy - 3); ctx.lineTo(10, hy);
    } else {
      ctx.moveTo(4, hy - 3); ctx.lineTo(7, hy - 1.5); ctx.lineTo(4, hy);
      ctx.moveTo(13, hy - 3); ctx.lineTo(10, hy - 1.5); ctx.lineTo(13, hy);
    }
    ctx.stroke();
  }
  drawHat(ctx, o.costume || 0, 3, hy - 9.5, t);
  ctx.restore();

  drawArm(ctx, 6, shY, hf[0], hf[1], ff, pal, false);
  ctx.restore();
}

// ---------- 적 ----------
function drawMole(ctx, x, y, o) {
  const snow = o.kind === 'snow';
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  const fur = snow ? '#eef5ff' : '#8a6244', furD = snow ? '#b9cde3' : '#5f412b';
  const st = Math.sin((o.t || 0) * 11) * (o.moving ? 2 : 0);
  ctx.fillStyle = '#f3b4a6'; ell(ctx, -6 + st * 0.5, -2, 4, 2.4); ell(ctx, 6 - st * 0.5, -2, 4, 2.4);
  ctx.fillStyle = fur; ell(ctx, 0, -12, 13, 11.5);
  ctx.strokeStyle = furD; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, -12, 13, 11.5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = snow ? '#ffffff' : '#b88a63'; ell(ctx, 3, -8.5, 7, 6);
  ctx.fillStyle = '#f6a5b4'; ell(ctx, 12, -12, 4.3, 3.3);
  ctx.fillStyle = '#d45a78'; ell(ctx, 14.6, -12.6, 1.7, 1.4);
  ctx.fillStyle = '#1b1b1b'; ell(ctx, 6.6, -16, 1.6, 1.9);
  ctx.fillStyle = '#ffffff'; circ(ctx, 7, -16.6, 0.5);
  ctx.fillStyle = '#fff4e0';
  poly(ctx, [[8, -6], [11, -4], [8, -3]]); poly(ctx, [[5, -6], [8, -4], [5, -3]]);
  if (snow) {
    ctx.fillStyle = '#2f80ed'; rrect(ctx, -9, -16, 18, 4, 2); ctx.fill();
    ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.ellipse(-1, -21, 9, 7, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffffff'; circ(ctx, -1, -28.5, 3); rrect(ctx, -10, -22, 18, 3, 1.5); ctx.fill();
    if (o.throwT > 0) { ctx.fillStyle = '#ffffff'; circ(ctx, 9, -26, 5); }
  } else {
    ctx.fillStyle = '#d96f12'; rrect(ctx, -10, -21.5, 21, 3, 1.5); ctx.fill();
    ctx.fillStyle = '#ff8c2b'; ctx.beginPath(); ctx.ellipse(-0.5, -20.5, 9.5, 7.5, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffd08a'; rrect(ctx, -1.6, -27.5, 3.2, 6, 1.4); ctx.fill();
  }
  if (o.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ell(ctx, 0, -12, 14, 12.5); }
  ctx.restore();
}

function drawBat(ctx, x, y, o) {
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  const f = Math.sin((o.t || 0) * 18);
  ctx.fillStyle = '#4b2f78';
  poly(ctx, [[-4, -2], [-20, -8 - f * 7], [-16, 2 - f * 3], [-11, -1 - f * 2], [-7, 5]]);
  poly(ctx, [[4, -2], [20, -8 - f * 7], [16, 2 - f * 3], [11, -1 - f * 2], [7, 5]]);
  ctx.fillStyle = '#7350a8'; circ(ctx, 0, 0, 8.5);
  poly(ctx, [[-6, -5], [-4, -13], [-1, -6]]); poly(ctx, [[6, -5], [4, -13], [1, -6]]);
  ctx.fillStyle = '#9d7ccf'; ell(ctx, 0, 3, 4.5, 3.5);
  ctx.fillStyle = '#ffe066'; circ(ctx, -2.8, -1.5, 2.4); circ(ctx, 3.6, -1.5, 2.4);
  ctx.fillStyle = '#1b1b1b'; circ(ctx, -2.2, -1.2, 1.1); circ(ctx, 4.2, -1.2, 1.1);
  ctx.fillStyle = '#ffffff'; poly(ctx, [[-1.5, 3], [-0.6, 5.6], [0.3, 3]]); poly(ctx, [[1.2, 3], [2.1, 5.6], [3, 3]]);
  if (o.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; circ(ctx, 0, 0, 9.5); }
  ctx.restore();
}

function drawCrab(ctx, x, y, o) {
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  const t = o.t || 0, st = o.moving ? Math.sin(t * 14) * 2 : 0;
  ctx.strokeStyle = '#d9532c'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const lx = -9 + i * 4.5;
    ctx.moveTo(lx, -6); ctx.lineTo(lx - 3 + (i % 2 ? st : -st), 0);
    ctx.moveTo(-lx, -6); ctx.lineTo(-lx + 3 + (i % 2 ? -st : st), 0);
  }
  ctx.stroke();
  ctx.fillStyle = '#e4572e'; circ(ctx, 15, -9, 5.2); circ(ctx, -14, -9, 4.4);
  ctx.fillStyle = '#ffb199'; poly(ctx, [[15, -9], [21, -12], [20, -7]]);
  ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(5, -18); ctx.lineTo(5, -23); ctx.moveTo(10, -17); ctx.lineTo(10, -22); ctx.stroke();
  ctx.fillStyle = '#ffffff'; circ(ctx, 5, -24, 2.6); circ(ctx, 10, -23, 2.6);
  ctx.fillStyle = '#1b1b1b'; circ(ctx, 5.7, -24, 1.2); circ(ctx, 10.7, -23, 1.2);
  ctx.fillStyle = o.hurt ? '#c9bfb6' : '#9b9088';
  ctx.beginPath(); ctx.ellipse(0, -9, 15, 10, 0, Math.PI, 0); ctx.lineTo(15, -7); ctx.lineTo(-15, -7); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#6e645c'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#7f756e'; circ(ctx, -6, -13, 2.4); circ(ctx, 2, -15, 2); circ(ctx, 8, -11, 1.8);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ell(ctx, -4, -16, 5, 1.6, -0.2);
  if (o.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ell(ctx, 0, -10, 16, 10); }
  ctx.restore();
}

function drawJelly(ctx, x, y, o) {
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  const t = o.t || 0, sq = o.squash || 1;
  ctx.scale(1 / sq, sq);
  const fl = Math.sin(t * 20) * 1.5;
  ctx.fillStyle = '#ff5a1a'; poly(ctx, [[-7, -16], [-3, -27 - fl], [0, -18], [4, -30 + fl], [8, -16]]);
  ctx.fillStyle = '#ffd36e'; poly(ctx, [[-3, -16], [0, -23 + fl], [3, -16]]);
  const gr = ctx.createLinearGradient(0, -22, 0, 0);
  gr.addColorStop(0, '#ffb347'); gr.addColorStop(1, '#ff6a1e');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(-14, -20, 0, -20); ctx.quadraticCurveTo(14, -20, 13, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#b93d0c'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#ffffff'; circ(ctx, 1, -11, 3); circ(ctx, 8, -11, 3);
  ctx.fillStyle = '#1b1b1b'; circ(ctx, 2, -10.5, 1.5); circ(ctx, 9, -10.5, 1.5);
  ctx.strokeStyle = '#7a1f05'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(5, -6, 2.4, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ell(ctx, -6, -14, 3, 2, -0.5);
  if (o.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ell(ctx, 0, -10, 14, 11); }
  ctx.restore();
}

function drawSnowball(ctx, x, y, r) {
  ctx.fillStyle = '#ffffff'; circ(ctx, x, y, r);
  ctx.fillStyle = '#cfe6f7'; circ(ctx, x + r * 0.25, y + r * 0.25, r * 0.55);
  ctx.strokeStyle = '#9ec3e0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
}

function drawRock(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
  ctx.fillStyle = '#6f6577';
  poly(ctx, [[-12, -3], [-7, -11], [4, -12], [12, -5], [11, 7], [2, 12], [-9, 9]]);
  ctx.fillStyle = '#8f859a'; poly(ctx, [[-8, -6], [-4, -10], [4, -10], [1, -4]]);
  ctx.strokeStyle = '#3e3645'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-12, -3); ctx.lineTo(-7, -11); ctx.lineTo(4, -12); ctx.lineTo(12, -5); ctx.lineTo(11, 7);
  ctx.lineTo(2, 12); ctx.lineTo(-9, 9); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

// 두더지 대왕과 드릴 탱크. (x, y) = 발밑 가운데
function drawBoss(ctx, x, y, b, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(b.facing || 1, 1);
  const spin = b.drill || 0;
  const shake = b.state === 'prep' ? Math.sin(t * 60) * 1.5 : 0;
  ctx.translate(shake, 0);
  // 바퀴
  ctx.fillStyle = '#2f343b'; rrect(ctx, -38, -17, 68, 17, 8.5); ctx.fill();
  for (let i = 0; i < 5; i++) {
    const wx = -30 + i * 13;
    ctx.fillStyle = '#5b626c'; circ(ctx, wx, -8.5, 5.2);
    ctx.strokeStyle = '#2f343b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(wx + Math.cos(spin) * 4, -8.5 + Math.sin(spin) * 4); ctx.lineTo(wx - Math.cos(spin) * 4, -8.5 - Math.sin(spin) * 4); ctx.stroke();
  }
  // 몸통
  ctx.fillStyle = '#7d8a99'; rrect(ctx, -36, -42, 62, 27, 10); ctx.fill();
  ctx.strokeStyle = '#4c5663'; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); rrect(ctx, -36, -24, 62, 8, 3); ctx.clip();
  for (let i = -40; i < 30; i += 8) { ctx.fillStyle = (i / 8) % 2 === 0 ? '#ffcc33' : '#2b2b2b'; poly(ctx, [[i, -16], [i + 6, -24], [i + 10, -24], [i + 4, -16]]); }
  ctx.restore();
  ctx.fillStyle = '#5b626c'; rrect(ctx, -42, -50, 7, 14, 2); ctx.fill();
  // 드릴
  ctx.fillStyle = '#c9d1d9';
  poly(ctx, [[24, -40], [24, -16], [58, -28]]);
  ctx.save(); ctx.beginPath(); ctx.moveTo(24, -40); ctx.lineTo(24, -16); ctx.lineTo(58, -28); ctx.closePath(); ctx.clip();
  ctx.strokeStyle = '#8d98a3'; ctx.lineWidth = 3;
  for (let i = -1; i < 6; i++) {
    const sx = 24 + ((i * 8 + (spin * 6) % 8) + 8) % 40;
    ctx.beginPath(); ctx.moveTo(sx, -42); ctx.lineTo(sx + 6, -14); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = '#6f7a85'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(24, -40); ctx.lineTo(58, -28); ctx.lineTo(24, -16); ctx.stroke();
  // 대왕
  const hy = -70 + (b.state === 'tired' ? Math.sin(t * 6) * 1.5 : 0);
  ctx.fillStyle = '#7b5a96'; ell(ctx, -6, -50, 17, 13);
  ctx.fillStyle = '#b393cf'; ell(ctx, -2, -47, 9, 8);
  ctx.fillStyle = '#7b5a96'; circ(ctx, -2, hy, 14.5);
  ctx.strokeStyle = '#4e3466'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-2, hy, 14.5, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f6a5b4'; ell(ctx, 12, hy + 3, 6, 4.6);
  ctx.fillStyle = '#d45a78'; ell(ctx, 16.5, hy + 2.4, 2.3, 2);
  ctx.fillStyle = '#3a2550'; ell(ctx, 6, hy + 8, 7, 2.2, 0.15);
  if (b.state === 'stunned') {
    ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 1.4;
    for (const ex of [1, 9]) { ctx.beginPath(); ctx.arc(ex, hy - 3, 3, 0, Math.PI * 1.6); ctx.stroke(); }
  } else {
    ctx.fillStyle = '#16121c'; rrect(ctx, -4, hy - 6.5, 9, 6, 2.5); ctx.fill(); rrect(ctx, 6, hy - 6.5, 9, 6, 2.5); ctx.fill();
    ctx.fillRect(4, hy - 5, 3, 1.4);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-2, hy - 5.5, 3, 1.2); ctx.fillRect(8, hy - 5.5, 3, 1.2);
  }
  ctx.fillStyle = '#ffcc33'; ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-12, hy - 11); ctx.lineTo(-13, hy - 25); ctx.lineTo(-7, hy - 18); ctx.lineTo(-2, hy - 28);
  ctx.lineTo(3, hy - 18); ctx.lineTo(9, hy - 25); ctx.lineTo(8, hy - 11); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e63946'; circ(ctx, -2, hy - 15, 2.4);
  ctx.fillStyle = '#7b5a96'; ell(ctx, 10, -48, 5, 4); ell(ctx, -20, -48, 5, 4);
  if (b.state === 'stunned') {
    for (let i = 0; i < 3; i++) {
      const a = t * 5 + i * 2.1;
      ctx.save(); ctx.translate(-2 + Math.cos(a) * 18, hy - 22 + Math.sin(a) * 5);
      starPath(ctx, 4.5, 2, 5); ctx.fillStyle = '#ffe066'; ctx.fill(); ctx.restore();
    }
  }
  if (b.state === 'tired') {
    ctx.fillStyle = '#7fd3ff'; ell(ctx, -16, hy - 8 + ((t * 30) % 10), 2, 3);
  }
  if (b.flash > 0) {
    ctx.globalAlpha = 0.6; ctx.fillStyle = '#ffffff';
    rrect(ctx, -38, -44, 70, 44, 10); ctx.fill(); circ(ctx, -2, hy, 15);
  }
  ctx.restore();
}

// ---------- 지형 장식 ----------
function drawFlag(ctx, x, y, active, raise, t) {
  // (x, y) = 깃대 아래
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#6b4a2a'; rrect(ctx, -2, -58, 4, 58, 2); ctx.fill();
  ctx.fillStyle = '#ffd23f'; circ(ctx, 0, -59, 3.4);
  const fy = -54 + (1 - raise) * 34;
  const wv = Math.sin(t * 6) * 2;
  ctx.fillStyle = active ? '#ffd23f' : '#b7b0a3';
  ctx.beginPath(); ctx.moveTo(2, fy); ctx.quadraticCurveTo(14, fy - 3 + wv, 26, fy + 2 + wv);
  ctx.quadraticCurveTo(16, fy + 9, 26, fy + 16 - wv); ctx.quadraticCurveTo(14, fy + 13, 2, fy + 16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = active ? '#b9850f' : '#7f786c'; ctx.lineWidth = 1.4; ctx.stroke();
  if (active) drawBananaShape(ctx, 13, fy + 8, 0.55, -0.2, '#8a5a0a');
  ctx.restore();
}

function drawSign(ctx, x, y, near, t) {
  // (x, y) = 기둥 아래
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#7a5230'; rrect(ctx, -2.5, -24, 5, 24, 2); ctx.fill();
  const by = -40 + (near ? Math.sin(t * 6) * 1.2 : 0);
  ctx.fillStyle = near ? '#ffe9a8' : '#e7c48c'; rrect(ctx, -14, by, 28, 19, 4); ctx.fill();
  ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#7a5230'; ctx.font = 'bold 15px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('!', 0, by + 10);
  ctx.restore();
}

function drawDoor(ctx, x, y, w, h, lit, need, open, t, th) {
  ctx.save(); ctx.translate(x, y);
  const stone = th && th.key === 'ice' ? '#7c93ad' : th && th.key === 'lava' ? '#4a3b45' : '#857a6e';
  const stoneD = th && th.key === 'ice' ? '#5a7290' : th && th.key === 'lava' ? '#2f2530' : '#5e554b';
  ctx.fillStyle = stoneD;
  ctx.beginPath(); ctx.moveTo(-6, h); ctx.lineTo(-6, 18); ctx.quadraticCurveTo(w / 2, -18, w + 6, 18); ctx.lineTo(w + 6, h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = stone;
  ctx.beginPath(); ctx.moveTo(-3, h); ctx.lineTo(-3, 19); ctx.quadraticCurveTo(w / 2, -13, w + 3, 19); ctx.lineTo(w + 3, h); ctx.closePath(); ctx.fill();
  // 안쪽
  ctx.save();
  ctx.beginPath(); ctx.moveTo(5, h); ctx.lineTo(5, 24); ctx.quadraticCurveTo(w / 2, 2, w - 5, 24); ctx.lineTo(w - 5, h); ctx.closePath(); ctx.clip();
  const inner = ctx.createLinearGradient(0, 10, 0, h);
  inner.addColorStop(0, '#fff1b8'); inner.addColorStop(1, '#ffb347');
  ctx.fillStyle = open > 0 ? inner : '#2b1d14'; ctx.fillRect(0, 0, w, h);
  if (open > 0) {
    ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.2; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) poly(ctx, [[w / 2, h], [w / 2 - 30 + i * 20, 0], [w / 2 - 22 + i * 20, 0]]);
    ctx.globalAlpha = 1;
  }
  const dy = -open * (h - 10);
  ctx.fillStyle = '#9a6435'; ctx.fillRect(0, dy, w, h);
  ctx.fillStyle = '#7d4f28'; for (let i = 1; i < 4; i++) ctx.fillRect(i * w / 4 - 1, dy, 2, h);
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(0, dy + h * 0.38, w, 4); ctx.fillRect(0, dy + h * 0.72, w, 4);
  ctx.fillStyle = '#ffd23f'; circ(ctx, w - 14, dy + h * 0.56, 3);
  ctx.restore();
  // 보석 자리
  for (let i = 0; i < need; i++) {
    const gx = w / 2 + (i - (need - 1) / 2) * 17, gy = 6 + Math.abs(i - (need - 1) / 2) * 5;
    ctx.fillStyle = '#2b1d14'; circ(ctx, gx, gy, 6.5);
    if (i < lit) drawGem(ctx, gx, gy, 0.42, t + i);
    else { ctx.fillStyle = '#5b4f45'; circ(ctx, gx, gy, 4.5); }
  }
  ctx.restore();
}

// ---------- 배경 ----------
function drawBackground(ctx, th, camX, camY, vw, vh, t, horizonY) {
  const g = ctx.createLinearGradient(0, 0, 0, vh);
  g.addColorStop(0, th.bgTop); g.addColorStop(1, th.bgBot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
  if (th.key === 'jungle') {
    const hy = horizonY - camY;
    ctx.fillStyle = 'rgba(255,248,200,0.5)'; circ(ctx, vw * 0.82, 74 - camY * 0.05, 46);
    ctx.fillStyle = '#fff3b0'; circ(ctx, vw * 0.82, 74 - camY * 0.05, 32);
    for (let i = 0; i < 6; i++) {
      const span = vw + 320;
      const cx = ((((i * 290 + t * 6 - camX * 0.12) % span) + span) % span) - 160;
      const cy = 46 + ((i * 53) % 90) - camY * 0.08;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ell(ctx, cx, cy, 34, 13); ell(ctx, cx - 22, cy + 5, 22, 10); ell(ctx, cx + 24, cy + 4, 24, 11);
    }
    ctx.fillStyle = th.far;
    ctx.beginPath(); ctx.moveTo(0, vh);
    for (let x = 0; x <= vw + 20; x += 20) {
      const wx = x + camX * 0.25;
      ctx.lineTo(x, hy - 70 - 34 * Math.sin(wx * 0.006) - 16 * Math.sin(wx * 0.017));
    }
    ctx.lineTo(vw, vh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = th.farDark;
    ctx.beginPath(); ctx.moveTo(0, vh);
    for (let x = 0; x <= vw + 20; x += 20) {
      const wx = x + camX * 0.45;
      ctx.lineTo(x, hy - 26 - 22 * Math.sin(wx * 0.009 + 1) - 10 * Math.sin(wx * 0.023));
    }
    ctx.lineTo(vw, vh); ctx.closePath(); ctx.fill();
    // 야자수
    const step = 230;
    const off = camX * 0.5;
    for (let i = Math.floor(off / step) - 1; i < Math.floor((off + vw) / step) + 2; i++) {
      const tx = i * step - off + (hash2(i, 7) % 80);
      const baseY = hy - 18 - (hash2(i, 3) % 20);
      const th2 = 70 + (hash2(i, 5) % 40);
      ctx.strokeStyle = th.treeDark; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tx, baseY + 30); ctx.quadraticCurveTo(tx + 10, baseY - th2 / 2, tx + 4, baseY - th2); ctx.stroke();
      ctx.fillStyle = th.tree;
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k - 2) * 0.62;
        ctx.save(); ctx.translate(tx + 4, baseY - th2); ctx.rotate(a);
        ell(ctx, 22, 0, 24, 6.5); ctx.restore();
      }
      ctx.fillStyle = '#ffd23f'; circ(ctx, tx + 1, baseY - th2 + 7, 3.5); circ(ctx, tx + 7, baseY - th2 + 8, 3.5);
    }
    return;
  }
  // 동굴 배경
  const off = camX * 0.3, offY = camY * 0.3;
  const step = 120;
  ctx.fillStyle = th.far;
  for (let i = Math.floor(off / step) - 1; i < Math.floor((off + vw) / step) + 2; i++) {
    const x = i * step - off;
    const h1 = 40 + (hash2(i, 11) % 90), h2 = 30 + (hash2(i, 13) % 80);
    const topY = -offY % 400 - 60;
    poly(ctx, [[x - 26, topY], [x + 26, topY], [x + (hash2(i, 2) % 10) - 5, topY + h1 + 60]]);
    const by = vh + 40;
    poly(ctx, [[x + 30, by], [x + 86, by], [x + 58, by - h2 - 40]]);
  }
  ctx.fillStyle = th.farDark;
  const off2 = camX * 0.5;
  for (let i = Math.floor(off2 / 200) - 1; i < Math.floor((off2 + vw) / 200) + 2; i++) {
    const x = i * 200 - off2 + (hash2(i, 17) % 60);
    const w = 40 + (hash2(i, 19) % 40);
    rrect(ctx, x, vh * 0.15 + (hash2(i, 23) % 80) - camY * 0.08, w, vh * 1.2, w / 2); ctx.fill();
  }
  if (th.key === 'ice') {
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 26; i++) {
      const x = ((hash2(i, 31) % 1000) / 1000 * (vw + 40) + t * 12 * ((i % 3) + 1) - camX * 0.2) % (vw + 40);
      const y = (((hash2(i, 37) % 1000) / 1000 * vh + t * 20 * ((i % 2) + 1)) % vh);
      circ(ctx, (x + vw + 40) % (vw + 40) - 20, y, 1.4 + (i % 3));
    }
    ctx.globalAlpha = 1;
  }
  if (th.glow) {
    const gg = ctx.createLinearGradient(0, vh * 0.55, 0, vh);
    gg.addColorStop(0, 'rgba(255,90,31,0)'); gg.addColorStop(1, 'rgba(255,90,31,0.28)');
    ctx.fillStyle = gg; ctx.fillRect(0, vh * 0.55, vw, vh * 0.45);
    ctx.fillStyle = '#ffb347';
    for (let i = 0; i < 18; i++) {
      const sp = 20 + (i % 5) * 9;
      const x = ((hash2(i, 41) % 1000) / 1000 * vw + Math.sin(t + i) * 20 + vw) % vw;
      const y = vh - ((t * sp + (hash2(i, 43) % 1000)) % (vh + 20));
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 3 + i);
      circ(ctx, x, y, 1.6);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- 이야기 장면 ----------
function drawBananaTree(ctx, x, y, s, full, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 14; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -70, 4, -140); ctx.stroke();
  ctx.strokeStyle = '#5e3e22'; ctx.lineWidth = 3;
  for (let i = 1; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 1.4, -i * 20); ctx.lineTo(8 + i * 1.2, -i * 20 - 4); ctx.stroke(); }
  ctx.fillStyle = '#3fae4f';
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.5 + Math.sin(t * 1.5 + k) * 0.04;
    ctx.save(); ctx.translate(4, -140); ctx.rotate(a); ell(ctx, 48, 0, 52, 13); ctx.restore();
  }
  if (full) {
    for (let i = 0; i < 9; i++) {
      const bx = -34 + (i % 5) * 18 + (i > 4 ? 9 : 0), by = -126 + (i > 4 ? 18 : 0);
      drawBananaShape(ctx, bx, by, 1.1, 1.4 + (i % 3) * 0.2);
    }
  }
  ctx.restore();
}

function drawStoryScene(ctx, key, w, h, t) {
  const groundY = h * 0.85;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  if (key === 'theft') { sky.addColorStop(0, '#5f6fb5'); sky.addColorStop(1, '#c9a7d8'); }
  else { sky.addColorStop(0, '#6fc8f5'); sky.addColorStop(1, '#d4f3ff'); }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = key === 'theft' ? '#7d90c8' : '#a5dca0';
  ctx.beginPath(); ctx.moveTo(0, groundY);
  for (let x = 0; x <= w; x += 20) ctx.lineTo(x, groundY - 60 - 30 * Math.sin(x * 0.008));
  ctx.lineTo(w, groundY); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#9c6839'; ctx.fillRect(0, groundY, w, h - groundY);
  ctx.fillStyle = '#5cc94a'; ctx.fillRect(0, groundY - 4, w, 12);
  const s = Math.min(w, h) / 410;
  if (key === 'village' || key === 'ending') {
    drawBananaTree(ctx, w * 0.3, groundY, s * 1.15, true, t);
    drawMoongchi(ctx, w * 0.62, groundY, { facing: -1, pose: key === 'ending' ? 'cheer' : 'walk', walk: t * 8, t, scale: s * 2.2, costume: 0 });
    if (key === 'ending') {
      const bb = { facing: 1, state: 'tired', drill: t * 10 };
      ctx.save(); ctx.globalAlpha = 0.95;
      drawBoss(ctx, w * 0.86, groundY, bb, t);
      ctx.restore();
      for (let i = 0; i < 40; i++) {
        const cx = (hash2(i, 3) % 1000) / 1000 * w, sp = 40 + (i % 5) * 20;
        const cy = ((t * sp + (hash2(i, 9) % 1000)) % (h + 40)) - 20;
        ctx.fillStyle = ['#ff4d6d', '#ffd23f', '#4fc3f7', '#7bd88f', '#c77dff'][i % 5];
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 3 + i); ctx.fillRect(-3, -5, 6, 10); ctx.restore();
      }
    }
  } else if (key === 'theft') {
    drawBananaTree(ctx, w * 0.3, groundY, s * 1.15, false, t);
    ctx.fillStyle = '#2b1d14'; ell(ctx, w * 0.62, groundY + 6, 60 * s, 14 * s);
    const bob = Math.sin(t * 3) * 4;
    drawBoss(ctx, w * 0.62, groundY + bob, { facing: -1, state: 'idle', drill: t * 14 }, t);
    for (let i = 0; i < 7; i++) {
      const a = t * 2 + i;
      drawBananaShape(ctx, w * 0.5 + Math.cos(a) * 60 * s, groundY - 120 * s + Math.sin(a * 1.3) * 30 * s, 1.4 * s, a);
    }
    drawMoongchi(ctx, w * 0.12, groundY, { facing: 1, pose: 'hurt', t, scale: s * 2.2, costume: 0 });
  } else if (key === 'go') {
    ctx.fillStyle = '#7a4f2b'; ctx.fillRect(0, groundY, w, h - groundY);
    const bands = ['#eec67a', '#8fd6f0', '#3d2b2b'];
    bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, groundY + 18 + i * 16, w, 16); });
    drawMoongchi(ctx, w * 0.5, groundY, { facing: 1, pose: 'punchD', t, scale: s * 2.4, costume: 0 });
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = '#9c6839';
      const a = t * 4 + i;
      ctx.fillRect(w * 0.5 + Math.cos(a) * 40 * s, groundY - 10 - Math.abs(Math.sin(a)) * 40 * s, 8, 8);
    }
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); const ax = w * 0.8, ay = groundY - 40;
    ctx.moveTo(ax - 14, ay); ctx.lineTo(ax + 14, ay); ctx.lineTo(ax + 14, ay + 30); ctx.lineTo(ax + 28, ay + 30);
    ctx.lineTo(ax, ay + 60); ctx.lineTo(ax - 28, ay + 30); ctx.lineTo(ax - 14, ay + 30); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 3; ctx.stroke();
  }
}
