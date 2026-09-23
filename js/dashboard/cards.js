import { db } from "../../src/firebase-config.js"; 
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"; 

/// ==================================GRID CARDS EVENT AND METHODS==================================
const cardTotalBooks = document.querySelector(".card1"); 
const cardDownloadedBooks = document.querySelector(".card2");
const onreadMode = document.querySelector(".card3");
const totalPurchaseBooks = document.querySelector(".card4");
const ActiveMembers = document.querySelector(".card8");

///================================FIRST CARD==================================
async function updateTotalBooksCard(cardElement) {
    if (!cardElement) return; 

    let bookCount = localStorage.getItem("cachedTotalBooks") || 0;
    let analysisText = localStorage.getItem("cachedAnalysisText") || "+0% this month";
    let lineStyle = bookCount > 0 ? "up" : "zero"; 

    renderCardContent(cardElement, "Total books in stock", bookCount, analysisText, lineStyle, "fa-book");

    try {
        const booksCollection = collection(db, "book-list");
        const snapshot = await getDocs(booksCollection);
        
        bookCount = snapshot.size; 
        lineStyle = bookCount > 0 ? "up" : "zero";
        analysisText = bookCount > 0 ? "+12% last month" : "0% change";  
        
        localStorage.setItem("cachedTotalBooks", bookCount);
        localStorage.setItem("cachedAnalysisText", analysisText);

        renderCardContent(cardElement, "Total books in stock", bookCount, analysisText, lineStyle, "fa-book");
    } catch (error) {
        console.warn("Firestore fetch failed for Card 1", error);
    }
}

///================================SECOND CARD==================================
async function updateDownloadedBooks(cardElement) {
    if (!cardElement) return;

    let downloadedCount = localStorage.getItem("cachedDownloadedCount") || 0;
    let currentMonthName = new Date().toLocaleString('en-US', { month: 'short' }); 
    let detailDisplayed = localStorage.getItem("cachedDownloadedAnalysis") || `+0% in ${currentMonthName}`;
    let lineStyle = downloadedCount > 0 ? "up" : "zero";

    // Render local storage cache first so the screen isn't blank
    renderCardContent(cardElement, "Downloaded Books", downloadedCount, detailDisplayed, lineStyle, "fa-download");

    try {
        const downloadedCollection = collection(db, "book-list"); 
        const downloadedQuery = query(downloadedCollection, where("isDownloaded", "==", true));
        const snapshot = await getDocs(downloadedQuery);

        downloadedCount = snapshot.size;
        lineStyle = downloadedCount > 0 ? "up" : "zero";
        detailDisplayed = `${downloadedCount > 0 ? "+10% in" : "0 changes in"} ${currentMonthName}`;

        localStorage.setItem("cachedDownloadedCount", downloadedCount);
        localStorage.setItem("cachedDownloadedAnalysis", detailDisplayed);

        // Re-render layout content dynamically with live firestore dataset sizes
        renderCardContent(cardElement, "Downloaded Books", downloadedCount, detailDisplayed, lineStyle, "fa-download");
    } catch (error) {
        console.error("Failed to check out downloaded books dataset:", error);
    }
}

///================================THIRD CARD======================================
async function updateOnReadModeCard(cardElement) {
    if (!cardElement) return;

    let activeReadingCount = localStorage.getItem("cachedReadingCount") || 0;
    let detailDisplayed = localStorage.getItem("cachedReadingAnalysis") || "+0% active reading";
    let lineStyle = activeReadingCount > 0 ? "up" : "zero";

    renderCardContent(cardElement, "Books on Read Mode", activeReadingCount, detailDisplayed, lineStyle, "fa-book-open");

    try {
        const booksCollection = collection(db, "book-list"); 
        const snapshot = await getDocs(booksCollection);

        let activeCount = 0;
        
        // loop for each book check if its on reading mode
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isOnReadMode === true || data.isOnReadMode === "true") {
                activeCount++;
            }
        });

        activeReadingCount = activeCount; 
        lineStyle = activeReadingCount > 0 ? "up" : "zero";
        detailDisplayed = activeReadingCount > 0 ? `+5% active reading` : "0 active readers";

        localStorage.setItem("cachedReadingCount", activeReadingCount);
        localStorage.setItem("cachedReadingAnalysis", detailDisplayed);

        renderCardContent(cardElement, "Books on Read Mode", activeReadingCount, detailDisplayed, lineStyle, "fa-book-open");
    } catch (error) {
        console.error("Firestore fetch failed for Card 3 (Read Mode):", error);
    }
}

