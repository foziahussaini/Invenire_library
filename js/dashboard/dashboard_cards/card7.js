import { db } from "../../../src/firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// =====================================================
// CONFIGURATION
// =====================================================

const LIBRARY_SUBCOLLECTION = "my-library";
const MAX_POPULAR_BOOKS = 5;


// =====================================================
// FALLBACK POPULAR BOOKS
// =====================================================

const popularBooksDefault = [
    {
        name: "The Midnight Library",
        author: "Matt Haig",
        count: 412
    },
    {
        name: "Atomic Habits",
        author: "James Clear",
        count: 389
    },
    {
        name: "Project Hail Mary",
        author: "Andy Weir",
        count: 356
    },
    {
        name: "Padma Nadir Majhi",
        author: "Manik Bandopadhyay",
        count: 321
    },
    {
        name: "The Alchemist",
        author: "Paulo Coelho",
        count: 298
    }
];


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// GET BOOK NAME
// Supports several possible Firestore field names
// =====================================================

function getBookName(bookData, documentId) {
    return (
        bookData.book_name ||
        bookData.bookName ||
        bookData.name ||
        bookData.title ||
        bookData.book_title ||
        documentId ||
        "Unknown book"
    );
}


// =====================================================
// GET AUTHOR NAME
// =====================================================

function getAuthorName(bookData) {
    return (
        bookData.author ||
        bookData.book_author ||
        bookData.authorName ||
        "Unknown author"
    );
}


// =====================================================
// NORMALIZE BOOK NAME
// Groups same book names together
// =====================================================

function createBookKey(bookName) {
    return String(bookName)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


// =====================================================
// RENDER CARD 7
// =====================================================

function renderPopularBooksCard(books) {
    const mostPopularBooks = document.querySelector(".card7");

    if (!mostPopularBooks) {
        console.error("The .card7 element was not found.");
        return;
    }

    const sortedBooks = [...books]
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_POPULAR_BOOKS);

    mostPopularBooks.innerHTML = `
        <div class="popular-card-header">
            <div>
                <h3 class="popular-main-title">
                    Most Popular Books
                </h3>

                <p class="popular-sub-title">
                    Top books ranked by members adding them to my library
                </p>
            </div>

            <a
                href="../pages/admin_subPages/books.html"
                class="view-all-link"
            >
                View all ➔
            </a>
        </div>

        <div class="books-list-container"></div>
    `;

    const listContainer = mostPopularBooks.querySelector(
        ".books-list-container"
    );

    if (!listContainer) {
        return;
    }

    if (sortedBooks.length === 0) {
        listContainer.innerHTML = `
             <p
        class="overflow-hidden whitespace-nowrap border-r-2 border-blue-600 pr-1 text-center text-sm font-medium text-gray-800"
        style="
            width: 100%;
            animation:
                typing 3s steps(42, end) forwards,
                blink-caret 0.75s step-end infinite;
        "
    >
        No books have been added to a library yet.
    </p>
        `;

        return;
    }

    const highestCount = Math.max(
        ...sortedBooks.map(book => Number(book.count) || 0),
        1
    );

    sortedBooks.forEach((book, index) => {
        const displayRank = String(index + 1).padStart(2, "0");
        const numericCount = Number(book.count) || 0;

        const fillPercentage = Math.min(
            100,
            Math.max(0, (numericCount / highestCount) * 100)
        );

        const safeName = escapeHTML(book.name);
        const safeAuthor = escapeHTML(book.author);

        listContainer.insertAdjacentHTML(
            "beforeend",
            `
                <div class="book-row-item">
                    <div class="book-rank">
                        ${displayRank}
                    </div>

                    <div class="book-icon">
                        <span class="icon">📖</span>
                    </div>

                    <div class="popular-book-details">
                        <div class="popular-book-title">
                            <span title="${safeName}"> ${safeName}</span>
                        </div>
                        <div class="popular-book-author">
                            <span>${safeAuthor}</span>
                        </div>
                    </div>

                    <div class="progress-and-details">
                        <div class="progress-container">
                            <div
                                class="progress-fill-line"
                                style="width: ${fillPercentage}%"
                            ></div>
                        </div>

                        <div class="book-details-card">
                            Added by ${numericCount}
                            ${numericCount === 1 ? "member" : "members"}
                        </div>
                    </div>
                </div>
            `
        );
    });
}


// =====================================================
// LOAD POPULAR BOOKS FROM ALL MEMBERS
// =====================================================

async function loadPopularBooks() {
    const membersSnapshot = await getDocs(
        collection(db, "members")
    );

    const booksByName = new Map();

    await Promise.all(
        membersSnapshot.docs.map(async memberDocument => {
            const memberId = memberDocument.id;

            const librarySnapshot = await getDocs(
                collection(
                    db,
                    "members",
                    memberId,
                    LIBRARY_SUBCOLLECTION
                )
            );

            const booksAddedByThisMember = new Set();

            librarySnapshot.docs.forEach(bookDocument => {
                const bookData = bookDocument.data();

                const bookName = getBookName(
                    bookData,
                    bookDocument.id
                );

                const bookKey = createBookKey(bookName);

                if (booksAddedByThisMember.has(bookKey)) {
                    return;
                }

                booksAddedByThisMember.add(bookKey);

                if (!booksByName.has(bookKey)) {
                    booksByName.set(bookKey, {
                        name: bookName,
                        author: getAuthorName(bookData),
                        memberIds: new Set()
                    });
                }

                const bookRecord = booksByName.get(bookKey);

                bookRecord.memberIds.add(memberId);

                if (
                    bookRecord.author === "Unknown author" &&
                    getAuthorName(bookData) !== "Unknown author"
                ) {
                    bookRecord.author = getAuthorName(bookData);
                }
            });
        })
    );

    return Array.from(booksByName.values())
        .map(book => ({
            name: book.name,
            author: book.author,
            count: book.memberIds.size
        }))
        .sort((a, b) => b.count - a.count);
}


// =====================================================
// INITIALIZE CARD 7
// =====================================================

async function initializePopularBooksCard() {
    const cardElement = document.querySelector(".card7");

    if (!cardElement) {
        console.error("The .card7 element was not found.");
        return;
    }

    // Show fallback immediately while Firestore loads
    renderPopularBooksCard(popularBooksDefault);

    try {
        const popularBooks = await loadPopularBooks();

        if (popularBooks.length === 0) {
            renderPopularBooksCard([]);
            return;
        }

        renderPopularBooksCard(popularBooks);

        console.log("Live popular books:", popularBooks);
    } catch (error) {
        console.error(
            "Could not load books from members/my-library:",
            error
        );

        renderPopularBooksCard(popularBooksDefault);
    }
}


if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializePopularBooksCard,
        { once: true }
    );
} else {
    initializePopularBooksCard();
}