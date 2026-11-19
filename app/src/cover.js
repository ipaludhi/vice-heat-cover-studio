// LEONIDA HEAT — the cover renderer.
// Draws a GTA-style multi-panel poster cover onto any 2D canvas at any size.
// Pure rendering: no network, no Date, no Math.random in the pixel path —
// grain uses a fixed-seed generator, so the same state renders byte-identical
// PNGs every time (export determinism).

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
  ink: 'Mono Ink',
  acid: 'Acid Vice',
};

// Per-grade pixel curves: per-channel gain / gamma / lift, saturation, posterize levels.
const GRADE_CURVES = {
  sunset: { gain: [1.12, 1.0, 0.82], gamma: [1.0, 0.95, 1.05], lift: [0, 0, 0], sat: 1.25, levels: 6 },
  neon: { gain: [1.05, 0.95, 1.25], gamma: [0.95, 1.0, 0.9], lift: [0.02, 0, 0.03], sat: 1.45, levels: 5 },
  dusk: { gain: [1.08, 0.88, 1.18], gamma: [1.0, 1.05, 0.95], lift: [0, 0, 0], sat: 1.15, levels: 6 },
  ocean: { gain: [1.05, 1.12, 1.12], gamma: [1.0, 0.95, 0.95], lift: [0, 0, 0], sat: 1.3, levels: 6 },
  ink: { gain: [1.15, 1.15, 1.15], gamma: [0.9, 0.9, 0.9], lift: [0, 0, 0], sat: 0.12, levels: 4 },
  acid: { gain: [1.0, 1.28, 0.9], gamma: [1.0, 0.9, 1.05], lift: [0, 0, 0], sat: 1.5, levels: 5 },
};

const SKY_STOPS = {
  sunset: ['#2b0f3d', '#7a1e6e', '#e84393', '#ff7a3d', '#ffc46b'],
  neon: ['#0b0620', '#2a0a5e', '#7b2ff7', '#ff2fb3', '#37f6ff'],
  dusk: ['#160b2e', '#3b1d5e', '#7c3aed', '#c084fc', '#f0abfc'],
  ocean: ['#062a33', '#0e5a6d', '#14b8a6', '#5eead4', '#fb923c'],
  ink: ['#0a0a0a', '#262626', '#525252', '#a3a3a3', '#e5e5e5'],
  acid: ['#0c1a06', '#1a3a0e', '#4d7c0f', '#a3e635', '#22d3ee'],
};

const TITLE_STOPS = {
  sunset: ['#fff7d6', '#ffb347', '#ff5e7a', '#ff2e88'],
  neon: ['#e8fbff', '#37f6ff', '#ff4fd8'],
  dusk: ['#ffe9c9', '#c084fc', '#7c3aed'],
  ocean: ['#eafffb', '#5eead4', '#fb923c'],
  ink: ['#ffffff', '#d4d4d4', '#9ca3af'],
  acid: ['#f7fee7', '#a3e635', '#22d3ee'],
};

/** Fixed-seed PRNG (mulberry32) so grain is identical on every render. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Default state: one fresh cover, ready to render. */
export function defaultCoverState() {
  return {
    layout: 'diagonal',
    grade: 'sunset',
    gradeStrength: 1,
    title: 'SUNSET HEIST',
    subtitle: 'a Leonida story',
    badge: 'LEONIDA',
    footer: 'VICE CITY • EST. 2026',
    halftone: true,
    grain: true,
    photos: [null, null, null, null],
    panels: [],
  };
}

