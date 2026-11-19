// LEONIDA HEAT — tiny static dev server (written fresh for round 2).
// Serves app/ on localhost so the editor can be tried in a browser.
// Usage: node serve.ts [port]   (default 8080, or $PORT)

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(resolve(dirname(fileURLToPath(import.meta.url))), 'app');
const port = Number(process.argv[2] || process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    let rel = path === '/' ? 'index.html' : path.replace(/^\/+/, '');
    const target = resolve(root, rel);
    if (!target.startsWith(root + '/') && target !== root) {
      res.writeHead(403, { 'content-type': 'text/plain' });
      res.end('forbidden');
      return;
    }
    if (!existsSync(target)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found: ' + rel);
      return;
    }
    const body = await readFile(target);
    res.writeHead(200, { 'content-type': TYPES[extname(target)] || 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    console.error('serve error:', err.message);
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('server error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`LEONIDA HEAT dev server: http://127.0.0.1:${port}/`);
});
