// LEONIDA HEAT — screenshot renderer (fresh code, written for round 2).
// Serves app/ locally, screenshots the editor + covers with headless
// Chrome, then downsamples each frame with Python/PIL to the dossier's
// limits (long side <= 1280, short side >= 480, each file <= 256 KiB).
// Usage: node app/src/shots.js [shots.json] [screenshots-dir]

import { spawn, execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const shotsFile = process.argv[2] || join(repoRoot, 'shots.json');
const outDir = process.argv[3] || join(repoRoot, 'screenshots');
const PORT = 8099;
const CHROME = process.env.CHROME || 'google-chrome';
const MAX_BYTES = 262144;

const shots = JSON.parse(readFileSync(shotsFile, 'utf8'));

function waitForServer(port, tries = 60) {
  return new Promise((resolvePromise, reject) => {
    let left = tries;
    const tick = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/' }, (res) => {
        res.resume();
        if (res.statusCode === 200) resolvePromise(true);
        else retry();
      });
      req.on('error', retry);
      function retry() {
        if (--left <= 0) reject(new Error('dev server did not answer'));
        else setTimeout(tick, 500);
      }
    };
    tick();
  });
}

function runChrome(url, width, height, pngPath) {
  return new Promise((resolvePromise, reject) => {
    const args = [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--hide-scrollbars', '--force-device-scale-factor=1',
      `--window-size=${width},${height}`,
      `--screenshot=${pngPath}`,
      '--virtual-time-budget=9000',
      url,
    ];
    execFile(CHROME, args, { timeout: 90000 }, (err) => {
      if (err) reject(err);
      else resolvePromise(true);
    });
  });
}

function downsample(pngPath, jpgPath, targetW, targetH) {
  // PIL: fit inside the target box (long side <= 1280, short side >= 480),
  // then save JPEG q82, falling back to q70 if still over the byte cap.
  const script = [
    'import sys',
    'from PIL import Image',
    'src, dst, tw, th = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])',
    'im = Image.open(src).convert("RGB")',
    'scale = min(tw / im.width, th / im.height)',
    'im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)',
    'for q in (82, 70, 60):',
    '    im.save(dst, "JPEG", quality=q)',
    '    import os',
    '    if os.path.getsize(dst) <= 262144: break',
    'print(dst, im.size)',
  ].join('\n');
  return new Promise((resolvePromise, reject) => {
    const tmp = join('/tmp', 'vice-downsample.py');
    writeFileSync(tmp, script);
    execFile('python3', [tmp, pngPath, jpgPath, String(targetW), String(targetH)], (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolvePromise(stdout.trim());
    });
  });
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const server = spawn(process.execPath, [join(repoRoot, 'serve.ts'), String(PORT)], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => process.stdout.write('[serve] ' + d));
  server.stderr.on('data', (d) => process.stderr.write('[serve] ' + d));
  try {
    await waitForServer(PORT);
    for (const shot of shots) {
      const url = `http://127.0.0.1:${PORT}/?${shot.query}`;
      const png = join('/tmp', `vice-${shot.file}.png`);
      const jpg = join(outDir, shot.file);
      console.log('shot', shot.file, shot.width + 'x' + shot.height, url);
      await runChrome(url, shot.width, shot.height, png);
      if (!existsSync(png)) throw new Error('chrome produced no png for ' + shot.file);
      const info = await downsample(png, jpg, shot.targetW, shot.targetH);
      console.log('  ->', info);
      unlinkSync(png);
    }
    console.log('done:', shots.length, 'screenshots in', outDir);
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('shots failed:', err.message);
  process.exit(1);
});
