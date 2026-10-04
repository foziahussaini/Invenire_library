document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // LAYER A: TAB SYSTEM SWITCHER CAPTURE ENGINE
    // ==========================================================================
    const tabs = Array.from(document.querySelectorAll('.head-title .tab-link'));
    const boxes = Array.from(document.querySelectorAll('.setting-body-content .box'));

    function activateTabPanel(targetId) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.target === targetId));
        boxes.forEach(b => b.classList.toggle('active', b.id === targetId));
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', e => {
            const target = tab.dataset.target;
            if (target) activateTabPanel(target);
        });
        tab.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                tab.click();
            }
        });
        if (!tab.hasAttribute('tabindex')) tab.setAttribute('tabindex', '0');
    });

    const initialTab = document.querySelector('.head-title .tab-link.active') || tabs[0];
    if (initialTab) activateTabPanel(initialTab.dataset.target);

    // ==========================================================================
    // LAYER B: INTERACTIVE DESIGN CARD MATRICES DISPATCHER
    // ==========================================================================
    const visualCards = document.querySelectorAll(".visual-option-card");

    // Module 1: Read saved preferences from local storage cache
    function loadUserDashboardTypography() {
        const savedFontSize = localStorage.getItem("userDashSize") || "16px";
        const savedFontStyle = localStorage.getItem("userDashStyle") || "'Segoe UI', sans-serif";

        // Set global custom document properties
        document.documentElement.style.setProperty('--dashboard-font-size', savedFontSize);
        document.documentElement.style.setProperty('--dashboard-font-family', savedFontStyle);

        // Highlight matching saved layout cards visually in the interface grid
        visualCards.forEach(card => {
            const cardType = card.getAttribute("data-type");
            const cardValue = card.getAttribute("data-value");

            if (cardType === "size" && cardValue === savedFontSize) {
                clearActiveSiblingCards(card);
                card.classList.add("active");
            }
            if (cardType === "style" && cardValue === savedFontStyle) {
                clearActiveSiblingCards(card);
                card.classList.add("active");
            }
        });
    }

    // Helper utility to safely toggle selection highlights within an option group row
    function clearActiveSiblingCards(selectedCard) {
        const parentGrid = selectedCard.parentElement;
        if (parentGrid) {
            const siblingCards = parentGrid.querySelectorAll(".visual-option-card");
            siblingCards.forEach(c => c.classList.remove("active"));
        }
    }

    // Module 2: Setup Event Click Listeners for Theme Selection Cards
    visualCards.forEach(card => {
        card.addEventListener("click", () => {
            const cardType = card.getAttribute("data-type");
            const cardValue = card.getAttribute("data-value");

            clearActiveSiblingCards(card);
            card.classList.add("active");

            // Perform instant visual repaint updates and write preferences to cache
            if (cardType === "size") {
                document.documentElement.style.setProperty('--dashboard-font-size', cardValue);
                localStorage.setItem("userDashSize", cardValue);
                console.log(`✨ Text sizing scaled via option card parameters: ${cardValue}`);
            } else if (cardType === "style") {
                document.documentElement.style.setProperty('--dashboard-font-family', cardValue);
                localStorage.setItem("userDashStyle", cardValue);
                console.log(`✨ Interface typography updated via option card parameters: ${cardValue}`);
            }
        });
    });

    // Run typography initialization instantly on load
    loadUserDashboardTypography();
});
