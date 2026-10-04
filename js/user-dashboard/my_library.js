import { db } from "../../src/firebase-config.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { openBookDetailsModal } from "../home/recent_section.js";


// =========================================================
// FIREBASE AUTH
// =========================================================

const auth = getAuth();


// =========================================================
// STATE
// =========================================================

let currentUser = null;
let isLibraryLoaded = false;
let isLoading = false;


// =========================================================
// FIND LIBRARY CONTAINER
// =========================================================

function getLibraryContainer() {
    return (
        document.getElementById("your-library-books") ||
        document.getElementById("mylibrary-books") ||
        document.querySelector(".my-library .books-grid") ||
        document.querySelector(".mylibrary .books-grid")
    );
}


// =========================================================
// FIND CURRENT MEMBER BY FIREBASE AUTH EMAIL
// =========================================================

async function getCurrentMember(user) {

    if (!user?.email) {
        console.warn("Firebase user has no email.");
        return null;
    }

    const email = user.email.trim().toLowerCase();

    console.log("Searching member by email:", email);

    const membersRef = collection(db, "members");

    const memberQuery = query(
        membersRef,
        where("email", "==", email)
    );

    const memberSnapshot = await getDocs(memberQuery);

    console.log(
        "Members found:",
        memberSnapshot.size
    );

    if (memberSnapshot.empty) {
        console.warn(
            "No member found for email:",
            email
        );

        return null;
    }

    const memberDoc = memberSnapshot.docs[0];

    console.log(
        "Library member document:",
        memberDoc.id
    );

    console.log(
        "Library member data:",
        memberDoc.data()
    );

    return memberDoc;
}


// =========================================================
// AUTH STATE
// =========================================================

onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    const libraryContainer =
        getLibraryContainer();

    if (!libraryContainer) {

        console.warn(
            "Library container not found."
        );

        return;
    }


    // -----------------------------------------------------
    // USER IS NOT LOGGED IN
    // -----------------------------------------------------

    if (!user) {

        isLibraryLoaded = false;

        renderLoginRequired(
            libraryContainer
        );

        return;
    }


    // -----------------------------------------------------
    // USER IS LOGGED IN
    // -----------------------------------------------------

    console.log(
        "Library user:",
        user.uid
    );

    console.log(
        "Library user email:",
        user.email
    );

    isLibraryLoaded = false;

    await loadUserLibrary(user);

});


// =========================================================
// LOAD USER LIBRARY
// =========================================================

