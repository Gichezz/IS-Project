document.addEventListener('DOMContentLoaded', function() {
    // Fetch expert notifications
    const fetchNotifications = async () => {
        try {
            const response = await fetch(`/api/expert/notifications`, {
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            console.error('Notification error:', error);
            return [];
        }
    };

    // Render notifications
    const renderNotifications = (notifications) => {
        if (!notificationsPanel || !Array.isArray(notifications)) {
            notificationsPanel.innerHTML = '<p>No notifications</p>';
            if (notificationBadge) notificationBadge.style.display = 'none';
            return;
        }
        
        notificationsPanel.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.is_read ? '' : 'unread'}" data-id="${notif.id}">
                <p>${notif.message}</p>
                <small>${new Date(notif.created_at).toLocaleString()}</small>
            </div>
        `).join('');

        // Update badge
        const unreadCount = notifications.filter(n => !n.is_read).length;
        if (notificationBadge) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        await fetch(`/api/expert/notifications/${notificationId}/read`, {
            method: 'PUT',
            credentials: 'include'
        });
    };

    // Load and display notifications
    const loadNotifications = async () => {
        const notifications = await fetchNotifications();
        renderNotifications(notifications);
    };

    // Initialize functions
    function initDashboard() {
        // Load initial data
        loadSessionRequests();
        loadExpertSkills();
        loadPendingSkills();
        loadFeedback();
        loadNotifications();
        setInterval(loadNotifications, 30000); // Refresh every 30s
        
        // Show the active section
        const activeSection = document.querySelector('.sidebar-nav li.active');
        if (activeSection) {
            showSection(activeSection.getAttribute('data-section'));
        } else {
            showSection('sessions');
        }
        // Add event listener for cancel buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('cancel-skill') || e.target.closest('.cancel-skill')) {
                const skillId = e.target.closest('.skill-card').getAttribute('data-skill-id');
                cancelSkillRequest(skillId);
            }
        });    
    }

    // File Upload Handling
    const dropzone = document.getElementById('skill-proof-dropzone');
    const fileInput = document.getElementById('skill-proof');
    const filePreview = document.getElementById('file-preview');

    // Notification elements
    const notificationBell = document.getElementById('notification-bell');
    const notificationBadge = document.getElementById('notification-badge');
    const notificationsPanel = document.getElementById('notifications-panel');

    // Get the current expert ID
    const expertId = document.body.getAttribute('data-expert-id') || 1; // Default to 1 for demo
    
    // DOM Elements
    const sections = {
        sessions: document.getElementById('sessions-section'),
        skills: document.getElementById('skills-section'),
        pendingSkills: document.getElementById('pending-skills-section'),
        feedback: document.getElementById('feedback-section')
    };
    
    const navLinks = document.querySelectorAll('.sidebar-nav li[data-section]');
    const sessionFilter = document.getElementById('session-filter');
    const feedbackFilter = document.getElementById('feedback-filter');
    const addSkillBtn = document.getElementById('add-skill-btn');
    const addSkillTrigger = document.getElementById('add-skill-trigger');
    const skillModal = document.getElementById('skill-modal');
    const skillForm = document.getElementById('skill-form');
    const sessionModal = document.getElementById('session-modal');
    const feedbackModal = document.getElementById('feedback-modal');
    
    
    // Event Listeners
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    sessionFilter.addEventListener('change', filterSessions);
    feedbackFilter.addEventListener('change', filterFeedback);
    
    if (addSkillBtn) addSkillBtn.addEventListener('click', showSkillModal);
    if (addSkillTrigger) addSkillTrigger.addEventListener('click', showSkillModal);
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Click to select files
    dropzone.addEventListener('click', () => fileInput.click());

    // Handle file selection
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            updateFilePreview();
        }
    });
    
    // Simple drag-and-drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('active');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('active');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('active');
        fileInput.files = e.dataTransfer.files;
        updateFilePreview();
    });
    
    // Update preview function
    function updateFilePreview() {
        filePreview.innerHTML = '';
        
        Array.from(fileInput.files).forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button class="remove-file" data-index="${index}">&times;</button>
                    `;
                };
                reader.readAsDataURL(file);
            } else {
                previewItem.innerHTML = `
                    <i class="fas fa-file-pdf"></i>
                    <small>${file.name}</small>
                    <button class="remove-file" data-index="${index}">&times;</button>
                `;
            }
            
            filePreview.appendChild(previewItem);
        });
    }

    // Remove file function
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-file')) {
            const index = e.target.getAttribute('data-index');
            removeFile(index);
        }
    });

    function removeFile(index) {
        const files = Array.from(fileInput.files);
        files.splice(index, 1);
        
        // Create new FileList (since we can't modify directly)
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
        
        updateFilePreview();
    }

    // Notification bell click
    if (notificationBell) {
        notificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsPanel.classList.toggle('visible');
        });
    }

    // Mark as read when clicked
    document.addEventListener('click', (e) => {
        const notifItem = e.target.closest('.notification-item');
        if (notifItem && notifItem.classList.contains('unread')) {
            markAsRead(notifItem.dataset.id);
            notifItem.classList.remove('unread');
            notificationBadge.textContent = parseInt(notificationBadge.textContent) - 1;
        }
        
        // Close panel when clicking outside
        if (!e.target.closest('#notifications-panel') && 
            !e.target.closest('#notification-bell')) {
            notificationsPanel.classList.remove('visible');
        }
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    
    
    function showSection(section) {
        // Hide all sections
        Object.values(sections).forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Show the selected section
        if (sections[section]) {
            sections[section].classList.add('active');
        }
        
        // Update active nav link
        navLinks.forEach(link => {
            if (link.getAttribute('data-section') === section) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Session Request Functions
    function loadSessionRequests() {
        fetch(`/api/expert/session-requests?expert_id=${expertId}`)
            .then(response => response.json())
            .then(data => {
                const sessionCards = document.querySelector('.session-cards');
                sessionCards.innerHTML = ''; // Clear existing cards
                
                if (data.length === 0) {
                    sessionCards.innerHTML = '<p class="no-sessions">No session requests found.</p>';
                    return;
                }
                
                data.forEach(session => {
                    const sessionCard = createSessionCard(session);
                    sessionCards.appendChild(sessionCard);
                });
                
                // Add event listeners to the new buttons
                addSessionEventListeners();
            })
            .catch(error => {
                console.error('Error loading session requests:', error);
                showError('Failed to load session requests. Please try again.');
            });
    }
    
    function createSessionCard(session) {
        const card = document.createElement('div');
        card.className = `session-card ${session.status}`;
        card.setAttribute('data-session-id', session.id);
        
        const statusBadgeClass = session.status === 'rejected' ? 'declined' : session.status;
        
        let actionsHtml = '';
        if (session.status === 'pending') {
            actionsHtml = `
                <button class="btn accept-btn"><i class="fas fa-check"></i> Accept</button>
                <button class="btn reject-btn"><i class="fas fa-times"></i> Decline</button>
            `;
        } else if (session.status === 'accepted') {
            actionsHtml = `
                <button class="btn start-btn"><i class="fas fa-video"></i> Start Session</button>
                <button class="btn reschedule-btn"><i class="fas fa-calendar-alt"></i> Reschedule</button>
            `;
        } else if (session.status === 'completed') {
            actionsHtml = `
                <button class="btn feedback-btn"><i class="fas fa-eye"></i> View Feedback</button>
            `;
        }
        
        card.innerHTML = `
            <div class="card-header">
                <h3>${session.skill_requested}</h3>
                <span class="status-badge ${statusBadgeClass}">${session.status}</span>
            </div>
            <div class="card-body">
                <div class="session-details">
                    <p><i class="fas fa-user"></i> <strong>Student:</strong> ${session.student_email}</p>
                    <p><i class="fas fa-clock"></i> <strong>Time:</strong> ${formatDateTime(session.requested_time)}</p>
                    ${session.description ? `<p><i class="fas fa-sticky-note"></i> <strong>Notes:</strong> ${session.description}</p>` : ''}
                    ${session.status === 'completed' ? `<p><i class="fas fa-star"></i> <strong>Rating:</strong> ${session.rating || 'Not rated yet'}</p>` : ''}
                </div>
                <div class="session-actions">
                    ${actionsHtml}
                </div>
            </div>
        `;
        
        return card;
    }
    
    function addSessionEventListeners() {
        // Accept session
        document.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const sessionId = this.closest('.session-card').getAttribute('data-session-id');
                updateSessionStatus(sessionId, 'accepted');
            });
        });
        
        // Reject session
        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const sessionId = this.closest('.session-card').getAttribute('data-session-id');
                updateSessionStatus(sessionId, 'rejected');
            });
        });
        
        // Start session
        document.querySelectorAll('.start-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const sessionId = this.closest('.session-card').getAttribute('data-session-id');
                startSession(sessionId);
            });
        });
        
        // Reschedule session
        document.querySelectorAll('.reschedule-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const sessionId = this.closest('.session-card').getAttribute('data-session-id');
                rescheduleSession(sessionId);
            });
        });
        
        // View feedback
        document.querySelectorAll('.feedback-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const sessionId = this.closest('.session-card').getAttribute('data-session-id');
                viewSessionFeedback(sessionId);
            });
        });
    }
    
    function updateSessionStatus(sessionId, status) {
        fetch(`/api/expert/session-requests/${sessionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: status,
                expert_id: expertId
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to update session');
            return response.json();
        })
        .then(() => {
            loadSessionRequests();
            showSuccess(`Session ${status} successfully`);
        })
        .catch(error => {
            console.error('Error updating session:', error);
            showError('Failed to update session status. Please try again.');
        });
    }
    
    function startSession(sessionId) {
        // In a real app, this would connect to your video chat system
        showModal('Redirecting to session...', 'Starting Session', sessionModal);
        
        // Simulate session completion after 3 seconds (for demo)
        setTimeout(() => {
            markSessionAsCompleted(sessionId);
        }, 3000);
    }
    
    function markSessionAsCompleted(sessionId) {
        fetch(`/api/expert/session-requests/${sessionId}/complete`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                expert_completed: true
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to mark session as completed');
            return response.json();
        })
        .then(data => {
            if (data.payment_processed) {
                showSuccess('Session completed and payment processed!');
            } else {
                showSuccess('Session marked as completed. Payment will be processed when student confirms.');
            }
            loadSessionRequests();
            closeModal();
        })
        .catch(error => {
            console.error('Error completing session:', error);
            showError('Failed to complete session. Please try again.');
        });
    }
    
    function rescheduleSession(sessionId) {
        // In a real app, this would open a calendar/rescheduling interface
        const newTime = prompt('Enter new date and time (YYYY-MM-DD HH:MM):');
        if (newTime) {
            fetch(`/api/expert/session-requests/${sessionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requested_time: newTime
                })
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to reschedule session');
                return response.json();
            })
            .then(() => {
                loadSessionRequests();
                showSuccess('Session rescheduled successfully');
            })
            .catch(error => {
                console.error('Error rescheduling session:', error);
                showError('Failed to reschedule session. Please try again.');
            });
        }
    }
    
    function viewSessionFeedback(sessionId) {
        fetch(`/api/expert/session-requests/${sessionId}/feedback`)
            .then(response => response.json())
            .then(feedback => {
                if (feedback) {
                    const feedbackHtml = `
                        <div class="feedback-details">
                            <div class="feedback-header">
                                <div class="student-info">
                                    <div class="avatar-small"><i class="fas fa-user"></i></div>
                                    <div>
                                        <h4>${feedback.student_email}</h4>
                                        <div class="rating">
                                            ${generateStarRating(feedback.rating)}
                                            <span>${feedback.rating}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="feedback-date">${formatDate(feedback.created_at)}</div>
                            </div>
                            <div class="feedback-content">
                                <p>"${feedback.comments}"</p>
                            </div>
                            <div class="feedback-skill">
                                <span class="skill-tag">${feedback.skill_name}</span>
                            </div>
                        </div>
                    `;
                    
                    document.querySelector('#feedback-modal .modal-body').innerHTML = feedbackHtml;
                    feedbackModal.classList.add('active');
                } else {
                    showError('No feedback found for this session.');
                }
            })
            .catch(error => {
                console.error('Error loading feedback:', error);
                showError('Failed to load feedback. Please try again.');
            });
    }
    
    function filterSessions() {
        const filterValue = sessionFilter.value;
        const sessionCards = document.querySelectorAll('.session-card');
        
        sessionCards.forEach(card => {
            if (filterValue === 'all' || card.classList.contains(filterValue)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Skills Functions
    function loadExpertSkills() {
        fetch(`/api/expert/skills?expert_id=${expertId}`)
            .then(response => response.json())
            .then(skills => {
                const skillsGrid = document.querySelector('.skills-grid');
                // Keep the add skill card
                const addSkillCard = skillsGrid.querySelector('.add-skill-card');
                skillsGrid.innerHTML = '';
                
                if (skills.length === 0) {
                    skillsGrid.innerHTML = '<p class="no-skills">No skills added yet.</p>';
                } else {
                    skills.forEach(skill => {
                        const skillCard = createSkillCard(skill);
                        skillsGrid.appendChild(skillCard);
                    });
                }
                
                // Re-add the add skill card
                skillsGrid.appendChild(addSkillCard);
                
                // Add event listeners to skill actions
                addSkillEventListeners();
            })
            .catch(error => {
                console.error('Error loading skills:', error);
                showError('Failed to load skills. Please try again.');
            });
    }
    
    function createSkillCard(skill) {
        const card = document.createElement('div');
        card.className = 'skill-card';
        card.setAttribute('data-skill-id', skill.id);
        
        card.innerHTML = `
            <div class="skill-header">
                <h3>${skill.skill_name}</h3>
                <div class="skill-actions">
                    <button class="icon-btn edit-skill"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn delete-skill"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="skill-body">
                <p><strong>Hourly Rate:</strong> Kshs ${skill.hourly_rate}</p>
                <p><strong>Description:</strong> ${skill.description}</p>
                <div class="skill-stats">
                    <span><i class="fas fa-users"></i> ${skill.students_taught || 0} students taught</span>
                    <span><i class="fas fa-star"></i> ${skill.average_rating || 'No'} rating</span>
                </div>
            </div>
        `;

        // Displaying the files uploaded
        if (skill.proof_files) {
            const filesHtml = skill.proof_files.split(',').map(file => `
            <a href="/${file}" target="_blank" class="proof-link">
                <i class="fas fa-file-alt"></i> View Proof
            </a>
            `).join('');
            
            card.innerHTML += `<div class="proof-files">${filesHtml}</div>`;
        }
        
        return card;
    }
    
    function addSkillEventListeners() {
        // Edit skill
        document.querySelectorAll('.edit-skill').forEach(btn => {
            btn.addEventListener('click', function() {
                const skillId = this.closest('.skill-card').getAttribute('data-skill-id');
                editSkill(skillId);
            });
        });
        
        // Delete skill
        document.querySelectorAll('.delete-skill').forEach(btn => {
            btn.addEventListener('click', function() {
                const skillId = this.closest('.skill-card').getAttribute('data-skill-id');
                deleteSkill(skillId);
            });
        });
    }
    
    function showSkillModal(skill = null) {
        console.log("Opening modal with skill:", skill);
        const modalTitle = document.getElementById('modal-title');
        const skillIdInput = document.getElementById('skill-id');
        const skillNameInput = document.getElementById('skills');
        const skillRateInput = document.getElementById('skill-rate');
        const skillDescInput = document.getElementById('skill-description');
        
        if (skill) {
            // Editing existing skill
            modalTitle.textContent = 'Edit Skill';
            skillIdInput.value = skill.id || '';
            skillNameInput.value = skill.skill_name || '';
            skillRateInput.value = skill.hourly_rate || '';
            skillDescInput.value = skill.description || '';
        } else {
            // Adding new skill
            modalTitle.textContent = 'Add New Skill';
            skillIdInput.value = '';
            skillNameInput.value = '';
            skillRateInput.value = '';
            skillDescInput.value = '';
        }
        
        skillModal.classList.add('active');
    }
    
    function editSkill(skillId) {
        console.log('Attempting to edit skill ID:', skillId); // Debug log
        if (!skillId) {
            showError('Invalid skill ID');
            return;
        }
        
        fetch(`/api/expert/skills/${skillId}`)
            .then(response => {
                if (!response.ok) throw new Error('Skill not found');
                return response.json();
            })
            .then(skill => {
                showSkillModal(skill);
            })
            .catch(error => {
                console.error('Error loading skill:', error);
                showError('Failed to load skill details. Please try again.');
            });
    }
    
    function deleteSkill(skillId) {
        if (confirm('Are you sure you want to delete this skill?')) {
            fetch(`/api/expert/skills/${skillId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete skill');
                return response.json();
            })
            .then(() => {
                loadExpertSkills();
                showSuccess('Skill deleted successfully');
            })
            .catch(error => {
                console.error('Error deleting skill:', error);
                showError('Failed to delete skill. Please try again.');
            });
        }
    }

    // function to load pending skills
    function loadPendingSkills() {
    fetch('/api/expert/skills/pending')
        .then(response => response.json())
        .then(skills => {
        const pendingSkillsGrid = document.getElementById('pending-skills-grid');
        pendingSkillsGrid.innerHTML = '';
        
        if (skills.length === 0) {
            pendingSkillsGrid.innerHTML = '<p class="no-skills">No pending skills awaiting approval.</p>';
            return;
        }
        
        skills.forEach(skill => {
            const skillCard = createPendingSkillCard(skill);
            pendingSkillsGrid.appendChild(skillCard);
        });
        })
        .catch(error => {
        console.error('Error loading pending skills:', error);
        showError('Failed to load pending skills. Please try again.');
        });
    }

    function createPendingSkillCard(skill) {
    const card = document.createElement('div');
    card.className = 'skill-card pending';
    card.setAttribute('data-skill-id', skill.id);
    
    card.innerHTML = `
        <div class="skill-header">
        <h3>${skill.skill_name}</h3>
        <span class="status-badge pending">Pending</span>
        </div>
        <div class="skill-body">
        <p><strong>Hourly Rate:</strong> Kshs ${skill.hourly_rate}</p>
        <p><strong>Description:</strong> ${skill.description}</p>
        <div class="skill-actions">
            <button class="btn secondary-btn cancel-skill"><i class="fas fa-times"></i> Cancel Request</button>
        </div>
        </div>
    `;

    // Add proof files display if available
    if (skill.proof_files) {
        const filesHtml = skill.proof_files.split(',').map(file => `
        <a href="/${file}" target="_blank" class="proof-link">
            <i class="fas fa-file-alt"></i> View Proof
        </a>
        `).join('');
        
        card.innerHTML += `<div class="proof-files">${filesHtml}</div>`;
    }
    
    return card;
    }

    function cancelSkillRequest(skillId) {
    if (confirm('Are you sure you want to cancel this skill approval request?')) {
        fetch(`/api/expert/skills/${skillId}`, {
        method: 'DELETE'
        })
        .then(response => {
        if (!response.ok) throw new Error('Failed to cancel skill request');
        return response.json();
        })
        .then(() => {
        loadPendingSkills();
        showSuccess('Skill request cancelled successfully');
        })
        .catch(error => {
        console.error('Error cancelling skill:', error);
        showError('Failed to cancel skill request. Please try again.');
        });
    }
    }

    // Handle skill form submission
    skillForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Simple client validation
        const files = fileInput.files;
        if (files.length === 0) {
            showError('Please upload at least one proof file');
            return;
        }

        if (files.length > 5) {
            showError('Maximum 5 files allowed');
            return;
        }

        // Basic file type check
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        for (let file of files) {
            if (!validTypes.includes(file.type)) {
                showError('Only JPG, PNG, and PDF files are allowed');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showError(`File "${file.name}" exceeds 5MB limit`);
                return;
            }
        }
        
        const formData = new FormData();
        const proofFiles = document.getElementById('skill-proof').files;

        // Append all files
        for (let i = 0; i < proofFiles.length; i++) {
            formData.append('proof_files', proofFiles[i]);
        }

        // Append other form data
        formData.append('skill_name', document.getElementById('skills').value);
        formData.append('hourly_rate', document.getElementById('skill-rate').value);
        formData.append('description', document.getElementById('skill-description').value);
        formData.append('expert_id', expertId);
        
        try {
            const response = await fetch('/api/expert/skills', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }
            
            const result = await response.json();
            loadExpertSkills();
            loadPendingSkills();
            closeModal();
            showSuccess(result.message || 'Skill submitted for approval');
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to submit skill. Please try again.');
        }
    });
    
    // Feedback Functions
    function loadFeedback() {
        fetch(`/api/expert/feedback?expert_id=${expertId}`)
            .then(response => response.json())
            .then(feedbackList => {
                const feedbackContainer = document.querySelector('.feedback-list');
                feedbackContainer.innerHTML = '';
                
                if (feedbackList.length === 0) {
                    feedbackContainer.innerHTML = '<p class="no-feedback">No feedback received yet.</p>';
                    return;
                }
                
                feedbackList.forEach(feedback => {
                    const feedbackItem = createFeedbackItem(feedback);
                    feedbackContainer.appendChild(feedbackItem);
                });
            })
            .catch(error => {
                console.error('Error loading feedback:', error);
                showError('Failed to load feedback. Please try again.');
            });
    }
    
    function createFeedbackItem(feedback) {
        const item = document.createElement('div');
        item.className = 'feedback-item';
        
        item.innerHTML = `
            <div class="feedback-header">
                <div class="student-info">
                    <div class="avatar-small"><i class="fas fa-user"></i></div>
                    <div>
                        <h4>${feedback.student_email}</h4>
                        <div class="rating">
                            ${generateStarRating(feedback.rating)}
                            <span>${feedback.rating}</span>
                        </div>
                    </div>
                </div>
                <div class="feedback-date">${formatDate(feedback.created_at)}</div>
            </div>
            <div class="feedback-content">
                <p>"${feedback.comments}"</p>
            </div>
            <div class="feedback-skill">
                <span class="skill-tag">${feedback.skill_name}</span>
            </div>
        `;
        
        return item;
    }
    
    function filterFeedback() {
        const filterValue = feedbackFilter.value;
        // In a real app, you would refetch the feedback with the appropriate filter
        // For this demo, we'll just show all feedback
        loadFeedback();
    }
    
    // Utility Functions
    function formatDateTime(dateTimeString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Date(dateTimeString).toLocaleDateString('en-US', options);
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    function generateStarRating(rating) {
        if (!rating) return '';
        
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        return stars;
    }
    
    function showModal(content, title = '', modalElement) {
        if (title) {
            modalElement.querySelector('h3').textContent = title;
        }
        modalElement.querySelector('.modal-body').innerHTML = content;
        modalElement.classList.add('active');
    }
    
    function closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    function showSuccess(message) {
        alert(message); // notification system
    }
    
    function showError(message) {
        alert(message); // notification system
    }

    // Initialize the dashboard
    initDashboard();

});