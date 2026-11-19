// LEONIDA HEAT — editor UI (fresh code, written for round 2).
// Loads photos, lets the user pick layout / grade / panels / text, renders
// the cover on a canvas, and exports PNG at the three post sizes.
// Supports ?shot=cover and ?shot=editor for headless screenshots.

import { LAYOUTS, GRADES, layoutById, drawCover, renderCover } from './cover.js';

const SAMPLES = ['samples/pier.jpg', 'samples/boulevard.jpg'];
const EXPORT_SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
];

const PRESETS = [
  { id: 'sunset', name: 'Vice Sunset', layout: 'diagonal', grade: 'vice', strength: 0.55 },
  { id: 'neon', name: 'Neon Nights', layout: 'five', grade: 'neon', strength: 0.6 },
  { id: 'dusk', name: 'Palm Dusk', layout: 'nine', grade: 'dusk', strength: 0.5 },
];

const state = {
  photos: [],
  panels: [],
  layoutId: 'diagonal',
  gradeId: 'vice',
  strength: 0.55,
  title: 'SUNSET HEIST',
  subtitle: 'a Leonida story',
  badge: 'LEONIDA',
  footer: 'VICE CITY • EST. 2026',
  seed: 20261119,
  selected: 0,
  sizeId: 'square',
};

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const sctx = stage.getContext('2d');

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load ' + src));
    img.src = src;
  });
}

function defaultPanels() {
  const n = layoutById(state.layoutId).panels(100, 100).length;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ photo: i % Math.max(1, state.photos.length), zoom: 1, ox: 0, oy: 0, flip: false });
  }
  return out;
}

function syncPanels() {
  const n = layoutById(state.layoutId).panels(100, 100).length;
  if (state.panels.length !== n) {
    const keep = state.panels.slice(0, n);
    while (keep.length < n) keep.push({ photo: keep.length % Math.max(1, state.photos.length), zoom: 1, ox: 0, oy: 0, flip: false });
    state.panels = keep;
  }
  if (state.selected >= n) state.selected = 0;
}

function coverOpts() {
  return {
    photos: state.photos,
    panels: state.panels,
    layoutId: state.layoutId,
    gradeId: state.gradeId,
    strength: state.strength,
    title: state.title,
    subtitle: state.subtitle,
    badge: state.badge,
    footer: state.footer,
    seed: state.seed,
  };
}

function render() {
  // Shot-cover mode draws the export canvas once in boot(); a later resize
  // must never redraw the stage as the square editor preview.
  if (document.body.classList.contains('shot-cover')) return;
  const wrap = $('stageWrap');
  const avail = Math.min(wrap.clientWidth || 900, 900);
  const ratio = window.devicePixelRatio || 1;
  const size = EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES[0];
  const scale = avail / size.w;
  stage.width = Math.round(size.w * scale * ratio);
  stage.height = Math.round(size.h * scale * ratio);
  stage.style.width = Math.round(size.w * scale) + 'px';
  stage.style.height = Math.round(size.h * scale) + 'px';
  sctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const tmp = document.createElement('canvas');
  tmp.width = size.w; tmp.height = size.h;
  drawCover(tmp, coverOpts());
  sctx.clearRect(0, 0, stage.width, stage.height);
  sctx.drawImage(tmp, 0, 0, size.w * scale, size.h * scale);
  const n = layoutById(state.layoutId).panels(size.w, size.h).length;
  $('panelCount').textContent = n + ' panel' + (n > 1 ? 's' : '') + ' · panel ' + (state.selected + 1) + ' dipilih';
}

function renderThumbs() {
  const row = $('thumbs');
  row.innerHTML = '';
  state.photos.forEach((img, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb' + (state.panels[state.selected] && state.panels[state.selected].photo === i ? ' active' : '');
    b.title = 'Foto ' + (i + 1) + ' → panel ' + (state.selected + 1);
    const c = document.createElement('canvas');
    c.width = 96; c.height = 96;
    const cctx = c.getContext('2d');
    const s = Math.max(96 / img.naturalWidth, 96 / img.naturalHeight);
    cctx.drawImage(img, (96 - img.naturalWidth * s) / 2, (96 - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    b.appendChild(c);
    b.addEventListener('click', () => {
      if (!state.panels[state.selected]) return;
      state.panels[state.selected].photo = i;
      renderThumbs();
      render();
    });
    row.appendChild(b);
  });
  $('photoCount').textContent = state.photos.length + ' foto';
}

function buildButtons() {
  const lr = $('layoutRow');
  lr.innerHTML = '';
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (l.id === state.layoutId ? ' active' : '');
    b.textContent = l.name;
    b.addEventListener('click', () => {
      state.layoutId = l.id;
      syncPanels();
      buildButtons();
      renderThumbs();
      render();
    });
    lr.appendChild(b);
  });
  const gr = $('gradeRow');
  gr.innerHTML = '';
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (g.id === state.gradeId ? ' active' : '');
    b.textContent = g.name;
    b.addEventListener('click', () => {
      state.gradeId = g.id;
      buildButtons();
      render();
    });
    gr.appendChild(b);
  });
  const pr = $('presetRow');
  pr.innerHTML = '';
  PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'preset';
    b.textContent = p.name;
    b.addEventListener('click', () => {
      state.layoutId = p.layout;
      state.gradeId = p.grade;
      state.strength = p.strength;
      $('strength').value = Math.round(p.strength * 100);
      $('strengthVal').textContent = Math.round(p.strength * 100) + '%';
      syncPanels();
      buildButtons();
      renderThumbs();
      render();
    });
    pr.appendChild(b);
  });
  const sr = $('sizeRow');
  sr.innerHTML = '';
  EXPORT_SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (s.id === state.sizeId ? ' active' : '');
    b.textContent = s.label;
    b.addEventListener('click', () => {
      state.sizeId = s.id;
      buildButtons();
      render();
    });
    sr.appendChild(b);
  });
}