async function loadUserLibrary(user) {

    const targetContainer =
        getLibraryContainer();

    if (!targetContainer) {

        console.warn(
            "Library container not found."
        );

        return;
    }


    if (!user) {

        renderLoginRequired(
            targetContainer
        );

        return;
    }


    if (isLoading) {
        return;
    }


    try {

        isLoading = true;

        renderLoading(
            targetContainer
        );


        // =================================================
        // FIND MEMBER BY EMAIL
        // =================================================

        const memberDoc =
            await getCurrentMember(user);


        // -------------------------------------------------
        // MEMBER NOT FOUND
        // -------------------------------------------------

        if (!memberDoc) {

            console.log(
                "No member document found for current user."
            );

            renderEmptyLibrary(
                targetContainer
            );

            isLibraryLoaded = true;

            return;
        }


        // =================================================
        // USER LIBRARY COLLECTION
        // =================================================

        const libraryRef = collection(
            db,
            "members",
            memberDoc.id,
            "my-library"
        );


        const librarySnapshot =
            await getDocs(libraryRef);


        console.log(
            "Library books found:",
            librarySnapshot.size
        );


        // -------------------------------------------------
        // LIBRARY IS EMPTY
        // -------------------------------------------------

        if (librarySnapshot.empty) {

            console.log(
                "User library is empty."
            );

            renderEmptyLibrary(
                targetContainer
            );

            isLibraryLoaded = true;

            return;
        }


        // =================================================
        // GET BOOK IDS
        // =================================================

        const bookIds = [];

        librarySnapshot.forEach(
            (libraryDoc) => {

                if (libraryDoc.id) {

                    bookIds.push(
                        libraryDoc.id
                    );

                }

            }
        );


        const uniqueBookIds =
            [...new Set(bookIds)];


        console.log(
            "Unique library book IDs:",
            uniqueBookIds
        );


        // =================================================
        // GET BOOK DATA FROM BOOK-LIST
        // =================================================

        const books = [];

        const requests =
            uniqueBookIds.map(
                async (bookId) => {

                    try {

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


                        if (
                            !bookSnapshot.exists()
                        ) {

                            console.warn(
                                `Book ${bookId} no longer exists in book-list.`
                            );

                            return;
                        }


                        const data =
                            bookSnapshot.data();


                        books.push({

                            id:
                                bookSnapshot.id,

                            book_name:
                                data.book_name ||
                                data.title ||
                                "Untitled Book",

                            author:
                                data.author ||
                                "Unknown Author",

                            cover_image:
                                data.cover_image ||
                                data.cover_url ||
                                "",

                            pdf_url:
                                data.pdf_url ||
                                "",

                            audio_url:
                                data.audio_url ||
                                "",

                            short_details:
                                data.short_details ||
                                data.description ||
                                "No description available.",

                            genre:
                                data.genre ||
                                "",

                            published:
                                data.published ||
                                "",

                            pages:
                                data.pages ||
                                "",

                            language:
                                data.language ||
                                "",

                            rating:
                                data.rating ||
                                ""

                        });

                    } catch (error) {

                        console.error(
                            `Failed to load book ${bookId}:`,
                            error
                        );

                    }

                }
            );


        await Promise.all(
            requests
        );


        // =================================================
        // NO VALID BOOKS FOUND
        // =================================================

        if (books.length === 0) {

            console.warn(
                "Library contains saved book IDs, but no matching books were found."
            );

            renderEmptyLibrary(
                targetContainer
            );

            isLibraryLoaded = true;

            return;
        }


        // =================================================
        // RENDER USER LIBRARY
        // =================================================

        renderLibraryBooks(
            books,
            targetContainer
        );


        isLibraryLoaded = true;


    } catch (error) {

        console.error(
            "Library loading failed:",
            error
        );


        renderLibraryError(
            targetContainer
        );

    } finally {

        isLoading = false;

    }

}


// =========================================================
// LOADING STATE
// =========================================================

function renderLoading(container) {

    container.innerHTML = `

        <div class="library-message loading-state">

            <i class="fas fa-spinner fa-spin"></i>

            <p>
                Loading your library...
            </p>

        </div>

    `;

}


// =========================================================
// NOT LOGGED IN
// =========================================================

function renderLoginRequired(container) {

    container.innerHTML = `

        <div class="library-message login-required-library">

            <p>
                You are not logged in.
                Please log in or sign up
                to open your library.
            </p>

            <div class="library-message-actions">

                <a
                    href="login.html"
                    class="library-login-btn"
                >
                    Login
                </a>

                <a
                    href="signup.html"
                    class="library-signup-btn"
                >
                    Sign Up
                </a>

            </div>

        </div>

    `;

}


// =========================================================
// EMPTY LIBRARY
// =========================================================

function renderEmptyLibrary(container) {

    container.innerHTML = `

        <div class="library-message empty-library">

            <p>
                No book added to library yet.
            </p>

        </div>

    `;

}


// =========================================================
// ERROR
// =========================================================

function renderLibraryError(container) {

    container.innerHTML = `

        <div class="library-message library-error">

            <p>
                We couldn't load your library right now.
            </p>

        </div>

    `;

}


// =========================================================
// RENDER BOOKS
// =========================================================

