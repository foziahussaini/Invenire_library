import { db } from "../../js/firebase-config.js";
import { collection, getDocs } from "https://gstatic.com";

document.addEventListener("DOMContentLoaded", async () => {
    const bookDisplayContainer = document.querySelector(".books-list-container"); 
    
    // 1. Read the ?search=... parameter from the current URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchTarget = urlParams.get("search");

    try {
        const querySnapshot = await getDocs(collection(db, "book-list"));
        bookDisplayContainer.innerHTML = ""; // Clear existing grid layout values

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // 2. If a search parameter exists, ONLY show the matching book. Otherwise, list all books.
            if (searchTarget && data.book_name !== searchTarget) {
                return; // Skip books that don't match our redirect target
            }

            // Create your HTML UI layout cards for the matching item
            const bookCard = document.createElement("div");
            bookCard.className = "book-card";
            bookCard.innerHTML = `
                <img src="${data.cover_image || '../../assets/default-cover.png'}" alt="Book Cover">
                <h3>${data.book_name}</h3>
                <p>Author: ${data.author}</p>
                <p>Edition: ${data.edition}</p>
            `;
            bookDisplayContainer.appendChild(bookCard);
        });
    } catch (error) {
        console.error("Error rendering book elements:", error);
    }
});
