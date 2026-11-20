// LEONIDA HEAT — cover engine (round 4, written fresh).
//
// Draws GTA-style multi-panel cover art on a 2D canvas: panels filled from
// the user's photos, a real per-pixel grade (posterize + gradient map +
// halftone + grain + vignette), vector sun + palms, and a giant Anton
// title band. No network, no libraries — canvas only.
//
// Layouts live inside the art zone: (0, 0, W, artH) with artH = 0.735 * H.
// The title band occupies the rest. Palms stay small and in the corners;
// the sun sits in the top-left of the sky so it never covers a face.

export const LAYOUTS = {
  diagonal: 'Diagonal Hero',
  five: 'Five Panel',
  nine: 'Nine Grid',
  duo: 'Duo Split',
  trio: 'Trio Strip',
  solo: 'Solo Poster',
};

export const GRADES = {
  sunset: 'Vice Sunset',
  neon: 'Neon Nights',
  dusk: 'Palm Dusk',
  ocean: 'Ocean Heat',
  mono: 'Mono Ink',
  acid: 'Acid Vice',
};

// [shadow, mid, highlight] per grade, as [r, g, b].
const GRADE_STOPS = {
  sunset: [[26, 11, 46], [255, 126, 61], [255, 209, 102]],
  neon: [[11, 16, 53], [255, 46, 136], [55, 245, 230]],
  dusk: [[22, 10, 36], [176, 77, 255], [255, 154, 92]],
  ocean: [[4, 24, 46], [30, 157, 180], [255, 224, 138]],
  mono: [[0, 0, 0], [136, 136, 136], [255, 255, 255]],
  acid: [[3, 16, 7], [125, 255, 46], [255, 46, 196]],
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mix3(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

// Posterize + gradient-map one panel's pixels in place.
export function gradePixels(img, grade, strength) {
  const stops = GRADE_STOPS[grade] || GRADE_STOPS.sunset;
  const d = img.data;
  const s = Math.max(0, Math.min(1, strength));
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const step = Math.floor(lum * 6) / 5; // 6 posterize levels
    let graded;
    if (grade === 'mono') {
      const v = step * 255;
      graded = [v, v, v];
    } else if (step < 0.5) {
      graded = mix3(stops[0], stops[1], step * 2);
    } else {
      graded = mix3(stops[1], stops[2], (step - 0.5) * 2);
    }
    d[i] = lerp(r, graded[0], s);
    d[i + 1] = lerp(g, graded[1], s);
    d[i + 2] = lerp(b, graded[2], s);
  }
  return img;
}

function addGrain(ctx, w, h, seed, amount) {
  const rnd = mulberry32(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 2 * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function addHalftone(ctx, w, h) {
  const gap = 7;
  for (let y = gap / 2; y < h; y += gap) {
    for (let x = gap / 2; x < w; x += gap) {
      const px = ctx.getImageData(x, y, 1, 1).data;
      const lum = (px[0] + px[1] + px[2]) / 3 / 255;
      const rad = (1 - lum) * 2.4;
      if (rad < 0.4) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function addVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Panel rectangles for a layout: {x, y, w, h, clip?} in art-zone coords.
export function panelRects(layout, W, artH) {
  const g = Math.max(3, Math.round(W * 0.008)); // gutter
  switch (layout) {
    case 'five': return [
      { x: 0, y: 0, w: W * 0.55 - g, h: artH * 0.62 - g },
      { x: W * 0.55, y: 0, w: W * 0.45, h: artH * 0.62 - g },
      { x: 0, y: artH * 0.62, w: W / 3 - g, h: artH * 0.38 },
      { x: W / 3, y: artH * 0.62, w: W / 3 - g, h: artH * 0.38 },
      { x: (W / 3) * 2, y: artH * 0.62, w: W / 3, h: artH * 0.38 },
    ];
    case 'nine': {
      const cw = W / 3, ch = artH / 3, out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        out.push({ x: c * cw + (c ? g / 2 : 0), y: r * ch + (r ? g / 2 : 0), w: cw - (c < 2 ? g / 2 : 0) - (c ? g / 2 : 0), h: ch - (r < 2 ? g / 2 : 0) - (r ? g / 2 : 0) });
      }
      return out;
    }
    case 'duo': return [
      { x: 0, y: 0, w: W / 2 - g, h: artH },
      { x: W / 2, y: 0, w: W / 2, h: artH },
    ];
    case 'trio': return [
      { x: 0, y: 0, w: W / 3 - g, h: artH },
      { x: W / 3, y: 0, w: W / 3 - g, h: artH },
      { x: (W / 3) * 2, y: 0, w: W / 3, h: artH },
    ];
    case 'solo': return [{ x: 0, y: 0, w: W, h: artH }];
    case 'diagonal':
    default: return [
      { x: 0, y: 0, w: W * 0.64, h: artH, diagonal: true },
      { x: W * 0.66, y: 0, w: W * 0.34, h: artH * 0.48 - g },
      { x: W * 0.66, y: artH * 0.48, w: W * 0.34, h: artH * 0.52 },
    ];
  }
}

function drawPhotoCover(ctx, photo, rect, zoom, panX, panY, flip) {
  const pw = photo.naturalWidth || photo.width;
  const ph = photo.naturalHeight || photo.height;
  if (!pw || !ph) return;
  const scale = Math.max(rect.w / pw, rect.h / ph) * (zoom || 1);
  const dw = pw * scale, dh = ph * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (panX || 0) * rect.w * 0.2;
  const dy = rect.y + (rect.h - dh) / 2 + (panY || 0) * rect.h * 0.2;
  ctx.save();
  ctx.beginPath();
  if (rect.diagonal) {
    ctx.moveTo(rect.x, rect.y);
    ctx.lineTo(rect.x + rect.w, rect.y);
    ctx.lineTo(rect.x + rect.w * 0.82, rect.y + rect.h);
    ctx.lineTo(rect.x, rect.y + rect.h);
    ctx.closePath();
  } else {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.clip();
  if (flip) {
    ctx.translate(rect.x + rect.w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(rect.x + rect.w / 2), 0);
  }
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

// Retro striped sun: a disc with horizontal slats punched out of its lower half.
function drawSun(ctx, cx, cy, r) {
  const off = document.createElement('canvas');
  off.width = off.height = Math.ceil(r * 2 + 4);
  const o = off.getContext('2d');
  const g = o.createLinearGradient(0, 0, 0, off.height);
  g.addColorStop(0, '#ffe98a');
  g.addColorStop(0.55, '#ff9a3d');
  g.addColorStop(1, '#ff4d6d');
  o.fillStyle = g;
  o.beginPath();
  o.arc(off.width / 2, off.height / 2, r, 0, Math.PI * 2);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  let y = off.height / 2 + r * 0.08;
  let gap = r * 0.07;
  while (y < off.height) {
    o.fillRect(0, y, off.width, gap);
    y += gap + r * 0.16;
    gap *= 1.25;
  }
  ctx.drawImage(off, cx - off.width / 2, cy - off.height / 2);
}

function drawPalm(ctx, x, y, h, lean) {
  const topX = x + lean * h;
  const topY = y - h;
  ctx.strokeStyle = '#12081f';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, h * 0.055);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * h * 0.4, y - h * 0.6, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, h * 0.022);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.12 + (i / 6) * 0.76);
    const len = h * (0.42 + (i % 3) * 0.07);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + len * 0.22;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY - h * 0.08, ex, ey);
    ctx.stroke();
  }
}

function fitTitle(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  }
  return size;
}

// The cover. opts: photos[], panelPhotos[], zooms[], pans[], flips[],
// layout, grade, gradeStrength, title, subtitle, badge, footer.
export function drawCover(ctx, W, H, o) {
  const artH = Math.round(H * 0.735);
  const bandY = artH;
  const bandH = H - artH;
  ctx.clearRect(0, 0, W, H);

  // Sky backdrop behind the panels.
  const sky = ctx.createLinearGradient(0, 0, 0, artH);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.55, '#ff7e5f');
  sky.addColorStop(1, '#feb47b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, artH);

  const rects = panelRects(o.layout || 'diagonal', W, artH);
  const photos = o.photos || [];
  const work = document.createElement('canvas');
  const wctx = work.getContext('2d', { willReadFrequently: true });

  rects.forEach((rect, i) => {
    const photo = photos[(o.panelPhotos && o.panelPhotos[i]) ?? (i % Math.max(1, photos.length))] || photos[0];
    if (!photo) return;
    work.width = Math.max(2, Math.round(rect.w));
    work.height = Math.max(2, Math.round(rect.h));
    wctx.clearRect(0, 0, work.width, work.height);
    drawPhotoCover(wctx, photo, { x: 0, y: 0, w: work.width, h: work.height, diagonal: rect.diagonal },
      (o.zooms && o.zooms[i]) || 1, (o.pans && o.pans[i] && o.pans[i][0]) || 0,
      (o.pans && o.pans[i] && o.pans[i][1]) || 0, (o.flips && o.flips[i]) || false);
    const img = wctx.getImageData(0, 0, work.width, work.height);
    gradePixels(img, o.grade || 'sunset', o.gradeStrength ?? 0.55);
    wctx.putImageData(img, 0, 0);
    addGrain(wctx, work.width, work.height, 1000 + i * 77, 7);
    if (rect.w > 200) addHalftone(wctx, work.width, work.height);
    ctx.save();
    ctx.beginPath();
    if (rect.diagonal) {
      ctx.moveTo(rect.x, rect.y);
      ctx.lineTo(rect.x + rect.w, rect.y);
      ctx.lineTo(rect.x + rect.w * 0.82, rect.y + rect.h);
      ctx.lineTo(rect.x, rect.y + rect.h);
      ctx.closePath();
    } else {
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.clip();
    ctx.drawImage(work, rect.x, rect.y);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  });

  // Vector overlays: striped sun top-left of the sky, small palms in corners.
  // The sun is kept small and tight to the corner so it never sits on a face.
  const sunR = Math.round(Math.min(W, H) * 0.07);
  drawSun(ctx, Math.round(W * 0.08), Math.round(artH * 0.12), sunR);
  const palmH = Math.round(H * 0.10);
  drawPalm(ctx, Math.round(W * 0.03), artH - 2, palmH, 0.25);
  drawPalm(ctx, Math.round(W * 0.97), artH - 2, Math.round(palmH * 0.85), -0.3);

  // Title band.
  const band = ctx.createLinearGradient(0, bandY, 0, H);
  band.addColorStop(0, '#12081f');
  band.addColorStop(1, '#1d0b33');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, bandH);
  ctx.fillStyle = '#ff4d6d';
  ctx.fillRect(0, bandY, W, Math.max(3, bandH * 0.03));

  const title = (o.title || 'SUNSET HEIST').toUpperCase();
  const tSize = fitTitle(ctx, title, W * 0.9, Math.round(bandH * 0.52));
  const tg = ctx.createLinearGradient(0, bandY + bandH * 0.14, 0, bandY + bandH * 0.62);
  tg.addColorStop(0, '#fff7d6');
  tg.addColorStop(0.5, '#ffb347');
  tg.addColorStop(1, '#ff5e62');
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.font = `${tSize}px Anton, "Arial Black", sans-serif`;
  ctx.strokeStyle = '#0d0518';
  ctx.lineWidth = Math.max(3, tSize * 0.09);
  ctx.strokeText(title, W / 2, bandY + bandH * 0.36);
  ctx.fillStyle = tg;
  ctx.fillText(title, W / 2, bandY + bandH * 0.36);

  const sub = o.subtitle || 'LEONIDA HEAT';
  ctx.font = `${Math.max(10, Math.round(bandH * 0.13))}px Anton, "Arial Black", sans-serif`;
  ctx.fillStyle = '#e8e4ff';
  ctx.fillText(sub.toUpperCase(), W / 2, bandY + bandH * 0.74);

  const badge = o.badge || 'GTA VI';
  const bSize = Math.max(10, Math.round(bandH * 0.11));
  ctx.font = `${bSize}px Anton, "Arial Black", sans-serif`;
  const bw = ctx.measureText(badge).width + bSize * 1.6;
  // The badge rides on the subtitle row at the right edge — never on the
  // title row, where it used to clip the title's last letter on square
  // and portrait covers.
  const bx = W - bw - W * 0.03, by = bandY + bandH * 0.74 - bSize * 0.85;
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bSize * 1.7, bSize * 0.85);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(badge, bx + bw / 2, by + bSize * 0.88);

  const foot = o.footer || 'VICE CITY • LEONIDA';
  ctx.font = `${Math.max(9, Math.round(bandH * 0.09))}px Anton, "Arial Black", sans-serif`;
  ctx.fillStyle = 'rgba(232,228,255,0.75)';
  ctx.fillText(foot.toUpperCase(), W / 2, bandY + bandH * 0.93);

  addVignette(ctx, W, H);
}
