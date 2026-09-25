import { db } from "../../../../src/firebase-config.js";
import {addDoc, collection, doc, getDoc, updateDoc, serverTimestamp} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

//default cover image 
const DEFAULT_COVER_SRC = "../../../images/book_cover/defaultCover.jpeg";

// ======================================INITIALIZE FORM===========================================
function initializeBookForm() {
    const bookForm = document.querySelector("#add-book-form");

    if (!bookForm) {
        console.log("The element was not found.");
        return;
    }
    // avoid duplicate initialization if script loaded twice
    if (bookForm.dataset.invenireInitialized === "1") return;
    bookForm.dataset.invenireInitialized = "1";

    bookForm.noValidate = true;
    const bookInputs = getBookInputs(bookForm);

    addValidationStyles();
    setupCoverPreview(bookInputs.coverImage, bookInputs.coverPreview);
    setupInputValidation(bookInputs);
    setupEditModeOnLoad(bookForm, bookInputs); // load books for editing
    setupFormSubmit(bookForm, bookInputs);
}

// =================================================GET FORM INPUTS==============================================
function getBookInputs(bookForm) {
    return {
        bookName: bookForm.querySelector("input[placeholder='e.g Boofe Koor']"),
        author: bookForm.querySelector("input[placeholder='e.g Paulo kiulo']"),
        edition: bookForm.querySelector("input[placeholder='e.g 2022 / 1st edition / fiction']"),
        shortDetails: bookForm.querySelector("#shortDetails") || bookForm.querySelector("textarea[placeholder='message about book...']") || bookForm.querySelector("textarea[name='short_details']"),
        pdfUrl: bookForm.querySelector("input[placeholder='e.g example.pdf/ http/example.pdf']"),
        audioUrl: bookForm.querySelector("input[placeholder='e.g example.mp3']"),
        coverImage: bookForm.querySelector("#cover-image"),
        coverPreview: bookForm.querySelector("#cover-preview"),
        price: bookForm.querySelector("input[placeholder='e.g $36']"),
        formWrapper: bookForm
    };
}

// ============================================ADD VALIDATION CSS===============================================

function addValidationStyles() {
    if (document.querySelector("#book-form-validation-styles")) return;

    const style = document.createElement("style");
    style.id = "book-form-validation-styles";
    style.textContent = `
        .book-input-error {
            background-color: #ffe5e5 !important;
            border: 1px solid #dc2626 !important;
            outline: none;
        }

        .book-input-error:focus {
            border-color: #b91c1c !important;
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.15);
        }

        .book-validation-message {
            display: block;
            margin-top: 5px;
            color: #dc2626;
            font-size: 13px;
            font-weight: 600;
        }

        .cover-preview-error {
            display: block;
            margin-top: 5px;
            color: #dc2626;
            font-size: 13px;
            font-weight: 600;
        }

        #cover-preview {
            display: none;
            width: 120px;
            height: 150px;
            object-fit: cover;
            border-radius: 10px;
            margin-top: 10px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
        }
    `;
    document.head.appendChild(style);
}

// =====================================================
// TEXT CLEANER
// =====================================================

function cleanText(value) {
    return String(value ?? "").trim();
}

// =====================================================
// REQUIRED FIELD CONFIGURATION
// =====================================================

function getRequiredFields(bookInputs) {
    return [
        { input: bookInputs.bookName, message: "You have to fill in the book name." },
        { input: bookInputs.author, message: "You have to fill in the author." },
        { input: bookInputs.edition, message: "You have to fill in the edition." },
        { input: bookInputs.shortDetails, message: "You have to fill in the short details." },
    ];
}

// =====================================================
// SHOW / CLEAR FIELD ERROR
// =====================================================

function showFieldError(input, message) {
    if (!input) return;

    input.classList.add("book-input-error");
    input.setAttribute("aria-invalid", "true");

    const formGroup = input.closest(".form-group") || input.parentElement;

    let errorMessage = formGroup.querySelector(".book-validation-message");
    if (!errorMessage) {
        errorMessage = document.createElement("span");
        errorMessage.className = "book-validation-message";
        formGroup.appendChild(errorMessage);
    }

    errorMessage.textContent = message;
}