///================================FOURTH CARD======================================
async function updatePurchaseBooksCard(cardElement, currentMemberDocId) {
    if (!cardElement || !currentMemberDocId) return;

    let purchaseCount = localStorage.getItem(`cachedMemberPurchases_${currentMemberDocId}`) || 0;
    let currentMonthName = new Date().toLocaleString('en-US', { month: 'short' }); 
    let detailDisplayed = localStorage.getItem(`cachedMemberPurchasesAnalysis_${currentMemberDocId}`) || `0 changes in ${currentMonthName}`;
    let lineStyle = purchaseCount > 0 ? "up" : "zero";

    renderCardContent(cardElement, "Your Purchased Books", purchaseCount, detailDisplayed, lineStyle, "fa-credit-card");

    try {
        const purchasesCollectionRef = collection(db, "members", currentMemberDocId, "purchased-books");
        const snapshot = await getDocs(purchasesCollectionRef);

        purchaseCount = snapshot.size; 
        lineStyle = purchaseCount > 0 ? "up" : "zero";
        detailDisplayed = `${purchaseCount > 0 ? "+8% owned" : "0 changes in"} ${currentMonthName}`;

        localStorage.setItem(`cachedMemberPurchases_${currentMemberDocId}`, purchaseCount);
        localStorage.setItem(`cachedMemberPurchasesAnalysis_${currentMemberDocId}`, detailDisplayed);

        renderCardContent(cardElement, "Your Purchased Books", purchaseCount, detailDisplayed, lineStyle, "fa-credit-card");
    } catch (error) {
        console.error("Firestore fetch failed for Card 4 (Member Purchases):", error);
    }
}

///================================HELPER FUNCTION==================================
function renderCardContent(element, title, count, detail, lineStyleType, iconClass) {
    let chartLine = "M0,15 L100,15"; 
    let strokeColor = "var (--current-analysis-color: #0056b3;)"; 

    if (count === 0 || lineStyleType === 'zero') {
        chartLine = "M0,15 L100,15"; 
        strokeColor = "var(--current-analysis-color)"; 
    } else if (lineStyleType === 'up') {
        chartLine = "M0,25 Q30,22 50,15 T100,5"; 
        strokeColor = "var(--current-analysis-color)"; 
    } else if (lineStyleType === 'down') {
        chartLine = "M0,5 Q30,8 50,15 T100,28"; 
        strokeColor = "var(--current-analysis-color)"; 
    }

    const badgeClass = lineStyleType === 'up' ? 'trend-up' : (lineStyleType === 'down' ? 'trend-down' : 'trend-neutral');

    element.innerHTML = `
        <div class="head-icons">
            <span class="icon"><i class="fa-solid ${iconClass}"></i></span>
            <span class="percentage ${badgeClass}">${detail}</span>
        </div>
        <p>${title}</p>
        <h3>${count}</h3>
        <div class="analysis-line">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="${chartLine}" 
                      fill="none" 
                      stroke="${strokeColor}" 
                      stroke-width="1.5" 
                      stroke-linecap="round"/>
            </svg>
        </div>
    `;
}


/// ================================MAIN BODY LIVE HEADLINE==================================
let timeSetting = "today";
const headline = document.querySelector(".headline");

export async function updateNews() {
    if (!headline) return;

    let activeMemberCount = localStorage.getItem("cachedActiveMembersCount") || 0;
    headline.textContent = `${activeMemberCount} Active members ${timeSetting}.`;

    try {
        const membersCollection = collection(db, "members");
        const activeQuery = query(membersCollection, where("isLoggedIn", "==", true));
        const snapshot = await getDocs(activeQuery);

        activeMemberCount = snapshot.size;
        localStorage.setItem("cachedActiveMembersCount", activeMemberCount);

      
        headline.textContent = `${activeMemberCount} Active members ${timeSetting}.`;
    } catch (error) {
        console.error("failed:", error);
    }
}


updateNews();
updateTotalBooksCard(cardTotalBooks);
updateDownloadedBooks(cardDownloadedBooks);
updateOnReadModeCard(onreadMode);
updatePurchaseBooksCard(totalPurchaseBooks, "2UtSzWinnDXRkEmwHQyt"); // later replace with user authentication firebase auth on login page


// =====================DOM FOR CHECKOUT BUTTON LISTNER===============================
document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.querySelector(".checkout-btn");

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async () => {
            console.log("Triggering live metrics reload loop...");
            timeSetting = "today";
            
            await updateNews(); 
            if (typeof refreshAllCards === "function") refreshAllCards();
        });
    }
});

