import { auth } from "../../src/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { db } from "../../src/firebase-config.js";
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
    const loginBtn = document.querySelector(".login-btn");
    const signupBtn = document.querySelector(".signup-btn");
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is logged in:", user.email);

        loginBtn?.style.setProperty("display", "none");
        signupBtn?.style.setProperty("display", "none");
    } else {
        console.log("No user is logged in.");
        loginBtn?.style.removeProperty("display");
        signupBtn?.style.removeProperty("display");
    }
});
    const dashboardLink = document.getElementById("dashboard-link");

    const dashboardModal = document.getElementById("dashboardModal");
    const dashboardModalClose = document.getElementById("dashboardModalClose");

    dashboardLink?.addEventListener("click", (e) => {
        e.preventDefault();

        if (auth.currentUser) {
            window.location.href = "user_dashboard.html";
        } else {
            dashboardModal.style.display = "flex";
        }
    });

    dashboardModalClose?.addEventListener("click", () => {
        dashboardModal.style.display = "none";
    });

    dashboardModal?.addEventListener("click", (e) => {
        if (e.target === dashboardModal) {
            dashboardModal.style.display = "none";
        }
    });


// =================================DROPDOWN FOR THEME AND LANGUAGE===============================
    const langBtn = document.getElementById('langDropdownBtn');
    const langMenu = document.getElementById('langDropdownMenu');
    const selectedLangText = document.getElementById('selected-lang');
    const langHiddenInput = document.getElementById('langHiddenInput');
    
    const themeBtn = document.getElementById('themeDropdownBtn');
    const themeMenu = document.getElementById('themeDropdownMenu');
    const selectedThemeText = document.getElementById('selected-theme');
    const themeHiddenInput = document.getElementById('themeHiddenInput');

// ========== Helper function to clear all active dropdowns safely ===================
    function closeAllMenus() {
        if (langMenu && langBtn) {
            langMenu.classList.remove('show');
            langBtn.classList.remove('active');
        }
        if (themeMenu && themeBtn) {
            themeMenu.classList.remove('show');
            themeBtn.classList.remove('active');
        }
    }

    //  =================== THEME DROPDOWN LOGIC ======================
    if (themeBtn && themeMenu) {
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const isMenuOpen = themeMenu.classList.contains('show');
            closeAllMenus(); 
            if (!isMenuOpen) {
                themeMenu.classList.add('show');
                themeBtn.classList.add('active');
            }
        });

        themeMenu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', (e) => {
                const selectedTheme = e.currentTarget.getAttribute('data-value');
                const visibleText = e.currentTarget.textContent;
                
                if (selectedThemeText) selectedThemeText.textContent = visibleText;
                if (themeHiddenInput) themeHiddenInput.value = selectedTheme;
                document.documentElement.setAttribute('data-theme', selectedTheme);
                
                closeAllMenus();
            });
        });
    }

    // ====================== LANGUAGE DROPDOWN LOGIC ======================
    if (langBtn && langMenu) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const isMenuOpen = langMenu.classList.contains('show');
            closeAllMenus(); 
            if (!isMenuOpen) {
                langMenu.classList.add('show');
                langBtn.classList.add('active');
            }
        });

        langMenu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', (e) => {
               const selectedLang = e.currentTarget.getAttribute('value');
                const visibleText = e.currentTarget.textContent;
                
                if (selectedLangText) selectedLangText.textContent = visibleText;
                if (langHiddenInput) langHiddenInput.value = selectedLang;
                window.changeLanguage(selectedLang);
                
                closeAllMenus();
            });
        });
    }

    // ====================== EVENT ======================
    document.addEventListener('click', () => {
        closeAllMenus();
    });


    // ======================NAVBAR ITEMS ACTIVE AND CLICK EVENT=====================
    const navLinks = document.querySelectorAll('.nav-list .nav-item');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');

            if (targetId.startsWith('#')) {
                e.preventDefault(); 
                
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    // Offset math handles your 80px high navbar perfectly
                    const headerOffset = 80;
                    const elementPosition = targetSection.getBoundingClientRect().top + window.scrollY;
                    const offsetPosition = elementPosition - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Instantly visually swap classes upon click selection
                    navLinks.forEach(item => item.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    });

