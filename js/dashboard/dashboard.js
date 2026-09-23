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
///=========================DOM CONTENT LOADED (SIDEBAR MENU ITEMS CLICK EVENT)===================================================
const menuItems = document.querySelectorAll(".menu-item");

menuItems.forEach(item => {
    item.addEventListener("click", () => {
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        const text = item.textContent.trim(); 
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

// ================================ CARD7 MOST POPULAR BOOKS ==================================

const popularBooksDefault = [
    { name: "The Midnight Library", author: "Matt Haig", count: 412 },
    { name: "Atomic Habits", author: "James Clear", count: 389 },
    { name: "Project Hail Mary", author: "Andy Weir", count: 356 },
    { name: "Padma Nadir Majhi", author: "Manik Bandopadhyay", count: 321 },
    { name: "Alchemist", author: "Paulo Coelho", count: 298 }
];

function popularBooksCard() {
    const mostPopularBooks = document.querySelector(".card7");
    if (!mostPopularBooks) return;

    mostPopularBooks.innerHTML = `
        <div class="popular-card-header">
            <div>
                <h3 class="popular-main-title">Most Popular Books</h3>
                <p class="popular-sub-title">Top books ranked by checkouts this month</p>
            </div>
            <a href="#" class="view-all-link">View all ➔</a>
        </div>
        <div class="books-list-container"></div>
    `;

    const listContainer = mostPopularBooks.querySelector(".books-list-container");
    
    popularBooksDefault.sort((a, b) => b.count - a.count);
    const peakValue = popularBooksDefault.length > 0 ? popularBooksDefault.count : 1;

    popularBooksDefault.forEach((book, index) => {
        const displayRank = String(index + 1).padStart(2, '0');
        const fillPercentage = (book.count / peakValue) * 100;

        listContainer.innerHTML += `
            <div class="book-row-item">
                <div class="book-rank">${displayRank}</div>

                <div class="book-icon" style="background: var(--normal-chart-background-color);">
                    <span class="icon">📖</span>
                </div>
                
                <div class="book-details-main">
                    <span class="book-title" title="${book.name}">${book.name}</span>
                    <span class="book-author">${book.author}</span>
                </div>
                
                <div class="progress-and-details">
                    <div class="progress-container">
                        <div class="progress-fill-line" style="width: ${fillPercentage}%;"></div>
                    </div>
                    <div class="book-details-card">over ${book.count} members selected</div>
                </div>
            </div>
        `;
    });
}

popularBooksCard();

// ================================ ACTIVE MEMBERS CARD 8==================================
const activeMembersDefault = [
    { name: "John Doe", count: 28, location: "Afghanistan"},
    { name: "Sarah Connor", count: 24, location: "Norway"},
    { name: "Alex Mercer", count: 19, location: "Herat"},
    { name: "Rahat Chowdhury", count: 15 , location: "Kabul"},
    { name: "Emily Watson", count: 12, location: "Iran" }
];

function activeMembersCard() {
    const activeMembersContainer = document.querySelector(".card8");
    if (!activeMembersContainer) return;

    activeMembersContainer.innerHTML = `
        <div class="member-card-header">
            <div>
                <h3 class="member-title">Most Active Members</h3>
                <p class="member-sub-title">Top members at this month</p>
            </div>
            <div class="active-badge">Active</div>
        </div>
        <div class="member-list-container"></div>
    `;

    const listContainer = activeMembersContainer.querySelector(".member-list-container");
    
    activeMembersDefault.sort((a, b) => b.count - a.count);
    const peakValue = activeMembersDefault.length > 0 ? activeMembersDefault[0].count : 1;

    activeMembersDefault.forEach((member, index) => {
        const fillPercentage = (member.count / peakValue) * 100;
        
        listContainer.innerHTML += `
            <div class="member-row-item">

                <div class="member-icon">
                    <span class="i">👤</span>
                </div>
                
                <div class="member-details">
                    <span class="member-name" title="${member.name}">${member.name}</span>
                    <span class="location">${member.location}</span>
                </div>
                
                <div class="progress-details">
                    <div class="progress-bar">
                        <div class="progress-line" style="width: ${fillPercentage}%;"></div>
                    </div>
                    <div class="login-details">over ${member.count} actions logged</div>
                </div>
            </div>
        `;
    });
}

// Fire the setup immediately when the page scripts run
activeMembersCard();

/// ================================FOOTER==================================
const footerText = document.querySelector(".footer-text");
const footerNav = document.querySelector(".footer-nav");

footerText.innerHTML = "© 2026, Made by Invenire Team.";

const linksMap = {
    "home": "../pages/home.html",
    "Invenire Digital Library": "../pages/about.html"
};

Object.keys(linksMap).forEach(text => {
    const listItem = document.createElement("li");
    listItem.className = "footer-list";

    const navLink = document.createElement("a");
    navLink.href = linksMap[text];
    navLink.textContent = text;
    navLink.className = "navLink";

    listItem.appendChild(navLink);
    footerNav.appendChild(listItem);
});

});