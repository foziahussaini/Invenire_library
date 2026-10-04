import { auth, db } from "../../src/firebase-config.js"; 
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");

function showError(errorId, message) {
  const el = document.getElementById(errorId);
  if (el) {
    el.textContent = message;
    el.style.display = "block";
    el.closest(".input-group")?.classList.add("invalid");
  }
}

function clearErrors() {
  document.querySelectorAll(".error-message, .form-error").forEach(el => {
    el.textContent = "";
    el.style.display = "none";
  });
  document.querySelectorAll(".input-group").forEach(el => el.classList.remove("invalid"));
}

function displayFirebaseErrors(error) {
  console.log("Auth Error Captured:", error);
  const code = error?.code;
  
  // Clear any structural fallback container errors first
  const globalErrorEl = document.getElementById("loginError");
  if (globalErrorEl) globalErrorEl.style.display = "none";

  // 1. Check for bad formatting
  if (code === "auth/invalid-email") {
      showError("emailError", "The format of this email address is invalid.");
      return;
  } 
  
  // 2. Handle modern combined credential errors
  if (code === "auth/invalid-credential") {
      showError("emailError", "Invalid email address or incorrect password.");
      return;
  }

  // 3. Handle legacy distinct error types (just in case)
  if (code === "auth/user-not-found") {
      showError("emailError", "This email address is not registered.");
      return;
  }
  if (code === "auth/wrong-password") {
      showError("passwordError", "Incorrect password. Please try again.");
      return;
  }

  // 4. Ultimate catch-all fallback for network failures / system blocks
  showError("loginError", "Authentication service error. Please check your network connection.");
}


// === UNIFIED DYNAMIC ROUTING SYSTEM ===
async function routeUserByCollection(user) {
    const email = user.email.toLowerCase().trim();
    try {
        // 1. SCAN FOR ADMIN ONLY (Checks your config collection using the secure UID string)
        const adminDocRef = doc(db, "config", user.uid);
        const adminSnap = await getDoc(adminDocRef);

        if (adminSnap.exists()) {
            localStorage.setItem("userSession", JSON.stringify({ email: email, role: "admin", uid: user.uid }));
            localStorage.setItem("invenireLoggedIn", "true");
            console.log("Admin routing approved. Redirecting...");
            window.location.href = "/pages/admin_dashboard.html";
            return;
        }

        // 2. SCAN FOR REGULAR MEMBERS (Checks your members collection using the secure UID string)
        const memberDocRef = doc(db, "members", user.uid);
        const memberSnap = await getDoc(memberDocRef);

        if (memberSnap.exists()) {
            localStorage.setItem("userSession", JSON.stringify({ email: email, role: "member", uid: user.uid }));
            localStorage.setItem("invenireUser", JSON.stringify(memberSnap.data()));
            localStorage.setItem("invenireLoggedIn", "true");
            console.log("Member routing approved. Redirecting...");
            window.location.href = "/pages/user_dashboard.html";
            return;
        }

        // 3. FORCE BYPASS SAFEFALLBACK: If user exists in Auth but document hasn't synced yet
        console.warn("User authenticated but document not found. Executing safe dashboard bypass...");
        localStorage.setItem("userSession", JSON.stringify({ email: email, role: "member", uid: user.uid }));
        localStorage.setItem("invenireLoggedIn", "true");
        window.location.href = "/pages/user_dashboard.html";

    } catch (error) {
        console.error("Routing execution crash avoided:", error);
        // Absolute fail-safe rescue fallback to make sure they aren't trapped on screen
        window.location.href = "/pages/user_dashboard.html"; 
    }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); 
    clearErrors();

    const email = (emailInput?.value || "").trim().toLowerCase();
    const password = passwordInput?.value || "";

    if (!email) { showError("emailError", "Email required."); return; }
    if (!password) { showError("passwordError", "Password required."); return; }

    try {
      // Step 1: Validate credentials securely with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Step 2: Route the user based on which collection their document belongs to
      await routeUserByCollection(userCredential.user);

    } catch (err) {
      displayFirebaseErrors(err);
    }
  });
}
