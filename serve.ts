// LEONIDA HEAT — tiny static dev server (round 3, written fresh).
// Serves app/ on localhost so the editor and the screenshot driver can
// load it over HTTP, exactly like a static host would. No build step,
// no network fetches beyond the machine itself.
//
//   node serve.ts [port]   (default port 8123)

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(resolve(dirname(fileURLToPath(import.meta.url))), 'app');
const port = Number(process.argv[2] || 8123);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const cleaned = decoded.replace(/^\/+/, '') || 'index.html';
  const full = resolve(join(root, cleaned));
  if (!full.startsWith(root)) return null;
  return full;
}

const server = createServer((req, res) => {
  const file = safePath(req.url || '/');
  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found\n');
    return;
  }
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'content-length': statSync(file).size });
  res.end(readFileSync(file));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`LEONIDA HEAT dev server — http://127.0.0.1:${port}/ serving ${root}`);
});
