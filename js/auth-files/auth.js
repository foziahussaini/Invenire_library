import {auth, db } from "../../src/firebase-config.js"; 
import { doc, setDoc, collection, query, where, getDocs, getDoc 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("Session persistence error:", error);
    });

// Initialize the Google Provider instance
// --- DOM Elements ---
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');

const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const loginError = document.getElementById('loginError');

// === 2. REGISTRATION LOGIC ===


if (signupForm) {
    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearErrors(); 

        const fullName = document.getElementById("fullName").value.trim();
        const location = document.getElementById("location").value.trim();
        const email = document.getElementById("signupEmail").value.trim().toLowerCase();
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        let isValid = true;

        const gender = document.getElementById("genderHiddenInput") ? document.getElementById("genderHiddenInput").value : ""; 
        const theme = document.getElementById("themeHiddenInput") ? document.getElementById("themeHiddenInput").value : "light"; 
        const language = document.getElementById("langHiddenInput") ? document.getElementById("langHiddenInput").value : "en"; 

        // --- Field Validations ---
        if (fullName === "") { showError("fullNameError", "Please enter your full name."); isValid = false; }
        if (location === "") { showError("locationError", "Please enter your location."); isValid = false; }
        if (gender === "") { showError("genderError", "Please select your gender."); isValid = false; }
        
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email === "") { showError("emailError", "Please enter your email."); isValid = false; } 
        else if (!emailPattern.test(email)) { showError("emailError", "Please enter a valid email address."); isValid = false; }

        if (password === "") { showError("passwordError", "Please enter a password."); isValid = false; } 
        else if (password.length < 8) { showError("passwordError", "Password must be at least 8 characters."); isValid = false; }
        if (confirmPassword === "") { showError("confirmPasswordError", "Please confirm your password."); isValid = false; } 
        else if (password !== confirmPassword) { showError("confirmPasswordError", "Passwords do not match."); isValid = false; }

        if (!isValid) {
        }

        try {
            console.log("SIGHNUP AUTH CODE REACHED"); 
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Signup Auth Error:", error);
            displayFirebaseErrors(error);
            return;
        }


        // --- CHECK FIRESTORE FOR EXISTING EMAIL ---
        try {
            const membersRef = collection(db, "members");
            const emailQuery = query(membersRef, where("email", "==", email));
            const querySnapshot = await getDocs(emailQuery);

            if (!querySnapshot.empty) {
                showError("signupError", "It seems this email already used try another");
                return; 
            }
        } catch (error) {
            console.error("Error checking existing email: ", error);
            showError("signupError", "Database error. Please try again.");
            return;
        }

        // --- Setup Dynamic Profile Image ---
        let avatar = "defaultProfile.png"; 
        if (gender === "male") {
            avatar = "manProfile.png"; 
        } else if (gender === "female") {
            avatar = "femaleProfile.png"; 
        }

        const userData = {
            full_name: fullName,
            email: email,
            location: location, 
            gender: gender,
            "profile-Img": avatar,
            isLoggedIn: true,
            "last-login": new Date().toISOString(),
            theme_preference: theme,
            language_preference: language 
        };

        try {

            window.location.href = "../../pages/user_dashboard.html";

        } catch (error) {
            console.error("Firestore Save Failure: ", error);
            showError("signupError", "Failed to register account storage. Try again.");
        }
    });
}

// === 3. LOGIN ROUTING & SESSION ENGINE ===
async function handleUserRouting(user) {
    const email = user.email.toLowerCase();

    try {
        // 1. Look inside the 'config' collection for Admin validation
        // (Assumes Admin config docs are keyed by their email string)
        const adminDocRef = doc(db, "config", email);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists()) {
            localStorage.setItem("userSession", JSON.stringify({ 
                email: email, 
                role: "admin", 
                uid: user.uid 
            }));
            localStorage.setItem("invenireLoggedIn", "true");
            window.location.href = "./adminadashboard.js"; 
            return;
        }

        // 2. Look inside the 'members' collection for registered user accounts
        // (Queries by email field since custom user IDs look like 'member4827')
        const membersRef = collection(db, "members");
        const memberQuery = query(membersRef, where("email", "==", email));
        const memberSnapshot = await getDocs(memberQuery);

        if (!memberSnapshot.empty) {
            const memberDoc = memberSnapshot.docs[0];
            const memberData = memberDoc.data();

            localStorage.setItem("userSession", JSON.stringify({ 
                email: email, 
                role: "member", 
                uid: user.uid 
            }));
            localStorage.setItem("invenireUser", JSON.stringify(memberData));
            localStorage.setItem("invenireLoggedIn", "true");
            
            window.location.href = "../../pages/user_dashboard.html";
            return;
        }

        // Fallback if authenticated via Firebase Auth/Google but missing from firestore database
        showError("loginError", "Account verified, but no profile records found in database.");
        
    } catch (error) {
        console.error("Firestore Routing Error:", error);
        showError("loginError", "Database error. Failed to retrieve profile workspace properties.");
    }
}

