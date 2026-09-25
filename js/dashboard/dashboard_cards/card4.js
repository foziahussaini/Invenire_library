import { db } from "../../../src/firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// =====================================================
// STORAGE KEY
// =====================================================

const PURCHASE_COUNT_STORAGE_KEY =
    "previousPurchasedBooksCount";


// =====================================================
// RENDER CARD CONTENT
// =====================================================

function renderCardContent(
    element,
    title,
    count,
    detail,
    trendType,
    iconClass
) {
    if (!element) {
        console.error("Card element was not found.");
        return;
    }

    let chartLine = "M0,15 L100,15";

    if (trendType === "up") {
        chartLine = "M0,25 Q30,22 50,15 T100,5";
    } else if (trendType === "down") {
        chartLine = "M0,5 Q30,8 50,15 T100,28";
    }

    const badgeClass =
        trendType === "up"
            ? "trend-up"
            : trendType === "down"
                ? "trend-down"
                : "trend-neutral";

    element.innerHTML = `
        <div class="head-icons">
            <span class="icon">
                <i class="fa-solid ${iconClass}"></i>
            </span>

            <span class="percentage ${badgeClass}">
                ${detail}
            </span>
        </div>

        <p>${title}</p>

        <h3>${count}</h3>

        <div class="analysis-line">
            <svg
                viewBox="0 0 100 30"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <path
                    d="${chartLine}"
                    fill="none"
                    stroke="var(--current-analysis-color, #0056b3)"
                    stroke-width="1.5"
                    stroke-linecap="round"
                ></path>
            </svg>
        </div>
    `;
}


// =====================================================
// CALCULATE PURCHASE PERCENTAGE
// =====================================================

function getPurchasePercentage(currentCount) {
    const savedCount = localStorage.getItem(
        PURCHASE_COUNT_STORAGE_KEY
    );

    // Save the current value for the next comparison
    localStorage.setItem(
        PURCHASE_COUNT_STORAGE_KEY,
        String(currentCount)
    );

    // First successful load
    if (savedCount === null) {
        return {
            trendType: currentCount > 0 ? "up" : "neutral",
            text: currentCount > 0 ? "+0%" : "0%"
        };
    }

    const previousCount = Number(savedCount);

    if (!Number.isFinite(previousCount)) {
        return {
            trendType: currentCount > 0 ? "up" : "neutral",
            text: currentCount > 0 ? "+0%" : "0%"
        };
    }

    // No previous purchases, but purchases exist now
    if (previousCount === 0 && currentCount > 0) {
        return {
            trendType: "up",
            text: "+100%"
        };
    }

    // No purchases before or now
    if (previousCount === 0 && currentCount === 0) {
        return {
            trendType: "neutral",
            text: "0%"
        };
    }

    const percentage = Math.round(
        ((currentCount - previousCount) / previousCount) * 100
    );

    if (percentage > 0) {
        return {
            trendType: "up",
            text: `+${percentage}%`
        };
    }

    if (percentage < 0) {
        return {
            trendType: "down",
            text: `${percentage}%`
        };
    }

    return {
        trendType: "neutral",
        text: "0%"
    };
}


// =====================================================
// NETWORK ERROR FALLBACK
// =====================================================

function renderPurchaseNetworkError(cardElement) {
    renderCardContent(
        cardElement,
        "Total purchased in library",
        "Network error",
        "0%",
        "down",
        "fa-cart-shopping"
    );
}


// =====================================================
// CARD 4: PURCHASES FROM ALL MEMBERS
// =====================================================

async function updatePurchaseBooksCard() {
    const cardElement = document.querySelector(".card4");

    if (!cardElement) {
        console.error("The .card4 element was not found.");
        return;
    }

    try {
        // Read every member document
        const membersSnapshot = await getDocs(
            collection(db, "members")
        );

        /*
         * Read every member's purchased-books subcollection:
         *
         * members/{memberId}/purchased-books
         */
        const purchaseCounts = await Promise.all(
            membersSnapshot.docs.map(async (memberDocument) => {
                const memberId = memberDocument.id;

                /*
                 * Do not catch the error here.
                 * If one member's subcollection cannot be read,
                 * the outer catch displays Network error.
                 */
                const purchasedBooksSnapshot = await getDocs(
                    collection(
                        db,
                        "members",
                        memberId,
                        "purchased-books"
                    )
                );

                return purchasedBooksSnapshot.size;
            })
        );

        // Count every purchase from every member
        const totalPurchasedBooks = purchaseCounts.reduce(
            (total, memberPurchaseCount) => {
                return total + memberPurchaseCount;
            },
            0
        );

        const purchaseTrend = getPurchasePercentage(
            totalPurchasedBooks
        );

        renderCardContent(
            cardElement,
            "Total purchased in library",
            totalPurchasedBooks,
            purchaseTrend.text,
            purchaseTrend.trendType,
            "fa-cart-shopping"
        );

        console.log("Total members:", membersSnapshot.size);
        console.log(
            "Total purchased books:",
            totalPurchasedBooks
        );
        console.log(
            "Purchase percentage:",
            purchaseTrend.text
        );
    } catch (error) {
        console.error(
            "Could not load purchased books from all members:",
            error
        );

        renderPurchaseNetworkError(cardElement);
    }
}


// =====================================================
// INITIALIZE CARD 4
// =====================================================

function initializeCard4() {
    const cardElement = document.querySelector(".card4");

    if (!cardElement) {
        console.error("Missing .card4 element.");
        return;
    }

    /*
     * Show fallback immediately while Firestore loads.
     */
    renderPurchaseNetworkError(cardElement);

    /*
     * Replace fallback with live Firestore data.
     */
    updatePurchaseBooksCard();
}


if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeCard4,
        { once: true }
    );
} else {
    initializeCard4();
}