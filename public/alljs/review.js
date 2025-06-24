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

