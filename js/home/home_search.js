import { db } from "../../src/firebase-config.js";
import { openBookDetailsModal } from "./recent_section.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth } from "../../src/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


// ==================== FALLBACK BOOKS ====================

const fallbackBooks = [
    {
        id: "fallback-1",
        book_name: "The Alchemist",
        author: "Paulo Coelho",
        short_details: "",
        cover_image: "",
        genre: "Fiction",
        published: "",
        pages: "",
        language: "",
        rating: 0,
        pdf_url: ""
    },
    {
        id: "fallback-2",
        book_name: "Her Eyes",
        author: "Bozorg Alavi",
        short_details: "",
        cover_image: "",
        genre: "Fiction",
        published: "",
        pages: "",
        language: "",
        rating: 0,
        pdf_url: ""
    },
    {
        id: "fallback-3",
        book_name: "Crime and Punishment",
        author: "Fyodor Dostoevsky",
        short_details: "",
        cover_image: "",
        genre: "Classic",
        published: "",
        pages: "",
        language: "",
        rating: 0,
        pdf_url: ""
    }
];


// ==================== SEARCH ELEMENTS ====================

const searchInput = document.querySelector(".search-input");
const searchResultContainer = document.querySelector(".searchResult");
const searchClear = document.querySelector(".search-clear");
const categoryButtons = document.querySelectorAll(".category-btn");
const nextReadContainer = document.getElementById("next-read-container");

let allBooks = [];
let selectedCategory = "all";
let debounceTimeout;


// ==================== NORMALIZE TEXT ====================

function normalizeText(value) {
    return String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");
}

function saveSearchHistory(searchText) {
    const user = auth.currentUser;

    if (!user || !searchText) {
        return;
    }

    const key = `searchHistory_${user.uid}`;

    let history = [];

    try {
        history = JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        history = [];
    }

    const normalizedSearch = normalizeText(searchText);

    history = history.filter(
        (item) => normalizeText(item) !== normalizedSearch
    );

    history.unshift(searchText.trim());

    history = history.slice(0, 10);

    localStorage.setItem(key, JSON.stringify(history));
}


// ==================== LOAD BOOKS ====================

async function loadBooks() {
    try {
        const booksSnapshot = await getDocs(
            collection(db, "book-list")
        );

        const dynamicBooks = [];

        booksSnapshot.forEach((doc) => {
            const data = doc.data();

            dynamicBooks.push({
                id: doc.id,
                book_name: data.book_name || "Untitled Book",
                author: data.author || "Unknown Author",
                short_details:
                    data.short_details ||
                    data.description ||
                    "No description provided.",
                cover_image:
                    data.cover_image ||
                    data.image ||
                    "",
                genre: data.genre || "",
                published:
                    data.published ||
                    data.publication_year ||
                    "",
                pages: data.pages || "",
                language: data.language || "",
                rating: data.rating || 0,
                pdf_url: data.pdf_url || ""
            });
        });

        allBooks = dynamicBooks;
        renderNextReadBooks(); 

    } catch (error) {
        console.warn(
            "Could not load books from Firestore. Using fallback books.",
            error
        );

        allBooks = fallbackBooks;
        renderNextReadBooks();
    }
}

function getSearchHistory() {
    const user = auth.currentUser;

    if (!user) {
        return [];
    }

    const key = `searchHistory_${user.uid}`;

    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        return [];
    }
}

function getNextReadBooks() {
    if (!allBooks.length) {
        return [];
    }

    const history = getSearchHistory();

    // if the user doesnt have a search history
    if (history.length === 0) {
        return [...allBooks]
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
    }

    const searchTerms = history.map(normalizeText);

    const scoredBooks = allBooks.map((book) => {
        const bookName = normalizeText(book.book_name);
        const author = normalizeText(book.author);
        const genre = normalizeText(book.genre);

        let score = 0;

        searchTerms.forEach((term) => {
            if (bookName.includes(term)) {
                score += 5;
            }

            if (author.includes(term)) {
                score += 4;
            }

            if (genre.includes(term)) {
                score += 3;
            }
        });

        return {
            book,
            score
        };
    });

    return scoredBooks
        .sort((a, b) => b.score - a.score)
        .map((item) => item.book)
        .slice(0, 4);
}

