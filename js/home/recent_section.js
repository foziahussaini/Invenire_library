import { db, auth } from "../../src/firebase-config.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { ensureBookDetailsModal } from "../components/book-details-modal.js";

ensureBookDetailsModal();

// =========================================================
// DOM ELEMENTS
// =========================================================

const detailsModal = document.getElementById("book-details-modal");

console.log("DETAILS MODAL:", detailsModal);

const detailsClose =
    document.getElementById("book-details-close");

const detailsReadBtn =
    document.getElementById("details-read-btn");

const detailsDownloadBtn =
    document.getElementById("details-download-btn");

const detailsLibraryBtn =
    document.getElementById("details-library-btn");

const loginRequiredModal =
    document.getElementById("login-required-modal");

const loginRequiredClose =
    document.getElementById("login-required-close");

let selectedBook = null;
let selectedBookInLibrary = false;

// =========================================================
// LOAD RECENT BOOKS
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    loadRecentBooks();
});

export async function openBookDetailsModal(book) {
    if (!detailsModal || !book?.id) return;
    
    selectedBookInLibrary = false;
    hideLibraryCheck();

    try {
        // =====================================================
        // FETCH SELECTED BOOK DATA DIRECTLY FROM FIRESTORE
        // =====================================================
        const bookRef = doc(db, "book-list", book.id);
        const bookSnapshot = await getDoc(bookRef);
        
        if (!bookSnapshot.exists()) {
            console.error("Book data not found in Firestore.");
            return;
        }
        
        // Update our global tracking variable with the latest data from the DB
        const freshBookData = bookSnapshot.data();
        selectedBook = { id: bookSnapshot.id, ...freshBookData };

        // =====================================================
        // CHECK LIBRARY STATUS
        // =====================================================
        const libraryState = await getUserLibraryBook(selectedBook.id);
        if (libraryState) {
            selectedBookInLibrary = true;
            showLibraryCheck();
        }

        // =====================================================
        // DISPLAY DATA IN MODAL UI ELEMENTS
        // =====================================================
        const cover = document.getElementById("details-book-cover");
        if (cover) {
            cover.src = selectedBook.cover_image || selectedBook.image || "";
            cover.alt = `${selectedBook.book_name || "Book"} cover`;
        }

        const genre = document.getElementById("details-book-genre");
        if (genre) genre.textContent = selectedBook.genre || "Book";

        const title = document.getElementById("details-book-title");
        if (title) title.textContent = selectedBook.book_name || "Untitled Book";

        const author = document.getElementById("details-book-author");
        if (author) author.textContent = selectedBook.author || "Unknown Author";

        const ratingValue = document.getElementById("details-rating-value");
        if (ratingValue) ratingValue.textContent = Number(selectedBook.rating || 0).toFixed(1);

        const published = document.getElementById("details-book-published");
        if (published) published.textContent = selectedBook.published || selectedBook.publication_year || "—";

        const pages = document.getElementById("details-book-pages");
        if (pages) pages.textContent = selectedBook.pages || "—";

        const language = document.getElementById("details-book-language");
        if (language) language.textContent = selectedBook.language || "—";

        const genreInfo = document.getElementById("details-book-genre-info");
        if (genreInfo) genreInfo.textContent = selectedBook.genre || "—";

        const description = document.getElementById("details-book-description");
        if (description) {
            description.textContent = selectedBook.short_details || selectedBook.description || "No description available.";
        }

        // =====================================================
        // DATA LINKS FOR READ BUTTON
        // =====================================================
        if (detailsReadBtn) {
            detailsReadBtn.dataset.pdfUrl = selectedBook.pdf_url || "";
            detailsReadBtn.dataset.audioUrl = selectedBook.audio_url || selectedBook.audio || "";
        }

        // =====================================================
        // SHOW MODAL
        // =====================================================
        console.log("OPENING DETAILS MODAL WITH FRESH DATA");
        detailsModal.style.display = "flex";
        document.body.style.overflow = "hidden";

    } catch (error) {
        console.error("Failed to load and open book details:", error);
    }
}

async function loadRecentBooks() {
    const container = document.getElementById("recent-books");
    if (!container) return;

    try {
        console.log("Firestore project:", db.app.options.projectId);
        console.log("Current user:", auth.currentUser);

        const querySnapshot = await getDocs(collection(db, "book-list"));
        container.innerHTML = "";

        if (querySnapshot.empty) {
            console.warn("No books found in book-list.");
            return;
        }

        const dynamicBooks = [];
        querySnapshot.forEach((bookDoc) => {
            const data = bookDoc.data();
            dynamicBooks.push({
                id: bookDoc.id,
                book_name: data.book_name || "Untitled Book",
                author: data.author || "Unknown Author",
                short_details: data.short_details || data.description || "No description provided.",
                cover_image: data.cover_image || data.image || "",
                pdf_url: data.pdf_url || "",
                audio_url: data.audio_url || data.audio || "",
                genre: data.genre || "",
                published: data.published || data.publication_year || "",
                pages: data.pages || "",
                language: data.language || "",
                rating: data.rating || 0
            });
        });

        renderBooksList(dynamicBooks, container);
    } catch (error) {
        console.error("Failed to load books from Firestore:", error);
    }
}

// =========================================================
// RENDER BOOK CARDS
// =========================================================

