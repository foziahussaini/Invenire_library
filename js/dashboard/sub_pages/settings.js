document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll(".menu-item");
    const currentFile = window.location.pathname.split("/").pop();

    menuItems.forEach(item => {
        const link = item.querySelector("a");
        if (!link) return;

        const targetHref = link.getAttribute("href");

        if (targetHref.includes(currentFile) && currentFile !== "") {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    
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