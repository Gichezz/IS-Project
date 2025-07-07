// Dynamic Skills Loading
document.addEventListener('DOMContentLoaded', function() {
    loadAvailableSkills();
});

// Function to load available skills from database
async function loadAvailableSkills() {
    try {
        const response = await fetch('/api/skills/available');
        if (!response.ok) {
            throw new Error('Failed to fetch skills');
        }
        
        const skills = await response.json();
        
        // Update skills on different pages based on current page
        const currentPage = window.location.pathname.split('/').pop();
        
        if (currentPage === 'home.html' || currentPage === '') {
            updateHomePageSkills(skills);
        } else if (currentPage === 'skills.html') {
            updateSkillsPageSkills(skills);
        } else if (currentPage === 'experts.html') {
            // Experts page doesn't need skill cards, but we can update search if needed
            updateExpertsPageSkills(skills);
        }
        
    } catch (error) {
        console.error('Error loading skills:', error);
        // Fallback to static skills if API fails
        loadStaticSkills();
    }
}

// Update home page skills
function updateHomePageSkills(skills) {
    const categoryRow = document.getElementById('category-row');
    if (!categoryRow) return;
    
    // Clear existing static content
    categoryRow.innerHTML = '';
    
    if (skills.length === 0) {
        categoryRow.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">No skills available at the moment.</p>';
        return;
    }
    
    // Add dynamic skill cards (limit to 8 for home page)
    const limitedSkills = skills.slice(0, 8);
    
    limitedSkills.forEach(skill => {
        const card = createSkillCard(skill, 'home');
        categoryRow.appendChild(card);
    });
}

// Update skills page skills
function updateSkillsPageSkills(skills) {
    const categoryRow = document.getElementById('category-row');
    const noResults = document.getElementById('no-results');
    if (!categoryRow) return;
    
    // Clear existing static content
    categoryRow.innerHTML = '';
    
    if (skills.length === 0) {
        if (noResults) {
            noResults.style.display = 'block';
        }
        return;
    }
    
    if (noResults) {
        noResults.style.display = 'none';
    }
    
    // Add all dynamic skill cards
    skills.forEach(skill => {
        const card = createSkillCard(skill, 'skills');
        categoryRow.appendChild(card);
    });
}

// Update experts page (mainly for search functionality)
function updateExpertsPageSkills(skills) {
    // This could be used to populate search suggestions or filters
    // For now, we'll just store the skills data for potential use
    window.availableSkills = skills;
}

// Create a skill card element
function createSkillCard(skill, pageType) {
    const card = document.createElement('div');
    card.className = 'card';
    
    // Get icon based on skill name
    const icon = getSkillIcon(skill.name);
    
    // Create different content based on page type
    if (pageType === 'home') {
        card.innerHTML = `
            <a href="experts.html?skill=${encodeURIComponent(skill.slug)}">
                <i class="${icon}"></i>
                <h3>${skill.name}</h3>
                <p>${skill.expert_count} SkillShares</p>
            </a>
        `;
    } else if (pageType === 'skills') {
        card.innerHTML = `
            <a href="experts.html?skill=${encodeURIComponent(skill.slug)}" aria-label="${skill.name} Course">
                <i class="${icon}"></i>
                <h3>${skill.name}</h3>
                <p>${getSkillDescription(skill.name)}</p>
                <ul>
                    <li>${skill.expert_count} expert${skill.expert_count !== 1 ? 's' : ''} available</li>
                    <li>Average rate: Ksh ${skill.avg_rate}/hr</li>
                    <li>Flexible scheduling</li>
                </ul>
            </a>
        `;
    }
    
    return card;
}

// Get appropriate icon for skill
function getSkillIcon(skillName) {
    const skillNameLower = skillName.toLowerCase();
    
    if (skillNameLower.includes('web') || skillNameLower.includes('development') || skillNameLower.includes('programming')) {
        return 'fa-solid fa-laptop-code';
    } else if (skillNameLower.includes('ai') || skillNameLower.includes('artificial intelligence') || skillNameLower.includes('machine learning')) {
        return 'fa-solid fa-robot';
    } else if (skillNameLower.includes('baking') || skillNameLower.includes('cooking')) {
        return 'fa-solid fa-bread-slice';
    } else if (skillNameLower.includes('painting') || skillNameLower.includes('art')) {
        return 'fa-solid fa-palette';
    } else if (skillNameLower.includes('music')) {
        return 'fa-solid fa-guitar';
    } else if (skillNameLower.includes('drawing')) {
        return 'fa-solid fa-pencil';
    } else if (skillNameLower.includes('crochet') || skillNameLower.includes('knitting')) {
        return 'fa-solid fa-shirt';
    } else if (skillNameLower.includes('robotics')) {
        return 'fa-solid fa-robot';
    } else {
        return 'fa-solid fa-star'; // Default icon
    }
}

// Get skill description
function getSkillDescription(skillName) {
    const skillNameLower = skillName.toLowerCase();
    
    if (skillNameLower.includes('web') || skillNameLower.includes('development')) {
        return 'Full-stack web application development';
    } else if (skillNameLower.includes('ai') || skillNameLower.includes('artificial intelligence')) {
        return 'Introduction to machine learning and neural networks';
    } else if (skillNameLower.includes('baking')) {
        return 'Professional baking techniques and pastry arts';
    } else if (skillNameLower.includes('painting')) {
        return 'Various techniques across multiple mediums';
    } else if (skillNameLower.includes('music')) {
        return 'Comprehensive music education program';
    } else if (skillNameLower.includes('drawing')) {
        return 'Fundamental to advanced drawing techniques';
    } else if (skillNameLower.includes('crochet')) {
        return 'Fiber arts and textile creation';
    } else if (skillNameLower.includes('robotics')) {
        return 'Design, programming and automation systems';
    } else {
        return 'Professional skill development and training';
    }
}

// Fallback to static skills if API fails
function loadStaticSkills() {
    const staticSkills = [
        { name: 'AI', slug: 'artificial-intelligence', expert_count: 5, avg_rate: 3000 },
        { name: 'Baking', slug: 'baking', expert_count: 8, avg_rate: 1500 },
        { name: 'Robotics', slug: 'robotics', expert_count: 3, avg_rate: 4000 },
        { name: 'Painting', slug: 'painting', expert_count: 6, avg_rate: 2000 },
        { name: 'Music', slug: 'music', expert_count: 7, avg_rate: 2500 },
        { name: 'Web Development', slug: 'web-app-development', expert_count: 10, avg_rate: 3500 },
        { name: 'Drawing', slug: 'drawing', expert_count: 4, avg_rate: 1800 },
        { name: 'Crocheting', slug: 'crocheting', expert_count: 3, avg_rate: 1200 }
    ];
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'home.html' || currentPage === '') {
        updateHomePageSkills(staticSkills);
    } else if (currentPage === 'skills.html') {
        updateSkillsPageSkills(staticSkills);
    }
} 