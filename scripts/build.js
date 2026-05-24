'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const apiUrl = String(process.env.VITE_API_URL || '').trim();

if (!apiUrl) {
  console.error('Missing required environment variable: VITE_API_URL');
  process.exit(1);
}

try {
  new URL(apiUrl);
} catch (_error) {
  console.error('VITE_API_URL must be a valid absolute URL.');
  process.exit(1);
}

const skip = new Set(['dist', 'node_modules', 'scripts']);

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    if (entry.name === 'package-lock.json') continue;

    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function emptyDir(target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    fs.rmSync(path.join(target, entry.name), { recursive: true, force: true });
  }
}

emptyDir(dist);
copyDir(root, dist);

const generatedEnvPath = path.join(dist, 'assets', 'js', 'env.js');
fs.mkdirSync(path.dirname(generatedEnvPath), { recursive: true });
fs.writeFileSync(
  generatedEnvPath,
  `'use strict';\n\nwindow.__VIBEPASS_ENV__ = Object.freeze(${JSON.stringify({ VITE_API_URL: apiUrl })});\n`,
  'utf8'
);

console.log('Static frontend build complete.');