function clearFieldError(input) {
    if (!input) return;

    input.classList.remove("book-input-error");
    input.removeAttribute("aria-invalid");

    const formGroup = input.closest(".form-group") || input.parentElement;
    const errorMessage = formGroup.querySelector(".book-validation-message");
    if (errorMessage) errorMessage.remove();
}

// =====================================================
// VALIDATE REQUIRED FIELDS
// =====================================================

function validateRequiredFields(bookInputs) {
    const requiredFields = getRequiredFields(bookInputs);
    let formIsValid = true;
    let firstInvalidInput = null;

    requiredFields.forEach(field => {
        const input = field.input;
        if (!input) return;

        const value = cleanText(input.value);
        if (!value) {
            showFieldError(input, field.message);
            if (!firstInvalidInput) firstInvalidInput = input;
            formIsValid = false;
        } else {
            clearFieldError(input);
        }
    });

    if (firstInvalidInput) firstInvalidInput.focus();
    return formIsValid;
}

// =====================================================
// VALIDATE INPUTS WHILE ADMIN TYPES
// =====================================================

function setupInputValidation(bookInputs) {
    const requiredFields = getRequiredFields(bookInputs);

    requiredFields.forEach(field => {
        const input = field.input;
        if (!input) return;

        input.addEventListener("input", () => {
            if (cleanText(input.value)) clearFieldError(input);
        });

        input.addEventListener("blur", () => {
            if (cleanText(input.value)) clearFieldError(input);
        });
    });
}

// =====================================================
// COVER IMAGE PREVIEW (preload + default + root-relative)
// =====================================================

function setupCoverPreview(coverInput, coverPreview) {
    if (!coverInput || !coverPreview) return;

    // show default initially
    function setDefaultPreview() {
        if (DEFAULT_COVER_SRC) {
            coverPreview.src = DEFAULT_COVER_SRC;
            coverPreview.style.display = "block";
        } else {
            hideCoverPreview(coverPreview);
        }
    }

    // preload tester
    function preloadImage(url, onSuccess, onError) {
        const tester = new Image();
        tester.onload = () => onSuccess();
        tester.onerror = () => onError();
        tester.src = url;
    }

    // initial default
    setDefaultPreview();

    coverInput.addEventListener("input", () => {
        const raw = cleanText(coverInput.value);

        clearCoverPreviewError(coverInput, coverPreview);

        if (!raw) {
            setDefaultPreview();
            return;
        }

        // No validation: attempt to preload whatever user entered.
        preloadImage(
            raw,
            () => {
                coverPreview.src = raw;
                coverPreview.style.display = "block";
                coverPreview.classList.remove("cover-preview-error");
            },
            () => {
                setDefaultPreview();
                showCoverPreviewError(coverInput, coverPreview, "This image URL could not be loaded.");
            }
        );
    });

    // fallback if <img> errors at runtime
    coverPreview.addEventListener("error", () => {
        setDefaultPreview();
    });
}

// =====================================================
// COVER PREVIEW HELPERS
// =====================================================

function hideCoverPreview(coverPreview) {
    if (!coverPreview) return;
    coverPreview.style.display = "none";
    coverPreview.removeAttribute("src");
}

function showCoverPreviewError(coverInput, coverPreview, message) {
    if (!coverInput) return;

    coverInput.classList.add("book-input-error");

    const formGroup = coverInput.closest(".form-group") || coverInput.parentElement;

    let errorMessage = formGroup.querySelector(".cover-preview-error");
    if (!errorMessage) {
        errorMessage = document.createElement("span");
        errorMessage.className = "cover-preview-error";
        formGroup.appendChild(errorMessage);
    }

    errorMessage.textContent = message;
}

