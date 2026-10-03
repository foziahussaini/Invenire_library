import { auth, db } from "../../src/firebase-config.js"; 
import {
  createUserWithEmailAndPassword,
  deleteUser
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// ====================== 2. GLOBAL UI HELPER UTILITIES =============================
function showError(errorId, message) {
  const el = document.getElementById(errorId);
  if (el) {
    el.textContent = message;
    el.style.display = "block";
    el.closest(".input-group")?.classList.add("invalid");
  } else {
    console.error(`UI Notification Target Missing [${errorId}]: ${message}`);
    // Safe container alternative fallback positions
    const alternateContainer = document.getElementById("signupError") || document.getElementById("loginError");
    if (alternateContainer) {
      alternateContainer.textContent = message;
      alternateContainer.style.display = "block";
    }
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
  console.error("Auth Error Captured:", error);
  const code = error?.code;
  
  if (code === "auth/invalid-email") {
    showError("emailError", "The format of this email address is invalid.");
  } else if (code === "auth/email-already-in-use") {
    showError("emailError", "This email address is already registered.");
  } else if (code === "auth/weak-password") {
    showError("passwordError", "The password is too weak. Use at least 6 characters.");
  } else if (code === "auth/network-request-failed" || code === "auth/invalid-credential") {
    showError("signupError", "Network verification failed. Please check your data connection or credentials.");
  } else {
    showError("signupError", error?.message || "Registration pipeline blocked.");
  }
}

// ====================== 4. REGISTRATION SUBMIT ENGINE =============================
const signupForm = document.getElementById("signupForm") || document.getElementById("login-form");

if (!signupForm) {
  console.warn("Registration interface form listener wrapper node not found in active DOM.");
} else {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    // === CRITICAL FIX: Safe element checking strings prevents extraction crash ===
    const fullNameEl = document.getElementById("fullName");
    const locationEl = document.getElementById("location");
    const emailEl = document.getElementById("signupEmail") || document.getElementById("login-email");
    const passwordEl = document.getElementById("signupPassword") || document.getElementById("login-password");
    const confirmPasswordEl = document.getElementById("confirmPassword");
    const genderEl = document.getElementById("genderHiddenInput");

    const fullName = fullNameEl ? fullNameEl.value.trim() : "";
    const location = locationEl ? locationEl.value.trim() : "";
    const email = emailEl ? emailEl.value.trim().toLowerCase() : "";
    const password = passwordEl ? passwordEl.value : "";
    const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : "";
    const gender = genderEl ? genderEl.value : "default";

    // Field Validation Pipelines
    let isValid = true;
    
    // Check if optional dashboard descriptors exist on this layout view template
    if (fullNameEl && !fullName) { showError("fullNameError", "Please enter your full name."); isValid = false; }
    if (locationEl && !location) { showError("locationError", "Please enter your location."); isValid = false; }
    if (genderEl && !gender) { showError("genderError", "Please select your gender."); isValid = false; }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+\$/;
    if (!email) { 
      showError("emailError", "Please enter your email."); 
      isValid = false; 
    } else if (!emailPattern.test(email)) { 
      showError("emailError", "Please enter a valid email address."); 
      isValid = false; 
    }

    if (!password) { 
      showError("passwordError", "Please enter a password."); 
      isValid = false; 
    } else if (password.length < 6) { 
      showError("passwordError", "Password must be at least 6 characters long."); 
      isValid = false; 
    }
    
    if (confirmPasswordEl && password !== confirmPassword) { 
      showError("confirmPasswordError", "Passwords do not match."); 
      isValid = false; 
    }

    if (!isValid) return; 

    // Create user in Firebase Auth securely
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      displayFirebaseErrors(err);
      return;
    }

    const uid = userCredential.user.uid;
    const avatar = gender === "male" ? "manProfile.png" : (gender === "female" ? "femaleProfile.png" : "defaultProfile.png");
    
    const userData = {
      user_id: uid,
      full_name: fullName || "New Library Member",
      email: email,
      location: location || "Unspecified",
      gender: gender,
      "profile-Img": avatar,
      isLoggedIn: true,
      "last-login": new Date().toISOString(),
      totalLoginsCount: 1,
      active_minutes_last_day: 0,
      website_share_count: 0,
      profile_edit_count: 0
    };

    // Commit document metrics properties into Cloud Firestore
    try {
      await setDoc(doc(db, "members", uid), userData);

      localStorage.setItem("invenireUser", JSON.stringify(userData));
      localStorage.setItem("invenireLoggedIn", "true");
      localStorage.setItem("userSession", JSON.stringify({ email, role: "member", uid }));

      console.log("Registration successfully written! Routing to user space dashboard...");
      window.location.href = "/pages/user_dashboard.html";
    } catch (err) {
      console.error("Firestore database write failed:", err);
      try {
        await deleteUser(userCredential.user);
      } catch (delErr) {
        console.error("Failed to delete auth user after Firestore failure:", delErr);
      }
      showError("signupError", "Failed to save profile database context. Please try again.");
    }
  });
}
