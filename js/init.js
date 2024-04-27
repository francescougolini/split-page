/**
 * Split Page - Init
 *
 * Copyright (c) 2023 Francesco Ugolini <contact@francescougolini.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
 * distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

'use strict';

import * as notepad from './notepad.js';

// Create a new notepad.
window.addEventListener('load', (event) => {
    new notepad.Notepad('#notepad-entry-point');
});

// Register the service worker to enable the 'offline mode'.
if ('serviceWorker' in navigator) {
    // Wait for the 'load' event to not block other work.
    window.addEventListener('load', async () => {
        // Try to register the service worker.
        try {
            // Capture the registration for later use, if needed
            await navigator.serviceWorker.register('./service_worker.js');
        } catch (err) {
            console.error('Service worker registration failed: ', err);
        }
    });
}
