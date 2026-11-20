// LEONIDA HEAT — editor + export logic (round 3, written fresh).
// Loads photos, drives the live preview, exports PNG covers in the three
// post sizes, and renders the ?shot=cover scene the screenshot driver
// captures. All state lives in this file; the drawing lives in cover.js.

import { GRADES, LAYOUTS, LAYOUT_LABELS, layoutPanels, renderCover, BAND_TOP } from './cover.js';

const SAMPLES = ['samples/pier.jpg', 'samples/boulevard.jpg'];

const PRESETS = {
  golden: { layout: 'diagonal', grade: 'sunset', strength: 0.55, title: 'SUNSET HEIST', subtitle: 'LEONIDA • VICE CITY', badge: 'GTA VI', footer: 'A LEONIDA HEAT COVER' },
  neon: { layout: 'five', grade: 'neon', strength: 0.6, title: 'NEON NIGHTS', subtitle: 'OCEAN DRIVE • 2 AM', badge: 'VICE CITY', footer: 'A LEONIDA HEAT COVER' },
  dusk: { layout: 'nine', grade: 'dusk', strength: 0.5, title: 'PALM DUSK', subtitle: 'THE KEYS • GOLDEN HOUR', badge: 'EST. 2026', footer: 'A LEONIDA HEAT COVER' },
};

const EXPORT_SIZES = [
  { name: 'square', w: 1080, h: 1080, label: '1080 × 1080' },
  { name: 'portrait', w: 1080, h: 1350, label: '1080 × 1350' },
  { name: 'wide', w: 1920, h: 1080, label: '1920 × 1080' },
];

const state = {
  layout: 'diagonal',
  grade: 'sunset',
  strength: 0.55,
  title: 'SUNSET HEIST',
  subtitle: 'LEONIDA • VICE CITY',
  badge: 'GTA VI',
  footer: 'A LEONIDA HEAT COVER',
  photos: [],          // loaded HTMLImageElements
  panels: [],         // per-panel { photo, zoom, panX, panY, flip }
  activePanel: 0,
};

let previewCanvas = null;
let previewCtx = null;

function $(id) { return document.getElementById(id); }

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + src));
    img.src = src;
  });
}

async function loadSamples() {
  const loaded = [];
  for (const src of SAMPLES) {
    try {
      loaded.push(await loadImage(src));
    } catch (e) {
      console.warn('sample failed:', src, e);
    }
  }
  return loaded;
}

function defaultPanels(count) {
  const panels = [];
  for (let i = 0; i < count; i++) {
    panels.push({ photo: i % Math.max(1, state.photos.length), zoom: 1, panX: 0, panY: 0, flip: false });
  }
  return panels;
}

function ensurePanels() {
  const artH = 900 * BAND_TOP;
  const need = layoutPanels(state.layout, 900, Math.round(artH)).length;
  while (state.panels.length < need) {
    state.panels.push({ photo: state.panels.length % Math.max(1, state.photos.length), zoom: 1, panX: 0, panY: 0, flip: false });
  }
  state.panels.length = need;
  if (state.activePanel >= need) state.activePanel = 0;
}

function drawPreview() {
  if (!previewCanvas) return;
  const size = 900;
  previewCanvas.width = size;
  previewCanvas.height = size;
  ensurePanels();
  renderCover(previewCanvas, state.photos, {
    layout: state.layout, grade: state.grade, strength: state.strength,
    title: state.title, subtitle: state.subtitle, badge: state.badge,
    footer: state.footer, panels: state.panels,
  });
  syncPanelControls();
}

// In shot-cover mode the export canvas is already final; a resize after
// boot must not redraw it as the square editor preview.
function render() {
  if (document.body.classList.contains('shot-cover')) return;
  drawPreview();
}

function chipRow(el, items, current, onPick) {
  el.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (item.value === current ? ' on' : '');
    b.textContent = item.label;
    b.addEventListener('click', () => onPick(item.value));
    el.appendChild(b);
  });
}

function syncChips() {
  chipRow($('layoutChips'), LAYOUTS.map((v) => ({ value: v, label: LAYOUT_LABELS[v] })), state.layout, (v) => {
    state.layout = v; render(); syncChips();
  });
  chipRow($('gradeChips'), Object.keys(GRADES).map((v) => ({ value: v, label: GRADES[v].label })), state.grade, (v) => {
    state.grade = v; render(); syncChips();
  });
  chipRow($('presetChips'), Object.keys(PRESETS).map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })), '', (v) => {
    Object.assign(state, PRESETS[v]);
    $('titleInput').value = state.title;
    $('subtitleInput').value = state.subtitle;
    $('badgeInput').value = state.badge;
    $('strengthInput').value = state.strength;
    render(); syncChips();
  });
}

function syncPanelControls() {
  const spec = state.panels[state.activePanel];
  if (!spec) return;
  $('panelLabel').textContent = `Panel ${state.activePanel + 1} of ${state.panels.length}`;
  $('photoSelect').innerHTML = '';
  state.photos.forEach((img, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = `Photo ${i + 1}${i < SAMPLES.length ? ' (sample)' : ' (upload)'}`;
    if (i === spec.photo) o.selected = true;
    $('photoSelect').appendChild(o);
  });
  $('zoomInput').value = spec.zoom;
  $('flipInput').checked = spec.flip;
}

