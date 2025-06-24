//Skills signup tag management
document.addEventListener('DOMContentLoaded', function() {
    const skillsDropdown = document.getElementById('skills');
    const skillTagsContainer = document.getElementById('skillTagsContainer');
    const selectedSkillsInput = document.getElementById('selectedSkillsInput');

    if (skillsDropdown && skillTagsContainer && selectedSkillsInput) {
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

            selectedSkillsInput.value = JSON.stringify(selectedSkills);
        }

        skillTagsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('skill-tag-remove')) {
                const skillValue = e.target.getAttribute('data-value');
                selectedSkills = selectedSkills.filter(skill => skill !== skillValue);
                updateSkillTags();
            }
        });
    }
});
