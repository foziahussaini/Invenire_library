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

onAuthStateChanged(auth, (user) => {
  const page = window.location.pathname.split("/").pop();

  if (!user) {
    if (["user_dashboard.html", "admin_dashboard.html"].includes(page)) {
      redirectTo("/pages/login.html");
    }
    return;
  }

  window.userUid = user.uid;
  window.currentUserEmail = user.email ? user.email.toLowerCase().trim() : "";

  if (["login.html", "signup.html", "auth.html"].includes(page)) {
    return;
  }

  if (["user_dashboard.html", "admin_dashboard.html"].includes(page)) {
    return;
  }

  handleUserRouting(user);
});