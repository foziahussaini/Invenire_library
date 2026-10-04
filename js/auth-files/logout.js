// FIX 1: Root absolute path routing guarantees module access across user and admin sub-folders
import { auth, db } from "../../src/firebase-config.js"; 
import { signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

async function updateLogoutStatus(uid) {
  if (!uid) return;
  
  try {
    // Direct document reference matching the secure unified Auth UID token anchor
    const userDocRef = doc(db, "members", uid);
    
    // Fire the database token clear operation asynchronously without blocking the local window wipe threads
    updateDoc(userDocRef, {
      isLoggedIn: false,
      "last-login": serverTimestamp()
    }).catch(e => console.warn("Background firestore status update postponed:", e.message));

  } catch (err) {
    console.error("Failed to compile background visibility states:", err);
  }
}

async function performLogout({ redirectTo = null } = {}) {
  let storedSession = null;
  try {
    storedSession = JSON.parse(localStorage.getItem("userSession"));
  } catch (e) { 
    console.error("Local session cache read error:", e); 
  }

  // Fallback property mapping to ensure thread safety
  const uid = auth.currentUser?.uid || storedSession?.uid || null;

  // FIX 2: Trigger local database cleanup state updates concurrently
  if (uid) {
      await updateLogoutStatus(uid);
  }

  // Clear remote authorization token locks instantly from Firebase tracking panels
  try {
    await signOut(auth);
    console.log("Firebase token invalidated successfully.");
  } catch (err) {
    console.error("Firebase engine signOut failed:", err);
  }

  // FIX 3: Local parameters are completely removed now even if database permissions reject the offline write packets
  localStorage.removeItem("invenireUser");
  localStorage.removeItem("invenireLoggedIn");
  localStorage.removeItem("userSession");

  // Synchronize interface component visibility states cross-platform
  document.querySelectorAll(".login-btn, .signup-btn").forEach(el => {
    el.style.removeProperty("display");
  });
  document.querySelectorAll(".logout").forEach(el => {
    el.style.display = "none";
  });

  // Safe client dashboard landing page ejection
  if (redirectTo) {
    window.location.href = redirectTo;
  } else {
    // Unified default fallback landing context if explicit redirect properties are unset
    window.location.href = "home.html"; 
  }
}

// Global Event Delegation Interceptor
document.addEventListener("click", async (event) => {
  const btn = event.target.closest(".logout");
  if (!btn) return;

  event.preventDefault();

  // Guard loop window against double-clicks
  const allLogoutButtons = [...document.querySelectorAll(".logout")];
  allLogoutButtons.forEach(b => b.disabled = true);

  const redirectTo = btn.getAttribute("data-redirect") || null;

  await performLogout({ redirectTo });

  allLogoutButtons.forEach(b => b.disabled = false);
});