function bindEditor() {
  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  $('badgeInput').addEventListener('input', (e) => { state.badge = e.target.value; render(); });
  $('strengthInput').addEventListener('input', (e) => { state.strength = Number(e.target.value); render(); });
  $('photoSelect').addEventListener('change', (e) => {
    state.panels[state.activePanel].photo = Number(e.target.value); render();
  });
  $('zoomInput').addEventListener('input', (e) => {
    state.panels[state.activePanel].zoom = Number(e.target.value); render();
  });
  $('flipInput').addEventListener('change', (e) => {
    state.panels[state.activePanel].flip = e.target.checked; render();
  });
  $('prevPanel').addEventListener('click', () => {
    state.activePanel = (state.activePanel - 1 + state.panels.length) % state.panels.length;
    render();
  });
  $('nextPanel').addEventListener('click', () => {
    state.activePanel = (state.activePanel + 1) % state.panels.length;
    render();
  });
  $('fileInput').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      if (state.photos.length >= 4) break;
      const url = URL.createObjectURL(file);
      try {
        state.photos.push(await loadImage(url));
      } catch (err) {
        console.warn('upload failed:', file.name, err);
      }
    }
    ensurePanels();
    render();
  });
  $('exportSquare').addEventListener('click', () => exportCover(EXPORT_SIZES[0]));
  $('exportPortrait').addEventListener('click', () => exportCover(EXPORT_SIZES[1]));
  $('exportWide').addEventListener('click', () => exportCover(EXPORT_SIZES[2]));
  $('exportAll').addEventListener('click', exportAll);

  // Drag to pan the active panel, wheel to zoom it.
  let dragging = false, lastX = 0, lastY = 0;
  previewCanvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    previewCanvas.setPointerCapture(e.pointerId);
  });
  previewCanvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const spec = state.panels[state.activePanel];
    const rect = previewCanvas.getBoundingClientRect();
    spec.panX += ((e.clientX - lastX) / rect.width) * 1.2;
    spec.panY += ((e.clientY - lastY) / rect.height) * 1.2;
    spec.panX = Math.max(-1, Math.min(1, spec.panX));
    spec.panY = Math.max(-1, Math.min(1, spec.panY));
    lastX = e.clientX; lastY = e.clientY;
    render();
  });
  previewCanvas.addEventListener('pointerup', () => { dragging = false; });
  previewCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const spec = state.panels[state.activePanel];
    spec.zoom = Math.max(1, Math.min(3, spec.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    $('zoomInput').value = spec.zoom;
    render();
  }, { passive: false });
}

function exportCover(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  ensurePanels();
  renderCover(canvas, state.photos, {
    layout: state.layout, grade: state.grade, strength: state.strength,
    title: state.title, subtitle: state.subtitle, badge: state.badge,
    footer: state.footer, panels: state.panels,
  });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leonida-heat-${size.name}-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

function exportAll() {
  EXPORT_SIZES.forEach((size, i) => {
    setTimeout(() => exportCover(size), i * 400);
  });
}

// Shot-cover scene: the app draws one exported cover full-frame at the
// window's size, for the screenshot driver. Query params: size=WxH,
// layout=, grade=. The resize listener is skipped in this mode (see
// render()), so a late resize cannot overwrite the shot canvas.
async function bootShotCover() {
  const params = new URLSearchParams(location.search);
  const size = (params.get('size') || '1920x1080').split('x').map(Number);
  const w = size[0] || 1920, h = size[1] || 1080;
  state.layout = params.get('layout') || state.layout;
  state.grade = params.get('grade') || state.grade;
  // The shot canvas must be the ONLY thing on the page: clear the editor
  // shell first, or the canvas lands below the fold and the screenshot
  // captures the empty editor instead of the cover.
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.classList.add('shot-cover');
  const canvas = document.createElement('canvas');
  canvas.id = 'shotCanvas';
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.display = 'block';
  document.body.appendChild(canvas);
  ensurePanels();
  try { await document.fonts.load('100px Anton'); } catch (e) { /* fall back */ }
  renderCover(canvas, state.photos, {
    layout: state.layout, grade: state.grade, strength: state.strength,
    title: state.title, subtitle: state.subtitle, badge: state.badge,
    footer: state.footer, panels: state.panels,
  });
  document.title = 'shot-ready';
}

async function boot() {
  previewCanvas = $('preview');
  state.photos = await loadSamples();
  state.panels = defaultPanels(9);
  const params = new URLSearchParams(location.search);
  if (params.get('shot') === 'cover') {
    await bootShotCover();
    return;
  }
  try { await document.fonts.load('100px Anton'); } catch (e) { /* fall back */ }
  bindEditor();
  syncChips();
  render();
  window.addEventListener('resize', () => {
    // In shot-cover mode the export canvas is already final; a resize
    // must not redraw the stage as the square preview.
    if (!document.body.classList.contains('shot-cover')) render();
  });
}

document.addEventListener('DOMContentLoaded', boot);
