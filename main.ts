// LEONIDA HEAT — build entrypoint (written fresh for round 2).
// Stages app/ and screenshots/ into the grader output directory and asks
// the kit's buildDossier helper to write dossier.json. Run with Node 22:
//   node main.ts
// The output directory comes from MAKEFUN_OUTPUT_DIR, or /output by
// default. Nothing here touches the network.

import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

function outputDir() {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  return fromEnv ? resolve(fromEnv) : '/output';
}

function countFiles(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countFiles(p);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += statSync(p).size;
    }
  }
  return { files, bytes };
}

function stageOne(src, destLabel, out) {
  if (!existsSync(src)) {
    throw new Error(`missing input directory: ${src}`);
  }
  const dest = join(out, destLabel);
  cpSync(src, dest, { recursive: true });
  const tally = countFiles(dest);
  console.log(`staged ${destLabel}/: ${tally.files} files, ${tally.bytes} bytes`);
  return tally;
}

function main() {
  const out = outputDir();
  console.log(`LEONIDA HEAT build — repo ${repoRoot} -> output ${out}`);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const appTally = stageOne(appDir, 'app', out);
  const shotsTally = stageOne(shotsDir, 'screenshots', out);
  console.log(`total staged: ${appTally.files + shotsTally.files} files, ${appTally.bytes + shotsTally.bytes} bytes`);

  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(out, 'dossier.json'), dossier);
  console.log(`wrote dossier.json (${dossier.length} bytes)`);
  console.log('build ok');
}

main();
