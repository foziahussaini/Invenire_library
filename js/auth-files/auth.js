import { auth, db } from "../../src/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

function redirectTo(path) {
  window.location.href = path;
}

function showError(errorId, message) {
  const el = document.getElementById(errorId);
  if (el) {
    el.textContent = message;
    el.style.display = "block";
  }
}

// Helper to determine the current page filename without extension hooks
function getCurrentPageName() {
  const baseName = window.location.pathname.split("/").pop() || "";
  return baseName.replace(".html", ""); // Wipes extension to maintain structural parity across configurations
}

export async function handleUserRouting(user) {
  if (!user) return;
  const uid = user.uid;
  const email = user.email ? user.email.toLowerCase().trim() : "";

  try {
    // 1. SCAN FOR ADMIN SPECIFIC IDENTIFIER
    const adminDocRef = doc(db, "config", "adminheader123");
    const adminSnap = await getDoc(adminDocRef);

    if (adminSnap.exists()) {
      const adminData = adminSnap.data();
      const adminEmailInDb = adminData.admin_email ? adminData.admin_email.toLowerCase().trim() : "";
      
      if (email === adminEmailInDb && email !== "") {
        localStorage.setItem("invenireLoggedIn", "true");
        localStorage.setItem("isAdmin", "true"); 
        redirectTo("/pages/admin_dashboard.html");
        return;
      }
    }

    // 2. SCAN FOR EXISTING PROFILE NODE RECORDS
    const memberDocRef = doc(db, "members", uid);
    const memberSnap = await getDoc(memberDocRef);

    if (memberSnap.exists()) {
      const memberData = memberSnap.data();
      localStorage.setItem("invenireUser", JSON.stringify(memberData));
      localStorage.setItem("invenireLoggedIn", "true");
      localStorage.removeItem("isAdmin"); 
      redirectTo("/pages/user_dashboard.html");
      return;
    }

    // 3. CREATE PROFILE NODE FALLBACK INITIALIZATION
    const minimal = {
      user_id: uid,
      full_name: user.displayName || "New Library Member",
      email,
      location: "",
      gender: "",
      "profile-Img": user.photoURL || "defaultProfile.png",
      isLoggedIn: true,
      "last-login": serverTimestamp(), // Adjusted to use secure server metrics asynchronously
      theme_preference: "light",
      language_preference: "en",
      totalLoginsCount: 1,
      active_minutes_last_day: 0,
      website_share_count: 0,
      profile_edit_count: 0
    };

    await setDoc(doc(db, "members", uid), minimal);
    localStorage.setItem("invenireUser", JSON.stringify(minimal));
    localStorage.setItem("invenireLoggedIn", "true");
    localStorage.removeItem("isAdmin");
    redirectTo("/pages/user_dashboard.html");

  } catch (err) {
    console.error("Routing failed:", err?.code, err?.message, err);
    showError("loginError", "System routing failed. Please try logging in again.");
    showError("signupError", "Account created, but database initialization failed.");
  }
}

// Global Authentication State Observer
onAuthStateChanged(auth, async (user) => {
  const page = getCurrentPageName(); // Pulling clean formatting names directly

  // RULE 1: Guest Access Security Barrier
  if (!user) {
    if (["user_dashboard", "admin_dashboard"].includes(page)) {
      localStorage.clear(); 
      redirectTo("/pages/login.html");
    }
    return;
  }

  window.userUid = user.uid;
  window.currentUserEmail = user.email ? user.email.toLowerCase().trim() : "";

  // RULE 2: Session Flag Validation Routing Guards
  if (["user_dashboard", "admin_dashboard"].includes(page)) {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const isLoggedIn = localStorage.getItem("invenireLoggedIn") === "true";

    if (!isLoggedIn) {
      await handleUserRouting(user);
      return;
    }

    if (page === "admin_dashboard" && !isAdmin) {
      redirectTo("/pages/user_dashboard.html");
    } else if (page === "user_dashboard" && isAdmin) {
      redirectTo("/pages/admin_dashboard.html");
    }
    return;
  }

  // RULE 3: Entry Gateway Routing Trigger Logic
  if (["login", "signup", "auth", "index", ""].includes(page)) {
    await handleUserRouting(user);
  }
});

export function handleAuthError(error, contextType = "login") {
  const errorId = contextType === "signup" ? "signupError" : "loginError";
  let readableMessage = "An unexpected authentication error occurred.";
  switch (error.code) {
    case "auth/email-already-in-use": readableMessage = "This email address is already registered."; break;
    case "auth/invalid-email": readableMessage = "Please enter a valid email address."; break;
    case "auth/weak-password": readableMessage = "Password is too weak. Must be at least 6 characters."; break;
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": readableMessage = "Invalid email or password combination."; break;
    case "auth/too-many-requests": readableMessage = "Access temporarily blocked due to too many failed attempts. Try later."; break;
  }
  showError(errorId, readableMessage);
}
