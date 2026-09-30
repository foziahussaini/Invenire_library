import { db } from "../../../src/firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const DOWNLOAD_COUNT_STORAGE_KEY = "previousDownloadedBooksCount";


// =====================================================
// GET REAL-TIME MONTH
// =====================================================

function getCurrentMonthText() {
    return new Intl.DateTimeFormat("en-US", {
        month: "short"
    }).format(new Date());
}


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

function getDownloadPercentage(currentCount) {
    const savedCount = localStorage.getItem(
        DOWNLOAD_COUNT_STORAGE_KEY
    );

    const currentMonth = getCurrentMonthText();

    // Save current count for the next comparison
    localStorage.setItem(
        DOWNLOAD_COUNT_STORAGE_KEY,
        String(currentCount)
    );

    if (savedCount === null) {
        return {
            percentage: 0,
            trendType: currentCount > 0 ? "up" : "neutral",
            text: currentCount > 0
                ? `+0% in ${currentMonth}`
                : `0% in ${currentMonth}`
        };
    }

    const previousCount = Number(savedCount);

    if (!Number.isFinite(previousCount)) {
        return {
            percentage: 0,
            trendType: "neutral",
            text: `0% in ${currentMonth}`
        };
    }

    if (previousCount === 0) {
        if (currentCount > 0) {
            return {
                percentage: 100,
                trendType: "up",
                text: `+100% in ${currentMonth}`
            };
        }

        return {
            percentage: 0,
            trendType: "neutral",
            text: `0% in ${currentMonth}`
        };
    }

    const percentage = Math.round(
        ((currentCount - previousCount) / previousCount) * 100
    );

    if (percentage > 0) {
        return {
            percentage,
            trendType: "up",
            text: `+${percentage}% in ${currentMonth}`
        };
    }

    if (percentage < 0) {
        return {
            percentage,
            trendType: "down",
            text: `${percentage}% in ${currentMonth}`
        };
    }

    return {
        percentage: 0,
        trendType: "neutral",
        text: `0% in ${currentMonth}`
    };
}


// =====================================================
// FALLBACK
// =====================================================

function renderDownloadedBooksFallback(cardElement) {
    const currentMonth = getCurrentMonthText();

    renderCardContent(
        cardElement,
        "Downloaded books",
        "check connection",
        `0% in ${currentMonth}`,
        "neutral",
        "fa-download"
    );
}


// =====================================================
// CARD 2: DOWNLOADS FROM ALL MEMBERS
// =====================================================

async function updateDownloadedBooksCard() {
    const cardElement = document.querySelector(".card2");

    if (!cardElement) {
        console.error("The .card2 element was not found.");
        return;
    }

    try {
        const membersSnapshot = await getDocs(
            collection(db, "members")
        );

        const downloadCounts = await Promise.all(
            membersSnapshot.docs.map(async (memberDocument) => {
                const memberId = memberDocument.id;

                try {
                    const downloadedBooksSnapshot = await getDocs(
                        collection(
                            db,
                            "members",
                            memberId,
                            "download-book"
                        )
                    );

                    return downloadedBooksSnapshot.size;
                } catch (memberError) {
                    console.warn(
                        `Could not read downloads for member ${memberId}:`,
                        memberError
                    );
                    return 0;
                }
            })
        );

        const totalDownloadedBooks = downloadCounts.reduce(
            (total, memberDownloadCount) => total + memberDownloadCount,
            0
        );

        if (totalDownloadedBooks === 0) {
            const currentMonth = getCurrentMonthText();

            renderCardContent(
                cardElement,
                "Downloaded books",
                0,
                `0% in ${currentMonth}`,
                "neutral",
                "fa-download"
            );

            return;
        }

        const downloadTrend = getDownloadPercentage(
            totalDownloadedBooks
        );

        renderCardContent(
            cardElement,
            "Downloaded books",
            totalDownloadedBooks,
            downloadTrend.text,
            downloadTrend.trendType,
            "fa-download"
        );

        console.log(
            "Total downloaded books from all members:",
            totalDownloadedBooks
        );
    } catch (error) {
        console.error(
            "Could not load downloaded books from all members:",
            error
        );

        renderDownloadedBooksFallback(cardElement);
    }
}


// =====================================================
// INITIALIZE CARD 2
// =====================================================

function initializeCard2() {
    const cardElement = document.querySelector(".card2");

    if (!cardElement) {
        console.error("Missing .card2 element.");
        return;
    }

    // Show fallback immediately
    renderDownloadedBooksFallback(cardElement);

    // Replace fallback with Firestore data
    updateDownloadedBooksCard();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeCard2,
        { once: true }
    );
} else {
    initializeCard2();
}