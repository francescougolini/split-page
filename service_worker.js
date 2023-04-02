/**
 * Service worker to enable the 'offline mode'.
 */

// Cache name
const cacheName = 'split-page-v1';

// List of files to be pre-cached
const preCacheResources = [
    '/',
    '/index.html',
    '/js/init.js',
    '/js/notepad.js',
    '/js/utilities.js',
    '/css/stylesheet.css',
    '/img/favicon.png',
];

// When the service worker is installing, open the cache and add the pre-cache resources to it.
self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(preCacheResources)));
});

// On fetch request, try with a pre-cached resource, otherwise fall back to the network.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});
