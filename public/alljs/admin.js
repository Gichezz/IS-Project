document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const links = document.querySelectorAll('.admin-nav a');
    const sections = document.querySelectorAll('.content-section');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active tab
            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show selected section
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).style.display = 'block';
            
            // Refresh data when switching tabs
            if (targetId === 'expert-requests') {
                fetchPendingExperts();
            } else if (targetId === 'dashboard') {
                fetchDashboardStats();
            } else if (targetId === 'user-management') {
                fetchAllUsers();
            } else if (targetId === 'skill-approvals') {
                fetchSkills();
            }
        });
    });
    
    // Base API URL
    const API_BASE_URL = '/admin';
    
    // Fetch dashboard statistics
    const fetchDashboardStats = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/stats`);
            const data = await response.json();
            
            document.getElementById('pending-count').textContent = data.pendingExperts || 0;
            document.getElementById('experts-count').textContent = data.totalExperts || 0;
            
            if (data.recentActivities) {
                renderRecentActivities(data.recentActivities);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            alert('Failed to load dashboard data');
        }
    };
    
    // Fetch pending experts
    const fetchPendingExperts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/pending-experts`, {
                credentials: 'include' // Include session cookies
            });

            // First check if response is OK
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Parse the JSON response
            const experts = await response.json();

            if (!Array.isArray(experts)) {
                throw new Error("Expected array but got: " + typeof experts);
            }

            renderExpertRequests(experts);
        } catch (error) {
            console.error('Error fetching pending experts:', error);
            // Show user-friendly error
            document.getElementById('expertRequestsContainer').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Failed to load experts. Please refresh the page.
                </div>
            `;
        }
    };

    let allUsers = [];
    // Fetch all users for management
    const fetchAllUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, { 
                credentials: 'include' 
            });
            const users = await response.json();
            allUsers = users;
            renderUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            document.getElementById('usersContainer').innerHTML = `
                <div class="error-message">
                    Failed to load users. Please try again.
                </div>
            `;
        }
    };

    // Render users for management
    const renderUsers = (users) => {
        const container = document.getElementById('usersContainer');
        if (!container) return;
        
        container.innerHTML = users.map(user => `
            <div class="user-card">
                <h4>${user.name}</h4>
                <p>${user.email}</p>
                <p class="status-${getStatusClass(user.approved)}">
                    ${getStatusText(user.approved)} ${user.role.toUpperCase()}
                </p>
                <div class="user-actions">
                    ${user.approved !== 1 ? 
                        `<button class="activate-btn" data-id="${user.id}">Activate</button>` : 
                        `<button class="suspend-btn" data-id="${user.id}">Suspend</button>`
                    }
                    <button class="delete-btn" data-id="${user.id}">Delete</button>
                </div>
            </div>
        `).join('');
    };

    // Fetch All skills
    const fetchSkills = async (filter = 'pending') => {
        try {
            const response = await fetch(`${API_BASE_URL}/skills?filter=${filter}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const skills = await response.json();
            renderSkills(skills);
        } catch (error) {
            console.error('Error fetching pending skills:', error);
            document.getElementById('skillsContainer').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Failed to load skills. Please refresh the page.
                </div>
            `;
        }
    };

    // Render pending skills
    const renderSkills = (skills) => {
        const container = document.getElementById('skillsContainer');
        if (!container) return;
        
        if (!Array.isArray(skills)) {
            container.innerHTML = `
                <div class="error-message">
                    Invalid data received from server
                </div>
            `;
            return;
        }

        if (skills.length === 0) {
            container.innerHTML = '<p class="no-skills">No skills found</p>';
            return;
        }
        
        container.innerHTML = skills.map(skill => `
            <div class="skill-card">
                <div class="skill-info">
                    <h4>${skill.skill_name}</h4>
                    <p><strong>Expert:</strong> ${skill.expert_email}</p>
                    <p><strong>Rate:</strong> KES ${skill.hourly_rate}/hr</p>
                    <p><strong>Description:</strong> ${skill.description}</p>
                    <p class="status-${skill.status.toLowerCase()}">
                        ${skill.status.toUpperCase()}
                    </p>
                </div>
                    <div class="skill-actions">
                        ${skill.status !== 'Approved' ? `
                            <button class="approve-skill-btn" data-id="${skill.id}">Approve</button>
                        ` : ''}
                        ${skill.status !== 'Rejected' ? `
                            <button class="reject-skill-btn" data-id="${skill.id}">Reject</button>
                        ` : ''}
                    </div>
            </div>
        `).join('');
    };

    // Update skill status
    const updateSkillStatus = async (skillId, status, reason = '') => {
        try {
            const response = await fetch(`${API_BASE_URL}/skills/${skillId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reason }),
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Status update failed');
            
            const result = await response.json();
            if (result.success) {
                alert(`Skill ${status.toLowerCase()} successfully`);
                fetchSkills(); // Refresh the list
                fetchDashboardStats(); // Update dashboard counts
            } else {
                throw new Error(result.error || 'Failed to update skill status');
            }
        } catch (error) {
            console.error('Error updating skill status:', error);
            alert(`Failed to ${status.toLowerCase()} skill`);
        }
    };

    // Status helpers
    const getStatusText = (approved) => {
        switch(approved) {
            case 1: return 'ACTIVE';
            case 0: return 'PENDING';
            case -1: return 'DELETED';
            default: return 'UNKNOWN';
        }
    };

    const getStatusClass = (approved) => {
        switch(approved) {
            case 1: return 'active';
            case 0: return 'pending';
            case -1: return 'deleted';
            default: return '';
        }
    };
    
    // Render expert requests
    const renderExpertRequests = (experts) => {
        const container = document.getElementById('expertRequestsContainer');

        if (!Array.isArray(experts)) {
            container.innerHTML = `
                <div class="error-message">
                    Invalid data received from server
                </div>
            `;
            return;
        }
        if (experts.length === 0) {
            container.innerHTML = '<p>No pending expert requests</p>';
            return;
        }
        
        container.innerHTML = experts.map(expert => `
            <div class="request-card">
                <div class="request-info">
                    <h4>${expert.name}</h4>
                    <p><strong>Email:</strong> ${expert.email}</p>
                    <p><strong>Skills:</strong> ${formatSkills(expert.skills)}</p>
                    ${expert.description ? `<p><strong>Description:</strong> ${expert.description}</p>` : ''}
                    ${expert.files ? `<p><strong>Files:</strong> ${formatFiles(expert.files)}</p>` : ''}
                </div>
                <div class="request-actions">
                    <button class="approve-btn" data-id="${expert.id}">Approve</button>
                    <button class="reject-btn" data-id="${expert.id}">Reject</button>
                </div>
            </div>
        `).join('');
    };
    
    function formatSkills(skills) {
        try {
            // Handle both JSON arrays and comma-separated strings
            const skillsArray = Array.isArray(skills) ? skills 
                        : skills.startsWith('[') ? JSON.parse(skills) 
                        : skills.split(',');
            return skillsArray.map(skill => skill.trim().replace(/['"]/g, '')).join(', ');
        } catch {
            return skills; // Fallback to raw display if parsing fails
        }
    }

    function formatFiles(files) {
        return files.split(',').map(file => 
            `<a href="/uploads/${file.trim()}" target="_blank">${file.trim()}</a>`
        ).join(', ');
    }


    // Render recent activities
    const renderRecentActivities = (activities) => {
        const container = document.querySelector('#dashboard .recent-activities');
        if (!container) return;
        
        container.innerHTML = '<h3>Recent Activities</h3>';
        
        if (activities.length === 0) {
            container.innerHTML += '<p>No recent activities</p>';
            return;
        }
        
        const activitiesList = document.createElement('div');
        activitiesList.className = 'activities-list';
        
        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const icon = getActivityIcon(activity.type);
            const userInfo = activity.user_name 
                ? `${activity.user_name} (${activity.user_email})`
                : 'System';
            const time = new Date(activity.timestamp).toLocaleString();
            
            activityItem.innerHTML = `
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <p>${activity.description}</p>
                    <div class="activity-meta">
                        <span class="activity-type">${activity.type}</span>
                        <span class="activity-user">${userInfo}</span>
                        <span class="activity-time">${time}</span>
                    </div>
                </div>
            `;
            activitiesList.appendChild(activityItem);
        });
        
        container.appendChild(activitiesList);
    };
    
    // Helper function to get activity icon
    const getActivityIcon = (type) => {
        const icons = {
            'Expert Approved': '<i class="fas fa-user-check"></i>',
            'Expert Rejected': '<i class="fas fa-user-times"></i>',
            'New Registration': '<i class="fas fa-user-plus"></i>'
        };
        return icons[type] || '<i class="fas fa-info-circle"></i>';
    };
    
    // Handle all button clicks
    document.addEventListener('click', async function(e) {
        // Expert approval/rejection
        if (e.target.classList.contains('approve-btn')) {
            const id = e.target.getAttribute('data-id');
            await updateUserStatus(id, 'approve');
        }
        
        if (e.target.classList.contains('reject-btn')) {
            const id = e.target.getAttribute('data-id');
            await updateUserStatus(id, 'reject');
        }

        // User management
        if (e.target.classList.contains('activate-btn')) {
            const id = e.target.getAttribute('data-id');
            await updateUserStatus(id, 'activate');
        }

        if (e.target.classList.contains('suspend-btn')) {
            const id = e.target.getAttribute('data-id');
            await updateUserStatus(id, 'suspend');
        }

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Permanently mark this user as deleted?')) {
                const id = e.target.getAttribute('data-id');
                await updateUserStatus(id, 'delete');
            }
        }

        // Skill approval/rejection
        if (e.target.classList.contains('approve-skill-btn')) {
            if (confirm('Approve this skill?')) {
                const button = e.target.closest('.approve-skill-btn');
                const id = button.getAttribute('data-id');
                await updateSkillStatus(id, 'Approved');
            }
        }
        
        if (e.target.classList.contains('reject-skill-btn')) {
            const reason = prompt('Enter rejection reason (required):')
            if (reason) {
                const button = e.target.closest('.reject-skill-btn');
                const id = button.getAttribute('data-id');
                await updateSkillStatus(id, 'Rejected');
            } else {
                alert('Rejection reason is required.');
            }
        }
    });
    
    // Update User status function
    const updateUserStatus = async (userId, action) => {
        try {
            let status;
            switch(action) {
                case 'approve': status = 1; break;
                case 'reject': 
                case 'suspend': status = 0; break;
                case 'delete': status = -1; break;
                case 'activate': status = 1; break;
                default: throw new Error('Invalid action');
            }
            
            const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Status update failed');
            
            // Refresh relevant sections
            if (['approve', 'reject'].includes(action)) {
                fetchPendingExperts();
            }
            fetchDashboardStats();
            
            if (document.getElementById('user-management').style.display !== 'none') {
                fetchAllUsers();
            }
            
        } catch (error) {
            console.error('Error updating status:', error);
            alert(`Failed to ${action} user`);
        }
    };

    // Skill filter dropdown listener
    document.getElementById('skill-filter')?.addEventListener('change', (e) => {
        const filter = e.target.value; // 'pending', 'approved', 'rejected', 'all'
        fetchSkills(filter);
    });
    
    // Initialize dashboard
    fetchDashboardStats();

    // Logout functionality
    document.getElementById('logout-link')?.addEventListener('click', async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/logout', {
                method: 'GET',
                credentials: 'include' // Important for session cookies
            });
            
            if (response.redirected) {
                window.location.href = response.url; // Redirect to login page
            } else {
                const error = await response.text();
                console.error('Logout failed:', error);
                alert('Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Network error during logout.');
        }
    });
    // Search Filter function
    document.getElementById('userSearch').addEventListener('input', function (e) {
    const query = e.target.value.toLowerCase();

    const filtered = allUsers.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );

    renderUsers(filtered);
});
});