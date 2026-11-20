// LEONIDA HEAT — cover rendering engine (round 3, written fresh).
// Draws a GTA-style multi-panel poster on a 2D canvas: panel layouts,
// real pixel grades (posterize + gradient map + halftone + grain +
// vignette via getImageData), vector sun and palm silhouettes, and a
// gradient title band. Pure canvas, no network, no libraries.

export const BAND_TOP = 0.735; // title band starts at 73.5% of height

export const GRADES = {
  sunset: {
    label: 'Vice Sunset', levels: 5,
    ramp: [[16, 8, 32], [122, 34, 64], [232, 92, 52], [255, 176, 92], [255, 238, 190]],
    halftone: 0.10, grain: 0.05, vignette: 0.32, warm: 1.12,
  },
  neon: {
    label: 'Neon Nights', levels: 4,
    ramp: [[8, 6, 28], [64, 22, 96], [168, 44, 150], [255, 92, 190], [120, 240, 255]],
    halftone: 0.14, grain: 0.06, vignette: 0.38, warm: 0.95,
  },
  dusk: {
    label: 'Palm Dusk', levels: 5,
    ramp: [[14, 10, 34], [74, 30, 80], [158, 62, 96], [240, 128, 84], [255, 214, 150]],
    halftone: 0.08, grain: 0.04, vignette: 0.30, warm: 1.05,
  },
  ocean: {
    label: 'Ocean Heat', levels: 5,
    ramp: [[6, 24, 40], [16, 84, 110], [30, 158, 160], [255, 170, 90], [255, 240, 200]],
    halftone: 0.09, grain: 0.05, vignette: 0.30, warm: 1.0,
  },
  mono: {
    label: 'Mono Ink', levels: 4,
    ramp: [[10, 10, 12], [70, 70, 76], [140, 140, 148], [205, 205, 212], [248, 248, 250]],
    halftone: 0.18, grain: 0.07, vignette: 0.34, warm: 1.0,
  },
  acid: {
    label: 'Acid Vice', levels: 4,
    ramp: [[12, 30, 8], [40, 110, 30], [150, 200, 40], [240, 255, 110], [190, 255, 220]],
    halftone: 0.12, grain: 0.06, vignette: 0.30, warm: 1.0,
  },
};

export const LAYOUTS = ['diagonal', 'five', 'nine', 'duo', 'trio', 'solo'];
export const LAYOUT_LABELS = {
  diagonal: 'Diagonal Hero', five: 'Five Panel', nine: 'Nine Grid',
  duo: 'Duo Split', trio: 'Trio Strip', solo: 'Solo Poster',
};

// Panel rectangles for a layout inside the art zone (w x artH).
// Every panel: {x, y, w, h}. Gutters are white, like a printed poster.
export function layoutPanels(layout, w, artH) {
  const g = Math.max(3, Math.round(w * 0.008));
  const panels = [];
  if (layout === 'diagonal') {
    panels.push({ x: 0, y: 0, w: Math.round(w * 0.60), h: artH, diagonal: true });
    panels.push({ x: Math.round(w * 0.60) + g, y: 0, w: w - Math.round(w * 0.60) - g, h: Math.round((artH - g) / 2) });
    panels.push({ x: Math.round(w * 0.60) + g, y: Math.round((artH - g) / 2) + g, w: w - Math.round(w * 0.60) - g, h: artH - Math.round((artH - g) / 2) - g });
  } else if (layout === 'five') {
    const heroW = Math.round(w * 0.55);
    panels.push({ x: 0, y: 0, w: heroW, h: artH });
    const rx = heroW + g, rw = w - heroW - g;
    const cw = Math.round((rw - g) / 2), ch = Math.round((artH - g) / 2);
    panels.push({ x: rx, y: 0, w: cw, h: ch });
    panels.push({ x: rx + cw + g, y: 0, w: rw - cw - g, h: ch });
    panels.push({ x: rx, y: ch + g, w: cw, h: artH - ch - g });
    panels.push({ x: rx + cw + g, y: ch + g, w: rw - cw - g, h: artH - ch - g });
  } else if (layout === 'nine') {
    const cw = Math.round((w - 2 * g) / 3), ch = Math.round((artH - 2 * g) / 3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        panels.push({
          x: c * (cw + g), y: r * (ch + g),
          w: c === 2 ? w - 2 * (cw + g) : cw,
          h: r === 2 ? artH - 2 * (ch + g) : ch,
        });
      }
    }
  } else if (layout === 'duo') {
    const hw = Math.round((w - g) / 2);
    panels.push({ x: 0, y: 0, w: hw, h: artH });
    panels.push({ x: hw + g, y: 0, w: w - hw - g, h: artH });
  } else if (layout === 'trio') {
    const tw = Math.round((w - 2 * g) / 3);
    for (let c = 0; c < 3; c++) {
      panels.push({
        x: c * (tw + g), y: 0,
        w: c === 2 ? w - 2 * (tw + g) : tw, h: artH,
      });
    }
  } else {
    panels.push({ x: 0, y: 0, w, h: artH });
  }
  return panels;
}

