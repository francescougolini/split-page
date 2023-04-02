/**
 * Split Page - Notepad
 *
 * Copyright (c) 2023 Francesco Ugolini <contact@francescougolini.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
 * distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

'use strict';

import * as utilities from './utilities.js';

export { Notepad };

/** Class representing a notepad. */
class Notepad {
    #entryPoint;
    #notepad;
    #header;
    #notesContainer;
    #toolbox;
    #notepadsViewer;
    #notepadObserver;
    #notepadObserverOptions;

    #notesContainerIndex = new Map();

    #defaults = {
        accentColors: ['', '#fde6e6', '#ebf2f9', '#fefbe6', '#feddc9', '#e5f4da', '#f2eef9'],
        branding: {
            about: 'https://github.com/francescougolini/split-page',
            logo: `<svg aria-label="Split Page logo" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="svg-icon logo" viewBox="0 0 244 255" focusable="false" >
                <!-- Copyright (c) 2023 Francesco Ugolini - All right reserved -->
                <path fill-rule="evenodd" d="m 139.774,0.381005 c -43.8,0 -87.6,10.401 -108.403,31.203 -41.605,41.604995 -41.605,175.203995 0,216.798995 41.605,41.595 175.204,41.595 216.799,0 41.595,-41.595 41.595,-175.194 0,-216.798995 -20.797,-20.802 -64.597,-31.203 -108.396,-31.203 z m -13.459,39.615 h 33.681 c 20.626,1.697 36.135,21.633995 36.766,41.089995 0,14.78801 0,14.36001 0,24.696 -8.645,0.024 -25.152,0.14501 -34.627,0.004 0,-5.59 0,-8.476 0,-14.35 -0.788,-6.868 -4.762,-14.311 -14.154,-14.488 h -9.84 c -12.304,-0.375 -18.776,14.495 -9.377,26.404 21.543,22.772 29.802,30.464 49.855,54.078 29.429,33.767 21.169,76.574 -18.619,82.57 h -33.681 c -12.166,-0.404 -38.052,-4.36899 -38.942,-45.754 0,-12.836 0.317,-2.308 -0.002,-17.324 11.299,0 24.704,-0.283 34.735,-0.283 0,0 -0.004,6.457 -0.004,11.289 0.599,8.519 2.926,13.819 10.369,14.836 l 13.088,-0.566 c 10.251,0.957 19.944,-11.531 4.267,-27.43 -13.929,-15.818 -44.279,-45.765 -49.445,-51.305 l 0.002,0.016 C 75.871,90.631 91.157,39.855005 126.319,39.996005 Z" transform="matrix(0.87392363,0,0,0.91332058,0.02108468,0.0330224)"/>
            </svg>`,
            name: 'Split Page',
        },
        notepadTitle: 'New notepad',
        noteTitle: 'New note',
        tags: {
            note: 'note',
            notepad: 'notepad',
        },
    };

    // Add default colors as initial accent colors. This allows to later include additional colors.
    #accentColors = [...this.#defaults.accentColors];

    /**
     * Create a new notepad.
     *
     * @param {String} entryPoint The selector of the element that will contain the notepad. Default: document.body
     */
    constructor(entryPoint = undefined) {
        this.#entryPoint = entryPoint ? document.querySelector(entryPoint) : document.body;
        this.#entryPoint.classList.add('entry-point');

        // Notepad
        this.#notepad = document.createElement('div');
        this.#notepad.classList.add('notepad');

        this.#entryPoint.insertAdjacentElement('beforeend', this.#notepad);

        // Notepad - Initial ID
        this.#notepad.id = utilities.generateID(this.#defaults.tags.notepad, undefined, Date.now());

        // Notepad - Initial timestamps
        const currentTime = Date.now();
        this.#notepad.dataset.notepadCreated = currentTime;
        this.#notepad.dataset.notepadLastUpdate = currentTime;

        // Notepad - Header
        this.#header = this.#addHeader(this.#defaults.notepadTitle, this.#notepad);

        // Notepad - Notes container and first note
        this.#notesContainer = this.#addNotesContainer(true, this.#notepad);

        // Toolbox
        this.#toolbox = this.#addToolbox(this.#entryPoint);

        // Notepads viewer
        this.#notepadsViewer = this.#addNotepadsViewer();

        // Notepad observer - Enable notepad's auto saving
        this.#notepadObserverOptions = { characterData: true, attributes: true, childList: true, subtree: true };

        this.#notepadObserver = new MutationObserver(() => {
            // Update the notepads's last update data attribute.
            this.#notepad.dataset.notepadLastUpdate = Date.now();

            // Add notepad to the local storage.
            this.#storeNotepad();
        });

        // Notepad observer - Observe the header and the notes' container
        this.#notepadObserver.observe(this.#header, this.#notepadObserverOptions);
        this.#notepadObserver.observe(this.#notesContainer, this.#notepadObserverOptions);
    }

    // Data processing

    /**
     * Format:
     *
     * {
     *      title: {String},
     *      id: {String},
     *      created: {Number}
     *      lastUpdate: {Number},
     *      notes: [
     *          {
     *              id: {String},
     *              title: {String},
     *              content: {String},
     *              accentColor: {string} - Hex color code.
     *          }
     *      ]
     * }
     */

    /**
     * Retrieve the data contained in a notepad content (title and notes) as a JSON file.
     *
     * @return An Object representing the notepad.
     */
    #retrieveNotepad() {
        const notes = this.#notesContainer.querySelectorAll('.note');

        // Notepad - ID
        const notepadID = this.#notepad.id;

        // Notepad - Timestamps
        const currentTime = Date.now();
        const notepadCreated = Number(this.#notepad.dataset.notepadCreated) || currentTime;

        // Notepad - Title
        const notepadTitle = this.#header.innerText;

        // Create a new notepad object.
        const notepad = {
            title: notepadTitle,
            id: notepadID,
            created: notepadCreated,
            lastUpdate: currentTime,
            notes: [],
        };

        // Notepad - Notes
        for (const note of notes) {
            const noteObject = {
                id: note.id || '',
                title: note.querySelector('.note-title').innerText || '',
                content: note.querySelector('.note-text').innerText || '',
                accentColor: note.querySelector('.note-title-container').getAttribute('data-accent-color') || '',
            };

            notepad.notes.push(noteObject);
        }

        return notepad;
    }

    /**
     * Add the notepad to the DOM.
     *
     * @param {String} notepad The notepad to be used to fill the DOM.
     * @param {Boolean} clear If true, clear the existing content before filling the notepad with the new one.
     */
    #fillNotepad(notepad, clear = true) {
        // If provided in the parameters, clear the notepad.
        if (clear) {
            this.newNotepad(false);
        }

        // Notepad - ID
        this.#notepad.id = notepad.id;

        // Notepad - Timestamps
        this.#notepad.dataset.notepadCreated = notepad.created;
        this.#notepad.dataset.notepadLastUpdate = notepad.lastUpdate;

        // Notepad - Title
        this.#header.innerText = notepad.title;

        // Notepad - Notes
        if (notepad.notes && notepad.notes.length > 0) {
            // Add the imported notes.
            notepad.notes.forEach((noteProperties) => {
                this.newNote(noteProperties, this.#notesContainer);
            });
        }
    }

    /**
     * Add a new note to the notepad.
     *
     * @param {Object} noteProperties The object containing the properties of the note.
     * @param {Element} parentElement The parent element where to insert the note.
     */
    newNote(noteProperties = {}, parentElement = this.#notesContainer) {
        const index = this.#notesContainerIndex.size + 1;

        const noteID = noteProperties.id || utilities.generateID(this.#defaults.tags.note, index);
        const title = noteProperties.title === '' || noteProperties.title ? noteProperties.title : this.#defaults.noteTitle;
        const content = noteProperties.content || '';

        // Hex colors to customise note. Values are converted to lowercase.
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        const accentColor =
            noteProperties.accentColor && hexColorRegex.test(noteProperties.accentColor)
                ? noteProperties.accentColor.toLowerCase()
                : '';

        // Add color code if it's not already included in the list of accent colors.
        if (!this.#accentColors.includes(accentColor)) {
            this.#accentColors.push(accentColor);
        }

        // Create the note's HTML code.
        const newNote = this.#createNote(noteID, title, content, accentColor, index);

        // Add new note to the DOM.
        parentElement.insertAdjacentElement('beforeend', newNote);

        // Enable the counters for the note, e.g. word counter.
        this.#runNoteCounters(noteID);

        // Add the new note to the notes index.
        this.#notesContainerIndex.set(this.#notesContainerIndex.size + 1, noteID);

        // Re-index notes.
        this.#indexNotes();
    }

    /**
     * Rebuild the notes index map to ensure no gaps between keys.
     *
     * @param {String} noteID The DOM id of the object containing the properties of the note.
     */
    deleteNote(noteID) {
        const note = document.getElementById(noteID);

        // Remove note from the DOM.
        note.remove();

        // Remove note from the index.
        const index = note.getAttribute('data-note-index');

        const originalNoteIndex = new Map(this.#notesContainerIndex);

        this.#notesContainerIndex.delete(parseInt(index));

        // Clear the notes index.
        this.#notesContainerIndex.clear();

        for (let key = 1; key <= originalNoteIndex.size; key++) {
            if (originalNoteIndex.get(key) && key < index) {
                this.#notesContainerIndex.set(key, originalNoteIndex.get(key));
            } else if (originalNoteIndex.get(key) && key > index) {
                this.#notesContainerIndex.set(key - 1, originalNoteIndex.get(key));
            }
        }

        // Rebuild the notes index.
        this.#indexNotes();
    }

    /**
     * Change the position of the note in the notepad.
     *
     * @param {String} noteID The DOM id of the object containing the properties of the note.
     * @param {Number} oldIndex The initial index (position) of the note.
     * @param {Number} newIndex The new index (position) of the note.
     */
    moveNote(noteID, oldIndex, newIndex) {
        const note = document.getElementById(noteID);

        if (note) {
            // Check if the new typed position is within min-max range.
            newIndex = newIndex <= this.#notesContainerIndex.size ? newIndex : this.#notesContainerIndex.size;

            const currentNote = this.#notesContainer.querySelector('[data-note-index="' + newIndex + '"]');

            // Remove the note from the index to ensure its correct repositioning.
            note.dataset.noteIndex = undefined;

            // Add the new index to the HTML element of the note.
            const noteIndexContainer = note.querySelector('.note-index');
            noteIndexContainer.value = newIndex;
            noteIndexContainer.defaultValue = newIndex;

            // Remove the note from the DOM.
            document.getElementById(note.id).remove();

            const cachedMovedNoteID = this.#notesContainerIndex.get(oldIndex);
            const cachedNoteID = this.#notesContainerIndex.get(newIndex);

            if (newIndex < oldIndex) {
                // Re-insert the note in its new position.
                this.#notesContainer.insertBefore(note, currentNote);

                const cachedNoteIDs = [this.#notesContainerIndex.get(newIndex + 1)];

                this.#notesContainerIndex.set(newIndex + 1, cachedNoteID);

                this.#notesContainerIndex.set(newIndex, cachedMovedNoteID);

                for (const [index, id] of this.#notesContainerIndex) {
                    if (index > newIndex + 1 && index <= oldIndex) {
                        cachedNoteIDs.push(this.#notesContainerIndex.get(index));
                        this.#notesContainerIndex.set(index, cachedNoteIDs[cachedNoteIDs.length - 2]);
                    }
                }
            } else {
                // Re-insert the note in its new position.
                this.#notesContainer.insertBefore(note, currentNote.nextSibling);

                for (const [index, id] of this.#notesContainerIndex) {
                    if (index >= oldIndex && index < newIndex) {
                        this.#notesContainerIndex.set(index, this.#notesContainerIndex.get(index + 1));
                    } else if (index == newIndex) {
                        this.#notesContainerIndex.set(index, cachedMovedNoteID);
                    }
                }
            }

            this.#indexNotes();
        }
    }

    /**
     * Change the accent color of the note from a list of available colors.
     *
     * @param {String} noteID The DOM id of the object containing the properties of the note.
     */
    #changeNoteAccentColor(noteID) {
        const note = document.getElementById(noteID);

        const noteTitleContainer = note.querySelector('.note-title-container');

        const currentColor = noteTitleContainer.getAttribute('data-accent-color')
            ? noteTitleContainer.getAttribute('data-accent-color').toLowerCase()
            : '';

        if (this.#accentColors.includes(currentColor)) {
            const currentColorIndex = this.#accentColors.indexOf(currentColor);

            if (currentColorIndex != this.#accentColors.length - 1) {
                const nextColor = this.#accentColors[currentColorIndex + 1];

                noteTitleContainer.style.backgroundColor = nextColor || 'inherit';
                noteTitleContainer.dataset.accentColor = nextColor || '';
            } else {
                const nextColor = this.#accentColors[0];

                noteTitleContainer.style.backgroundColor = nextColor || 'inherit';
                noteTitleContainer.dataset.accentColor = nextColor || '';
            }
        } else {
            // In case the color is not specified, start from the beginning.
            const nextColor = this.#accentColors[0];

            // Change colors to the container of the note title.
            noteTitleContainer.style.backgroundColor = nextColor || 'inherit';
            noteTitleContainer.dataset.accentColor = nextColor || '';
        }
    }

    /**
     * Count the number of characters and words in each note and measure the time to silently read the text.
     *
     * @param {String} noteID The DOM id of the object containing the properties of the note.
     */
    #runNoteCounters(noteID) {
        const note = document.getElementById(noteID);

        const noteText = note.querySelector('.note-text').innerText;

        const characterCounter = note.querySelector('.character-counter');
        const wordCounter = note.querySelector('.word-counter');

        const readTimeCounter = note.querySelector('.time-counter');

        // Count characters
        characterCounter.innerText = noteText.length;

        // Count words
        wordCounter.innerText = utilities.countWords(noteText);

        // Get read time
        readTimeCounter.innerText = utilities.getReadTime(noteText);
    }

    /**
     * Determine the index of each note and the min-max range.
     */
    #indexNotes() {
        for (const [index, id] of this.#notesContainerIndex) {
            // Add the new index values to the note.
            const note = document.getElementById(this.#notesContainerIndex.get(index));

            note.dataset.noteIndex = index;

            const noteIndexContainer = note.querySelector('.note-index');

            noteIndexContainer.value = index;
            noteIndexContainer.defaultValue = index;
            noteIndexContainer.max = this.#notesContainerIndex.size;
        }
    }

    /**
     * Add the notes container to the DOM and include a new empty note.
     *
     * @param {Boolean} addNewNote If true, add a new empty note to the cleared notepad.
     * @param {Element} parentElement The parent element where to insert the notes container.
     *
     * @returns The HTML element representing the notes container.
     */
    #addNotesContainer(addNewNote = false, parentElement = this.#notepad) {
        const notesContainer = document.createElement('div');
        notesContainer.classList.add('notes-container');

        parentElement.insertAdjacentElement('beforeend', notesContainer);

        // If provided, add a new empty note.
        if (addNewNote) {
            this.newNote(undefined, notesContainer);
        }

        return notesContainer;
    }

    // Notepad-related methods

    /**
     * Add notepad's controls in the DOM.
     *
     * @param {Element} parentElement The parent element where to insert the controls.
     *
     * @returns The HTML element representing the toolbox.
     */
    #addToolbox(parentElement = this.#entryPoint) {
        const toolbox = this.#createToolbox();
        parentElement.insertAdjacentElement('beforeend', toolbox);

        return toolbox;
    }

    /**
     * Export the content of a notepad as a file.
     *
     * @param {Object} notepad The notepad to be exported.
     */
    #exportNotepad(notepad) {
        const exportedNotepad = notepad || this.#retrieveNotepad();
        const notepadTitle = exportedNotepad.title;

        // Remove non-alphanumeric characters.
        const filename = notepadTitle.replace(/[^\p{L}^\p{N}]+/gu, ' ').trim() + '.notepad.json';

        utilities.downloadLocalFile(exportedNotepad, filename, 'data:application/json');
    }

    /**
     * Import an existing notepad from a JSON file.
     *
     * @param {Function} customCallback A callback to run additional post-import actions.
     */
    #importNotepad(customCallback = undefined) {
        utilities.uploadLocalFile((notepadJSON) => {
            const notepad = JSON.parse(notepadJSON);

            if (notepad && notepad.notes) {
                // The function to import the notepad and add notepads list.
                const importNotepad = () => {
                    this.#fillNotepad(notepad, true);
                    this.#storeNotepad(notepad);

                    if (customCallback) {
                        customCallback(notepad);
                    }

                    this.#updateNotepadsList();
                };

                // If a notepad with the same ID already exist, ask what to do.
                if (this.#getStoredNotepad(notepad.id)) {
                    // Note toolbox - Controls - Delete note - Confirmation dialog
                    const replaceExistingNotepadDialog = this.#createDialog('A version of this notepad already exists', [
                        {
                            action: () => {
                                // Change ID
                                notepad.id = utilities.generateID(this.#defaults.tags.notepad, undefined, Date.now());

                                // Import notepad
                                importNotepad();

                                // Remove dialog from DOM.
                                replaceExistingNotepadDialog.remove();
                            },
                            actionLabel: 'Keep both notepads',
                            customClasses: ['dialog-button-standard'],
                        },
                        {
                            action: () => {
                                // Import notepad.
                                importNotepad();

                                // Remove dialog from DOM.
                                replaceExistingNotepadDialog.remove();
                            },
                            actionLabel: 'Replace existing notepad',
                            customClasses: ['dialog-button-standard'],
                        },
                        {
                            action: () => {
                                // Remove dialog from DOM.
                                replaceExistingNotepadDialog.remove();
                            },
                            actionLabel: 'Cancel',
                            customClasses: ['dialog-button-standard'],
                        },
                    ]);

                    this.#entryPoint.insertAdjacentElement('beforeend', replaceExistingNotepadDialog);

                    replaceExistingNotepadDialog.showModal();
                } else {
                    // Just import the notepad.
                    importNotepad();
                }
            } else {
                alert('Error - Notepad not imported.');
            }
        }, 'data:application/json');
    }

    /**
     * Create a JSON-formatted backup copy of all notepads in the local storage.
     */
    #backupNotepads() {
        const notepads = this.#getAllStoredNotepads();
        const filename = 'notepads_' + Date.now() + '.backup.json';

        utilities.downloadLocalFile(notepads, filename, 'data:application/json');
    }

    /**
     * Restore a backup of notepads from a backup JSON-formatted file to the local storage.
     */
    #restoreNotepads() {
        utilities.uploadLocalFile((notepadsJSON) => {
            const notepads = JSON.parse(notepadsJSON);

            if (notepads && Object.keys(notepads).length > 0) {
                // Run the action in fallback mode to prevent the corruption of the local storage.
                utilities.dataFallbackMode(this.#getAllStoredNotepads(), notepads, (notepads) => {
                    // Replace locally stored notepads.
                    this.#replaceStoredNotepads(notepads);

                    // Update the notepads list.
                    this.#updateNotepadsList();

                    // Replace currently opened notepad with an empty one.
                    this.newNotepad(true);
                });
            }
        }, 'data:application/json');
    }

    /**
     * Create a duplicate of a notepad.
     *
     * @param {Object} notepad The notepad to be duplicated.
     *
     * @return  An Object representing the duplicated notepad.
     */
    #duplicateNotepad(notepad) {
        // Clone the existing notepad,generate a new id for it.
        const duplicatedNotepad = Object.assign({}, notepad);

        // Generate a new id for the duplicated notepad.
        duplicatedNotepad.id = utilities.generateID(this.#defaults.tags.notepad, undefined, Date.now());

        // Append '(Copy)' to the title of the newly duplicate notepad.
        duplicatedNotepad.title = duplicatedNotepad.title + ' (Copy)';

        // Add new timestamps to the duplicated notepad.
        const currentTime = Date.now();

        duplicatedNotepad.created = currentTime;
        duplicatedNotepad.lastUpdate = currentTime;

        // Store the duplicated notepad in the local storage.
        this.#storeNotepad(duplicatedNotepad);

        return duplicatedNotepad;
    }

    /**
     * Create a new notepad and open it.
     *
     * @param {Boolean} addNewNote If true, add a new empty note to the cleared notepad.
     */
    newNotepad(addNewNote = true) {
        // Disconnect the notepad observer to avoid the new notepad to be autosaved.
        this.#notepadObserver.disconnect();

        // Empty the notepad container.
        this.#notesContainer.replaceChildren();

        // Reset the notes index.
        this.#notesContainerIndex.clear();

        // If specified, add a new empty note.
        if (addNewNote) {
            this.newNote(undefined, this.#notesContainer);
        }

        // Create a new notepad ID
        this.#notepad.id = utilities.generateID(this.#defaults.tags.notepad, undefined, Date.now());

        // Reset the notepad-related timestamps.
        const currentTime = Date.now();
        this.#notepad.dataset.notepadCreated = currentTime;
        this.#notepad.dataset.notepadLastUpdate = currentTime;

        // Reset the notepad title to the default one.
        this.#header.innerText = this.#defaults.notepadTitle;

        // Restore accent colors to the default ones.
        this.#accentColors = [...this.#defaults.accentColors];

        // Reactivate the notepad observer to enable autosave and keep track of changes.
        this.#notepadObserver.observe(this.#header, this.#notepadObserverOptions);
        this.#notepadObserver.observe(this.#notesContainer, this.#notepadObserverOptions);
    }

    // Notepad controls - Delete notepad

    /**
     * Delete a notepad.
     *
     * @param {String} notepadID The id of the notepad to be deleted.
     * @param {Function} customCallback A callback to run additional post-delete actions.
     */
    deleteNotepad(notepadID, customCallback = undefined) {
        // If it's the open notepad, replace it with an empty one.
        if (notepadID == this.#notepad.id) {
            this.newNotepad(true);
        }

        // Remove the notepad from the local storage.
        this.#removeStoredNotepad(notepadID);

        // If provided, run the post-delete callback.
        if (customCallback) {
            customCallback();
        }
    }

    /**
     * Add the header to the notepad.
     *
     * @param {String} notepadTitle The text to be used as notepad's title.
     * @param {Element} parentElement The parent element containing the header.
     *
     * @returns The HTML element representing the header.
     */
    #addHeader(notepadTitle, parentElement = this.#notepad) {
        const header = this.#createHeader(notepadTitle);
        header.classList.add('notepad-title');

        parentElement.insertAdjacentElement('beforeend', header);

        return header;
    }

    /**
     * Add a dialog element to the DOM.
     *
     * @param {Element} parentElement The parent element where to insert the dialog.
     *
     * @return The newly-created dialog.
     */
    #addConfirmationDialog(action, actionLabel, message, customClasses, parentElement = this.#entryPoint) {
        const dialog = this.#createConfirmationDialog(action, actionLabel, message, customClasses);
        parentElement.insertAdjacentElement('beforeend', dialog);

        return dialog;
    }

    /** Notepads management and local storage */

    /**
     * Format:
     *      notepads: {
     *          [[Notepad id (as key)]]: {
     *               ...see Data processing
     *           },
     *          ...
     *      }
     */

    /**
     * Add the notepad to the local storage.
     *
     * @param {Object} notepad The notepad to be stored.
     */
    #storeNotepad(notepad = undefined) {
        // Get the current notepads stored in the local storage.
        const notepads = localStorage.getItem('notepads');
        const notepadsObject = notepads ? JSON.parse(notepads) : {};

        // If not specified, retrieve the content from the open notepad.
        const toBeStoredNotepad = notepad || this.#retrieveNotepad();

        if (toBeStoredNotepad) {
            // Add - or, if it exists, replace - current notepad to the local storage.
            notepadsObject[toBeStoredNotepad.id] = toBeStoredNotepad;
            const notepadJSON = JSON.stringify(notepadsObject);

            try {
                localStorage.setItem('notepads', notepadJSON);
            } catch (error) {
                alert('Local storage error.\n' + error);
            }
        }
    }

    /**
     * Remove a notepad from the local storage.
     *
     * @param {String} notepadID The id of the notepad to be removed.
     */
    #removeStoredNotepad(notepadID) {
        const notepads = localStorage.getItem('notepads');
        const notepadsObject = notepads ? JSON.parse(notepads) : {};

        delete notepadsObject[notepadID];

        const notepadJSON = JSON.stringify(notepadsObject);

        try {
            localStorage.setItem('notepads', notepadJSON);
        } catch (error) {
            alert('Local storage error.\n' + error);
        }
    }

    /**
     * Replace the notepads in the local storage with new ones.
     *
     * @param {Object} notepads The object containing the new replacing notepads.
     */
    #replaceStoredNotepads(notepads) {
        const notepadsJSON = JSON.stringify(notepads);

        try {
            localStorage.setItem('notepads', notepadsJSON);
        } catch (error) {
            alert('Local storage error.\n' + error);
        }
    }

    /**
     * Retrieve all the notepads from the local storage.
     *
     * @returns An object representing the retrieved notepads.
     */
    #getAllStoredNotepads(notepadID = undefined) {
        const notepadsJSON = localStorage.getItem('notepads');
        const notepads = notepadsJSON ? JSON.parse(notepadsJSON) : {};

        return notepads;
    }

    /**
     * Retrieve a notepad from the local storage.
     *
     * @param {String} notepadID The id of the notepad to be retrieved.
     *
     * @returns An object representing the retrieved notepad.
     */
    #getStoredNotepad(notepadID = undefined) {
        const notepadsJSON = localStorage.getItem('notepads');
        const notepads = notepadsJSON ? JSON.parse(notepadsJSON) : {};

        return notepads[notepadID];
    }

    /**
     * Add the notepads viewer to the DOM.
     *
     * @param {Element} parentElement The parent element where to insert the notepads viewer.
     *
     * @return The element representing the notepads viewer.
     */
    #addNotepadsViewer(parentElement = this.#entryPoint) {
        // Create and include the notepads viewer to the DOM.
        const notepadsViewer = this.#createNotepadsViewer();
        parentElement.insertAdjacentElement('beforeend', notepadsViewer);

        return notepadsViewer;
    }

    /**
     * Update the notepads list.
     *
     * @param notepads The notepads to be added in the new list.
     * @param notepadsList The DOM element with the notepads list to be updated.
     */
    #updateNotepadsList(notepads = undefined, notepadsList = undefined) {
        notepads = notepads || this.#getAllStoredNotepads();
        notepadsList = notepadsList || this.#notepadsViewer.querySelector('.viewer-notepads-list');

        // Sort notepads by last update, from the most recent notepad to the least one.
        let notes = [];
        for (const notepad in notepads) {
            notes.push([notepads[notepad].id, notepads[notepad].lastUpdate]);
        }

        const sortedNotes = notes.sort((a, b) => b[1] - a[1]);

        // Clean the existing notepad list.
        notepadsList.replaceChildren();

        // For each notepad create a line.
        if (Object.keys(notepads).length > 0) {
            // Add notepads to the empty notepad list.
            for (let index = 0; index < sortedNotes.length; index++) {
                const notepadsListItem = this.#createNotepadsListItem(notepads[sortedNotes[index][0]]);
                notepadsList.insertAdjacentElement('beforeend', notepadsListItem);
            }
        }
    }

    /** HTML Components */

    /**
     * Create the HTML element representing the note.
     *
     * @param {string} noteID The DOM id to be assigned to the note.
     * @param {string} noteTitle The title of the note.
     * @param {string} noteText The text of the note.
     * @param {string} noteAccentColor The color to be used to style the note's title container.
     * @param {number} noteIndex The position of the note in the notepad.
     *
     * @returns The HTML element representing the note.
     */
    #createNote(noteID, noteTitle, noteText, noteAccentColor, noteIndex = 0) {
        const note = document.createElement('div');
        note.id = noteID;
        note.classList.add('note');

        // Note title
        const titleContainer = document.createElement('div');
        titleContainer.classList.add('note-title-container');
        titleContainer.dataset.accentColor = noteAccentColor;
        titleContainer.style.backgroundColor = noteAccentColor;

        const title = document.createElement('h2');
        title.contentEditable = 'plaintext-only';
        title.classList.add('note-title', 'editable');
        title.innerText = noteTitle;
        titleContainer.insertAdjacentElement('beforeend', title);

        note.insertAdjacentElement('beforeend', titleContainer);

        // Note text
        const textContainer = document.createElement('div');
        textContainer.classList.add('note-text-container');

        const text = document.createElement('div');
        text.contentEditable = 'plaintext-only';
        text.classList.add('note-text');
        text.innerText = noteText;
        textContainer.insertAdjacentElement('beforeend', text);

        note.insertAdjacentElement('beforeend', textContainer);

        // Note toolbox
        const toolbox = document.createElement('div');
        toolbox.classList.add('note-toolbox-container');

        // Note toolbox - Insights
        const insights = document.createElement('div');
        insights.classList.add('note-insights');

        // Note toolbox - Insights - Character counter
        const characterCounter = this.#createNoteInsight('C:', 'Characters', 'character-counter');
        insights.insertAdjacentElement('beforeend', characterCounter);

        // Note toolbox - Insights - Word counter
        const wordCounter = this.#createNoteInsight('W:', 'Words', 'word-counter');
        insights.insertAdjacentElement('beforeend', wordCounter);

        // Note toolbox - Insights - Time counter
        const timeCounter = this.#createNoteInsight('S:', 'Time (sec)', 'time-counter');
        insights.insertAdjacentElement('beforeend', timeCounter);

        // Note toolbox - Controls
        const controls = document.createElement('div');
        controls.classList.add('note-controls');

        // Note toolbox - Controls - Copy text
        const copyTextControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path d="M13 0H6a2 2 0 0 0-2 2 2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 13V4a2 2 0 0 0-2-2H5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1zM3 4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
            </svg>`,
            'Copy text',
            ['note-control-container'],
            ['note-control', 'hovering-label', 'copy-text'],
            (event) => {
                this.#copyNoteText(event.target);
            }
        );

        controls.insertAdjacentElement('beforeend', copyTextControl);

        // Note toolbox - Controls - Download note
        const downloadNoteControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.354 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293V6.5z"/>
                <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
            </svg>`,
            'Download note',
            ['note-control-container'],
            ['note-control', 'hovering-label', 'download-note'],
            (event) => {
                this.#downloadNote(event.target);
            }
        );

        controls.insertAdjacentElement('beforeend', downloadNoteControl);

        // Note toolbox - Controls - Change accent color
        const changeAccentColorControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path fill-rule="evenodd" d="M7.21.8C7.69.295 8 0 8 0c.109.363.234.708.371 1.038.812 1.946 2.073 3.35 3.197 4.6C12.878 7.096 14 8.345 14 10a6 6 0 0 1-12 0C2 6.668 5.58 2.517 7.21.8zm.413 1.021A31.25 31.25 0 0 0 5.794 3.99c-.726.95-1.436 2.008-1.96 3.07C3.304 8.133 3 9.138 3 10a5 5 0 0 0 10 0c0-1.201-.796-2.157-2.181-3.7l-.03-.032C9.75 5.11 8.5 3.72 7.623 1.82z"/>
                <path fill-rule="evenodd" d="M4.553 7.776c.82-1.641 1.717-2.753 2.093-3.13l.708.708c-.29.29-1.128 1.311-1.907 2.87l-.894-.448z"/>
            </svg>`,
            'Accent color',
            ['note-control-container'],
            ['note-control', 'hovering-label', 'change-accent-color'],
            (event) => {
                const noteID = event.target.closest('.note').id;
                this.#changeNoteAccentColor(noteID);
            }
        );

        controls.insertAdjacentElement('beforeend', changeAccentColorControl);

        // Note toolbox - Controls - Delete note - Confirmation dialog
        const deleteNoteDialog = this.#addConfirmationDialog(
            () => {
                if (noteID) {
                    this.deleteNote(noteID);
                }
            },
            'Delete',
            'Delete note?',
            ['delete-note-dialog', 'delete-' + noteID],
            note
        );

        // Note toolbox - Controls - Delete note
        const deleteNoteControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
            </svg>`,
            'Delete note',
            ['note-control-container'],
            ['note-control', 'hovering-label', 'delete-note'],
            (event) => {
                deleteNoteDialog.showModal();
            }
        );

        controls.insertAdjacentElement('beforeend', deleteNoteControl);

        // Note toolbox - Controls - Move note
        const moveNoteContainer = document.createElement('div');
        moveNoteContainer.classList.add('note-control-container');

        const moveNoteWrap = document.createElement('div');
        moveNoteWrap.classList.add('note-control', 'hovering-label', 'move-note');
        moveNoteWrap.ariaLabel = 'Move note';

        const moveNoteControl = document.createElement('input');
        moveNoteControl.type = 'number';
        moveNoteControl.min = 1;
        moveNoteControl.max = noteIndex;
        moveNoteControl.classList.add('note-index', 'editable');
        moveNoteControl.ariaLabel = 'Note index';
        moveNoteWrap.insertAdjacentElement('beforeend', moveNoteControl);

        moveNoteContainer.insertAdjacentElement('beforeend', moveNoteWrap);

        controls.insertAdjacentElement('beforeend', moveNoteContainer);

        toolbox.insertAdjacentElement('beforeend', insights);
        toolbox.insertAdjacentElement('beforeend', controls);

        note.insertAdjacentElement('beforeend', toolbox);

        // Event listeners

        // Input events
        text.addEventListener(
            'input',
            (event) => {
                const noteID = event.target.closest('.note').id;
                this.#runNoteCounters(noteID);
            },
            false
        );

        // Event listener - Move note
        moveNoteControl.addEventListener(
            'change',
            (event) => {
                // Update the notes index when the position of the note is changed.
                const isNoteIndex = event.target.classList.contains('note-index');

                if (isNoteIndex && event.target.value) {
                    const oldIndex = parseInt(event.target.defaultValue);
                    const noteID = this.#notesContainer.querySelector('[data-note-index="' + oldIndex + '"]').id;
                    const newIndex = parseInt(event.target.value);

                    this.moveNote(noteID, oldIndex, newIndex);
                }
            },
            false
        );

        return note;
    }

    /**
     * Add the toolbox to the DOM and enable event listeners.
     *
     * @returns The HTML element representing the toolbox.
     */
    #createToolbox() {
        const toolbox = document.createElement('div');
        toolbox.classList.add('toolbox');

        // Toolbox - Branding
        const branding = document.createElement('div');
        branding.innerHTML = this.#defaults.branding.logo;
        branding.classList.add('toolbox-element', 'branding');

        toolbox.insertAdjacentElement('beforeend', branding);

        // Toolbox - Notepad controls - New note
        const newNoteControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path d="M0 4a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v4a.5.5 0 0 1-1 0V7H1v5a1 1 0 0 0 1 1h5.5a.5.5 0 0 1 0 1H2a2 2 0 0 1-2-2V4Zm1 2h13V4a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2Z"/>
                <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-3.5-2a.5.5 0 0 0-.5.5v1h-1a.5.5 0 0 0 0 1h1v1a.5.5 0 0 0 1 0v-1h1a.5.5 0 0 0 0-1h-1v-1a.5.5 0 0 0-.5-.5Z"/>
            </svg>`,
            'Add note',
            ['toolbox-element'],
            ['toolbox-control', 'hovering-label', 'add-note'],
            (event) => {
                this.newNote(undefined, this.#notesContainer);
            }
        );

        toolbox.insertAdjacentElement('beforeend', newNoteControl);

        // Toolbox - Notepad controls - Notepads viewer
        const notepadsViewerControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
            </svg>`,
            'Notepads',
            ['toolbox-element'],
            ['toolbox-control', 'hovering-label', 'notepads-viewer-control'],
            (event) => {
                // Update the notepads list.
                this.#updateNotepadsList();
                this.#notepadsViewer.showModal();
            }
        );

        toolbox.insertAdjacentElement('beforeend', notepadsViewerControl);

        // Toolbox - Notepad controls - New notepad
        const newNotepadControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path fill-rule="evenodd" d="M8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5z"/>
                <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
            </svg>`,
            'New notepad',
            ['toolbox-element'],
            ['toolbox-control', 'hovering-label'],
            (event) => {
                this.newNotepad(true);
            }
        );

        toolbox.insertAdjacentElement('beforeend', newNotepadControl);

        // Toolbox - Notepad controls - Export Notepad
        const exportNotepadControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path fill-rule="evenodd" d="M8 5a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5A.5.5 0 0 1 8 5z"/>
                <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
            </svg>`,
            'Export notepad',
            ['toolbox-element'],
            ['toolbox-control', 'hovering-label'],
            (event) => {
                this.#exportNotepad();
            }
        );

        toolbox.insertAdjacentElement('beforeend', exportNotepadControl);

        // Toolbox - About
        const aboutControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
            </svg>`,
            'About',
            ['toolbox-element'],
            ['toolbox-control', 'hovering-label', 'about'],
            (event) => {
                window.open(this.#defaults.branding.about, '_blank');
            }
        );

        toolbox.insertAdjacentElement('beforeend', aboutControl);

        toolbox.insertAdjacentElement('beforeend', aboutControl);

        return toolbox;
    }

    /**
     * Add the header to the DOM and enable event listeners.
     *
     * @param {String} notepadTitle The name of the notepad.
     *
     * @returns The HTML element representing the header.
     */
    #createHeader(notepadTitle = this.#defaults.notepadTitle) {
        const header = document.createElement('h1');
        header.contentEditable = 'plaintext-only';
        header.classList.add('notepad-title', 'editable');
        header.innerText = notepadTitle;

        // Header - Notepad title - Update document's title
        this.#updateDocumentTitle(header.innerText);

        // ... Update document's title when the notepad title's text changes.
        const headerObserverOptions = { characterData: false, attributes: false, childList: true, subtree: false };
        const headerObserver = new MutationObserver(() => {
            this.#updateDocumentTitle(header.innerText);
        });
        headerObserver.observe(header, headerObserverOptions);

        // ... Update document's title when new text is typed in the notepad title.
        header.addEventListener('input', (event) => {
            document.title = event.target.innerText + ' \u002D ' + this.#defaults.branding.name;
        });

        return header;
    }

    /**
     * Create a dialog to confirm and action before taking it.
     *
     * @param {Element} targetElement The element where to insert the element representing the dialog.
     * @param {Function} action The action to be triggered when it is confirmed by the user.
     * @param {String} actionLabel The label to be use in the control.
     * @param {String} message A message to explain the action.
     * @param {Array} customClasses Classes to be used to customise the dialog.
     *
     * @returns The HTML element representing the dialog.
     */
    #createConfirmationDialog(action, actionLabel = 'OK', message = 'Action confirmation', customClasses = []) {
        const dialog = this.#createDialog(
            message,
            [
                {
                    action: () => {
                        action();
                    },
                    actionLabel: actionLabel,
                    customClasses: ['dialog-button-confirm'],
                },
                {
                    action: undefined,
                    actionLabel: 'Cancel',
                    customClasses: ['dialog-button-standard'],
                },
            ],
            customClasses
        );

        return dialog;
    }

    /**
     * Create the HTML element storing insight information on the note, e.g., the number of characters.
     *
     * @param {String} label The visible label related to the insight.
     * @param {String} ariaLabel The aria and hovering label, which provides more details than the visible label.
     * @param {String} triggerClass The class to identify the span element to be updated with a function/method.
     *
     * @returns The HTML representation of the note's insight.
     */
    #createNoteInsight(label, ariaLabel, triggerClass) {
        const insightContainer = document.createElement('div');
        insightContainer.classList.add('insight-container');

        const insight = document.createElement('div');
        insight.classList.add('insight-content', 'hovering-label');
        insight.ariaLabel = ariaLabel;

        const insightLabel = document.createElement('span');
        insightLabel.innerText = label;
        insight.insertAdjacentElement('beforeend', insightLabel);

        const insightValue = document.createElement('span');
        insightValue.classList.add(triggerClass);
        insight.insertAdjacentElement('beforeend', insightValue);

        insightContainer.insertAdjacentElement('beforeend', insight);

        return insightContainer;
    }

    /**
     * Create a control to trigger specific actions.
     *
     * @param {String} label The label visible in the control.
     * @param {String} ariaLabel The aria and hovering label, which provides details on the control.
     * @param {String} containerClasses The classes of the div element containing the control.
     * @param {String} targetClasses The classes to identify the control.
     * @param {Function} clickCallback The callback function to be run when the control is clicked.
     *
     * @returns The HTML representation of the note's control.
     */
    #createControl(label, ariaLabel, containerClasses, targetClasses, clickCallback) {
        // Container
        const noteControlContainer = document.createElement('div');

        if (containerClasses && containerClasses.length > 0) {
            noteControlContainer.classList.add(...containerClasses);
        }

        // Control
        const noteControl = document.createElement('button');
        noteControl.type = 'button';

        if (targetClasses && targetClasses.length > 0) {
            noteControl.classList.add(...targetClasses);
        }

        noteControl.innerHTML = label;
        if (ariaLabel) {
            noteControl.ariaLabel = ariaLabel;
        }

        noteControlContainer.insertAdjacentElement('beforeend', noteControl);

        // Event listener
        noteControl.addEventListener('click', clickCallback);

        return noteControlContainer;
    }

    /**
     * Create the notepads viewer to view and use locally stored notepads.
     *
     * @returns The HTML element representation of the notepads viewer.
     */
    #createNotepadsViewer() {
        // Add dialog to the DOM.
        const notepadsViewer = document.createElement('dialog');
        notepadsViewer.classList.add('dialog', 'notepads-viewer');

        // Notepads viewer - Header
        const header = document.createElement('header');
        header.classList.add('dialog-header', 'viewer-header');

        const headerBody = document.createElement('h2');
        headerBody.innerText = 'Notepads';
        header.insertAdjacentElement('beforeend', headerBody);

        notepadsViewer.insertAdjacentElement('beforeend', header);

        // Notepads viewer - Toolbox
        const viewerToolbox = this.#createViewerToolbox();

        notepadsViewer.insertAdjacentElement('beforeend', viewerToolbox);

        // Notepads viewer - Notepads list
        const notepadsList = this.#createNotepadsList();

        notepadsViewer.insertAdjacentElement('beforeend', notepadsList);

        // Notepads viewer - Footer
        const footer = document.createElement('footer');
        footer.classList.add('dialog-footer', 'viewer-footer');

        const closeViewerControl = this.#createControl(
            'Close',
            undefined,
            ['dialog-button-container'],
            ['dialog-button', 'dialog-button-standard'],
            (event) => {
                notepadsViewer.close();
            }
        );

        footer.insertAdjacentElement('beforeend', closeViewerControl);

        notepadsViewer.insertAdjacentElement('beforeend', footer);

        return notepadsViewer;
    }

    /**
     * Create the notepads viewer's toolbox to perform actions on the notepads list, e.g. search within the list.
     *
     * @returns The notepads toolbox.
     */
    #createViewerToolbox() {
        const viewerToolbox = document.createElement('div');
        viewerToolbox.classList.add('viewer-toolbox');

        // Notepads toolbox - Toolbar - Search
        const notepadsSearchContainer = document.createElement('div');
        notepadsSearchContainer.classList.add('viewer-toolbox-search-container');

        const notepadsSearch = document.createElement('input');
        notepadsSearch.classList.add('viewer-toolbox-control', 'viewer-toolbox-search');
        notepadsSearch.placeholder = 'Search notepads...';

        notepadsSearchContainer.insertAdjacentElement('beforeend', notepadsSearch);

        viewerToolbox.insertAdjacentElement('beforeend', notepadsSearchContainer);

        // Notepads toolbox - Toolbar - Event listener
        notepadsSearch.addEventListener('input', (event) => {
            const filteredNotepads = this.#filterNotepads(event.target.value.toLowerCase());

            // Update the notepads list with only the matching elements
            this.#updateNotepadsList(filteredNotepads);
        });

        // Notepads toolbox - Toolbar - Controls
        const viewerToolboxControls = document.createElement('div');
        viewerToolboxControls.classList.add('viewer-toolbox-controls');

        // Notepads toolbox - Toolbar - Controls - New notepad
        const newNotepadControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path fill-rule="evenodd" d="M8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5z"/>
                <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
            </svg>`,
            'New notepad',
            ['viewer-toolbox-control-container'],
            ['hovering-label', 'viewer-toolbox-control'],
            (event) => {
                // Create new notepad.
                this.newNotepad(true);

                // Close the notepads viewer.
                this.#notepadsViewer.close();
            }
        );

        viewerToolboxControls.insertAdjacentElement('beforeend', newNotepadControl);

        // Notepads toolbox - Toolbar - Controls - Import notepad
        const importNotepadControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path fill-rule="evenodd" d="M8 11a.5.5 0 0 0 .5-.5V6.707l1.146 1.147a.5.5 0 0 0 .708-.708l-2-2a.5.5 0 0 0-.708 0l-2 2a.5.5 0 1 0 .708.708L7.5 6.707V10.5a.5.5 0 0 0 .5.5z"/>
                <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
            </svg>`,
            'Import notepad',
            ['viewer-toolbox-control-container'],
            ['hovering-label', 'viewer-toolbox-control'],
            (event) => {
                this.#importNotepad(() => {
                    this.#notepadsViewer.close();
                });
            }
        );

        viewerToolboxControls.insertAdjacentElement('beforeend', importNotepadControl);

        // Notepads toolbox - Toolbar - Controls - Backup - Create
        const backupNotepadsControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                    <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                    <path d="M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.708L8 2.207l-5 5V13.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 2 13.5V8.207l-.646.647a.5.5 0 1 1-.708-.708L7.293 1.5Z"/>
                    <path d="M10 13a1 1 0 0 1 1-1v-1a2 2 0 0 1 4 0v1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2Zm3-3a1 1 0 0 0-1 1v1h2v-1a1 1 0 0 0-1-1Z"/>
            </svg>`,
            'Backup notepads',
            ['viewer-toolbox-control-container'],
            ['hovering-label', 'viewer-toolbox-control'],
            (event) => {
                this.#backupNotepads();
            }
        );

        viewerToolboxControls.insertAdjacentElement('beforeend', backupNotepadsControl);

        // Notepads toolbox - Toolbar - Controls - Backup - Restore - Confirmation dialog
        const restoreNotepadsDialog = this.#addConfirmationDialog(
            () => {
                this.#restoreNotepads();
            },
            'Proceed',
            'This action will delete all existing notepads',
            ['restore-notepads-dialog'],
            viewerToolbox
        );

        // Notepads toolbox - Toolbar - Controls - Backup - Restore
        const restoreNotepadsControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="svg-icon" viewBox="0 0 16 14" focusable="false">
                    <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                    <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
                </svg>`,
            'Restore notepads',
            ['viewer-toolbox-control-container'],
            ['hovering-label', 'viewer-toolbox-control'],
            (event) => {
                restoreNotepadsDialog.showModal();
            }
        );

        viewerToolboxControls.insertAdjacentElement('beforeend', restoreNotepadsControl);

        viewerToolbox.insertAdjacentElement('beforeend', viewerToolboxControls);

        return viewerToolbox;
    }

    /**
     * Create a list of notepads and enable the tracking of changes.
     *
     * @return The DOM representation of the notepadsList.
     */
    #createNotepadsList() {
        const notepadsList = document.createElement('div');
        notepadsList.classList.add('dialog-body', 'viewer-notepads-list');

        // Notepads list placeholder
        const checkNotepadsListLength = () => {
            if (notepadsList.childNodes.length == 0) {
                const notepadsListPlaceholder = document.createElement('div');
                notepadsListPlaceholder.innerText = 'No notepads';
                notepadsListPlaceholder.classList.add('viewer-list-empty');

                notepadsList.insertAdjacentElement('beforeend', notepadsListPlaceholder);
            }
        };

        // Initial check of the notepads list to ensure that check happens when no child element is inserted.
        checkNotepadsListLength();

        // Observe the notepads list and, if it's empty, add a 'no notepads' placeholder.
        const notepadsListObserverOptions = { characterData: false, attributes: false, childList: true, subtree: true };

        const notepadsListObserver = new MutationObserver(() => {
            checkNotepadsListLength();
        });

        notepadsListObserver.observe(notepadsList, notepadsListObserverOptions);

        // Trigger the first update of the list.
        this.#updateNotepadsList(undefined, notepadsList);

        return notepadsList;
    }

    /**
     * Create the list items containing the details of a notepad.
     *
     * @param {Object} notepad The notepad to be used to create the notepads list item.
     *
     * @returns A HTML representation of the notepads list item.
     */
    #createNotepadsListItem(notepad) {
        const notepadsListItem = document.createElement('div');
        notepadsListItem.classList.add('viewer-list-item');

        // Notepad - Last updated
        const lastUpdateUNIXTime = Number(notepad.lastUpdate);

        const lastUpdateDate = new Date(lastUpdateUNIXTime).toLocaleString(undefined, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });

        const lastUpdateContainer = document.createElement('div');
        lastUpdateContainer.innerText = lastUpdateDate;
        lastUpdateContainer.classList.add('hovering-label', 'viewer-last-update');
        lastUpdateContainer.ariaLabel = 'Last update';

        notepadsListItem.insertAdjacentElement('beforeend', lastUpdateContainer);

        // Notepad - Title
        const notepadTitle = notepad.title || '';

        const notepadTitleControl = document.createElement('div');
        notepadTitleControl.innerText = notepadTitle;
        notepadTitleControl.classList.add('viewer-notepad-title-container', 'viewer-notepad-title');

        notepadTitleControl.addEventListener('click', () => {
            // Open the new notepad.
            const storedNotepad = this.#getStoredNotepad(notepad.id);
            this.#fillNotepad(storedNotepad, true);

            // Close the notepads viewer.
            this.#notepadsViewer.close();
        });

        notepadsListItem.insertAdjacentElement('beforeend', notepadTitleControl);

        // Notepad list item - Viewer controls
        const controlsContainer = document.createElement('div');
        controlsContainer.classList.add('viewer-controls');

        // Notepad list item - Viewer controls - Duplicate
        const duplicateNotepadControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                    <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                    <path d="M5 0h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2 2H3a2 2 0 0 1-2-2h1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1H1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1H3a2 2 0 0 1 2-2z"/>
                    <path d="M1 6v-.5a.5.5 0 0 1 1 0V6h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V9h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 2.5v.5H.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1H2v-.5a.5.5 0 0 0-1 0z"/>
            </svg>`,
            'Duplicate notepad',
            ['viewer-control-container'],
            ['viewer-control', 'hovering-label', 'viewer-duplicate-control'],
            (event) => {
                const storedNotepad = this.#getStoredNotepad(notepad.id);

                // Duplicate the stored notepad.
                this.#duplicateNotepad(storedNotepad);

                // Rebuild the notepads list to include the duplicated one.
                this.#updateNotepadsList();
            }
        );

        controlsContainer.insertAdjacentElement('beforeend', duplicateNotepadControl);

        // Notepad list item - Viewer controls - Export
        const exportNotepadControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path fill-rule="evenodd" d="M8 5a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5A.5.5 0 0 1 8 5z"/>
                <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
            </svg>`,
            'Export notepad',
            ['viewer-control-container'],
            ['viewer-control', 'hovering-label', 'viewer-export-control'],
            (event) => {
                this.#exportNotepad(notepad);
            }
        );

        controlsContainer.insertAdjacentElement('beforeend', exportNotepadControl);

        // Notepad list item - Viewer controls - Delete - Confirmation dialog
        const deleteNotepadDialog = this.#addConfirmationDialog(
            () => {
                this.deleteNotepad(notepad.id, notepadsListItem.remove());
            },
            'Delete',
            'Delete notepad?',
            ['delete-notepad-dialog', 'delete-' + notepad.id],
            notepadsListItem
        );

        // Notepad list item - Viewer controls - Delete
        const deleteNotepadControl = this.#createControl(
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
                <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
                <path fill-rule="evenodd" d="M6.146 6.146a.5.5 0 0 1 .708 0L8 7.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 8l1.147 1.146a.5.5 0 0 1-.708.708L8 8.707 6.854 9.854a.5.5 0 0 1-.708-.708L7.293 8 6.146 6.854a.5.5 0 0 1 0-.708z"/>
                <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
            </svg>`,
            'Delete notepad',
            ['viewer-control-container'],
            ['viewer-control', 'hovering-label', 'viewer-delete-control'],
            (event) => {
                deleteNotepadDialog.showModal();
            }
        );

        controlsContainer.insertAdjacentElement('beforeend', deleteNotepadControl);

        notepadsListItem.insertAdjacentElement('beforeend', controlsContainer);

        return notepadsListItem;
    }

    /** Utilities */

    /**
     * Search notepads (notepad's title and note's title and content) for specific terms.
     *
     * @param {String} searchTerm Word or phrase to be searched.
     * @param {Object} notepads The notepads to be searched.
     *
     * @returns
     */
    #filterNotepads(searchTerm = '', notepads = undefined) {
        notepads = notepads || this.#getAllStoredNotepads();

        if (searchTerm) {
            for (const notepad in notepads) {
                // Create an array containing the title and content of each note.
                let flattenedNotes = [];
                notepads[notepad].notes.forEach((note) => {
                    flattenedNotes.push(note.title);
                    flattenedNotes.push(note.content);
                });

                const flattenedNotepad = [notepads[notepad].title, ...flattenedNotes];

                // Search for matches within a string. The search is case insensitive.
                const searchMatch = (notepadElement) => {
                    return notepadElement.toLowerCase().includes(searchTerm);
                };

                // Remove any notepad that doesn't match the search.
                if (!flattenedNotepad.some(searchMatch)) {
                    delete notepads[notepad];
                }
            }
        }

        return notepads;
    }

    /**
     * Copy the content of a note.
     *
     * @param {Element} control The element triggering the action.
     */
    #copyNoteText(control) {
        const note = control.closest('.note');
        const noteText = note.querySelector('.note-text');

        navigator.clipboard.writeText(noteText.innerText).then(
            () => {
                // Successfully copied: change color and show a message.
                const originalColor = control.style.color;
                control.style.color = '#00ad43';

                const originalAriaLabel = control.getAttribute('aria-label');
                control.setAttribute('aria-label', 'Text copied!');

                // Change color and message back to the original.
                setTimeout(() => {
                    control.style.color = originalColor;
                    control.setAttribute('aria-label', originalAriaLabel);
                }, 1000);
            },
            () => {
                // Not copied: change color and show a message.
                const originalColor = control.style.color;
                control.style.color = '#ae0b0b';

                const originalAriaLabel = control.getAttribute('aria-label');
                control.setAttribute('aria-label', 'Text NOT copied');

                // Change color and message back to the original.
                setTimeout(() => {
                    control.style.color = originalColor;
                    control.setAttribute('aria-label', originalAriaLabel);
                }, 1000);
            }
        );
    }

    /**
     * Create a dialog with one or multiple choices of action.
     *
     * @param {String} message A message to explain the action.
     * @param {Array} actions An array of object with actions to be added as option in the dialog.
     * @param {Array} customClasses Classes to be used to customise the dialog.
     *
     * Format of actions:
     * [
     *      {
     *          action: {Function}, -- The action to be performed on click.
     *          actionLabel: {String}, -- The label to be shown in the control.
     *          classes: [array] -- Classes to be used to customise the control
     *      },
     *      ...
     * ]
     *
     * @returns The HTML element representing the dialog.
     */
    #createDialog(message = '', actions = [], customClasses = []) {
        // Add dialog to the DOM.
        const dialog = document.createElement('dialog');
        dialog.classList.add('dialog', 'confirmation-dialog');
        dialog.classList.add(...customClasses);

        // Confirmation dialog - Header
        const dialogHeader = document.createElement('header');
        dialogHeader.classList.add('dialog-header', 'confirmation-dialog-header');

        const dialogHeaderBody = document.createElement('h2');
        dialogHeaderBody.innerText = message;
        dialogHeader.insertAdjacentElement('beforeend', dialogHeaderBody);

        dialog.insertAdjacentElement('beforeend', dialogHeader);

        // Confirmation dialog - Footer
        const dialogFooter = document.createElement('footer');
        dialogFooter.classList.add('dialog-footer', 'confirmation-dialog-footer');

        // Create the DOM element for each action
        for (const action of actions) {
            const control = this.#createControl(
                action.actionLabel,
                undefined,
                ['dialog-button-container'],
                ['dialog-button'].concat(action.customClasses || []),
                (event) => {
                    if (action.action) {
                        action.action();
                    }

                    dialog.close();
                }
            );

            dialogFooter.insertAdjacentElement('beforeend', control);
        }

        dialog.insertAdjacentElement('beforeend', dialogFooter);

        return dialog;
    }

    /**
     * Download the note as a text file.
     *
     * @param {Element} control The element triggering the action.
     */
    #downloadNote(control) {
        const note = control.closest('.note');

        const noteText = note.querySelector('.note-text').innerText;
        const noteTitle = note.querySelector('.note-title').innerText;
        const fullNote = (noteTitle ? noteTitle + '\n\n' : '') + noteText;

        const filename = noteTitle.replace(/[^\p{L}^\p{N}]+/gu, ' ').trim() + '.txt';

        utilities.downloadLocalFile(fullNote, filename, 'data:text/plain');
    }

    /**
     * Change the document's title with a newly formatted string.
     *
     * @param {String} text The content to be included in the document's title.
     */
    #updateDocumentTitle(text) {
        document.title = text + ' \u002D ' + this.#defaults.branding.name;
    }
}
