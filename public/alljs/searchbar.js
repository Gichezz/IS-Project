const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function (){
    const query = this.value.toLowerCase();
    const cards = document.querySelectorAll(".expert-card");

    cards.forEach(card => {
        const name = card.querySelector(".expert-name").textContent.toLowerCase();
        const skill = card.querySelector(".expert-skill").textContent.toLowerCase();

        if (name.includes(query) || skill.includes(query)){
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
});

// Filter experts based on skill passed in the URL
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const selectedSkill = params.get('skill');

  document.body.classList.add('loaded');

  if (selectedSkill) {
    const cards = document.querySelectorAll('.expert-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const cardSkill = card.dataset.skill?.toLowerCase();

      if (cardSkill === selectedSkill.toLowerCase()) {
        card.style.display = 'flex';
        card.classList.add('fade-in');
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Show "no results" message if none are visible
    const noResults = document.getElementById('no-results');
    if (visibleCount === 0 && noResults) {
      noResults.style.display = 'block';
    } else if (noResults) {
      noResults.style.display = 'none';
    }
  }
});


