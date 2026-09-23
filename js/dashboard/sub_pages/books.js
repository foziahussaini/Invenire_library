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
});
