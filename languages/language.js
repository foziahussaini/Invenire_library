const LANGUAGES = {
    en: en,
    fa: fa,
    ps: ps
};
let currentLanguage = "en";
const originalTexts = new WeakMap();
const originalPlaceholders = new WeakMap();

function saveOriginalTexts() {
    const elements = document.querySelectorAll("body *:not(script):not(style)");
    elements.forEach(element => {
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
        if (element.matches("input, textarea") && !originalPlaceholders.has(element)) {
            originalPlaceholders.set(element, element.getAttribute("placeholder") || "");
        }
    });
}

// FIXED: Wrapped into a structural function to prevent crashing on page boot execution
function displayRandomGreeting(translation) {
    const greetingsList = translation && translation.warmGreetings ? translation.warmGreetings : [
        "Your next great adventure is waiting between the pages."
    ];
    const randomIndex = Math.floor(Math.random() * greetingsList.length);
    const selectedGreetingText = greetingsList[randomIndex];
    const quoteContainer = document.getElementById("welcome-quote") || document.querySelector(".greeting-subtext");
    if (quoteContainer) {
        quoteContainer.textContent = selectedGreetingText;
    }
}

// =========================================================
// WINDOW CHANGE LANGUAGE MAIN FUNCTION ENGINE
// =========================================================
window.changeLanguage = function (language) {
    if (!LANGUAGES[language]) {
        console.log("Language not found:", language);
        return;
    }
    currentLanguage = language;
    const translation = LANGUAGES[language];
    saveOriginalTexts();

    // 1. Translate standard text nodes
    const elements = document.querySelectorAll("body *:not(script):not(style)");
    elements.forEach(element => {
        const original = originalTexts.get(element);
        if (!original) return;
        const translated = translation[original];
        if (!translated) return;

        const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        if (textNodes.length === 0) return;
        if (textNodes.length === 1) {
            textNodes[0].textContent = textNodes[0].textContent.replace(textNodes[0].textContent.trim(), translated);
        } else {
            let remainingText = translated;
            textNodes.forEach((node, index) => {
                const originalText = node.textContent.trim();
                if (!originalText) return;
                if (index === textNodes.length - 1) {
                    node.textContent = remainingText;
                } else {
                    node.textContent = originalText;
                    remainingText = remainingText.replace(originalText, "").trim();
                }
            });
        }
    });

    // 2. Translate text input placeholders
    const formElements = document.querySelectorAll("input, textarea");
    formElements.forEach(element => {
        const original = originalPlaceholders.get(element);
        if (!original) return;
        if (translation[original]) {
            element.placeholder = translation[original];
        }
    });

    // 3. Translate select drop options
    const options = document.querySelectorAll("option");
    options.forEach(option => {
        if (!option.dataset.originalText) {
            option.dataset.originalText = option.textContent.trim();
        }
        const original = option.dataset.originalText;
        if (translation[original]) {
            option.textContent = translation[original];
        }
    });

    // 4. Update core page layouts and direction rules
    if (language === "fa" || language === "ps") {
        document.documentElement.dir = "rtl";
        document.documentElement.lang = language;
        document.body.classList.add("rtl");
    } else {
        document.documentElement.dir = "ltr";
        document.documentElement.lang = "en";
        document.body.classList.remove("rtl");
    }

    // FIXED: Run greeting layout generator updates dynamically using the active map data parameters
    displayRandomGreeting(translation);

    localStorage.setItem("invenireLanguage", language);
    updateLanguageSelector();
};

function updateLanguageSelector() {
    const selector = document.getElementById("languageSelect");
    if (selector) {
        selector.value = currentLanguage;
    }
    const buttons = document.querySelectorAll("[data-language]");
    buttons.forEach(button => {
        const language = button.getAttribute("data-language");
        button.classList.toggle("selected-language", language === currentLanguage);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    saveOriginalTexts();
    const savedLanguage = localStorage.getItem("invenireLanguage");
    const language = savedLanguage && LANGUAGES[savedLanguage] ? savedLanguage : "en";
    changeLanguage(language);

    const selector = document.getElementById("languageSelect");
    if (selector) {
        selector.addEventListener("change", function () {
            changeLanguage(this.value);
        });
    }

    const buttons = document.querySelectorAll("[data-language]");
    buttons.forEach(button => {
        button.addEventListener("click", function () {
            const language = this.getAttribute("data-language");
            changeLanguage(language);
        });
    });
});
