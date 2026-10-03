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

// ==================== 1. ARRAY FALLBACK DATA ====================
const fallbackBooks = [
  {
    id: "fallback-1",
    book_name: "The Alchemist",
    author: "Paulo Coelho",
    cover_image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWnaop4zO63Ay9SgRxSQ6AjTJcZAumeIVex8rhQufNCw&s=10"
  },
  {
    id: "fallback-2",
    book_name: "Yesterday",
    author: "Juan Emar",
    cover_image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvR5sodUCuqVU2JvNLzCAtP6nZU0ERgaGd7ZfQm54xJg&s"
  },
  {
    id: "fallback-3",
    book_name: "Yesterday: A Novel of Reincarnation",
    author: "Samyann",
    cover_image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT35UTqe-I5Id6J2F1KdueIn1ExIX3nMiNYM1ZmXBI08g&s=10"
  }
];

// STATE CONTROLLER SEMAPHORES
let isLibraryGridLoaded = false;
let isFetchInProgress = false;

// Firebase Auth instance
const auth = getAuth();

// ==================== 2. AUTH LISTENER + INIT ====================
function verifyAndLoadShelf() {
  const targetGrid =
    document.getElementById("mylibrary-books") || document.querySelector(".books-grid");

  if (!targetGrid) return;

  // Avoid repeated loads
  if (isLibraryGridLoaded || isFetchInProgress) return;

  // If auth object is already ready, load immediately
  const currentUser = auth.currentUser;

  if (currentUser && currentUser.uid) {
    window.userUid = currentUser.uid;
    myLibraryBooksShelf();
    return;
  }

  // Else wait for auth state change
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.userUid = user.uid;
      console.log("✅ Firebase user ready:", user.uid);
      myLibraryBooksShelf();
    } else {
      console.warn("⚠️ No authenticated user. Library fetch skipped.");
      window.userUid = null;
      isLibraryGridLoaded = true; // prevents repeated requests
      if (targetGrid) renderBooksGrid(fallbackBooks, targetGrid);
    }
  });
}

// Initial execution attempt when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", verifyAndLoadShelf);
} else {
  verifyAndLoadShelf();
}

// Global observer callback method
window.triggerLibraryReload = function () {
  if (isFetchInProgress) return;

  console.log("Waking up library engine: Global user ID updated by authentication stream.");
  isLibraryGridLoaded = false;
  myLibraryBooksShelf();
};

