import { db } from "../../src/firebase-config.js"; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"; 

// ==================== 1. HARDCODED STATIC ARRAY FALLBACK FOR SEARCHING ====================
const fallbackBooks = [
    {
        id: "fallback-1",
        book_name: "The Alchemist",
        author: "Paulo Coelho"
    },
    {
        id: "fallback-2",
        book_name: "Her Eyes",
        author: "Bozorg Alavi"
    },
    {
        id: "fallback-3",
        book_name: "Crime and Punishment (Audiobook)",
        author: "Fyodor Dostoevsky"
    }
];

///============================ SEARCH COMPONENTS & CLOSE ICON INITIALIZATION ========================
const searchInput = document.querySelector(".search-input");
const searchBarContainer = document.querySelector(".search-bar");
const searchResultDropDown = document.querySelector(".searchResult"); // Shows as a dropdown menu

// Creating close icon dynamically
const closeIcon = document.createElement("i");

if (searchBarContainer) {
    closeIcon.className = "fas fa-times close-icon";
    closeIcon.style.display = "none";
    searchBarContainer.appendChild(closeIcon);
}

let debounceTimeout;

///============================ FIREBASE DYNAMIC LIVE BOOK SEARCH FUNCTIONALITY ==========================
if (searchInput && searchResultDropDown) {
    searchInput.addEventListener("input", async (e) => {
        const searchText = e.target.value.toLowerCase().trim();
        clearTimeout(debounceTimeout);

        // Control drop visibility when field clears out
        if (searchText === "") {
            closeIcon.style.display = "none";
            searchResultDropDown.style.display = "none"; 
            searchResultDropDown.innerHTML = "";
            return;
        }
        
        closeIcon.style.display = "block";

        // Applying debounce timeout to prevent multiple rapid Firebase network hits
        debounceTimeout = setTimeout(async () => {
            try {
                let currentBooksList = [];

                try {
                    // Try to fetch live book data from Firestore database
                    const booksSnapshot = await getDocs(collection(db, "book-list"));
                    booksSnapshot.forEach((doc) => {
                        const data = doc.data();
                        currentBooksList.push({
                            id: doc.id,
                            book_name: data.book_name || "Untitled Book",
                            author: data.author || "Unknown Author"
                        });
                    });
                } catch (netError) {
                    console.warn("Network issue detected during live search. Invoking local array fallback:", netError);
                    // Use fallback local list if network fails or goes offline
                    currentBooksList = fallbackBooks;
                }

                // Filter down the array matching results to user input text strings
                let hasResults = false;
                searchResultDropDown.innerHTML = ""; 

                currentBooksList.forEach((book) => {
                    const bookName = book.book_name;
                    const authorName = book.author;

                    if (bookName.toLowerCase().includes(searchText) || authorName.toLowerCase().includes(searchText)) {
                        hasResults = true;
                        
                        const itemList = document.createElement("div"); 
                        itemList.className = "search-item";
                        itemList.innerHTML = `<i class="fas fa-book"></i> <span><strong>${bookName}</strong> by ${authorName}</span>`;
                        
                        // FIXED: Click redirection targets about_book.html passing unique identity properties
                        itemList.addEventListener("click", () => {
                            window.location.href = `about_book.html?id=${book.id}&title=${encodeURIComponent(bookName)}`;
                        });
                        searchResultDropDown.appendChild(itemList);
                    }
                });

                // Display structured fallback response if no match filters out successfully
                if (hasResults) {
                    searchResultDropDown.style.display = "block";
                } else {
                    searchResultDropDown.innerHTML = "";
                    const noResultRow = document.createElement("div");
                    noResultRow.className = "no-match";
                    noResultRow.innerHTML = `
                    <div class="sad-sticker">
                        <div class="eyes"></div>
                        <div class="mouth"></div>
                    </div>
                    <span>No result found</span>`;
                    searchResultDropDown.appendChild(noResultRow);
                    searchResultDropDown.style.display = "block";
                }

            } catch (error) {
                console.error("Critical execution error: ", error);
            }
        }, 300);
    });

    // Close cross icon click functionality setup
    closeIcon.addEventListener("click", () => {
        searchInput.value = "";
        searchResultDropDown.innerHTML = "";
        closeIcon.style.display = "none";
        searchResultDropDown.style.display = "none"; 
        searchInput.focus();
    });

    // Close dropdown instantly if user clicks out of search components framework area boundaries
    window.addEventListener("click", (event) => {
        if (!searchInput.contains(event.target) && !searchResultDropDown.contains(event.target)) {
            searchResultDropDown.style.display = "none";
        }
    });

    // If input contains string details reopening focus panel reveals the drop options instantly
    searchInput.addEventListener("click", () => {
        if (searchInput.value.trim() !== "") {
            searchResultDropDown.style.display = "block";
        }
    });
}
