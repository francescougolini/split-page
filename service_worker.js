/**
 * Sidenotes - Notes App
 *
 * Copyright (c) 2023-2026 Francesco Ugolini
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
 * distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * Service worker to enable the 'offline mode'.
 */

// Cache name
const cacheName = 'sidenote-react-v1';

// List of files to be pre-cached
// In a Vite build, these paths change. A robust SW strategies usually involves
// a build step to inject the manifest. For now, we cache the root.
const preCacheResources = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(preCacheResources)));
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        }),
    );
});
