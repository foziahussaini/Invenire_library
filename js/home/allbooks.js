import { db } from "../../src/firebase-config.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// =========================================================
// FIREBASE AUTH
// =========================================================

const auth = getAuth();


// =========================================================
// MAIN CONTAINER
// =========================================================

const topPicksContainer =
    document.querySelector("#top-picks-container");


// =========================================================
// FALLBACK BOOKS
// =========================================================
// These are only for the HOME catalog.
// They are NEVER used by the Library page.

const fallbackBooks = [
    {
        id: "fallback-1",
        book_name: "The Alchemist",
        author: "Paulo Coelho",
        short_details:
            "A magical story about Santiago, an Andalusian shepherd boy who searches for a worldly treasure.",
        cover_image:
            "https://gstatic.com",
        pdf_url:
            "../pdfs/crime-and-punishments.pdf",
        audio_url:
            ""
    },

    {
        id: "fallback-2",
        book_name: "Her Eyes",
        author: "Elef Shavak",
        short_details:
            "A Persian literary novel centered around mystery, memory and human emotions.",
        cover_image:
            "https://shstatics.shopipersia.com/wp-content/uploads/2020/07/s-l500-1-31.jpg",
        pdf_url:
            "../pdfs/hfuz_چشم_هایش_(بزرگ_علوی).pdf",
        audio_url:
            "/audioPlayer/her-eyes.mp3"
    },

    {
        id: "fallback-3",
        book_name: "Crime and Punishment",
        author: "Fyodor Dostoevsky",
        short_details:
            "A psychological novel exploring guilt, morality and the consequences of crime.",
        cover_image:
            "../images/logo/logo.png",
        pdf_url:
            "",
        audio_url:
            ""
    }
];


// =========================================================
// USER STATE
// =========================================================

let currentUser = null;

let currentUserMemberId = null;

let userLibraryBookIds = new Set();


// =========================================================
// AUTH STATE
// =========================================================

onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    userLibraryBookIds = new Set();

    currentUserMemberId = null;


    if (!user) {

        console.log(
            "No authenticated user. Add to Library requires login."
        );

        return;
    }


    console.log(
        "Authenticated user:",
        user.uid
    );


    await loadUserLibraryState(user);

    updateAllLibraryButtons();
});


// =========================================================
// DOM READY
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // IMPORTANT:
    // allbooks.js is also loaded on dashboard pages.
    // If Home catalog does not exist, simply do nothing.
    // =====================================================

    if (!topPicksContainer) {
        return;
    }


    loadBooksToGrid();
});


// =========================================================
// LOAD BOOK CATALOG
// =========================================================

async function loadBooksToGrid() {

    if (!topPicksContainer) return;


    try {

        topPicksContainer.innerHTML = `
            <div
                class="loading-state"
                style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 2rem;
                    color: var(--main-text-color);
                "
            >
                <i class="fas fa-spinner fa-spin"></i>
                Loading books...
            </div>
        `;


        let booksArray = [];


        try {

            const querySnapshot =
                await getDocs(
                    collection(db, "book-list")
                );


            if (!querySnapshot.empty) {

                querySnapshot.forEach((docSnap) => {

                    const book =
                        docSnap.data();


                    booksArray.push({

                        id:
                            docSnap.id,

                        book_name:
                            book.book_name ||
                            book.title ||
                            "Untitled Book",

                        author:
                            book.author ||
                            "Unknown Author",

                        short_details:
                            book.short_details ||
                            book.description ||
                            "No description available.",

                        cover_image:
                            book.cover_image ||
                            book.cover_url ||
                            "../images/logo/logo.png",

                        pdf_url:
                            book.pdf_url ||
                            "",

                        audio_url:
                            book.audio_url ||
                            ""

                    });

                });

            } else {

                // Firestore has no books.
                // Fallback is ONLY for Home.

                booksArray = [
                    ...fallbackBooks
                ];
            }


        } catch (firestoreError) {

            console.error(
                "Could not load Firestore books:",
                firestoreError
            );


            // Fallback is ONLY for Home.

            booksArray = [
                ...fallbackBooks
            ];
        }


        renderGridCards(
            booksArray
        );


    } catch (error) {

        console.error(
            "Critical catalog error:",
            error
        );


        topPicksContainer.innerHTML = `
            <div
                class="loading-state"
                style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 2rem;
                "
            >
                Unable to load books.
            </div>
        `;
    }
}


