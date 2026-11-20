// LEONIDA HEAT — editor (round 4, written fresh).
//
// Wires the preview canvas, the photo strip, layout/grade chips, caption
// inputs and the PNG exporters to the cover engine in cover.js. Also
// handles the headless shot modes (?shot=cover / ?shot=editor) that
// shots.js drives: ?shot=cover draws one cover full-frame at the size the
// query asks for, with no editor chrome around it.

import { drawCover, panelRects, LAYOUTS, GRADES } from './cover.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const SAMPLES = ['samples/pier.jpg', 'samples/boulevard.jpg'];

const state = {
  photos: [],          // HTMLImageElement[]
  photoNames: [],
  panelPhotos: [0, 1, 0, 1, 0, 1, 0, 1, 0],
  zooms: [1, 1, 1, 1, 1, 1, 1, 1, 1],
  pans: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
  flips: [false, false, false, false, false, false, false, false, false],
  layout: 'diagonal',
  grade: 'sunset',
  gradeStrength: 0.55,
  title: 'SUNSET HEIST',
  subtitle: 'LEONIDA HEAT',
  badge: 'GTA VI',
  footer: 'VICE CITY • LEONIDA',
  selected: 0,
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

function currentOpts() {
  return {
    photos: state.photos,
    panelPhotos: state.panelPhotos,
    zooms: state.zooms,
    pans: state.pans,
    flips: state.flips,
    layout: state.layout,
    grade: state.grade,
    gradeStrength: state.gradeStrength,
    title: state.title,
    subtitle: state.subtitle,
    badge: state.badge,
    footer: state.footer,
  };
}

const preview = $('preview');
const pctx = preview.getContext('2d');

function renderPreview() {
  if (!state.photos.length) return;
  const W = preview.width, H = preview.height;
  drawCover(pctx, W, H, currentOpts());
}

function renderExport(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawCover(c.getContext('2d'), w, h, currentOpts());
  return c;
}

function download(canvas, name) {
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
}

function exportSize(w, h, tag) {
  download(renderExport(w, h), `leonida-heat-${slug(state.title)}-${tag}.png`);
}

// ---- shot mode (headless) ----
async function shotMode() {
  const shot = params.get('shot');
  if (shot !== 'cover') return false;
  await loadSamples();
  const size = (params.get('size') || '1280x720').split('x');
  const W = parseInt(size[0], 10) || 1280;
  const H = parseInt(size[1], 10) || 720;
  state.layout = params.get('layout') || state.layout;
  state.grade = params.get('grade') || state.grade;
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  c.style.display = 'block';
  document.body.appendChild(c);
  drawCover(c.getContext('2d'), W, H, currentOpts());
  document.title = 'shot-ready';
  return true;
}

async function loadSamples() {
  if (state.photos.length) return;
  for (const src of SAMPLES) {
    try {
      const img = await loadImage(src);
      state.photos.push(img);
      state.photoNames.push(src.split('/').pop());
    } catch (e) { /* sample missing: editor still works with uploads */ }
  }
}

// ---- editor UI ----
function buildChips() {
  const lc = $('layout-chips');
  Object.entries(LAYOUTS).forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.layout = key;
    b.classList.toggle('on', key === state.layout);
    b.onclick = () => {
      state.layout = key;
      state.selected = 0;
      buildChips(); syncPanelCard(); renderPreview();
    };
    lc.appendChild(b);
  });
  const gc = $('grade-chips');
  Object.entries(GRADES).forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.grade = key;
    b.classList.toggle('on', key === state.grade);
    b.onclick = () => {
      state.grade = key;
      buildChips(); renderPreview();
    };
    gc.appendChild(b);
  });
}

function buildPhotoStrip() {
  const strip = $('photo-strip');
  strip.innerHTML = '';
  state.photos.forEach((img, i) => {
    const el = document.createElement('img');
    el.src = img.src;
    el.alt = state.photoNames[i] || `photo ${i + 1}`;
    el.classList.toggle('on', state.panelPhotos[state.selected] === i);
    el.onclick = () => {
      state.panelPhotos[state.selected] = i;
      buildPhotoStrip(); syncPanelCard(); renderPreview();
    };
    strip.appendChild(el);
  });
  const sel = $('panel-photo');
  sel.innerHTML = '';
  state.photos.forEach((img, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = state.photoNames[i] || `Photo ${i + 1}`;
    sel.appendChild(opt);
  });
  sel.value = String(state.panelPhotos[state.selected] ?? 0);
}

