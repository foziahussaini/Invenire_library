// =========================================================
// ADD TO LIBRARY
// =========================================================

const libraryButtons = document.querySelectorAll(".library-btn");

libraryButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        button.textContent = "Added to Library";

    });

});




// =========================================================
// DOWNLOAD PDF
// =========================================================

const downloadButtons = document.querySelectorAll(".download-btn");

downloadButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const pdfUrl = button.dataset.pdfUrl;

        const downloadLink = document.createElement("a");

        downloadLink.href = pdfUrl;
        downloadLink.download = "";

        document.body.appendChild(downloadLink);

        downloadLink.click();

        document.body.removeChild(downloadLink);

    });

});



// =========================================================
// PDF READER
// =========================================================

let isLoggedIn = true;
let currentPdfUrl = ""; 
const readButtons = document.querySelectorAll(".read-btn");
const bookDetailsModal = document.getElementById("book-details-modal");

const pdfModal = document.getElementById("pdf-modal");
const pdfReader = document.querySelector(".pdf-reader");
const pdfFrame = document.getElementById("pdf-frame");

const pdfCloseButton = document.getElementById("pdf-close-btn");
const pdfMinimizeButton = document.getElementById("pdf-minimize-btn");
const pdfFullscreenButton = document.getElementById("pdf-fullscreen-btn");

const signupOverlay = document.getElementById("signup-overlay");
const signupOverlayClose = document.getElementById("signup-overlay-close");
const skipReadingButton = document.getElementById("skip-reading-btn");



const bookDetailsClose = document.getElementById("book-details-close");

bookDetailsClose.addEventListener("click", function () {
    bookDetailsModal.classList.remove("show");
});


const bookDetailsContinueButton = document.getElementById("book-details-continue-btn");

bookDetailsContinueButton.addEventListener("click", function () {

    if (isLoggedIn) {

        bookDetailsModal.classList.remove("show");
        pdfFrame.src = currentPdfUrl;
        pdfModal.style.display = "flex";

    } else {

        bookDetailsModal.classList.remove("show");

        signupOverlay.classList.add("show");

    }

});


// =========================================================
// OPEN PDF
// =========================================================

readButtons.forEach(function (button) {
    button.addEventListener("click", function () {

        currentPdfUrl = button.dataset.pdfUrl; 
        bookDetailsModal.classList.add("show");

    });
});


// =========================================================
// MINIMIZE PDF READER
// =========================================================

pdfMinimizeButton.addEventListener("click", function () {

    pdfModal.style.display = "none";

    document.body.classList.remove("pdf-reader-locked");

});


// =========================================================
// FULLSCREEN / FLOATING WINDOW
// =========================================================

let floatingWindowState = {
    width: "",
    height: "",
    left: "",
    top: ""
};


pdfFullscreenButton.addEventListener("click", function () {

    // =====================================================
    // FLOATING WINDOW → FULLSCREEN
    // =====================================================

    if (pdfModal.classList.contains("floating")) {

        // Save current floating window size and position
        floatingWindowState.width = pdfReader.style.width;
        floatingWindowState.height = pdfReader.style.height;
        floatingWindowState.left = pdfReader.style.left;
        floatingWindowState.top = pdfReader.style.top;

        // Remove floating mode
        pdfModal.classList.remove("floating");

        // Remove inline size and position
        // so fullscreen CSS can take full control
        pdfReader.style.width = "";
        pdfReader.style.height = "";
        pdfReader.style.left = "";
        pdfReader.style.top = "";

        // Enable fullscreen mode
        pdfReader.classList.add("fullscreen");

        // Lock page scrolling
        document.body.classList.add("pdf-reader-locked");

        return;
    }


    // =====================================================
    // FULLSCREEN → FLOATING WINDOW
    // =====================================================

    if (pdfReader.classList.contains("fullscreen")) {

        // Remove fullscreen mode
        pdfReader.classList.remove("fullscreen");

        // Restore floating mode
        pdfModal.classList.add("floating");

        // Restore previous floating window size
        // and position
        pdfReader.style.width = floatingWindowState.width;
        pdfReader.style.height = floatingWindowState.height;
        pdfReader.style.left = floatingWindowState.left;
        pdfReader.style.top = floatingWindowState.top;

        // Allow page scrolling again
        document.body.classList.remove("pdf-reader-locked");

        return;
    }


    // =====================================================
    // NORMAL READER → FULLSCREEN
    // =====================================================

    pdfReader.classList.add("fullscreen");

    document.body.classList.add("pdf-reader-locked");

});

// =========================================================
// CLOSE PDF READER
// =========================================================

pdfCloseButton.addEventListener("click", function () {

    pdfModal.style.display = "none";

    pdfFrame.src = "";

    pdfReader.classList.remove("fullscreen");

    pdfModal.classList.remove("floating");

    document.body.classList.remove("pdf-reader-locked");

});


// =========================================================
// FLOATING PDF WINDOW
// DRAG & RESIZE
// =========================================================

const resizeHandles = document.querySelectorAll(".pdf-resize-handle");

let isDragging = false;
let isResizing = false;

