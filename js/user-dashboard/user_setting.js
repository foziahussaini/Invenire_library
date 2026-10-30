import { db, auth } from "../../src/firebase-config.js";
import { doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { updateEmail, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "https://gstatic.com";

// Parse session attributes from local device storage cache
const sessionToken = localStorage.getItem("userSession");
const userSession = sessionToken ? JSON.parse(sessionToken) : null;

// DOM Form Selectors
const settingsForm = document.getElementById("settingsForm");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

const globalError = document.getElementById("settingsGlobalError");
const globalSuccess = document.getElementById("settingsGlobalSuccess");

// === 1. PRE-POPULATE FIELDS ON PAGE LOAD ===
function loadCurrentSettingsData() {
    if (!userSession) {
        window.location.href = "../auth/login.html"; // Safe exit route if session dropped
        return;
    }

    const localUserData = localStorage.getItem("invenireUser");
    if (localUserData) {
        const user = JSON.parse(localUserData);
        if (document.getElementById("settingsFullName")) document.getElementById("settingsFullName").value = user.full_name || "";
        if (document.getElementById("settingsEmail")) document.getElementById("settingsEmail").value = user.email || userSession.email || "";
        if (user["profile-Img"] && document.getElementById("settingsAvatarPreview")) {
            document.getElementById("settingsAvatarPreview").src = `../../assets/images/${user["profile-Img"]}`;
        }
    }
}

// === 2. UPDATE ENGINE DISPATCHER ===
if (settingsForm) {
    settingsForm.addEventListener("submit", async function (e) {
        event.preventDefault();
        clearSettingsErrors();

        const activeUser = auth.currentUser;
        if (!activeUser || !userSession) {
            showSettingsGlobalError("Session expired. Please log back in to proceed.");
            return;
        }

        const newName = document.getElementById("settingsFullName").value.trim();
        const newEmail = document.getElementById("settingsEmail").value.trim().toLowerCase();
        const newPassword = document.getElementById("settingsNewPassword").value;
        const selectedGender = document.getElementById("settingsGender").value;

        let hasProfileChanges = false;
        const firestoreUpdates = {};

        // Validation Checks
        if (newName === "") {
            showFieldSpecificError("settingsFullNameError", "Full name cannot be blank.");
            return;
        }

        // Setup Avatar update state criteria windows
        if (selectedGender !== "") {
            let avatarFilename = "defaultProfile.png";
            if (selectedGender === "male") avatarFilename = "manProfile.png";
            else if (selectedGender === "female") avatarFilename = "femaleProfile.png";
            
            firestoreUpdates["profile-Img"] = avatarFilename;
            document.getElementById("settingsAvatarPreview").src = `../../assets/images/${avatarFilename}`;
            hasProfileChanges = true;
        }

        try {
            // Processing security email parameter updates inside Firebase Auth
            if (newEmail !== activeUser.email.toLowerCase()) {
                // Prompt reauthentication for security loops if necessary
                const currentPasswordPrompt = prompt("For your security, please verify your current password to modify your email location configuration:");
                if (!currentPasswordPrompt) return;

                const credential = EmailAuthProvider.credential(activeUser.email, currentPasswordPrompt);
                await reauthenticateWithCredential(activeUser, credential);
                
                await updateEmail(activeUser, newEmail);
                firestoreUpdates.email = newEmail;
                userSession.email = newEmail;
                hasProfileChanges = true;
            }

            // Processing security password parameters updates inside Firebase Auth
            if (newPassword !== "") {
                if (newPassword.length < 8) {
                    showFieldSpecificError("settingsPasswordError", "New password must be at least 8 characters long.");
                    return;
                }
                await updatePassword(activeUser, newPassword);
            }

            // Always align full name edits to Firestore collection layer
            firestoreUpdates.full_name = newName;
            
            // Map table destination collection references based on user's active role context
            const collectionTarget = userSession.role === "admin" ? "config" : "members";
            const userDocRef = doc(db, collectionTarget, userSession.uid);
            
            await updateDoc(userDocRef, firestoreUpdates);

            // Dynamically synchronize local cache layout contexts across windows instantly
            const currentCache = JSON.parse(localStorage.getItem("invenireUser")) || {};
            const updatedCache = { ...currentCache, ...firestoreUpdates };
            
            localStorage.setItem("invenireUser", JSON.stringify(updatedCache));
            localStorage.setItem("userSession", JSON.stringify(userSession));

            showSettingsGlobalSuccess("Profile workspaces synchronized successfully!");
            
            // Force interface thumbnail components synchronization if global references live on side panels
            const topNavAvatar = document.querySelector(".profile img, .profile-avatar-img");
            if (topNavAvatar && updatedCache["profile-Img"]) {
                topNavAvatar.src = `../../assets/images/${updatedCache["profile-Img"]}`;
            }

        } catch (error) {
            console.error("Settings submission pipeline failure:", error);
            if (error.code === "auth/requires-recent-login") {
                showSettingsGlobalError("This action requires recent authentication. Please log out and back in, then try again.");
            } else {
                showSettingsGlobalError(error.message || "Failed to update profile space settings workspace.");
            }
        }
    });
}

// === 3. SAFE ACCOUNT DELETION LOGIC ===
if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async () => {
        const activeUser = auth.currentUser;
        if (!activeUser || !userSession) return;

        const structuralConfirmation = confirm("WARNING: This will permanently purge your profile tracking metrics from the database collections completely. Click OK to confirm deletion clearance.");
        if (!structuralConfirmation) return;

        const validationPassPrompt = prompt("Please confirm your password to complete account deletion verification:");
        if (!validationPassPrompt) return;

        try {
            // Reauthenticate to clear modern background threads rules validation safety flags
            const credential = EmailAuthProvider.credential(activeUser.email, validationPassPrompt);
            await reauthenticateWithCredential(activeUser, credential);

            const collectionTarget = userSession.role === "admin" ? "config" : "members";
            const userDocRef = doc(db, collectionTarget, userSession.uid);

            // 1. Wipe properties out of your Firestore document key paths
            await deleteDoc(userDocRef);

            // 2. Wipe account configuration records out of the Firebase Auth panel core
            await deleteUser(activeUser);

            // 3. Purge device local parameters workspace completely
            localStorage.clear();

            alert("Account data removed successfully. Redirecting back to authentication interface.");
            window.location.href = "../auth/login.html";

        } catch (error) {
            console.error("Account destruction failure loop caught safely:", error);
            alert("Deletion failed: " + (error.message || "Invalid validation credentials matched."));
        }
    });
}

// Helper utilities display managers
function showFieldSpecificError(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) { el.textContent = text; el.style.display = "block"; }
}

function showSettingsGlobalError(text) {
    if (globalError) { globalError.textContent = text; globalError.style.display = "block"; }
}

function showSettingsGlobalSuccess(text) {
    if (globalSuccess) { globalSuccess.textContent = text; globalSuccess.style.display = "block"; }
}

function clearSettingsErrors() {
    if (globalError) globalError.style.display = "none";
    if (globalSuccess) globalSuccess.style.display = "none";
    document.querySelectorAll(".error-message").forEach(el => el.style.display = "none");
}

// Fire runtime configuration loops immediately on document tracking instantiation
loadCurrentSettingsData();

document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll(".menu-item");
    const currentFile = window.location.pathname.split("/").pop();

    menuItems.forEach(item => {
        const link = item.querySelector("a");
        if (!link) return;

        const targetHref = link.getAttribute("href");

        if (targetHref.includes(currentFile) && currentFile !== "") {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    
const time = document.querySelector(".time");
const date = document.querySelector(".date");

function calender(){
    const now = new Date();
    
time.textContent = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
});

date.textContent = now.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
});
}

calender();
setInterval(calender, 1000);
});