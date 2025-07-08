document.addEventListener('DOMContentLoaded', async function () {
    let currentUser;

    // Fetch session info from the server
    try {
        const res = await fetch('/session', {
            credentials: 'include'  // Include session cookies
        });

        const sessionData = await res.json();
        
        if (!sessionData.loggedIn || !sessionData.user) {
            window.location.href = '/login.html';
            return;
        }

        // Set the current user
        currentUser = sessionData.user;

        // Load user-related data
        await loadProfileData(currentUser.id);
        await loadUserSessions(currentUser.id);
        setupEventListeners();

    } catch (err) {
      console.error('Session or profile load failed:', error);
      window.location.href = '/login.html';
    }
});

async function loadProfileData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch user data');
        const userData = await response.json();

        // Update profile fields
        document.querySelector('.user-name').textContent = userData.name || 'User Name';
        document.querySelector('.user-email').textContent = userData.email || 'user@example.com';

        // Display favorite skills
        const skillsContainer = document.querySelector('.skills-container');
        skillsContainer.innerHTML = '';

        if (userData.favoriteSkills?.length) {
            userData.favoriteSkills.forEach(skill => {
                const skillElement = document.createElement('span');
                skillElement.className = 'skill-tag';
                skillElement.textContent = skill;
                skillsContainer.appendChild(skillElement);
            });
        } else {
            skillsContainer.innerHTML = '<span class="no-skills">No favorite skills added yet</span>';
        }

    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

async function loadUserSessions(userId) {
    try {
        const response = await fetch(`/api/sessions?studentId=${userId}`, {
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch sessions');

        const sessions = await response.json();
        const sessionList = document.querySelector('.session-list');
        sessionList.innerHTML = '';

        if (!sessions.length) {
            sessionList.innerHTML = `
                <div class="no-sessions">
                    <i class="fas fa-calendar-times"></i>
                    <p>You don't have any active sessions yet</p>
                </div>
            `;
            return;
        }

        sessions.forEach(session => {
            const sessionItem = createSessionElement(session);
            sessionList.appendChild(sessionItem);
        });

    } catch (error) {
        console.error('Error loading sessions:', error);
        document.querySelector('.session-list').innerHTML = `
            <div class="error-loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load sessions. Please try again later.</p>
            </div>
        `;
    }
}

function createSessionElement(session) {
    const sessionItem = document.createElement('div');
    sessionItem.className = `session-item ${session.status.toLowerCase()}`;

    let statusClass = '';
    let statusText = session.status;

    if (session.status === 'ACCEPTED') {
        statusClass = 'status-accepted';
        statusText = 'In Progress';
    } else if (session.status === 'COMPLETED') {
        statusClass = 'status-completed';
    } else if (session.status === 'PENDING') {
        statusClass = 'status-pending';
    }

    const isCompleted = session.status === 'COMPLETED';
    const studentMarked = !!session.student_completed || !!session.studentCompleted;
    const feedbackGiven = !!session.feedbackGiven;
    const showFeedbackBtn = studentMarked && !feedbackGiven;
    const chatDisabled = isCompleted || studentMarked ? 'disabled' : '';
    const completeDisabled = isCompleted || studentMarked ? 'disabled' : '';
    const completeText = studentMarked ? 'Completed' : 'Mark Completed';
    const hideAll = studentMarked && feedbackGiven;

    sessionItem.innerHTML = `
        <div class="session-info">
            <div class="session-detail">
                <i class="fas fa-book"></i>
                <span><strong>Skill:</strong> ${session.skill}</span>
            </div>
            <div class="session-detail">
                <i class="fas fa-user-tie"></i>
                <span><strong>Expert:</strong> ${session.expertName}</span>
            </div>
            <div class="session-detail">
                <i class="fas fa-info-circle"></i>
                <span><strong>Status:</strong> <span class="${statusClass}">${statusText}</span></span>
            </div>
            ${session.scheduledTime ? `
            <div class="session-detail">
                <i class="fas fa-clock"></i>
                <span><strong>Scheduled:</strong> ${new Date(session.scheduledTime).toLocaleString()}</span>
            </div>` : ''}
        </div>
        <div class="session-actions" style="display: ${hideAll ? 'none' : 'flex'};">
          ${!hideAll && !showFeedbackBtn ? `
            <button class="btn chat-btn" ${chatDisabled} data-session-id="${session.id}" data-expert-id="${session.expertId}">
                <i class="fas fa-comments"></i> Chat
            </button>
            <button class="btn complete-btn" ${completeDisabled} data-session-id="${session.id}">
                <i class="fas fa-check-circle"></i> ${completeText}
            </button>
          ` : ''}
            ${showFeedbackBtn ? `
                <button class="btn feedback-btn" data-session-id="${session.id}">
                    <i class="fas fa-star"></i> Give Feedback
                </button>
            ` : ''}
        </div>
    `;

    return sessionItem;
}

function setupEventListeners() {
    document.addEventListener('click', function (e) {
        const chatBtn = e.target.closest('.chat-btn');
        const completeBtn = e.target.closest('.complete-btn');
        const feedbackBtn = e.target.closest('.feedback-btn');

        if (chatBtn && !chatBtn.disabled) {
            const sessionId = chatBtn.dataset.sessionId;
            const expertId = chatBtn.dataset.expertId;

            localStorage.setItem('currentChatSession', JSON.stringify({ sessionId, expertId }));
            window.location.href = 'connect.html';
        }

        if (completeBtn && !completeBtn.disabled) {
            handleMarkCompleted(completeBtn);
        }

        if (feedbackBtn) {
            openFeedbackModal(feedbackBtn.dataset.sessionId);
        }
    });
}

async function handleMarkCompleted(button) {
    const sessionId = button.dataset.sessionId;

    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const response = await fetch(`/session-requests/${sessionId}/student-complete`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completedBy: 'student' })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`Mark complete failed (${response.status}):`, errorDetails);
            throw new Error('Failed to mark session as completed');
          }

        const result = await response.json();

        button.innerHTML = '<i class="fas fa-check-circle"></i> Completed';
        button.classList.add('completed');

        const sessionItem = button.closest('.session-item');
        const statusSpan = sessionItem.querySelector('.session-detail span span');
        if (result.status === 'COMPLETED') {
            statusSpan.textContent = 'Completed';
            statusSpan.className = 'status-completed';

            const chatButton = sessionItem.querySelector('.chat-btn');
            if (chatButton) chatButton.disabled = true;
        }

    } catch (error) {
        console.error('Error marking session as completed:', error);
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-check-circle"></i> Mark Completed';
        alert('Failed to mark session as completed. Please try again.');
    }
}

