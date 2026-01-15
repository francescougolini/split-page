/**
 * Split Page - Utilities
 *
 * Copyright (c) 2023-2026 Francesco Ugolini
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
 * distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

'use strict';

export { countWords, getReadTime, downloadLocalFile, uploadLocalFile, generateID, dataFallbackMode, debounce, StorageDB };

/**
 * Count the number of words in a given string, including emojis.
 *
 * @param {string} targetString The string to be processed.
 *
 * @return {number} The number of words in a string.
 */
const countWords = (targetString = '') => {
    const regex =
        /[\n\s]{0,}[a-zA-Z0-9\u00C0-\u017F\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]+[\n\s]{0,}/gu;
    const words = targetString.match(regex) || '';

    const wordNumber = words.length;

    return wordNumber;
};

/**
 * Get the time to (silently) read a text.
 */
const getReadTime = (targetString = '') => {
    const wordNumber = countWords(targetString);
    const seconds = Math.ceil(wordNumber / (238 / 60));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const formattedTime = minutes > 0 ? minutes + 'm ' + remainingSeconds + 's' : remainingSeconds + 's';

    return formattedTime;
};

/**
 * Download data as a local file.
 */
const downloadLocalFile = (data, filename, contentType) => {
    const file = new Blob([data], { type: contentType });
    const temporaryLink = document.createElement('a');

    temporaryLink.href = URL.createObjectURL(file);
    temporaryLink.download = filename;

    temporaryLink.click();

    URL.revokeObjectURL(temporaryLink.href);
    temporaryLink.remove();
};

/**
 * Upload a local file and process its content.
 */
const uploadLocalFile = (callbackAction, contentType = 'application/json') => {
    const temporaryInput = document.createElement('input');

    temporaryInput.type = 'file';
    temporaryInput.accept = contentType;

    temporaryInput.onchange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                callbackAction(event.target.result);
            } catch (error) {
                console.error('File reading failed: ' + error);
            }
        };

        reader.readAsText(file);
    };

    temporaryInput.click();
    temporaryInput.remove();
};

const generateID = (frontTag = '', backTag = '', time = Date.now()) => {
    return frontTag + time + backTag;
};

const dataFallbackMode = (oldData, newData, action) => {
    try {
        action(newData);
    } catch (error) {
        console.error('Action failed, reverting.', error);
        action(oldData);
    }
};

/**
 * Debounce function to limit the rate at which a function can fire.
 */
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * IndexedDB Wrapper for asynchronous storage.
 */
class StorageDB {
    constructor(dbName = 'SplitPageDB', storeName = 'notepads') {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async set(value) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            tx.objectStore(this.storeName).put(value);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async get(id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const request = tx.objectStore(this.storeName).get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll() {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const request = tx.objectStore(this.storeName).getAll();
            request.onsuccess = () => {
                const map = {};
                request.result.forEach((item) => (map[item.id] = item));
                resolve(map);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async delete(id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            tx.objectStore(this.storeName).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
}
