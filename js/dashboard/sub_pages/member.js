import { db } from "../../../src/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const membersTableBody = document.querySelector(".member-table-body");
const feedbackCardsContainer = document.querySelector(".feedback-cards");
const detailsContainer = document.querySelector(".member-details-container");

let activeSlotPointer = 1;

// ================================================side bar menu item====================================================
document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll(".menu-item");
    const currentFile = window.location.pathname.split("/").pop();

    menuItems.forEach(item => {
        const link = item.querySelector("a");
        if (!link) return;

        const targetHref = link.getAttribute("href");
        if (targetHref.includes(currentFile) && currentFile !== "") {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    const time = document.querySelector(".time");
    const date = document.querySelector(".date");

// =================================header live time and date============================
    function calender(){
        const now = new Date();
        if (time) {
            time.textContent = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            });
        }
        if (date) {
            date.textContent = now.toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            });
        }
    }

    calender();
    setInterval(calender, 1000);
    initMembersPage();
});

// ============================================ BACKEND ASYNCHRONOUS DATA FIREBASE========================================================
async function initMembersPage() {
    await membersTableList();
    await feedbackCards();
    await  userDetailsCards();
}

// MEMBERS TABLE function getting data from db
async function membersTableList() {
    if (!membersTableBody) return;

    try {
        // ====================LOADING STATE LOGIC ====================
         membersTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 0; border: none;">
                    <div class="loading-state">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <span>Loading...</span>
                    </div>
                </td>
            </tr>
        `;

        const membersSnapshot = await getDocs(collection(db, "members"));
        if (membersSnapshot.empty) return;

        // Clear the hardcoded baseline template item row when dynamic rendering begins
        membersTableBody.innerHTML = ""; 

        for (const docSnap of membersSnapshot.docs) {
            const user = docSnap.data();
            const memberDocId = docSnap.id;

            // Dynamically count sizes from nested user subcollections
            const downloadDocs = await getDocs(collection(db, "members", memberDocId, "download-book"));
            const purchasedDocs = await getDocs(collection(db, "members", memberDocId, "purchased-books"));
            const readModeDocs = await getDocs(collection(db, "members", memberDocId, "onReadMode"));

            const row = document.createElement("tr");
            row.style.cursor = "pointer";
            row.classList.add("member-row");

            row.innerHTML = `
                <td><strong>${user.full_name || "Anonymous Guest"}</strong></td>
                <td>${user.email || "N/A"}</td>
                <td>${user.active_days || 0} Days</td>
                <td class="text-center">${downloadDocs.size}</td>
                <td class="text-center">${purchasedDocs.size}</td>
                <td class="text-center">${readModeDocs.size}</td>
                <td><button class="details-btn">Details</button></td>
            `;

            const detailBtn = row.querySelector(".details-btn");

            detailBtn.addEventListener("click", (e) => {
                e.stopPropagation(); // Stops event bubbling up to the row container
                userDetailsCards(user, memberDocId);
            });

            // Fallback: Also process if they click anywhere on the background layout row
            row.addEventListener("click", () => {
                userDetailsCards(user, memberDocId);
            });

            membersTableBody.appendChild(row);
        }
    } catch (error) {
        console.log("Failed loading table elements via firestore:", error);
    }
}

// user details card
// user details card - 100% dynamic without changing your inner class names
async function userDetailsCards(userData, docId) {
    if (!detailsContainer) return;

    // Show details parent section container wrapper layout block visually
    detailsContainer.style.display = "flex";

    try {
        const downloadSnapshot = await getDocs(collection(db, "members", docId, "download-book"));
        const librarySnapshot = await getDocs(collection(db, "members", docId, "my-library"));
        const readModeSnapshot = await getDocs(collection(db, "members", docId, "onReadMode"));
        const purchasedSnapshot = await getDocs(collection(db, "members", docId, "purchased-books"));

        const collectBookTitles = (snapshot) => {
            let titlesArray = [];
            snapshot.forEach(doc => titlesArray.push(doc.id));
            return titlesArray.join(", ") || "None";
        };

        const purchasedText = collectBookTitles(purchasedSnapshot);
        const downloadedText = collectBookTitles(downloadSnapshot);
        const readModeText = collectBookTitles(readModeSnapshot);
        const libraryText = collectBookTitles(librarySnapshot);

        // ==================== DYNAMIC HTML GENERATOR ====================
        const cardElement = document.createElement("div");
        
        // Dynamically assigns the outer class index (.detail1, .detail2, etc.) based on your pointer loop
        cardElement.className = `detail${activeSlotPointer}`; 

        // Injecting your exact inner HTML template structure with your original class names intact
        cardElement.innerHTML = `
            <span class="member-id">ID: ${userData.user_id || docId}</span>
            <span class="m-name">${userData.full_name || "N/A"}</span>
            <span class="m-email">${userData.email || "N/A"}</span>
            <span class="purchased-books">${purchasedText}</span>
            <span class="downloaded-books">${downloadedText}</span>
            <span class="on-read">${readModeText}</span>
            <span class="my-library">${libraryText}</span>
            <span class="active-days">${userData.active_days || 0} Days</span>
            <span class="profile-edits">${userData.profile_edit_count || 0}</span>
            <span class="site-shares">${userData.website_share_count || 0}</span>
        `;

        // Clear out any old hardcoded template placeholders on the very first user inspection click
        if (activeSlotPointer === 1 && detailsContainer.querySelectorAll('[class^="detail"]').length > 0) {
            detailsContainer.innerHTML = "";
        }

        // Check if a card at this slot layout position already exists in the container view
        const existingCard = detailsContainer.querySelector(`.detail${activeSlotPointer}`);
        if (existingCard) {
            // Replace the old card data with the fresh clicked member card layout structure
            detailsContainer.replaceChild(cardElement, existingCard);
        } else {
            // Append it to build up your active list grid lanes
            detailsContainer.appendChild(cardElement);
        }

        // Smoothly scroll down targeting the container element layout wrapper area
        const targetSection = document.querySelector('[target="memberDetails"]') || detailsContainer;
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        // Progress your slot counter pointer indices (Sequential loop 1-4)
        activeSlotPointer++;
        if (activeSlotPointer > 4) {
            activeSlotPointer = 1; 
        }

    } catch (err) {
        console.error("Subcollection content processing failure encountered:", err);
    }
}


// FEEDBACK CARD GRID ENGINE MAPPINGS
async function feedbackCards() {
    if (!feedbackCardsContainer) return;

    try {
        const snapshot = await getDocs(collection(db, "feedback"));
        if (snapshot.empty) return;

        const visualCardElements = feedbackCardsContainer.querySelectorAll(".feedback");
        let index = 0;

        snapshot.forEach((docSnap) => {
            if (index >= visualCardElements.length) return;

            const review = docSnap.data();
            const targetCard = visualCardElements[index];

            // 1. DYNAMIC RATING PARSER: Converts your numeric 'rating: 5' into 5 stars '★★★★★'
            const totalStars = Number(review.rating) || 5; 
            let starRatingString = "";
            for (let idx = 1; idx <= 5; idx++) { 
                starRatingString += idx <= totalStars ? `★` : `☆`; 
            }

            // 2. FIXED DATE PARSER: Reads your exact native Firestore 'date' key safely
            let feedbackDate = "Recent";
            if (review.date) {
                // Extracts milliseconds from Firestore native Timestamp structure
                const dateObj = review.date.seconds ? new Date(review.date.seconds * 1000) : new Date(review.date);
                feedbackDate = dateObj.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            }

            const nameEl = targetCard.querySelector(".member-name");
            const emailEl = targetCard.querySelector(".member-email"); 
            const ratingEl = targetCard.querySelector(".feedback-rate");
            const commentEl = targetCard.querySelector(".member-msg");
            const dateEl = targetCard.querySelector(".fedback-date");

            // Map data cleanly into your HTML structure layout nodes
            if (nameEl) nameEl.textContent = review.member_name || "Anonymous";
            if (emailEl) emailEl.textContent = review.email || "N/A"; 
            if (ratingEl) ratingEl.textContent = starRatingString;
            if (commentEl) commentEl.textContent = review.message || "";
            if (dateEl) dateEl.textContent = feedbackDate;

            index++;
        });
    } catch (error) {
        console.error("Failed loading feedback elements:", error);
    }
}

