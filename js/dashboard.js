// add the assets imgs here
import { logoUrl } from "../js/assets.js";

// all about logo image here
const logo = document.querySelector(".logo");

if (logo) {
    const image = document.createElement("img");
    image.src = logoUrl;
    image.alt = "logo";
    
    logo.appendChild(image);

    image.addEventListener("click", () => {
    window.location.href = "../pages/home.html";  
})
}

document.addEventListener("DOMContentLoaded", () => {
// sidebar menu items click event
const menuItems = document.querySelectorAll(".menu-item");

menuItems.forEach(item => {
    item.addEventListener("click", () => {
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        // using map as a route if item has a saperate page navigate there if is at a same page scoll down and adding ID
        const routes = {
        "Dashboard": "../pages/admin_dashboard.html",
        "Notifications": "../pages/admin_subPages/notification.html",
        "Members": "../pages/admin_subPages/members.html",
        "Books": "../pages/admin_subPages/books.html",
        "Settings": "../pages/admin_subPages/settings.html",
        "Reports": "../pages/admin_subPages/reports.html",
        "Theme": "../pages/admin_subPages/theme.html",
        "Help": "#help-section"
    };

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
    })
})

})