// LEONIDA HEAT — build entrypoint (round 3, written fresh).
//
// Stages app/ and screenshots/ into the grader output directory and asks
// the kit's buildDossier helper to write dossier.json. Run with Node 22:
//   node main.ts
//
// The output directory comes from MAKEFUN_OUTPUT_DIR, or /output by
// default. The grader mounts /output as a bind mount on a read-only
// filesystem and runs as user 65534, so this file NEVER deletes or
// recreates the output directory itself: it only makes sure the directory
// exists and writes into it. Removing the mount point fails (EACCES/EBUSY)
// and the run exits 1. Stale children inside the directory may be cleared
// one by one, never the directory itself. Nothing here touches the network.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here);
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

function outputDir() {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  return fromEnv ? resolve(fromEnv) : '/output';
}

function tallyTree(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = tallyTree(p);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += statSync(p).size;
    }
  }
  return { files, bytes };
}

function clearChild(out, name) {
  const target = join(out, name);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(`cleared stale ${name}/`);
  }
}

function stageDir(src, label, out) {
  if (!existsSync(src)) {
    throw new Error(`missing input directory: ${src}`);
  }
  const dest = join(out, label);
  cpSync(src, dest, { recursive: true });
  const tally = tallyTree(dest);
  console.log(`staged ${label}/: ${tally.files} files, ${tally.bytes} bytes`);
  return tally;
}

function main() {
  const out = outputDir();
  console.log(`LEONIDA HEAT build — repo ${repoRoot} -> output ${out}`);
  // The output directory itself is sacred: the grader mounts it, so it is
  // never removed or recreated, only ensured to exist.
  mkdirSync(out, { recursive: true });
  clearChild(out, 'app');
  clearChild(out, 'screenshots');
  clearChild(out, 'dossier.json');

  const appTally = stageDir(appDir, 'app', out);
  const shotsTally = stageDir(shotsDir, 'screenshots', out);
  const totalFiles = appTally.files + shotsTally.files;
  const totalBytes = appTally.bytes + shotsTally.bytes;
  console.log(`total staged: ${totalFiles} files, ${totalBytes} bytes`);

  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  const dossierPath = join(out, 'dossier.json');
  writeFileSync(dossierPath, dossier);
  // Fail loudly here (with a clear message) if the write did not land,
  // instead of exiting 0 and letting the grader fail later on a missing
  // dossier with no clue why.
  const written = statSync(dossierPath);
  if (written.size === 0) {
    throw new Error('dossier.json was written empty');
  }
  console.log(`wrote dossier.json (${dossier.length} bytes, verified ${written.size} bytes on disk)`);
  console.log('build ok');
}

main();
