import { auth, db } from "../../src/firebase-config.js"; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. SELECT EXISTING HTML PLACEHOLDERS
    const progressCards = document.querySelectorAll(".progress-card");
    const emptyState = document.getElementById("progress-empty-state");

    if (progressCards.length === 0) return;

    // 2. FALLBACK METRIC STATIC DATA ARRAY
    const fallbackBooks = [
        {
            id: "fallback_before_we_were_yours",
            title: "Before we were yours",
            author: "Lisa Wingate",
            cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcsgueCmxLl_Awuw5gqkNpNmV1UlpWgAj1EAsUNteD-g&s=10",
            progress: 68
        },
        {
            id: "fallback_the_alchemist",
            title: "The Alchemist",
            author: "Paulo Coelho",
            cover: "https://m.media-amazon.com/images/I/81ZtAPCqyGL._AC_UF1000,1000_QL80_.jpg",
            progress: 42
        },
        {
            id: "fallback_atomic_habits",
            title: "Atomic Habits",
            author: "James Clear",
            cover: "../images/books/atomic-habits.jpg",
            progress: 25
        },
        {
            id: "fallback_the_little_prince",
            title: "The Little Prince",
            author: "Antoine de Saint-Exupéry",
            cover: "../images/books/little-prince.jpg",
            progress: 85
        }
    ];

    // 3. AUTHENTICATION & FIRESTORE DATABASE RUNTIME LOGIC
    auth.onAuthStateChanged(async (currentUser) => {
        // If the user isn't logged in, instantly serve the empty state since we have no data source
        if (!currentUser || !currentUser.email) {
            renderState([]);
            return;
        }

        try {
            // Pull tracking records from: db -> member -> [email] -> onReadMode
            const subcollRef = collection(db, "member", currentUser.email, "onReadMode");
            const querySnapshot = await getDocs(subcollRef);
            
            let loadedBooks = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                loadedBooks.push({
                    id: doc.id,
                    title: data.title || data.book_name || "Untitled Book",
                    author: data.author || "Unknown",
                    cover: data.cover || data.cover_image || "../images/books/default-cover.jpg",
                    progress: parseInt(data.progress || 0, 10)
                });
            });

            // Read potential metric override limits from sessionStorage
            const rawSessionValue = sessionStorage.getItem("progress-books-count");
            const sessionCount = rawSessionValue !== null ? parseInt(rawSessionValue, 10) : null;
            const checkSize = sessionCount !== null ? sessionCount : loadedBooks.length;

            // =========================================================
            // DYNAMIC CONDITIONS GATES
            // =========================================================
            if (checkSize >= 0 && checkSize <= 2) {
                // If firestore has 0, 1, or 2 books: show this emptyState same class and text
                renderState([]); 
            } else if (checkSize === 3) {
                // If less than 4 (exactly 3): show the fallback data
                renderState(fallbackBooks);
            } else {
                // If more than 3 (4 or more): show fire store data
                renderState(loadedBooks);
            }

        } catch (error) {
            console.log("Firestore loading crashed, falling back to empty state:", error);
            renderState([]);
        }
    });

    // 4. RENDERING ENGINE LOGIC FUNCTION
    function renderState(booksArray) {
        // First hide and reset all placeholder cards to avoid empty boxes showing on screen
        progressCards.forEach(card => {
            card.innerHTML = "";
            card.style.display = "none"; 
            
            // Clean up old cloned click listeners to avoid memory leaking
            const oldClone = card.cloneNode(true);
            card.parentNode.replaceChild(oldClone, card);
        });

        // Re-fetch fresh non-cloned hooks after memory cycle flush
        const activeCards = document.querySelectorAll(".progress-card");

        // Handle visibility of the empty state box element container
        if (booksArray.length === 0) {
            if (emptyState) emptyState.style.display = "flex";
            return;
        }

        if (emptyState) emptyState.style.display = "none";

        // Map the text and images arrays directly into your existing HTML cards structure
        booksArray.forEach((book, index) => {
            // Safety break check to ensure we don't look for cards that don't exist in HTML template files
            if (index >= activeCards.length) return; 

            const card = activeCards[index];
            card.style.display = "flex"; // Restores the card frame display to match flex rules
            card.style.cursor = "pointer"; // Indicates interactivity to users visually
            
            const progress = Math.min(Math.max(book.progress, 0), 100);
            
            // Add progress metric finished class modifier tokens if book is done
            if (progress >= 100) {
                card.classList.add("finished");
            } else {
                card.classList.remove("finished");
            }
            
            card.dataset.id = book.id || "";

            // 5. MAKE THE ARTICLE ELEMENT INSIDE EACH PROGRESS CARD
            const article = document.createElement("article");
            article.className = "progress-card-layout";

            // 6. INJECT INNERHTML TEMPLATE WITH THE DYNAMIC TEXT VARIABLES
            card.innerHTML = `
                <!--  Cover Image Container -->
                <div class="progress-card-cover">
                    <img src="${book.cover}" alt="${book.title} cover" loading="lazy">
                </div>
                
                <!--  Text Information Container -->
                <div class="information">
                    <div class="progress-info">
                        <h3 class="progress-card-title">${book.title}</h3>
                        <p class="progress-card-author">by ${book.author}</p>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${progress}%;"></div>
                        <span class="progress-percent">${progress}%</span>
                    </div>
                    <span class="progress-card-status">
                        ${progress >= 100 ? "✓ Finished" : "Continue"}
                    </span>
                </div>
            `;
            
            card.appendChild(article);

            // =========================================================
            // DYNAMIC ROUTING NAVIGATION HANDLER
            // =========================================================
            card.addEventListener("click", () => {
                try {
                    // Instructs library.html that it needs to handle a direct modal initialization
                    sessionStorage.setItem("library-open-target", JSON.stringify({
                        bookId: book.id || `fallback_${index}`,
                        title: book.title
                    }));
                } catch (e) {
                    console.warn("Writing dashboard routing state pointer to sessionStorage failed", e);
                }

                // Redirects user to your destination file path directly
                window.location.href = "library.html";
            });
        });
    }
});