// =========================================================
// FIND CURRENT USER'S MEMBER DOCUMENT
// =========================================================
// Auth UID and members.user_id are not guaranteed to match.
// The current project maps the authenticated user to members
// through the email address.

async function getCurrentMember(user) {

    if (!user?.email) {
        return null;
    }


    const email =
        user.email
            .trim()
            .toLowerCase();


    try {

        const membersRef =
            collection(
                db,
                "members"
            );


        const memberQuery =
            query(
                membersRef,
                where(
                    "email",
                    "==",
                    email
                )
            );


        const memberSnapshot =
            await getDocs(
                memberQuery
            );


        if (memberSnapshot.empty) {

            console.warn(
                "No member found for email:",
                email
            );

            return null;
        }


        const memberDoc =
            memberSnapshot.docs[0];


        console.log(
            "Member document:",
            memberDoc.id
        );


        return memberDoc;

    } catch (error) {

        console.error(
            "Failed to find member by email:",
            error
        );

        return null;
    }
}


// =========================================================
// LOAD CURRENT USER'S SAVED LIBRARY
// =========================================================

async function loadUserLibraryState(user) {

    if (!user) return;


    try {

        const memberDoc =
            await getCurrentMember(
                user
            );


        if (!memberDoc) {

            currentUserMemberId =
                null;

            return;
        }


        currentUserMemberId =
            memberDoc.id;


        const libraryRef =
            collection(
                db,
                "members",
                currentUserMemberId,
                "my-library"
            );


        const librarySnapshot =
            await getDocs(
                libraryRef
            );


        librarySnapshot.forEach((libraryDoc) => {

            userLibraryBookIds.add(
                libraryDoc.id
            );

        });


        console.log(
            "Saved library books:",
            [...userLibraryBookIds]
        );


    } catch (error) {

        console.error(
            "Failed to load user's library state:",
            error
        );
    }
}


// =========================================================
// RENDER BOOK CARDS
// =========================================================

function renderGridCards(booksList) {

    if (!topPicksContainer) return;


    let cardsHTML = "";


    booksList.forEach((book) => {

        const hasPdf =
            book.pdf_url &&
            book.pdf_url !== "#";


        const hasAudio =
            book.audio_url &&
            book.audio_url !== "#";


        const isSaved =
            userLibraryBookIds.has(
                book.id
            );


        let actionsHTML = "";


        // =================================================
        // PDF + AUDIO
        // =================================================

        if (hasPdf && hasAudio) {

            actionsHTML = `

                <button
                    type="button"
                    class="book-btn read-btn"
                    data-media-url="${escapeHTML(book.pdf_url)}"
                    data-type="pdf"
                >
                    <i data-lucide="book-open"></i>
                    Read
                </button>


                <button
                    type="button"
                    class="book-btn play-audio-btn"
                    data-media-url="${escapeHTML(book.audio_url)}"
                    data-type="audio"
                >
                    <i data-lucide="play"></i>
                    Listen
                </button>


                ${createLibraryButton(
                    book.id,
                    isSaved
                )}


                <button
                    type="button"
                    class="book-btn download-btn"
                    data-media-url="${escapeHTML(book.pdf_url)}"
                >
                    <i data-lucide="download"></i>
                    Download PDF
                </button>

            `;
        }


        // =================================================
        // AUDIO ONLY
        // =================================================

        else if (hasAudio && !hasPdf) {

            actionsHTML = `

                <button
                    type="button"
                    class="book-btn play-audio-btn"
                    data-media-url="${escapeHTML(book.audio_url)}"
                    data-type="audio"
                >
                    <i data-lucide="play"></i>
                    Listen
                </button>


                ${createLibraryButton(
                    book.id,
                    isSaved
                )}


                <button
                    type="button"
                    class="book-btn download-btn"
                    data-media-url="${escapeHTML(book.audio_url)}"
                >
                    <i data-lucide="download"></i>
                    Download
                </button>

            `;
        }


        // =================================================
        // PDF ONLY / NO MEDIA
        // =================================================

        else {

            const activeUrl =
                book.pdf_url || "#";


            actionsHTML = `

                <button
                    type="button"
                    class="book-btn read-btn"
                    data-media-url="${escapeHTML(activeUrl)}"
                    data-type="pdf"
                >
                    <i data-lucide="book-open"></i>
                    Read
                </button>


                ${createLibraryButton(
                    book.id,
                    isSaved
                )}


                <button
                    type="button"
                    class="book-btn download-btn"
                    data-media-url="${escapeHTML(activeUrl)}"
                >
                    <i data-lucide="download"></i>
                    Download PDF
                </button>

            `;
        }


        // =================================================
        // COMPLETE CARD
        // =================================================

        cardsHTML += `

            <article
                class="book-card"
                data-id="${escapeHTML(book.id)}"
            >

                <div class="book-cover">

                    <img
                        src="${escapeHTML(book.cover_image)}"
                        alt="${escapeHTML(book.book_name)} cover"
                        loading="lazy"
                        onerror="
                            this.src='../images/logo/logo.png';
                        "
                    >

                </div>


                <div class="book-info">

                    <h3 class="book-title">
                        ${escapeHTML(book.book_name)}
                    </h3>


                    <p class="book-author">
                        by ${escapeHTML(book.author)}
                    </p>


                    <div class="description-wrapper">

                        <p
                            class="book-description collapsed"
                        >
                            ${escapeHTML(book.short_details)}
                        </p>


                        <button
                            type="button"
                            class="toggle-desc-btn"
                        >

                            <span class="btn-text">
                                Read More
                            </span>

                            <i
                                class="fa-solid fa-chevron-down toggle-icon"
                            ></i>

                        </button>

                    </div>


                    <div class="book-actions">

                        ${actionsHTML}

                    </div>

                </div>

            </article>

        `;

    });


    topPicksContainer.innerHTML =
        cardsHTML;


    // =====================================================
    // LUCIDE ICONS
    // =====================================================

    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }


    setupDescriptionCollapsibleListeners();

    setupLibraryButtonListeners();
}


