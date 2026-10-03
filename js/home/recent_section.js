import { db } from "../../src/firebase-config.js";
import {
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { auth } from "../../src/firebase-config.js";
// ==================== FALLBACK BOOKS ====================

const fallbackBooks = [
    {
        id: "fallback-1",
        book_name: "The Alchemist",
        author: "Paulo Coelho",
        short_details: "A magical story about Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure.",
        cover_image: "https://gstatic.com",
        pdf_url: "../pdfs/crime-and-punishments.pdf",
        audio_url: ""
    },
    {
        id: "fallback-2",
        book_name: "Her Eyes",
        author: "Bozorg Alavi",
        short_details: "کتاب چشم هایش رمانی از بزرگ علوی است که برای نخستین بار در سال ۱۳۳۱ خورشیدی منتشر شد.",
        cover_image: "https://shopipersia.com",
        pdf_url: "../pdfs/hfuz_چشم_هایش_(بزرگ_علوی).pdf",
        audio_url: "/audioPlayer/her-eyes.mp3"
    },
    {
        id: "fallback-3",
        book_name: "Crime and Punishment (Audiobook)",
        author: "Fyodor Dostoevsky",
        short_details: "An audio adaptation tracking the mental anguish and moral dilemmas of Rodion Raskolnikov.",
        cover_image: "https://bing.net",
        pdf_url: "",
        audio_url: "#"
    }
];


// ==================== LOAD RECENT BOOKS ====================

document.addEventListener("DOMContentLoaded", () => {
    loadRecentBooks();
});


async function loadRecentBooks() {

    console.log("Auth state:", auth.currentUser ? "LOGGED IN" : "LOGGED OUT");
    console.log("Project ID:", db.app.options.projectId);
    console.log("Database ID:", db.app.options.databaseId);
    const querySnapshot = await getDocs(
    collection(db, "book-list")
    );


    const container = document.getElementById("recent-books");

    if (!container) return;

    try {
        console.log("Firestore project:", db.app.options.projectId);
        console.log("Current user:", auth.currentUser);

        const querySnapshot = await getDocs(
            collection(db, "book-list")
        );

        container.innerHTML = "";

        if (querySnapshot.empty) {

            console.warn(
                "Firestore collection is empty. Using fallback books."
            );

            renderBooksList(fallbackBooks, container);

            return;
        }

        const dynamicBooks = [];

        querySnapshot.forEach((doc) => {

            const data = doc.data();

            dynamicBooks.push({
                id: doc.id,

                book_name:
                    data.book_name ||
                    "Untitled Book",

                author:
                    data.author ||
                    "Unknown Author",

                short_details:
                    data.short_details ||
                    data.description ||
                    "No description provided.",

                cover_image:
                    data.cover_image ||
                    data.image ||
                    "https://bing.net",

                pdf_url:
                    data.pdf_url ||
                    "",

                genre:
                    data.genre ||
                    "",

                published:
                    data.published ||
                    data.publication_year ||
                    "",

                pages:
                    data.pages ||
                    "",

                language:
                    data.language ||
                    "",

                rating:
                    data.rating ||
                    0
            });
        });

        renderBooksList(dynamicBooks, container);

    } catch (error) {

        console.error(
            "Failed to load books from Firestore:",
            error
        );

        renderBooksList(fallbackBooks, container);
    }
}

// ==================== RENDER BOOK CARDS ====================

function renderBooksList(booksArray, targetContainer) {

    targetContainer.innerHTML = "";

    booksArray.forEach((book) => {

        const title = book.book_name;
        const author = book.author;
        const fullDescription =
            book.short_details || "No description available.";
        const coverImage = book.cover_image || "";

        const textLimit = 100;

        const isLongText =
            fullDescription.length > textLimit;

        const shortDescription = isLongText
            ? fullDescription.substring(0, textLimit) + "..."
            : fullDescription;


        // ==================== CREATE CARD ====================

        const article = document.createElement("article");

        article.className = "book-cards card1";


        article.innerHTML = `
            <div class="book-cover">
                <img
                    src="${coverImage}"
                    alt="${title} cover">
            </div>

            <div class="book-name">
                ${title}
            </div>

            <div class="book-author">
                ${author}
            </div>

            <bookdescription>

                <span class="desc-text">
                    ${shortDescription}
                </span>

                ${
                    isLongText
                        ? `
                            <button
                                type="button"
                                class="toggle-desc-btn">
                                Read More
                            </button>
                        `
                        : ""
                }

            </bookdescription>
        `;


        // ==================== DESCRIPTION TOGGLE ====================

        if (isLongText) {

            const toggleBtn =
                article.querySelector(".toggle-desc-btn");

            const descTextSpan =
                article.querySelector(".desc-text");

            toggleBtn?.addEventListener("click", (e) => {

                e.stopPropagation();

                // Read More should open Book Details
                openBookDetailsModal(book);

            });
        }


        // ==================== CARD CLICK ====================

        article.addEventListener("click", () => {

            openBookDetailsModal(book);

        });


        targetContainer.appendChild(article);

    });
}


// =========================================================
// BOOK DETAILS MODAL
// =========================================================

const detailsModal =
    document.getElementById("book-details-modal");

const detailsClose =
    document.getElementById("book-details-close");

const detailsReadBtn =
    document.getElementById("details-read-btn");

const detailsDownloadBtn =
    document.getElementById("details-download-btn");

const loginRequiredModal =
    document.getElementById("login-required-modal");

const loginRequiredClose =
    document.getElementById("login-required-close");


// ==================== OPEN BOOK DETAILS ====================

export function openBookDetailsModal(book) {

    if (!detailsModal) return;


    // ==================== COVER ====================

    const cover =
        document.getElementById("details-book-cover");

    if (cover) {

        cover.src =
            book.cover_image || "";

        cover.alt =
            `${book.book_name || "Book"} cover`;
    }


    // ==================== GENRE ====================

    const genre =
        document.getElementById("details-book-genre");

    if (genre) {

        genre.textContent =
            book.genre || "Book";
    }


    // ==================== TITLE ====================

    const title =
        document.getElementById("details-book-title");

    if (title) {

        title.textContent =
            book.book_name || "Untitled Book";
    }


    // ==================== AUTHOR ====================

    const author =
        document.getElementById("details-book-author");

    if (author) {

        author.textContent =
            book.author || "Unknown Author";
    }


    // ==================== RATING ====================

    const ratingValue =
        document.getElementById("details-rating-value");

    if (ratingValue) {

        ratingValue.textContent =
            Number(book.rating || 0).toFixed(1);
    }


    // ==================== PUBLISHED ====================

    const published =
        document.getElementById("details-book-published");

    if (published) {

        published.textContent =
            book.published || "—";
    }


    // ==================== PAGES ====================

    const pages =
        document.getElementById("details-book-pages");

    if (pages) {

        pages.textContent =
            book.pages || "—";
    }


    // ==================== LANGUAGE ====================

    const language =
        document.getElementById("details-book-language");

    if (language) {

        language.textContent =
            book.language || "—";
    }


    // ==================== GENRE INFORMATION ====================

    const genreInfo =
        document.getElementById("details-book-genre-info");

    if (genreInfo) {

        genreInfo.textContent =
            book.genre || "—";
    }


    // ==================== DESCRIPTION ====================

    const description =
        document.getElementById(
            "details-book-description"
        );

    if (description) {

        description.textContent =
            book.short_details ||
            "No description available.";
    }


    // ==================== PDF URL ====================

    if (detailsReadBtn) {

        detailsReadBtn.dataset.pdfUrl =
            book.pdf_url || "";
    }


    // ==================== SHOW MODAL ====================

    detailsModal.style.display =
        "flex";

    document.body.style.overflow =
        "hidden";
}


// =========================================================
// READ BOOK
// =========================================================

detailsReadBtn?.addEventListener("click", () => {
    const user = auth.currentUser;

    if (!user) {
        const loginModal = document.getElementById("login-required-modal");

        if (loginModal) {
            loginModal.style.display = "flex";
            document.body.style.overflow = "hidden";
        }

        return;
    }

    const pdfUrl = detailsReadBtn.dataset.pdfUrl;

    if (!pdfUrl) {
        alert("PDF is not available for this book.");
        return;
    }

    window.open(pdfUrl, "_blank");
});

// =========================================================
// DOWNLOAD BOOK
// =========================================================

detailsDownloadBtn?.addEventListener("click", () => {

    const pdfUrl =
        detailsReadBtn?.dataset.pdfUrl;

    if (!pdfUrl) {
        alert("PDF is not available for this book.");
        return;
    }

    const downloadLink =
        document.createElement("a");

    downloadLink.href = pdfUrl;
    downloadLink.target = "_blank";
    downloadLink.download = "";

    document.body.appendChild(downloadLink);

    downloadLink.click();

    downloadLink.remove();
});

// =========================================================
// LOGIN REQUIRED MODAL
// =========================================================

loginRequiredClose?.addEventListener("click", () => {
    if (loginRequiredModal) {
        loginRequiredModal.style.display = "none";
    }

    document.body.style.overflow = "";
});

loginRequiredModal?.addEventListener("click", (e) => {
    if (e.target === loginRequiredModal) {
        loginRequiredModal.style.display = "none";
        document.body.style.overflow = "";
    }
});


// =========================================================
// CLOSE BOOK DETAILS MODAL
// =========================================================

detailsClose?.addEventListener("click", () => {

    if (detailsModal) {

        detailsModal.style.display =
            "none";
    }

    document.body.style.overflow =
        "";
});


// ==================== CLOSE ON BACKDROP ====================

detailsModal?.addEventListener("click", (e) => {

    if (e.target === detailsModal) {

        detailsModal.style.display =
            "none";

        document.body.style.overflow =
            "";
    }
});