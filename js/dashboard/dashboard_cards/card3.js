import { db } from "../../../src/firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const READ_MODE_COUNT_STORAGE_KEY =
    "previousReadModeBooksCount";


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
// PERCENTAGE CALCULATION
// =====================================================

function getReadModePercentage(currentCount) {
    const previousCount = localStorage.getItem(
        READ_MODE_COUNT_STORAGE_KEY
    );

    // Save current count for the next comparison
    localStorage.setItem(
        READ_MODE_COUNT_STORAGE_KEY,
        String(currentCount)
    );

    if (previousCount === null) {
        return {
            trendType: currentCount > 0 ? "up" : "neutral",
            text: currentCount > 0
                ? "+0% active readers"
                : "0% active readers"
        };
    }

    const oldCount = Number(previousCount);

    if (!Number.isFinite(oldCount)) {
        return {
            trendType: "neutral",
            text: "0% active readers"
        };
    }

    if (oldCount === 0 && currentCount > 0) {
        return {
            trendType: "up",
            text: "+100% active readers"
        };
    }

    if (oldCount === 0 && currentCount === 0) {
        return {
            trendType: "neutral",
            text: "0% active readers"
        };
    }

    const percentage = Math.round(
        ((currentCount - oldCount) / oldCount) * 100
    );

    if (percentage > 0) {
        return {
            trendType: "up",
            text: `+${percentage}% active readers`
        };
    }

    if (percentage < 0) {
        return {
            trendType: "down",
            text: `${percentage}% active readers`
        };
    }

    return {
        trendType: "neutral",
        text: "0% active readers"
    };
}


// =====================================================
// FALLBACK: NETWORK ERROR
// =====================================================

function renderReadModeNetworkError(cardElement) {
    renderCardContent(
        cardElement,
        "Books on Read Mode",
        "Network error",
        "0% active readers",
        "neutral",
        "fa-book-reader"
    );
}


// =====================================================
// CARD 3: READ MODE BOOKS FROM ALL MEMBERS
// =====================================================

async function updateReadModeCard() {
    const cardElement = document.querySelector(".card3");

    if (!cardElement) {
        console.error("The .card3 element was not found.");
        return;
    }

    try {
        const membersSnapshot = await getDocs(
            collection(db, "members")
        );

        const readModeCounts = await Promise.all(
            membersSnapshot.docs.map(async (memberDocument) => {
                const memberId = memberDocument.id;

                try {
                    const readModeSnapshot = await getDocs(
                        collection(
                            db,
                            "members",
                            memberId,
                            "onReadMode"
                        )
                    );

                    return readModeSnapshot.size;
                } catch (memberError) {
                    console.warn(
                        `Could not read onReadMode for member ${memberId}:`,
                        memberError
                    );

                    return 0;
                }
            })
        );

        const totalReadModeBooks = readModeCounts.reduce(
            (total, count) => total + count,
            0
        );

        // No active readers
        if (totalReadModeBooks === 0) {
            renderCardContent(
                cardElement,
                "Books on Read Mode",
                0,
                "0% active readers",
                "neutral",
                "fa-book-reader"
            );

            return;
        }

        const trend = getReadModePercentage(totalReadModeBooks);

        renderCardContent(
            cardElement,
            "Books on Read Mode",
            totalReadModeBooks,
            trend.text,
            trend.trendType,
            "fa-book-reader"
        );

        console.log(
            "Total books on read mode:",
            totalReadModeBooks
        );
    } catch (error) {
        console.error(
            "Could not load read-mode books from all members:",
            error
        );

        renderReadModeNetworkError(cardElement);
    }
}


// =====================================================
// INITIALIZE CARD 3
// =====================================================

function initializeCard3() {
    const cardElement = document.querySelector(".card3");

    if (!cardElement) {
        console.error("Missing .card3 element.");
        return;
    }

    // Show fallback immediately
    renderReadModeNetworkError(cardElement);

    // Replace with live data
    updateReadModeCard();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeCard3,
        { once: true }
    );
} else {
    initializeCard3();
}