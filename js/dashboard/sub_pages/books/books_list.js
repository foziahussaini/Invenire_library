import { db } from "../../../../src/firebase-config.js"
import { collection, getDocs, doc, deleteDoc} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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

// =====================================================
// TABLE STATUS
// =====================================================

function showTableStatus(message, status = "") {
  if (!tableBodyContainer) return;

  tableBodyContainer.innerHTML = `
    <tr class="table-status-row">
      <td colspan="7" class="table-status ${status}">
        ${message}
      </td>
    </tr>
  `;
}

// =====================================================
// FORMAT DUE DATE
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
        readMode: 0
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
      </tr>
    `;
  });

  tableBodyContainer.innerHTML = rowTable;
  setupTableActionListeners();
}

// =====================================================
// ACTION LISTENERS
// =====================================================
function setupTableActionListeners() {
  // EDIT ACTION HANDLER
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      // find the table row that contains this button (works even if the click target is an icon inside the button)
      const row = event.target.closest(".table-row");
      if (!row) return;

      const bookId = row.dataset.id;
      if (!bookId) return;

      // store the id for cross-page navigation and for the form loader
      localStorage.setItem("editingBookId", bookId);

      // update the hash so users can navigate back and other pages can react
      try {
        window.location.hash = "#add-book-form";
      } catch (err) {
        // ignore
      }

      // attempt to scroll the form into view if it's present on this page
      const maybeForm =
        document.querySelector("#add-book-form") ||
        document.querySelector(".book-form-card") ||
        document.querySelector(".add-books-container");

      if (maybeForm) {
        // small delay helps when hash change or other handlers run
        setTimeout(() => {
          maybeForm.scrollIntoView({ behavior: "smooth", block: "start" });

          // notify any listeners on this page so the form can immediately load the selected book
          window.dispatchEvent(
            new CustomEvent("invenire:edit-book", {
              detail: { bookId }
            })
          );
        }, 150);
      } else {
        // form is not on this page — still dispatch (harmless) and keep the localStorage key for the form page to pick up on load
        window.dispatchEvent(
          new CustomEvent("invenire:edit-book", {
            detail: { bookId }
          })
        );

        // If you want to navigate to a page that contains the form instead, uncomment and update the path below:
        // window.location.href = "/pages/admin_subPages/books.html#add-book-form";
      }
    });
  });

  // DELETE ACTION HANDLER
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
}