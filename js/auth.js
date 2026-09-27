const signupForm = document.getElementById("signupForm");
if (signupForm) {

    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();
        clearErrors();
        const fullName =
            document.getElementById("fullName")
                .value
                .trim();
        const location =
            document.getElementById("location")
                .value
                .trim();
        const email =
            document.getElementById("signupEmail")
                .value
                .trim()
                .toLowerCase();
        const gender =
            document.getElementById("gender")
                .value;
        const password =
            document.getElementById("signupPassword")
                .value;
        const confirmPassword =
            document.getElementById("confirmPassword")
                .value;
        let isValid = true;

        if (fullName === "") {

            showError(
                "fullNameError",
                "Please enter your full name."
            );
            isValid = false;

        } else if (fullName.length < 2) {
            showError(
                "fullNameError",
                "Full name must contain at least 2 characters."
            );

            isValid = false;
        }

        if (location === "") {

            showError(
                "locationError",
                "Please enter your location."
            );

            isValid = false;
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email === "") {
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
        if (gender === "") {

            showError(
                "genderError",
                "Please select your gender."
            );

            isValid = false;
        }

        if (password === "") {
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

        if (confirmPassword === "") {
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
        if (!isValid) {
            return;
        }
        const existingUser =
            JSON.parse(
                localStorage.getItem("invenireUser")
            );

        if (
            existingUser &&
            existingUser.email === email
        ) {
            showError(
                "signupError",
                "An account with this email already exists."
            );
            return;
        }

        let avatar;
        if (gender === "male") {
            avatar = "manProfile.png";

        } else if (gender === "female") {
            avatar = "femaleProfile.png";
        }

        const user = {
            fullName: fullName,
            location: location,
            email: email,
            password: password,
            gender: gender,
            avatar: avatar
        };

        localStorage.setItem(
            "invenireUser",
            JSON.stringify(user)
        );

        localStorage.setItem(
            "invenireLoggedIn",
            "true"
        );

        window.location.href = "home.html";

    });
}


const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        clearErrors();
        const email =
            document.getElementById("loginEmail")
                .value
                .trim()
                .toLowerCase();
        const password =
            document.getElementById("loginPassword")
                .value;
        let isValid = true;

        if (email === "") {

            showError(
                "loginEmailError",
                "Please enter your email."
            );

            isValid = false;
        }

        if (password === "") {

            showError(
                "loginPasswordError",
                "Please enter your password."
            );

            isValid = false;
        }
        if (!isValid) {

            return;
        }

        const savedUser =
            JSON.parse(
                localStorage.getItem("invenireUser")
            );
        if (!savedUser) {

            showError(
                "loginError",
                "No account found. Please sign up first."
            );

            return;
        }

        if (
            email === savedUser.email &&
            password === savedUser.password
        ) {
            localStorage.setItem(
                "invenireLoggedIn",
                "true"
            );

            window.location.href =
                "home.html";

        } else {

            showError(
                "loginError",
                "Incorrect email or password."
            );
        }

    });
}

const isHomePage =
    window.location.pathname.endsWith("home.html");

if (isHomePage) {

    const loggedIn =
        localStorage.getItem(
            "invenireLoggedIn"
        );

    const savedUser =
        JSON.parse(
            localStorage.getItem("invenireUser")
        );

    if (
        loggedIn !== "true" ||
        !savedUser
    ) {

        window.location.href =
            "login.html";
    }

    if (savedUser) {
        const welcomeMessage =
            document.getElementById(
                "welcomeMessage"
            );
        const profileImage =
            document.getElementById(
                "profileImage"
            );
        const userLocation =
            document.getElementById(
                "userLocation"
            );
        if (welcomeMessage) {

            welcomeMessage.textContent =
                `Welcome, ${savedUser.fullName}!`;
        }
        if (userLocation) {

            userLocation.textContent =
                savedUser.location;
        }
        if (profileImage) {

            profileImage.src =
                `../images/${savedUser.avatar}`;
        }
    }
}

const logoutButton =
    document.getElementById(
        "logoutButton"
    );
if (logoutButton) {
    logoutButton.addEventListener(
        "click",
        function () {
            localStorage.removeItem(
                "invenireLoggedIn"
            );
            window.location.href =
                "login.html";
        }
    );
}


function showError(
    elementId,
    message
) {

    const element =
        document.getElementById(
            elementId
        );

    if (element) {

        element.textContent =
            message;
    }
}

function clearErrors() {

    const errors =
        document.querySelectorAll(
            ".error-message, .form-error"
        );


    errors.forEach(function (error) {

        error.textContent = "";

    });
}