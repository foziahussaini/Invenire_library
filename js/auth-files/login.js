import { auth, db } from "../../src/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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
  const globalErrorEl = document.getElementById("loginError");
  if (globalErrorEl) globalErrorEl.style.display = "none";

  if (code === "auth/invalid-email") {
      showError("emailError", "The format of this email address is invalid.");
      return;
  } 
  if (code === "auth/invalid-credential") {
      showError("emailError", "Invalid email address or incorrect password.");
      return;
  }
  if (code === "auth/user-not-found") {
      showError("emailError", "This email address is not registered.");
      return;
  }
  if (code === "auth/wrong-password") {
      showError("passwordError", "Incorrect password. Please try again.");
      return;
  }
  showError("loginError", "Authentication service error. Please check your network connection.");
}

async function routeUserByCollection(user, inputPassword) {
    const email = user.email.toLowerCase().trim();
    try {
        // 1. SCAN FOR ADMIN (Match by admin_email field)
        const adminQuery = query(collection(db, "config"), where("admin_email", "==", email));
        const adminSnap = await getDocs(adminQuery);

        if (!adminSnap.empty) {
            // Get the matching admin document object inside the query snapshot collection array
            const adminDoc = adminSnap.docs[0];
            const adminData = adminDoc.data();

            // Match structural configurations: check if the password field matches input, and document ID equals 'adminheader123'
            if (adminData.password === inputPassword && adminDoc.id === "adminheader123") {
                localStorage.setItem("userSession", JSON.stringify({ email: email, role: "admin", uid: user.uid }));
                localStorage.setItem("isAdmin", "true");
                localStorage.setItem("invenireLoggedIn", "true");
                console.log("Admin parameters successfully authorized. Routing to admin panel...");
                window.location.href = "/pages/admin_dashboard.html";
                return;
            } else {
                console.warn("Admin email matched but password or structural Document ID verification failed.");
            }
        }

        // 2. SCAN FOR REGULAR MEMBERS BY AUTH UID MATCHING
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

        // 3. FORCE BYPASS SAFEFALLBACK
        console.warn("User authenticated but document not found. Executing safe dashboard bypass...");
        localStorage.setItem("userSession", JSON.stringify({ email: email, role: "member", uid: user.uid }));
        localStorage.setItem("invenireLoggedIn", "true");
        window.location.href = "/pages/user_dashboard.html";

    } catch (error) {
        console.error("Routing execution crash avoided:", error);
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Pass the raw text input password along to verify against your custom config document fields
      await routeUserByCollection(userCredential.user, password);
    } catch (err) {
      displayFirebaseErrors(err);
    }
  });
}
