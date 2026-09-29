import { defaultFemaleProfile, defaultMaleProfile } from "../../../src/assets.js";
import { db } from "../../../src/firebase-config.js";
import { 
    collection, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// --- DOM Target Elements ---
const profileImg = document.querySelector(".profile");
const profileContainer = document.querySelector(".profile-container"); 

// Helper to determine the session ID fallback
const loggedUserId = localStorage.getItem("user_id") || "member12"; 

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

// Helper to fetch user data using the custom field attribute identifier
async function fetchUserDataByFieldId(customId) {
    try {
        // Target collection fixed to matching name: "members"
        const membersRef = collection(db, "members"); 
        const userQuery = query(membersRef, where("user_id", "==", customId));
        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
            // Return data from the first document match found
            return querySnapshot.docs[0].data();
        }
    } catch (error) {
        console.error("Firestore database lookup failure:", error);
    }
    return null;
}

// === 1. TOP HEADER INITIALIZER RUNNER ===
async function loadUserProfileFromFirestore(userId) {
    if (!profileImg) return;

    const img = profileImg.querySelector("img");
    if (!img) return;

    // 1) First check local storage for instant layout rendering
    const localGender = normalizeGender(localStorage.getItem("userGender"));
    if (localGender) {
        img.src = getDefaultProfileByGender(localGender);
    }

    if (!userId) return;

    const data = await fetchUserDataByFieldId(userId);

    if (data) {
        // 2) If Firestore profile network url exists, apply it (Key corrected to match "profile-Img")
        if (data["profile-Img"]) {
            img.src = data["profile-Img"];
            return;
        }

        // 3) Else structural fallback to database gender property values
        const firestoreGender = normalizeGender(data.gender || data.sex);
        if (firestoreGender) {
            img.src = getDefaultProfileByGender(firestoreGender);
            return;
        }
    }

    // 4) Complete fallback security rule logic
    img.src = getDefaultProfileByGender(localGender || "female");
}

// Run initializer immediately upon dashboard loading
loadUserProfileFromFirestore(loggedUserId);


// === 2. PROFILE INTERACTIVE DROPDOWN MENU ===
if (profileContainer) {
    profileContainer.addEventListener("click", async () => {
        // Toggle view window state out if clicked while open
        const existingMenu = document.querySelector(".profile-dropDown");
        if (existingMenu) {
            existingMenu.remove();
            return; 
        }

        // Create modal drawer structural block elements
        const dropdown = document.createElement("div");
        dropdown.className = "profile-dropDown";

        // Navigation dismiss close node builder
        const closeBtn = document.createElement("span");
        closeBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
        closeBtn.className = "close-btn";
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            dropdown.remove();
        });
        dropdown.appendChild(closeBtn);
        document.body.appendChild(dropdown);

        // Populate card content properties
        const userData = await fetchUserDataByFieldId(loggedUserId);

        if (userData) {
            createUserCard(userData, dropdown);

            // Dynamically refresh the page header thumb image state synchronicity
            if (userData["profile-Img"] && profileImg.querySelector("img")) {
                profileImg.querySelector("img").src = userData["profile-Img"]; 
            }
        } else {
            defaultUser(dropdown);
        }
    });
}

// === 3. DROPDOWN COMPONENT LAYOUT RENDERING ENGINE ===
function createUserCard(userData, container) {
    const userCard = document.createElement("div");
    userCard.className = "dropdown-user-card";

    // profile thumbnail key mapped dynamically to: "profile-Img"
    const userProfile = document.createElement("img");
    userProfile.src = userData["profile-Img"] || defaultFemaleProfile;
    userProfile.className = "user-card-thumb";
    userProfile.alt = "avatar";
    userCard.appendChild(userProfile);

    const userName = document.createElement("h4");
    userName.textContent = userData.full_name || "Guest";
    userName.className = "user-name";

    const email = document.createElement("p");
    email.textContent = userData.email || "example@gmail.com";
    email.className = "user-email";

    const memberID = document.createElement("span");
    memberID.textContent = userData.user_id || "Unregistered ID";
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

function defaultUser(container) {
    const fallbackData = { 
        full_name: "Library Member", 
        email: "example@gmail.com", 
        user_id: "Invenire4561",
        "profile-Img": defaultFemaleProfile 
    };
    createUserCard(fallbackData, container);
}
