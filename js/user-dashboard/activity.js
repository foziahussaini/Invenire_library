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
  where,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// ---------------------- FALLBACK DATA (shown when no data / on error) ----------------------
const FALLBACK = {
  downloads: [
    { id: "fd-1", book_name: "The Alchemist", author: "Paulo Coelho", cover: "" },
    { id: "fd-2", book_name: "Her Eyes", author: "Bozorg Alavi", cover: "" },
    { id: "fd-3", book_name: "1984", author: "George Orwell", cover: "" }
  ],
  purchases: [
    { id: "fp-1", book_name: "Crime and Punishment", author: "Fyodor Dostoevsky", price: "14.99", cover: "" },
    { id: "fp-2", book_name: "The Great Gatsby", author: "F. Scott Fitzgerald", price: "9.99", cover: "" }
  ],
  library: [
    { id: "fl-1", book_name: "The Little Prince", author: "Antoine de Saint-Exupéry", cover: "" },
    { id: "fl-2", book_name: "Hamlet", author: "William Shakespeare", cover: "" }
  ]
};

const DEFAULT_COVER = "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=60";

// ---------------------- DOM SELECTORS (kept unchanged) ----------------------
const selectors = {
  streakDays: "activity-streak-days",
  loginCount: "activity-total-logins",
  downloadsShelf: "activity-download-shelf",
  purchasesShelf: "activity-purchase-shelf",
  favoritesShelf: "activity-favorites-shelf",
  badgeStar: "badge-star",
  badgeSilver: "badge-silver",
  badgeBronze: "badge-bronze",
  badgeGold: "badge-gold",
  statusDice: ".status-dice > div"
};

function el(id) { return document.getElementById(id); }
function safeText(text) { return String(text ?? ""); }
function coverUrl(item) { return item.cover_url || item.cover_image || item.cover || DEFAULT_COVER; }

// ---------------------- SMALL HELPER: append into existing .list-container ----------------------
function appendIntoListContainer(container, fragmentOrElement) {
  if (!container) return;
  let list = container.querySelector(".list-container");
  if (!list) {
    list = document.createElement("div");
    list.className = "list-container";
    container.appendChild(list);
  }
  list.appendChild(fragmentOrElement);
}

// ---------------------- RENDERERS ----------------------
// preserve your exact HTML structure and class names.
// renderMiniCards now appends <article.book-mini-card> elements into the container's .list-container
function renderMiniCards(items, container, defaultMeta, showDeleteBtn = false, docPathId = null) {
  if (!container) return;

  // ensure title <p> exists (preserve)
  let titleEl = container.querySelector("p");
  if (!titleEl) {
    titleEl = document.createElement("p");
    container.prepend(titleEl);
  }
  // do not overwrite the title text here

  // ensure .list-container exists and clear it
  let listContainer = container.querySelector(".list-container");
  if (!listContainer) {
    listContainer = document.createElement("div");
    listContainer.className = "list-container";
    container.appendChild(listContainer);
  }
  listContainer.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No items";
    listContainer.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();

  items.forEach((book) => {
    const card = document.createElement("article");
    card.className = "book-mini-card";

    const title = safeText(book.book_name || book.title || "Untitled Book");
    const authorOrMeta = book.price ? `$${book.price}` : (book.author || defaultMeta);
    const img = coverUrl(book);

    card.innerHTML = `
      <img src="${img}" alt="${title} cover" onerror="this.src='${DEFAULT_COVER}';">
      <div class="mini-card-body">
        <div class="mini-card-title">${title}</div>
        <div class="mini-card-meta">${authorOrMeta}</div>
      </div>
      <div class="mini-card-actions">
        ${showDeleteBtn ? `<button class="mini-card-btn danger remove-btn" data-book-id="${book.id}" aria-label="Remove ${title}">Remove</button>` : `<button class="mini-card-btn primary details-btn" data-book-id="${book.id}" aria-label="Details ${title}">delete</button>`}
      </div>
    `;

    if (showDeleteBtn) {
      const rm = card.querySelector(".remove-btn");
      if (rm) {
        rm.addEventListener("click", async (e) => {
          e.stopPropagation();
          const bookId = rm.getAttribute("data-book-id");
          if (!bookId) {
            alert("Invalid book id");
            return;
          }
          if (!confirm(`Remove "${title}" from your library?`)) return;

          if (!docPathId) {
            alert("Cannot remove item: missing member document path. Sign in or contact support.");
            return;
          }

          try {
            await deleteDoc(doc(db, "members", docPathId, "my-library", bookId));
            card.remove();
            processUserActivityMetricsEngine(); // refresh
          } catch (err) {
            console.error("Error removing book from library:", err);
            alert("Failed to remove item. Check console.");
          }
        });
      }
    } else {
      const detailsBtn = card.querySelector(".details-btn");
      if (detailsBtn) {
        detailsBtn.addEventListener("click", () => {
          const bookId = detailsBtn.getAttribute("data-book-id");
          if (!bookId) return;
          window.location.href = `home.html?id=${encodeURIComponent(bookId)}`;
        });
      }
    }

    frag.appendChild(card);
  });

  // append the fragment into the .list-container (which is a DIV)
  appendIntoListContainer(container, frag);
}

