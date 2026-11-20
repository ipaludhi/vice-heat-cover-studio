// LEONIDA HEAT — headless screenshot runner (round 4, written fresh).
//
// Reads shots.json, serves the repo's app/ on 127.0.0.1, and takes one
// headless-Chrome screenshot per shot. Usage:
//   node app/src/shots.js [port]   (default 4173; screenshots/ must exist)
//
// Chrome: /usr/bin/google-chrome (stable). The Meta Chromium at
// /opt/meta-chromium refuses to start in this VM, so it is never used.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');
const port = Number(process.argv[2] || 4173);
const CHROME = '/usr/bin/google-chrome';

function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: (buf[i + 7] << 8) | buf[i + 8], height: (buf[i + 5] << 8) | buf[i + 6] };
    }
    const len = (buf[i + 2] << 8) | buf[i + 3];
    i += 2 + len;
  }
  return null;
}

function run(cmd, args, opts = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(cmd, args, { stdio: 'pipe', ...opts });
    let out = '', err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', rejectPromise);
    child.on('close', (code) => resolvePromise({ code, out, err }));
  });
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function main() {
  const shots = JSON.parse(readFileSync(join(repoRoot, 'shots.json'), 'utf8')).shots;
  mkdirSync(shotsDir, { recursive: true });

  const chromeCheck = spawnSync(CHROME, ['--version'], { encoding: 'utf8' });
  if (chromeCheck.status !== 0) throw new Error('google-chrome not runnable — install it first');
  console.log(`chrome: ${chromeCheck.stdout.trim()}`);

  const server = spawn(process.execPath, [join(repoRoot, 'serve.ts'), String(port)], { stdio: 'pipe' });
  const up = await waitForServer(`http://127.0.0.1:${port}/`);
  if (!up) { server.kill(); throw new Error('dev server did not come up'); }

  let failed = 0;
  for (const shot of shots) {
    const out = join(shotsDir, shot.file);
    const url = `http://127.0.0.1:${port}${shot.url}`;
    const res = await run(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
      '--hide-scrollbars', `--window-size=${shot.width},${shot.height}`,
      '--virtual-time-budget=9000', `--screenshot=${out}`, url,
    ]);
    if (!existsSync(out)) {
      console.log(`FAIL ${shot.file}: no file (chrome exit ${res.code}) ${res.err.slice(0, 200)}`);
      failed++;
      continue;
    }
    const bytes = statSync(out).size;
    const dims = jpegSize(readFileSync(out));
    const ok = bytes <= 262144 && dims && dims.width === shot.width && dims.height === shot.height;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${shot.file}: ${dims ? `${dims.width}x${dims.height}` : '???'} ${bytes} bytes${bytes > 262144 ? ' (OVER 256 KiB!)' : ''}`);
    if (!ok) failed++;
  }
  server.kill();
  if (failed) throw new Error(`${failed} shot(s) failed`);
  console.log(`all ${shots.length} shots ok`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
