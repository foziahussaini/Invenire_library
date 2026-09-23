import { db } from "../../src/firebase-config.js";
// FIXED: This dedicated file imports onSnapshot and collectionGroup explicitly 
import { collectionGroup, onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// ==========================================
// 1. MODULAR HELPER FUNCTIONS
// ==========================================
function DonutCardContent(cardElement) {
    cardElement.innerHTML = `
        <div class="card-header-flex">
            <div class="title-group">
                <div class="card-title-row">
                    <span class="card-icon">📚</span>
                    <h3 class="card-title">Amount Overview</h3>
                </div>
                <p class="card-subtitle">Loading last</p>
            </div>
            <div class="growth-badge">--%</div>
        </div>
        
        <div class="chart-wrapper">
            <div class="donut-chart">
                <div class="donut-inner-content">
                    <div class="donut-label">Total Fee</div>
                    <div class="donut-value">$0</div>
                </div>
            </div>
        </div>

        <p class="purchased-book-size">Counting purchased books...</p>
    `;
}

function totalBookPrice(priceString) {
    if (!priceString) return 0;
    const cleanNumericString = String(priceString).replace(/[^0-9.]/g, "");
    return parseFloat(cleanNumericString) || 0;
}

function formatSubtitleDate(date) {
    if (!date) return "No purchases logged";
    const options = { year: 'numeric', month: 'short' };
    return `Purchase Date: ${date.toLocaleDateString('en-US', options)}`;
}

function updateCardMetrics(cardElement, snapshot) {
    const subtitleElement = cardElement.querySelector(".card-subtitle");
    const badgeElement = cardElement.querySelector(".growth-badge");
    const feeDisplayElement = cardElement.querySelector(".donut-value");
    const countDisplayElement = cardElement.querySelector(".purchased-book-size");

    const totalBooks = snapshot.size;
    countDisplayElement.textContent = `Total Books Purchased: ${totalBooks}`;

    if (totalBooks === 0) {
        subtitleElement.textContent = formatSubtitleDate(null);
        badgeElement.textContent = "0%";
        feeDisplayElement.textContent = "\$0";
        return;
    }

    let totalFee = 0;
    let transactions = [];

    snapshot.forEach((doc) => {
        const data = doc.data();
        const bookValue = totalBookPrice(data.price);
        totalFee += bookValue;

        if (data.purchaseDate) {
            const cleanDate = data.purchaseDate.toDate ? data.purchaseDate.toDate() : new Date(data.purchaseDate);
            transactions.push({ price: bookValue, date: cleanDate });
        }
    });

    if (transactions.length > 0) {
        transactions.sort((a, b) => b.date - a.date);
        subtitleElement.textContent = formatSubtitleDate(transactions[0].date);
    } else {
        subtitleElement.textContent = "No purchase dates defined";
    }

    feeDisplayElement.textContent = `$${totalFee.toLocaleString()}`;

    if (transactions.length > 1) {
        transactions.sort((a, b) => a.date - b.date);
        const latestBookPrice = transactions[transactions.length - 1].price;
        const previousSubtotal = totalFee - latestBookPrice;

        if (previousSubtotal > 0) {
            const growthRate = ((latestBookPrice / previousSubtotal) * 100).toFixed(1);
            badgeElement.textContent = `+${growthRate}%`;
        } else {
            badgeElement.textContent = "+100%";
        }
    } else {
        badgeElement.textContent = "+100%";
    }
}

// ==========================================
// 2. RUNTIME EXPORT ENGINE
// ==========================================
export async function updatePurchasedDonutCard(cardElement) {
    if (!cardElement) return;

    DonutCardContent(cardElement);

    // Queries the subcollection path globally across all parents
    const allPurchasedBooksRef = collectionGroup(db, "purchased-books");

    onSnapshot(allPurchasedBooksRef, (snapshot) => {
        updateCardMetrics(cardElement, snapshot);
    }, (error) => {
        console.error("Firestore Collection Group Error:", error);
        const countDisplayElement = cardElement.querySelector(".purchased-book-size");
        if (countDisplayElement) countDisplayElement.textContent = "Data connection error";
    });
}

// Automatically runs initialization on execution
const card6Element = document.querySelector(".card6");
if (card6Element) {
    updatePurchasedDonutCard(card6Element);
}