function clearCoverPreviewError(coverInput, coverPreview) {
    if (!coverInput) return;

    coverInput.classList.remove("book-input-error");

    const formGroup = coverInput.closest(".form-group") || coverInput.parentElement;
    const errorMessage = formGroup.querySelector(".cover-preview-error");
    if (errorMessage) errorMessage.remove();

    if (coverPreview) coverPreview.classList.remove("cover-preview-error");
}

// =====================================================
// URL VALIDATION (strict absolute http/https)
// =====================================================

function isValidHttpUrl(value) {
    try {
        const parsedUrl = new URL(value);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
        return false;
    }
}

// =====================================================
// OPTIONAL FIELD VALIDATORS
// =====================================================

function getValidPrice(value) {
    const price = cleanText(value);
    if (!price) return "";
    const validPricePattern = /^\$?\d+(?:\.\d{1,2})?$/;
    return validPricePattern.test(price) ? price : "";
}

function getValidPdfUrl(value) {
    const pdfUrl = cleanText(value);
    if (!pdfUrl) return "";
    const isPdfFile = /\.pdf(?:\?.*)?$/i.test(pdfUrl);
    return isPdfFile ? pdfUrl : "";
}

function getValidAudioUrl(value) {
    const audioUrl = cleanText(value);
    if (!audioUrl) return "";
    const isAudioFile = /\.(mp3|wav|ogg|m4a|aac|flac)(?:\?.*)?$/i.test(audioUrl);
    return isAudioFile ? audioUrl : "";
}

// =====================================================
// GET FORM DATA
// =====================================================

function getFormData(bookInputs) {
    return {
        book_name: cleanText(bookInputs.bookName?.value),
        author: cleanText(bookInputs.author?.value),
        edition: cleanText(bookInputs.edition?.value),
        short_details: cleanText(bookInputs.shortDetails?.value),
        pdf_url: getValidPdfUrl(bookInputs.pdfUrl?.value),
        audio_url: getValidAudioUrl(bookInputs.audioUrl?.value),
        price: getValidPrice(bookInputs.price?.value),
        cover_image: cleanText(bookInputs.coverImage?.value),
        created_at: new Date().toISOString()
    };
}

// =====================================================
// SAVE TO LOCAL STORAGE (replace existing by firestore_id if present)
// =====================================================

function saveBookToLocalStorage(bookData) {
    const storageKey = "adminBooks";
    let savedBooks = [];

    try {
        const savedData = localStorage.getItem(storageKey);
        savedBooks = savedData ? JSON.parse(savedData) : [];
        if (!Array.isArray(savedBooks)) savedBooks = [];
    } catch (error) {
        console.warn("Could not read localStorage books:", error);
        savedBooks = [];
    }

    // If the bookData has a firestore_id, replace any existing entry with that id
    const firestoreId = bookData.firestore_id || bookData.firestoreId || bookData.id || null;

    if (firestoreId) {
        const existingIndex = savedBooks.findIndex(b => b.firestore_id === firestoreId || b.firestoreId === firestoreId || b.id === firestoreId);
        if (existingIndex !== -1) {
            // replace existing
            savedBooks[existingIndex] = { ...savedBooks[existingIndex], ...bookData, firestore_id: firestoreId };
            localStorage.setItem(storageKey, JSON.stringify(savedBooks));
            return;
        }
    }

    const localBook = {
        ...bookData,
        local_id: globalThis.crypto?.randomUUID?.() || `local-${Date.now()}`
    };

    savedBooks.push(localBook);
    localStorage.setItem(storageKey, JSON.stringify(savedBooks));
}

// =====================================================
// SAVE TO FIRESTORE (create new)
// =====================================================
async function saveBookToFirestore(bookData) {
    const bookDocument = {
        book_name: bookData.book_name,
        author: bookData.author,
        edition: bookData.edition,
        short_details: bookData.short_details,
        pdf_url: bookData.pdf_url,
        audio_url: bookData.audio_url,
        price: bookData.price,
        cover_image: bookData.cover_image,
        createdAt: serverTimestamp()
    };

    const bookReference = await addDoc(collection(db, "book-list"), bookDocument);
    return bookReference.id;
}

