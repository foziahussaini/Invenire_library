import { logoUrl } from "../../src/assets.js";

// ============================ LOGO APPEND AND CLICK EVENT ===============================================
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

document.addEventListener("DOMContentLoaded", () => {
    // ========================= SIDEBAR LAYOUT MAP PIPELINE ENGINE ===================================================
    const menuItems = document.querySelectorAll(".menu-item");
    
    // Exact selectors mapping to your clean <ul> lists
    const langDropdownMenu = document.getElementById("langDropdownMenu");
    const themeDropdownMenu = document.getElementById("themeDropdownMenu");

    // Unified routing layout specs
    function syncActivePageLayoutStates() {
        const currentPath = window.location.pathname.toLowerCase();
        
        // Restore last active section if returning from another page
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

    // Initialize layout defaults
    syncActivePageLayoutStates();
    window.addEventListener("pageshow", syncActivePageLayoutStates);

    // Interactive Menu Clicking Node Dispatcher Engine 
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            const rawRoute = item.getAttribute("data-route");
            if (!rawRoute) return;

            const routeTarget = rawRoute.toLowerCase().trim();

            // 1. ROUTE PATTERN A: Internal dynamic section scroll jumps
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

            // 2. ROUTE PATTERN B: Language flyout interaction triggers
            if (routeTarget === "language") {
                e.preventDefault();
                e.stopPropagation();
                
                // Close the opposing theme panel if open
                if (themeDropdownMenu) {
                    themeDropdownMenu.classList.remove("show");
                    themeDropdownMenu.style.setProperty("display", "none", "important");
                }
                document.querySelector('.menu-item[data-route="Theme"], .menu-item[data-route="theme"]')?.classList.remove("overlay-active");

                if (langDropdownMenu) {
                    const parentContainer = langDropdownMenu.closest('.lang-dropdown');
                    const isCurrentlyOpen = parentContainer.style.display === "block";
                    parentContainer.style.display = isCurrentlyOpen ? "none" : "block";
                    item.classList.toggle("overlay-active", !isCurrentlyOpen);
                }
                return;
            }

            // 3. ROUTE PATTERN C: Theme flyout interaction triggers (DEFERRED TO SPECIFIC CONTROLLER)
            if (routeTarget === "theme") {
                e.preventDefault();
                e.stopPropagation();
                
                // Close the opposing language panel if open
                if (langDropdownMenu) langDropdownMenu.closest('.lang-dropdown').style.display = "none";
                document.getElementById("langMenuItem")?.classList.remove("overlay-active");

                // Toggle visibility using your new class setup securely
                if (themeDropdownMenu) {
                    const isOpen = themeDropdownMenu.classList.toggle("show");
                    themeDropdownMenu.style.setProperty("display", isOpen ? "block" : "none", "important");
                    item.classList.toggle("overlay-active", isOpen);
                }
                return;
            }

            // 4. ROUTE PATTERN D: Normal relative web page url jumps
            if (routeTarget.includes(".html")) {
                menuItems.forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                window.location.href = rawRoute;
            }
        });
    });

    // ==================== OVERLAY DISMISSAL CLICK LISTENERS ====================
    window.addEventListener("click", (e) => {
        const langContainer = langDropdownMenu?.closest('.lang-dropdown');

        if (langContainer && !langContainer.contains(e.target) && !e.target.closest('[data-route="language"]')) {
            langContainer.style.display = "none";
            document.getElementById("langMenuItem")?.classList.remove("overlay-active");
        }
        
    });

    // Options selection capture loops for Language choices
    document.querySelectorAll("#langDropdownMenu li").forEach(option => {
        option.addEventListener("click", (e) => {
            e.stopPropagation();
            const selectedLang = option.getAttribute("data-value");
            console.log(`🟢 Language preference changed to: ${selectedLang}`);
            
            option.parentElement.querySelectorAll("li").forEach(li => li.classList.remove("selected-option"));
            option.classList.add("selected-option");
            
            if (langDropdownMenu) langDropdownMenu.closest('.lang-dropdown').style.display = "none";
            document.getElementById("langMenuItem")?.classList.remove("overlay-active");
        });
    });

// ============================== TIME DATE CLOCK LIFECYCLE WATCHER ==============================
    const timeLabel = document.querySelector(".time");
    const dateLabel = document.querySelector(".date");

    function runClockTickCycle() {
        const timestampNow = new Date();
        if (timeLabel) {
            timeLabel.textContent = timestampNow.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });
        }
        if (dateLabel) {
            dateLabel.textContent = timestampNow.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
        }
    }

    runClockTickCycle();
    setInterval(runClockTickCycle, 1000);
});
