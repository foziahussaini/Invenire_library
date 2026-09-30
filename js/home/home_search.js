import { db } from "../../src/firebase-config.js"; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"; 

// ==================== 1. HARDCODED STATIC ARRAY FALLBACK DATA ====================
const fallbackBooks = [
    {
        id: "fallback-1",
        book_name: "The Alchemist",
        author: "Paulo Coelho",
        short_details: "A magical story about Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure.",
        cover_image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3QlePKNRgjnfKQ4zUh41M9x9RuykDDkrMQAS6ntOr_g&s=10",
        pdf_url: "../pdfs/crime-and-punishments.pdf",
        audio_url: "" 
    },
    {
        id: "fallback-2",
        book_name: "Her Eyes",
        author: "Bozorg Alavi",
        short_details: "کتاب چشم هایش رمانی از بزرگ علوی است که برای نخستین بار در سال ۱۳۳۱ خورشیدی منتشر شد. بزرگ علوی در این رمان قطعات پراکنده یک ماجرا را کنار هم گذاشته و از آن طرحی کلی آفریده است. این کتاب از آثار معدود زبان فارسی است که در مرکز آن یک زن با تمام عواطف و ارتعاشات روانی و ذهنی قرار گرفته است.",
        cover_image: "https://shstatics.shopipersia.com/wp-content/uploads/2020/07/s-l500-1-31.jpg",
        pdf_url: "../pdfs/hfuz_چشم_هایش_(بزرگ_علوی).pdf",
        audio_url: "/audioPlayer/her-eyes.mp3" 
    },
    {
        id: "fallback-3",
        book_name: "Crime and Punishment (Audiobook)",
        author: "Fyodor Dostoevsky",
        short_details: "An audio adaptation tracking the mental anguish and moral dilemmas of Rodion Raskolnikov, a poor ex-student in Saint Petersburg.",
        cover_image: "https://bing.net",
        pdf_url: "",
        audio_url: "#" 
    }
];

document.addEventListener("DOMContentLoaded", () => {
    loadRecentBooks();
});

// ==================== 2. FETCH & RENDER RECENT BOOKS FUNCTION ====================
async function loadRecentBooks() {
    const container = document.getElementById("recent-books");
    if (!container) return;

    try {
        // Querying your live Firestore database directly
        const querySnapshot = await getDocs(collection(db, "book-list"));
        container.innerHTML = "";

        if (querySnapshot.empty) {
            console.warn("Firestore collection is empty. Invoking hardcoded array fallback instead.");
            renderBooksList(fallbackBooks, container);
            return;
        }

        // Format raw Firestore document parameters safely into standard objects
        const dynamicBooks = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            dynamicBooks.push({
                id: doc.id,
                book_name: data.book_name || "Untitled Book",
                short_details: data.short_details || data.description || "No description provided.",
                cover_image: data.cover_image || data.image || "https://bing.net"
            });
        });

        renderBooksList(dynamicBooks, container);

    } catch (error) {
        console.error("Network or database connection issue detected. Loading local fallback records:", error);
        // Direct intercept fallback rendering trigger upon network drops
        renderBooksList(fallbackBooks, container);
    }
}

// ==================== 3. REUSABLE RENDERING ENGINE ====================
function renderBooksList(booksArray, targetContainer) {
    targetContainer.innerHTML = "";

    booksArray.forEach((book) => {
        const bookId = book.id;
        const title = book.book_name;
        const fullDescription = book.short_details;
        const coverImage = book.cover_image;

        const textLimit = 100;
        const isLongText = fullDescription.length > textLimit;
        
        const shortDescription = isLongText 
            ? fullDescription.substring(0, textLimit) + "..." 
            : fullDescription;
        
        const article = document.createElement("article");
        article.className = "book-cards card1";

        // FIXED: Using your modified <div class="book-name"> structure seamlessly
        article.innerHTML = `
            <div class="book-cover">
                <img src="${coverImage}" alt="${title} cover">
            </div>
            <div class="book-name">${title}</div>
            <bookdescription>
                <span class="desc-text">${shortDescription}</span>
                ${isLongText ? `<button type="button" class="toggle-desc-btn">Read More</button>` : ''}
            </bookdescription>
            <button class="book-detail-btn">View Details</button>
        `;

        // Handle text content sizing controllers
        if (isLongText) {
            const toggleBtn = article.querySelector(".toggle-desc-btn");
            const descTextSpan = article.querySelector(".desc-text");
            let isOpen = false;

            toggleBtn.addEventListener("click", (e) => {
                e.stopPropagation(); 
                isOpen = !isOpen;

                if (isOpen) {
                    descTextSpan.textContent = fullDescription;
                    toggleBtn.textContent = "Show Less";
                } else {
                    descTextSpan.textContent = shortDescription;
                    toggleBtn.textContent = "Read More";
                }
            });
        }

        // Action details redirection navigation trigger
        const detailsButton = article.querySelector(".book-detail-btn");
        detailsButton.addEventListener("click", () => {
            window.location.href = `about_book.html?id=${bookId}&title=${encodeURIComponent(title)}`;
        });

        targetContainer.appendChild(article);
    });
}
