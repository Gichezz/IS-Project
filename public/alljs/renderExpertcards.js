document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const selectedSkill = params.get('skill')?.toLowerCase().trim();
  const container = document.querySelector('.experts-container');
  const noResults = document.getElementById('no-results');

  // Function to clean skill string
  const cleanSkill = (skill) => {
    return skill.toString()
      .replace(/[\[\]'"\\]/g, '')
      .trim()
      .toLowerCase();
  };

  // Function to format skill title
  const formatSkillTitle = (skill) => {
    const cleaned = cleanSkill(skill);
    if (!cleaned) return '';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + ' Expert';
  };

  // STEP 1: Fetch and render experts
  fetch('/register-auth/expert-cards')
    .then(res => res.json())
    .then(experts => {
      experts.forEach(expert => {
  console.log('Raw skillDataAttr:', expert.skillDataAttr);

  let skills = [];

  if (Array.isArray(expert.skillDataAttr)) {
    skills = expert.skillDataAttr;
  } else if (typeof expert.skillDataAttr === 'string') {
    try {
      const parsed = JSON.parse(expert.skillDataAttr);
      if (Array.isArray(parsed)) {
        skills = parsed;
      } else {
        skills = expert.skillDataAttr.split(',').map(s => s.trim());
      }
    } catch (e) {
      skills = expert.skillDataAttr
        .replace(/[\[\]'"\\]/g, '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
  }

  console.log('Parsed skills:', skills);

        // Create a card for EACH skill
        skills.forEach(skill => {
          const skillClean = cleanSkill(skill);
          if (!skillClean) return;

          const card = document.createElement('div');
          card.className = 'expert-card fade-in';
          card.setAttribute('data-skill', skillClean);

          card.innerHTML = `
            <div class="expert-info">
              <img class="expert-img" src="${expert.image}" alt="${expert.name}">
              <div class="expert-details">
                <h5 class="expert-name">${expert.name}</h5>
                <h6 class="expert-skill">${formatSkillTitle(skill)}</h6>
                <span><i class="fa fa-map-marker-alt"></i> ${expert.location}</span>
                <span><i class="far fa-clock"></i> ${expert.time}</span>
                <span><i class="far fa-money-bill-alt"></i> Ksh${expert.price}</span>
              </div>
            </div>
            <div class="expert-actions">
              <div class="buttons">
                <a class="save-btn" href="#"><i class="far fa-heart"></i></a>
                <span class="like-count">0</span>
              </div>
              <small><i class="far fa-calendar-alt"></i> Available until: ${expert.availableUntil}</small>
              <a class="apply-btn" href="/payment.html?service=${encodeURIComponent(expert.name + ' - ' + formatSkillTitle(skill))}&amount=${expert.price}">Book Session</a>
            </div>
          `;

          container.appendChild(card);
        });
      });

      filterExpertsBySkill(selectedSkill);
    })
    .catch(err => console.error('Error:', err));

  function filterExpertsBySkill(skillToMatch) {
    const cards = container.querySelectorAll('.expert-card');
    let visible = 0;
    
    cards.forEach(card => {
      const skill = card.getAttribute('data-skill');
      if (!skillToMatch || skill === skillToMatch) {
        card.style.display = 'block';
        visible++;
      } else {
        card.style.display = 'none';
      }
    });
    
    if (noResults) noResults.style.display = visible ? 'none' : 'block';
  }
});