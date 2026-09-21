import { db } from "../../src/firebase-config.js"; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"; 

///============================ SEARCH COMPONENTS & CLOSE ICON INITIALIZATION ========================
const searchInput = document.querySelector(".search-input");
const searchBarContainer = document.querySelector(".search-bar");
const searchResultDropDown = document.querySelector(".searchResult"); //shows as a dropdown

// adding close icon when typing something on the searchbar
const closeIcon = document.createElement("i");

if (searchBarContainer) {
    closeIcon.className = "fas fa-times close-icon";
    closeIcon.style.display = "none";
    searchBarContainer.appendChild(closeIcon);
}

let debounceTimeout;

///============================ FIREBASE DYNAMIC LIVE SEARCH FUNCTIONALITY ==========================
if (searchInput && searchResultDropDown) {
    searchInput.addEventListener("input", async (e) => {
        // initialize searchtext which user write as a input value
        const searchText = e.target.value.toLowerCase().trim();
        clearTimeout(debounceTimeout);

    // cross icon and dropdown visiblity
        if (searchText === "") {
            closeIcon.style.display = "none";
            searchResultDropDown.style.display = "none"; 
            return;
        }
        
        closeIcon.style.display = "block";

    // using try cathe and also async await for error handler and showing the search result after checking the storage on firebase
        debounceTimeout = setTimeout(async () => {
    try {
            let hasResults = false;
            searchResultDropDown.innerHTML = ""; 

    // getting data from firestore for BOOK SEARCH
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
                    
                // click event redirect for search details to the related page
                    itemList.addEventListener("click", () => {
                        window.location.href = `../pages/admin_subPages/books.html?search=${encodeURIComponent(bookName)}`;
                    });
                    searchResultDropDown.appendChild(itemList);
                }
            });

    // getting data from firestore forLIBRARY MEMBERS SEARCH
            const membersSnapshot = await getDocs(collection(db, "members"));
            membersSnapshot.forEach((doc) => {
                const data = doc.data();
                const fullName = data.full_name || "";
                const location = data.location || "";

                if (fullName.toLowerCase().includes(searchText) || location.toLowerCase().includes(searchText)) {
                    hasResults = true;
                    
                    const itemList = document.createElement("div");
                    itemList.className = "search-item";
                    itemList.innerHTML = `<i class="fas fa-user"></i> <span><strong>${fullName}</strong> from ${location}</span>`;
                    
                // click event redirect for search details to the related page
                    itemList.addEventListener("click", () => {
                        window.location.href = `../pages/admin_subPages/members.html?search=${encodeURIComponent(fullName)}`;
                    });
                    searchResultDropDown.appendChild(itemList);
                }
            });

            // Show or hide dropdown box layout depending on search results match status
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

    // Close cross icon click event handler configuration
    closeIcon.addEventListener("click", () => {
        searchInput.value = "";
        searchResultDropDown.innerHTML = "";
        closeIcon.style.display = "none";
        searchResultDropDown.style.display = "none"; 
        searchInput.focus();
    });

    window.addEventListener("click", (event) => {
        // If the user clicks outside the input bar and outside the open result container box...
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
