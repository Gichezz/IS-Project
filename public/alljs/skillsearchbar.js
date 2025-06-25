const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const cards = document.querySelectorAll("#category-row > div");

    let visibleCount = 0;

    cards.forEach(card => {
        const link = card.querySelector("a");
        const title = link.querySelector("h3")?.textContent.toLowerCase() || "";
        const description = link.querySelector("p")?.textContent.toLowerCase() || "";

        if (title.includes(query) || description.includes(query)) {
            card.style.display = "block";
            visibleCount++;
        } else {
            card.style.display = "none";
        }
    });

    const noResults = document.getElementById("no-results");
    if (noResults) {
        if (visibleCount === 0) {
            noResults.style.display = "block";
        } else {
            noResults.style.display = "none";
        }
    }
});
//Filter experts based on skill passed
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const selectedSkill = params.get('skill')?.toLowerCase().trim();
  const cards = document.querySelectorAll('.expert-card');
  const noResults = document.getElementById('no-results');

  let visibleCount = 0;

  if (selectedSkill) {
    cards.forEach(card => {
      const cardSkill = card.dataset.skill?.toLowerCase().trim();
      if (cardSkill === selectedSkill) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }
});