/** Panel geometry for a layout, in fractions of the panel area. */
export function layoutPanels(layout, areaW, areaH) {
  const P = (x, y, w, h, rot, slot) => ({ x, y, w, h, rot, slot });
  switch (layout) {
    case 'diagonal':
      return [
        P(0, 0, 0.62, 1, -4, 0),
        P(0.63, 0, 0.37, 0.47, 3, 1),
        P(0.63, 0.49, 0.37, 0.26, -2, 0),
        P(0.63, 0.77, 0.37, 0.23, 3, 1),
      ];
    case 'five':
      return [
        P(0, 0, 1, 0.54, -1.5, 0),
        P(0, 0.56, 0.245, 0.44, -2, 1),
        P(0.252, 0.56, 0.245, 0.44, 2, 0),
        P(0.504, 0.56, 0.245, 0.44, -2, 1),
        P(0.756, 0.56, 0.244, 0.44, 2, 0),
      ];
    case 'nine':
      return [0, 1, 2].flatMap((r) =>
        [0, 1, 2].map((c) => P(c * 0.337, r * 0.337, 0.326, 0.326, 0, (r + c) % 2)),
      );
    case 'duo':
      return [P(0, 0, 0.495, 1, -2, 0), P(0.505, 0, 0.495, 1, 2, 1)];
    case 'trio':
      return [
        P(0, 0, 0.328, 1, -2, 0),
        P(0.336, 0, 0.328, 1, 2, 1),
        P(0.672, 0, 0.328, 1, -2, 0),
      ];
    case 'solo':
    default:
      return [P(0, 0, 1, 1, 0, 0)];
  }
}

/** Reset per-panel photo/zoom state when the layout changes, keeping photos. */
export function resetPanelsForLayout(state) {
  const count = layoutPanels(state.layout, 1, 1).length;
  state.panels = Array.from({ length: count }, (_, i) => ({
    photo: i === 0 ? 0 : i % 2,
    zoom: 1,
    ox: 0,
    oy: i === 0 ? 0.3 : 0,
    flip: false,
  }));
}

/** Apply a grade's pixel curves to ImageData in place (posterize + duotone push). */
export function applyGradePixels(imageData, grade, strength) {
  const curve = GRADE_CURVES[grade] || GRADE_CURVES.sunset;
  const d = imageData.data;
  const levels = curve.levels;
  const luts = [0, 1, 2].map((ch) => {
    const lut = new Uint8Array(256);
    for (let v = 0; v < 256; v++) {
      let n = Math.pow(v / 255, curve.gamma[ch]) * curve.gain[ch] + curve.lift[ch];
      n = Math.max(0, Math.min(1, n));
      const post = Math.round(n * (levels - 1)) / (levels - 1);
      lut[v] = Math.round(post * 255);
    }
    return lut;
  });
  for (let i = 0; i < d.length; i += 4) {
    const r0 = d[i]; const g0 = d[i + 1]; const b0 = d[i + 2];
    let r = luts[0][r0]; let g = luts[1][g0]; let b = luts[2][b0];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * curve.sat;
    g = gray + (g - gray) * curve.sat;
    b = gray + (b - gray) * curve.sat;
    d[i] = Math.max(0, Math.min(255, r0 + (r - r0) * strength));
    d[i + 1] = Math.max(0, Math.min(255, g0 + (g - g0) * strength));
    d[i + 2] = Math.max(0, Math.min(255, b0 + (b - b0) * strength));
  }
  return imageData;
}

/** Print halftone dot texture over a panel, clipped to its rect. */
export function drawHalftoneDots(ctx, x, y, w, h) {
  const step = Math.max(6, Math.round(w / 140));
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#14081f';
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      ctx.beginPath();
      ctx.arc(xx, yy, Math.max(0.8, step * 0.18), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Film grain speckles, fixed seed so exports are deterministic. */
export function drawGrainSpeckles(ctx, x, y, w, h, seed) {
  const rand = seededRandom(seed);
  const count = Math.floor((w * h) / 2600);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const px = x + rand() * w;
    const py = y + rand() * h;
    ctx.globalAlpha = 0.04 + rand() * 0.06;
    ctx.fillStyle = rand() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(px, py, 1.6, 1.6);
  }
  ctx.restore();
}

/** One palm silhouette, drawn with bezier fronds — original vector art. */
export function drawPalmSilhouette(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = '#160a1c';
  ctx.fillStyle = '#160a1c';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(10, -60, 4, -110);
  ctx.stroke();
  const frondAngles = [-160, -122, -90, -58, -20];
  frondAngles.forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const len = 58 - Math.abs(i - 2) * 6;
    const tx = 4 + Math.cos(a) * len;
    const ty = -110 + Math.sin(a) * len * 0.6;
    ctx.beginPath();
    ctx.moveTo(4, -110);
    ctx.quadraticCurveTo(4 + Math.cos(a) * len * 0.55, -110 + Math.sin(a) * len * 0.3 - 16, tx, ty + 14);
    ctx.stroke();
  });
  ctx.restore();
}