function bindControls() {
  $('photoInput').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files.slice(0, 4 - state.photos.length)) {
      const url = URL.createObjectURL(f);
      try { state.photos.push(await loadImage(url)); } catch (err) { console.warn(err); }
    }
    syncPanels();
    renderThumbs();
    render();
  });
  $('sampleBtn').addEventListener('click', async () => {
    if (state.photos.length >= 4) return;
    for (const src of SAMPLES) {
      if (state.photos.length >= 4) break;
      try { state.photos.push(await loadImage(src)); } catch (err) { console.warn(err); }
    }
    syncPanels();
    renderThumbs();
    render();
  });
  const bindText = (id, key) => {
    $(id).addEventListener('input', (e) => { state[key] = e.target.value; render(); });
  };
  bindText('titleInput', 'title');
  bindText('subtitleInput', 'subtitle');
  bindText('badgeInput', 'badge');
  bindText('footerInput', 'footer');
  $('strength').addEventListener('input', (e) => {
    state.strength = Number(e.target.value) / 100;
    $('strengthVal').textContent = e.target.value + '%';
    render();
  });
  $('zoom').addEventListener('input', (e) => {
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = Number(e.target.value) / 100;
    $('zoomVal').textContent = e.target.value + '%';
    render();
  });
  $('flipBtn').addEventListener('click', () => {
    const p = state.panels[state.selected];
    if (!p) return;
    p.flip = !p.flip;
    render();
  });
  $('exportBtn').addEventListener('click', () => exportOne(state.sizeId));
  $('exportAllBtn').addEventListener('click', exportAll);
  $('shuffleBtn').addEventListener('click', () => {
    state.seed = (Math.random() * 1e9) | 0;
    render();
  });

  // drag to pan the selected panel, click a panel to select it
  let dragging = false;
  let lastX = 0, lastY = 0;
  function panelAt(clientX, clientY) {
    const r = stage.getBoundingClientRect();
    const size = EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES[0];
    const px = ((clientX - r.left) / r.width) * size.w;
    const py = ((clientY - r.top) / r.height) * size.h;
    const rects = layoutById(state.layoutId).panels(size.w, size.h);
    for (let i = rects.length - 1; i >= 0; i--) {
      const rc = rects[i];
      if (px >= rc.x && px <= rc.x + rc.w && py >= rc.y && py <= rc.y + rc.h) return i;
    }
    return 0;
  }
  stage.addEventListener('pointerdown', (e) => {
    state.selected = panelAt(e.clientX, e.clientY);
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    stage.setPointerCapture(e.pointerId);
    renderThumbs();
    render();
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = state.panels[state.selected];
    if (!p) return;
    const r = stage.getBoundingClientRect();
    const size = EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES[0];
    const k = size.w / r.width;
    p.ox = (p.ox || 0) + (e.clientX - lastX) * k;
    p.oy = (p.oy || 0) + (e.clientY - lastY) * k;
    lastX = e.clientX; lastY = e.clientY;
    render();
  });
  stage.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('resize', () => {
    // In shot-cover mode the export canvas is already final; a resize
    // (headless Chrome fires one after boot) must not re-render it.
    if (!document.body.classList.contains('shot-cover')) render();
  });
}

function download(canvas, name) {
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

function exportOne(sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[0];
  const canvas = renderCover(state.photos, coverOpts(), size.w, size.h);
  download(canvas, `leonida-heat-${size.id}-${size.w}x${size.h}.png`);
}

async function exportAll() {
  for (const size of EXPORT_SIZES) {
    exportOne(size.id);
    await new Promise((r) => setTimeout(r, 350));
  }
}

// ------------------------------------------------------------ shot support
function readShotParams() {
  const q = new URLSearchParams(location.search);
  if (!q.has('shot')) return null;
  return {
    shot: q.get('shot'),
    w: Number(q.get('w') || 1280),
    h: Number(q.get('h') || 720),
    layout: q.get('layout') || 'diagonal',
    grade: q.get('grade') || 'vice',
    strength: q.has('strength') ? Number(q.get('strength')) : 0.55,
    title: q.get('title') || 'SUNSET HEIST',
    subtitle: q.get('subtitle') || 'a Leonida story',
    badge: q.get('badge') || 'LEONIDA',
    footer: q.get('footer') || 'VICE CITY • EST. 2026',
    size: q.get('size') || 'square',
  };
}

async function boot() {
  const params = readShotParams();
  try {
    state.photos = await Promise.all(SAMPLES.map(loadImage));
  } catch (err) {
    console.warn('sample load failed', err);
  }
  if (params) {
    state.layoutId = params.layout;
    state.gradeId = params.grade;
    state.strength = params.strength;
    state.title = params.title;
    state.subtitle = params.subtitle;
    state.badge = params.badge;
    state.footer = params.footer;
    state.sizeId = params.size;
  }
  state.panels = defaultPanels();
  buildButtons();
  bindControls();
  renderThumbs();
  if (params && params.shot === 'cover') {
    document.body.classList.add('shot-cover');
    stage.width = params.w;
    stage.height = params.h;
    stage.style.width = params.w + 'px';
    stage.style.height = params.h + 'px';
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    const tmp = document.createElement('canvas');
    tmp.width = params.w; tmp.height = params.h;
    drawCover(tmp, coverOpts());
    sctx.drawImage(tmp, 0, 0);
    document.title = 'ready';
  } else {
    render();
    document.title = 'ready';
  }
}

boot();
