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
let currentUser = null;
let currentMemberId = null;
let isLoading = false;

/* Helpers: container + escape */
function getLibraryContainer() { return document.getElementById("your-library-books"); }
function escapeHTML(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;");
}

/* No-books overlay helpers (use your exact element; do NOT move it) */
function initNoBooksOverlay() {
  const el = document.getElementById("library-no-books-state");
  if (!el) return;

  // hidden initially
  el.classList.remove("visible");

  // Ensure the first child (the visible card) can be positioned relative for the close button
  const content = el.firstElementChild;
  if (content) {
    // Make sure the content box is the positioning context for the close button
    content.style.position = content.style.position || "relative";

    // Add close button if not already added
    if (!content.querySelector(".overlay-close-btn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "overlay-close-btn";
      btn.setAttribute("aria-label", "Close");
      btn.innerHTML = "&times;"; // ×

      // Stop the click from bubbling to the backdrop
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        hideNoBooksOverlay();
      });

      // Insert as first child so it's visually on top-right of the card
      content.insertBefore(btn, content.firstChild);
    }
  }

  // Close when clicking the backdrop (the overlay element itself)
  el.addEventListener("click", (e) => {
    if (e.target === el) hideNoBooksOverlay();
  });

  // Close with Escape
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && el.classList.contains("visible")) hideNoBooksOverlay();
  });
}

function showNoBooksOverlay() {
  const el = document.getElementById("library-no-books-state");
  if (!el) return;
  el.classList.add("visible");
}

function hideNoBooksOverlay() {
  const el = document.getElementById("library-no-books-state");
  if (!el) return;
  el.classList.remove("visible");
}

/* Error overlay (created dynamically) */
function showOverlay(id) { const el = document.getElementById(id); if (!el) return; el.classList.add("visible"); }
function hideOverlay(id) { const el = document.getElementById(id); if (!el) return; el.classList.remove("visible"); }
function hideAllOverlays() { hideOverlay("library-error-state"); hideNoBooksOverlay(); }

/* Render helpers */
function renderLoading(container) {
  hideAllOverlays();
  container.innerHTML = `<div class="library-message loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading your library...</p></div>`;
}

function renderEmptyLibrary(container) {
  // show your overlay if present
  const el = document.getElementById("library-no-books-state");
  if (el) {
    hideAllOverlays();
    showNoBooksOverlay();
    return;
  }
  // fallback
  container.innerHTML = `<div class="library-message empty-library"><p>No book added to library yet.</p></div>`;
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

/* Main loader: find member by email -> read members/{memberId}/my-library -> fetch book-list docs */
async function loadUserLibraryByEmail(rawEmail) {
  const container = getLibraryContainer();
  if (!container) { console.warn("Library container not found."); return; }
  if (isLoading) return;

  try {
    isLoading = true;
    hideAllOverlays();
    renderLoading(container);

    const memberDoc = await getMemberDocByEmail(rawEmail);
    if (!memberDoc) {
      // no member record -> no books overlay
      currentMemberId = null;
      renderEmptyLibrary(container);
      return;
    }

    currentMemberId = memberDoc.id;
    const libraryRef = collection(db, "members", memberDoc.id, "my-library");
    const librarySnap = await getDocs(libraryRef);

    if (librarySnap.empty) {
      renderEmptyLibrary(container);
      return;
    }

    const bookIds = [];
    librarySnap.forEach((d) => { if (d.id) bookIds.push(d.id); });
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
          genre: data.genre || "",
          published: data.published || "",
          pages: data.pages || "",
          language: data.language || "",
          rating: data.rating || ""
        });
      } catch (err) {
        console.error("Failed fetch book-list doc:", err);
      }
    });

    await Promise.all(fetches);

    if (books.length === 0) {
      renderEmptyLibrary(container);
      return;
    }

    hideAllOverlays();
    renderLibraryBooks(books, container);

  } catch (err) {
    console.error("Failed loading library by email:", err);
    // Removed error overlay per request — show empty/no-books state instead
    const container = getLibraryContainer();
    if (container) renderEmptyLibrary(container);
  } finally {
    isLoading = false;
  }
}