// Deterministic PRNG so grain is identical on every render.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quantize(v, levels) {
  const step = 255 / (levels - 1);
  return Math.round(Math.round(v / step) * step);
}

function rampColor(ramp, t) {
  const n = ramp.length - 1;
  const pos = Math.max(0, Math.min(1, t)) * n;
  const i = Math.min(n - 1, Math.floor(pos));
  const f = pos - i;
  const a = ramp[i], b = ramp[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

// Grade one panel's pixels in place. img is an ImageData-like object.
// strength 0..1 blends the graded pixels back toward the original.
function gradePixels(img, grade, strength, seed) {
  const d = img.data;
  const w = img.width, h = img.height;
  const rand = mulberry32(seed);
  const lut = new Float32Array(256 * 3);
  for (let v = 0; v < 256; v++) {
    const q = quantize(v, grade.levels);
    const lum = q / 255;
    const c = rampColor(grade.ramp, lum);
    lut[v * 3] = c[0];
    lut[v * 3 + 1] = c[1];
    lut[v * 3 + 2] = c[2];
  }
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const warmR = Math.min(255, r * grade.warm);
    const srcR = (r + warmR) / 2, srcG = g, srcB = b;
    const q = quantize((srcR + srcG + srcB) / 3, grade.levels);
    const idx = q * 3;
    let nr = lut[idx], ng = lut[idx + 1], nb = lut[idx + 2];
    // Blend graded colour with the (posterized) source so faces keep shape.
    const mix = 0.55 + 0.45 * lum;
    nr = nr * mix + quantize(srcR, grade.levels) * (1 - mix);
    ng = ng * mix + quantize(srcG, grade.levels) * (1 - mix);
    nb = nb * mix + quantize(srcB, grade.levels) * (1 - mix);
    d[i] = srcR + (nr - srcR) * strength;
    d[i + 1] = srcG + (ng - srcG) * strength;
    d[i + 2] = srcB + (nb - srcB) * strength;
  }
  // Halftone dots: darken a grid of small circles, stronger in shadows.
  const dot = Math.max(3, Math.round(w / 160));
  for (let y = 0; y < h; y += dot * 2) {
    for (let x = 0; x < w; x += dot * 2) {
      const px = x + dot, py = y + dot;
      if (px >= w || py >= h) continue;
      const i = (py * w + px) * 4;
      const lum = (d[i] + d[i + 1] + d[i + 2]) / 765;
      const r = dot * (0.35 + 0.65 * (1 - lum)) * grade.halftone * 3;
      if (r < 0.4) continue;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          const xx = px + dx, yy = py + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const j = (yy * w + xx) * 4;
          d[j] *= 0.82; d[j + 1] *= 0.82; d[j + 2] *= 0.82;
        }
      }
    }
  }
  // Grain: seeded noise, and a vignette that darkens the corners.
  const cx = w / 2, cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const noise = (rand() - 0.5) * 255 * grade.grain;
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / maxDist;
      const vig = 1 - grade.vignette * Math.pow(dist, 2.2);
      d[i] = Math.max(0, Math.min(255, (d[i] + noise) * vig));
      d[i + 1] = Math.max(0, Math.min(255, (d[i + 1] + noise) * vig));
      d[i + 2] = Math.max(0, Math.min(255, (d[i + 2] + noise) * vig));
    }
  }
}

