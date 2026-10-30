const genderBtn = document.getElementById("genderDropdownBtn");
const genderDropdown = document.querySelector(".gender-dropdown");
const genderMenu = document.getElementById("genderDropdownMenu");
const hiddenInput = document.getElementById("genderHiddenInput");
const selectedText = document.getElementById("selected-gender");

genderBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    genderDropdown.classList.toggle("active");
});

genderMenu?.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", (e) => {
        const val = item.getAttribute("data-value");
        if (hiddenInput) hiddenInput.value = val;
        if (selectedText) selectedText.textContent = item.textContent;
        genderDropdown.classList.remove("active");
    });
});

document.addEventListener("click", () => {
    genderDropdown?.classList.remove("active");
});

// password visiblity
window.togglePasswordVisibility = function (inputId, btnElement) {
    const passwordInput = document.getElementById(inputId);
    const icon = btnElement.querySelector('i');
    
    if (passwordInput && icon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
};
