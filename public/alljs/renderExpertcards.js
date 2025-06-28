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

  // Function to parse skills from the database
  const parseSkills = (skillsString) => {
      if (!skillsString) return [];
      
      try {
          // Try to parse as JSON array first
          const parsed = JSON.parse(skillsString);
          if (Array.isArray(parsed)){ 
            return parsed.filter(s => typeof s === 'object' && s.skill_name && s.skill_id);
          }
      } catch (e) {
          // fallback: parse as string
          return skillsString.split(',').map(name => ({
            skill_name: name.trim(),
            skill_id: null
          })).filter(s => s.skill_name.length > 0);
      }
      
      return [];
  };

  // Fetch and render approved experts
  fetch('/register-auth/expert-cards')
    .then(res => res.json())
    .then(experts => {
      if (!experts.length) {
          noResults.style.display = 'block';
          return;
      }

      experts.forEach(expert => {
          const skills = parseSkills(expert.skillDataAttr);
          
          if (!skills.length) return; // Skip if no skills

          skills.forEach(skill => {
              const skillClean = cleanSkill(skill.skill_name);
              const skillId = skill.skill_id;
              if (!skillClean || !skillId) return;

              const card = document.createElement('div');
              card.className = 'expert-card fade-in';
              card.setAttribute('data-skill', skillClean);

              card.innerHTML = `
                  <div class="expert-info">
                      <img class="expert-img" src="${expert.image}" alt="${expert.name}">
                      <div class="expert-details">
                          <h5 class="expert-name">${expert.name}</h5>
                          <h6 class="expert-skill">${formatSkillTitle(skill.skill_name)}</h6>
                          <span><i class="far fa-clock"></i> ${expert.time}</span>
                          <span><i class="far fa-money-bill-alt"></i> Ksh${expert.price}</span>
                      </div>
                  </div>
                  <div class="expert-actions">
                      <div class="buttons">
                          <a class="save-btn" href="#"><i class="far fa-heart"></i></a>
                          <span class="like-count">0</span>
                      </div>
                      <a class="apply-btn" href="scheduleSession.html?expert=${encodeURIComponent(expert.name)}&expertId=${expert.id}&skill=${encodeURIComponent(skill.skill_name)}&skillId=${skillId}&amount=${expert.price}">Book Session</a>
                  </div>
              `;

              container.appendChild(card);
          });
      });

      filterExpertsBySkill(selectedSkill);
    })
    .catch(err => {
      console.error('Error loading experts:', err)
      noResults.style.display = 'block';
    });

  function filterExpertsBySkill(skillToMatch) {
    const cards = container.querySelectorAll('.expert-card');
    let visible = 0;
    
    cards.forEach(card => {
      const skill = card.getAttribute('data-skill');
      if (!skillToMatch || skill === skillToMatch) {
        card.style.display = 'flex';
        visible++;
      } else {
        card.style.display = 'none';
      }
    });
    
    if (noResults) noResults.style.display = visible ? 'none' : 'block';
  }
});