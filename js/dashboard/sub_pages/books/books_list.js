import { db } from "../../../../src/firebase-config.js"
import { collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let tableBodyContainer = null;
let allBooksData = [];

document.addEventListener("DOMContentLoaded", () => {
  tableBodyContainer = document.querySelector("#books-table-body");

  if (!tableBodyContainer) {
    console.error("Target container #books-table-body is missing.");
    return;
  }

  allLibraryBooks();
});

function showTableStatus(message, status = "") {
  if (!tableBodyContainer) return;

  tableBodyContainer.innerHTML = `
    <tr class="table-status-row">
      <td colspan="9" class="table-status ${status}">
        ${message}
      </td>
    </tr>
  `;
}

// =====================================================
// FORMAT DUE DATE
// (unchanged)
// =====================================================

function formatDueDate(value) {
  if (!value) return "No Due Date";

  let date;

  if (typeof value.toDate === "function") {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] = value.split("-").map(Number);
    date = new Date(year, month - 1, day);
  } else if (
    typeof value === "string" &&
    /^\d{2}\/[A-Za-z]{3}\/\d{4}$/.test(value)
  ) {
    const [day, monthText, year] = value.split("/");

    const months = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const normalizedMonth =
      monthText.charAt(0).toUpperCase() +
      monthText.slice(1).toLowerCase();

    const month = months[normalizedMonth];

    if (month === undefined) return "No Due Date";

    date = new Date(Number(year), month, Number(day));
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return "No Due Date";

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const day = String(date.getDate()).padStart(2, "0");
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// =====================================================
// BOOK MATCHING HELPERS
// =====================================================

function normalizeBookName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getActivityBookId(activityData, activityDocument) {
  return (
    activityData.bookId ||
    activityData.book_id ||
    activityData.bookID ||
    activityData.book_id_ref ||
    activityDocument.id ||
    null
  );
}

function getActivityBookName(activityData) {
  return (
    activityData.book_name ||
    activityData.bookName ||
    activityData.name ||
    activityData.title ||
    null
  );
}

// =====================================================
// LOAD BOOK LIST + MEMBER ACTIVITY
// =====================================================

async function allLibraryBooks() {
  if (!tableBodyContainer) return;

  showTableStatus(
    `
      <span><i class="fas fa-spinner fa-spin"></i></span>
      Calculating library metrics...
    `,
    "loading"
  );

  try {
    const booksSnapshot = await getDocs(collection(db, "book-list"));

    if (booksSnapshot.empty) {
      allBooksData = [];
      showTableStatus("No data found", "empty");
      return;
    }

    const booksByDocumentId = new Map();
    const booksByName = new Map();

    booksSnapshot.forEach((bookDocument) => {
      const data = bookDocument.data();

      const bookName =
        data.book_name ||
        data.bookName ||
        data.name ||
        data.title ||
        "Untitled Book";

      const record = {
        id: bookDocument.id,
        name: bookName,
        author: data.author || data.book_author || "Unknown Author",
        dueDate: formatDueDate(data.createdAt),
        edition: data.edition || "1st Edition",
        downloads: 0,
        purchases: 0,
        readMode: 0,
        // include price from the book-list document (fallback to an empty string or dash)
        price: data.price ?? "—"
      };

      booksByDocumentId.set(bookDocument.id, record);
      booksByName.set(normalizeBookName(bookName), record);
    });

    const membersSnapshot = await getDocs(collection(db, "members"));

    if (membersSnapshot.empty) {
      allBooksData = [];
      showTableStatus("No data found", "empty");
      return;
    }

    const subCollections = [
      { name: "download-book", metric: "downloads" },
      { name: "purchased-books", metric: "purchases" },
      { name: "onReadMode", metric: "readMode" }
    ];

    let totalActivityFound = 0;

    await Promise.all(
      membersSnapshot.docs.map(async (memberDocument) => {
        const memberId = memberDocument.id;

        await Promise.all(
          subCollections.map(async (collectionInfo) => {
            try {
              const subSnapshot = await getDocs(
                collection(db, "members", memberId, collectionInfo.name)
              );

              subSnapshot.forEach((subDoc) => {
                const subData = subDoc.data();

                const activityBookId = getActivityBookId(subData, subDoc);
                const activityBookName = getActivityBookName(subData);

                let matchingBook = null;

                if (activityBookId) {
                  matchingBook = booksByDocumentId.get(activityBookId);
                }

                if (!matchingBook && activityBookName) {
                  matchingBook = booksByName.get(
                    normalizeBookName(activityBookName)
                  );
                }

                if (!matchingBook) {
                  return;
                }

                matchingBook[collectionInfo.metric] += 1;
                totalActivityFound += 1;
              });
            } catch (error) {
              throw new Error(
                `Could not read ${collectionInfo.name} for member ${memberId}: ${error.message}`
              );
            }
          })
        );
      })
    );

    if (totalActivityFound === 0) {
      allBooksData = [];
      showTableStatus("No data found", "empty");
      return;
    }

    allBooksData = Array.from(booksByDocumentId.values());
    booksRowContent(allBooksData);

    console.log("Calculated book metrics:", allBooksData);
  } catch (error) {
    console.error("Firestore/network error:", error);
    allBooksData = [];
    showTableStatus("Network error — please check your connection", "error");
  }
}

// =====================================================
// RENDER TABLE ROWS
// =====================================================

function booksRowContent(booksArray) {
  if (!booksArray || booksArray.length === 0) {
    showTableStatus("No data found", "empty");
    return;
  }

  let rowTable = "";

  booksArray.forEach((book) => {
    rowTable += `
      <tr class="table-row" data-id="${book.id}">
        <td class="book-info-cell">
          <span class="book-title" title="${book.name}">
            ${book.name}
          </span>
          <span class="book-author-sub">
            ${book.author}
          </span>
        </td>

        <td class="book-date">
          ${book.dueDate}
        </td>

        <td class="book-edition">
          ${book.edition}
        </td>

        <td class="state-count text-center">
          ${book.downloads}
        </td>

        <td class="state-count text-center">
          ${book.purchases}
        </td>

        <td class="state-count text-center">
          ${book.readMode}
        </td>

        <td class="state-count price">
          ${book.price}
        </td>

        <td class="action-buttons text-center">
          <button
            type="button"
            class="btns edit-btn"
            title="Edit Book"
          >
            <i class="fa-solid fa-pen-to-square"></i>
          </button>

          <button
            type="button"
            class="btns delete-btn"
            title="Delete Book"
          >
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>

        <!-- NEW: select checkbox column (keeps layout/classes intact) -->
        <td class="text-center select-cell">
          <input type="checkbox" class="row-select" data-id="${book.id}" aria-label="Select book">
        </td>
      </tr>
    `;
  });

  tableBodyContainer.innerHTML = rowTable;
  setupTableActionListeners();
}

// =====================================ACTION LISTENERS=============================================

function setupTableActionListeners() {
  // EDIT ACTION HANDLER (unchanged)
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const row = event.target.closest(".table-row");
      if (!row) return;

      const bookId = row.dataset.id;
      if (!bookId) return;

      localStorage.setItem("editingBookId", bookId);

      try {
        window.location.hash = "#add-book-form";
      } catch (err) {
        // ignore
      }

      const maybeForm =
        document.querySelector("#add-book-form") ||
        document.querySelector(".book-form-card") ||
        document.querySelector(".add-books-container");

      if (maybeForm) {
        setTimeout(() => {
          maybeForm.scrollIntoView({ behavior: "smooth", block: "start" });
          window.dispatchEvent(
            new CustomEvent("invenire:edit-book", {
              detail: { bookId }
            })
          );
        }, 150);
      } else {
        window.dispatchEvent(
          new CustomEvent("invenire:edit-book", {
            detail: { bookId }
          })
        );
      }
    });
  });

  // DELETE ACTION HANDLER (unchanged single-delete)
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      const row = event.target.closest(".table-row");
      if (!row) return;

      const bookId = row.dataset.id;
      if (!bookId) return;

      const confirmDelete = confirm(
        "Are you sure you want to permanently delete this book?"
      );

      if (!confirmDelete) return;

      try {
        await deleteDoc(doc(db, "book-list", bookId));

        // remove from local list and re-render
        allBooksData = allBooksData.filter((book) => book.id !== bookId);
        booksRowContent(allBooksData);

        console.log(`Deleted book: ${bookId}`);
      } catch (error) {
        console.error("Deletion failed:", error);
        alert("Could not delete the record. Please try again.");
      }
    });
  });

  // SELECT-ALL checkbox in header
  const selectAllCheckbox = document.querySelector("#select-all");
  if (selectAllCheckbox) {
    // ensure it's unchecked when rows are freshly rendered
    selectAllCheckbox.checked = false;

    selectAllCheckbox.addEventListener("change", (e) => {
      const checked = e.target.checked;
      document.querySelectorAll(".row-select").forEach((cb) => {
        cb.checked = checked;
      });
    });
  }

  // Keep header checkbox state in sync when user toggles individual rows
  document.querySelectorAll(".row-select").forEach((cb) => {
    cb.addEventListener("change", () => {
      const all = Array.from(document.querySelectorAll(".row-select"));
      const checkedCount = all.filter((c) => c.checked).length;
      const header = document.querySelector("#select-all");
      if (!header) return;
      header.checked = checkedCount > 0 && checkedCount === all.length;
      header.indeterminate = checkedCount > 0 && checkedCount < all.length;
    });
  });

  // ====================DELETE ALL button (multi-delete)========================
  const deleteAllBtn = document.querySelector(".delete-all-btn");
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const selectedCheckboxes = Array.from(
        document.querySelectorAll(".row-select:checked")
      );
      if (selectedCheckboxes.length === 0) {
        alert("No books selected to delete.");
        return;
      }

      const confirmDelete = confirm(
        `Are you sure you want to permanently delete ${selectedCheckboxes.length} selected book(s)?`
      );
      if (!confirmDelete) return;

      const idsToDelete = selectedCheckboxes.map((cb) => cb.dataset.id).filter(Boolean);

      try {
        await Promise.all(idsToDelete.map((id) => deleteDoc(doc(db, "book-list", id))));

        // remove from local list and re-render
        const idSet = new Set(idsToDelete);
        allBooksData = allBooksData.filter((book) => !idSet.has(book.id));
        booksRowContent(allBooksData);

        console.log("Deleted books:", idsToDelete);
      } catch (error) {
        console.error("deletion failed:", error);
        alert("Could not delete. Please try again.");
      }
    });
  }
}