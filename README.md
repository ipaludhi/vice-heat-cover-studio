# LEONIDA HEAT — Vice Cover Studio

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun](https://img.shields.io/badge/make.fun-GTA%206-orange)](https://make.fun)
[![make.fun](https://img.shields.io/badge/make.fun-Leonida%20Heat-red)](https://make.fun/bounty/gta6-cover-art-01)

Turn any photo and a caption into GTA 6-style cover art: a multi-panel
poster with bold Anton lettering and a Vice City sunset or neon grade,
exported as a PNG to share. It runs offline in a desktop browser from its
own static files — photos never leave your machine.

## Try it

```sh
node serve.ts        # serves app/ on http://127.0.0.1:8123/
```

Open the page, pick a layout and a grade, type a title, drag the preview
to position a photo, and export a PNG.

## What it does

- **6 layouts** — Diagonal Hero, Five Panel, Nine Grid, Duo Split,
  Trio Strip, Solo Poster.
- **6 real pixel grades** — Vice Sunset, Neon Nights, Palm Dusk,
  Ocean Heat, Mono Ink, Acid Vice. Each grade posterizes the photo,
  maps it through a colour ramp, adds halftone dots, seeded grain and a
  vignette (canvas `getImageData`, all in the browser).
- **Any photo** — upload up to 4 photos, or use the two AI-made Vice
  City samples. Per panel: pick a photo, zoom, drag to pan, flip.
- **Caption editing** — title, subtitle, badge and footer, plus three
  one-click presets.
- **Export** — PNG in 1080 × 1080, 1080 × 1350 and 1920 × 1080, one at
  a time or all three at once.
- **Own art only** — the sun disc and palm silhouettes are drawn in
  code; the lettering is Anton under the SIL Open Font License. No
  Rockstar logo, artwork or font.

## Layout

- `main.ts` — the entrypoint: stages `app/` and `screenshots/` into
  the output directory and writes `dossier.json` with the kit's
  `buildDossier`. It never deletes the output directory itself (the
  grader mounts it).
- `serve.ts` — tiny static dev server for `app/`.
- `app/index.html`, `app/style.css` — the editor.
- `app/src/cover.js` — the cover engine: layouts, grades, vector art.
- `app/src/main.js` — editor state, drag/zoom, export.
- `app/src/shots.js` — headless-Chrome screenshot driver (reads
  `shots.json`, writes `screenshots/`).
- `app/samples/` — two AI-made sample photos (no real people).
- `app/fonts/` — Anton (OFL) with its license text.

## Screenshots

`screenshots/` holds four captures: the exported landscape cover, the
editor with a photo loaded, and the square and portrait covers.

Built for the [make.fun GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01).
