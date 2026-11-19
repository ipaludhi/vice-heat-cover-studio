// LEONIDA HEAT — cover engine (fresh code, written for round 2).
// Draws a GTA-style multi-panel poster cover on a 2D canvas: photo panels
// with a real pixel grade, a vector sunset band with sun disc + palm
// silhouettes, and big gradient title lettering. No network, no libraries.

export const GUTTER_MIN = 6;

// Seeded PRNG so grain is identical on every render of the same cover.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function lerp(a, b, t) { return a + (b - a) * t; }

// ---------------------------------------------------------------- layouts
// Each layout maps a cover of size W x H to panel rects. A rect is
// {x, y, w, h, rot} in cover pixels; rot is a small tilt in radians.
function gutterFor(w) { return Math.max(GUTTER_MIN, Math.round(w * 0.008)); }

function diagonalPanels(w, h) {
  const g = gutterFor(w);
  const rightX = Math.round(w * 0.66);
  const rightW = w - rightX - g;
  const smallH = Math.round((h - g * 4) / 3);
  return [
    { x: -Math.round(w * 0.03), y: -Math.round(h * 0.03), w: Math.round(w * 0.67), h: Math.round(h * 1.06), rot: -0.07 },
    { x: rightX, y: g, w: rightW, h: smallH, rot: 0.02 },
    { x: rightX, y: g * 2 + smallH, w: rightW, h: smallH, rot: -0.015 },
    { x: rightX, y: g * 3 + smallH * 2, w: rightW, h: smallH, rot: 0.025 },
  ];
}

function fivePanels(w, h) {
  const g = gutterFor(w);
  // The title band starts at 0.735H: lay the grid out inside the art zone
  // above it, so no row ends up hidden behind the band.
  const artH = Math.round(h * 0.735);
  const heroW = Math.round(w * 0.62);
  const heroH = Math.round(artH * 0.62);
  const sideW = w - heroW - g;
  const sideH = Math.round((heroH - g) / 2);
  const botH = artH - heroH - g;
  const botW = Math.round((w - g) / 2);
  return [
    { x: 0, y: 0, w: heroW, h: heroH, rot: 0 },
    { x: heroW + g, y: 0, w: sideW, h: sideH, rot: 0 },
    { x: heroW + g, y: sideH + g, w: sideW, h: sideH, rot: 0 },
    { x: 0, y: heroH + g, w: botW, h: botH, rot: 0 },
    { x: botW + g, y: heroH + g, w: botW, h: botH, rot: 0 },
  ];
}

function ninePanels(w, h) {
  const g = gutterFor(w);
  // The title band starts at 0.735H: lay the grid out inside the art zone
  // above it, so no row ends up hidden behind the band.
  const artH = Math.round(h * 0.735);
  const cw = Math.round((w - g * 2) / 3);
  const ch = Math.round((artH - g * 2) / 3);
  const out = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out.push({ x: c * (cw + g), y: r * (ch + g), w: cw, h: ch, rot: 0 });
    }
  }
  return out;
}

function duoPanels(w, h) {
  const g = gutterFor(w);
  const pw = Math.round((w - g) / 2);
  return [
    { x: 0, y: 0, w: pw, h: h, rot: 0 },
    { x: pw + g, y: 0, w: pw, h: h, rot: 0 },
  ];
}

function trioPanels(w, h) {
  const g = gutterFor(w);
  const pw = Math.round((w - g * 2) / 3);
  return [
    { x: 0, y: 0, w: pw, h: h, rot: 0 },
    { x: pw + g, y: 0, w: pw, h: h, rot: 0 },
    { x: (pw + g) * 2, y: 0, w: pw, h: h, rot: 0 },
  ];
}

function soloPanels(w, h) {
  return [{ x: 0, y: 0, w, h, rot: 0 }];
}

