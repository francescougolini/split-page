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
const cacheName = 'sidenotes-v1';

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
