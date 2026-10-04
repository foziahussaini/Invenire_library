const LANGUAGES = {
    en: en,
    fa: fa,
    ps: ps
};

let currentLanguage = "en";

// Store original text and placeholders
const originalTexts = new WeakMap();
const originalPlaceholders = new WeakMap();


// ------------------------------------
// Save original text
// ------------------------------------

function saveOriginalTexts() {

    const elements = document.querySelectorAll(
        "body *:not(script):not(style)"
    );

    elements.forEach(element => {

        // Save only elements that contain direct text.
        // This prevents parent elements from replacing
        // their child elements such as <span>, <strong>, etc.
        if (!originalTexts.has(element)) {

            const directText = Array.from(element.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .filter(Boolean)
                .join(" ")
                .trim();

            if (directText) {
                originalTexts.set(element, directText);
            }
        }

        // Save original placeholders
        if (
            element.matches("input, textarea") &&
            !originalPlaceholders.has(element)
        ) {

            originalPlaceholders.set(
                element,
                element.getAttribute("placeholder") || ""
            );
        }
    });
}


// ------------------------------------
// Change language
// ------------------------------------

window.changeLanguage = function (language) {

    if (!LANGUAGES[language]) {
        console.log("Language not found:", language);
        return;
    }

    currentLanguage = language;

    const translation = LANGUAGES[language];

    saveOriginalTexts();


    // ------------------------------------
    // Translate direct text only
    // ------------------------------------

    originalTexts.forEach;

    const elements = document.querySelectorAll(
        "body *:not(script):not(style)"
    );

    elements.forEach(element => {

        const original = originalTexts.get(element);

        if (!original) return;

        const translated = translation[original];

        if (!translated) return;

        // Change only the direct text nodes.
        // Do NOT use element.textContent here,
        // because that would remove child elements.
        const textNodes = Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE);

        if (textNodes.length === 0) return;

        if (textNodes.length === 1) {

            textNodes[0].textContent =
                textNodes[0].textContent.replace(
                    textNodes[0].textContent.trim(),
                    translated
                );

        } else {

            // Preserve the HTML structure and replace
            // only the combined direct text.
            let remainingText = translated;

            textNodes.forEach((node, index) => {

                const originalText = node.textContent.trim();

                if (!originalText) return;

                if (index === textNodes.length - 1) {
                    node.textContent = remainingText;
                } else {
                    node.textContent = originalText;
                    remainingText = remainingText.replace(
                        originalText,
                        ""
                    ).trim();
                }
            });
        }
    });


    // ------------------------------------
    // Translate placeholders
    // ------------------------------------

    const formElements = document.querySelectorAll(
        "input, textarea"
    );

    formElements.forEach(element => {

        const original = originalPlaceholders.get(element);

        if (!original) return;

        if (translation[original]) {
            element.placeholder = translation[original];
        }
    });


    // ------------------------------------
    // Translate select options
    // ------------------------------------

    const options = document.querySelectorAll("option");

    options.forEach(option => {

        if (!option.dataset.originalText) {
            option.dataset.originalText =
                option.textContent.trim();
        }

        const original =
            option.dataset.originalText;

        if (translation[original]) {
            option.textContent =
                translation[original];
        }
    });


    // ------------------------------------
    // RTL for Farsi and Pashto
    // ------------------------------------

    if (language === "fa" || language === "ps") {

        document.documentElement.dir = "rtl";
        document.documentElement.lang = language;

        document.body.classList.add("rtl");

    } else {

        document.documentElement.dir = "ltr";
        document.documentElement.lang = "en";

        document.body.classList.remove("rtl");
    }


    // ------------------------------------
    // Remember user's choice
    // ------------------------------------

    localStorage.setItem(
        "invenireLanguage",
        language
    );


    updateLanguageSelector();
}


// ------------------------------------
// Language selector
// ------------------------------------

function updateLanguageSelector() {

    const selector =
        document.getElementById("languageSelect");

    if (selector) {
        selector.value = currentLanguage;
    }


    // If you use buttons instead
    const buttons =
        document.querySelectorAll("[data-language]");

    buttons.forEach(button => {

        const language =
            button.getAttribute("data-language");

        button.classList.toggle(
            "selected-language",
            language === currentLanguage
        );
    });
}


// ------------------------------------
// Start the language system
// ------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    function () {

        saveOriginalTexts();


        // Check saved language
        const savedLanguage =
            localStorage.getItem(
                "invenireLanguage"
            );


        // Use saved language or English
        const language =
            savedLanguage &&
            LANGUAGES[savedLanguage]
                ? savedLanguage
                : "en";


        changeLanguage(language);


        // ------------------------------------
        // Navbar dropdown
        // ------------------------------------

        const selector =
            document.getElementById(
                "languageSelect"
            );

        if (selector) {

            selector.addEventListener(
                "change",
                function () {

                    changeLanguage(
                        this.value
                    );

                }
            );
        }


        // ------------------------------------
        // Navbar language buttons
        // ------------------------------------

        const buttons =
            document.querySelectorAll(
                "[data-language]"
            );

        buttons.forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const language =
                        this.getAttribute(
                            "data-language"
                        );

                    changeLanguage(language);

                }
            );
        });

    }
);