function renderBooksList(booksArray, targetContainer) {
    targetContainer.innerHTML = "";

    booksArray.forEach((book) => {
        const title = book.book_name || "Untitled Book";
        const author = book.author || "Unknown Author";
        const fullDescription = book.short_details || "No description available.";
        const coverImage = book.cover_image || "";
        const textLimit = 100;
        
        const isLongText = fullDescription.length > textLimit;
        const shortDescription = isLongText ? fullDescription.substring(0, textLimit) + "..." : fullDescription;

        // =================================================
        // CREATE CARD
        // =================================================
        const article = document.createElement("article");
        article.className = "book-cards card1";
        article.innerHTML = `
            <div class="book-cover">
                <img src="${coverImage}" alt="${title} cover">
            </div>
            <div class="book-name">${title}</div>
            <div class="book-author">${author}</div>
            <bookdescription>
                <span class="desc-text">${shortDescription}</span>
                ${isLongText ? `<button type="button" class="toggle-desc-btn">Read More</button>` : ""}
            </bookdescription>
        `;

        // =================================================
        // READ MORE
        // =================================================
        if (isLongText) {
            const toggleBtn = article.querySelector(".toggle-desc-btn");
            toggleBtn?.addEventListener("click", (event) => {
                event.stopPropagation();
                openBookDetailsModal(book);
            });
        }

        // =================================================
        // CARD CLICK
        // =================================================
        article.addEventListener("click", () => {
            openBookDetailsModal(book);
        });

        targetContainer.appendChild(article);
    });
}

// =========================================================
// FIND MEMBER BY AUTH EMAIL
// =========================================================

async function getCurrentMember() {
    const currentUser =
        auth.currentUser;

    if (!currentUser?.email) {
        return null;
    }

    const email =
        currentUser.email.trim().toLowerCase();

    console.log(
        "Searching member by email:",
        email
    );

    const membersQuery =
        query(
            collection(db, "members"),
            where(
                "email",
                "==",
                email
            )
        );

    const membersSnapshot =
        await getDocs(membersQuery);

    console.log(
        "Members found:",
        membersSnapshot.size
    );

    if (membersSnapshot.empty) {
        console.error(
            "No member document found for email:",
            email
        );

        return null;
    }

    const memberDoc =
        membersSnapshot.docs[0];

    console.log(
        "Member document:",
        memberDoc.id
    );

    console.log(
        "Member data:",
        memberDoc.data()
    );

    return memberDoc;
}

// =========================================================
// GET USER'S LIBRARY BOOK
// =========================================================

async function getUserLibraryBook(bookId) {

    const currentUser =
        auth.currentUser;

    if (!currentUser || !bookId) {
        return null;
    }

    const memberDoc =
        await getCurrentMember();

    if (!memberDoc) {
        return null;
    }

    const libraryBookRef =
        doc(
            db,
            "members",
            memberDoc.id,
            "my-library",
            bookId
        );

    const libraryBookSnapshot =
        await getDoc(libraryBookRef);

    if (!libraryBookSnapshot.exists()) {
        return null;
    }

    return {
        memberId: memberDoc.id,
        libraryDoc: libraryBookSnapshot
    };
}

// =========================================================
// SHOW LIBRARY CHECK
// =========================================================

function showLibraryCheck() {
    if (!detailsLibraryBtn) return;

    detailsLibraryBtn.classList.add("is-added");

    if (detailsLibraryBtn.querySelector(".library-check")) {
        return;
    }

    const checkMark = document.createElement("span");
    checkMark.className = "library-check";
    checkMark.innerHTML = '<i class="fa-solid fa-check"></i>';
    detailsLibraryBtn.appendChild(checkMark);
}

// =========================================================
// HIDE LIBRARY CHECK
// =========================================================
function hideLibraryCheck() {
    if (!detailsLibraryBtn) return;

    detailsLibraryBtn.classList.remove("is-added");
    
    const btnSpan = detailsLibraryBtn.querySelector("span");
    if (btnSpan) btnSpan.textContent = "Add to Library";

    detailsLibraryBtn.querySelector(".library-check")?.remove();
}

// =========================================================
// DOWNLOAD BOOK
// =========================================================
detailsDownloadBtn?.addEventListener("click", () => {
    const pdfUrl = detailsReadBtn?.dataset.pdfUrl;

    if (!pdfUrl) {
        alert("PDF is not available for this book.");
        return;
    }

    const downloadLink = document.createElement("a");
    downloadLink.href = pdfUrl;
    downloadLink.target = "_blank";
    downloadLink.download = "";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
});

// =========================================================
// READ BUTTON
// =========================================================
detailsReadBtn?.addEventListener("click", () => {
    const user = auth.currentUser;

    if (!user) {
        if (loginRequiredModal) {
            loginRequiredModal.style.display = "flex";
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
// LOGIN REQUIRED MODAL
// =========================================================
loginRequiredClose?.addEventListener("click", () => {
    if (loginRequiredModal) {
        loginRequiredModal.style.display = "none";
    }
    document.body.style.overflow = "";
});

loginRequiredModal?.addEventListener("click", (event) => {
    if (event.target === loginRequiredModal) {
        loginRequiredModal.style.display = "none";
        document.body.style.overflow = "";
    }
});

// =========================================================
// CLOSE BOOK DETAILS MODAL
// =========================================================
detailsClose?.addEventListener("click", () => {
    if (detailsModal) {
        detailsModal.style.display = "none";
    }
    document.body.style.overflow = "";
});

// =========================================================
// CLOSE ON BACKDROP
// =========================================================
detailsModal?.addEventListener("click", (event) => {
    if (event.target === detailsModal) {
        detailsModal.style.display = "none";
        document.body.style.overflow = "";
    }
});
