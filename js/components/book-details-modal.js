export function ensureBookDetailsModal() {
    if (document.getElementById("book-details-modal")) return;

    document.body.insertAdjacentHTML("beforeend", `
        <div class="book-details-modal" id="book-details-modal">
            <div class="book-details-card">
                <button type="button" class="book-details-close" id="book-details-close" aria-label="Close book details">&times;</button>
                <div class="book-details-top">
                    <div class="book-details-cover">
                        <img id="details-book-cover" src="" alt="Book cover">
                    </div>
                    <div class="book-details-right">
                        <div class="book-details-main">
                            <span class="book-details-genre" id="details-book-genre">Genre</span>
                            <h2 class="book-details-title" id="details-book-title">Book Title</h2>
                            <p class="book-details-author" id="details-book-author">Author Name</p>
                            <div class="book-details-rating" id="details-book-rating">
                                <span class="rating-stars" id="details-rating-stars">★★★★★</span>
                                <span class="rating-value" id="details-rating-value">0.0</span>
                            </div>
                        </div>
                        <div class="book-details-information">
                            <div class="book-info-item"><span class="book-info-label">Published</span><span class="book-info-value" id="details-book-published">—</span></div>
                            <div class="book-info-item"><span class="book-info-label">Pages</span><span class="book-info-value" id="details-book-pages">—</span></div>
                            <div class="book-info-item"><span class="book-info-label">Language</span><span class="book-info-value" id="details-book-language">—</span></div>
                            <div class="book-info-item"><span class="book-info-label">Genre</span><span class="book-info-value" id="details-book-genre-info">—</span></div>
                        </div>
                    </div>
                </div>
                <div class="book-details-description-section">
                    <span class="book-details-section-label">Description</span>
                    <p class="book-details-description" id="details-book-description">No description available.</p>
                </div>
                <div class="book-details-actions">
                    <button type="button" class="book-details-action-btn" id="details-read-btn"><i class="fa-solid fa-book-open"></i><span>Read Book</span></button>
                    <button type="button" class="book-details-action-btn" id="details-download-btn"><i class="fa-solid fa-download"></i><span>Download PDF</span></button>
                    <button type="button" class="book-details-action-btn" id="details-library-btn"><i class="fa-solid fa-bookmark"></i><span>Add to Library</span></button>
                </div>
            </div>
        </div>
    `);
}