/* Render cards into #your-library-books */
function renderLibraryBooks(books, container) {
  if (!container) return;
  container.innerHTML = "";

  books.forEach((book) => {
    const article = document.createElement("article");
    article.className = "books-card";
    article.dataset.id = book.id;

    article.innerHTML = `
      <div class="book-cover">
        <img src="${escapeHTML(book.cover_image)}" alt="${escapeHTML(book.book_name)} cover" loading="lazy">
      </div>
      <div class="book-info">
        <h3 class="book-title">${escapeHTML(book.book_name)}</h3>
        <p class="book-author">by ${escapeHTML(book.author)}</p>
      </div>
      <div class="book-actions">
        <button type="button" class="read-btn">Read</button>
        <button type="button" class="play-audio-btn">Listen</button>
        <button type="button" class="download-btn">Download</button>
        <button type="button" class="delete-from-list">Delete</button>
      </div>
    `;

    const readBtn = article.querySelector(".read-btn");
    const listenBtn = article.querySelector(".play-audio-btn");
    const downloadBtn = article.querySelector(".download-btn");
    const deleteBtn = article.querySelector(".delete-from-list");

    // Disable unavailable actions visually + attribute
    if (!book.pdf_url) {
      if (readBtn) { readBtn.disabled = true; readBtn.classList.add("btn-disabled"); }
      if (downloadBtn) { downloadBtn.disabled = true; downloadBtn.classList.add("btn-disabled"); }
    }
    if (!book.audio_url) {
      if (listenBtn) { listenBtn.disabled = true; listenBtn.classList.add("btn-disabled"); }
    }

    // Delete allowed because we loaded by member email; if currentMemberId present we can delete from that member's subcollection
    if (!currentMemberId) {
      deleteBtn.disabled = true;
      deleteBtn.classList.add("btn-disabled");
    } else {
      deleteBtn.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        const ok = confirm("Remove this book from your library?");
        if (!ok) return;
        try {
          await deleteDoc(doc(db, "members", currentMemberId, "my-library", book.id));
          article.remove();
        } catch (err) {
          console.error("Delete failed:", err);
          alert("Could not remove the book. Try again later.");
        }
      });
    }

    // Read
   readBtn?.addEventListener("click", (e) => {
    if (readBtn.disabled) return;
    e.stopPropagation();

    // 1. Get the PDF URL from your book object
    const pdfUrl = book.pdf_url;

    if (!pdfUrl) {
        alert("PDF is not available for this book.");
        return;
    }

    // 2. Open the PDF in a new tab immediately
    window.open(pdfUrl, "_blank");
});


    // Listen
    listenBtn?.addEventListener("click", (e) => {
      if (listenBtn.disabled) return;
      e.stopPropagation();
      try { sessionStorage.setItem("library-open", JSON.stringify({ type: "audio", url: book.audio_url, bookId: book.id })); } catch (e) {}
      window.location.href = "/pages/home.html";
    });

    // Download
    downloadBtn?.addEventListener("click", async (e) => {
      if (downloadBtn.disabled) return;
      e.stopPropagation();
      try {
        const res = await fetch(book.pdf_url);
        if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        const safeName = (book.book_name || "book").replace(/[\/\\:?<>|*"]/g, "_");
        link.download = `${safeName}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      } catch (err) {
        console.error("Download failed:", err);
        alert("Download failed. Please try again later or open the file manually.");
        window.open(book.pdf_url, "_blank");
      }
    });

    container.appendChild(article);
  });
}

/* Auth listener: use email to find member and load */
if (!window.__libraryAuthListenerRegistered) {
  window.__libraryAuthListenerRegistered = true;
  initNoBooksOverlay();
  // removed createErrorOverlayIfNeeded() per request

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const container = getLibraryContainer();
    if (!user?.email) {
      // no auth or no email -> show "no books" overlay
      currentMemberId = null;
      if (container) renderEmptyLibrary(container);
      return;
    }
    // load by email (lowercase matching expected in members)
    loadUserLibraryByEmail(user.email);
  });

  // If auth already has a user when module runs:
  if (auth.currentUser?.email) loadUserLibraryByEmail(auth.currentUser.email);
}