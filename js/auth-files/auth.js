import { auth, db } from "../../src/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Helper to redirect pages safely
function redirectTo(path) {
  window.location.href = path;
}

// Display error messages dynamically to the user
function showError(errorId, message) {
  const el = document.getElementById(errorId);
  if (el) {
    el.textContent = message;
    el.style.display = "block";
  }
}

export async function handleUserRouting(user) {
  if (!user) return;

  const uid = user.uid;
  const email = user.email ? user.email.toLowerCase().trim() : "";

  try {
    // 1. Fetch the exact hardcoded admin document from your config collection
    const adminDocRef = doc(db, "config", "adminheader123");
    const adminSnap = await getDoc(adminDocRef);

    if (adminSnap.exists()) {
      const adminData = adminSnap.data();
      const adminEmailInDb = adminData.admin_email ? adminData.admin_email.toLowerCase().trim() : "";
      
      // Check if the current logging-in user's email matches the admin email field
      if (email === adminEmailInDb && email !== "") {
        localStorage.setItem("invenireLoggedIn", "true");
        localStorage.setItem("isAdmin", "true"); 
        redirectTo("/pages/admin_dashboard.html");
        return;
      }
    }

    // 2. If it's not the admin email, check if the user is an existing Member
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

    // 3. If they are not an admin and not in members, create their member profile
    const minimal = {
      user_id: uid,
      full_name: user.displayName || "New Library Member",
      email,
      location: "",
      gender: "",
      "profile-Img": user.photoURL || "defaultProfile.png",
      isLoggedIn: true,
      "last-login": new Date().toISOString(),
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

/**
 * Global Firebase Authentication State Observer
 */
onAuthStateChanged(auth, async (user) => {
  const page = window.location.pathname.split("/").pop();

  // RULE 1: Unauthenticated Guest Route Protection
  if (!user) {
    if (["user_dashboard.html", "admin_dashboard.html"].includes(page)) {
      localStorage.clear(); 
      redirectTo("/pages/login.html");
    }
    return;
  }

  // Bind critical data elements to global state
  window.userUid = user.uid;
  window.currentUserEmail = user.email ? user.email.toLowerCase().trim() : "";

  // RULE 2: Protect dashboards using local flags to avoid repetitive Firestore reads
  if (["user_dashboard.html", "admin_dashboard.html"].includes(page)) {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const isLoggedIn = localStorage.getItem("invenireLoggedIn") === "true";

    // If session tracking flags are completely missing, force a quick re-route check
    if (!isLoggedIn) {
      await handleUserRouting(user);
      return;
    }

    // Enforce dashboard security boundaries based on active auth states
    if (page === "admin_dashboard.html" && !isAdmin) {
      redirectTo("/pages/user_dashboard.html");
    } else if (page === "user_dashboard.html" && isAdmin) {
      redirectTo("/pages/admin_dashboard.html");
    }
    return; // Safely stop execution here for active dashboard pages
  }

  // RULE 3: Execute full Firestore routing check only when on gateway pages
  if (["login.html", "signup.html", "auth.html", "index.html", ""].includes(page)) {
    await handleUserRouting(user);
  }
});

/**
 * Form Submission Auth Error Mapper
 * Call this inside your manual signup/login submission catch blocks
 */
export function handleAuthError(error, contextType = "login") {
  const errorId = contextType === "signup" ? "signupError" : "loginError";
  let readableMessage = "An unexpected authentication error occurred.";

  switch (error.code) {
    case "auth/email-already-in-use":
      readableMessage = "This email address is already registered.";
      break;
    case "auth/invalid-email":
      readableMessage = "Please enter a valid email address.";
      break;
    case "auth/weak-password":
      readableMessage = "Password is too weak. Must be at least 6 characters.";
      break;
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      readableMessage = "Invalid email or password combination.";
      break;
    case "auth/too-many-requests":
      readableMessage = "Access temporarily blocked due to too many failed attempts. Try later.";
      break;
  }
  
  showError(errorId, readableMessage);
}
