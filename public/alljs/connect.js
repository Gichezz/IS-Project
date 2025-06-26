document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const conversationList = document.getElementById('conversation-list');
    const messagesContainer = document.getElementById('messages-container');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const newChatModal = document.getElementById('new-chat-modal');
    const closeNewChatModal = document.getElementById('close-new-chat-modal');
    const cancelNewChat = document.getElementById('cancel-new-chat');
    const searchUserInput = document.getElementById('search-user');
    const userSearchResults = document.getElementById('user-search-results');
    const initialMessage = document.getElementById('initial-message');
    const confirmNewChat = document.getElementById('confirm-new-chat');
    const chatPartnerName = document.getElementById('chat-partner-name');
    const chatPartnerStatus = document.getElementById('chat-partner-status');
    const currentUserSpan = document.getElementById('current-user');
    const attachBtn = document.getElementById('attach-btn');

    // Global variables
    let currentUser = null;
    let activeConversation = null;
    let socket = null;

    

    // Connect to Socket.IO
    function connectSocket() {
        socket = io();

        // Authenticate with the server
        socket.emit('authenticate', currentUser.id);

        // Handle new messages
        socket.on('new-message', (message) => {
            if (activeConversation && activeConversation.id === message.conversationId) {
                addMessageToUI(message);
            }
            updateConversationList();
        });

        // Handle user status changes
        socket.on('user-status-changed', ({ userId, status }) => {
            if (activeConversation && 
                (activeConversation.user1_id === userId || activeConversation.user2_id === userId)) {
                updatePartnerStatus(status);
            }
            updateConversationList();
        });

        // Handle new meetings
        socket.on('new-meeting', (meeting) => {
            if (activeConversation && 
                (activeConversation.user1_id === meeting.tutorId || activeConversation.user2_id === meeting.tutorId) &&
                (activeConversation.user1_id === meeting.studentId || activeConversation.user2_id === meeting.studentId)) {
                addMeetingToUI(meeting);
            }
        });
    }

    // Load user conversations
    async function loadConversations() {
        try {
            const response = await fetch(`/api/conversations/${currentUser.id}`);
            const conversations = await response.json();
            renderConversationList(conversations);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    // Render conversation list
    function renderConversationList(conversations) {
        conversationList.innerHTML = '';

        if (conversations.length === 0) {
            conversationList.innerHTML = '<div class="empty-state"><p>No conversations yet</p></div>';
            return;
        }

        conversations.forEach(conv => {
            const partner = conv.user1_id === currentUser.id ? 
                { id: conv.user2_id, name: conv.user2_name, role: conv.user2_role } : 
                { id: conv.user1_id, name: conv.user1_name, role: conv.user1_role };

            const conversationItem = document.createElement('div');
            conversationItem.className = 'conversation-item';
            if (activeConversation && activeConversation.id === conv.id) {
                conversationItem.classList.add('active');
            }
            conversationItem.innerHTML = `
                <div class="conversation-avatar">${partner.name.charAt(0)}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${partner.name} (${partner.role})</div>
                    <div class="conversation-preview">${conv.last_message || 'No messages yet'}</div>
                </div>
                <div class="conversation-time">${formatTime(conv.last_message_time)}</div>
            `;
            conversationItem.addEventListener('click', () => loadConversation(conv.id, partner));
            conversationList.appendChild(conversationItem);
        });
    }

    // Load a conversation
    async function loadConversation(conversationId, partner) {
        try {
            // Fetch conversation messages
            const response = await fetch(`/api/messages/${conversationId}`);
            const messages = await response.json();

            // Set active conversation
            activeConversation = {
                id: conversationId,
                user1_id: currentUser.id === partner.id ? null : currentUser.id,
                user2_id: partner.id
            };

            // Update UI
            chatPartnerName.textContent = `${partner.name} (${partner.role})`;
            updatePartnerStatus('online'); // Default, will update with real status
            
            // Render messages
            renderMessages(messages);

            // Mark as read
            markAsRead(conversationId);
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    }

    // Render messages
    function renderMessages(messages) {
        messagesContainer.innerHTML = '';

        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        messages.forEach(msg => {
            addMessageToUI(msg);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Add message to UI
    function addMessageToUI(msg) {
        const isCurrentUser = msg.sender_id === currentUser.id;
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isCurrentUser ? 'message-sent' : 'message-received'}`;
        
        // Special handling for meeting links
        if (msg.content.includes('zoom.us') || msg.content.includes('meet.google.com')) {
            messageElement.innerHTML = `
                <div class="message-text">
                    <strong>Meeting Link</strong><br>
                    <a href="${msg.content}" target="_blank" class="meeting-link">Join Meeting</a>
                </div>
                <div class="message-info">
                    <span>${formatTime(msg.timestamp)}</span>
                    ${isCurrentUser ? '<span class="message-status delivered"><i class="fas fa-check"></i></span>' : ''}
                </div>
            `;
        } else {
            messageElement.innerHTML = `
                <div class="message-text">${msg.content}</div>
                <div class="message-info">
                    <span>${formatTime(msg.timestamp)}</span>
                    ${isCurrentUser ? '<span class="message-status delivered"><i class="fas fa-check"></i></span>' : ''}
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Send message
    async function sendMessage() {
        const content = messageInput.value.trim();
        if (!content || !activeConversation) return;

        const partnerId = activeConversation.user1_id === currentUser.id ? 
            activeConversation.user2_id : activeConversation.user1_id;

        try {
            // Send via Socket.IO
            socket.emit('private-message', {
                senderId: currentUser.id,
                receiverId: partnerId,
                content,
                conversationId: activeConversation.id
            });

            // Add to UI immediately
            addMessageToUI({
                sender_id: currentUser.id,
                content,
                timestamp: new Date().toISOString(),
                conversationId: activeConversation.id
            });

            // Clear input
            messageInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    // Mark conversation as read
    async function markAsRead(conversationId) {
        try {
            await fetch(`/api/conversations/${conversationId}/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id })
            });
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    // Update partner status
    function updatePartnerStatus(status) {
        chatPartnerStatus.textContent = status;
        chatPartnerStatus.className = `partner-status ${status}`;
    }

    // Format time
    function formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Search users for new conversation
    async function searchUsers() {
        const query = searchUserInput.value.trim();
        if (query.length < 2) {
            userSearchResults.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/users/search/${query}`);
            const users = await response.json();
            
            userSearchResults.innerHTML = '';
            users.forEach(user => {
                if (user.id !== currentUser.id) {
                    const userElement = document.createElement('div');
                    userElement.className = 'user-result';
                    userElement.innerHTML = `
                        <div class="user-result-info">
                            <div class="user-result-avatar">${user.name.charAt(0)}</div>
                            <div>
                                <div class="user-result-name">${user.name} (${user.role})</div>
                                <div class="user-result-email">${user.email}</div>
                            </div>
                        </div>
                    `;
                    userElement.addEventListener('click', () => {
                        selectUserForNewChat(user);
                    });
                    userSearchResults.appendChild(userElement);
                }
            });
        } catch (error) {
            console.error('Error searching users:', error);
        }
    }

    // Select user for new chat
    function selectUserForNewChat(user) {
        searchUserInput.value = user.name;
        userSearchResults.innerHTML = '';
        // Store selected user ID in data attribute
        confirmNewChat.dataset.userId = user.id;
    }

    // Create new conversation
    async function createNewConversation() {
        const userId = confirmNewChat.dataset.userId;
        const message = initialMessage.value.trim();

        if (!userId || !message) {
            alert('Please select a user and write a message');
            return;
        }

        try {
            // Create conversation
            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user1Id: currentUser.id, 
                    user2Id: userId 
                })
            });
            const { conversationId } = await response.json();

            // Send initial message
            socket.emit('private-message', {
                senderId: currentUser.id,
                receiverId: userId,
                content: message,
                conversationId
            });

            // Close modal and reset
            newChatModal.classList.remove('show');
            searchUserInput.value = '';
            initialMessage.value = '';
            delete confirmNewChat.dataset.userId;

            // Reload conversations
            loadConversations();
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    }

    // Show attachment options (Zoom/Google Meet)
    function showAttachmentOptions() {
        if (!activeConversation) {
            alert('Please select a conversation first');
            return;
        }

        const attachmentModal = document.createElement('div');
        attachmentModal.className = 'attachment-modal';
        attachmentModal.innerHTML = `
            <div class="attachment-options">
                <button id="send-zoom-btn" class="attachment-option">
                    <i class="fas fa-video"></i> Send Zoom Link
                </button>
                <button id="schedule-meeting-btn" class="attachment-option">
                    <i class="fas fa-calendar-plus"></i> Schedule Meeting
                </button>
                <button id="cancel-attachment" class="attachment-option cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        `;
        
        document.body.appendChild(attachmentModal);
        
        // Handle clicks
        document.getElementById('cancel-attachment').addEventListener('click', () => {
            attachmentModal.remove();
        });
        
        document.getElementById('send-zoom-btn').addEventListener('click', sendZoomLink);
        document.getElementById('schedule-meeting-btn').addEventListener('click', scheduleMeeting);
    }

    // Send Zoom link
    function sendZoomLink() {
        const zoomLink = prompt('Enter Zoom meeting link:');
        if (!zoomLink) return;

        if (!zoomLink.includes('zoom.us')) {
            alert('Please enter a valid Zoom link');
            return;
        }

        const partnerId = activeConversation.user1_id === currentUser.id ? 
            activeConversation.user2_id : activeConversation.user1_id;

        socket.emit('private-message', {
            senderId: currentUser.id,
            receiverId: partnerId,
            content: zoomLink,
            conversationId: activeConversation.id
        });

        // Close modal
        document.querySelector('.attachment-modal')?.remove();
    }

    // Schedule meeting
    async function scheduleMeeting() {
        const partnerId = activeConversation.user1_id === currentUser.id ? 
            activeConversation.user2_id : activeConversation.user1_id;

        try {
            // Get partner info
            const response = await fetch(`/api/users/${partnerId}`);
            const partner = await response.json();

            // Get meeting details
            const topic = prompt('Meeting Topic:', `Tutoring Session with ${partner.name}`);
            if (!topic) return;

            const date = prompt('Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
            if (!date) return;

            const time = prompt('Time (HH:MM):', '15:00');
            if (!time) return;

            const duration = prompt('Duration (minutes):', '60');
            if (!duration) return;

            // Create meeting object
            const meetingDetails = {
                startTime: `${date}T${time}:00`,
                duration: parseInt(duration),
                topic
            };

            // For tutors, create actual Zoom meeting
            if (currentUser.role === 'tutor') {
                const zoomResponse = await fetch('/api/zoom/meetings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        ...meetingDetails
                    })
                });
                const zoomMeeting = await zoomResponse.json();
                meetingDetails.link = zoomMeeting.join_url;
            } else {
                meetingDetails.link = prompt('Enter meeting link:');
                if (!meetingDetails.link) return;
            }

            // Send meeting notification
            socket.emit('schedule-meeting', {
                tutorId: currentUser.role === 'tutor' ? currentUser.id : partnerId,
                studentId: currentUser.role === 'student' ? currentUser.id : partnerId,
                meetingDetails
            });

            // Close modal
            document.querySelector('.attachment-modal')?.remove();
        } catch (error) {
            console.error('Error scheduling meeting:', error);
        }
    }

    // Add meeting to UI
    function addMeetingToUI(meeting) {
        const meetingElement = document.createElement('div');
        meetingElement.className = 'meeting-notification';
        meetingElement.innerHTML = `
            <div class="meeting-header">
                <i class="fas fa-video"></i>
                <h4>Meeting Scheduled</h4>
            </div>
            <div class="meeting-details">
                <p><strong>Time:</strong> ${new Date(meeting.startTime).toLocaleString()}</p>
                <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
                <a href="${meeting.link}" target="_blank" class="join-meeting-btn">
                    <i class="fas fa-external-link-alt"></i> Join Meeting
                </a>
            </div>
        `;
        messagesContainer.appendChild(meetingElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    newChatBtn.addEventListener('click', () => newChatModal.classList.add('show'));
    closeNewChatModal.addEventListener('click', () => newChatModal.classList.remove('show'));
    cancelNewChat.addEventListener('click', () => newChatModal.classList.remove('show'));

    searchUserInput.addEventListener('input', searchUsers);
    confirmNewChat.addEventListener('click', createNewConversation);
    attachBtn.addEventListener('click', showAttachmentOptions);

    // Initialize the app
    init();
});