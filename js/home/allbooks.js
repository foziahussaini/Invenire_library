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
        pdf_url: "../pdfs/crime-and-punishments.pdf", // Changed from '#' to a real path example
        audio_url: "" 
    },
    {
        id: "fallback-2",
        book_name: "Her Eyes",
        author: "Elef Shavak",
        shortDetails: "کتاب صوتی چشم هایش رمانی از بزرگ علوی است که برای نخستین بار در سال ۱۳۵۷ خورشیدی منتشر شد. بزرگ علوی در این رمان قطعات پراکنده یک ماجرا را کنار هم گذاشته و از آن طرحی کلی آفریده است که برحدس و گمان تکیه دارد این شیوه بیشتر در ادبیات پلیسی معمول است. برخی معتقدند این رمان و شخصت استاد ماکان، با الهام از زندگانی کمال‌الملک نگاشته شده است و گروهی دیگر آن را شرح حالی از زندگی تقی ارانی می‌دانند. این کتاب از آثار معدود زبان فارسی است که در مرکز آن یک زن با تمام عواطف و ارتعاشات روانی و ذهنی قرار گرفته است.",
        cover_image:"https://shstatics.shopipersia.com/wp-content/uploads/2020/07/s-l500-1-31.jpg",
        pdf_url: "../pdfs/hfuz_چشم_هایش_(بزرگ_علوی).pdf", // Changed from '#' to a real path example
        audio_url: "/audioPlayer/her-eyes.mp3" 
    },
    {
        id: "fallback-3",
        book_name: "Crime and Punishment (Audiobook)",
        author: "Fyodor Dostoevsky",
        shortDetails: "An audio adaptation tracking the mental anguish and moral dilemmas of Rodion Raskolnikov, a poor ex-student in Saint Petersburg.",
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
    cardActionListeners();
    if (typeof setupDescriptionCollapsibleListeners === 'function') {
        setupDescriptionCollapsibleListeners();
    }
}
// ACTION CONTROLLER LISTENERS
function cardActionListeners() {
    // 1. Combined action for Read/Play buttons
    document.querySelectorAll(".read-btn, .play-audio-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const buttonElement = e.currentTarget; 
            const url = buttonElement.dataset.mediaUrl; 
            
            // 🔍 Extract both the book title and author text elements dynamically
            const bookCard = buttonElement.closest(".book-card");
            let combinedHeaderTitle = "Library Asset";

            if (bookCard) {
                const bookName = bookCard.querySelector(".book-title").textContent.trim();
                
                // Extracts the author name (and cleans out any leading "by " text strings)
                let authorName = bookCard.querySelector(".book-author").textContent.trim();
                if (authorName.toLowerCase().startsWith("by ")) {
                    authorName = authorName.substring(3).trim();
                }

                // Combines them into your requested format
                combinedHeaderTitle = `${bookName} by ${authorName}`;
            }
            
            if (url && url !== "#" && url !== "") {
                // Pass the combined file description directly to the display engine
                openMediaOverlay(url, combinedHeaderTitle);
            } else {
                alert("The media asset location path link is empty or unresolved.");
            }
        });
    });

    const closeBtn = document.getElementById("pdf-close-btn");
    if (closeBtn) {
        closeBtn.replaceWith(closeBtn.cloneNode(true));
        document.getElementById("pdf-close-btn").addEventListener("click", () => {
            closeMediaOverlay(); 
        });
    }

    // 3. Download button action
    document.querySelectorAll(".download-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const buttonElement = e.currentTarget;
            const url = buttonElement.dataset.mediaUrl;
            
            if (url && url !== "#" && url !== "") {
                triggerSilentDownload(url);
            } else {
                alert("Download link source file path trace unavailable.");
            }
        });
    });
}

