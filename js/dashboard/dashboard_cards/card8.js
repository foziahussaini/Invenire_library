import { db } from "../../../src/firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// =====================================================
// CONFIGURATION
// =====================================================

const MEMBER_ACTION_COLLECTIONS = [
    "my-library",
    "download-book",
    "onReadMode",
    "purchased-books"
];

const MAX_ACTIVE_MEMBERS = 5;


// =====================================================
// FALLBACK DATA
// Used when Firestore or the network fails
// =====================================================

const activeMembersDefault = [
    {
        name: "John Doe",
        count: 28,
        location: "Afghanistan"
    },
    {
        name: "Sarah Connor",
        count: 24,
        location: "Norway"
    },
    {
        name: "Alex Mercer",
        count: 19,
        location: "Herat"
    },
    {
        name: "Rahat Chowdhury",
        count: 15,
        location: "Kabul"
    },
    {
        name: "Emily Watson",
        count: 12,
        location: "Iran"
    }
];


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// GET MEMBER NAME
// =====================================================

function getMemberName(memberData, memberId) {
    return (
        memberData.full_name ||
        memberData.fullName ||
        memberData.name ||
        memberData.username ||
        memberData.email ||
        memberId ||
        "Unknown member"
    );
}


// =====================================================
// GET MEMBER LOCATION
// =====================================================

function getMemberLocation(memberData) {
    return (
        memberData.location ||
        memberData.country ||
        "Unknown location"
    );
}


// =====================================================
// RENDER ACTIVE MEMBERS CARD
// =====================================================

function renderActiveMembersCard(members) {
    const activeMembersContainer =
        document.querySelector(".card8");

    if (!activeMembersContainer) {
        console.error("The .card8 element was not found.");
        return;
    }

    const sortedMembers = [...members]
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_ACTIVE_MEMBERS);

    activeMembersContainer.innerHTML = `
        <div class="member-card-header">
            <div>
                <h3 class="member-title">
                    Most Active Members
                </h3>

                <p class="member-sub-title">
                    Top members by library activity
                </p>
            </div>

            <div class="active-badge">
                Active
            </div>
        </div>

        <div class="member-list-container"></div>
    `;

    const listContainer =
        activeMembersContainer.querySelector(
            ".member-list-container"
        );

    if (!listContainer) {
        return;
    }

    if (sortedMembers.length === 0) {
        listContainer.innerHTML = `
            <p class="no-active-members">
                No member activity found yet.
            </p>
        `;

        return;
    }

    const peakValue = Math.max(
        ...sortedMembers.map(member => Number(member.count) || 0),
        1
    );

    sortedMembers.forEach(member => {
        const safeName = escapeHTML(member.name);
        const safeLocation = escapeHTML(member.location);
        const count = Number(member.count) || 0;

        const fillPercentage = Math.min(
            100,
            Math.max(0, (count / peakValue) * 100)
        );

        listContainer.insertAdjacentHTML(
            "beforeend",
            `
                <div class="member-row-item">
                    <div class="member-icon">
                        <span class="i">👤</span>
                    </div>

                    <div class="member-details">
                        <span
                            class="member-name"
                            title="${safeName}"
                        >
                            ${safeName}
                        </span>

                        <span class="location">
                            ${safeLocation}
                        </span>
                    </div>

                    <div class="progress-details">
                        <div class="progress-bar">
                            <div
                                class="progress-line"
                                style="width: ${fillPercentage}%"
                            ></div>
                        </div>

                        <div class="login-details">
                            ${count}
                            ${count === 1 ? "action" : "actions"}
                            logged
                        </div>
                    </div>
                </div>
            `
        );
    });
}


// =====================================================
// COUNT ONE MEMBER'S ACTIONS
// =====================================================

async function countMemberActions(memberId) {
    const actionCounts = await Promise.all(
        MEMBER_ACTION_COLLECTIONS.map(
            async collectionName => {
                try {
                    const actionSnapshot = await getDocs(
                        collection(
                            db,
                            "members",
                            memberId,
                            collectionName
                        )
                    );

                    return actionSnapshot.size;
                } catch (error) {
                    /*
                     * If a particular subcollection does not exist,
                     * count it as zero instead of failing the whole card.
                     */
                    console.warn(
                        `Could not read ${collectionName} for member ${memberId}:`,
                        error
                    );

                    return 0;
                }
            }
        )
    );

    return actionCounts.reduce(
        (total, count) => total + count,
        0
    );
}


// =====================================================
// LOAD ACTIVE MEMBERS FROM FIRESTORE
// =====================================================

async function loadActiveMembers() {
    const membersSnapshot = await getDocs(
        collection(db, "members")
    );

    const activeMembers = await Promise.all(
        membersSnapshot.docs.map(async memberDocument => {
            const memberId = memberDocument.id;
            const memberData = memberDocument.data();

            const actionCount =
                await countMemberActions(memberId);

            return {
                name: getMemberName(memberData, memberId),
                location: getMemberLocation(memberData),
                count: actionCount
            };
        })
    );

    return activeMembers
        .filter(member => member.count > 0)
        .sort((a, b) => b.count - a.count);
}


// =====================================================
// INITIALIZE CARD 8
// =====================================================

async function initializeActiveMembersCard() {
    const cardElement = document.querySelector(".card8");

    if (!cardElement) {
        console.error("The .card8 element was not found.");
        return;
    }

    /*
     * Show fallback immediately while Firestore loads.
     */
    renderActiveMembersCard(activeMembersDefault);

    try {
        const liveActiveMembers =
            await loadActiveMembers();

        /*
         * Firestore worked but there are no actions yet.
         */
        if (liveActiveMembers.length === 0) {
            renderActiveMembersCard([]);
            return;
        }

        renderActiveMembersCard(liveActiveMembers);

        console.log(
            "Live active members:",
            liveActiveMembers
        );
    } catch (error) {
        console.error(
            "Could not load active members from Firestore:",
            error
        );

        /*
         * Keep the fallback visible if Firestore fails.
         */
        renderActiveMembersCard(activeMembersDefault);
    }
}


// =====================================================
// START CARD 8
// =====================================================

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeActiveMembersCard,
        { once: true }
    );
} else {
    initializeActiveMembersCard();
}