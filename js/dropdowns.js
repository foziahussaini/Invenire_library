// dropdowns.js - Handles custom select layouts globally

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. CORE ELEMENT SELECTORS ---
    const genderBtn = document.getElementById('genderDropdownBtn');
    const genderMenu = document.getElementById('genderDropdownMenu');
    const selectedGenderText = document.getElementById('selected-gender');
    const genderHiddenInput = document.getElementById('genderHiddenInput');

    const themeBtn = document.getElementById('themeDropdownBtn');
    const themeMenu = document.getElementById('themeDropdownMenu');
    const selectedThemeText = document.getElementById('selected-theme');
    const themeHiddenInput = document.getElementById('themeHiddenInput');

    const langBtn = document.getElementById('langDropdownBtn');
    const langMenu = document.getElementById('langDropdownMenu');
    const selectedLangText = document.getElementById('selected-lang');
    const langHiddenInput = document.getElementById('langHiddenInput');

    // Helper utility to safely dismiss all popups at once
    function closeAllMenus() {
        if (genderMenu && genderBtn) { genderMenu.classList.remove('show'); genderBtn.classList.remove('active'); }
        if (themeMenu && themeBtn) { themeMenu.classList.remove('show'); themeBtn.classList.remove('active'); }
        if (langMenu && langBtn) { langMenu.classList.remove('show'); langBtn.classList.remove('active'); }
    }

    // --- 2. GENDER SELECTION LOGIC ---
    if (genderBtn && genderMenu) {
        genderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = genderMenu.classList.contains('show');
            closeAllMenus();
            if (!isOpen) {
                genderMenu.classList.add('show');
                genderBtn.classList.add('active');
            }
        });

        genderMenu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', (e) => {
                const value = e.currentTarget.getAttribute('data-value');
                if (genderHiddenInput) genderHiddenInput.value = value;
                if (selectedGenderText) selectedGenderText.textContent = e.currentTarget.textContent;
                closeAllMenus();
            });
        });
    }

    // --- 3. THEME SELECTION LOGIC ---
    if (themeBtn && themeMenu) {
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = themeMenu.classList.contains('show');
            closeAllMenus();
            if (!isOpen) {
                themeMenu.classList.add('show');
                themeBtn.classList.add('active');
            }
        });

        themeMenu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', (e) => {
                const value = e.currentTarget.getAttribute('data-value');
                if (themeHiddenInput) themeHiddenInput.value = value;
                if (selectedThemeText) selectedThemeText.textContent = e.currentTarget.textContent;
                
                // Instantly inject data-theme property token into root HTML structure for visual style changes
                document.documentElement.setAttribute('data-theme', value);
                localStorage.setItem("userThemeCache", value);
                
                closeAllMenus();
            });
        });
    }

    // --- 4. LANGUAGE SELECTION LOGIC ---
    if (langBtn && langMenu) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = langMenu.classList.contains('show');
            closeAllMenus();
            if (!isOpen) {
                langMenu.classList.add('show');
                langBtn.classList.add('active');
            }
        });

        langMenu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', (e) => {
                const value = e.currentTarget.getAttribute('data-value');
                if (langHiddenInput) langHiddenInput.value = value;
                if (selectedLangText) selectedLangText.textContent = e.currentTarget.textContent;
                localStorage.setItem("userLanguageCache", value);
                closeAllMenus();
            });
        });
    }

    // --- 5. GLOBAL CLICK DISMISS ANCHOR ---
    document.addEventListener('click', () => {
        closeAllMenus();
    });
});
