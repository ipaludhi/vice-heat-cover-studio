# LEONIDA HEAT — Vice Cover Studio

[![GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/ipaludhi/vice-heat-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/ipaludhi/vice-heat-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn a photo and a caption into a GTA 6-style cover — multi-panel poster,
sunset grade, bold lettering — and export it as a PNG for your post.
Built for the [Make GTA 6 Cover Art bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **6 layouts**: Diagonal Hero, Five Panel, Nine Grid, Duo Split, Trio Strip, Solo Poster.
- **6 real pixel grades** (posterize + halftone + grain + vignette, computed on your photos): Vice Sunset, Neon Nights, Palm Dusk, Ocean Heat, Mono Ink, Acid Vice.
- **Vector sunset band**: sun disc, palm silhouettes, and a giant gradient title with a black outline — all drawn in code, no stock art.
- **Editor**: upload up to 4 photos (or use the two bundled samples), click a panel to select it, drag to pan, zoom, flip, pick a grade strength, and edit the title, subtitle, badge, and footer. Three one-click presets.
- **Export PNG** at the three post sizes: 1080×1080, 1080×1350, 1920×1080.

Everything runs offline in the browser. Photos never leave the device. No Rockstar logos, artwork, or fonts are used — the cover art is generated from your photos plus original code.

## Run it

```sh
node serve.ts 8080
# open http://127.0.0.1:8080/
```

No build step, no dependencies. `node --version` 22 or newer works.

## Screenshots

```sh
node app/src/shots.js   # renders screenshots/1-cover.jpg … 4-cover-portrait.jpg
```

## Build (make.fun entrypoint)

```sh
node main.ts   # stages app/ + screenshots/ into $MAKEFUN_OUTPUT_DIR (default /output) and writes dossier.json
```

## Files

| Path | What it is |
| --- | --- |
| `app/index.html` | editor page |
| `app/style.css` | editor styles |
| `app/src/cover.js` | cover engine: layouts, grades, vector art |
| `app/src/main.js` | editor UI, pan/zoom/flip, export |
| `app/src/shots.js` | headless-Chrome screenshot renderer |
| `app/samples/` | two sample photos (pier, boulevard) |
| `app/fonts/Anton-Regular.ttf` | Anton, SIL OFL 1.1 |
| `main.ts` | make.fun build entrypoint |
| `serve.ts` | static dev server |

## License

MIT — see [LICENSE](LICENSE).