// =========================================================
// CREATE LIBRARY BUTTON
// =========================================================

function createLibraryButton(
    bookId,
    isSaved
) {

    if (isSaved) {

        return `

            <button
                type="button"
                class="book-btn library-btn library-added"
                data-book-id="${escapeHTML(bookId)}"
                aria-label="Book already added to library"
            >
                <i data-lucide="library-check"></i>
                In Library
            </button>

        `;
    }


    return `

        <button
            type="button"
            class="book-btn library-btn"
            data-book-id="${escapeHTML(bookId)}"
        >
            <i data-lucide="library"></i>
            Add to Library
        </button>

    `;
}


// =========================================================
// LIBRARY BUTTON LISTENERS
// =========================================================

function setupLibraryButtonListeners() {

    document
        .querySelectorAll(".library-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                async () => {

                    const bookId =
                        button.dataset.bookId;


                    if (!bookId) {

                        console.error(
                            "Library button has no book ID."
                        );

                        return;
                    }


                    // -------------------------------------
                    // NOT LOGGED IN
                    // -------------------------------------

                    if (!currentUser) {

                        openLoginRequiredModal();

                        return;
                    }


                    // -------------------------------------
                    // ALREADY SAVED
                    // -------------------------------------

                    if (
                        userLibraryBookIds.has(
                            bookId
                        )
                    ) {

                        return;
                    }


                    // -------------------------------------
                    // SAVE BOOK
                    // -------------------------------------

                    await addBookToLibrary(
                        bookId,
                        button
                    );

                }
            );

        });
}


// =========================================================
// ADD BOOK TO FIRESTORE LIBRARY
// =========================================================

