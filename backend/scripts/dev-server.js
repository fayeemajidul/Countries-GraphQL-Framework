// Local dev server: serves /frontend statically and routes /api/* to the
// Vercel-style handlers under /backend/api. One process, one port — mirrors prod.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const FRONTEND_DIR = join(ROOT, 'frontend');
const API_DIR = join(ROOT, 'backend', 'api');
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.map':  'application/json; charset=utf-8',
};

function vercelify(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (chunks.length === 0) return undefined;
  const raw = Buffer.concat(chunks).toString('utf8');
  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (ct.includes('application/json')) {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

async function handleApi(req, res, apiName) {
  const modPath = join(API_DIR, `${apiName}.js`);
  try {
    await stat(modPath);
  } catch {
    return vercelify(res).status(404).json({ error: `No API handler: ${apiName}` });
  }
  try {
    req.body = await readBody(req);
    const mod = await import(`${modPath}?t=${Date.now()}`);
    const handler = mod.default;
    if (typeof handler !== 'function') {
      return vercelify(res).status(500).json({ error: `Handler ${apiName} has no default export` });
    }
    await handler(req, vercelify(res));
  } catch (err) {
    console.error(`[api/${apiName}] error:`, err);
    if (!res.headersSent) {
      vercelify(res).status(500).json({ error: 'Dev handler crashed', detail: err?.message });
    }
  }
}

async function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';

  let filePath = normalize(join(FRONTEND_DIR, rel));
  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.statusCode = 403;
    return res.end('Forbidden');
  }

  try {
    let s = await stat(filePath);
    if (s.isDirectory()) {
      filePath = join(filePath, 'index.html');
      s = await stat(filePath);
    }
    const data = await readFile(filePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[extname(filePath)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(data);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end(`Not found: ${rel}`);
  }
}

const server = createServer(async (req, res) => {
  const url = req.url || '/';
  const t0 = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${url} → ${res.statusCode} (${Date.now() - t0}ms)`);
  });

  if (url.startsWith('/api/')) {
    const name = url.slice(5).split(/[/?]/)[0];
    return handleApi(req, res, name);
  }
  return serveStatic(req, res, url);
});

server.listen(PORT, () => {
  console.log(`\n  Countries-GraphQL dev server`);
  console.log(`  ▸ Frontend:  http://localhost:${PORT}/`);
  console.log(`  ▸ API:       http://localhost:${PORT}/api/countries  ,  /api/spacex`);
  console.log(`  ▸ Press Ctrl+C to stop\n`);
});
