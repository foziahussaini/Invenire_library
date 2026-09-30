import { defaultFemaleProfile, defaultMaleProfile } from "../../../src/assets.js";
import { db } from "../../../src/firebase-config.js";
import { 
    collection, 
    query, 
    where, 
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// --- DOM Target Elements ---
const profileImg = document.querySelector(".profile");
const profileContainer = document.querySelector(".profile-container"); 

// Read the unified session schema generated at login state lifecycle
const userSession = JSON.parse(localStorage.getItem("userSession")) || null;
const loggedUserEmail = userSession ? userSession.email : "";
const loggedUserRole = userSession ? userSession.role : "member"; // Default fallback to member
const loggedDocId = userSession ? userSession.uid : ""; // Stores admin document name 'adminheader123' or member keys

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

// === UNIFIED DYNAMIC PROFILE FETCH ENGINE ===
async function fetchCurrentUserData() {
    if (!userSession || !loggedUserEmail) return null;

    try {
        // 1. If user is an Admin, fetch directly using Document ID
        if (loggedUserRole === "admin") {
            const adminDocRef = doc(db, "config", loggedDocId);
            const adminSnap = await getDoc(adminDocRef);
            if (adminSnap.exists()) {
                return adminSnap.data();
            }
            
            // Fallback: Query by field email if document structure varies
            const configRef = collection(db, "config");
            const adminQuery = query(configRef, where("admin_email", "==", loggedUserEmail));
            const querySnapshot = await getDocs(adminQuery);
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data();
            }
        } 
        // 2. If user is a Member, fetch using field criteria matches
        else {
            const membersRef = collection(db, "members");
            const memberQuery = query(membersRef, where("email", "==", loggedUserEmail));
            const querySnapshot = await getDocs(memberQuery);
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data();
            }
        }
    } catch (error) {
        console.error("Firestore database profile lookup failure:", error);
    }
    return null;
}

// === INITIALIZER DISPLAY ENGINE RUNNER ===
async function loadUserProfileFromFirestore() {
    if (!profileImg) return;

    const img = profileImg.querySelector("img");
    if (!img) return;

    // First check local storage cache parameters for instant visual layout rendering
    const localGender = normalizeGender(localStorage.getItem("userGender"));
    if (localGender) {
        img.src = getDefaultProfileByGender(localGender);
    }

    const data = await fetchCurrentUserData();

    if (data) {
        // Apply Firestore profile network image if it exists
        if (data["profile-Img"]) {
            img.src = data["profile-Img"];
            return;
        }

        // Structural fallback to database gender values if image field is blank
        const firestoreGender = normalizeGender(data.gender || data.sex || data.admin_gender);
        if (firestoreGender) {
            img.src = getDefaultProfileByGender(firestoreGender);
            return;
        }
    }

    // Ultimate fallback security choice
    img.src = getDefaultProfileByGender(localGender || "female");
}

// Run immediately upon window page loading sequence
loadUserProfileFromFirestore();


// === PROFILE INTERACTIVE DROPDOWN MODAL DRAWER ===
if (profileContainer) {
    profileContainer.addEventListener("click", async () => {
        // Toggle view container box out if clicked again while open
        const existingMenu = document.querySelector(".profile-dropDown");
        if (existingMenu) {
            existingMenu.remove();
            return; 
        }

        const dropdown = document.createElement("div");
        dropdown.className = "profile-dropDown";

        // Navigation dismiss close node builder button
        const closeBtn = document.createElement("span");
        closeBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
        closeBtn.className = "close-btn";
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            dropdown.remove();
        });
        dropdown.appendChild(closeBtn);
        document.body.appendChild(dropdown);

        // Fetch properties data based on current active profile type
        const userData = await fetchCurrentUserData();

        if (userData) {
            createUserCard(userData, dropdown);

            // Synchronize the header thumbnail immediately
            if (userData["profile-Img"] && profileImg.querySelector("img")) {
                profileImg.querySelector("img").src = userData["profile-Img"]; 
            }
        } else {
            defaultUser(dropdown);
        }
    });
}

// === DROPDOWN CARD LAYOUT COMPONENTS RENDERING SYSTEM ===
function createUserCard(userData, container) {
    const userCard = document.createElement("div");
    userCard.className = "dropdown-user-card";

    const userProfile = document.createElement("img");
    userProfile.src = userData["profile-Img"] || defaultFemaleProfile;
    userProfile.className = "user-card-thumb";
    userProfile.alt = "avatar";
    userCard.appendChild(userProfile);

    const userName = document.createElement("h4");
    userName.textContent = userData.full_name || "Guest User";
    userName.className = "user-name";

    const email = document.createElement("p");
    // Standardizes mapping between admin_email and regular user email fields
    email.textContent = userData.admin_email || userData.email || "example@gmail.com";
    email.className = "user-email";

    const memberID = document.createElement("span");
    memberID.textContent = userData.user_id || loggedDocId || "Invenire System Account";
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
        full_name: "Library System Header", 
        email: "example@gmail.com", 
        "profile-Img": defaultFemaleProfile 
    };
    createUserCard(fallbackData, container);
}
