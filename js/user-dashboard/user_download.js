import { db } from "../../src/firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const auth = getAuth();
let currentMemberId = null;
let isLoading = false;

/* --- FALLBACK DATA (used when Firestore has few or no downloads) --- */
const FALLBACK_DOWNLOADS = [
  {
    id: "demo-1",
    book_name: "The Little Library",
    author: "A. Writer",
    cover_image: "/images/placeholders/demo-book-1.jpg",
    pdf_url: "/assets/demo/demo-book-1.pdf",
    _fallback: true
  },
  {
    id: "demo-2",
    book_name: "Stories for Night",
    author: "B. Storyteller",
    cover_image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0wJwy1zVLmNYn8Mq_6Njps1KcgXPIcuykiqDFxzY_hQ&s=10",
    pdf_url: "/assets/demo/demo-book-2.pdf",
    _fallback: true
  },
  {
    id: "demo-3",
    book_name: "Learning to Read",
    author: "C. Tutor",
    cover_image: "/images/placeholders/demo-book-3.jpg",
    pdf_url: "/assets/demo/demo-book-3.pdf",
    _fallback: true
  }
];

/* Helpers */
function getDownloadContainer() {
  // matches your HTML: <div class="books-grid download-books-grid" id="download-books"></div>
  return document.getElementById("download-books");
}

function escapeHTML(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;");
}

/* Empty/download-state helpers (use existing element id download-empty-state) */
function showEmptyDownloads() {
  const el = document.getElementById("download-empty-state");
  const container = getDownloadContainer();
  if (el) {
    el.style.display = ""; // show the element (it is inline hidden by default)
    if (container) container.innerHTML = "";
    return;
  }
  // fallback
  if (container) container.innerHTML = `
  <div class="download-empty-state"><h1>No downloads yet</h1></div>`;
}

function hideEmptyDownloads() {
  const el = document.getElementById("download-empty-state");
  if (el) el.style.display = "none";
}

/* Loading helper */
function renderLoading(container) {
  hideEmptyDownloads();
  container.innerHTML = `<div class="download-message loading-state">
  <i class="fas fa-spinner fa-spin"></i><p>Loading your downloads...</p>
  </div>`;
}

