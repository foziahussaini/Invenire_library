import { auth, db } from "../../src/firebase-config.js";

import {
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


// =========================================================
// 1. FIREBASE AUTH PERSISTENCE
// =========================================================

setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Firebase session persistence enabled.");
    })
    .catch((error) => {
        console.error("Session persistence error:", error);
    });


// =========================================================
// 2. DOM ELEMENTS
// =========================================================

const signupForm = document.getElementById("signupForm");

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const loginError = document.getElementById("loginError");


// =========================================================
// 3. ERROR FUNCTIONS
// =========================================================

function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";

        errorElement
            .closest(".input-group")
            ?.classList.add("invalid");
    }
}


function clearErrors() {
    document
        .querySelectorAll(".error-message, .form-error")
        .forEach((element) => {
            element.textContent = "";
            element.style.display = "none";
        });

    document
        .querySelectorAll(".input-group")
        .forEach((element) => {
            element.classList.remove("invalid");
        });

    if (emailError) {
        emailError.textContent = "";
    }

    if (passwordError) {
        passwordError.textContent = "";
    }

    if (loginError) {
        loginError.textContent = "";
    }
}


function displayFirebaseErrors(error) {
    console.error("Firebase Error Code:", error.code);

    switch (error.code) {

        case "auth/invalid-email":
            showError(
                "emailError",
                "The format of this email address is invalid."
            );
            break;

        case "auth/user-not-found":
            showError(
                "emailError",
                "This email address has not been signed up yet."
            );
            break;

        case "auth/wrong-password":
            showError(
                "passwordError",
                "Incorrect password. Please try again."
            );
            break;

        case "auth/invalid-credential":
            showError(
                "loginError",
                "Incorrect email or password."
            );
            break;

        case "auth/email-already-in-use":
            showError(
                "emailError",
                "This email is already registered. Please login instead."
            );
            break;

        case "auth/weak-password":
            showError(
                "passwordError",
                "Password must be at least 6 characters."
            );
            break;

        case "auth/network-request-failed":
            showError(
                "loginError",
                "Network error. Please check your internet connection."
            );
            break;

        default:
            showError(
                "loginError",
                error.message || "Something went wrong. Please try again."
            );
            break;
    }
}


// =========================================================
// 4. SIGN UP
// =========================================================

if (signupForm) {

    console.log("SIGNUP FORM FOUND");

    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearErrors();

        // -----------------------------------------------------
        // Get form values
        // -----------------------------------------------------

        const fullName =
            document.getElementById("fullName")?.value.trim() || "";

        const location =
            document.getElementById("location")?.value.trim() || "";

        const email =
            document.getElementById("signupEmail")
                ?.value.trim()
                .toLowerCase() || "";

        const password =
            document.getElementById("signupPassword")?.value || "";

        const confirmPassword =
            document.getElementById("confirmPassword")?.value || "";


        const gender =
            document.getElementById("genderHiddenInput")?.value || "";

        const theme =
            document.getElementById("themeHiddenInput")?.value || "light";

        const language =
            document.getElementById("langHiddenInput")?.value || "en";


        // -----------------------------------------------------
        // Validation
        // -----------------------------------------------------

        let isValid = true;


        if (!fullName) {
            showError(
                "fullNameError",
                "Please enter your full name."
            );
            isValid = false;
        }


        if (!location) {
            showError(
                "locationError",
                "Please enter your location."
            );
            isValid = false;
        }


        if (!gender) {
            showError(
                "genderError",
                "Please select your gender."
            );
            isValid = false;
        }


        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!email) {

            showError(
                "emailError",
                "Please enter your email."
            );

            isValid = false;

        } else if (!emailPattern.test(email)) {

            showError(
                "emailError",
                "Please enter a valid email address."
            );

            isValid = false;
        }


        if (!password) {

            showError(
                "passwordError",
                "Please enter a password."
            );

            isValid = false;

        } else if (password.length < 8) {

            showError(
                "passwordError",
                "Password must be at least 8 characters."
            );

            isValid = false;
        }


        if (!confirmPassword) {

            showError(
                "confirmPasswordError",
                "Please confirm your password."
            );

            isValid = false;

        } else if (password !== confirmPassword) {

            showError(
                "confirmPasswordError",
                "Passwords do not match."
            );

            isValid = false;
        }


        // IMPORTANT
        // Stop here if validation failed.

        if (!isValid) {
            return;
        }


        // =====================================================
        // CREATE FIREBASE AUTH ACCOUNT
        // =====================================================

        try {

            console.log("SIGNUP AUTH CODE REACHED");

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;

            console.log(
                "Firebase Authentication successful:",
                user.uid
            );


            // -------------------------------------------------
            // Select profile image
            // -------------------------------------------------

            let avatar = "defaultProfile.png";

            if (gender === "male") {
                avatar = "manProfile.png";
            }

            if (gender === "female") {
                avatar = "femaleProfile.png";
            }


            // -------------------------------------------------
            // Create member profile
            // -------------------------------------------------

            const userData = {

                full_name: fullName,

                email: email,

                location: location,

                gender: gender,

                "profile-Img": avatar,

                isLoggedIn: true,

                "last-login":
                    new Date().toISOString(),

                theme_preference: theme,

                language_preference: language
            };


            // -------------------------------------------------
            // Save profile using Firebase UID
            // -------------------------------------------------

            await setDoc(
                doc(db, "members", user.uid),
                userData
            );


            console.log(
                "Member profile created successfully."
            );


            // -------------------------------------------------
            // Save local session
            // -------------------------------------------------

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
                JSON.stringify(userData)
            );


            localStorage.setItem(
                "invenireLoggedIn",
                "true"
            );


            // -------------------------------------------------
            // Go to Home
            // -------------------------------------------------

            window.location.href = "../../pages/home.html";


        } catch (error) {

            console.error(
                "Signup Error:",
                error
            );

            displayFirebaseErrors(error);
        }
    });
}


