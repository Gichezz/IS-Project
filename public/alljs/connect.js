let socket = null;
document.addEventListener('DOMContentLoaded', function() {
     (async function () {
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
    const attachBtn = document.getElementById('attach-btn');

    // Global variables
    let currentUser = null;
    let activeConversation = null;
    



    // Fetch user from server session
    async function getCurrentUserFromSession() {
        try {
            const res = await fetch('/api/users/current', {
                credentials: 'include',
            });
            if (!res.ok) throw new Error("Not authenticated");
            return await res.json();
        } catch (err) {
            console.error('❌ Error fetching user from session:', err);
            alert("Please log in to continue.");
            window.location.href = "/login.html";
            return null;
        }
    }
    

    currentUser = await getCurrentUserFromSession();
    if (!currentUser || !currentUser.id) return;

    // Initialize socket
    socket = io("http://127.0.0.1:3010");
    socket.emit("authenticate", currentUser.id);



    // For displaying current user in header
    const currentUserDisplay = document.getElementById('current-user');
    if (currentUserDisplay) currentUserDisplay.textContent = currentUser.name;

    // Define updateConversationList so real-time doesn't fail
    function updateConversationList() {
        loadConversations();
        
    }

    // Load conversations
    async function loadConversations() {
        try {
            const response = await fetch(`/api/conversations/${currentUser.id}`);
            const conversations = await response.json();
            renderConversationList(conversations);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    function renderConversationList(conversations) {
    conversationList.innerHTML = '';

    if (conversations.length === 0) {
        conversationList.innerHTML = '<div class="empty-state"><p>No conversations yet</p></div>';
        return;
    }

    conversations.forEach(conv => {
        console.log(" Loaded conversation:", conv); 

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

        // Defensive check
        if (conv.id) {
            conversationItem.addEventListener('click', () => loadConversation(conv.id, partner));
        } else {
            console.error(" Missing conversation ID:", conv);
        }

        conversationList.appendChild(conversationItem);
    });
}


  async function loadConversation(conversationId, partner) {
    if (!conversationId) {
        console.error(" loadConversation called with invalid conversationId:", conversationId);
        return;
    }

    try {
        const response = await fetch(`/api/messages/${conversationId}`);
        const messages = await response.json();

        activeConversation = {
            id: conversationId,
            user1_id: currentUser.id,
            user2_id: partner.id
        };

        chatPartnerName.textContent = `${partner.name} (${partner.role})`;
        updatePartnerStatus('online');

        renderMessages(messages);
        markAsRead(conversationId);
    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}


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

        messages.forEach(addMessageToUI);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        // ✅ Mark as read when user loads messages
    markAsRead(activeConversation.id);
    }

    function addMessageToUI(msg) {
        console.log('✉️ Message received:', msg, ' | Current user:', currentUser.id);
        const senderId = msg.senderId || msg.sender_id;
        const isCurrentUser = senderId === currentUser.id; 

        const messageElement = document.createElement('div');
        messageElement.className = `message ${isCurrentUser ? 'message-sent' : 'message-received'}`;

        messageElement.innerHTML = msg.content.includes('zoom.us') || msg.content.includes('meet.google.com') ? `
                <div class="message-text">
                    <strong>Meeting Link</strong><br>
                    <a href="${msg.content}" target="_blank" class="meeting-link">Join Meeting</a>
                </div>
                <div class="message-info">
                    <span>${formatTime(msg.timestamp)}</span>
                  ${isCurrentUser ? `<span class="message-status ${msg.read ? 'read' : 'delivered'}"><i class="fas fa-check${msg.read ? '-double' : ''}"></i></span>` : ''}

                </div>
            ` : `
                <div class="message-text">${msg.content}</div>
                <div class="message-info">
                    <span>${formatTime(msg.timestamp)}</span>
                    ${isCurrentUser ? `<span class="message-status ${msg.read ? 'read' : 'delivered'}"><i class="fas fa-check${msg.read ? '-double' : ''}"></i></span>` : ''}

                </div>
            `;

            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }


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

    function formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function updatePartnerStatus(status) {
        chatPartnerStatus.textContent = status;
        chatPartnerStatus.className = `partner-status ${status}`;
    }

    async function searchUsers() {
        const query = searchUserInput.value.trim();
        if (query.length < 2) {
            userSearchResults.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/users/search/${encodeURIComponent(query)}`);
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
                        searchUserInput.value = user.name;
                        confirmNewChat.dataset.userId = user.id;
                        userSearchResults.innerHTML = '';
                    });
                    userSearchResults.appendChild(userElement);
                }
            });
        } catch (err) {
            console.error("Error searching users:", err);
        }
    }

   async function createNewConversation() {
    const userId = confirmNewChat.dataset.userId;
    const message = initialMessage.value.trim();

    if (!userId || !message) {
        alert('Please select a user and write a message');
        return;
    }

    try {
        const response = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user1Id: currentUser.id, user2Id: userId })
        });

        const { conversationId } = await response.json();

        if (!conversationId) {
            console.error("❌ No conversation ID returned");
            return;
        }


        //  Emit only after getting valid conversationId

        socket.emit('private-message', {
            senderId: currentUser.id,
            receiverId: userId,
            content: message,
            conversationId
        });

        newChatModal.classList.remove('show');
        searchUserInput.value = '';
        initialMessage.value = '';
        delete confirmNewChat.dataset.userId;

        loadConversations();
    } catch (error) {
        console.error('Error creating conversation:', error);
    }
}

  function sendZoomLink() {
    if (!activeConversation) {
        alert('Please select a conversation first');
        return;
    }

    const zoomLink = prompt('Enter Zoom meeting link:');
    if (!zoomLink || !zoomLink.includes('zoom.us')) {
        alert('Please enter a valid Zoom link');
        return;
    }

    const receiverId = activeConversation.user1_id === currentUser.id
        ? activeConversation.user2_id
        : activeConversation.user1_id;

    socket.emit('private-message', {
        senderId: currentUser.id,
        receiverId,
        content: zoomLink,
        conversationId: activeConversation.id
    });

    document.querySelector('.attachment-modal')?.remove();
}
async function scheduleMeeting() {
    if (!activeConversation) {
        alert('Please select a conversation first');
        return;
    }

    const partnerId = activeConversation.user1_id === currentUser.id
        ? activeConversation.user2_id
        : activeConversation.user1_id;

    try {
        const response = await fetch(`/api/users/${partnerId}`);
        const partner = await response.json();

        const topic = prompt('Meeting Topic:', `Tutoring Session with ${partner.name}`);
        const date = prompt('Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
        const time = prompt('Time (HH:MM):', '15:00');
        const duration = prompt('Duration (minutes):', '60');

        if (!topic || !date || !time || !duration) return;

        const start = new Date(`${date}T${time}:00`);
        const end = new Date(start.getTime() + parseInt(duration) * 60000);

        const formatForCalendar = (d) =>
            d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const calendarUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(topic)}&dates=${formatForCalendar(start)}/${formatForCalendar(end)}&details=${encodeURIComponent('Meeting for SwapSecure')}&location=${encodeURIComponent('https://zoom.us')}`;

        // ✅ Open Google Calendar in a new tab
        window.open(calendarUrl, '_blank');

        // Optionally close modal
        document.querySelector('.attachment-modal')?.remove();
    } catch (error) {
        console.error('Error scheduling meeting:', error);
    }
}

    // Attach Zoom/Meeting links
    function showAttachmentOptions() {
        if (!activeConversation) {
            alert('Please select a conversation first');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'attachment-modal';
        modal.innerHTML = `
            <div class="attachment-options">
                <button id="send-zoom-btn" class="attachment-option"><i class="fas fa-video"></i> Send Zoom Link</button>
                <button id="schedule-meeting-btn" class="attachment-option"><i class="fas fa-calendar-plus"></i> Schedule Meeting</button>
                <button id="cancel-attachment" class="attachment-option cancel"><i class="fas fa-times"></i> Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);

         // ✅ Event Listeners
        document.getElementById('cancel-attachment').addEventListener('click', () => modal.remove());
    document.getElementById('send-zoom-btn').addEventListener('click', sendZoomLink);
    document.getElementById('schedule-meeting-btn').addEventListener('click', scheduleMeeting);
    }

    
    function addMeetingToUI(meeting) {
        const element = document.createElement('div');
        element.className = 'meeting-notification';
        element.innerHTML = `
            <div class="meeting-header"><i class="fas fa-video"></i><h4>Meeting Scheduled</h4></div>
            <div class="meeting-details">
                <p><strong>Time:</strong> ${new Date(meeting.startTime).toLocaleString()}</p>
                <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
                <a href="${meeting.link}" target="_blank" class="join-meeting-btn"><i class="fas fa-external-link-alt"></i> Join Meeting</a>
            </div>
        `;
        messagesContainer.appendChild(element);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !activeConversation) return;

    const partnerId = activeConversation.user1_id === currentUser.id ?
        activeConversation.user2_id : activeConversation.user1_id;

    // Send via Socket.IO
    socket.emit('private-message', {
        senderId: currentUser.id,
        receiverId: partnerId,
        content,
        conversationId: activeConversation.id
    });

    

    // Clear input
    messageInput.value = '';
}


    // Event Listeners
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    attachBtn.addEventListener('click', showAttachmentOptions);
    newChatBtn.addEventListener('click', () => newChatModal.classList.add('show'));
    closeNewChatModal.addEventListener('click', () => newChatModal.classList.remove('show'));
    cancelNewChat.addEventListener('click', () => newChatModal.classList.remove('show'));
    searchUserInput.addEventListener('input', searchUsers);
    confirmNewChat.addEventListener('click', createNewConversation);
    attachBtn.addEventListener('click', showAttachmentOptions);
   
    function connectSocket() {
  if (!socket || !currentUser) return;

  socket.emit('authenticate', currentUser.id);

  socket.on('new-message', (message) => {
    if (activeConversation && activeConversation.id === message.conversationId) {
      addMessageToUI(message);
    }
    updateConversationList();
  });

  socket.on('user-status-changed', ({ userId, status }) => {
    if (
      activeConversation &&
      (activeConversation.user1_id === userId || activeConversation.user2_id === userId)
    ) {
      updatePartnerStatus(status);
    }
    updateConversationList();
  });

  socket.on('new-meeting', (meeting) => {
    if (
      (activeConversation?.user1_id === meeting.tutorId || activeConversation?.user2_id === meeting.tutorId) &&
      (activeConversation?.user1_id === meeting.studentId || activeConversation?.user2_id === meeting.studentId)
    ) {
      addMeetingToUI(meeting);
    }
  });
}


    connectSocket();
    loadConversations();
     })();
});