function syncPanelCard() {
  const i = state.selected;
  $('panel-name').textContent = String(i + 1);
  $('panel-photo').value = String(state.panelPhotos[i] ?? 0);
  $('panel-zoom').value = String(Math.round((state.zooms[i] || 1) * 100));
  $('zoom-val').textContent = `${Math.round((state.zooms[i] || 1) * 100)}%`;
  $('panel-flip').checked = !!state.flips[i];
  buildPhotoStrip();
}

function wireEditor() {
  $('photo-input').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      if (state.photos.length >= 4) break;
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        state.photos.push(img);
        state.photoNames.push(file.name);
      } catch { /* skip unreadable files */ }
    }
    buildPhotoStrip(); renderPreview();
  });

  $('grade-strength').addEventListener('input', (e) => {
    state.gradeStrength = Number(e.target.value) / 100;
    $('strength-val').textContent = `${e.target.value}%`;
    renderPreview();
  });
  const bindText = (id, key) => {
    $(id).addEventListener('input', (e) => { state[key] = e.target.value; renderPreview(); });
  };
  bindText('in-title', 'title');
  bindText('in-subtitle', 'subtitle');
  bindText('in-badge', 'badge');
  bindText('in-footer', 'footer');

  $('panel-photo').addEventListener('change', (e) => {
    state.panelPhotos[state.selected] = Number(e.target.value);
    buildPhotoStrip(); renderPreview();
  });
  $('panel-zoom').addEventListener('input', (e) => {
    state.zooms[state.selected] = Number(e.target.value) / 100;
    $('zoom-val').textContent = `${e.target.value}%`;
    renderPreview();
  });
  $('panel-flip').addEventListener('change', (e) => {
    state.flips[state.selected] = e.target.checked;
    renderPreview();
  });

  const preset = (layout, grade, strength) => () => {
    state.layout = layout; state.grade = grade; state.gradeStrength = strength;
    $('grade-strength').value = String(Math.round(strength * 100));
    $('strength-val').textContent = `${Math.round(strength * 100)}%`;
    buildChips(); renderPreview();
  };
  $('preset-sunset').onclick = preset('diagonal', 'sunset', 0.55);
  $('preset-neon').onclick = preset('five', 'neon', 0.6);
  $('preset-noir').onclick = preset('solo', 'mono', 0.7);

  $('export-square').onclick = () => exportSize(1080, 1080, '1080x1080');
  $('export-portrait').onclick = () => exportSize(1080, 1350, '1080x1350');
  $('export-wide').onclick = () => exportSize(1920, 1080, '1920x1080');
  $('export-all').onclick = () => {
    exportSize(1080, 1080, '1080x1080');
    setTimeout(() => exportSize(1080, 1350, '1080x1350'), 300);
    setTimeout(() => exportSize(1920, 1080, '1920x1080'), 600);
  };

  // Click a panel to select it; drag to pan its photo; wheel to zoom.
  let drag = null;
  preview.addEventListener('pointerdown', (e) => {
    const r = preview.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * preview.width;
    const y = (e.clientY - r.top) / r.height * preview.height;
    const artH = preview.height * 0.735;
    const rects = panelRects(state.layout, preview.width, artH);
    const idx = rects.findIndex((rc) => x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h);
    state.selected = idx >= 0 ? idx : 0;
    drag = { x, y, px: state.pans[state.selected][0], py: state.pans[state.selected][1] };
    syncPanelCard();
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = preview.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * preview.width;
    const y = (e.clientY - r.top) / r.height * preview.height;
    const i = state.selected;
    state.pans[i] = [
      Math.max(-1, Math.min(1, drag.px + (x - drag.x) / preview.width * 2)),
      Math.max(-1, Math.min(1, drag.py + (y - drag.y) / preview.height * 2)),
    ];
    renderPreview();
  });
  preview.addEventListener('pointerup', () => { drag = null; });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const i = state.selected;
    const z = Math.max(1, Math.min(2.2, (state.zooms[i] || 1) - Math.sign(e.deltaY) * 0.08));
    state.zooms[i] = z;
    $('panel-zoom').value = String(Math.round(z * 100));
    $('zoom-val').textContent = `${Math.round(z * 100)}%`;
    renderPreview();
  }, { passive: false });
}

// ---- boot ----
(async () => {
  if (await shotMode()) return;
  await loadSamples();
  buildChips();
  buildPhotoStrip();
  syncPanelCard();
  wireEditor();
  renderPreview();
})();