/** Sunset sky band with a striped retro sun, palms and birds. */
export function drawSkyBand(ctx, x, y, w, h, grade) {
  const stops = SKY_STOPS[grade] || SKY_STOPS.sunset;
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  stops.forEach((c, i) => sky.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  const sunR = h * 0.42;
  const sunX = x + w * 0.5;
  const sunY = y + h * 0.52;
  const sun = ctx.createRadialGradient(sunX, sunY, sunR * 0.1, sunX, sunY, sunR);
  sun.addColorStop(0, '#fff3c4');
  sun.addColorStop(0.55, '#ffb347');
  sun.addColorStop(1, '#ff5e7a');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = sky;
  for (let i = 0; i < 3; i++) {
    const sy = sunY + sunR * (0.08 + i * 0.22);
    ctx.fillRect(sunX - sunR, sy, sunR * 2, sunR * 0.07);
  }
  const s = h / 170;
  drawPalmSilhouette(ctx, x + w * 0.06, y + h, s * 1.0, -0.08);
  drawPalmSilhouette(ctx, x + w * 0.94, y + h, s * 0.85, 0.1);
  ctx.strokeStyle = 'rgba(20,8,28,0.85)';
  ctx.lineWidth = Math.max(1.5, h * 0.008);
  [[0.2, 0.2], [0.27, 0.14], [0.78, 0.18]].forEach(([fx, fy]) => {
    const bx = x + w * fx; const by = y + h * fy; const bw = w * 0.02;
    ctx.beginPath();
    ctx.moveTo(bx - bw, by);
    ctx.quadraticCurveTo(bx - bw * 0.4, by - bw * 0.7, bx, by);
    ctx.quadraticCurveTo(bx + bw * 0.4, by - bw * 0.7, bx + bw, by);
    ctx.stroke();
  });
}

/** Big gradient title with a hard black outline and offset shadow. */
export function drawTitleLettering(ctx, x, y, w, h, state) {
  const text = (state.title || '').trim().toUpperCase();
  if (!text) return;
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  const stops = TITLE_STOPS[state.grade] || TITLE_STOPS.sunset;
  stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
  let size = h;
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  while (ctx.measureText(text).width > w * 0.96 && size > 10) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(10,4,18,0.55)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = size * 0.06;
  ctx.shadowOffsetY = size * 0.06;
  ctx.strokeStyle = '#14081f';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeText(text, x + w / 2, y + h / 2);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = grad;
  ctx.fillText(text, x + w / 2, y + h / 2);
}

/**
 * Render the whole cover onto `canvas` at its own pixel size.
 * Returns the drawn panels in canvas coordinates (for editor hit-testing).
 */
export function renderCover(canvas, state, gradeOverride) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = gradeOverride || state.grade;
  const g = Math.round(W * 0.012);
  ctx.fillStyle = '#f7f3ea';
  ctx.fillRect(0, 0, W, H);

  const panelArea = { x: g, y: g, w: W - 2 * g, h: H * 0.68 };
  const bandY = g + panelArea.h + g;
  const bandH = H - bandY - g;

  // Sky band first (behind the title), so panels can overlap its top edge.
  drawSkyBand(ctx, g, bandY, W - 2 * g, bandH, grade);

  const panels = layoutPanels(state.layout, panelArea.w, panelArea.h);
  if (!state.panels || state.panels.length !== panels.length) resetPanelsForLayout(state);
  const drawn = [];
  const off = document.createElement('canvas');
  panels.forEach((panel, i) => {
    const ps = state.panels[i];
    const photo = state.photos[ps.photo] || null;
    const pw = Math.round(panel.w * panelArea.w * 1.09);
    const ph = Math.round(panel.h * panelArea.h * 1.09);
    off.width = Math.max(2, Math.min(900, pw));
    off.height = Math.max(2, Math.min(900, ph));
    const octx = off.getContext('2d');
    octx.fillStyle = '#241633';
    octx.fillRect(0, 0, off.width, off.height);
    if (photo) {
      const iw = photo.naturalWidth || photo.width;
      const ih = photo.naturalHeight || photo.height;
      const base = Math.max(off.width / iw, off.height / ih) * (ps.zoom || 1);
      const dw = iw * base;
      const dh = ih * base;
      octx.save();
      if (ps.flip) { octx.translate(off.width, 0); octx.scale(-1, 1); }
      octx.drawImage(photo, (off.width - dw) / 2 + (ps.ox || 0) * off.width * 0.4, (off.height - dh) / 2 + (ps.oy || 0) * off.height * 0.4, dw, dh);
      octx.restore();
      const img = octx.getImageData(0, 0, off.width, off.height);
      applyGradePixels(img, grade, state.gradeStrength);
      octx.putImageData(img, 0, 0);
    }
    if (state.halftone) drawHalftoneDots(octx, 0, 0, off.width, off.height);
    if (state.grain) drawGrainSpeckles(octx, 0, 0, off.width, off.height, 12345 + i * 777);
    const vig = octx.createRadialGradient(off.width / 2, off.height / 2, Math.min(off.width, off.height) * 0.35, off.width / 2, off.height / 2, Math.max(off.width, off.height) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.28)');
    octx.fillStyle = vig;
    octx.fillRect(0, 0, off.width, off.height);

    const px = panelArea.x + panel.x * panelArea.w;
    const py = panelArea.y + panel.y * panelArea.h;
    const pw2 = panel.w * panelArea.w;
    const ph2 = panel.h * panelArea.h;
    ctx.save();
    ctx.translate(px + pw2 / 2, py + ph2 / 2);
    ctx.rotate((panel.rot * Math.PI) / 180);
    ctx.drawImage(off, -pw2 * 1.09 / 2, -ph2 * 1.09 / 2, pw2 * 1.09, ph2 * 1.09);
    ctx.strokeStyle = 'rgba(20,8,28,0.35)';
    ctx.lineWidth = Math.max(1, W * 0.0015);
    ctx.strokeRect(-pw2 * 1.09 / 2, -ph2 * 1.09 / 2, pw2 * 1.09, ph2 * 1.09);
    ctx.restore();
    drawn.push({ x: px, y: py, w: pw2, h: ph2, rot: panel.rot, index: i });
  });

  // Badge pill, top-left over the panels.
  const badge = (state.badge || '').trim().toUpperCase();
  if (badge) {
    ctx.save();
    ctx.font = `bold ${Math.max(11, H * 0.016)}px system-ui, sans-serif`;
    const bw = ctx.measureText(badge).width + H * 0.035;
    const bh = H * 0.032;
    const bx = g + W * 0.012;
    const by = g + H * 0.012;
    ctx.fillStyle = 'rgba(16,6,24,0.92)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ ' + badge, bx + H * 0.014, by + bh / 2 + 1);
    ctx.restore();
  }

  // Subtitle script line, then the giant title, inside the sky band.
  const sub = (state.subtitle || '').trim();
  if (sub) {
    ctx.save();
    ctx.font = `italic bold ${Math.max(12, bandH * 0.12)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffe9a8';
    ctx.shadowColor = 'rgba(10,4,18,0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText(sub, W / 2, bandY + bandH * 0.13);
    ctx.restore();
  }
  drawTitleLettering(ctx, g, bandY + bandH * 0.3, W - 2 * g, bandH * 0.52, { ...state, grade });

  // Footer strap along the very bottom.
  const foot = (state.footer || '').trim().toUpperCase();
  if (foot) {
    ctx.save();
    ctx.font = `bold ${Math.max(10, H * 0.013)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(foot.split('').join(' '), W / 2, H - g - bandH * 0.04);
    ctx.restore();
  }
  return drawn;
}
