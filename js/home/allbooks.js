import { db } from "../../src/firebase-config.js"; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const topPicksContainer = document.querySelector("#top-picks-container");

const fallbackBooks = [
    {
        id: "fallback-1",
        book_name: "The Alchemist",
        author: "Paulo Coelho",
        short_details: "A magical story about Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure.",
        cover_image: "https://gstatic.com",
        pdf_url: "../pdfs/crime-and-punishments.pdf", // Changed from '#' to a real path example
        audio_url: "" 
    },
    {
        id: "fallback-2",
        book_name: "Her Eyes",
        author: "Elef Shavak",
        short_details: "کتاب صوتی چشم هایش رمانی از بزرگ علوی است که برای نخستین بار در سال ۱۳۵۷ خورشیدی منتشر شد. بزرگ علوی در این رمان قطعات پراکنده یک ماجرا را کنار هم گذاشته و از آن طرحی کلی آفریده است که برحدس و گمان تکیه دارد این شیوه بیشتر در ادبیات پلیسی معمول است. برخی معتقدند این رمان و شخصت استاد ماکان، با الهام از زندگانی کمال‌الملک نگاشته شده است و گروهی دیگر آن را شرح حالی از زندگی تقی ارانی می‌دانند. این کتاب از آثار معدود زبان فارسی است که در مرکز آن یک زن با تمام عواطف و ارتعاشات روانی و ذهنی قرار گرفته است.",
        cover_image:"https://shstatics.shopipersia.com/wp-content/uploads/2020/07/s-l500-1-31.jpg",
        pdf_url: "../pdfs/hfuz_چشم_هایش_(بزرگ_علوی).pdf", // Changed from '#' to a real path example
        audio_url: "/audioPlayer/her-eyes.mp3" 
    },
    {
        id: "fallback-3",
        book_name: "Crime and Punishment (Audiobook)",
        author: "Fyodor Dostoevsky",
        short_details: "An audio adaptation tracking the mental anguish and moral dilemmas of Rodion Raskolnikov, a poor ex-student in Saint Petersburg.",
        cover_image: "../pdfs/crime-and-punishments.pdf",
        pdf_url: "",
        audio_url: "#" 
    }
];

document.addEventListener("DOMContentLoaded", () => {
    if (!topPicksContainer) {
        console.error("Error: Container element '#top-picks-container' not found in the HTML.");
        return;
    }
    loadBooksToGrid();
});

// MAIN DATA PROCESSING & LOADING CONTROLLER
async function loadBooksToGrid() {
    try {
        topPicksContainer.innerHTML = `
            <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--main-text-color);">
                <i class="fas fa-spinner fa-spin"></i> Loading catalog entries from Firestore...
            </div>`;
        let booksArray = [];

        try {
            const querySnapshot = await getDocs(collection(db, "book-list"));
            if (!querySnapshot.empty) {
                querySnapshot.forEach((docSnap) => {
                    const book = docSnap.data();
                    booksArray.push({
                        id: docSnap.id,
                        book_name: book.book_name || "Untitled Book",
                        author: book.author || "Unknown Author",
                        short_details: book.short_details || "No description available for this catalog entry.",
                        cover_image: book.cover_image || "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js",
                        pdf_url: book.pdf_url || "",
                        audio_url: book.audio_url || ""
                    });
                });
            } else {
                booksArray = [...fallbackBooks];
            }
        } catch (networkOrAuthError) {
            console.error("Serving backup data loops:", networkOrAuthError);
            booksArray = [...fallbackBooks];
        }
        renderGridCards(booksArray);

    } catch (criticalError) {
        console.error("engine failure:", criticalError);
        topPicksContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: red;">Layout engine fault.</div>`;
        renderGridCards(fallbackBooks);
    }
}

// RENDER CARDS GRID
function renderGridCards(booksList) {
    let cardsHTML = "";

    booksList.forEach((book) => {
        const hasPdf = book.pdf_url !== "" && book.pdf_url !== "#";
        const hasAudio = book.audio_url !== "" && book.audio_url !== "#";
        let actionsHTML = "";

        // Book has BOTH PDF and Audio 
        if (hasPdf && hasAudio) {
            actionsHTML = `
                <button type="button" class="book-btn read-btn" data-media-url="${book.pdf_url}" data-type="pdf">
                    <i data-lucide="book-open"></i> Read
                </button>
                <button type="button" class="book-btn play-audio-btn" data-media-url="${book.audio_url}" data-type="audio">
                    <i data-lucide="play"></i> Listen
                </button>
                <button type="button" class="book-btn library-btn">
                    <i data-lucide="library"></i> Add to Library
                </button>
                <button type="button" class="book-btn download-btn" data-media-url="${book.pdf_url}">
                    <i data-lucide="download"></i> Download PDF
                </button>
            `;
        } 
        // Audiobook ONLY (Fixed missing </button> tag constraint)
        else if (hasAudio && !hasPdf) {
            actionsHTML = `
                <button type="button" class="book-btn play-audio-btn" data-media-url="${book.audio_url}" data-type="audio">
                    <i data-lucide="play"></i> Listen
                </button>
                <button type="button" class="book-btn library-btn">
                    <i data-lucide="library"></i> Add to Library
                </button>
                <button type="button" class="book-btn download-btn" data-media-url="${book.audio_url}">
                    <i data-lucide="download"></i> Download
                </button>
            `;
        } 
        // PDF ONLY
        else {
            const activeUrl = book.pdf_url || "#";
            actionsHTML = `
                <button type="button" class="book-btn read-btn" data-media-url="${activeUrl}" data-type="pdf">
                    <i data-lucide="book-open"></i> Read
                </button>
                <button type="button" class="book-btn library-btn">
                    <i data-lucide="library"></i> Add to Library
                </button>
                <button type="button" class="book-btn download-btn" data-media-url="${activeUrl}">
                    <i data-lucide="download"></i> Download PDF
                </button>
            `;
        }
        cardsHTML += `
            <article class="book-card" data-id="${book.id}">
                <div class="book-cover">
                    <img src="${book.cover_image}" alt="${book.book_name} cover">
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.book_name}</h3>
                    <p class="book-author">by ${book.author}</p>
                    
                    <div class="description-wrapper">
                        <p class="book-description collapsed">${book.short_details}</p>
                        <button type="button" class="toggle-desc-btn">
                            <span class="btn-text">Read More</span>
                            <i class="fa-solid fa-chevron-down toggle-icon"></i>
                        </button>
                    </div>

                    <div class="book-actions">
                        ${actionsHTML}
                    </div>
                </div>
            </article>
        `;
    });
    topPicksContainer.innerHTML = cardsHTML;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    
    if (typeof setupDescriptionCollapsibleListeners === 'function') {
        setupDescriptionCollapsibleListeners();
    }
}
}


function setupDescriptionCollapsibleListeners() {
    document.querySelectorAll(".toggle-desc-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const wrapper = e.target.closest(".description-wrapper");
            const descParagraph = wrapper.querySelector(".book-description");
            const btnText = wrapper.querySelector(".btn-text");
            const icon = wrapper.querySelector(".toggle-icon");

            if (descParagraph.classList.contains("collapsed")) {
                descParagraph.classList.remove("collapsed");
                descParagraph.classList.add("expanded");
                btnText.textContent = "Read Less";
                if (icon) icon.style.transform = "rotate(180deg)";
            } else {
                descParagraph.classList.remove("expanded");
                descParagraph.classList.add("collapsed");
                btnText.textContent = "Read More";
                if (icon) icon.style.transform = "rotate(0deg)";
            }
        });
    });
}