// =====================================================
// UPDATE EXISTING FIRESTORE DOC
// =====================================================
async function updateExistingBookInFirestore(bookId, bookData) {
    const docRef = doc(db, "book-list", bookId);

    const updatePayload = {
        book_name: bookData.book_name,
        author: bookData.author,
        edition: bookData.edition,
        short_details: bookData.short_details,
        pdf_url: bookData.pdf_url,
        audio_url: bookData.audio_url,
        price: bookData.price,
        cover_image: bookData.cover_image,
        updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updatePayload);
}

// ===============================================CLEAR FOR==================================================
function clearBookForm(bookInputs) {
    const bookForm = document.querySelector("#add-book-form");
    if (bookForm) bookForm.reset();

    if (bookInputs.coverPreview) {
        if (DEFAULT_COVER_SRC) {
            bookInputs.coverPreview.src = DEFAULT_COVER_SRC;
            bookInputs.coverPreview.style.display = "block";
        } else {
            hideCoverPreview(bookInputs.coverPreview);
        }
    }

    // Clear validation classes/messages on both INPUT and TEXTAREA
    Object.values(bookInputs).forEach(input => {
        if (!input) return;
        const tag = input.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") {
            clearFieldError(input);
        }
    });
}

// =========================================CANCEL BUTTON HELPERS (ADDED)========================================

// Ensure a cancel button exists and return it. If doesn't exist, create and insert after save button.
function ensureCancelButton() {
    let cancel = document.getElementById("cancel-edit-btn");
    if (cancel) return cancel;

    const saveButton = document.querySelector("#save-book-btn");
    if (!saveButton) return null;

    cancel = document.createElement("button");
    cancel.type = "button";
    cancel.id = "cancel-edit-btn";
    cancel.textContent = "Cancel";
    // You can copy class from save button so it looks similar
    if (saveButton.className) cancel.className = saveButton.className;
    // Insert after save button
    saveButton.insertAdjacentElement("afterend", cancel);

    cancel.addEventListener("click", () => {
        const bookForm = document.querySelector("#add-book-form");
        if (!bookForm) return;
        const bookInputs = getBookInputs(bookForm);

        // clear edit state
        delete bookForm.dataset.editingId;
        localStorage.removeItem("editingBookId");

        // clear form fields and validation markers
        clearBookForm(bookInputs);

        // remove cancel button
        hideCancelButton();

        // restore save button label
        const saveBtn = document.querySelector("#save-book-btn");
        if (saveBtn) saveBtn.textContent = "Save";
    });

    return cancel;
}

function showCancelButton() {
    const cancel = ensureCancelButton();
    if (cancel) cancel.style.display = "inline-block";
}

function hideCancelButton() {
    const cancel = document.getElementById("cancel-edit-btn");
    if (cancel) cancel.remove();
}

// =========================================FORM SUBMIT (handles create & update)=================================================
function setupFormSubmit(bookForm, bookInputs) {
    bookForm.addEventListener("submit", async event => {
        event.preventDefault();

        const formIsValid = validateRequiredFields(bookInputs);
        if (!formIsValid) return;

        const saveButton = document.querySelector("#save-book-btn");
        if (saveButton) {
            saveButton.disabled = true;
            
            const editingId = bookForm.dataset.editingId || localStorage.getItem("editingBookId");
            saveButton.textContent = editingId ? "Updating..." : "Saving...";
        }

        try {
            const bookData = getFormData(bookInputs);
            const editingId = bookForm.dataset.editingId || localStorage.getItem("editingBookId");

            if (editingId) {
                // update existing
                await updateExistingBookInFirestore(editingId, bookData);

                // update localStorage entry (pass firestore_id so saveBookToLocalStorage updates instead of appending)
                saveBookToLocalStorage({ ...bookData, firestore_id: editingId });

                // cleanup editing markers
                delete bookForm.dataset.editingId;
                localStorage.removeItem("editingBookId");

                // hide cancel button and restore save label
                hideCancelButton();
                if (saveButton) saveButton.textContent = "Save";

                alert("Book updated successfully.");
            } else {
                // create new
                const firestoreBookId = await saveBookToFirestore(bookData);

                // save to localStorage with firestore id
                saveBookToLocalStorage({ ...bookData, firestore_id: firestoreBookId });

                alert("Book saved successfully.");
            }

            clearBookForm(bookInputs);

        } catch (error) {
            console.log("Could not save the book:", error);
            alert(error.message || "Could not save the book. Please check your connection.");
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = "Save";
            }
        }
    });
}

