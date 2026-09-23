import { db } from "../../../src/firebase-config.js"; 
import { collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let tableBodyContainer = null;
let allBooksData = [];
// default data of books array for empty firestore db
const fallbackBooks = [
    { id: "defaultBook-1", name: "The Alchemist", author: "Paulo Coelho", dueDate: "2026-10-15", edition: "1st edition", downloads: 12, purchases: 45, readMode: 30 },
    { id: "defaultBook-2", name: "The Great Gatsby", author: "F. Scott Fitzgerald", dueDate: "2026-11-02", edition: "3rd Edition", downloads: 85, purchases: 120, readMode: 94 },
    { id: "defaultBook-3", name: "1984", author: "George Orwell", dueDate: "2026-12-05", edition: "Signet Classic", downloads: 150, purchases: 340, readMode: 210 },
    { id: "defaultBook-4", name: "To Kill a Mockingbird", author: "Harper Lee", dueDate: "2026-10-22", edition: "40th Anniv.", downloads: 95, purchases: 180, readMode: 115 },
    { id: "defaultBook-5", name: "The Catcher in the Rye", author: "J.D. Salinger", dueDate: "2026-11-18", edition: "Mass Market", downloads: 45, purchases: 90, readMode: 65 },
    { id: "defaultBook-6", name: "The Hobbit", author: "J.R.R. Tolkien", dueDate: "2026-12-15", edition: "Collector's Ed.", downloads: 310, purchases: 420, readMode: 198 },
    { id: "defaultBook-7", name: "Fahrenheit 451", author: "Ray Bradbury", dueDate: "2026-10-29", edition: "Del Rey", downloads: 78, purchases: 115, readMode: 84 },
    { id: "defaultBook-8", name: "Animal Farm", author: "George Orwell", dueDate: "2026-11-12", edition: "Hardcover", downloads: 112, purchases: 205, readMode: 142 }
];

document.addEventListener("DOMContentLoaded", () => {
    tableBodyContainer = document.querySelector("#books-table-body");

    if (!tableBodyContainer) {
        console.error("the target container is missing");
        return;
    }
    allLibraryBooks();
});

// ============DUE DATE FORMAT===============
function formatDueDate(value) {
    if (!value) {
        return "No Due Date";
    }

    let date;

    // Firestore Timestamp
    if (typeof value.toDate === "function") {
        date = value.toDate();
    }

    // JavaScript Date
    else if (value instanceof Date) {
        date = value;
    }

    // Date format: YYYY-MM-DD
    else if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        const [year, month, day] = value.split("-").map(Number);

        // JavaScript months are zero-based
        date = new Date(year, month - 1, day);
    }

    // Date format: DD/Mon/YYYY, for example 23/Sep/2026
    else if (
        typeof value === "string" &&
        /^\d{2}\/[A-Za-z]{3}\/\d{4}$/.test(value)
    ) {
        const [day, monthText, year] = value.split("/");

        const months = {
            Jan: 0,
            Feb: 1,
            Mar: 2,
            Apr: 3,
            May: 4,
            Jun: 5,
            Jul: 6,
            Aug: 7,
            Sep: 8,
            Oct: 9,
            Nov: 10,
            Dec: 11
        };

        const normalizedMonth =
            monthText.charAt(0).toUpperCase() +
            monthText.slice(1).toLowerCase();

        const month = months[normalizedMonth];

        if (month === undefined) {
            return "No Due Date";
        }

        date = new Date(
            Number(year),
            month,
            Number(day)
        );
    }

    // Other supported date values
    else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
        return "No Due Date";
    }

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const day = String(date.getDate()).padStart(2, "0");
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

