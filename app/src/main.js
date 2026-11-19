// LEONIDA HEAT — editor wiring: photos, panels, presets and PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { renderCover, defaultCoverState, resetPanelsForLayout, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultCoverState();
resetPanelsForLayout(state);
let selectedPanel = 0;
let drawnPanels = [];
let exportSize = { w: 1920, h: 1080 };

const EXPORT_SIZES = [
  { label: '1080 × 1080', w: 1080, h: 1080 },
  { label: '1080 × 1350', w: 1080, h: 1350 },
  { label: '1920 × 1080', w: 1920, h: 1080 },
];

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Size the preview canvas to the chosen export aspect and re-render. */
export function redraw() {
  const maxSide = 960;
  const scale = Math.min(1, maxSide / Math.max(exportSize.w, exportSize.h));
  canvas.width = Math.round(exportSize.w * scale);
  canvas.height = Math.round(exportSize.h * scale);
  drawnPanels = renderCover(canvas, state);
  syncPanelControls();
}

/** Show the selected panel's zoom / photo / flip state in the controls. */
export function syncPanelControls() {
  const ps = state.panels[selectedPanel];
  if (!ps) return;
  const zoom = document.getElementById('zoom');
  const slot = document.getElementById('panel-photo');
  const flip = document.getElementById('flip');
  const label = document.getElementById('panel-label');
  if (zoom) zoom.value = String(ps.zoom);
  if (slot) slot.value = String(ps.photo);
  if (flip) flip.textContent = ps.flip ? 'Flip: ON' : 'Flip: off';
  if (label) label.textContent = `Panel ${selectedPanel + 1} of ${state.panels.length}`;
}

function setStatus(text) {
  status.textContent = text;
}

/** Render one export at full size and download it as a PNG. */
export function exportCover(size) {
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off, state);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cover-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

function buildControlButtons(containerId, entries, current, onPick) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = '';
  Object.entries(entries).forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (key === current ? ' active' : '');
    b.textContent = label;
    b.addEventListener('click', () => {
      onPick(key);
      buildControlButtons(containerId, entries, key, onPick);
    });
    box.appendChild(b);
  });
}

function refreshLayoutButtons() {
  buildControlButtons('layout-buttons', LAYOUTS, state.layout, (key) => {
    state.layout = key;
    resetPanelsForLayout(state);
    selectedPanel = 0;
    redraw();
  });
}

function refreshGradeButtons() {
  buildControlButtons('grade-buttons', GRADES, state.grade, (key) => {
    state.grade = key;
    redraw();
  });
}

const PRESETS = {
  heist: { layout: 'diagonal', grade: 'sunset', title: 'SUNSET HEIST', subtitle: 'a Leonida story' },
  neon: { layout: 'five', grade: 'neon', title: 'NEON NIGHTS', subtitle: 'vice after dark' },
  palm: { layout: 'trio', grade: 'dusk', title: 'PALM DUSK', subtitle: 'where the sun never sets' },
};

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  state.layout = p.layout;
  state.grade = p.grade;
  state.title = p.title;
  state.subtitle = p.subtitle;
  document.getElementById('caption').value = p.title;
  document.getElementById('subtitle').value = p.subtitle;
  resetPanelsForLayout(state);
  selectedPanel = 0;
  refreshLayoutButtons();
  refreshGradeButtons();
  redraw();
  setStatus(`Preset applied: ${p.title}`);
}