//  ==============================SCROLLING TO SELECTED SECTION======================================
    const sections = document.querySelectorAll('#home, #about, #explore');

    window.addEventListener('scroll', () => {
        let currentActiveId = "#home"; 

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const headerCushion = 100; 
            
            if (window.scrollY >= (sectionTop - headerCushion)) {
                currentActiveId = `#${section.id}`;
            }
        });

        // Loop and sync active classes during scrolling
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentActiveId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    });
    
//=========================== hero text animated (SUBTITLE TEXT)============================================
// Add this directly into your existing DOMContentLoaded event listener block
const subtitleElement = document.querySelector(".hero-subtitle");

// 1. YOUR CUSTOM PHRASES ARRAY
const subtitles = [
    "Read Explore Discover Yourself",
    "Unlock Stories That Shape Your World",
    "Your Next Literary Adventure Awaits"
];

let currentIndex = 0;

function rotateSubtitles() {
    if (!subtitleElement) return;

    // Phase A: Slide the old text out to the left edge safely
    subtitleElement.classList.add("slide-to-left");

    // Wait for the exit slide animation to finish completely (600ms matching CSS transition)
    setTimeout(() => {
        // Increment index pointer safely through the loop bounds
        currentIndex = (currentIndex + 1) % subtitles.length;
        
        // Swap out the text contents while invisible
        subtitleElement.textContent = subtitles[currentIndex];

        // Instantly snap the position back to the right boundary invisibly
        subtitleElement.classList.remove("slide-to-left");
        subtitleElement.classList.add("slide-from-right");

        // Force browser layout repaint recalculation to ensure position register
        void subtitleElement.offsetWidth;

        // Phase B: Slide smoothly back into the active central viewport area
        subtitleElement.classList.remove("slide-from-right");
    }, 600); 
}
// ==================== FEEDBACK FORM ====================

const feedbackForm = document.getElementById("feedback-form");

if (feedbackForm) {
    feedbackForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("feedback-name")?.value.trim();
        const email = document.getElementById("feedback-email")?.value.trim();
        const message = document.getElementById("feedback-message")?.value.trim();
        const rating = Number(
            document.getElementById("feedback-rating-value")?.value || 0
        );

        if (!name || !email || !message || rating === 0) {
            alert("Please complete all fields and select a rating.");
            return;
        }

        try {
            await addDoc(collection(db, "feedback"), {
                name,
                email,
                message,
                rating,
                createdAt: serverTimestamp()
            });

            alert("Thank you! Your feedback has been submitted.");

            feedbackForm.reset();

            const ratingValue =
                document.getElementById("feedback-rating-value");

            if (ratingValue) {
                ratingValue.value = "0";
            }

        } catch (error) {
            console.error("FEEDBACK SUBMIT ERROR:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);

            alert(
                `Something went wrong.\n\n${error.code || ""}\n${error.message || ""}`
            );
            }           
    });
}

// ==================== FEEDBACK RATING ====================

const feedbackStars = document.querySelectorAll(
    "#feedback-stars button"
);

const feedbackRatingValue = document.getElementById(
    "feedback-rating-value"
);

feedbackStars.forEach((star) => {

    star.addEventListener("click", () => {

        const selectedRating =
            Number(star.dataset.rating);

        feedbackRatingValue.value = selectedRating;

        feedbackStars.forEach((item) => {

            const itemRating =
                Number(item.dataset.rating);

            item.textContent =
                itemRating <= selectedRating
                    ? "★"
                    : "☆";
        });
    });

});
// Automatically trigger a phrase swap every 5 seconds (5000 milliseconds)
setInterval(rotateSubtitles, 5000);

// ==================== LIBRARY STATS ====================

const booksCount = document.getElementById("books-count");
const membersCount = document.getElementById("members-count");
const categoriesCount = document.getElementById("categories-count");
const satisfactionRate = document.getElementById("satisfaction-rate");

function updateStat(element, value) {
    if (element) {
        element.textContent = value;
    }
}

// Stats data will be connected to Firebase
// after the final Firestore collections are confirmed.

function setDefaultStats() {
    updateStat(booksCount, 0);
    updateStat(membersCount, 0);
    updateStat(categoriesCount, 0);
    updateStat(satisfactionRate, 0);
}

setDefaultStats();

