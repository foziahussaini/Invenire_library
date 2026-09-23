import { db } from "../../src/firebase-config.js"; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const topPicksContainer = document.querySelector("#top-picks-container");
const fallbackBooks = [
    {
        id: "fallback-1",
        book_name: "The Alchemist",
        author: "Paulo Coelho",
        shortDetails: "A magical story about Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure.",
        cover_image: "https://gstatic.com",
        pdf_url: "#",
        audio_url: "" // PDF Only
    },
    {
        id: "fallback-2",
        book_name: "The Great Gatsby (Hybrid Edition)",
        author: "F. Scott Fitzgerald",
        shortDetails: "A classic novel about the dark side of the American Dream. This entry features BOTH the PDF readable file and the Audiobook track!",
        cover_image: "https://gstatic.com",
        pdf_url: "#",
        audio_url: "#" // Both PDF and Audio are present!
    },
    {
        id: "fallback-3",
        book_name: "Crime and Punishment (Audiobook)",
        author: "Fyodor Dostoevsky",
        shortDetails: "An audio adaptation tracking the mental anguish and moral dilemmas of Rodion Raskolnikov, a poor ex-student in Saint Petersburg.",
        cover_image: "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js",
        pdf_url: "",
        audio_url: "#" // Audio Only
    }
];

document.addEventListener("DOMContentLoaded", () => {
    if (!topPicksContainer) {
        console.error("Error: Container element '#top-picks-container' not found in the HTML.");
        return;
    }
    loadBooksToGrid();
});

// 2. MAIN DATA PROCESSING & LOADING CONTROLLER
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
                        shortDetails: book.shortDetails || "No description available for this catalog entry.",
                        cover_image: book.cover_image || "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js",
                        pdf_url: book.pdf_url || "",
                        audio_url: book.audio_url || ""
                    });
                });
            } else {
                booksArray = [...fallbackBooks];
            }
        } catch (networkOrAuthError) {
            console.error("Network interface disconnected. Serving backup data loops:", networkOrAuthError);
            booksArray = [...fallbackBooks];
        }

        renderGridCards(booksArray);

    } catch (criticalError) {
        console.error("Critical layout engine failure:", criticalError);
        topPicksContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: red;">Layout engine fault. rendering emergency backups.</div>`;
        renderGridCards(fallbackBooks);
    }
}

// 3. DISPLAY ENGINE DRAWER WITH CONDITION FOR HYBRID MEDIA
function renderGridCards(booksList) {
    let cardsHTML = "";

    booksList.forEach((book) => {
        const hasPdf = book.pdf_url !== "" && book.pdf_url !== "#";
        const hasAudio = book.audio_url !== "" && book.audio_url !== "#";

        let actionsHTML = "";

        // SCENARIO 1: Book has BOTH PDF and Audio fields [INDEX]
        if (hasPdf && hasAudio) {
            actionsHTML = `
                <button type="button" class="book-btn read-btn" data-media-url="${book.pdf_url}" data-type="pdf">
                    <i data-lucide="book-open"></i> Read
                </button>
                <button type="button" class="book-btn play-audio-btn" data-media-url="${book.audio_url}" data-type="audio">
                    <i data-lucide="play"></i> Play Audio
                </button>
                <button type="button" class="book-btn library-btn">
                    <i data-lucide="library"></i> Add to Library
                </button>
                <button type="button" class="book-btn download-btn" data-media-url="${book.pdf_url}">
                    <i data-lucide="download"></i> Download PDF
                </button>
            `;
        } 
        // SCENARIO 2: Audiobook ONLY [INDEX]
        else if (hasAudio && !hasPdf) {
            actionsHTML = `
                <button type="button" class="book-btn read-btn" data-media-url="${book.audio_url}" data-type="audio">
                    <i data-lucide="play"></i> Play
                </button>
                <button type="button" class="book-btn library-btn">
                    <i data-lucide="library"></i> Add to Library
                </button>
                <button type="button" class="book-btn download-btn" data-media-url="${book.audio_url}">
                    <i data-lucide="download"></i> Download Only
                </button>
            `;
        } 
        // SCENARIO 3: PDF ONLY [INDEX]
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
                        <p class="book-description collapsed">${book.shortDetails}</p>
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
    }
    
    setupCardActionListeners();
    setupDescriptionCollapsibleListeners();
}

// 4. ACTION CONTROLLER LISTENERS
function setupCardActionListeners() {
    // Combined action for Read/Play buttons
    document.querySelectorAll(".read-btn, .play-audio-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const buttonElement = e.target.closest("button");
            const url = buttonElement.dataset.mediaUrl;
            
            if (url && url !== "#" && url !== "") {
                window.open(url, "_blank"); 
            } else {
                alert("The media asset location path link is empty or unresolved.");
            }
        });
    });

    // Download button action
    document.querySelectorAll(".download-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const url = e.target.closest("button").dataset.mediaUrl;
            if (url && url !== "#" && url !== "") {
                window.open(url, "_blank");
            } else {
                alert("Download link source file path trace unavailable.");
            }
        });
    });
}

// 5. COLLAPSIBLE DESCRIPTION HEIGHT ANIMATION LISTENERS
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
