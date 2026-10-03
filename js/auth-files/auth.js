import { auth, db } from "../../src/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// ====================== UNIFIED DYNAMIC ROUTING ENGINE =============================
export async function handleUserRouting(user) {
  if (!user) return;
  const uid = user.uid;
  const email = user.email ? user.email.toLowerCase().trim() : "";

  try {
    // 1. SCAN FOR ADMIN ONLY (Checks your config collection using the secure UID string)
    const adminDocRef = doc(db, "config", uid);
    const adminSnap = await getDoc(adminDocRef);

    if (adminSnap.exists()) {
      localStorage.setItem("userSession", JSON.stringify({ email: email, role: "admin", uid: uid }));
      localStorage.setItem("invenireLoggedIn", "true");
      console.log("Admin routing approved. Redirecting...");
      window.location.href = "/pages/admin_dashboard.html";
      return;
    }

    // 2. SCAN FOR STANDARD MEMBER ROLE (Checks your members collection)
    const memberDocRef = doc(db, "members", uid);
    const memberSnap = await getDoc(memberDocRef);
    
    if (memberSnap.exists()) {
      const memberData = memberSnap.data();
      localStorage.setItem("userSession", JSON.stringify({ email: email, role: "member", uid: uid }));
      localStorage.setItem("invenireUser", JSON.stringify(memberData));
      localStorage.setItem("invenireLoggedIn", "true");
      console.log("Member routing approved. Redirecting...");
      window.location.href = "/pages/user_dashboard.html";
      return;
    }

    // 3. FALLBACK FOR NEW OAUTH/EXTERNAL LOGINS
    console.warn("User document missing from Firestore. Registering placeholder profile details...");
    const minimal = {
      user_id: uid,
      full_name: user.displayName || "New Library Member",
      email: email,
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
    localStorage.setItem("userSession", JSON.stringify({ email: email, role: "member", uid: uid }));
    window.location.href = "/pages/user_dashboard.html";
  } catch (err) {
    console.error("handleUserRouting database block crash caught:", err);
    // Explicit safety toggle: If an element container is missing, target an available login error slot alternatively
    showError("loginError", "Routing execution failed. Try again later.");
    showError("emailError", "Routing execution failed. Try again later.");
  }
}

// ====================== PROTECTED STATE LIFECYCLE WATCHER =============================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes("user_dashboard.html") || currentPath.includes("admin_dashboard.html")) {
        window.location.href = "login.html";
    }
    return;
  }
  
  // Assign user contexts to the global window space instantly
  window.userUid = user.uid;
  window.currentUserEmail = user.email ? user.email.toLowerCase().trim() : "";

  if (typeof window.triggerLibraryReload === "function") {
      window.triggerLibraryReload();
  }

  const currentPath = window.location.pathname.toLowerCase();
  
  // Guard to block the auto-watcher on authentication portal entry pages
  if (currentPath.includes("login.html") || currentPath.includes("signup.html") || currentPath.includes("auth.html")) {
      console.log("Auto-routing paused: User operates inside login portal forms.");
      return;
  }
  
  // Stream loop guard: Global credentials updated. Background dashboard rerouting suspended safely.
  if (currentPath.includes("user_dashboard.html") || currentPath.includes("admin_dashboard.html") || currentPath.includes("user_subpages")) {
      return; 
  }
  
  // Only auto-route if they refresh their browser from a generic root index landing page
  handleUserRouting(user);
});

function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
    }
}