let currentResizeDirection = "";

let startMouseX = 0;
let startMouseY = 0;

let startLeft = 0;
let startTop = 0;

let startRight = 0;
let startBottom = 0;

let startWidth = 0;
let startHeight = 0;


// =========================================================
// DRAG WINDOW
// =========================================================

pdfReader.querySelector(".pdf-reader-header").addEventListener(
    "mousedown",
    function (event) {

        if (!pdfModal.classList.contains("floating")) {
            return;
        }

        // Do not drag when clicking a button
        if (event.target.closest("button")) {
            return;
        }

        isDragging = true;

        startMouseX = event.clientX;
        startMouseY = event.clientY;

        const rect = pdfReader.getBoundingClientRect();

        startLeft = rect.left;
        startTop = rect.top;

        document.body.style.userSelect = "none";

    }
);


// =========================================================
// START RESIZE
// =========================================================

resizeHandles.forEach(function (handle) {

    handle.addEventListener("mousedown", function (event) {

        if (!pdfModal.classList.contains("floating")) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        isResizing = true;

        currentResizeDirection = Array.from(handle.classList)
            .find(function (className) {

                return (
                    className.startsWith("pdf-resize-") &&
                    className !== "pdf-resize-handle"
                );

            });


        const rect = pdfReader.getBoundingClientRect();

        startMouseX = event.clientX;
        startMouseY = event.clientY;

        startLeft = rect.left;
        startTop = rect.top;

        startRight = rect.right;
        startBottom = rect.bottom;

        startWidth = rect.width;
        startHeight = rect.height;

        document.body.style.userSelect = "none";

    });

});


// =========================================================
// MOUSE MOVE
// =========================================================

document.addEventListener("mousemove", function (event) {


    // =====================================================
    // DRAG WINDOW
    // =====================================================

    if (isDragging) {

        const deltaX = event.clientX - startMouseX;
        const deltaY = event.clientY - startMouseY;

        pdfReader.style.left = startLeft + deltaX + "px";
        pdfReader.style.top = startTop + deltaY + "px";

    }


    // =====================================================
    // RESIZE WINDOW
    // =====================================================

    if (isResizing) {

        const mouseX = event.clientX;
        const mouseY = event.clientY;

        const minWidth = 350;
        const minHeight = 250;


        // =================================================
        // RIGHT SIDE
        // =================================================

        if (
            currentResizeDirection === "pdf-resize-right" ||
            currentResizeDirection === "pdf-resize-top-right" ||
            currentResizeDirection === "pdf-resize-bottom-right"
        ) {

            const newWidth = Math.max(
                minWidth,
                mouseX - startLeft
            );

            pdfReader.style.width = newWidth + "px";

        }


        // =================================================
        // LEFT SIDE
        // =================================================

        if (
            currentResizeDirection === "pdf-resize-left" ||
            currentResizeDirection === "pdf-resize-top-left" ||
            currentResizeDirection === "pdf-resize-bottom-left"
        ) {

            const maxLeft = startRight - minWidth;

            const newLeft = Math.min(
                mouseX,
                maxLeft
            );

            const newWidth = startRight - newLeft;

            pdfReader.style.left = newLeft + "px";
            pdfReader.style.width = newWidth + "px";

        }


        // =================================================
        // BOTTOM SIDE
        // =================================================

        if (
            currentResizeDirection === "pdf-resize-bottom" ||
            currentResizeDirection === "pdf-resize-bottom-left" ||
            currentResizeDirection === "pdf-resize-bottom-right"
        ) {

            const newHeight = Math.max(
                minHeight,
                mouseY - startTop
            );

            pdfReader.style.height = newHeight + "px";

        }


        // =================================================
        // TOP SIDE
        // =================================================

        if (
            currentResizeDirection === "pdf-resize-top" ||
            currentResizeDirection === "pdf-resize-top-left" ||
            currentResizeDirection === "pdf-resize-top-right"
        ) {

            const maxTop = startBottom - minHeight;

            const newTop = Math.min(
                mouseY,
                maxTop
            );

            const newHeight = startBottom - newTop;

            pdfReader.style.top = newTop + "px";
            pdfReader.style.height = newHeight + "px";

        }

    }

});



// =========================================================
// CLOSE OVERLAY
// =========================================================

function closeSignupOverlay() {

    signupOverlay.classList.remove("show");

}


// =========================================================
// SKIP
// =========================================================

skipReadingButton.addEventListener("click", function () {

    closeSignupOverlay();

});


// =========================================================
// CLOSE BUTTON
// =========================================================

signupOverlayClose.addEventListener("click", function () {

    closeSignupOverlay();

});


// =========================================================
// CLOSE WHEN CLICKING OUTSIDE THE BOX
// =========================================================

signupOverlay.addEventListener("click", function (event) {

    if (event.target === signupOverlay) {

        closeSignupOverlay();

    }

});


// =========================================================
// STOP DRAG / RESIZE
// =========================================================

document.addEventListener("mouseup", function () {

    isDragging = false;

    isResizing = false;

    currentResizeDirection = "";

    document.body.style.userSelect = "";

});