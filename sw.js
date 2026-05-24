'use strict';

const CACHE_NAME = 'vibepass-static-v3';
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
  '/assets/images/Logo-512.png',
  '/pages/events.html',
  '/pages/invitations.html',
  '/pages/login.html',
  '/pages/register.html'
];

const STATIC_EXTENSIONS = [
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.ico',
  '.webmanifest',
  '.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => null)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (isApiRequest(url)) return;
  if (url.pathname === '/assets/js/env.js') return;
  if (!isStaticRequest(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => (
      cached || fetch(request).then((response) => {
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => null);
        }
        return response;
      })
    ))
  );
});

function isApiRequest(url) {
  return url.pathname === '/api' || url.pathname.startsWith('/api/');
}

function isStaticRequest(url) {
  return STATIC_ASSETS.includes(url.pathname)
    || url.pathname.startsWith('/assets/')
    || url.pathname.startsWith('/pages/')
    || STATIC_EXTENSIONS.some((extension) => url.pathname.endsWith(extension));
}