// Draw one photo into a panel rect with cover-fit, zoom, pan and flip,
// then grade its pixels. Works on the main canvas through an offscreen.
function paintPanel(ctx, img, rect, transform, grade, strength, seed) {
  const { w, h } = rect;
  if (w <= 0 || h <= 0) return;
  const off = document.createElement('canvas');
  off.width = Math.max(2, Math.round(w));
  off.height = Math.max(2, Math.round(h));
  const octx = off.getContext('2d');
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(off.width / iw, off.height / ih) * (transform.zoom || 1);
  const sw = off.width / scale, sh = off.height / scale;
  const cx = iw / 2 + (transform.panX || 0) * iw * 0.4;
  const cy = ih / 2 + (transform.panY || 0) * ih * 0.4;
  let sx = cx - sw / 2, sy = cy - sh / 2;
  sx = Math.max(0, Math.min(iw - sw, sx));
  sy = Math.max(0, Math.min(ih - sh, sy));
  octx.save();
  if (transform.flip) {
    octx.translate(off.width, 0);
    octx.scale(-1, 1);
  }
  if (rect.diagonal) {
    // Diagonal hero: clip the panel to a slanted right edge.
    octx.beginPath();
    octx.moveTo(0, 0);
    octx.lineTo(off.width, 0);
    octx.lineTo(off.width - off.width * 0.10, off.height);
    octx.lineTo(0, off.height);
    octx.closePath();
    octx.clip();
  }
  octx.drawImage(img, sx, sy, sw, sh, 0, 0, off.width, off.height);
  octx.restore();
  const imgData = octx.getImageData(0, 0, off.width, off.height);
  gradePixels(imgData, grade, strength, seed);
  octx.putImageData(imgData, 0, 0);
  ctx.drawImage(off, rect.x, rect.y);
}

// Vector art: a glowing sun disc with retro horizontal slats, drawn on
// an offscreen so the slats punch real gaps through the disc.
export function drawSunDisc(ctx, cx, cy, r) {
  const off = document.createElement('canvas');
  off.width = Math.ceil(r * 4);
  off.height = Math.ceil(r * 4);
  const o = off.getContext('2d');
  const ox = off.width / 2, oy = off.height / 2;
  const glow = o.createRadialGradient(ox, oy, r * 0.1, ox, oy, r * 1.9);
  glow.addColorStop(0, 'rgba(255,214,90,0.55)');
  glow.addColorStop(0.55, 'rgba(255,110,90,0.18)');
  glow.addColorStop(1, 'rgba(255,110,90,0)');
  o.fillStyle = glow;
  o.beginPath();
  o.arc(ox, oy, r * 1.9, 0, Math.PI * 2);
  o.fill();
  const disc = o.createLinearGradient(ox, oy - r, ox, oy + r);
  disc.addColorStop(0, '#ffe08a');
  disc.addColorStop(0.55, '#ff9e57');
  disc.addColorStop(1, '#ff5e62');
  o.fillStyle = disc;
  o.beginPath();
  o.arc(ox, oy, r, 0, Math.PI * 2);
  o.fill();
  // Slats: wider gaps toward the bottom, the classic sunset look.
  o.globalCompositeOperation = 'destination-out';
  for (let s = 0; s < 3; s++) {
    const sy = oy + r * (0.05 + s * 0.30);
    const sh = r * (0.05 + s * 0.045);
    o.fillRect(ox - r, sy, r * 2, sh);
  }
  o.globalCompositeOperation = 'source-over';
  ctx.drawImage(off, cx - off.width / 2, cy - off.height / 2);
}