// Updated signature to accept 'bookName' with a generic fallback title match
function openMediaOverlay(url, bookName = "Library Book") {
    const overlay = document.getElementById("pdf-modal");
    const iframe = document.getElementById("pdf-frame");
    const audioWrapper = document.getElementById("audio-player-wrapper");
    const audioPlayer = document.getElementById("native-audio-player");
    const titleHeader = document.getElementById("modal-header-title");

    if (!overlay) return;

    let cleanUrl = url.trim();

    // 1. CHECK MEDIA TYPES
    const isYouTube = cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be");
    const isAudioFile = cleanUrl.toLowerCase().split('?')[0].endsWith(".mp3") || 
                        cleanUrl.toLowerCase().split('?')[0].endsWith(".wav") || 
                        (cleanUrl.includes("audio") && !isYouTube);

    // 2. DISPATCH ROUTING PIPELINE BASED ON ANALYSIS
    if (isYouTube) {
        // --- YOUTUBE PIPELINE ---
        if (audioWrapper) audioWrapper.style.display = "none";
        if (audioPlayer) { audioPlayer.pause(); audioPlayer.src = ""; }
        if (iframe) iframe.style.display = "block";
        
        if (titleHeader) titleHeader.textContent = `${bookName}`;

        // Extract Video IDs safely from standard, embed, or shortened share links
        let videoId = "";
        try {
            if (cleanUrl.includes("youtu.be/")) {
                videoId = cleanUrl.split("youtu.be/")[1].split("?")[0].split("&")[0];
            } else if (cleanUrl.includes("v=")) {
                videoId = cleanUrl.split("v=")[1].split("&")[0].split("?")[0];
            } else if (cleanUrl.includes("embed/")) {
                videoId = cleanUrl.split("embed/")[1].split("?")[0].split("&")[0];
            }
        } catch (err) {
            console.error("Error parsing YouTube video path elements: ", err);
        }
        
        if (iframe && videoId) {
           iframe.src = `https://youtube.com{videoId}?autoplay=1&rel=0`;
        } else if (iframe) {
            iframe.src = cleanUrl; 
        }

    } else if (isAudioFile) {
        // --- NATIVE STATIC MP3 PIPELINE ---
        if (iframe) { iframe.style.display = "none"; iframe.src = ""; }
        if (audioWrapper) audioWrapper.style.display = "flex";
        
        // Sets the main sliding window layout header title
        if (titleHeader) titleHeader.textContent = "Listening to Audiobook...";
        
        // 🔍 NEW: Targets the description paragraph inside your custom audio widget box
        if (audioWrapper) {
            const audioStatusParagraph = audioWrapper.querySelector("p");
            if (audioStatusParagraph) {
                // Updates "Audio stream ready" to your dynamic "Book Name by Author Name" format string
                audioStatusParagraph.textContent = bookName; 
            }
        }
        
        if (audioPlayer) {
            audioPlayer.src = cleanUrl;
            audioPlayer.load();
            audioPlayer.play().catch(err => console.log("Autoplay blocked, user interaction required: ", err));
        }

    } else {
        // --- STANDARD READING PIPELINE (PDF) ---
        if (audioWrapper) audioWrapper.style.display = "none";
        if (audioPlayer) { audioPlayer.pause(); audioPlayer.src = ""; }
        if (iframe) { iframe.style.display = "block"; iframe.src = cleanUrl; }
        
        if (titleHeader) titleHeader.textContent = `${bookName}`;
    }

    // Reveal and activate overlay layout window elements on screen coordinates
    overlay.style.display = "flex";
    overlay.classList.add("active");
    document.body.classList.add("pdf-reader-locked");
}


function closeMediaOverlay() {
    const overlay = document.getElementById("pdf-modal");
    const iframe = document.getElementById("pdf-frame");
    const audioPlayer = document.getElementById("native-audio-player");
    const readerElement = document.querySelector(".pdf-reader");

    if (overlay) {
        overlay.classList.remove("active");
        overlay.style.display = "none"; 
    }
    
    if (readerElement) {
        readerElement.classList.remove("fullscreen");
    }

    document.body.classList.remove("pdf-reader-locked");
    
    // Complete track audio & data flush engine memory sweep reset
    if (iframe) iframe.src = "";
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
    }
}

function triggerSilentDownload(url) {
    const link = document.createElement("a");
    link.href = url;
    const fileName = url.substring(url.lastIndexOf('/') + 1) || "book-download.pdf";
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