// =========================================================
// 5. LOGIN
// =========================================================

if (loginForm) {

    console.log("LOGIN FORM FOUND");
    console.log("LOGIN SUBMIT LISTENER ATTACHED");


    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        console.log("LOGIN SUBMIT FIRED");

        clearErrors();


        const email =
            emailInput?.value.trim().toLowerCase() || "";

        const password =
            passwordInput?.value || "";


        // -----------------------------------------------------
        // Validation
        // -----------------------------------------------------

        if (!email) {

            showError(
                "emailError",
                "Email field is required."
            );

            return;
        }


        if (!password) {

            showError(
                "passwordError",
                "Password field is required."
            );

            return;
        }


        // =====================================================
        // FIREBASE AUTHENTICATION
        // =====================================================

        try {

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            console.log(
                "Firebase Authentication successful:",
                user.uid
            );


            // =================================================
            // TRY ADMIN CHECK
            // =================================================

            try {

                const adminDocRef =
                    doc(db, "config", email);

                const adminDocSnap =
                    await getDoc(adminDocRef);


                if (adminDocSnap.exists()) {

                    console.log(
                        "Admin account detected."
                    );


                    localStorage.setItem(
                        "userSession",
                        JSON.stringify({
                            email: email,
                            role: "admin",
                            uid: user.uid
                        })
                    );


                    localStorage.setItem(
                        "invenireLoggedIn",
                        "true"
                    );


                    window.location.href =
                        "../../pages/admin_dashboard.html";

                    return;
                }

            } catch (adminError) {

                /*
                 * If Firestore doesn't allow the admin check,
                 * don't destroy normal member login.
                 */

                console.warn(
                    "Admin check unavailable. Continuing as member.",
                    adminError
                );
            }


            // =================================================
            // GET MEMBER PROFILE
            // =================================================

            let memberData = null;


            try {

                const memberDocRef =
                    doc(db, "members", user.uid);

                const memberDocSnap =
                    await getDoc(memberDocRef);


                if (memberDocSnap.exists()) {

                    memberData =
                        memberDocSnap.data();

                    console.log(
                        "Member profile loaded."
                    );

                } else {

                    console.warn(
                        "No member profile found. Continuing with Auth account."
                    );
                }

            } catch (memberError) {

                /*
                 * Firestore permission problems should not
                 * prevent Firebase Authentication from logging
                 * the user in.
                 */

                console.warn(
                    "Could not read member profile:",
                    memberError
                );
            }


            // =================================================
            // SAVE MEMBER SESSION
            // =================================================

            localStorage.setItem(
                "userSession",
                JSON.stringify({
                    email: email,
                    role: "member",
                    uid: user.uid
                })
            );


            if (memberData) {

                localStorage.setItem(
                    "invenireUser",
                    JSON.stringify(memberData)
                );
            }


            localStorage.setItem(
                "invenireLoggedIn",
                "true"
            );


            console.log(
                "Login session created successfully."
            );


            // =================================================
            // GO TO HOME
            // =================================================

            window.location.href =
                "../../pages/home.html";


        } catch (error) {

            console.error(
                "Login Error:",
                error
            );

            displayFirebaseErrors(error);
        }
    });
}