function renderNextReadBooks() {
    if (!nextReadContainer) {
        return;
    }

    const books = getNextReadBooks();

    nextReadContainer.innerHTML = "";

    books.forEach((book) => {
        const title = book.book_name;
        const author = book.author;

        const fullDescription =
            book.short_details || "No description available.";

        const textLimit = 100;

        const isLongText =
            fullDescription.length > textLimit;

        const shortDescription = isLongText
            ? fullDescription.substring(0, textLimit) + "..."
            : fullDescription;

        const article = document.createElement("article");

        article.className = "book-cards card1";

        article.innerHTML = `
            <div class="book-cover">
                <img
                    src="${book.cover_image || ""}"
                    alt="${title} cover"
                >
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
                                class="toggle-desc-btn"
                            >
                                Read More
                            </button>
                        `
                        : ""
                }
            </bookdescription>
        `;

        if (isLongText) {
            const toggleBtn =
                article.querySelector(".toggle-desc-btn");

            toggleBtn?.addEventListener("click", (event) => {
                event.stopPropagation();
                openBookDetailsModal(book);
            });
        }

        article.addEventListener("click", () => {
            openBookDetailsModal(book);
        });

        nextReadContainer.appendChild(article);
    });
}


// ==================== CATEGORY MATCH ====================

function matchesCategory(book, category) {
    if (category === "all") {
        return true;
    }

    const selectedGenre = normalizeText(category);
    const bookGenre = book.genre;

    if (Array.isArray(bookGenre)) {
        return bookGenre.some(
            (genre) => normalizeText(genre) === selectedGenre
        );
    }

    const genres = String(bookGenre || "")
        .split(/[,|/]/)
        .map((genre) => normalizeText(genre))
        .filter(Boolean);

    return genres.includes(selectedGenre);
}


// ==================== SEARCH MATCH ====================

function matchesSearch(book, searchText) {
    if (!searchText) {
        return true;
    }

    const query = normalizeText(searchText);

    const bookName = normalizeText(book.book_name);
    const author = normalizeText(book.author);
    const genre = normalizeText(book.genre);

    return (
        bookName.includes(query) ||
        author.includes(query) ||
        genre.includes(query)
    );
}


// ==================== RENDER BOOK CARDS ====================

function renderSearchResults(books) {

    searchResultContainer.innerHTML = "";

    if (books.length === 0) {

        const noResultRow = document.createElement("div");

        noResultRow.className = "no-match";

        noResultRow.innerHTML = `
            <div class="sad-sticker">
                <div class="eyes"></div>
                <div class="mouth"></div>
            </div>

            <span>No result found</span>
        `;

        searchResultContainer.appendChild(noResultRow);

        searchResultContainer.style.display = "grid";

        return;
    }


    books.forEach((book) => {

        const title = book.book_name;
        const author = book.author;

        const fullDescription =
            book.short_details || "No description available.";

        const textLimit = 100;

        const isLongText =
            fullDescription.length > textLimit;

        const shortDescription = isLongText
            ? fullDescription.substring(0, textLimit) + "..."
            : fullDescription;


        const article = document.createElement("article");

        article.className =
            "book-cards card1 search-result-card";


        article.innerHTML = `
            <div class="book-cover">
                <img
                    src="${book.cover_image || ""}"
                    alt="${title} cover"
                >
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
                                class="toggle-desc-btn"
                            >
                                Read More
                            </button>
                        `
                        : ""
                }
            </bookdescription>
        `;


        // Read More
        if (isLongText) {

            const toggleBtn =
                article.querySelector(".toggle-desc-btn");

            toggleBtn?.addEventListener("click", (event) => {
                event.stopPropagation();
                openBookDetailsModal(book);
            });
        }


        // Card click
       article.addEventListener("click", () => {
            openBookDetailsModal(book);
        });


        searchResultContainer.appendChild(article);
    });


    searchResultContainer.style.display = "grid";
}


// ==================== FILTER RESULTS ====================

function filterAndRenderBooks() {

    const searchText =
        searchInput?.value.trim() || "";


    // Nothing selected
    if (
        searchText === "" &&
        selectedCategory === "all"
    ) {
        searchResultContainer.innerHTML = "";
        searchResultContainer.style.display = "none";

        return;
    }


    const filteredBooks = allBooks.filter((book) => {

        const categoryMatch =
            matchesCategory(
                book,
                selectedCategory
            );

        const searchMatch =
            matchesSearch(
                book,
                searchText
            );


        // IMPORTANT:
        // Category AND Search must both match
        return categoryMatch && searchMatch;
    });


    renderSearchResults(filteredBooks);
}


// ==================== SEARCH INPUT ====================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            clearTimeout(debounceTimeout);

            debounceTimeout = setTimeout(
                async () => {

                    if (allBooks.length === 0) {
                        await loadBooks();
                    }

                    filterAndRenderBooks();
                    saveSearchHistory(searchInput.value); 

                },
                300
            );
        }
    );
}


// ==================== CLEAR SEARCH ====================

if (searchClear) {

    searchClear.addEventListener(
        "click",
        async () => {

            searchInput.value = "";

            if (allBooks.length === 0) {
                await loadBooks();
            }

            filterAndRenderBooks();

            searchInput.focus();
        }
    );
}


// ==================== CATEGORY BUTTONS ====================

categoryButtons.forEach((button) => {

    button.addEventListener(
        "click",
        async () => {

            categoryButtons.forEach((btn) => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            selectedCategory =
                button.dataset.category || "all";


            if (allBooks.length === 0) {
                await loadBooks();
            }

            filterAndRenderBooks();
        }
    );
});

onAuthStateChanged(auth, async () => {
    await loadBooks();
})

