// Add this snippet inside your library.html initialization script!
// --- Mock Current Book Data ---
// In your real application, populate this object dynamically when a user clicks on a book
const currentBook = {
    id: "book_12345", // Unique book ID
    title: "The Great Adventure",
    author: "Jane Doe",
    pdfUrl: "https://example.com", // URL to the book PDF
    audioUrl: "https://example.com" // URL to the audiobook
};

// --- Mock Firebase Auth Setup ---
// Replace this with your actual Firebase/Firestore initialization logic if needed
const currentMemberId = "member_789"; // Replace with your active logged-in member ID

// --- DOM Element References ---
const readBtn = document.getElementById('details-read-btn');
const downloadBtn = document.getElementById('details-download-btn');
const libraryBtn = document.getElementById('details-library-btn');
const closeBtn = document.getElementById('book-details-close');

// --- 1. Read Book Action ---
// Saves the paths to localStorage and redirects the user to library.html
readBtn.addEventListener('click', () => {
    if (!currentBook.pdfUrl) {
        alert("No media links found for this book.");
        return;
    }
    
    // Save book media paths to local storage so library.html can access them
    localStorage.setItem('currentPdfUrl', currentBook.pdfUrl);
    localStorage.setItem('currentAudioUrl', currentBook.audioUrl || '');
    localStorage.setItem('currentBookTitle', currentBook.title);

    // Navigate to the library page
    window.location.href = 'library.html';
});

// --- 2. Download PDF Action ---
// Starts the background download, returns to the previous page, and moves an indicator to the corner
downloadBtn.addEventListener('click', () => {
    if (!currentBook.pdfUrl) return;

    // Create an anchor element programmatically to trigger the download
    const link = document.createElement('a');
    link.href = currentBook.pdfUrl;
    link.download = `${currentBook.title || 'Book'}.pdf`;
    link.target = '_blank'; // Fail-safe fallback if browser blocks auto-download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Create a floating badge at the bottom-right corner of the device viewport
    createFloatingDownloadSign();

    // Go back to the previous webpage after a minor delay
    setTimeout(() => {
        window.history.back();
    }, 800);
});

// Helper function to render a persistent download floating indicator
function createFloatingDownloadSign() {
    // Check if sign already exists to prevent duplicate UI spamming
    if (document.getElementById('floating-download-indicator')) return;

    const downloadSign = document.createElement('div');
    downloadSign.id = 'floating-download-indicator';
    downloadSign.innerHTML = `<i class="fa-solid fa-circle-down"></i>`;
    
    // Inline styling to sticky-dock it to the bottom right corner
    Object.assign(downloadSign.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#28a745',
        color: '#ffffff',
        padding: '12px 15px',
        borderRadius: '50%',
        fontSize: '20px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        zIndex: '9999',
        animation: 'pulse 1.5s infinite'
    });

    document.body.appendChild(downloadSign);
}

// --- 3. Add to Library Action (Firebase Firestore Integration) ---
// Saves to a member's subcollection dynamically and changes the icon to a checkmark/tick
libraryBtn.addEventListener('click', async () => {
    // UI Visual changes (Switch icon to checkmark tick and adjust text)
    const iconEl = libraryBtn.querySelector('i');
    const textEl = libraryBtn.querySelector('span');

    iconEl.className = 'fa-solid fa-circle-check'; // FontAwesome checkmark icon
    textEl.textContent = 'Added to Library';
    libraryBtn.style.backgroundColor = '#28a745'; // Optional green confirmation background
    libraryBtn.disabled = true; // Disable double clicks

    // --- Firebase Syncing Block ---
    try {
        // Ensuring Firebase dependencies (db / doc / setDoc) are globally reachable or imported
        if (typeof db !== 'undefined') {
            // Path references subcollection: members/{memberId}/library/{bookId}
            const docRef = doc(db, "members", currentMemberId, "library", currentBook.id);
            await setDoc(docRef, {
                bookId: currentBook.id,
                title: currentBook.title,
                author: currentBook.author,
                addedAt: new Date()
            });
            console.log("Book successfully saved to Firebase member subcollection!");
        } else {
            console.warn("Firebase Firestore 'db' object not loaded. UI state modified locally.");
        }
    } catch (error) {
        console.error("Error writing document to Firestore: ", error);
    }
});

// --- 4. Card Close Action (Optional) ---
closeBtn.addEventListener('click', () => {
    const card = document.querySelector('.book-details-card');
    if (card) card.style.display = 'none';
});

document.addEventListener("DOMContentLoaded", () => {
    // Check if the user arrived by clicking a dashboard progress card
    const targetDataRaw = sessionStorage.getItem("library-open-target");
    
    if (targetDataRaw) {
        // Clear the data pointer immediately so it doesn't open on random normal page loads
        sessionStorage.removeItem("library-open-target");
        
        try {
            const target = JSON.parse(targetDataRaw);
            console.log(`Arrived from progress grid. Target book ID: ${target.bookId}`);
            
            // Run a brief delayed loop check to wait until library book array renders completely
            const checkInterval = setInterval(() => {
                // Look for the specific card element matching the target ID
                const targetCard = document.querySelector(`.book-card[data-id="${target.bookId}"]`);
                
                if (targetCard) {
                    clearInterval(checkInterval); // Stop searching
                    
                    // Simulate a clean click interaction to fire your existing modal/details logic
                    targetCard.click(); 
                }
            }, 100);
            
            // Kill the searching fallback loop automatically after 3 seconds if data is missing
            setTimeout(() => clearInterval(checkInterval), 3000);
            
        } catch (err) {
            console.error("Failed parsing incoming dashboard library route pointers:", err);
        }
    }
});