import { db } from "../../../src/firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// =====================================================
// FALLBACK BOOK ARRAY
// =====================================================

const fallbackBooks = [
    { id: "defaultBook-1", name: "The Alchemist", author: "Paulo Coelho" },
    { id: "defaultBook-2", name: "The Great Gatsby", author: "F. Scott Fitzgerald" },
    { id: "defaultBook-3", name: "1984", author: "George Orwell" },
    { id: "defaultBook-4", name: "To Kill a Mockingbird", author: "Harper Lee" },
    { id: "defaultBook-5", name: "The Catcher in the Rye", author: "J.D. Salinger" },
    { id: "defaultBook-6", name: "The Hobbit", author: "J.R.R. Tolkien" },
    { id: "defaultBook-7", name: "Fahrenheit 451", author: "Ray Bradbury" }
];

const BOOK_COUNT_HISTORY_KEY = "bookCountHistory";
const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;


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
// FALLBACK CARD
// =====================================================

function renderFallbackCard(cardElement) {
    const fallbackCount = fallbackBooks.length;

    renderCardContent(
        cardElement,
        "Total books in library",
        fallbackCount,
        "+0.6%",
        "up",
        "fa-book-bookmark"
    );
}


// =====================================================
// HISTORY FUNCTIONS
// =====================================================

function getBookCountHistory() {
    try {
        const savedHistory = localStorage.getItem(
            BOOK_COUNT_HISTORY_KEY
        );

        if (!savedHistory) {
            return [];
        }

        const parsedHistory = JSON.parse(savedHistory);

        if (!Array.isArray(parsedHistory)) {
            return [];
        }

        return parsedHistory.filter(record => {
            return (
                record &&
                typeof record === "object" &&
                Number.isFinite(Number(record.count)) &&
                Number.isFinite(Number(record.timestamp)) &&
                typeof record.date === "string"
            );
        });
    } catch (error) {
        console.error("Invalid book history. Clearing it:", error);

        localStorage.removeItem(BOOK_COUNT_HISTORY_KEY);

        return [];
    }
}


function saveBookCount(currentCount) {
    const history = getBookCountHistory();

    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    const todayRecord = history.find(
        record => record.date === today
    );

    if (todayRecord) {
        todayRecord.count = currentCount;
        todayRecord.timestamp = now;
    } else {
        history.push({
            date: today,
            count: currentCount,
            timestamp: now
        });
    }

    const limitedHistory = history
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-30);

    localStorage.setItem(
        BOOK_COUNT_HISTORY_KEY,
        JSON.stringify(limitedHistory)
    );
}


function getCountFromThreeDaysAgo() {
    const history = getBookCountHistory();

    if (history.length === 0) {
        return null;
    }

    const targetTime = Date.now() - THREE_DAYS_IN_MS;

    let closestRecord = null;
    let smallestDifference = Infinity;

    for (const record of history) {
        const recordTime = Number(record.timestamp);

        if (!Number.isFinite(recordTime)) {
            continue;
        }

        const difference = Math.abs(recordTime - targetTime);

        if (difference < smallestDifference) {
            smallestDifference = difference;
            closestRecord = record;
        }
    }

    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

    if (
        closestRecord === null ||
        smallestDifference > oneDayInMilliseconds
    ) {
        return null;
    }

    return closestRecord;
}


// =====================================================
// CALCULATE TREND PERCENTAGE
// =====================================================

function getBookCountTrend(currentCount) {
    const oldRecord = getCountFromThreeDaysAgo();

    // Save today's value so it can be compared later
    saveBookCount(currentCount);

    // No valid count from around 3 days ago yet
    if (
        oldRecord === null ||
        !Number.isFinite(Number(oldRecord.count))
    ) {
        return {
            type: currentCount > 0 ? "up" : "neutral",
            text: currentCount > 0 ? "+0%" : "0%"
        };
    }

    const oldCount = Number(oldRecord.count);

    if (oldCount === 0 && currentCount > 0) {
        return {
            type: "up",
            text: "+100%"
        };
    }

    if (oldCount === 0 && currentCount === 0) {
        return {
            type: "neutral",
            text: "0%"
        };
    }

    const percentage = Math.round(
        ((currentCount - oldCount) / oldCount) * 100
    );

    if (percentage > 0) {
        return {
            type: "up",
            text: `+${percentage}%`
        };
    }

    if (percentage < 0) {
        return {
            type: "down",
            text: `${percentage}%`
        };
    }

    return {
        type: "neutral",
        text: "0%"
    };
}


// =====================================================
// FIRESTORE REQUEST WITH TIMEOUT
// =====================================================

function getBooksWithTimeout(timeoutMilliseconds = 8000) {
    const booksRequest = getDocs(
        collection(db, "book-list")
    );

    const timeoutRequest = new Promise((_, reject) => {
        setTimeout(() => {
            reject(
                new Error(
                    "Firestore request timed out. Showing fallback data."
                )
            );
        }, timeoutMilliseconds);
    });

    return Promise.race([
        booksRequest,
        timeoutRequest
    ]);
}


// =====================================================
// LOAD TOTAL BOOKS FROM FIRESTORE
// =====================================================

async function updateTotalBooksCard() {
    const cardElement = document.querySelector(".card1");

    if (!cardElement) {
        console.error("The .card1 element was not found.");
        return;
    }

    try {
        const booksSnapshot = await getBooksWithTimeout(8000);

        const currentCount = booksSnapshot.size;
        const trend = getBookCountTrend(currentCount);

        renderCardContent(
            cardElement,
            "Total books in library",
            currentCount,
            trend.text,
            trend.type,
            "fa-book-bookmark"
        );

        console.log("Firestore books:", currentCount);
    } catch (error) {
        console.error(
            "Firestore unavailable. Showing fallback:",
            error
        );

        renderFallbackCard(cardElement);
    }
}


// =====================================================
// INITIALIZE DASHBOARD
// =====================================================

function initializeBookCard() {
    const cardElement = document.querySelector(".card1");

    if (!cardElement) {
        console.error(
            'Missing ".card1" element.'
        );
        return;
    }

    // Show fallback immediately, before contacting Firestore
    renderFallbackCard(cardElement);

    // Replace fallback with live Firestore data
    updateTotalBooksCard();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeBookCard,
        { once: true }
    );
} else {
    initializeBookCard();
}