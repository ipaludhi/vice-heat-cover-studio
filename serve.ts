// LEONIDA HEAT — dev server (round 4, written fresh).
//
// Serves app/ as static files on 127.0.0.1 so the editor and the
// headless screenshot run can load it over HTTP (ES modules refuse
// file://). Usage: node serve.ts [port]   (default 4173).

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(resolve(dirname(fileURLToPath(import.meta.url))), 'app');
const port = Number(process.argv[2] || process.env.PORT || 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const raw = decodeURIComponent((req.url || '/').split('?')[0]);
  const safe = raw.replace(/^\/+/, '').replace(/\.\./g, '');
  const file = join(root, safe === '' ? 'index.html' : safe);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found\n');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`LEONIDA HEAT dev server: http://127.0.0.1:${port}/ (serving ${root})`);
});