// ==================== 3. LIBRARY LOADER ====================
async function myLibraryBooksShelf() {
  const targetGrid =
    document.getElementById("mylibrary-books") || document.querySelector(".books-grid");

  if (!targetGrid) return;

  // Prevent duplicate loads
  if (isLibraryGridLoaded || isFetchInProgress) return;

  // If user not authenticated yet, stop safely
  if (!window.userUid) {
    console.warn("No user UID available yet. Waiting for auth...");
    return;
  }

  try {
    isFetchInProgress = true;
    isLibraryGridLoaded = false;

    targetGrid.innerHTML = `
      <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--btn-background-color); font-weight: 700;">
        <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Loading your library collections shelf...
      </div>
    `;

    // Query members by the field user_id == authenticated current uid
    const membersCollectionRef = collection(db, "members");
    const userFieldQuery = query(
      membersCollectionRef,
      where("user_id", "==", window.userUid)
    );

    const querySnapshot = await getDocs(userFieldQuery);

    if (querySnapshot.empty) {
      console.warn("No member document found for this user. Loading fallback books.");
      renderBooksGrid(fallbackBooks, targetGrid);
      isLibraryGridLoaded = true;
      return;
    }

    // Get the matching member document ID
    let targetDocumentPathName = "";
    querySnapshot.forEach((memberDoc) => {
      if (memberDoc.data().user_id === window.userUid) {
        targetDocumentPathName = memberDoc.id;
      }
    });

    if (!targetDocumentPathName) {
      console.warn("Member doc found, but no matching UID. Loading fallback books.");
      renderBooksGrid(fallbackBooks, targetGrid);
      isLibraryGridLoaded = true;
      return;
    }

    const onReadRef = collection(db, "members", targetDocumentPathName, "onReadMode");
    const myLibraryRef = collection(db, "members", targetDocumentPathName, "my-library");

    const [onReadSnap, myLibrarySnap] = await Promise.all([
      getDocs(onReadRef),
      getDocs(myLibraryRef)
    ]);

    // If both subcollections are empty, load fallback
    if (onReadSnap.empty && myLibrarySnap.empty) {
      console.warn("User subcollections are empty in database. Loading fallbacks.");
      renderBooksGrid(fallbackBooks, targetGrid);
      isLibraryGridLoaded = true;
      return;
    }

    // Collect unique book IDs from both subcollections
    const uniqueBookIds = new Set();

    onReadSnap.forEach((docSnap) => {
      uniqueBookIds.add(docSnap.id);
    });

    myLibrarySnap.forEach((docSnap) => {
      uniqueBookIds.add(docSnap.id);
    });

    const resolvedBooksList = [];
    const documentFetchPromises = [];

    uniqueBookIds.forEach((bookId) => {
      const masterBookDocRef = doc(db, "book-list", bookId);

      const fetchTask = getDoc(masterBookDocRef)
        .then((masterDocSnap) => {
          if (masterDocSnap.exists()) {
            const data = masterDocSnap.data();

            resolvedBooksList.push({
              id: masterDocSnap.id,
              book_name: data.book_name || data.title || "Untitled Book",
              author: data.author || "Unknown Author",
              cover_image: data.cover_url || data.cover_image || "https://images.unsplash.com/photo-1512820790803-83ca734da794"
            });
          }
        })
        .catch((err) => {
          console.error(`Error resolving book ID ${bookId}:`, err);
        });

      documentFetchPromises.push(fetchTask);
    });

    await Promise.all(documentFetchPromises);

    if (resolvedBooksList.length === 0) {
      renderBooksGrid(fallbackBooks, targetGrid);
    } else {
      renderBooksGrid(resolvedBooksList, targetGrid);
    }

    isLibraryGridLoaded = true;
  } catch (error) {
    console.error("Firestore library synchronization failed. Loading fallbacks:", error);

    // Handle permission denied safely
    if (error && error.code === "permission-denied") {
      console.warn("Firestore permission denied. The user may not be signed in or rules block access.");
    }

    renderBooksGrid(fallbackBooks, targetGrid);
    isLibraryGridLoaded = true;
  } finally {
    isFetchInProgress = false;
  }
}

// ==================== 4. REUSABLE RENDERING ENGINE ====================
function renderBooksGrid(booksArray, targetContainer) {
  targetContainer.innerHTML = "";

  if (!Array.isArray(booksArray) || booksArray.length === 0) {
    targetContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
        No books saved yet.
      </div>
    `;
    return;
  }

  booksArray.forEach((book) => {
    const bookId = book.id;
    const title = book.book_name || "Untitled Book";
    const authorName = book.author || "Unknown Author";
    const coverImage = book.cover_image || "https://images.unsplash.com/photo-1512820790803-83ca734da794";

    const article = document.createElement("article");
    article.className = "book-cards card1";

    article.innerHTML = `
      <div class="book-cover">
        <img
          src="${coverImage}"
          alt="${title} cover"
          onerror="this.src='https://images.unsplash.com/photo-1512820790803-83ca734da794';"
          style="width:100%; height:100%; object-fit:cover;"
        >
      </div>
      <div class="book-name">${title}</div>
      <div class="book-author">By ${authorName}</div>
      <button class="book-detail-btn">View</button>
    `;

    const detailsButton = article.querySelector(".book-detail-btn");
    detailsButton.addEventListener("click", () => {
      window.location.href = `about_book.html?id=${bookId}&title=${encodeURIComponent(title)}`;
    });

    targetContainer.appendChild(article);
  });
}