// ---------------------- BADGE / METRICS ----------------------
function updateBadges(totalLibraryBooksCount) {
  document.querySelectorAll(selectors.statusDice).forEach(el => el.classList.remove("active-badge"));

  if (!totalLibraryBooksCount || totalLibraryBooksCount <= 1) {
    el(selectors.badgeStar)?.classList.add("active-badge");
    return;
  }

  if (totalLibraryBooksCount > 10) {
    el(selectors.badgeGold)?.classList.add("active-badge");
  } else if (totalLibraryBooksCount === 10) {
    el(selectors.badgeBronze)?.classList.add("active-badge");
  } else if (totalLibraryBooksCount >= 5) {
    el(selectors.badgeSilver)?.classList.add("active-badge");
  } else if (totalLibraryBooksCount >= 2) {
    el(selectors.badgeStar)?.classList.add("active-badge");
  }
}

// ---------------------- MAIN PROCESS ----------------------
export async function processUserActivityMetricsEngine(forcedUid = null) {
  const streakDaysTxt = document.getElementById(selectors.streakDays);
  const loginCountTxt = document.getElementById(selectors.loginCount);
  const downloadShelf = document.getElementById(selectors.downloadsShelf);
  const purchaseShelf = document.getElementById(selectors.purchasesShelf);
  const favoritesShelf = document.getElementById(selectors.favoritesShelf);

  // quick fallback renderer (UI won't be blank)
  function renderFallbacks() {
    if (loginCountTxt) loginCountTxt.textContent = 0;
    if (streakDaysTxt) streakDaysTxt.textContent = "0 Days";
    if (downloadShelf) renderMiniCards(FALLBACK.downloads, downloadShelf, "Ready Offline", false, null);
    if (purchaseShelf) renderMiniCards(FALLBACK.purchases, purchaseShelf, "Purchased", false, null);
    if (favoritesShelf) renderMiniCards(FALLBACK.library, favoritesShelf, "Library Entry", false, null);
    // default star badge
    document.querySelectorAll(".status-dice > div").forEach(el => el.classList.remove("active-badge"));
    document.getElementById("badge-star")?.classList.add("active-badge");
  }

  // Resolve UID: forced -> localStorage.userSession -> firebase auth currentUser
  let uid = forcedUid || null;
  if (!uid) {
    try {
      const s = localStorage.getItem("userSession");
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && parsed.uid) uid = parsed.uid;
      }
    } catch (err) {
      console.warn("Failed to parse localStorage.userSession:", err);
    }
  }
  if (!uid) {
    const auth = getAuth();
    if (auth && auth.currentUser && auth.currentUser.uid) uid = auth.currentUser.uid;
  }

  if (!uid) {
    renderFallbacks();
    return;
  }

  try {
    // 1) find member doc by UID (document id is the uid)
    const memberDocRef = doc(db, "members", uid);
    const memberSnap = await getDoc(memberDocRef);

    if (!memberSnap.exists()) {
      console.log("No member document found for uid (doc id):", uid);
      renderFallbacks();
      return;
    }

    const profileFields = memberSnap.data();
    const documentPathName = uid; // using uid as document id

    // Inject Login Metrics safely into the UI components
    const totalLoginsCount = parseInt(profileFields.totalLoginsCount) || 0;
    if (loginCountTxt) loginCountTxt.textContent = totalLoginsCount;
    if (streakDaysTxt) streakDaysTxt.textContent = `${totalLoginsCount} Days`;

    // 2) subcollection refs
    const downloadBookRef = collection(db, "members", documentPathName, "download-book");
    const purchasedBooksRef = collection(db, "members", documentPathName, "purchased-books");
    const myLibraryRef = collection(db, "members", documentPathName, "my-library");

    const [downloadSnap, purchaseSnap, librarySnap] = await Promise.all([
      getDocs(downloadBookRef),
      getDocs(purchasedBooksRef),
      getDocs(myLibraryRef)
    ]);

    // badges (same logic)
    const totalLibraryBooksCount = librarySnap.size;
    document.querySelectorAll(".status-dice > div").forEach(el => el.classList.remove("active-badge"));
    if (totalLibraryBooksCount > 10) {
      document.getElementById("badge-gold")?.classList.add("active-badge");
    } else if (totalLibraryBooksCount === 10) {
      document.getElementById("badge-bronze")?.classList.add("active-badge");
    } else if (totalLibraryBooksCount >= 5) {
      document.getElementById("badge-silver")?.classList.add("active-badge");
    } else if (totalLibraryBooksCount >= 2) {
      document.getElementById("badge-star")?.classList.add("active-badge");
    } else {
      document.getElementById("badge-star")?.classList.add("active-badge");
    }

    // ------------------- render shelves -------------------
    // Per your requirement: only use Firestore data if the collection size is > 30; otherwise show fallback.
    if (downloadShelf) {
      if (!downloadSnap.empty && downloadSnap.size > 30) {
        const targetArray = [];
        downloadSnap.forEach(docNode => targetArray.push({ id: docNode.id, ...docNode.data() }));
        renderMiniCards(targetArray, downloadShelf, "Ready Offline", false, documentPathName);
      } else {
        renderMiniCards(FALLBACK.downloads, downloadShelf, "Ready Offline", false, null);
      }
    }

    if (purchaseShelf) {
      if (!purchaseSnap.empty && purchaseSnap.size > 30) {
        const targetArray = [];
        purchaseSnap.forEach(docNode => targetArray.push({ id: docNode.id, ...docNode.data() }));
        renderMiniCards(targetArray, purchaseShelf, "Purchased", false, documentPathName);
      } else {
        renderMiniCards(FALLBACK.purchases, purchaseShelf, "Purchased", false, null);
      }
    }

    if (favoritesShelf) {
      if (!librarySnap.empty && librarySnap.size > 30) {
        const targetArray = [];
        librarySnap.forEach(docNode => targetArray.push({ id: docNode.id, ...docNode.data() }));
        renderMiniCards(targetArray, favoritesShelf, "Library Shelf", true, documentPathName);
      } else {
        renderMiniCards(FALLBACK.library, favoritesShelf, "Library Shelf", false, null);
      }
    }

  } catch (err) {
    console.error("Activity pipeline failed:", err);
    renderFallbacks();
  }
}

// ---------------------- AUTO-INIT ----------------------
function initializeActivityAutoLoader() {
  const auth = getAuth();
  // run once
  processUserActivityMetricsEngine().catch(e => console.error(e));
  // re-run on auth change
  onAuthStateChanged(auth, (user) => {
    processUserActivityMetricsEngine(user ? user.uid : null).catch(e => console.error(e));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeActivityAutoLoader);
} else {
  initializeActivityAutoLoader();
}