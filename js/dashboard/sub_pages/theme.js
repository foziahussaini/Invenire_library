// =========================
// Active Menu Item
// =========================

const menuItems = document.querySelectorAll(".menu-item");
const currentFile = window.location.pathname.split("/").pop();

menuItems.forEach(item => {
    const link = item.querySelector("a");
    if (!link) return;

    const targetHref = link.getAttribute("href");

    if (targetHref && targetHref.includes(currentFile) && currentFile !== "") {
        item.classList.add("active");
    } else {
        item.classList.remove("active");
    }
});


// =========================
// Time & Date
// =========================

const time = document.querySelector(".time");
const date = document.querySelector(".date");

function calender() {
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

calender();
setInterval(calender, 1000);


// =========================
// Theme
// =========================

const themeDropdownBtn = document.getElementById("themeDropdownBtn");
const themeDropdownMenu = document.getElementById("themeDropdownMenu");

const themeOptions = themeDropdownMenu
    ? themeDropdownMenu.querySelectorAll("li")
    : [];


// =========================
// Apply Saved Theme
// =========================

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
} else {
    document.body.classList.remove("dark-theme");
}


// =========================
// Theme Dropdown
// =========================

if (themeDropdownBtn && themeDropdownMenu) {

    themeDropdownBtn.addEventListener("click", (event) => {
        event.stopPropagation();

        const isOpen = themeDropdownMenu.classList.toggle("show");

        if (isOpen) {
            themeDropdownMenu.style.setProperty(
                "display",
                "block",
                "important"
            );
        } else {
            themeDropdownMenu.style.setProperty(
                "display",
                "none",
                "important"
            );
        }
    });


    // =========================
    // Select Theme
    // =========================

    themeOptions.forEach(option => {

        option.addEventListener("click", (event) => {
            event.stopPropagation();

            const selectedTheme = option.dataset.value;

            if (selectedTheme === "dark") {
                document.body.classList.add("dark-theme");
            } else {
                document.body.classList.remove("dark-theme");
            }

            // Save theme for ALL pages
            localStorage.setItem("theme", selectedTheme);

            // Close menu
            themeDropdownMenu.classList.remove("show");
            themeDropdownMenu.style.setProperty(
                "display",
                "none",
                "important"
            );
        });

    });


    // =========================
    // Close When Clicking Outside
    // =========================

    document.addEventListener("click", () => {
        themeDropdownMenu.classList.remove("show");
        themeDropdownMenu.style.setProperty(
            "display",
            "none",
            "important"
        );
    });
}