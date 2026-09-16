// add the assets imgs here
import { logoUrl } from "../js/assets.js";
import { defaultProfile } from "../js/assets.js";

// all about logo image here
const logo = document.querySelector(".logo");

///============================LOGO APPEND AND CLICK EVENT===============================================
if (logo) {
    const image = document.createElement("img");
    image.src = logoUrl;
    image.alt = "logo";
    
    logo.appendChild(image);

    image.addEventListener("click", () => {
    window.location.href = "../pages/home.html";  
})
}

///==================================profile image append====================================================
const profile = document.querySelector(".profile");

if(profile){
    const prof = document.createElement("img");
    prof.src = defaultProfile;
    prof.alt = "profile";

    profile.appendChild(prof);
}

document.addEventListener("DOMContentLoaded", () => {
///=========================SIDEBAR MENU ITEMS CLICK EVENT===================================================
const menuItems = document.querySelectorAll(".menu-item");

menuItems.forEach(item => {
    item.addEventListener("click", () => {
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        const text = item.textContent.trim(); 
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

///==============================HEADER PART=====================================================
// searchBar
const searchBar  = document.querySelector(".search-input");
const searchResult = document.querySelector(".searchResult");

searchBar.addEventListener("pressKey", (){
    searchResult.createElement = "li"

    li.searchText

    if (searchText === authorName){
        list all the author name
    }else if(searchresult ==="books name"){
        show the book list 
    }
})
    
  

})