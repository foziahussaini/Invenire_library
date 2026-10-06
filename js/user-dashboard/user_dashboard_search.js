import { auth, db } from "../../src/firebase-config.js"; 
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"; 

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
                booksSnapshot.forEach((bookDoc) => {
                    const data = bookDoc.data();
                    const bookName = data.book_name || "";
                    const authorName = data.author || "";

                    if (bookName.toLowerCase().includes(searchText) || authorName.toLowerCase().includes(searchText)) {
                        hasResults = true;
                        
                        const itemList = document.createElement("div"); 
                        itemList.className = "search-item";
                        itemList.innerHTML = `<i class="fas fa-book"></i> <span><strong>${bookName}</strong> by ${authorName}</span>`;
                        
                        // CONNECTED CLICK ACTION: Trigger the internal dashboard/home-routing verification logic
                        itemList.addEventListener("click", async () => {
                            // Close dropdown panel and reset searchbar inputs instantly
                            searchResultDropDown.style.display = "none";
                            searchResultDropDown.innerHTML = "";
                            searchInput.value = "";
                            closeIcon.style.display = "none";

                            // Pass the unique Firestore document ID into your navigation engine
                            await handleBookNavigation(bookDoc.id);
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

///================================= DYNAMIC DASHBOARD BOOK ROUTING ENGINE =============================
async function handleBookNavigation(bookId) {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    localStorage.setItem("highlightRecentBookId", bookId);
    window.location.href = "../../pages/home.html";
    return;
  }

  const uid = currentUser.uid;
  const subCollections = ["download-book", "purchased-books", "onReadMode"];
  let isOwnedInLibrary = false;

  try {
    // 2. Check each subcollection for this specific book document ID
    for (const subName of subCollections) {
      const docRef = doc(db, "members", uid, subName, bookId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        isOwnedInLibrary = true;
        break; // Stop checking if found in any subcollection
      }
    }

    // 3. Route the user based on ownership status
    if (isOwnedInLibrary) {
      // SCENARIO A: Found in library -> Scroll smoothly to the library section on the dashboard
      const libraryContainer = document.getElementById("library-section") || 
                               document.querySelector(".library-container") || 
                               document.getElementById("my-books");

      if (libraryContainer) {
        libraryContainer.scrollIntoView({ behavior: "smooth", block: "start" });
        
        // Flash background color to draw user attention
        libraryContainer.style.transition = "background-color 0.4s ease";
        libraryContainer.style.backgroundColor = "rgba(52, 152, 219, 0.15)";
        setTimeout(() => libraryContainer.style.backgroundColor = "", 1500);
      } else {
        console.warn("Library section target element not found on this page.");
      }
    } else {
      // SCENARIO B: Not found in library -> Save ID to highlight and redirect to home page
      localStorage.setItem("highlightRecentBookId", bookId);
      
      // FIXED PATH: Exits 'js' and 'user-dashboard' to locate the root 'home' directory
      window.location.href = "../pages/home.html"; 
    }

  } catch (err) {
    console.error("Failed to verify subcollection ownership:", err);
    localStorage.setItem("highlightRecentBookId", bookId);
    
    // FIXED PATH FALLBACK
    window.location.href = "../../pages/home.html";
  }
}
