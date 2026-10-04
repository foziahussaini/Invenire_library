import { db } from "../../src/firebase-config.js"; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"; 
import { openBookDetailsModal } from "../home/recent_section.js";

///============================ SEARCH COMPONENTS & CLOSE ICON INITIALIZATION ========================
const searchInput = document.querySelector(".search-input");
const searchBarContainer = document.querySelector(".search-bar");
const searchResultDropDown = document.querySelector(".searchResult"); //shows as a dropdown
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
        // initialize searchtext which user write as a input value
        const searchText = e.target.value.toLowerCase().trim();
        clearTimeout(debounceTimeout);

        // cross icon and dropdown visibility
        if (searchText === "") {
            closeIcon.style.display = "none";
            searchResultDropDown.style.display = "none"; 
            return;
        }
        
        closeIcon.style.display = "block";

        debounceTimeout = setTimeout(async () => {
            try {
                let hasResults = false;
                searchResultDropDown.innerHTML = ""; 

                // getting data from firestore for BOOK SEARCH ONLY
                const booksSnapshot = await getDocs(collection(db, "book-list"));
                booksSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const bookName = data.book_name || "";
                    const authorName = data.author || "";

                    if (bookName.toLowerCase().includes(searchText) || authorName.toLowerCase().includes(searchText)) {
                        hasResults = true;
                        
                        const itemList = document.createElement("div"); 
                        itemList.className = "search-item";
                        itemList.innerHTML = `<i class="fas fa-book"></i> <span><strong>${bookName}</strong> by ${authorName}</span>`;
                        
                        itemList.addEventListener("click", () => {

                            const book = {
                                id: doc.id,

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
                            };

                            searchResultDropDown.style.display = "none";
                            searchInput.value = "";
                            closeIcon.style.display = "none";

                            openBookDetailsModal(book);
                        });
                        searchResultDropDown.appendChild(itemList);
                    }
                });

                // Show or hide dropdown box 
                if (hasResults) {
                    searchResultDropDown.style.display = "block";
                } else {
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
                console.error("error happen", error);
            }
        }, 300);
    });

    // Close cross icon click event handler 
    closeIcon.addEventListener("click", () => {
        searchInput.value = "";
        searchResultDropDown.innerHTML = "";
        closeIcon.style.display = "none";
        searchResultDropDown.style.display = "none"; 
        searchInput.focus();
    });

    window.addEventListener("click", (event) => {
        
        if (!searchInput.contains(event.target) && !searchResultDropDown.contains(event.target)) {
            searchResultDropDown.style.display = "none";
        }
    });

    searchInput.addEventListener("click", () => {
        if (searchInput.value.trim() !== "") {
            searchResultDropDown.style.display = "block";
        }
    });
}
