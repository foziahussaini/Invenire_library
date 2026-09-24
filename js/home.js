// =========================================================
// HOOK FOR LAYOUT CONTROLS (DRAG, RESIZE, MINIMIZE, FULLSCREEN)
// =========================================================
window.initializeWindowDragAndResize = function () {

    const pdfModal = document.getElementById("pdf-modal");
    const pdfReader = document.querySelector(".pdf-reader");

    const pdfMinimizeButton = document.getElementById("pdf-minimize-btn");
    const pdfFullscreenButton = document.getElementById("pdf-fullscreen-btn");

    if (!pdfModal || !pdfReader) return; 

    // Helper to calculate and strip CSS translate locks before manipulation
    function clearCenterPositionLocks() {
        if (!pdfReader.style.left || pdfReader.style.transform.includes("translate")) {
            const rect = pdfReader.getBoundingClientRect();
            pdfReader.style.left = rect.left + "px";
            pdfReader.style.top = rect.top + "px";
            pdfReader.style.transform = "none"; // Erases translate(-50%, -50%) safely
            pdfReader.style.margin = "0";
        }
    }

    // =========================================================
    // 1. MINIMIZE / TRUE FLOATING CORNER TOGGLE
    // =========================================================
    if (pdfMinimizeButton) {
        pdfMinimizeButton.replaceWith(pdfMinimizeButton.cloneNode(true));
        
        document.getElementById("pdf-minimize-btn").addEventListener("click", function (e) {
            e.stopPropagation();
            
            if (!pdfModal.classList.contains("minimized")) {
                pdfModal.classList.add("minimized");
                document.body.classList.remove("pdf-reader-locked"); // Unlocks background scrolling
                
                document.getElementById("pdf-minimize-btn").textContent = "🗖"; 
                document.getElementById("pdf-minimize-btn").title = "Maximize / Restore Window Layer";
            } else {
                pdfModal.classList.remove("minimized");
                document.body.classList.add("pdf-reader-locked"); // Re-locks background scrolling
                
                document.getElementById("pdf-minimize-btn").textContent = "−"; 
                document.getElementById("pdf-minimize-btn").title = "Minimize to Background Task";
            }
        });
    }

    // =========================================================
    // 2. FULLSCREEN / FLOATING SWITCH ACTION
    // =========================================================
    let floatingWindowState = { width: "90%", height: "95vh", left: "", top: "" };

    if (pdfFullscreenButton) {
        pdfFullscreenButton.replaceWith(pdfFullscreenButton.cloneNode(true));
        
        document.getElementById("pdf-fullscreen-btn").addEventListener("click", function (e) {
            e.stopPropagation();
            
            // If the window is currently minimized, maximize it first
            if (pdfModal.classList.contains("minimized")) {
                pdfModal.classList.remove("minimized");
                if (pdfMinimizeButton) pdfMinimizeButton.textContent = "−";
            }

            // FULLSCREEN ➔ FLOATING/RESTORED STATE
            if (pdfReader.classList.contains("fullscreen")) {
                pdfReader.classList.remove("fullscreen");
                pdfModal.classList.add("floating");

                // Restore previous exact dragging configurations
                pdfReader.style.width = floatingWindowState.width;
                pdfReader.style.height = floatingWindowState.height;
                pdfReader.style.left = floatingWindowState.left;
                pdfReader.style.top = floatingWindowState.top;
                pdfReader.style.transform = "none";
                return;
            }

            // FLOATING ➔ FULLSCREEN STATE
            // Cache current manual values before stretching layout sizes
            clearCenterPositionLocks();
            floatingWindowState.width = pdfReader.style.width || "90%";
            floatingWindowState.height = pdfReader.style.height || "95vh";
            floatingWindowState.left = pdfReader.style.left;
            floatingWindowState.top = pdfReader.style.top;

            pdfModal.classList.remove("floating");
            pdfReader.classList.add("fullscreen");
            
            // Apply complete viewport overrides
            pdfReader.style.width = "100vw";
            pdfReader.style.height = "100vh";
            pdfReader.style.left = "0";
            pdfReader.style.top = "0";
            pdfReader.style.transform = "none";
        });
    }

    // =========================================================
    // 3. WINDOW DRAG MECHANICAL LOGIC ENGINE
    // =========================================================
    let isDragging = false;
    let isResizing = false;
    let currentResizeDirection = "";

    let startMouseX = 0, startMouseY = 0;
    let startLeft = 0, startTop = 0;
    let startRight = 0, startBottom = 0;
    let startWidth = 0, startHeight = 0;

    const header = pdfReader.querySelector(".pdf-reader-header");
    if (header) {
        header.replaceWith(header.cloneNode(true));
        pdfReader.querySelector(".pdf-reader-header").addEventListener("mousedown", function (event) {
            // Disallow movements if full screen, minimized, or clicking operational controls
            if (pdfReader.classList.contains("fullscreen") || pdfModal.classList.contains("minimized") || event.target.closest("button")) return;

            clearCenterPositionLocks();
            if (!pdfModal.classList.contains("floating")) pdfModal.classList.add("floating");

            isDragging = true;
            startMouseX = event.clientX;
            startMouseY = event.clientY;

            startLeft = parseInt(pdfReader.style.left, 10) || 0;
            startTop = parseInt(pdfReader.style.top, 10) || 0;
            
            document.body.style.userSelect = "none";
        });
    }

    // =========================================================
    // 4. WINDOW SIZING HANDLE SUITE
    // =========================================================
    const resizeHandles = document.querySelectorAll(".pdf-resize-handle");
    resizeHandles.forEach(function (handle) {
        handle.replaceWith(handle.cloneNode(true));
    });

    document.querySelectorAll(".pdf-resize-handle").forEach(function (handle) {
        handle.addEventListener("mousedown", function (event) {
            if (pdfReader.classList.contains("fullscreen") || pdfModal.classList.contains("minimized")) return;

            event.preventDefault();
            event.stopPropagation();
            
            clearCenterPositionLocks();
            if (!pdfModal.classList.contains("floating")) pdfModal.classList.add("floating");
            
            isResizing = true;

            currentResizeDirection = Array.from(handle.classList).find(function (className) {
                return className.startsWith("pdf-resize-") && className !== "pdf-resize-handle";
            });

            const rect = pdfReader.getBoundingClientRect();
            startMouseX = event.clientX; startMouseY = event.clientY;
            startLeft = rect.left; startTop = rect.top;
            startRight = rect.right; startBottom = rect.bottom;
            startWidth = rect.width; startHeight = rect.height;

            document.body.style.userSelect = "none";
        });
    });

    // =========================================================
    // 5. EVENT COMPUTATION MATRICES (MOUSE MOVE RECONSTRUCTION)
    // =========================================================
    const cleanMoveHandler = function (event) {
        if (isDragging) {
            const deltaX = event.clientX - startMouseX;
            const deltaY = event.clientY - startMouseY;
            pdfReader.style.left = (startLeft + deltaX) + "px";
            pdfReader.style.top = (startTop + deltaY) + "px";
        }

        if (isResizing) {
            const mouseX = event.clientX;
            const mouseY = event.clientY;
            const minWidth = 350;
            const minHeight = 250;

            if (["pdf-resize-right", "pdf-resize-top-right", "pdf-resize-bottom-right"].includes(currentResizeDirection)) {
                pdfReader.style.width = Math.max(minWidth, mouseX - startLeft) + "px";
            }
            if (["pdf-resize-bottom", "pdf-resize-bottom-left", "pdf-resize-bottom-right"].includes(currentResizeDirection)) {
                pdfReader.style.height = Math.max(minHeight, mouseY - startTop) + "px";
            }
            if (["pdf-resize-left", "pdf-resize-top-left", "pdf-resize-bottom-left"].includes(currentResizeDirection)) {
                const maxLeft = startRight - minWidth;
                const newLeft = Math.min(maxLeft, mouseX);
                pdfReader.style.left = newLeft + "px";
                pdfReader.style.width = (startRight - newLeft) + "px";
            }
            if (["pdf-resize-top", "pdf-resize-top-left", "pdf-resize-top-right"].includes(currentResizeDirection)) {
                const maxTop = startBottom - minHeight;
                const newTop = Math.min(maxTop, mouseY);
                pdfReader.style.top = newTop + "px";
                pdfReader.style.height = (startBottom - newTop) + "px";
            }
        }
    };

    const cleanUpHandler = function () {
        isDragging = false;
        isResizing = false;
        document.body.style.userSelect = "";
    };

    // Prevent recursive event listeners accumulation memory leaks
    document.removeEventListener("mousemove", window.activeModalMouseMove);
    document.removeEventListener("mouseup", window.activeModalMouseUp);

    window.activeModalMouseMove = cleanMoveHandler;
    window.activeModalMouseUp = cleanUpHandler;

    document.addEventListener("mousemove", window.activeModalMouseMove);
    document.addEventListener("mouseup", window.activeModalMouseUp);
};

document.addEventListener("DOMContentLoaded", () => {window.initializeWindowDragAndResize();});