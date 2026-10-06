import { logoUrl } from "../../src/assets.js";

// ==========================================================================
// 1. LOGO RENDER ENGINE & INITIALIZATION
// ==========================================================================
const logo = document.querySelector(".logo");

if (logo) {
    const image = document.createElement("img");
    image.src = logoUrl;
    image.alt = "logo";
    logo.appendChild(image);

    image.addEventListener("click", () => {
        localStorage.removeItem("activeSidebarSection");
        window.location.href = "/pages/home.html";  
    });
}

// ==========================================================================
// 1. RECOVERY SYSTEM APPEARANCE PERSISTENCE (Runs instantly to prevent layout flash)
// ==========================================================================
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
} else {
    document.body.classList.remove("dark-theme");
}

// ==========================================================================
// 2. MAIN DOM REGISTRATION CONTROLLER
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll(".menu-item");
    
    // FIXED SELECTORS: Now searching via class names to match your HTML markup structures
    const langDropdownMenu = document.querySelector(".lang-dropdown-menu, #langDropdownMenu");
    const themeDropdownMenu = document.querySelector(".theme-dropdown-menu, .theme-dropdown, #themeDropdownMenu");
    
    // Select the actual click target trigger item button for Theme inside your sidebar list
    const themeDropdownBtn = document.querySelector('.menu-item[data-route="theme"], .menu-item[data-route="Theme"]');

    // Dynamically find option rows/list entries inside your dropdown panel layer
    const themeOptions = themeDropdownMenu ? themeDropdownMenu.querySelectorAll("li, div, .dropdown-item") : [];
    const time = document.querySelector(".time");
    const date = document.querySelector(".date");

    // ==========================================================================
    // A. LIVE CALENDAR & CLOCK UTILITY FUNCTIONS
    // ==========================================================================
    function runLiveCalendarMetrics() {
        const now = new Date();

        if (time) {
            time.textContent = now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });
        }

        if (date) {
            date.textContent = now.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
        }
    }

    // Initialize clock cycle loop ticker
    runLiveCalendarMetrics();
    setInterval(runLiveCalendarMetrics, 1000);

    // ==========================================================================
    // B. ROUTING PATH HIGHLIGHTING ENGINE
    // ==========================================================================
    function syncActivePageLayoutStates() {
        const currentPath = window.location.pathname.toLowerCase();
        
        // Restore last active section if returning from another page view context
        const savedActiveSection = localStorage.getItem("activeSidebarSection");
        if (savedActiveSection && savedActiveSection.startsWith("#")) {
            menuItems.forEach(i => i.classList.remove("active"));
            const savedItem = document.querySelector(`.menu-item[data-route="${savedActiveSection}"]`);
            if (savedItem) {
                savedItem.classList.add("active");
                setTimeout(() => {
                    document.querySelector(savedActiveSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
                return;
            }
        }

        menuItems.forEach(item => {
            const routeTarget = item.getAttribute("data-route");
            if (!routeTarget) return;

            if (!routeTarget.startsWith("#") && routeTarget.includes(".html")) {
                const cleanRoute = routeTarget.replace(/\.\.\//g, "").toLowerCase();
                if (currentPath.includes(cleanRoute)) {
                    menuItems.forEach(i => i.classList.remove("active"));
                    item.classList.add("active");
                }
            }
        });
    }

    // Initialize state highlighting paths on entry pointers
    syncActivePageLayoutStates();
    window.addEventListener("pageshow", syncActivePageLayoutStates);

    // ==========================================================================
    // C. MENU CLICK DISPATCHER ROUTING MANAGEMENT
    // ==========================================================================
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            const rawRoute = item.getAttribute("data-route");
            if (!rawRoute) return;

            const routeTarget = rawRoute.toLowerCase().trim();

            // PATTERN 1: Internal dynamic section scroll layout jumps
            if (routeTarget.startsWith("#")) {
                e.preventDefault();
                menuItems.forEach(i => i.classList.remove("active"));
                item.classList.add("active");

                localStorage.setItem("activeSidebarSection", rawRoute);

                const targetSection = document.querySelector(rawRoute);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                return;
            }

            // PATTERN 2: Language flyout panel dropdown toggles
            if (routeTarget === "language") {
                e.preventDefault();
                e.stopPropagation();
                
                // Safety clear: close theme dropdown elements if they reside open
                if (themeDropdownMenu) {
                    themeDropdownMenu.classList.remove("show");
                    themeDropdownMenu.style.setProperty("display", "none", "important");
                }
                document.querySelector('.menu-item[data-route="Theme"], .menu-item[data-route="theme"]')?.classList.remove("overlay-active");

                if (langDropdownMenu) {
                    const parentContainer = langDropdownMenu.closest('.lang-dropdown') || langDropdownMenu;
                    const isCurrentlyOpen = parentContainer.style.display === "block";
                    parentContainer.style.setProperty("display", isCurrentlyOpen ? "none" : "block", isCurrentlyOpen ? "" : "important");
                    item.classList.toggle("overlay-active", !isCurrentlyOpen);
                }
                return;
            }

            // PATTERN 3: Theme flyout panel dropdown toggles
            if (routeTarget === "theme") {
                e.preventDefault();
                e.stopPropagation();

                // Safety clear: close language menu blocks to prevent overlay clash artifacts
                if (langDropdownMenu) {
                    const langParent = langDropdownMenu.closest('.lang-dropdown') || langDropdownMenu;
                    langParent.style.setProperty("display", "none", "important");
                }
                document.querySelector('.menu-item[data-route="Language"], .menu-item[data-route="language"]')?.classList.remove("overlay-active");

                if (themeDropdownMenu) {
                    const isThemeOpen = themeDropdownMenu.classList.toggle("show");
                    themeDropdownMenu.style.setProperty("display", isThemeOpen ? "block" : "none", "important");
                    item.classList.toggle("overlay-active", isThemeOpen);
                }
                return;
            }
        });
    });

    // ==========================================================================
    // D. SYSTEM THEME OPTION SUB-SELECTION LISTENERS
    // ==========================================================================
    themeOptions.forEach(option => {
        option.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevents the event from instantly bubbling out to the body closer element

            // Fallback strategy to find theme text value labels regardless of attribute syntax mappings
            const selectedTheme = option.getAttribute("data-value") || option.dataset.value || option.textContent.trim().toLowerCase();
            console.log("Selected dashboard theme:", selectedTheme);

            if (selectedTheme.includes("dark")) {
                document.body.classList.add("dark-theme");
                localStorage.setItem("theme", "dark");
            } else {
                document.body.classList.remove("dark-theme");
                localStorage.setItem("theme", "light");
            }

            // Close active configuration dropdown window boxes gracefully upon option selection
            if (themeDropdownMenu) {
                themeDropdownMenu.classList.remove("show");
                themeDropdownMenu.style.setProperty("display", "none", "important");
            }
            if (themeDropdownBtn) {
                themeDropdownBtn.classList.remove("overlay-active");
            }
        });
    });

    // ==========================================================================
    // E. INTERACTIVE OUTSIDE CLICK SURFACE PANEL DISMISSAL CLOSURES
    // ==========================================================================
    document.addEventListener("click", (event) => {
        // Stop global click closures if user clicks on options inside the dropdown containers
        if (themeDropdownMenu && themeDropdownMenu.contains(event.target)) return;
        if (langDropdownMenu && langDropdownMenu.contains(event.target)) return;

        if (themeDropdownMenu) {
            themeDropdownMenu.classList.remove("show");
            themeDropdownMenu.style.setProperty("display", "none", "important");
        }
        if (langDropdownMenu) {
            const langParent = langDropdownMenu.closest('.lang-dropdown') || langDropdownMenu;
            langParent.style.setProperty("display", "none", "important");
        }
        menuItems.forEach(i => i.classList.remove("overlay-active"));
    });
});
