/**
 * Split Page - Init
 *
 * Copyright (c) 2023-2026 Francesco Ugolini
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 */

'use strict';

import { Notepad } from './notepad.js';

// Create a new notepad.
window.addEventListener('load', async () => {
    try {
        const instance = new Notepad('#notepad-entry-point');
        window.app = instance;
    } catch (err) {
        console.error(err);
    }
});

// Register the service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            await navigator.serviceWorker.register('./service_worker.js');
        } catch (err) {
            console.error('Service worker registration failed:', err);
        }
    });
}
