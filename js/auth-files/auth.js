import { auth, db } from "../../src/firebase-config.js";
import { onAuthStateChanged } from "https://gstatic.com";
import { doc, getDoc, setDoc } from "https://gstatic.com";

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

export async function handleUserRouting(user) {
  if (!user) return;

  const uid = user.uid;
  const email = user.email ? user.email.toLowerCase().trim() : "";

  try {
    const adminDocRef = doc(db, "config", uid);
    const adminSnap = await getDoc(adminDocRef);

    if (adminSnap.exists()) {
      localStorage.setItem("userSession", JSON.stringify({ email, role: "admin", uid }));
      localStorage.setItem("invenireLoggedIn", "true");
      redirectTo("/pages/admin_dashboard.html");
      return;
    }

    const memberDocRef = doc(db, "members", uid);
    const memberSnap = await getDoc(memberDocRef);

    if (memberSnap.exists()) {
      const memberData = memberSnap.data();
      localStorage.setItem("userSession", JSON.stringify({ email, role: "member", uid }));
      localStorage.setItem("invenireUser", JSON.stringify(memberData));
      localStorage.setItem("invenireLoggedIn", "true");
      redirectTo("/pages/user_dashboard.html");
      return;
    }

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
    localStorage.setItem("userSession", JSON.stringify({ email, role: "member", uid }));

    redirectTo("/pages/user_dashboard.html");
  } catch (err) {
    console.error("Routing failed:", err?.code, err?.message, err);
    showError("loginError", "Routing execution failed. Try again later.");
    showError("emailError", "Routing execution failed. Try again later.");
  }
}

// 2. PASTE THE LOOP-PROTECTED OBSERVER HERE AT THE BOTTOM
onAuthStateChanged(auth, (user) => {
  const page = window.location.pathname.split("/").pop().toLowerCase();

  // If no user is authenticated, force them to stay on or go to login
  if (!user) {
    if (["user_dashboard.html", "admin_dashboard.html"].includes(page)) {
      window.location.href = "/pages/login.html";
    }
    return;
  }

  // Bind globals for dashboard script access
  window.userUid = user.uid;
  window.currentUserEmail = user.email ? user.email.toLowerCase().trim() : "";

  // If user IS authenticated and they are already on a dashboard, STOP running logic to prevent loops
  if (["user_dashboard.html", "admin_dashboard.html"].includes(page)) {
    return; 
  }

  // Otherwise, handle their routing if they are sitting on login.html
  if (["login.html", "signup.html", "auth.html"].includes(page) || page === "") {
    handleUserRouting(user);
  }
});
