document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const selectedSkill = params.get('skill')?.toLowerCase().trim();
  const container = document.querySelector('.experts-container');
  const expertsGrid = document.querySelector('.experts-grid');
  const noResults = document.getElementById('no-results');
  
  // Determine if we're on home page (limited experts) or experts page (all experts)
  const isHomePage = window.location.pathname.includes('home.html') || 
                    (window.location.pathname === '/' || window.location.pathname === '/index.html');
  const maxExperts = isHomePage ? 6 : Infinity;

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
  fetch('/api/experts/cards')
    .then(res => res.json())
    .then(experts => {
      if (!experts.length) {
          if (noResults) noResults.style.display = 'block';
          return;
      }

      let expertCount = 0;
      const targetContainer = expertsGrid || container;

      experts.forEach(expert => {
          if (expertCount >= maxExperts) return; // Limit experts on home page
          
          const skills = parseSkills(expert.skillDataAttr);
          
          if (!skills.length) return; // Skip if no skills

          // On home page, only show first skill per expert
          const skillsToShow = isHomePage ? [skills[0]] : skills;

          skillsToShow.forEach(skill => {
              if (expertCount >= maxExperts) return; // Double check limit
              
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

              targetContainer.appendChild(card);
              expertCount++;
          });
      });

      filterExpertsBySkill(selectedSkill);
    })
    .catch(err => {
      console.error('Error loading experts:', err)
      noResults.style.display = 'block';
    });

  function filterExpertsBySkill(skillToMatch) {
    const cards = (expertsGrid || container).querySelectorAll('.expert-card');
    let visible = 0;
    
    if (!skillToMatch) {
      // Show all cards if no skill filter
      cards.forEach(card => {
        card.style.display = 'flex';
        visible++;
      });
    } else {
      // Map skill slugs to skill names for better matching
      const skillMapping = {
        'web-dev': 'web development',
        'web-app': 'web development',
        'web-app-development': 'web development',
        'ai': 'artificial intelligence',
        'artificial-intelligence': 'artificial intelligence',
        'crocheting': 'crochet',
        'crochet': 'crochet'
      };
      
      // Convert slug to skill name
      let skillName = skillToMatch.replace(/-/g, ' ');
      
      // Apply mapping if exists
      if (skillMapping[skillToMatch]) {
        skillName = skillMapping[skillToMatch];
      }
      
      cards.forEach(card => {
        const cardSkill = card.getAttribute('data-skill');
        // Check if the skill matches (case-insensitive)
        if (cardSkill && (
          cardSkill.includes(skillName) || 
          skillName.includes(cardSkill) ||
          cardSkill.includes(skillToMatch) ||
          skillToMatch.includes(cardSkill) ||
          cardSkill.replace(/\s+/g, '-') === skillToMatch ||
          skillToMatch.replace(/-/g, ' ') === cardSkill
        )) {
          card.style.display = 'flex';
          visible++;
        } else {
          card.style.display = 'none';
        }
      });
    }
    
    if (noResults) noResults.style.display = visible ? 'none' : 'block';
  }
});