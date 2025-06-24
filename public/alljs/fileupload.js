document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file');
    const fileArea = document.getElementById('file-area');

    if (fileInput && fileArea) {
        // Highlight drop area when item is dragged over it
        fileArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileArea.classList.add('highlight');
        });

        // Remove highlight when dragged item leaves
        fileArea.addEventListener('dragleave', () => {
            fileArea.classList.remove('highlight');
        });

        // Handle dropped files
        fileArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileArea.classList.remove('highlight');

            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;

                // Optional: Display file names
                const fileNames = Array.from(e.dataTransfer.files).map(file => file.name).join(', ');
                fileArea.querySelector('p').textContent = fileNames || 'Drag & drop files here or click to browse';

                // Optional: Trigger change event
                const event = new Event('change');
                fileInput.dispatchEvent(event);
            }
        });

        // Click to browse
        fileArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Regular file selection
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                const fileNames = Array.from(fileInput.files).map(file => file.name).join(', ');
                fileArea.querySelector('p').textContent = fileNames || 'Drag & drop files here or click to browse';
            }
        });
    }
});
