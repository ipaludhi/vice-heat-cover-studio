// LEONIDA HEAT — screenshot driver (round 3, written fresh).
// Serves app/ on localhost, captures the four shots from shots.json with
// headless Chrome, and converts each PNG to a JPEG (quality 82, stepping
// down only if it would exceed the 256 KiB gate cap).
//
//   node app/src/shots.js [port]   (default port 8123, server started here)

import { spawn, execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const shotsDef = JSON.parse(readFileSync(join(repoRoot, 'shots.json'), 'utf8'));
const shotsDir = join(repoRoot, 'screenshots');
const port = Number(process.argv[2] || 8123);
const CHROME = '/usr/bin/google-chrome'; // Google Chrome stable (reinstalled from the durable .deb after a VM replacement wiped /usr)

function run(cmd, args, opts = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = execFile(cmd, args, { ...opts, maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) rejectPromise(new Error(`${cmd} failed: ${stderr || err.message}`));
      else resolvePromise({ stdout, stderr });
    });
    child.stdout?.on('data', () => {});
    child.stderr?.on('data', () => {});
  });
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (e) { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('dev server did not come up at ' + url);
}

function toJpeg(pngPath, jpgPath) {
  const script = [
    'from PIL import Image',
    `im = Image.open(${JSON.stringify(pngPath)}).convert("RGB")`,
    `q = 82`,
    `while True:`,
    `    im.save(${JSON.stringify(jpgPath)}, "JPEG", quality=q, optimize=True)`,
    `    import os`,
    `    if os.path.getsize(${JSON.stringify(jpgPath)}) <= 262144 or q <= 55:`,
    `        break`,
    `    q -= 7`,
    `print("jpeg", q)`,
  ].join('\n');
  return run('python3', ['-c', script]);
}

async function capture(shot) {
  const pngPath = join(shotsDir, shot.file.replace(/\.jpe?g$/i, '.png'));
  const jpgPath = join(shotsDir, shot.file);
  const url = `http://127.0.0.1:${port}${shot.url}`;
  await run(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${shot.width},${shot.height}`,
    '--virtual-time-budget=10000',
    `--screenshot=${pngPath}`, url,
  ]);
  if (!existsSync(pngPath)) throw new Error('chrome wrote no screenshot for ' + shot.file);
  await toJpeg(pngPath, jpgPath);
  unlinkSync(pngPath);
  console.log(`shot ${shot.file} ${shot.width}x${shot.height} done`);
}

async function main() {
  mkdirSync(shotsDir, { recursive: true });
  const server = spawn('node', [join(repoRoot, 'serve.ts'), String(port)], {
    stdio: 'inherit',
  });
  try {
    await waitForServer(`http://127.0.0.1:${port}/index.html`);
    for (const shot of shotsDef.shots) {
      await capture(shot);
    }
    console.log('all shots done');
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
