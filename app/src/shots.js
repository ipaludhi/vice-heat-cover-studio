// Fixed scenes for screenshots: ?shot=editor shows the page with a sample photo;
// ?shot=cover shows the cover alone at the requested size. `photo` picks the
// sample (samples/<photo>.jpg), `caption` the words, `layout` / `grade` the look.
// window.__shotReady is set once painted.
import { renderCover, resetPanelsForLayout } from './cover.js';

/** Apply the scene's layout/grade/caption onto the shared editor state. */
export function applyScene(state, query) {
  const layout = query.get('layout');
  const grade = query.get('grade');
  if (layout) state.layout = layout;
  if (grade) state.grade = grade;
  const caption = query.get('caption');
  if (caption !== null) state.title = caption;
  const subtitle = query.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle;
  resetPanelsForLayout(state);
}

export async function runShot(shot, query, state, helpers) {
  const { loadImage } = helpers;
  const coverShot = shot === 'cover' || shot === 'cover-square' || shot === 'cover-portrait';
  if (coverShot) document.body.classList.add('shot-cover');
  const sizeParam = query.get('size');
  let size = { w: 1920, h: 1080 };
  if (sizeParam) {
    const [w, h] = sizeParam.split('x').map(Number);
    if (w > 0 && h > 0) size = { w, h };
  } else if (shot === 'cover-square') size = { w: 1080, h: 1080 };
  else if (shot === 'cover-portrait') size = { w: 1080, h: 1350 };
  if (shot === 'editor') {
    size = { w: 1920, h: 1080 };
    document.body.classList.add('shot-editor');
    if (!query.get('layout')) state.layout = 'diagonal';
    if (!query.get('grade')) state.grade = 'sunset';
  }
  applyScene(state, query);
  if (helpers.setExportSize) helpers.setExportSize(size);
  await document.fonts.load('100px Anton').catch(() => {});
  await document.fonts.ready.catch(() => {});
  const pier = await loadImage('samples/pier.jpg');
  const boulevard = await loadImage('samples/boulevard.jpg');
  state.photos[0] = pier;
  state.photos[1] = boulevard;
  const canvas = document.getElementById('cover');
  if (coverShot) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderCover(canvas, state);
  } else {
    helpers.redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