// === 4. ERROR DISPLAY AND FORMATTING RENDERING ENGINE ===
function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) { 
        errorElement.textContent = message; 
        errorElement.style.display = "block"; 
        errorElement.closest(".input-group")?.classList.add("invalid");
    }
}

function clearErrors() {
    // Structural layout clearing for both systems combined seamlessly
    document.querySelectorAll(".error-message, .form-error").forEach(el => {
        el.textContent = "";
        el.style.display = "none"; 
    });
    document.querySelectorAll(".input-group").forEach(el => el.classList.remove("invalid"));
    
    if (emailError) emailError.textContent = "";
    if (passwordError) passwordError.textContent = "";
    if (loginError) loginError.textContent = "";
}

function displayFirebaseErrors(error) {
    console.error("Auth Error Code:", error.code);
    
    switch (error.code) {
        case 'auth/invalid-email':
            showError("emailError", "The format of this email address is invalid.");
            break;
        case 'auth/user-not-found':
            showError("emailError", "This email address has not been signed up yet.");
            break;
        case 'auth/wrong-password':
            showError("passwordError", "Incorrect password. Please try again.");
            break;
        case 'auth/network-request-failed':
            showError("loginError", "Network error. Please verify your internet connection.");
            break;
         case 'auth/invalid-credential':
            showError("loginError", "Incorrect email or password.");
            break;
        default:
            showError("loginError", error.message);
            break;
    }
}
console.log("login form found", loginForm); 

// === 5. LOGIN FORM ACTIONS (Direct Firestore Verification with Correct Field Queries) ===
if (loginForm) {
    console.log("LOGIN SUBMIT LISTENER ATTACHED");

    loginForm.addEventListener('submit', async (e) => {
        console.log("LOGIN SUBMIT FIRED");

        e.preventDefault();
        clearErrors();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email) {
            showError("emailError", "Email field is required.");
            return;
        }

        if (!password) {
            showError("passwordError", "Password field is required.");
            return;
        }

        try {
            // First authenticate the user with Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            console.log("Firebase Authentication successful:", user.uid);

            // Now that the user is authenticated, check Admin config
            const configRef = collection(db, "config");
            const adminQuery = query(
                configRef,
                where("admin_email", "==", email)
            );

            const adminSnapshot = await getDocs(adminQuery);

            if (!adminSnapshot.empty) {
                const adminDoc = adminSnapshot.docs[0];

                localStorage.setItem(
                    "userSession",
                    JSON.stringify({
                        email: email,
                        role: "admin",
                        uid: adminDoc.id
                    })
                );

                localStorage.setItem("invenireLoggedIn", "true");

                window.location.href = "./admin_dashboard.html";
                return;
            }

            // Check member profile after authentication
            window.location.href = "../../pages/user_dashboard.html";
                return;

            if (!memberSnapshot.empty) {
                const memberDoc = memberSnapshot.docs[0];
                const memberData = memberDoc.data();

                localStorage.setItem(
                    "userSession",
                    JSON.stringify({
                        email: email,
                        role: "member",
                        uid: user.uid
                    })
                );

                localStorage.setItem(
                    "invenireUser",
                    JSON.stringify(memberData)
                );

                localStorage.setItem("invenireLoggedIn", "true");

                window.location.href = "../../pages/user_dashboard.html";
                return;
            }

            showError(
                "loginError",
                "Account verified, but no profile records found in database."
            );

        } catch (error) {
            console.error("Login Error:", error);
            displayFirebaseErrors(error);
        }
    });
}