// db will present at firebase store
async function allLibraryBooks() {
    try {
        tableBodyContainer.innerHTML = `
            <div class="loading-state"
                <span><i class="fas fa-spinner fa-spin"></i></span>
                Calculating library metrics...
            </div>
        `;

        // this snapshot is for firestore data
        const primarySnapshot = await getDocs(collection(db, "book-list"));

        // condition for less db at firestore
        if (primarySnapshot.size < 8) {
            console.log(
                `Firestore has ${primarySnapshot.size} books. Showing fallback books instead.`
            );

            allBooksData = [...fallbackBooks];
            booksRowContent(allBooksData);
            return;
        }

        // this condition is for the firestore data which is more than 8 now
        const uniqueBooksMap = new Map();

        primarySnapshot.forEach((docSnap) => {
            const data = docSnap.data();

            uniqueBooksMap.set(docSnap.id, {
                id: docSnap.id,
                name: data.book_name || "Untitled Book",
                author: data.author || "Unknown Author",
                dueDate: formatDueDate(data.dueDate),
                edition: data.edition || "1st Edition",
                downloads: 0,
                purchases: 0,
                readMode: 0
            });
        });

        const membersSnapshot = await getDocs(collection(db, "members"));

        for (const memberDoc of membersSnapshot.docs) {
            const memberId = memberDoc.id;

            const subCollections = [
                {
                    name: "download-book",
                    metric: "downloads"
                },
                {
                    name: "purchased-books",
                    metric: "purchases"
                },
                {
                    name: "onReadMode",
                    metric: "readMode"
                }
            ];

            await Promise.all(
                subCollections.map(async (sub) => {
                    try {
                        const subRef = collection(db, "members", memberId, sub.name);

                        const subSnapshot = await getDocs(subRef);

                        subSnapshot.forEach((subDoc) => {
                            const subData = subDoc.data();

                            // check condition for all the subcollections data
                            const bookId = subData.bookId || subDoc.id;

                            if (uniqueBooksMap.has(bookId)) {
                                uniqueBooksMap.get(bookId)[sub.metric] += 1;
                            }
                        });
                    } catch (subError) {
                        console.warn(
                            `Could not read ${sub.name} for member ${memberId}`,
                            subError
                        );
                    }
                })
            );
        }

        allBooksData = Array.from(uniqueBooksMap.values());
        booksRowContent(allBooksData);
    } catch (error) {
        console.log("Firestore error. Showing fallback list:", error);

        allBooksData = [...fallbackBooks];
        booksRowContent(allBooksData);
    }
}

// render function
function booksRowContent(booksArray) {
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
                    <button type="button" class="btns edit-btn" title="Edit Book" >
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

// ACTION BUTTON LISTENERS FOR EDIT AND DELETE
function setupTableActionListeners() {
    // Edit Action Handler
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const row = e.target.closest(".table-row");
            const bookId = row.dataset.id;
            const selectedBook = allBooksData.find(b => b.id === bookId);

            if (selectedBook) {
                const bookInput = document.querySelector("input[placeholder='book name']");
                const authorInput = document.querySelector("input[placeholder='author']");
                
                if (bookInput && authorInput) {
                    bookInput.value = selectedBook.name;
                    authorInput.value = selectedBook.author;
                }
                
                const formWrapper = document.querySelector(".add-books-container");
                if (formWrapper) {
                    formWrapper.dataset.editingId = bookId;
                    formWrapper.scrollIntoView({ behavior: "smooth" });
                }
            }
        });
    });

    // Delete Action Handler
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const row = e.target.closest(".table-row");
            const bookId = row.dataset.id;

            if (confirm("Are you sure you want to permanently delete this book?")) {
                try {
                    if (!bookId.startsWith("fallback-")) {
                        await deleteDoc(doc(db, "book-list", bookId));
                    }
                    
                    allBooksData = allBooksData.filter(book => book.id !== bookId);
                    booksRowContent(allBooksData);
                    console.log(`Successfully removed document ID: ${bookId}`);
                } catch (err) {
                    console.error("Deletion task failed:", err);
                    alert("Could not process record deletion.");
                }
            }
        });
    });
}
