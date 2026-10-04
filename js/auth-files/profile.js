import { defaultFemaleProfile, defaultMaleProfile } from "../../src/assets.js";
import { db, auth } from "../../src/firebase-config.js";
import { 
    collection, 
    query, 
    where, 
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const profileImg = document.querySelector(".profile") || document.querySelector(".member-header .profile");
const profileContainer = document.querySelector(".profile-container") || document.querySelector(".member-header .profile-container");

// Read the unified session schema generated at login state lifecycle
const userSession = JSON.parse(localStorage.getItem("userSession")) || null;
const loggedUserEmail = userSession ? userSession.email : "";
const loggedUserRole = userSession ? userSession.role : "member"; 
const loggedDocId = userSession ? userSession.uid : ""; 

// =======================================================================================
// FIX 1: DYNAMIC PATH AND SCROLL RESOLVER BASED ON VISITED PAGE AREA (FIXED DUPLICATION)
// =======================================================================================
const currentPathName = window.location.pathname.toLowerCase();
const isSubPage = window.location.pathname.includes("admin_subPages");
const isAtAdminPanel = currentPathName.includes("admin_dashboard") || currentPathName.includes("admin_subpages");

let settingsRedirectPath = "javascript:void(0);";

if (isAtAdminPanel) {
    // If inside an admin subfolder, redirect relatively. Otherwise, push down to the subfolder path
    settingsRedirectPath = isSubPage ? "./settings.html" : "../../../pages/admin_subPages/settings.html";
} else if (currentPathName.includes("user_dashboard")) {
    // If the user is on user_dashboard.html, we target the local ID container anchor string
    settingsRedirectPath = "#Settings";
}

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
        if (loggedUserRole === "admin") {
            const adminDocRef = doc(db, "config", loggedDocId);
            const adminSnap = await getDoc(adminDocRef);
            if (adminSnap.exists()) return adminSnap.data();
            
            const configRef = collection(db, "config");
            const adminQuery = query(configRef, where("admin_email", "==", loggedUserEmail));
            const querySnapshot = await getDocs(adminQuery);
            if (!querySnapshot.empty) return querySnapshot.docs[0].data();
        } else {
            const membersRef = collection(db, "members");
            const memberQuery = query(membersRef, where("email", "==", loggedUserEmail));
            const querySnapshot = await getDocs(memberQuery);
            if (!querySnapshot.empty) return querySnapshot.docs[0].data();
        }
    } catch (error) {
        console.log("Firestore database profile lookup failure:", error);
    }
    return null;
}

// === INITIALIZER DISPLAY ENGINE RUNNER ===
async function loadUserProfileFromFirestore() {
    if (!profileImg) return;

    const img = profileImg.querySelector("img");
    if (!img) return;

    const localGender = normalizeGender(localStorage.getItem("userGender"));
    if (localGender) {
        img.src = getDefaultProfileByGender(localGender);
    }

    const data = await fetchCurrentUserData();

    if (data) {
        if (data["profile-Img"]) {
            img.src = data["profile-Img"];
            return;
        }

        const firestoreGender = normalizeGender(data.gender || data.sex || data.admin_gender);
        if (firestoreGender) {
            img.src = getDefaultProfileByGender(firestoreGender);
            return;
        }
    }

    img.src = getDefaultProfileByGender(localGender || "female");
}

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

        // Append to the header wrapper area to inherit CSS positioning rules cleanly
        const headerParentWrapper = document.querySelector(".admin-header") || document.querySelector(".member-header");
        if (headerParentWrapper) {
            headerParentWrapper.appendChild(dropdown);
        } else {
            document.body.appendChild(dropdown); 
        }

        // Fetch properties data based on current active profile type
        const userData = await fetchCurrentUserData();

        if (userData) {
            createUserCard(userData, dropdown);

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
    email.textContent = userData.admin_email || userData.email || "example@gmail.com";
    email.className = "user-email";

    const memberID = document.createElement("span");
    memberID.textContent = userData.user_id || loggedDocId || "Invenire System Account";
    memberID.className = "user-id";

    // === FIXED: CONDITIONAL CLICK ROUTER SWITCHES SMOOTH SCROLLING VS REDIRECTS ===
    const settingsBtn = document.createElement("button");
    settingsBtn.textContent = "Settings";
    settingsBtn.className = "settings-btn";
    settingsBtn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        
        if (settingsRedirectPath === "#Settings") {
            const settingsSection = document.getElementById("Settings");
            if (settingsSection) {
                // 1. Instantly remove the flyout menu container drawer
                container.remove();
                
                // 2. Smoothly scroll the screen right down to the settings container box anchor
                settingsSection.scrollIntoView({ behavior: "smooth", block: "start" });
                
                // 3. Keep tab engine configurations synchronized by clicking the personal anchor link node
                document.querySelector('.head-title ul li a[data-target="personal"]')?.click();
            } else {
                console.warn("⚠️ Targeted section wrapper element matching ID '#Settings' was not located in the DOM.");
            }
        } else {
            // Traditional location href rewrite redirect for admin views
            window.location.href = settingsRedirectPath;
        }
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
