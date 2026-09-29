document.addEventListener('DOMContentLoaded', () => {
    // === 1. CORE SELECTORS ===
    const langBtn = document.getElementById('langDropdownBtn');
    const langMenu = document.getElementById('langDropdownMenu');
    const selectedLangText = document.getElementById('selected-lang');
    const langHiddenInput = document.getElementById('langHiddenInput');
    
    const themeBtn = document.getElementById('themeDropdownBtn');
    const themeMenu = document.getElementById('themeDropdownMenu');
    const selectedThemeText = document.getElementById('selected-theme');
    const themeHiddenInput = document.getElementById('themeHiddenInput');

    const genderBtn = document.getElementById('genderDropdownBtn');
    const genderMenu = document.getElementById('genderDropdownMenu');
    const selectedGenderText = document.getElementById('selected-gender');
    const genderHiddenInput = document.getElementById('genderHiddenInput');

    // === Helper function to clear all active dropdowns safely ===
    function closeAllMenus() {
        if (langMenu && langBtn) {
            langMenu.classList.remove('show');
            langBtn.classList.remove('active');
        }
        if (themeMenu && themeBtn) {
            themeMenu.classList.remove('show');
            themeBtn.classList.remove('active');
        }
        if (genderMenu && genderBtn) {
            genderMenu.classList.remove('show');
            genderBtn.classList.remove('active');
        }
    }

    // === 2. THEME DROPDOWN LOGIC ===
    if (themeBtn && themeMenu) {
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const isMenuOpen = themeMenu.classList.contains('show');
            closeAllMenus(); 
            if (!isMenuOpen) {
                themeMenu.classList.add('show');
                themeBtn.classList.add('active');
            }
        });

        themeMenu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', (e) => {
                const selectedTheme = e.currentTarget.getAttribute('data-value');
                const visibleText = e.currentTarget.textContent;
                
                if (selectedThemeText) selectedThemeText.textContent = visibleText;
                if (themeHiddenInput) themeHiddenInput.value = selectedTheme;
                document.documentElement.setAttribute('data-theme', selectedTheme);
                
                closeAllMenus();
            });
        });
    }

    // === 3. LANGUAGE DROPDOWN LOGIC ===
    if (langBtn && langMenu) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const isMenuOpen = langMenu.classList.contains('show');
            closeAllMenus(); 
            if (!isMenuOpen) {
                langMenu.classList.add('show');
                langBtn.classList.add('active');
            }
        });

        langMenu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', (e) => {
                const selectedLang = e.currentTarget.getAttribute('data-value');
                const visibleText = e.currentTarget.textContent;
                
                if (selectedLangText) selectedLangText.textContent = visibleText;
                if (langHiddenInput) langHiddenInput.value = selectedLang;
                
                closeAllMenus();
            });
        });
    }

    // === 4. GENDER DROPDOWN LOGIC ===
    if (genderBtn && genderMenu) {
        genderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isMenuOpen = genderMenu.classList.contains('show');
            closeAllMenus(); 
            if (!isMenuOpen) {
                genderMenu.classList.add('show');
                genderBtn.classList.add('active');
            }
        });

        genderMenu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', (e) => {
                const rawValue = e.currentTarget.getAttribute('data-value');
                const visibleText = e.currentTarget.textContent;
                
                if (selectedGenderText) selectedGenderText.textContent = visibleText;
                if (genderHiddenInput) genderHiddenInput.value = rawValue;
                
                closeAllMenus();
            });
        });
    }

    // === 5. GLOBAL CLOSE EVENT ===
    document.addEventListener('click', () => {
        closeAllMenus();
    });
});