let selectedRating = 0;
// Placeholder for feedback modal logic
function openFeedbackModal(sessionId) {
    const modal = document.getElementById('feedback-modal');
    document.getElementById('feedback-session-id').value = sessionId;
    document.getElementById('feedback-comments').value = '';
    selectedRating = 0;
    highlightStars(0);
    setHiddenRating(0);
    modal.classList.add('active');

    const starsContainer = document.getElementById('feedback-stars');
    const stars = starsContainer.querySelectorAll('span');

    // Remove old event listeners by cloning each star
    stars.forEach((oldStar, index) => {
        const newStar = oldStar.cloneNode(true);
        starsContainer.replaceChild(newStar, oldStar);

        const value = index + 1;

        newStar.addEventListener('mouseover', () => highlightStars(value));
        newStar.addEventListener('mouseout', () => highlightStars(selectedRating));
        newStar.addEventListener('click', () => {
            selectedRating = value;
            highlightStars(selectedRating);
            setHiddenRating(selectedRating);
        });
    });

    const feedbackForm = document.getElementById('feedback-form');
    if (!feedbackForm.dataset.eventsAttached) {
        feedbackForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const sessionId = document.getElementById('feedback-session-id').value;
            const rating = selectedRating;
            const comments = document.getElementById('feedback-comments').value;

            if (!rating || rating < 1 || rating > 5) {
                alert('Please select a rating.');
                return;
            }

            try {
                const res = await fetch('/api/session-feedback', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, rating, comments })
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('Feedback submission failed:', errorText);
                    throw new Error('Failed to submit feedback');
                }

                closeFeedbackModal();

                const sessionItem = document.querySelector(`.session-item .feedback-btn[data-session-id="${sessionId}"]`)?.closest('.session-item');
                if (sessionItem) {
                    const feedbackBtn = sessionItem.querySelector('.feedback-btn');
                    if (feedbackBtn) feedbackBtn.remove();
                }

                alert('Thank you for your feedback!');
            } catch (err) {
                console.error('Error submitting feedback:', err);
                alert('Failed to submit feedback. Please try again.');
            }
        });

        feedbackForm.dataset.eventsAttached = 'true';
    }
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('#feedback-stars span');
    stars.forEach((star, index) => {
        star.classList.toggle('selected', index < rating);
    });
}

function setHiddenRating(rating) {
    let input = document.getElementById('feedback-rating');
    if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'feedback-rating';
        input.name = 'rating';
        document.getElementById('feedback-form').appendChild(input);
    }
    input.value = rating;
}

function closeFeedbackModal() {
    document.getElementById('feedback-modal').classList.remove('active');
}

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('close-modal')) {
        closeFeedbackModal();
    }
});
