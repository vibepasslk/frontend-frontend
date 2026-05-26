'use strict';

const CACHE_NAME = 'vibepass-static-v4';

// Only static assets (NO HTML pages here)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',

  '/assets/css/style.css',
  '/assets/css/pages.css',

  '/assets/js/api.js',
  '/assets/js/script.js',
  '/assets/js/dashboard.js',

  '/assets/images/Logo-192.png',
  '/assets/images/Logo-512.png'
];

// Allowed static file types
const STATIC_EXTENSIONS = [
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.ico',
  '.webmanifest'
];

// -------------------- INSTALL --------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.log('SW install error:', err))
  );
});

// -------------------- ACTIVATE --------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// -------------------- FETCH --------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only GET requests
  if (request.method !== 'GET') return;

  // Ignore external requests
  if (url.origin !== self.location.origin) return;

  // 🚨 IMPORTANT: ignore navigation requests (fix redirect error)
  if (request.mode === 'navigate') {
    return;
  }

  // Ignore API calls
  if (url.pathname.startsWith('/api/')) return;

  // Ignore env file or sensitive files
  if (url.pathname === '/assets/js/env.js') return;

  // Only handle static assets
  if (!isStaticRequest(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Only cache valid basic responses
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(() => {
        // optional: fallback if offline
        return caches.match('/index.html');
      });
    })
  );
});

// -------------------- HELPERS --------------------
function isStaticRequest(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))
  );
}
