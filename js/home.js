
(function () {
    "use strict";
    window.initializeWindowDragAndResize = function initializeWindowDragAndResize() {
        const pdfModal = document.getElementById("pdf-modal");
        const pdfReader = document.querySelector(".pdf-reader");
        if (!pdfModal || !pdfReader) return;

        // Buttons / controls
        const minimizeBtn = document.getElementById("pdf-minimize-btn");
        const fullscreenBtn = document.getElementById("pdf-fullscreen-btn");

        // Internal state
        const floatingState = { width: "", height: "", left: "", top: "" };

        // Utility: safely replace an element with a fresh clone to remove old listeners
        const replaceWithClone = (el) => {
            if (!el) return null;
            try {
                const cloned = el.cloneNode(true);
                el.parentNode.replaceChild(cloned, el);
                return cloned;
            } catch (e) {
                return el;
            }
        };

        function clearCenterPositionLocks() {
            try {
                const style = pdfReader.style;
                const rect = pdfReader.getBoundingClientRect();

                const hasTranslate = !!(style.transform && style.transform.indexOf("translate") !== -1);
                const leftEmpty = !style.left;
                if (hasTranslate || leftEmpty) {
                    style.left = rect.left + "px";
                    style.top = rect.top + "px";
                    style.transform = "none";
                    style.margin = "0";
                }
            } catch (e) {
                // ignore
            }
        }

        // Toggle minimized state 
        function toggleMinimize() {
            const isMin = pdfModal.classList.toggle("minimized");
            pdfModal.classList.remove("active");
            document.body.classList.toggle("pdf-reader-locked", !isMin);
            // ARIA
            if (minimizeBtn) minimizeBtn.setAttribute("aria-pressed", String(isMin));
        }

        // Toggle fullscreen 
        function toggleFullscreen() {
            // If minimized: first restore
            if (pdfModal.classList.contains("minimized")) {
                pdfModal.classList.remove("minimized");
                document.body.classList.add("pdf-reader-locked");
            }

            // If currently fullscreen restore to floating with cached state
            if (pdfReader.classList.contains("fullscreen")) {
                pdfReader.classList.remove("fullscreen");
                pdfModal.classList.add("floating");
                pdfReader.style.width = floatingState.width || "";
                pdfReader.style.height = floatingState.height || "";
                pdfReader.style.left = floatingState.left || "";
                pdfReader.style.top = floatingState.top || "";
                pdfReader.style.transform = "none";
                return;
            }

            // Otherwise (normal or floating) 
            clearCenterPositionLocks();
            // Cache current floating geometry (if any)
            floatingState.width = pdfReader.style.width || "";
            floatingState.height = pdfReader.style.height || "";
            floatingState.left = pdfReader.style.left || "";
            floatingState.top = pdfReader.style.top || "";

            pdfModal.classList.remove("floating");
            pdfReader.classList.add("fullscreen");
            // Let CSS handle fullscreen classes; ensure no inline transforms block it
            pdfReader.style.width = "";
            pdfReader.style.height = "";
            pdfReader.style.left = "";
            pdfReader.style.top = "";
            pdfReader.style.transform = "none";
            document.body.classList.add("pdf-reader-locked");
        }

        const minimizeBtnFresh = replaceWithClone(minimizeBtn) || minimizeBtn;
        const fullscreenBtnFresh = replaceWithClone(fullscreenBtn) || fullscreenBtn;

        if (minimizeBtnFresh) {
            minimizeBtnFresh.addEventListener("click", function (ev) {
                ev.stopPropagation();
                toggleMinimize();
            }, { passive: true });
            minimizeBtnFresh.setAttribute("aria-pressed", String(pdfModal.classList.contains("minimized")));
            minimizeBtnFresh.title = minimizeBtnFresh.title || "Minimize/Restore PDF reader";
        }

        if (fullscreenBtnFresh) {
            fullscreenBtnFresh.addEventListener("click", function (ev) {
                ev.stopPropagation();
                toggleFullscreen();
            }, { passive: true });
            fullscreenBtnFresh.setAttribute("aria-pressed", String(pdfReader.classList.contains("fullscreen")));
            fullscreenBtnFresh.title = fullscreenBtnFresh.title || "Toggle fullscreen / floating";
        }

        const handlers = pdfModal.__dragResizeHandlers || {};
        // Remove previous listeners if present
        if (handlers.move) document.removeEventListener("pointermove", handlers.move);
        if (handlers.up) document.removeEventListener("pointerup", handlers.up);
        pdfModal.__dragResizeHandlers = handlers;

        let isDragging = false;
        let isResizing = false;
        let resizeDir = "";
        let startX = 0, startY = 0;
        let startRect = null;

        const header = pdfReader.querySelector(".pdf-reader-header");
        if (header) {
            const headerFresh = replaceWithClone(header) || header;
            headerFresh.addEventListener("pointerdown", function (ev) {
                // Only drag when floating and left-click or touch
                if (pdfReader.classList.contains("fullscreen") || pdfModal.classList.contains("minimized")) return;
                if (ev.button && ev.button !== 0) return;
                // Ignore clicks on buttons inside header
                if (ev.target.closest("button")) return;

                clearCenterPositionLocks();
                if (!pdfModal.classList.contains("floating")) pdfModal.classList.add("floating");

                isDragging = true;
                startX = ev.clientX; startY = ev.clientY;
                startRect = pdfReader.getBoundingClientRect();

                headerFresh.setPointerCapture(ev.pointerId);
                document.body.style.userSelect = "none";
            });
        }

        // Setup resize handles
        const resizeEls = Array.from(document.querySelectorAll(".pdf-resize-handle"));
        // Replace nodes to remove previous handlers reliably
        resizeEls.forEach((el) => replaceWithClone(el));
        // Re-query after replacement
        const updatedResizers = Array.from(document.querySelectorAll(".pdf-resize-handle"));
        updatedResizers.forEach(handle => {
            handle.addEventListener("pointerdown", function (ev) {
                if (pdfReader.classList.contains("fullscreen") || pdfModal.classList.contains("minimized")) return;
                ev.preventDefault();
                ev.stopPropagation();

                clearCenterPositionLocks();
                if (!pdfModal.classList.contains("floating")) pdfModal.classList.add("floating");

                isResizing = true;
                startX = ev.clientX; startY = ev.clientY;
                startRect = pdfReader.getBoundingClientRect();
                resizeDir = Array.from(handle.classList).find(c => c.startsWith("pdf-resize-") && c !== "pdf-resize-handle") || "";

                handle.setPointerCapture(ev.pointerId);
                document.body.style.userSelect = "none";
            });
        });

        // pointermove handler
        handlers.move = function (ev) {
            if (!startRect) return;
            const minW = 350, minH = 250;

            if (isDragging) {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                pdfReader.style.left = (startRect.left + dx) + "px";
                pdfReader.style.top = (startRect.top + dy) + "px";
            }

            if (isResizing && resizeDir) {
                const mouseX = ev.clientX, mouseY = ev.clientY;

                if (["pdf-resize-right", "pdf-resize-top-right", "pdf-resize-bottom-right"].includes(resizeDir)) {
                    const w = Math.max(minW, mouseX - startRect.left);
                    pdfReader.style.width = w + "px";
                }
                if (["pdf-resize-bottom", "pdf-resize-bottom-left", "pdf-resize-bottom-right"].includes(resizeDir)) {
                    const h = Math.max(minH, mouseY - startRect.top);
                    pdfReader.style.height = h + "px";
                }
                if (["pdf-resize-left", "pdf-resize-top-left", "pdf-resize-bottom-left"].includes(resizeDir)) {
                    const maxLeft = startRect.right - minW;
                    const newLeft = Math.min(maxLeft, mouseX);
                    const newW = startRect.right - newLeft;
                    pdfReader.style.left = newLeft + "px";
                    pdfReader.style.width = newW + "px";
                }
                if (["pdf-resize-top", "pdf-resize-top-left", "pdf-resize-top-right"].includes(resizeDir)) {
                    const maxTop = startRect.bottom - minH;
                    const newTop = Math.min(maxTop, mouseY);
                    const newH = startRect.bottom - newTop;
                    pdfReader.style.top = newTop + "px";
                    pdfReader.style.height = newH + "px";
                }
            }
        };

        // pointerup handler
        handlers.up = function (ev) {
            isDragging = false;
            isResizing = false;
            resizeDir = "";
            startRect = null;
            document.body.style.userSelect = "";
            // release pointer capture for header / handle if set
            try {
                if (header && header.releasePointerCapture) header.releasePointerCapture(ev.pointerId);
            } catch (e) { /* ignore */ }
        };

        document.addEventListener("pointermove", handlers.move, { passive: true });
        document.addEventListener("pointerup", handlers.up, { passive: true });

        // ESC to close minimized or fullscreen (keeps behavior small and predictable)
        const keyHandler = function (ev) {
            if (ev.key !== "Escape" && ev.key !== "Esc") return;
            if (pdfModal.classList.contains("minimized")) {
                pdfModal.classList.remove("minimized");
                document.body.classList.add("pdf-reader-locked");
                return;
            }
            if (pdfReader.classList.contains("fullscreen")) {
                pdfReader.classList.remove("fullscreen");
                pdfModal.classList.remove("floating");
                document.body.classList.remove("pdf-reader-locked");
                return;
            }
        };
        document.removeEventListener("keydown", pdfModal.__keyHandler);
        document.addEventListener("keydown", keyHandler);
        pdfModal.__keyHandler = keyHandler;

        // Click minimized reader to restore
        const restoreOnClick = function (ev) {
            if (!pdfModal.classList.contains("minimized")) return;
            const clickedReader = ev.target.closest(".pdf-reader");
            if (clickedReader) {
                pdfModal.classList.remove("minimized");
                pdfModal.classList.add("active");
                document.body.classList.add("pdf-reader-locked");
            }
        };
        // remove old then attach
        pdfModal.removeEventListener("click", pdfModal.__restoreHandler);
        pdfModal.addEventListener("click", restoreOnClick);
        pdfModal.__restoreHandler = restoreOnClick;
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => window.initializeWindowDragAndResize());
    } else {
        window.initializeWindowDragAndResize();
    }
})();