async function addBookToLibrary(
    bookId,
    button
) {

    if (!currentUser) {

        openLoginRequiredModal();

        return;
    }


    try {

        // =================================================
        // FIND MEMBER DOCUMENT
        // =================================================

        if (!currentUserMemberId) {

            const memberDoc =
                await getCurrentMember(
                    currentUser
                );


            if (!memberDoc) {

                alert(
                    "Your account profile could not be found."
                );

                return;
            }


            currentUserMemberId =
                memberDoc.id;
        }


        if (!currentUserMemberId) {

            alert(
                "Your account profile could not be found."
            );

            return;
        }


        // =================================================
        // CHECK WHETHER BOOK STILL EXISTS
        // =================================================

        const bookRef =
            doc(
                db,
                "book-list",
                bookId
            );


        const bookSnapshot =
            await getDoc(
                bookRef
            );


        if (!bookSnapshot.exists()) {

            alert(
                "This book is no longer available."
            );

            return;
        }


        // =================================================
        // SAVE BOOK
        // =================================================

        const libraryBookRef =
            doc(
                db,
                "members",
                currentUserMemberId,
                "my-library",
                bookId
            );


        await setDoc(
            libraryBookRef,
            {
                book_id:
                    bookId,

                added_at:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );


        // =================================================
        // UPDATE LOCAL STATE
        // =================================================

        userLibraryBookIds.add(
            bookId
        );


        // =================================================
        // UPDATE BUTTON
        // =================================================

        setLibraryButtonAsAdded(
            button
        );


        console.log(
            "Book successfully added to library:",
            bookId
        );


    } catch (error) {

        console.error(
            "ADD TO LIBRARY ERROR:",
            error
        );


        alert(
            `Could not add this book to your library.\n\n${
                error.message || "Unknown error"
            }`
        );

    }
}


// =========================================================
// CHANGE BUTTON TO "IN LIBRARY"
// =========================================================

function setLibraryButtonAsAdded(
    button
) {

    if (!button) return;


    button.classList.add(
        "library-added"
    );


    button.innerHTML = `

        <i data-lucide="library-check"></i>
        In Library

    `;


    button.disabled = false;


    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }
}


// =========================================================
// UPDATE ALL BUTTONS
// =========================================================

function updateAllLibraryButtons() {

    document
        .querySelectorAll(".library-btn")
        .forEach((button) => {

            const bookId =
                button.dataset.bookId;


            if (
                bookId &&
                userLibraryBookIds.has(
                    bookId
                )
            ) {

                setLibraryButtonAsAdded(
                    button
                );

            }

        });
}


// =========================================================
// LOGIN REQUIRED MODAL
// =========================================================

function openLoginRequiredModal() {

    const modal =
        document.getElementById(
            "login-required-modal"
        );


    if (!modal) {

        console.warn(
            "#login-required-modal not found."
        );

        return;
    }


    modal.style.display =
        "flex";
}


// =========================================================
// CLOSE LOGIN MODAL
// =========================================================

function closeLoginRequiredModal() {

    const modal =
        document.getElementById(
            "login-required-modal"
        );


    if (!modal) return;


    modal.style.display =
        "none";
}


// =========================================================
// LOGIN MODAL EVENTS
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const modal =
            document.getElementById(
                "login-required-modal"
            );


        const closeButton =
            document.getElementById(
                "login-required-close"
            );


        closeButton?.addEventListener(
            "click",
            closeLoginRequiredModal
        );


        modal?.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    modal
                ) {

                    closeLoginRequiredModal();

                }

            }
        );

    }
);


// =========================================================
// DESCRIPTION COLLAPSIBLE
// =========================================================

function setupDescriptionCollapsibleListeners() {

    document
        .querySelectorAll(
            ".toggle-desc-btn"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();


                    const wrapper =
                        event.currentTarget.closest(
                            ".description-wrapper"
                        );


                    if (!wrapper) return;


                    const description =
                        wrapper.querySelector(
                            ".book-description"
                        );


                    const buttonText =
                        wrapper.querySelector(
                            ".btn-text"
                        );


                    const icon =
                        wrapper.querySelector(
                            ".toggle-icon"
                        );


                    if (
                        description.classList.contains(
                            "collapsed"
                        )
                    ) {

                        description.classList.remove(
                            "collapsed"
                        );

                        description.classList.add(
                            "expanded"
                        );


                        if (buttonText) {

                            buttonText.textContent =
                                "Read Less";

                        }


                        if (icon) {

                            icon.style.transform =
                                "rotate(180deg)";

                        }

                    } else {

                        description.classList.remove(
                            "expanded"
                        );

                        description.classList.add(
                            "collapsed"
                        );


                        if (buttonText) {

                            buttonText.textContent =
                                "Read More";

                        }


                        if (icon) {

                            icon.style.transform =
                                "rotate(0deg)";

                        }

                    }

                }
            );

        });
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}