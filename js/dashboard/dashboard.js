import { logoUrl } from "../../src/assets.js";

// all about logo image here
const logo = document.querySelector(".logo");

///============================LOGO APPEND AND CLICK EVENT===============================================
if (logo) {
    const image = document.createElement("img");
    image.src = logoUrl;
    image.alt = "logo";
    
    logo.appendChild(image);

    image.addEventListener("click", () => {
    window.location.href = "/pages/home.html";  
})
}
document.addEventListener("DOMContentLoaded", () => {
    // ========================= DOM CONTENT LOADED (SIDEBAR MENU ITEMS CLICK EVENT) ===================================================
    const menuItems = document.querySelectorAll(".menu-item");

    const routes = {
        "Dashboard": "../pages/admin_dashboard.html",
        "Home": "../pages/home.html",
        "Members": "../pages/admin_subPages/members.html",
        "Books": "../pages/admin_subPages/books.html",
        "Settings": "../pages/admin_subPages/settings.html",
        "Reports": "../pages/admin_subPages/reports.html",
        "Theme": "../pages/admin_subPages/theme.html",
    };

    // matches the current page URL
    function currentActivePage() {
        const currentPath = window.location.pathname;

        menuItems.forEach(item => {
            const text = item.textContent.trim();
            const targetRoute = routes[text];

            if (targetRoute && !targetRoute.startsWith("#")) {
                const cleanRoute = targetRoute.replace(/\.\.\//g, ""); 
                
                if (currentPath.includes(cleanRoute)) {
                    menuItems.forEach(i => i.classList.remove("active"));
                    item.classList.add("active");
                }
            }
        });
    }
    currentActivePage();

    // Listen to 'pageshow' to catch the browser Back/Forward navigation caching
    window.addEventListener("pageshow", currentActivePage);

    //Click Event 
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            const text = item.textContent.trim(); 
            const target = routes[text];

            if (target) {
                if (target.startsWith("#")) {
                    const element = document.querySelector(target);
                    if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                } else {
                    window.location.href = target;
                }
            }
        });
    });
///==============================HEADER PART (dynamic real time and date)=====================================================
const calenderContainer = document.querySelector(".calender");
const time = document.querySelector(".time");
const date = document.querySelector(".date");

function calender(){
    const now = new Date();
    
time.textContent = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
});

date.textContent = now.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
});
}

calender();
setInterval(calender, 1000);



});