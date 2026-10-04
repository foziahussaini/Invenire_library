document.querySelectorAll('.head-title a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent page jumping

        // 1. Manage Active Tab Highlight
        document.querySelectorAll('.head-title a').forEach(item => item.classList.remove('active'));
        this.classList.add('active');

        // 2. Manage Active Box Display
        const targetId = this.getAttribute('href'); // Gets something like '#personal'
        
        document.querySelectorAll('.setting-body-content .box').forEach(box => {
            box.classList.remove('active');
        });
        
        // Find the target box element and show it
        document.querySelector(targetId).classList.add('active');
    });
});
