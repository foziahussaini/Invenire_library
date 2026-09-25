import { db } from "../../../src/firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


const REQUEST_TIMEOUT = 8000;

function getMembersWithTimeout(
    timeoutMilliseconds = REQUEST_TIMEOUT
) {
    const membersRequest = getDocs(
        collection(db, "members")
    );

    const timeoutRequest = new Promise((_, reject) => {
        setTimeout(() => {
            reject(
                new Error("Members request timed out.")
            );
        }, timeoutMilliseconds);
    });

    return Promise.race([
        membersRequest,
        timeoutRequest
    ]);
}


// =====================================================
// DATE HELPERS
// =====================================================

function getStartOfToday() {
    const now = new Date();

    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
    );
}


function getStartOfCurrentMonth() {
    const now = new Date();

    return new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0
    );
}


function convertToDate(value) {
    if (!value) {
        return null;
    }

    // Firestore Timestamp
    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {
        return value.toDate();
    }

    // Timestamp-like object
    if (
        typeof value === "object" &&
        Number.isFinite(value.seconds)
    ) {
        return new Date(value.seconds * 1000);
    }

    // JavaScript Date
    if (value instanceof Date) {
        return value;
    }

    // Milliseconds
    if (typeof value === "number") {
        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    // Date string
    if (typeof value === "string") {
        /*
         * Supports normal Firestore date strings such as:
         * "2026-09-24T00:00:00.000Z"
         */
        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
            return date;
        }

        /*
         * Supports the display-style value shown in your screenshot:
         * "24 September 2026 at 00:00:00 UTC"
         */
        const cleanedValue = value
            .replace(" at ", " ")
            .replace(" UTC", " GMT");

        const displayDate = new Date(cleanedValue);

        return Number.isNaN(displayDate.getTime())
            ? null
            : displayDate;
    }

    return null;
}


// =====================================================
// GET LAST LOGIN
// =====================================================

function getMemberLastLogin(memberData) {
    /*
     * Your Firestore field is exactly:
     *
     * "last-login"
     */
    return (
        memberData["last-login"] ||
        memberData.lastLogin ||
        memberData.lastLoginAt ||
        memberData.lastActiveAt ||
        null
    );
}


// =====================================================
// CHECK WHETHER DATE IS TODAY
// =====================================================

function isToday(date) {
    if (!date) {
        return false;
    }

    const startOfToday = getStartOfToday();
    const startOfTomorrow = new Date(startOfToday);

    startOfTomorrow.setDate(
        startOfTomorrow.getDate() + 1
    );

    return (
        date >= startOfToday &&
        date < startOfTomorrow
    );
}


// =====================================================
// CHECK WHETHER DATE IS THIS MONTH
// =====================================================

function isThisMonth(date) {
    if (!date) {
        return false;
    }

    return date >= getStartOfCurrentMonth();
}


// =====================================================
// UPDATE HEADLINE
// =====================================================

function setHeadlineMessage(message, status) {
    const headlineElement =
        document.querySelector(".headline");

    if (!headlineElement) {
        return;
    }

    headlineElement.textContent = message;
    headlineElement.dataset.status = status;
}


// =====================================================
// COUNT MEMBERS USING A DATE CHECK
// =====================================================

function countMembers(membersSnapshot, dateCheck) {
    return membersSnapshot.docs.filter(memberDocument => {
        const memberData = memberDocument.data();

        const lastLoginValue =
            getMemberLastLogin(memberData);

        const lastLoginDate =
            convertToDate(lastLoginValue);

        return dateCheck(lastLoginDate);
    }).length;
}


// =====================================================
// LOAD TODAY'S ACTIVE MEMBERS
// =====================================================

async function loadTodayActiveMembers() {
    setHeadlineMessage(
        "Loading active members...",
        "loading"
    );

    try {
        const membersSnapshot =
            await getMembersWithTimeout();

        const todayCount = countMembers(
            membersSnapshot,
            isToday
        );

        if (todayCount === 0) {
            setHeadlineMessage(
                "No active member found for today",
                "empty"
            );

            return;
        }

        const memberText =
            todayCount === 1
                ? "active member"
                : "active members";

        setHeadlineMessage(
            `${todayCount} ${memberText} today`,
            "success"
        );

        console.log(
            "Dynamic active members today:",
            todayCount
        );
    } catch (error) {
        console.error(
            "Could not count today's active members:",
            error
        );

        setHeadlineMessage(
            "Network error",
            "error"
        );
    }
}


// =====================================================
// LOAD THIS MONTH'S ACTIVE MEMBERS
// =====================================================

async function loadMonthlyActiveMembers() {
    setHeadlineMessage(
        "Checking this month's activity...",
        "loading"
    );

    try {
        const membersSnapshot =
            await getMembersWithTimeout();

        const monthCount = countMembers(
            membersSnapshot,
            isThisMonth
        );

        if (monthCount === 0) {
            setHeadlineMessage(
                "No active member found this month",
                "empty"
            );

            return;
        }

        const memberText =
            monthCount === 1
                ? "active member"
                : "active members";

        setHeadlineMessage(
            `${monthCount} ${memberText} this month`,
            "success"
        );

        console.log(
            "Dynamic active members this month:",
            monthCount
        );
    } catch (error) {
        console.error(
            "Could not count monthly active members:",
            error
        );

        setHeadlineMessage(
            "Network error",
            "error"
        );
    }
}


// =====================================================
// INITIALIZE
// =====================================================

function initializeActiveMembersHeadline() {
    const headlineElement =
        document.querySelector(".headline");

    const checkoutButton =
        document.querySelector(".checkout-btn");

    if (!headlineElement && !checkoutButton) {
        return;
    }

    /*
     * Before checkout is clicked:
     * show today's dynamic Firestore count.
     */
    if (headlineElement) {
        loadTodayActiveMembers();
    }

    /*
     * After checkout is clicked:
     * show this month's dynamic Firestore count.
     */
    if (checkoutButton) {
        checkoutButton.addEventListener(
            "click",
            loadMonthlyActiveMembers
        );
    }
}


// =====================================================
// START AFTER HTML LOADS
// =====================================================

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeActiveMembersHeadline,
        { once: true }
    );
} else {
    initializeActiveMembersHeadline();
}