/* Find member doc by email (normalize to lowercase trimmed) */
async function getMemberDocByEmail(rawEmail) {
  if (!rawEmail) return null;
  const email = rawEmail.trim().toLowerCase();
  const membersRef = collection(db, "members");
  const q = query(membersRef, where("email", "==", email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0];
}


async function loadUserDownloadsByEmail(rawEmail) {
  const container = getDownloadContainer();
  if (!container) { console.warn("Download container not found."); return; }
  if (isLoading) return;

  try {
    isLoading = true;
    hideEmptyDownloads();
    renderLoading(container);

    const memberDoc = await getMemberDocByEmail(rawEmail);
    if (!memberDoc) {
      currentMemberId = null;
      // keep previous behavior: if no member record, show fallback/demo
      renderDownloadBooks(FALLBACK_DOWNLOADS.slice(), container);
      return;
    }

    currentMemberId = memberDoc.id;
    const downloadsRef = collection(db, "members", memberDoc.id, "downloads");
    const downloadsSnap = await getDocs(downloadsRef);

    // Apply new conditional logic based on downloadsSnap.size
    const count = downloadsSnap.size ?? 0;

    if (count === 0) {
      // Firestore has zero downloads -> show empty state
      showEmptyDownloads();
      return;
    }

    if (count > 0 && count < 3) {
      // Firestore has 1 or 2 downloads -> show fallback/demo content
      renderDownloadBooks(FALLBACK_DOWNLOADS.slice(), container);
      return;
    }

    // count >= 3 -> proceed to fetch actual book-list data
    const bookIds = [];
    // Support both cases: doc id equals bookId OR doc contains field bookId
    downloadsSnap.forEach((d) => {
      const data = d.data();
      if (d.id && typeof d.id === "string" && d.id.trim() !== "") {
        // prefer doc ID
        bookIds.push(d.id);
      } else if (data && data.bookId) {
        bookIds.push(data.bookId);
      }
    });

    const uniqueBookIds = [...new Set(bookIds)];
    const books = [];

    const fetches = uniqueBookIds.map(async (bookId) => {
      try {
        const bDoc = await getDoc(doc(db, "book-list", bookId));
        if (!bDoc.exists()) {
          console.warn(`Book ${bookId} not found in book-list.`);
          return;
        }
        const data = bDoc.data();
        books.push({
          id: bDoc.id,
          book_name: data.book_name || data.title || "Untitled Book",
          author: data.author || "Unknown Author",
          cover_image: data.cover_image || data.cover_url || "",
          pdf_url: data.pdf_url || "",
          audio_url: data.audio_url || "",
          _fallback: false
        });
      } catch (err) {
        console.error("Failed fetch book-list doc:", err);
      }
    });

    await Promise.all(fetches);

    if (books.length === 0) {
      // If fetching returned nothing useful, fall back to demo
      renderDownloadBooks(FALLBACK_DOWNLOADS.slice(), container);
      return;
    }

    renderDownloadBooks(books, container);

  } catch (err) {
    console.error("Failed loading downloads by email:", err);
    // per request: do not show an error overlay — show fallback/demo state instead
    const container = getDownloadContainer();
    if (container) renderDownloadBooks(FALLBACK_DOWNLOADS.slice(), container);
  } finally {
    isLoading = false;
  }
}

/* Render download cards using your CSS classnames */
function renderDownloadBooks(books, container) {
  if (!container) return;
  hideEmptyDownloads();
  container.innerHTML = "";

  books.forEach((book) => {
    const article = document.createElement("article");
    article.className = "download-card"; // matches CSS .download-card
    article.dataset.id = book.id;

    article.innerHTML = `
      <div class="download-card-cover">
        <img src="${escapeHTML(book.cover_image)}" alt="${escapeHTML(book.book_name)} cover" loading="lazy">
      </div>

      <h3 class="download-card-title">${escapeHTML(book.book_name)}</h3>
      <p class="download-card-author">by ${escapeHTML(book.author)}</p>

      <div class="download-card-actions" style="margin-top:12px;">
        <button type="button" class="download-card-btn read-btn">Read</button>
        <button type="button" class="download-card-btn delete-download-btn">Delete</button>
      </div>
    `;

    const readBtn = article.querySelector(".read-btn");
    const deleteBtn = article.querySelector(".delete-download-btn");

    readBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!book.pdf_url) {
        alert("PDF is not available for this book.");
        return;
      }
      try {
        sessionStorage.setItem("library-open", JSON.stringify({ type: "pdf", url: book.pdf_url, bookId: book.id }));
      } catch (err) {}
      window.location.href = "/pages/home.html";
    });

    // Delete: remove doc from members/{memberId}/downloads (doc id assumed to be book id)
    deleteBtn?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ok = confirm("Remove this download from your downloads?");
      if (!ok) return;

      // If this is fallback/demo data, just remove the card locally (no Firestore call)
      if (book._fallback) {
        article.remove();
        // if container now empty, show empty state
        if (!container.querySelector("[data-id]")) showEmptyDownloads();
        return;
      }

      if (!currentMemberId) {
        alert("Cannot delete: member not identified.");
        return;
      }

      try {
        // Try deleting by doc id first (most likely)
        await deleteDoc(doc(db, "members", currentMemberId, "downloads", book.id));
        article.remove();

        // if no more download items, show empty state
        if (!container.querySelector("[data-id]")) {
          showEmptyDownloads();
        }
      } catch (err) {
        console.error("Delete download failed:", err);
        // Fallback: if downloads use auto-IDs and store bookId in a field, attempt to find and delete those docs
        try {
          const downloadsRef = collection(db, "members", currentMemberId, "downloads");
          const q = query(downloadsRef, where("bookId", "==", book.id));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const deletions = [];
            snap.forEach(d => deletions.push(deleteDoc(doc(db, "members", currentMemberId, "downloads", d.id))));
            await Promise.all(deletions);
            article.remove();
            if (!container.querySelector("[data-id]")) showEmptyDownloads();
            return;
          }
        } catch (err2) {
          console.error("Fallback delete attempt failed:", err2);
        }

        alert("Could not remove the download. Try again later.");
      }
    });

    container.appendChild(article);
  });
}

/* Auth listener: use email to find member and load downloads */
if (!window.__downloadsAuthListenerRegistered) {
  window.__downloadsAuthListenerRegistered = true;

  onAuthStateChanged(auth, (user) => {
    const container = getDownloadContainer();

    if (!user?.email) {
      currentMemberId = null;
      // show fallback/demo when user not logged in
      if (container) renderDownloadBooks(FALLBACK_DOWNLOADS.slice(), container);
      return;
    }

    loadUserDownloadsByEmail(user.email);
  });

  if (auth.currentUser?.email) {
    loadUserDownloadsByEmail(auth.currentUser.email);
  }
}