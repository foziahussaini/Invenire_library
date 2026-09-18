import { defaultProfile } from "./assets.js";
import { db } from "./firebase-config.js"; 
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const profileImg = document.querySelector(".profile");
const profileContainer = document.querySelector(".profile-container");

/// ================================== DEFAULT PROFILE IMG =========================================
if (profileImg) {
    const prof = document.createElement("img");
    prof.src = defaultProfile;
    prof.alt = "profile";
    profileImg.appendChild(prof);
}

/// ================================== REPLACE IMG FROM FIRESTORE =========================================
async function loadProfileImage(userId) {
    if (!profileImg) return;
    const imgElement = profileImg.querySelector("img");

    try {
        const userDocRef = doc(db, "membres", userId); 
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().profile_img) {
            if (imgElement) imgElement.src = userDoc.data().profile_img;
        } else {
            if (imgElement) imgElement.src = defaultProfile;
        }
    } catch (error) {
        console.error("Error fetching profile image", error);
        if (imgElement) imgElement.src = defaultProfile;
    }
}


// ================================== PROFILE DROPDOWN MENU ==================================
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

    // dropdown drawer at the whole body like a sidebar
    document.body.appendChild(dropdown);

    try {
        // Fetching data from Firestore
        const querySnapshot = await getDocs(collection(db, "membres"));
         
        if (querySnapshot.empty) {
            defaultUser(dropdown);
            return;
        }

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            createUserCard(userData, doc.id, dropdown);

            // Optional: Update main profile navigation icon if user data matches current active session
            if (userData.profile_img && profileImg.querySelector("img")) {
                profileImg.querySelector("img").src = userData.profile_img; 
            }
        });

    } catch (error) {
        console.error("Firestore failed", error);
        defaultUser(dropdown);
    }
});

// Helper function 
function createUserCard(userData, docId, container) {
    const userCard = document.createElement("div");
    userCard.className = "dropdown-user-card";

    // User Avatar inside the card
    const userProfile = document.createElement("img");
    userProfile.src = userData.profile_img || defaultProfile;
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
        window.location.href = "../pages/admin_subPages/settings.html";
    });

    userCard.appendChild(userName);
    userCard.appendChild(email);
    userCard.appendChild(memberID);
    userCard.appendChild(settingsBtn);
    container.appendChild(userCard);
}

// default profile if database contains no documents
function defaultUser(container) {
    const fallbackData = { 
        full_name: "Library Header", 
        email: "Example@gmail.com", 
        user_id: "Invenire4561",
        profile_img: defaultProfile 
    };
    createUserCard(fallbackData, "default", container);
}
