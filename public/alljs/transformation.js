const htransform=document.getElementById('web-name');
// Apply transformation automatically on page load
window.onload = () => {
    htransform.style.transition = "transform 0.3s ease"; // Smooth transition
    htransform.style.transform = "scale(1.1)"; // Slightly scale up
};
// Reset to original state after a delay (optional)
setTimeout(() => {
    htransform.style.transform = 'scale(1)'; // Return to original state after 1 second
}, 1200); // 4 second delay before resetting


const h2transformation=document.getElementsByTagName('h2');
 Array.from(h2transformation).forEach(h2transform =>{
    h2transform.addEventListener("mouseenter",() =>{
        h2transform.style.transition="transform 0.3s ease";
        // Ensure a smooth transition
        h2transform.style.transform="scale(1)";
        //ptransform.style.transform = "scale(1) 
    });

    h2transform.addEventListener('mouseleave', () => {
        // When the mouse leaves the card, scale it back to its original size (1)
        h2transform.style.transform = 'scale(0.9)';
    });
 });


 const h3transformation=document.getElementsByTagName('h3');
 Array.from(h3transformation).forEach(h3transform =>{
    h3transform.addEventListener("mouseenter",() =>{
        h3transform.style.transition="transform 0.3s ease";
        // Ensure a smooth transition
        h3transform.style.transform="scale(1)";
        //ptransform.style.transform = "scale(1) 
    });

    h3transform.addEventListener('mouseleave', () => {
        // When the mouse leaves the card, scale it back to its original size (1)
        h3transform.style.transform = 'scale(0.9)';
    });
 });


 document.addEventListener('DOMContentLoaded', function () {
    // Ensure Swiper library is loaded before initializing
    if (typeof Swiper !== "function") {
        console.error("Swiper library not loaded. Ensure you have included Swiper's JS and CSS files.");
        return;
    }

    const swiper = new Swiper('.swiper', {
        loop: true, // Infinite loop
        autoplay: {
            delay: 1000, // Auto-slide every 1 seconds
            disableOnInteraction: false, // Keeps autoplay running even after user interaction
        },
        speed: 800, // Smooth transition speed
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            320: {
                slidesPerView: 1,
                spaceBetween: 10,
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 30,
            },
        },
    });

    // Pause autoplay on hover
    const swiperContainer = document.querySelector('.swiper');
    if (swiperContainer) {
        swiperContainer.addEventListener('mouseenter', () => swiper.autoplay.stop());
        swiperContainer.addEventListener('mouseleave', () => swiper.autoplay.start());
    }
});




document.addEventListener('DOMContentLoaded', function() {
            const skillsDropdown = document.getElementById('skills');
            const skillTagsContainer = document.getElementById('skillTagsContainer');
            const selectedSkillsInput = document.getElementById('selectedSkillsInput');
            let selectedSkills = [];
            
            // Initialize from hidden input if needed
            if (selectedSkillsInput.value) {
                selectedSkills = JSON.parse(selectedSkillsInput.value);
                updateSkillTags();
            }
            
            skillsDropdown.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                
                if (selectedOption.value && !selectedSkills.includes(selectedOption.value)) {
                    selectedSkills.push(selectedOption.value);
                    updateSkillTags();
                }
                
                // Reset dropdown to default
                this.selectedIndex = 0;
            });
            
            function updateSkillTags() {
                skillTagsContainer.innerHTML = '';
                selectedSkills.forEach(skillValue => {
                    const skillOption = skillsDropdown.querySelector(`option[value="${skillValue}"]`);
                    if (skillOption) {
                        const tag = document.createElement('div');
                        tag.className = 'skill-tag';
                        tag.innerHTML = `
                            ${skillOption.text}
                            <span class="skill-tag-remove" data-value="${skillValue}">&times;</span>
                        `;
                        skillTagsContainer.appendChild(tag);
                    }
                });
                
                // Update hidden input with JSON array
                selectedSkillsInput.value = JSON.stringify(selectedSkills);
            }
            
            // Handle tag removal
            skillTagsContainer.addEventListener('click', function(e) {
                if (e.target.classList.contains('skill-tag-remove')) {
                    const skillValue = e.target.getAttribute('data-value');
                    selectedSkills = selectedSkills.filter(skill => skill !== skillValue);
                    updateSkillTags();
                }
            });
            
            });









//drag-and-drop file uploading for your HTML element:

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file');
    const fileArea = document.getElementById('file-area');

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
            
            // Optional: Trigger change event for other listeners
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    });

    // Click to browse functionality
    fileArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle regular file selection
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            const fileNames = Array.from(fileInput.files).map(file => file.name).join(', ');
            fileArea.querySelector('p').textContent = fileNames || 'Drag & drop files here or click to browse';
        }
    });
});
 

/*REVIEW  */
  
  document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault(); // prevent default link behavior
      
      const icon = btn.querySelector('i');
      const countSpan = btn.nextElementSibling; // the span with class like-count
      
      let count = parseInt(countSpan.textContent) || 0;

      // Toggle like (fill or unfill the heart)
      if (icon.classList.contains('far')) {
        // Currently empty heart, fill it and increment count
        icon.classList.remove('far');
        icon.classList.add('fas'); // solid heart
        count++;
      } else {
        // Currently filled heart, unfill it and decrement count
        icon.classList.remove('fas');
        icon.classList.add('far'); // empty heart
        count = count > 0 ? count - 1 : 0;
      }
      
      countSpan.textContent = count;
    });
  });


/*PAYMENT */
  document.getElementById('paymentForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show loading indicator
            document.getElementById('loadingIndicator').style.display = 'block';
            document.getElementById('payButton').disabled = true;
            
            // Get phone number
            const phoneNumber = document.getElementById('phone').value;
            
            // Simulate API call to M-Pesa
            setTimeout(function() {
                // Hide loading indicator
                document.getElementById('loadingIndicator').style.display = 'none';
                
                // Show success message
                document.getElementById('confirmationMessage').style.display = 'block';
                
                // In real implementation:
                // fetch('/api/process-payment', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({
                //         phone: phoneNumber,
                //         amount: {{Amount}},
                //         serviceId: {{ServiceID}},
                //         userId: {{UserID}}
                //     })
                // })
                // .then(handleResponse)
                // .catch(handleError);
                
            }, 2000);
        });