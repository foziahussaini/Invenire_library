import { db } from "../../../src/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const membersTableBody = document.querySelector(".member-table-body");
const feedbackCardsContainer = document.querySelector(".feedback-cards");
const detailsContainer = document.querySelector(".allmember-activity-container");

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

// ==================================== FUNCTION 1: GENERATE ALL USERS TABLE ROWS ====================================
async function membersTableList() {
    if (!membersTableBody) return;

    try {
        membersTableBody.innerHTML = `
            <tr>
                <td">
                    <div class="loading-state">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <span>Loading Table...</span>
                    </div>
                </td>
            </tr>
        `;

        const membersSnapshot = await getDocs(collection(db, "members"));
        if (membersSnapshot.empty) return;

        membersTableBody.innerHTML = ""; 

        for (const docSnap of membersSnapshot.docs) {
            const user = docSnap.data();
            const memberDocId = docSnap.id;

            // Gather sizes from subcollections to populate table counters
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

            // SCROLL TARGET FUNCTION: Looks for the matching card id on the page and scrolls to it
            const handleScrollToCard = () => {
                const targetCard = document.getElementById(`member-card-${memberDocId}`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            };

            const detailBtn = row.querySelector(".details-btn");
            detailBtn.addEventListener("click", (e) => {
                e.stopPropagation(); 
                handleScrollToCard();
            });

            row.addEventListener("click", () => {
                handleScrollToCard();
            });

            membersTableBody.appendChild(row);
        }

        await userDetailsCards(membersSnapshot);

    } catch (error) {
        console.error("Failed loading table elements via firestore:", error);
    }
}

// ==================================== FUNCTION 2: GENERATE ALL UNIQUE PROFILE CARDS ====================================
async function userDetailsCards(membersSnapshot) {
    if (!detailsContainer || !membersSnapshot || membersSnapshot.empty) return;

    detailsContainer.innerHTML = `
        <div class="member-details-container">
            <div class="loading-state">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Generating Member Profiles Cards Matrix...</span>
            </div>
        </div>
    `;

    // HELPER FUNCTION: Safely turns Firestore Timestamps into DD/MMM/YYYY
    const formatFirestoreTimestamp = (timestamp) => {
        if (!timestamp) return "No record";
        
        let dateObj;

        // 1. If it's a native Firestore Timestamp object with a .toDate() method
        if (typeof timestamp.toDate === "function") {
            dateObj = timestamp.toDate();
        } 
        // 2. If it's a raw object containing seconds property
        else if (timestamp.seconds !== undefined) {
            dateObj = new Date(timestamp.seconds * 1000);
        } 
        // 3. Fallback if it is already an ISO string or standard date representation
        else {
            dateObj = new Date(timestamp);
        }

        // Validate that we created a real date instance
        if (isNaN(dateObj.getTime())) return "No record";

        const day = String(dateObj.getDate()).padStart(2, '0');
        
        // Formats month names to short 3-letter representations (e.g., Sep, Oct, Nov)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthName = months[dateObj.getMonth()];
        
        const year = dateObj.getFullYear();

        return `${day}/${monthName}/${year}`;
    };

    try {
        detailsContainer.innerHTML = "";

        for (const docSnap of membersSnapshot.docs) {
            const userData = docSnap.data();
            const docId = docSnap.id;

            const downloadSnapshot = await getDocs(collection(db, "members", docId, "download-book"));
            const librarySnapshot = await getDocs(collection(db, "members", docId, "my-library"));
            const readModeSnapshot = await getDocs(collection(db, "members", docId, "onReadMode"));
            const purchasedSnapshot = await getDocs(collection(db, "members", docId, "purchased-books"));

            const collectBookTitles = (snapshot) => {
                let titlesArray = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    titlesArray.push(data.book_name || data.title || doc.id);
                });
                return titlesArray.join(", ") || "None yet";
            };

            const purchasedText = collectBookTitles(purchasedSnapshot);
            const downloadedText = collectBookTitles(downloadSnapshot);
            const readModeText = collectBookTitles(readModeSnapshot);
            const libraryText = collectBookTitles(librarySnapshot);

            const namePlaceholder = userData.full_name || "This member";
            const searchCount = userData.booksSearchedCount || 0;
            const readCount = readModeSnapshot.size;
            const totalCalculatedBooks = searchCount + readCount;
            let sex = userData.full_name;
            if(userData.gender === "female"){
                sex = "she";
            }else if(userData.gender === "male"){
                sex = "he";
            } else{sex = userData.full_name;}

            //values once to avoid variable crashes
            const totalLoginsDisplay = userData["totalLoginsCount"] || 3;
            const activeMinutesDisplay = userData["active_minutes_last_day"] || 23;
            const shareCountDisplay = userData.website_share_count || 0;
            const editCountDisplay = userData.profile_edit_count || 2;

            // Calculate percentage metrics out of 100 for your visual rings
            const loginPercentage = Math.min((totalLoginsDisplay / 50) * 100, 100);
            const activePercentage = Math.min((activeMinutesDisplay / 120) * 100, 100);
            const sharePercentage = Math.min((shareCountDisplay / 10) * 100, 100);
            const editPercentage = Math.min((editCountDisplay / 5) * 100, 100);

            const userCard = document.createElement("div");
            userCard.className = "member-details-container";
            userCard.id = `member-card-${docId}`; 

            const imageUrl = userData["profile-Img"];
            
            const profileImageHtml = imageUrl 
                ? `<img src="${imageUrl}" alt="Profile Image" class="user-avatar-img">`
                : `<img src="../../images/banner/login.png" alt="Default Avatar" class="user-avatar-img">`;

            // Passing the raw timestamp object through the date formatter utility
            const lastLoginDisplay = formatFirestoreTimestamp(userData["last-login"]);

            userCard.innerHTML = `
                <div class="member-detatails-row1">
                    <div class="member-prof-card"> 
                          <div class="profile-avatar"> 
                              <span class="prof-img">${profileImageHtml}</span> 
                           </div> 
                          <p class="member-username">${userData.full_name || "Anonymous Guest"}</p> 
                          <div class="member-status"> 
                              <span id="member-gender">${userData.gender || "Unspecified"}</span> • <span id="member-location">${userData.location || "Global"}</span> 
                          </div> 
                    </div>
                    <div class="last-login-date"><span>${lastLoginDisplay}</span></div> 
                </div>
                
                <div class="member-detail-row2">
                    <!-- =============================BOX 1================================= -->
                    <div class="login-box box1"> 
                        <div class="login-info"> 
                            <p><strong>Total Logins</strong></p> 
                            <span class="login-value" id="member-logins">${totalLoginsDisplay}</span> 
                        </div> 
                        <div class="progress-circle-chart blue-ring" style="--percentage: ${loginPercentage}%;"> 
                            <span class="circle-inner-value"><i class="fa-solid fa-right-to-bracket"></i></span>
                        </div> 
                    </div>
                    <!-- =============================BOX 2================================= -->
                    <div class="duration-active-min box2"> 
                        <div class="active-strick-info"> 
                            <p><strong>Active Minutes</strong></p> 
                            <span class="active-strick-value" id="duration">${activeMinutesDisplay}<small>mins</small></span> 
                        </div> 
                        <div class="progress-circle-chart orange-ring" style="--percentage: ${activePercentage}%;"> 
                            <span class="circle-inner-value"><i class="fa-solid fa-clock"></i></span>
                        </div> 
                    </div> 

                    <!-- =============================BOX 3================================= -->
                    <div class="shared-count box3">
                        <div class="share-info">
                            <p><strong>Website Shares</strong></p>
                            <span class="share-value site-shares">${shareCountDisplay}</span>
                        </div>
                        <div class="progress-circle-chart purple-ring" style="--percentage: ${sharePercentage}%;"> 
                            <span class="circle-inner-value"><i class="fa-solid fa-share-nodes"></i></span>
                        </div> 
                    </div>

                    <!-- =============================BOX 4================================= -->
                    <div class="profile-edits-count box4">
                        <div class="edit-info">
                            <p><strong>Profile Edits</strong></p>
                            <span class="edit-value profile-edits">${editCountDisplay}</span>
                        </div>
                        <div class="progress-circle-chart green-ring" style="--percentage: ${editPercentage}%;"> 
                            <span class="circle-inner-value"><i class="fa-solid fa-user-pen"></i></span>
                        </div> 
                    </div>
                </div>
                
                <div class="member-detail-row3">
                     <div class="books-sections">
                        <p><strong>Purchased Books:</strong> <span class="purchased-books">${purchasedText}</span></p>
                        <p><strong>Downloaded Books:</strong> <span class="downloaded-books">${downloadedText}</span></p>
                        <p><strong>On Read Mode:</strong> <span class="on-read">${readModeText}</span></p>
                        <p><strong>My Library:</strong> <span class="my-library">${libraryText}</span></p>
                    </div>
                </div>    
                <div class="member-detail-row4">
                     <p>${namePlaceholder} has read and search total ${totalCalculatedBooks} books and ${sex} is our active member</p>
                </div>
            `;

            detailsContainer.appendChild(userCard);
        }
    } catch (err) {
        console.error("Failure compiling multi-member layout tracks matrices profiles:", err);
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

