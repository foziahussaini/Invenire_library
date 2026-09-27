import { defaultFemaleProfile, defaultMaleProfile } from "../../../src/assets.js";
import { db } from "../../../src/firebase-config.js";
// FIXED: Added missing getDocs and collection imports from Firestore
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const profileImg = document.querySelector(".profile");
// FIXED: Declared and hooked the container correctly based on your HTML structure
const profileContainer = document.querySelector(".profile-container"); 

function normalizeGender(value) {
    if (!value) return null;
    const g = String(value).trim().toLowerCase();
    if (["male", "m", "man", "boy"].includes(g)) return "male";
    if (["female", "f", "woman", "girl"].includes(g)) return "female";
    return null;
}

function getDefaultProfileByGender(gender) {
    return gender === "male" ? defaultMaleProfile : defaultFemaleProfile;
}

async function loadUserProfileFromFirestore(userId) {
    if (!profileImg) return;

    const img = profileImg.querySelector("img");
    if (!img) return;

    // 1) first check localStorage gender as priority
    const localGender = normalizeGender(localStorage.getItem("userGender"));
    if (localGender) {
        img.src = getDefaultProfileByGender(localGender);
    }

    if (!userId) return;

    try {
        const userDocRef = doc(db, "membres", userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            return;
        }

        const data = userDoc.data();

        // 2) if Firestore profile exists, use it
        if (data.profile_img) {
            img.src = data.profile_img;
            return;
        }

        // 3) else use gender from Firestore
        const firestoreGender = normalizeGender(data.gender || data.sex);
        if (firestoreGender) {
            img.src = getDefaultProfileByGender(firestoreGender);
            return;
        }

        // 4) else fallback to localStorage/default female
        img.src = getDefaultProfileByGender(localGender || "female");

    } catch (error) {
        console.error("Failed to load profile image:", error);
        const fallbackGender = normalizeGender(localStorage.getItem("userGender")) || "female";
        img.src = getDefaultProfileByGender(fallbackGender);
    }
}

// Example usage:
const loggedUserId = localStorage.getItem("user_id") || "member12"; 
loadUserProfileFromFirestore(loggedUserId);

// ================================== PROFILE DROPDOWN MENU ==================================
// FIXED: Verified profileContainer initialization before binding event
if (profileContainer) {
    profileContainer.addEventListener("click", async () => {
        // Close it if it's already open
        const existingMenu = document.querySelector(".profile-dropDown");
        if (existingMenu) {
            existingMenu.remove();
            return; 
        }

        // Create dropdown container
        const dropdown = document.createElement("div");
        dropdown.className = "profile-dropDown";

        // Close button setup using Font Awesome
        const closeBtn = document.createElement("span");
        closeBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
        closeBtn.className = "close-btn";
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            dropdown.remove();
        });
        dropdown.appendChild(closeBtn);

        // Append to body layout drawer
        document.body.appendChild(dropdown);

        try {
            // OPTIMIZATION: Fetch only the specific logged-in user instead of all collection items
            const userDocRef = doc(db, "membres", loggedUserId);
            const userDoc = await getDoc(userDocRef);
             
            if (!userDoc.exists()) {
                defaultUser(dropdown);
                return;
            }

            const userData = userDoc.data();
            createUserCard(userData, userDoc.id, dropdown);

            if (userData.profile_img && profileImg.querySelector("img")) {
                profileImg.querySelector("img").src = userData.profile_img; 
            }

        } catch (error) {
            console.error("Firestore failed", error);
            defaultUser(dropdown);
        }
    });
}

// Helper function to render DOM cards
function createUserCard(userData, docId, container) {
    const userCard = document.createElement("div");
    userCard.className = "dropdown-user-card";

    // User Avatar inside the card
    const userProfile = document.createElement("img");
    userProfile.src = userData.profile_img || defaultFemaleProfile;
    userProfile.className = "user-card-thumb";
    userProfile.alt = "avatar";
    userCard.appendChild(userProfile);

    // user name
    const userName = document.createElement("h4");
    userName.textContent = userData.full_name || "Guest";
    userName.className = "user-name";

    const email = document.createElement("p");
    email.textContent = userData.email || "example@gmail.com";
    email.className = "user-email";

    const memberID = document.createElement("span");
    memberID.textContent = userData.user_id || docId;
    memberID.className = "user-id";

    const settingsBtn = document.createElement("button");
    settingsBtn.textContent = "Settings";
    settingsBtn.className = "settings-btn";
    settingsBtn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        window.location.href = "../../../pages/admin_subPages/settings.html";
    });

    userCard.appendChild(userName);
    userCard.appendChild(email);
    userCard.appendChild(memberID);
    userCard.appendChild(settingsBtn);
    container.appendChild(userCard);
}

// default profile fallback configurations
function defaultUser(container) {
    const fallbackData = { 
        full_name: "Library Header", 
        email: "Example@gmail.com", 
        user_id: "Invenire4561",
        profile_img: defaultFemaleProfile 
    };
    createUserCard(fallbackData, "default", container);
}
