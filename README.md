# LEONIDA HEAT — Vice Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ipaludhi/vice-heat-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ipaludhi/vice-heat-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn any photo and a caption into GTA 6-style cover art — the multi-panel
poster look with bold lettering and a Vice City sunset / neon grade — and
export it as a PNG to share. Built for the
[make.fun GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01).

Everything runs offline in your browser from static files: your photos never
leave your machine, and no network request is made.

## What it does

- **6 layouts** — Diagonal Hero, Five Panel, Nine Grid, Duo Split, Trio
  Strip, Solo Poster. Every layout fills its panels from your photos.
- **6 pixel grades** — Vice Sunset, Neon Nights, Palm Dusk, Ocean Heat,
  Mono Ink, Acid Vice. Real per-pixel work (posterize + gradient-map +
  halftone + grain + vignette), not a CSS filter.
- **Any photo** — upload up to 4 photos, pick one per panel, zoom, drag to
  pan, flip, and set the grade strength per panel.
- **Your words** — title, subtitle, badge and footer are all editable, in
  giant Anton lettering with a retro striped sun and palm silhouettes.
- **Fast** — 3 one-click presets, then export PNG in **1080×1080**,
  **1080×1350** or **1920×1080**, or all three at once.

## Try it

```sh
node serve.ts        # serves app/ on http://127.0.0.1:4173/
```

Open the page, load a photo (or use the two bundled samples), pick a layout
and a grade, write your title, and hit Export.

## Build (the entrypoint)

```sh
node main.ts         # stages app/ + screenshots/ into $MAKEFUN_OUTPUT_DIR
                     # (default /output) and writes dossier.json there
```

`main.ts` never deletes the output directory itself — the grader mounts it,
so it only ensures the directory exists and writes into it.

## Credits

- Font: **Anton** by the Anton Project Authors, SIL Open Font License 1.1
  (see `app/fonts/OFL.txt`).
- Sample photos: made with an image model for this project (no real people,
  no Rockstar artwork). All art, lettering and code are original.
- License: MIT — see `LICENSE`.
