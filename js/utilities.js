/**
 * Split Page - Utilities
 *
 * Copyright (c) 2023 Francesco Ugolini <contact@francescougolini.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
 * distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

'use strict';

export { countWords, getReadTime, downloadLocalFile, uploadLocalFile, generateID, dataFallbackMode };

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
 *
 * The formula takes into consideration average value in English (silent reading it is 238, reading aloud it is 183).
 * NOTE: numbers are treated as words without being transliterated.
 *
 * @param {string} targetString The string to be processed.
 *
 * @return {number} The seconds required on average to silently read the string.
 */
const getReadTime = (targetString = '') => {
    const wordNumber = countWords(targetString);

    const timeToReadString = Math.ceil(wordNumber / (283 / 60));

    return timeToReadString;
};

/**
 * Locally download the data as a file.
 *
 * @param {Object} content The content to be locally downloaded.
 * @param {String} contentType The MIME type of the file to be generated. Options: 'data:application/json' (default) or 'data:text/plain';
 */
const downloadLocalFile = (content, filename, contentType = 'data:application/json') => {
    try {
        let processedContent;

        if (contentType == 'data:application/json') {
            processedContent = JSON.stringify(content);
        } else if (contentType == 'data:text/plain') {
            processedContent = content;
        } else {
            alert('MIME type not supported: "' + contentType + '"');
            return;
        }

        // Encode the content to ensure all special characters are escaped.
        const hrefValue = contentType + ';charset=utf-8,' + encodeURIComponent(processedContent);

        const temporaryLink = document.createElement('a');
        temporaryLink.setAttribute('href', hrefValue);
        temporaryLink.setAttribute('download', filename);
        temporaryLink.click();
        temporaryLink.remove();
    } catch (error) {
        alert('File not downloaded. \nDetails: "' + error + '"');
    }
};

/**
 * Locally upload the content of a file.
 *
 * @param {Function} callbackAction The action to be performed to use the uploaded JSON file.
 * @param {String} contentType The MIME type of the file uploaded. Default: 'data:application/json'
 */
const uploadLocalFile = (callbackAction, contentType = 'data:application/json') => {
    const temporaryInput = document.createElement('input');
    temporaryInput.type = 'file';
    temporaryInput.accept = contentType;

    // Add event listener to the temporary input
    temporaryInput.onchange = (event) => {
        const file = temporaryInput.files.item(0);

        const reader = new FileReader();

        reader.addEventListener('load', () => {
            try {
                const fileContent = reader.result;
                callbackAction(fileContent);
            } catch (error) {
                alert('File not uploaded. \nDetails: "' + error + '"');
            }
        });

        reader.readAsText(file);
    };

    temporaryInput.click();
    temporaryInput.remove();
};

/**
 * Generate an id using the UNIX time when the function is called and two optional front/back tags.
 *
 * Format: {frontTag}-{UNIX Time}-{backTag}
 *
 * @param {String} frontTag An optional string to be prepended to the UNIX time.
 * @param {String} backTag An optional string to be appended to the UNIX time.
 * @param {String} time The UNIX time to be used to build the id.
 *
 * @returns A string with a conventional/formatted id.
 */
const generateID = (frontTag = '', backTag = '', time = Date.now()) => {
    return frontTag + time + backTag;
};

/**
 * Run an action with a new data and, in case it fails, use the old data to return to the previous state.
 *
 * @param {Object} oldData The data that represent the 'original state'.
 * @param {Object} newData The data that will be used to change the 'original state'.
 * @param {Function} action A function that accepts the data as its argument.
 */
const dataFallbackMode = (oldData, newData, action) => {
    try {
        // Run the action with the new data.
        action(newData);
    } catch (error) {
        // Run the action with the old data to restore the original state.
        action(oldData);

        // Show an alert with an error message.
        alert('The action could not be performed.\n' + error);
    }
};
