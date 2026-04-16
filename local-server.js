#!/usr/bin/env node
/**
 * local-server.js — Fixed for MindAR + A-Frame
 * Adds correct CSP headers so A-Frame/TensorFlow.js can run (they need unsafe-eval).
 *
 * Usage:  node local-server.js
 * Open:   http://localhost:3000
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3000;
const DIR  = __dirname;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.mind': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
};

function serveFile(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  let urlPath = req.url.split('?')[0]; // strip query params
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(DIR, urlPath);

  // Security: don't serve files outside DIR
  if (!filePath.startsWith(DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${urlPath}`);
      return;
    }

    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': mime,
      ...corsHeaders(),
      ...cspHeaders(),
    });
    res.end(data);
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function cspHeaders() {
  return {
    // ── KEY FIX ──────────────────────────────────────────────────────────────
    // A-Frame and TensorFlow.js (used internally by MindAR) require:
    //   • unsafe-eval  — they use new Function() / eval() for shader compilation
    //   • blob:        — we load .mind and video files via blob: URLs
    //   • cdn.jsdelivr.net, aframe.io, unpkg.com — CDN scripts
    // ─────────────────────────────────────────────────────────────────────────
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://aframe.io https://cdn.jsdelivr.net https://unpkg.com https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "media-src 'self' blob: data:",
      "connect-src 'self' blob: data: https://cdn.jsdelivr.net https://unpkg.com",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
    ].join('; '),
  };
}

http.createServer(serveFile).listen(PORT, () => {
  console.log('\n✅ AR Dev Server running');
  console.log(`   http://localhost:${PORT}           ← AR experience (index.html)`);
  console.log(`   http://localhost:${PORT}/admin.html ← Admin dashboard`);
  console.log('\n   Keep this terminal open while testing.\n');
});