// Vector art: a palm silhouette. Seven fronds, a heavy leaning trunk,
// fronds drooping low — it should read as a palm, not a spider.
export function drawPalm(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 0.11;
  ctx.lineCap = 'round';
  // Trunk: a gentle lean to the right.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(0.10, -0.55, 0.34, -1.05);
  ctx.stroke();
  // Fronds: seven arcs fanning from the crown, drooping low.
  const crownX = 0.34, crownY = -1.05;
  for (let k = 0; k < 7; k++) {
    const a = (-Math.PI * 0.95) + (k * Math.PI * 0.32);
    const len = 1.05 - Math.abs(k - 3) * 0.09;
    const ex = crownX + Math.cos(a) * len;
    const ey = crownY + Math.sin(a) * len * 0.62;
    const mx = crownX + Math.cos(a) * len * 0.55;
    const my = crownY + Math.sin(a) * len * 0.55 - 0.30;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${px}px ${family}`;
  }
  return px;
}

// Main entry: draw the whole cover on a canvas of W x H.
// images: array of loaded HTMLImageElements (or canvases).
// state: { layout, grade, strength, title, subtitle, badge, footer,
//          panels: [{ photo, zoom, panX, panY, flip }] }
export function renderCover(canvas, images, state) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  const artH = Math.round(H * BAND_TOP);
  const grade = GRADES[state.grade] || GRADES.sunset;
  const strength = state.strength == null ? 0.55 : state.strength;

  // Paper-white poster background with gutters.
  ctx.fillStyle = '#f7f2e8';
  ctx.fillRect(0, 0, W, H);

  const panels = layoutPanels(state.layout || 'diagonal', W, artH);
  const photoCount = Math.max(1, images.length);
  panels.forEach((rect, i) => {
    const spec = (state.panels && state.panels[i]) || {};
    const img = images[(spec.photo == null ? i % photoCount : spec.photo) % photoCount];
    if (!img) return;
    paintPanel(ctx, img, rect, spec, grade, strength, 1000 + i * 77);
  });

  // Sun disc + palms over the art zone, silhouetted in deep plum. The sun
  // sits in the top-left sky corner, where photos rarely put a face;
  // the palms frame the bottom corners small so they never cover one.
  const sunR = Math.round(Math.min(W, H) * 0.055);
  drawSunDisc(ctx, Math.round(W * 0.10), Math.round(artH * 0.12), sunR);
  const palmColor = 'rgba(28,10,32,0.88)';
  drawPalm(ctx, Math.round(W * 0.03), Math.round(artH * 0.99), Math.round(H * 0.10), palmColor);
  drawPalm(ctx, Math.round(W * 0.97), Math.round(artH * 0.99), Math.round(H * 0.085), palmColor);

  // Title band: dark plum, gradient title, neon subtitle, badge, footer.
  const bandY = artH;
  const bandH = H - artH;
  const bandGrad = ctx.createLinearGradient(0, bandY, 0, H);
  bandGrad.addColorStop(0, '#1c0a20');
  bandGrad.addColorStop(1, '#3a0f2e');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY, W, bandH);
  const pad = Math.round(W * 0.035);
  const title = (state.title || 'SUNSET HEIST').toUpperCase();
  const titlePx = fitFont(ctx, title, W - pad * 2, Math.round(bandH * 0.52), 'Anton, "Arial Black", sans-serif');
  const titleGrad = ctx.createLinearGradient(0, bandY, W, bandY + bandH);
  titleGrad.addColorStop(0, '#ffe08a');
  titleGrad.addColorStop(0.5, '#ff9e57');
  titleGrad.addColorStop(1, '#ff5e62');
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = Math.max(2, Math.round(titlePx * 0.09));
  const titleY = bandY + bandH * 0.34;
  ctx.strokeText(title, pad, titleY);
  ctx.fillStyle = titleGrad;
  ctx.fillText(title, pad, titleY);

  const sub = state.subtitle || 'LEONIDA • VICE CITY';
  const subPx = Math.round(bandH * 0.16);
  ctx.font = `${subPx}px Anton, "Arial Black", sans-serif`;
  ctx.fillStyle = '#7df9ff';
  ctx.fillText(sub.toUpperCase(), pad, bandY + bandH * 0.72);

  if (state.badge) {
    const badgeText = state.badge.toUpperCase();
    const bPx = Math.round(bandH * 0.15);
    ctx.font = `${bPx}px Anton, "Arial Black", sans-serif`;
    const bw = ctx.measureText(badgeText).width + bPx * 1.6;
    const bx = W - pad - bw, by = bandY + bandH * 0.62, bh = bPx * 1.9;
    ctx.fillStyle = '#ff2e88';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, bx + bw / 2, by + bh / 2 + 1);
    ctx.textAlign = 'left';
  }
  if (state.footer) {
    ctx.font = `${Math.round(bandH * 0.11)}px "Arial", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(state.footer, pad, bandY + bandH * 0.92);
  }
  return canvas;
}