// =====================================================
// EDIT MODE: load doc on form when editingBookId is present
// =====================================================
// Load a single book doc and populate the form immediately.
// Re-uses the same population logic as setupEditModeOnLoad.
async function loadBookIntoForm(bookId) {
    if (!bookId) return;

    const bookForm = document.querySelector("#add-book-form");
    if (!bookForm) return;

    const bookInputs = getBookInputs(bookForm);

    try {
        const docRef = doc(db, "book-list", bookId);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            console.warn("Editing book not found in Firestore:", bookId);
            localStorage.removeItem("editingBookId");
            if (bookForm.dataset.editingId) delete bookForm.dataset.editingId;
            return;
        }

        const data = snapshot.data();

        if (bookInputs.bookName) bookInputs.bookName.value = data.book_name || "";
        if (bookInputs.author) bookInputs.author.value = data.author || "";
        if (bookInputs.edition) bookInputs.edition.value = data.edition || "";
        if (bookInputs.shortDetails) bookInputs.shortDetails.value = data.short_details || "";
        if (bookInputs.pdfUrl) bookInputs.pdfUrl.value = data.pdf_url || "";
        if (bookInputs.audioUrl) bookInputs.audioUrl.value = data.audio_url || "";
        if (bookInputs.price) bookInputs.price.value = data.price || "";
        if (bookInputs.coverImage) bookInputs.coverImage.value = data.cover_image || "";

        if (bookInputs.coverPreview) {
            bookInputs.coverPreview.src = data.cover_image || DEFAULT_COVER_SRC;
            bookInputs.coverPreview.style.display = data.cover_image ? "block" : (DEFAULT_COVER_SRC ? "block" : "none");
        }

        // mark form as editing
        bookForm.dataset.editingId = bookId;

        // switch Save button label
        const saveButton = document.querySelector("#save-book-btn");
        if (saveButton) saveButton.textContent = "Update";

        // show cancel button
        showCancelButton();

        // focus first input
        bookInputs.bookName?.focus();
    } catch (err) {
        console.error("Failed to load book for editing:", err);
    }
}
// Listen for clicks from books-list.js (custom event) so we update the form immediately
window.addEventListener("invenire:edit-book", (ev) => {
    const bookId = ev?.detail?.bookId;
    if (bookId) {
        loadBookIntoForm(bookId);
    }
});

async function setupEditModeOnLoad(bookForm, bookInputs) {
    const editingId = localStorage.getItem("editingBookId");
    if (!editingId) {
        // ensure default preview displayed
        if (bookInputs.coverPreview && DEFAULT_COVER_SRC) {
            bookInputs.coverPreview.src = DEFAULT_COVER_SRC;
            bookInputs.coverPreview.style.display = "block";
        }
        return;
    }

    // reuse loader to avoid duplicate logic
    await loadBookIntoForm(editingId);
}

// =====================================================
// EDIT BUTTON (for form itself — kept minimal, removed earlier)
// =====================================================

function setupEditButton() {
    // left intentionally minimal: the in-form edit button was removed at init
    return;
}

// =====================================================
// START SCRIPT
// =====================================================

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeBookForm, { once: true });
} else {
    initializeBookForm();
}