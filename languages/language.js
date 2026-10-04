const LANGUAGES = {
    en: EN,
    fa: FA,
    ps: PS
};

let currentLanguage = "en";

// Store the original English text
const originalTexts = new WeakMap();
const originalPlaceholders = new WeakMap();


// ------------------------------------
// Save original English text
// ------------------------------------

function saveOriginalTexts() {

    const elements = document.querySelectorAll(
        "body *:not(script):not(style)"
    );

    elements.forEach(element => {

        if (!originalTexts.has(element)) {

            const text = element.textContent.trim();

            if (text) {
                originalTexts.set(element, text);
            }
        }

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

function changeLanguage(language) {

    if (!LANGUAGES[language]) {
        console.log("Language not found:", language);
        return;
    }

    currentLanguage = language;

    const translation = LANGUAGES[language];

    saveOriginalTexts();

    // Translate normal text
    originalTexts.forEach;

    const elements = document.querySelectorAll(
        "body *:not(script):not(style)"
    );

    elements.forEach(element => {

        const original = originalTexts.get(element);

        if (!original) return;

        if (translation[original]) {
            element.textContent = translation[original];
        }
    });


    // Translate placeholders
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


    // Translate select options
    const options = document.querySelectorAll("option");

    options.forEach(option => {

        if (!option.dataset.originalText) {
            option.dataset.originalText =
                option.textContent.trim();
        }

        const original = option.dataset.originalText;

        if (translation[original]) {
            option.textContent = translation[original];
        }
    });


    // RTL for Farsi and Pashto
    if (language === "fa" || language === "ps") {

        document.documentElement.dir = "rtl";
        document.documentElement.lang = language;

        document.body.classList.add("rtl");

    } else {

        document.documentElement.dir = "ltr";
        document.documentElement.lang = "en";

        document.body.classList.remove("rtl");
    }


    // Remember user's choice
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

document.addEventListener("DOMContentLoaded", function () {

    saveOriginalTexts();


    // Check saved language
    const savedLanguage =
        localStorage.getItem("invenireLanguage");


    // Use saved language or English
    const language =
        savedLanguage && LANGUAGES[savedLanguage]
            ? savedLanguage
            : "en";


    changeLanguage(language);


    // Navbar dropdown
    const selector =
        document.getElementById("languageSelect");

    if (selector) {

        selector.addEventListener(
            "change",
            function () {

                changeLanguage(this.value);

            }
        );
    }


    // Navbar buttons
    const buttons =
        document.querySelectorAll("[data-language]");

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const language =
                    this.getAttribute("data-language");

                changeLanguage(language);

            }
        );
    });

});