export const LAYOUTS = [
  { id: 'diagonal', name: 'Diagonal Hero', panels: diagonalPanels },
  { id: 'five', name: 'Five Panel', panels: fivePanels },
  { id: 'nine', name: 'Nine Grid', panels: ninePanels },
  { id: 'duo', name: 'Duo Split', panels: duoPanels },
  { id: 'trio', name: 'Trio Strip', panels: trioPanels },
  { id: 'solo', name: 'Solo Poster', panels: soloPanels },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// ------------------------------------------------------------------ grades
// Each grade works on raw pixels: posterize first (kept moderate so skin
// never goes blotchy), then a colour move of its own. Strength 0..1 scales
// both the posterize depth and the colour move.
function posterize(v, levels) {
  const step = 255 / (levels - 1);
  return Math.round(Math.round(v / step) * step);
}

function gradePixels(data, gradeId, strength) {
  const levels = 9 - Math.round(strength * 5); // 9 (soft) .. 4 (hard)
  const s = strength;
  for (let i = 0; i < data.length; i += 4) {
    let r = posterize(data[i], levels);
    let g = posterize(data[i + 1], levels);
    let b = posterize(data[i + 2], levels);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (gradeId === 'vice') {
      r = clamp(r * (1 + 0.14 * s) + 10 * s, 0, 255);
      g = clamp(g * (1 - 0.02 * s), 0, 255);
      b = clamp(b * (1 - 0.14 * s), 0, 255);
    } else if (gradeId === 'neon') {
      const sat = 1 + 0.38 * s;
      const avg = (r + g + b) / 3;
      r = clamp(avg + (r - avg) * sat + (lum < 110 ? 14 * s : 0), 0, 255);
      g = clamp(avg + (g - avg) * sat, 0, 255);
      b = clamp(avg + (b - avg) * sat + (lum < 110 ? 12 * s : 0), 0, 255);
    } else if (gradeId === 'dusk') {
      const t = clamp(lum / 255, 0, 1);
      r = clamp(lerp(r * 0.92, 255, (1 - t) * 0.10 * s) + t * 26 * s, 0, 255);
      g = clamp(lerp(g * 0.88, 90, (1 - t) * 0.28 * s), 0, 255);
      b = clamp(lerp(b, 165, (1 - t) * 0.30 * s) + 8 * s, 0, 255);
    } else if (gradeId === 'ocean') {
      r = clamp(r * (1 - 0.22 * s), 0, 255);
      g = clamp(g * (1 + 0.10 * s) + 6 * s, 0, 255);
      b = clamp(b * (1 + 0.16 * s), 0, 255);
    } else if (gradeId === 'mono') {
      const v = posterize(lum, 5);
      r = g = b = clamp(v * 1.06 - 6, 0, 255);
    } else if (gradeId === 'acid') {
      const nr = g, ng = b, nb = r;
      r = clamp(lerp(r, nr, 0.55 * s), 0, 255);
      g = clamp(lerp(g, ng, 0.55 * s) + 10 * s, 0, 255);
      b = clamp(lerp(b, nb, 0.55 * s), 0, 255);
    }
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
}

export const GRADES = [
  { id: 'vice', name: 'Vice Sunset' },
  { id: 'neon', name: 'Neon Nights' },
  { id: 'dusk', name: 'Palm Dusk' },
  { id: 'ocean', name: 'Ocean Heat' },
  { id: 'mono', name: 'Mono Ink' },
  { id: 'acid', name: 'Acid Vice' },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// ------------------------------------------------------------ print texture
function halftoneDots(ctx, w, h, strength, rng) {
  const step = 7;
  ctx.save();
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const px = ctx.getImageData(Math.min(w - 1, x | 0), Math.min(h - 1, y | 0), 1, 1).data;
      const lum = (px[0] + px[1] + px[2]) / 3;
      const rad = (1 - lum / 255) * 2.1 * strength + 0.25;
      if (rad <= 0.3) continue;
      ctx.fillStyle = `rgba(15,5,25,${0.10 + 0.10 * strength})`;
      ctx.beginPath();
      ctx.arc(x + (rng() - 0.5), y + (rng() - 0.5), rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function filmGrain(ctx, w, h, strength, rng) {
  const n = Math.round(((w * h) / 110) * strength);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const v = rng() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},0.05)`;
    ctx.fillRect((rng() * w) | 0, (rng() * h) | 0, 1, 1);
  }
  ctx.restore();
}

function vignette(ctx, w, h, strength) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  grad.addColorStop(0, 'rgba(20,0,40,0)');
  grad.addColorStop(1, `rgba(20,0,40,${0.30 * strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// -------------------------------------------------------------- vector art
function drawPalm(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 0.13;
  ctx.lineCap = 'round';
  // trunk: a gentle lean
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(0.10, -0.55, 0.34, -1.05);
  ctx.stroke();
  // fronds: seven arcs fanning from the crown, drooping low like a palm
  const crownX = 0.34, crownY = -1.05;
  for (let k = 0; k < 7; k++) {
    const a = (-Math.PI * 0.92) + (k * Math.PI * 0.31);
    const len = 0.95 - Math.abs(k - 3) * 0.09;
    const ex = crownX + Math.cos(a) * len;
    const ey = crownY + Math.sin(a) * len * 0.72;
    const mx = crownX + Math.cos(a) * len * 0.55;
    const my = crownY + Math.sin(a) * len * 0.55 - 0.08;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSunDisc(ctx, cx, cy, r) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.9);
  glow.addColorStop(0, 'rgba(255,214,90,0.55)');
  glow.addColorStop(0.55, 'rgba(255,110,90,0.18)');
  glow.addColorStop(1, 'rgba(255,110,90,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.9, 0, Math.PI * 2);
  ctx.fill();
  const disc = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.1, cx, cy, r);
  disc.addColorStop(0, '#ffe98a');
  disc.addColorStop(0.6, '#ffb347');
  disc.addColorStop(1, '#ff5e7a');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// ------------------------------------------------------------- panel photo
// Draw one photo into a panel rect with cover-fit, zoom, pan and flip,
// then grade its pixels. Returns nothing; draws onto ctx.
function drawPanelPhoto(ctx, photo, rect, panel, gradeId, strength, seed) {
  const pad = Math.ceil(Math.max(rect.w, rect.h) * 0.10) + 2;
  const pw = Math.ceil(rect.w) + pad * 2;
  const ph = Math.ceil(rect.h) + pad * 2;
  const off = document.createElement('canvas');
  off.width = pw; off.height = ph;
  const octx = off.getContext('2d');
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(pw / iw, ph / ih) * (panel.zoom || 1);
  const dw = iw * base, dh = ih * base;
  const dx = (pw - dw) / 2 + (panel.ox || 0);
  const dy = (ph - dh) / 2 + (panel.oy || 0);
  octx.save();
  if (panel.flip) { octx.translate(pw, 0); octx.scale(-1, 1); }
  octx.drawImage(photo, dx, dy, dw, dh);
  octx.restore();
  const img = octx.getImageData(0, 0, pw, ph);
  gradePixels(img.data, gradeId, strength);
  octx.putImageData(img, 0, 0);
  const rng = mulberry32(seed + Math.round(rect.x) * 31 + Math.round(rect.y) * 7);
  halftoneDots(octx, pw, ph, strength, rng);
  filmGrain(octx, pw, ph, strength, rng);
  vignette(octx, pw, ph, strength);
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate(rect.rot || 0);
  ctx.drawImage(off, -pw / 2, -ph / 2, pw, ph);
  ctx.restore();
}

// ------------------------------------------------------------------- cover
export function drawCover(canvas, opts) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  const layout = layoutById(opts.layoutId || 'diagonal');
  const grade = gradeById(opts.gradeId || 'vice');
  const strength = clamp(opts.strength == null ? 0.55 : opts.strength, 0, 1);
  const seed = opts.seed || 20261119;
  const panels = opts.panels || [];
  const photos = opts.photos || [];

  // paper
  ctx.fillStyle = '#f6efe3';
  ctx.fillRect(0, 0, W, H);

  // photo panels
  const rects = layout.panels(W, H);
  rects.forEach((rect, i) => {
    const panel = panels[i] || { photo: i % Math.max(1, photos.length), zoom: 1, ox: 0, oy: 0, flip: false };
    const photo = photos[panel.photo % Math.max(1, photos.length)];
    if (!photo) return;
    drawPanelPhoto(ctx, photo, rect, panel, grade.id, strength, seed + i * 977);
  });

  // sunset title band
  const bandTop = Math.round(H * 0.735);
  const bandH = H - bandTop;
  const bandGrad = ctx.createLinearGradient(0, bandTop, 0, H);
  bandGrad.addColorStop(0, '#3d1156');
  bandGrad.addColorStop(0.45, '#a12063');
  bandGrad.addColorStop(0.75, '#ff5e3a');
  bandGrad.addColorStop(1, '#ffb347');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandTop, W, bandH);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, bandTop, W, Math.max(2, H * 0.006));

  const sunR = bandH * 0.52;
  drawSunDisc(ctx, W * 0.5, bandTop + bandH * 0.46, sunR);
  drawPalm(ctx, W * 0.055, H * 0.985, bandH * 0.62, '#1c0a2e');
  drawPalm(ctx, W * 0.945, H * 0.985, bandH * 0.55, '#1c0a2e');

  // subtitle, title, footer
  const title = (opts.title || 'SUNSET HEIST').toUpperCase();
  const titleSize = Math.round(H * 0.115);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const subY = bandTop + bandH * 0.16;
  ctx.font = `italic ${Math.round(H * 0.032)}px Georgia, serif`;
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(opts.subtitle || 'a Leonida story', W * 0.5, subY);
  const titleY = bandTop + bandH * 0.52;
  ctx.font = `${titleSize}px Anton, 'Arial Black', sans-serif`;
  const tg = ctx.createLinearGradient(0, titleY - titleSize * 0.62, 0, titleY + titleSize * 0.45);
  tg.addColorStop(0, '#ffffff');
  tg.addColorStop(0.45, '#ffd76a');
  tg.addColorStop(1, '#ff5e7a');
  ctx.lineWidth = Math.max(3, H * 0.011);
  ctx.strokeStyle = '#14061f';
  ctx.lineJoin = 'round';
  ctx.strokeText(title, W * 0.5, titleY);
  ctx.fillStyle = tg;
  ctx.fillText(title, W * 0.5, titleY);
  const footY = H - bandH * 0.085;
  ctx.font = `600 ${Math.round(H * 0.020)}px Anton, 'Arial Black', sans-serif`;
  ctx.fillStyle = 'rgba(255,240,200,0.92)';
  ctx.fillText((opts.footer || 'VICE CITY • EST. 2026').toUpperCase(), W * 0.5, footY);

  // badge ribbon, top-left
  const badge = (opts.badge || 'LEONIDA').toUpperCase();
  if (badge) {
    ctx.font = `700 ${Math.round(H * 0.022)}px Anton, 'Arial Black', sans-serif`;
    const bw = ctx.measureText('★ ' + badge + '  ').width + H * 0.03;
    const bh = Math.round(H * 0.042);
    const bx = Math.round(W * 0.02), by = Math.round(H * 0.025);
    ctx.fillStyle = 'rgba(20,6,31,0.85)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ ' + badge, bx + H * 0.016, by + bh / 2 + 1);
    ctx.textAlign = 'center';
  }
  return canvas;
}

// Render a cover offscreen at an export size; returns the canvas.
export function renderCover(photos, opts, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  return drawCover(canvas, opts);
}