function bindControls() {
  document.getElementById('caption').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  document.getElementById('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
  document.getElementById('footer').addEventListener('input', (e) => { state.footer = e.target.value; redraw(); });
  document.getElementById('grade-strength').addEventListener('input', (e) => { state.gradeStrength = Number(e.target.value); redraw(); });
  document.getElementById('halftone').addEventListener('change', (e) => { state.halftone = e.target.checked; redraw(); });
  document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
  document.getElementById('zoom').addEventListener('input', (e) => {
    const ps = state.panels[selectedPanel];
    if (ps) { ps.zoom = Number(e.target.value); redraw(); }
  });
  document.getElementById('panel-photo').addEventListener('change', (e) => {
    const ps = state.panels[selectedPanel];
    if (ps) { ps.photo = Number(e.target.value); redraw(); }
  });
  document.getElementById('flip').addEventListener('click', () => {
    const ps = state.panels[selectedPanel];
    if (ps) { ps.flip = !ps.flip; redraw(); }
  });
  document.getElementById('photo').addEventListener('change', async (e) => {
    const files = [...e.target.files].slice(0, 4);
    for (let i = 0; i < files.length; i++) {
      state.photos[i] = await loadImage(URL.createObjectURL(files[i]));
    }
    redraw();
    setStatus(`Loaded ${files.length} photo${files.length === 1 ? '' : 's'} — all local, never uploaded.`);
  });
  document.getElementById('sample-pier').addEventListener('click', async () => {
    state.photos[0] = await loadImage('samples/pier.jpg');
    redraw();
    setStatus('Sample photo loaded: pier.');
  });
  document.getElementById('sample-boulevard').addEventListener('click', async () => {
    state.photos[1] = await loadImage('samples/boulevard.jpg');
    redraw();
    setStatus('Sample photo loaded: boulevard.');
  });
  document.querySelectorAll('[data-preset]').forEach((b) => {
    b.addEventListener('click', () => applyPreset(b.dataset.preset));
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      const size = EXPORT_SIZES[Number(b.dataset.size)];
      exportSize = { w: size.w, h: size.h };
      document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('active', x === b));
      redraw();
    });
  });
  document.getElementById('export-one').addEventListener('click', async () => {
    await exportCover(exportSize);
    setStatus(`Saved cover-${exportSize.w}x${exportSize.h}.png`);
  });
  document.getElementById('export-all').addEventListener('click', async () => {
    for (const size of EXPORT_SIZES) {
      await exportCover(size);
    }
    setStatus('Saved all 3 sizes: 1080×1080, 1080×1350, 1920×1080.');
  });
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    let hit = -1;
    drawnPanels.forEach((p) => {
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) hit = p.index;
    });
    if (hit >= 0) {
      selectedPanel = hit;
      syncPanelControls();
      canvas.style.cursor = 'grabbing';
      const startX = e.clientX; const startY = e.clientY;
      const ps = state.panels[hit];
      const ox0 = ps.ox; const oy0 = ps.oy;
      const move = (ev) => {
        ps.ox = ox0 + ((ev.clientX - startX) / rect.width) * 1.4;
        ps.oy = oy0 + ((ev.clientY - startY) / rect.height) * 1.4;
        ps.ox = Math.max(-1, Math.min(1, ps.ox));
        ps.oy = Math.max(-1, Math.min(1, ps.oy));
        redraw();
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        canvas.style.cursor = 'grab';
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    }
  });
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/')).slice(0, 4);
    for (let i = 0; i < files.length; i++) {
      state.photos[i] = await loadImage(URL.createObjectURL(files[i]));
    }
    if (files.length) {
      redraw();
      setStatus(`Dropped ${files.length} photo${files.length === 1 ? '' : 's'} onto the cover.`);
    }
  });
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  refreshLayoutButtons();
  refreshGradeButtons();
  bindControls();
  canvas.style.cursor = 'grab';
  runShot(shot, query, state, { loadImage, redraw, applyPreset, setExportSize: (s) => { exportSize = s; } });
} else {
  refreshLayoutButtons();
  refreshGradeButtons();
  bindControls();
  canvas.style.cursor = 'grab';
  document.fonts.load('100px Anton').finally(() => {
    loadImage('samples/pier.jpg').then((img) => { state.photos[0] = img; return loadImage('samples/boulevard.jpg'); }).then((img) => {
      state.photos[1] = img;
      redraw();
    }).catch(() => redraw());
  });
}