function renderLibraryBooks(
    books,
    container
) {

    container.innerHTML = "";


    books.forEach((book) => {

        const article =
            document.createElement("article");


        // Same card class as Home
        article.className =
            "book-card";


        article.dataset.id =
            book.id;


        article.innerHTML = `

            <div class="book-cover">

                <img
                    src="${escapeHTML(book.cover_image)}"
                    alt="${escapeHTML(book.book_name)} cover"
                    loading="lazy"
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

                    <p class="book-description collapsed">
                        ${escapeHTML(book.short_details)}
                    </p>


                    <button
                        type="button"
                        class="toggle-desc-btn"
                    >

                        <span class="btn-text">
                            Read More
                        </span>

                        <i class="fa-solid fa-chevron-down toggle-icon"></i>

                    </button>

                </div>



        `;


        // =================================================
        // WHOLE CARD → EXISTING BOOK DETAILS MODAL
        // =================================================

        article.addEventListener(
            "click",
            () => {
              console.log("LIBRARY CARD CLCIKED",book);
              console.log("MODAL UNCTION:", openBookDetailsModal);

                openBookDetailsModal(book);

            }
        );


        // =================================================
        // DESCRIPTION TOGGLE
        // =================================================

        const descriptionButton =
            article.querySelector(
                ".toggle-desc-btn"
            );

        const description =
            article.querySelector(
                ".book-description"
            );

        const descriptionButtonText =
            descriptionButton?.querySelector(
                ".btn-text"
            );

        const descriptionIcon =
            descriptionButton?.querySelector(
                ".toggle-icon"
            );


        descriptionButton?.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                description?.classList.toggle(
                    "collapsed"
                );


                const isCollapsed =
                    description?.classList.contains(
                        "collapsed"
                    );


                if (descriptionButtonText) {

                    descriptionButtonText.textContent =
                        isCollapsed
                            ? "Read More"
                            : "Read Less";

                }


                descriptionIcon?.classList.toggle(
                    "fa-chevron-down",
                    isCollapsed
                );

                descriptionIcon?.classList.toggle(
                    "fa-chevron-up",
                    !isCollapsed
                );

            }
        );


        // =================================================
        // READ BUTTON
        // =================================================

        const readButton =
            article.querySelector(
                ".read-btn"
            );


        readButton?.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                openBookDetailsModal(book);

            }
        );


        // =================================================
        // LISTEN BUTTON
        // =================================================

        const listenButton =
            article.querySelector(
                ".play-audio-btn"
            );


        listenButton?.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();


                if (!book.audio_url) {

                    alert(
                        "Audio is not available for this book."
                    );

                    return;

                }


                window.open(
                    book.audio_url,
                    "_blank"
                );

            }
        );


        // =================================================
        // DOWNLOAD BUTTON
        // =================================================

        const downloadButton =
            article.querySelector(
                ".download-btn"
            );


        downloadButton?.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();


                if (!book.pdf_url) {

                    alert(
                        "PDF is not available for this book."
                    );

                    return;

                }


                const link =
                    document.createElement("a");


                link.href =
                    book.pdf_url;

                link.download =
                    `${book.book_name}.pdf`;

                link.target =
                    "_blank";


                document.body.appendChild(
                    link
                );

                link.click();

                link.remove();

            }
        );


        // =================================================
        // LIBRARY BUTTON
        // =================================================

        const libraryButton =
            article.querySelector(
                ".library-btn"
            );


        libraryButton?.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                // This book is already inside
                // the user's library.
                // No remove logic is added here yet.

            }
        );


        container.appendChild(
            article
        );

    });

}


// =========================================================
// OPEN BOOK
// =========================================================

function openBook(book) {

    openBookDetailsModal(book);

}


// =========================================================
// SECURITY HELPER
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


// =========================================================
// OPTIONAL GLOBAL RELOAD
// =========================================================

window.triggerLibraryReload =
    function () {

        const container =
            getLibraryContainer();


        if (!currentUser) {

            if (container) {

                renderLoginRequired(
                    container
                );

            }

            return;
        }


        isLibraryLoaded = false;

        loadUserLibrary(
            currentUser
        );

    };