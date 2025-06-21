// Connect to the server using Socket.IO
// This establishes a WebSocket connection to the server that served the HTML file
const socket = io(); // Automatically connects to the backend

/**
 * Sends a chat message when the user triggers the send action
 */
function sendMessage() {
    // Get and trim the message text from the input field
    const messageText = messageInput.value.trim();

    // If message is empty or no active conversation is selected, do nothing
    if (!messageText || !activeConversation) return;

    // Create a new message object with required properties
    const newMessage = {
        sender: currentUser.id,               // Current user's ID
        text: messageText,                    // The message content
        time: getCurrentTime(),               // Timestamp (e.g., "12:30 PM")
        conversationId: activeConversation.id // ID of the current conversation
    };

    // Emit the message to the server via the WebSocket
    socket.emit("chat message", newMessage);

    // Immediately display the message in the sender's chat UI
    const conversation = conversations.find(c => c.id === activeConversation.id);
    if (conversation) {
        // Add the message to the conversation's message list with a "delivered" status
        conversation.messages.push({ ...newMessage, status: "delivered" });

        // Update preview info for the conversation list
        conversation.lastMessage = messageText;
        conversation.lastMessageTime = "Just now";

        // Re-render the chat window with the updated messages
        renderMessages(conversation.messages);
    }

    // Clear the message input field
    messageInput.value = "";
}

/**
 * Handles incoming messages from other users through the socket
 */
socket.on("chat message", (msg) => {
    // Find the conversation that the incoming message belongs to
    const conv = conversations.find(c => c.id === msg.conversationId);

    // If the conversation exists
    if (conv) {
        // Add the incoming message to its message list with a "delivered" status
        conv.messages.push({ ...msg, status: "delivered" });

        // Update the conversation's last message and time preview
        conv.lastMessage = msg.text;
        conv.lastMessageTime = "Just now";

        // If this conversation is currently open, re-render its messages
        if (activeConversation?.id === conv.id) {
            renderMessages(conv.messages);
        }

        // Refresh the conversation list to show updated previews
        renderConversationList();
    }
});




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
            const swapDetailsBtn = document.getElementById('swap-details-btn');
            const swapDetailsModal = document.getElementById('swap-details-modal');
            const closeSwapDetailsModal = document.getElementById('close-swap-details-modal');
            const closeSwapModal = document.getElementById('close-swap-modal');
            const agreeToSwap = document.getElementById('agree-to-swap');
            const swapDetailsContent = document.getElementById('swap-details-content');
            const chatPartnerName = document.getElementById('chat-partner-name');
            const chatPartnerStatus = document.getElementById('chat-partner-status');
            const currentUserSpan = document.getElementById('current-user');
            const searchConversations = document.getElementById('search-conversations');
            const swapDetailsSidebar = document.querySelector('.swap-details-sidebar');
            const closeDetailsBtn = document.getElementById('close-details-btn');
            const attachBtn = document.getElementById('attach-btn');

            // Sample data - in a real app, this would come from a backend
            const currentUser = {
                id: 'user1',
                name: 'User123',
                avatar: 'U',
                online: true,
                email: 'swapmaster@example.com',
                isTeacher: true
            };

            const users = [
                { id: 'user2', name: 'SwapMaster', avatar: 'S', online: true, email: 'swapmaster@example.com', isTeacher: false },
                { id: 'user3', name: 'TradePro', avatar: 'T', online: false, email: 'tradepro@example.com', isTeacher: true },
                { id: 'user4', name: 'BarterKing', avatar: 'B', online: true, email: 'barterking@example.com', isTeacher: false },
                { id: 'user5', name: 'Zarian', avatar: 'Z', online: false, email: 'zarian.ochieng@strathmore.edu', isTeacher: true }
            ];

            const conversations = [
                
                {
                    id: 'conv2',
                    userId: 'user3',
                    lastMessage: 'I can add $20 to make it fair',
                    lastMessageTime: 'Yesterday',
                    unread: 2,
                    
                    messages: [
                        {
                            id: 'msg1',
                            sender: 'user3',
                            text: 'Hi, I saw your designer watch listing',
                            time: '9:00 AM',
                            status: 'read'
                        },
                        {
                            id: 'msg2',
                            sender: 'user1',
                            text: 'Hello! Yes, it\'s still available',
                            time: '9:05 AM',
                            status: 'read'
                        },
                        {
                            id: 'msg3',
                            sender: 'user3',
                            text: 'I have a smartwatch to trade. Interested?',
                            time: '9:10 AM',
                            status: 'read'
                        },
                        {
                            id: 'msg4',
                            sender: 'user1',
                            text: 'Hmm, I was hoping for something of equal value',
                            time: '9:15 AM',
                            status: 'read'
                        },
                        {
                            id: 'msg5',
                            sender: 'user3',
                            text: 'I can add $20 to make it fair',
                            time: '9:20 AM',
                            status: 'delivered'
                        }
                    ]
                }
            ];

            let activeConversation = null;
            let typingTimeout = null;

            // Initialize the app
            function init() {
                currentUserSpan.textContent = currentUser.name;
                renderConversationList();
                setupEventListeners();
            }

            // Set up event listeners
            function setupEventListeners() {
                // Send message on button click or Enter key
                sendBtn.addEventListener('click', sendMessage);
                messageInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        sendMessage();
                    }
                });

                // New conversation modal
                newChatBtn.addEventListener('click', () => newChatModal.classList.add('show'));
                closeNewChatModal.addEventListener('click', () => newChatModal.classList.remove('show'));
                cancelNewChat.addEventListener('click', () => newChatModal.classList.remove('show'));

                // Search users for new conversation
                searchUserInput.addEventListener('input', searchUsers);

                // Confirm new conversation
                confirmNewChat.addEventListener('click', createNewConversation);

                // Swap details
                swapDetailsBtn.addEventListener('click', showSwapDetails);
                closeSwapDetailsModal.addEventListener('click', () => swapDetailsModal.classList.remove('show'));
                closeSwapModal.addEventListener('click', () => swapDetailsModal.classList.remove('show'));
                agreeToSwap.addEventListener('click', agreeToSwapAction);

                // Search conversations
                searchConversations.addEventListener('input', filterConversations);

                // Close swap details sidebar
                closeDetailsBtn.addEventListener('click', () => {
                    swapDetailsSidebar.classList.remove('show');
                });

                // Attachment button for Zoom and Calendar
                attachBtn.addEventListener('click', showAttachmentOptions);

                // Simulate receiving a message after 5 seconds
                setTimeout(() => {
                    simulateReceivedMessage();
                }, 5000);
            }

            // Show attachment options (Zoom and Calendar)
            function showAttachmentOptions() {
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
                document.getElementById('schedule-meeting-btn').addEventListener('click', scheduleGoogleMeeting);
            }

            // Send Zoom link
            function sendZoomLink() {
                if (!activeConversation) {
                    alert('Please select a conversation first');
                    return;
                }
                
                const zoomLink = prompt('Enter the Zoom meeting link:');
                if (!zoomLink) return;
                
                // Validate it's a Zoom link
                if (!zoomLink.includes('zoom.us')) {
                    alert('Please enter a valid Zoom link');
                    return;
                }
                
                const newMessage = {
                    id: `msg${Date.now()}`,
                    sender: currentUser.id,
                    text: `Zoom Meeting Link: ${zoomLink}`,
                    time: getCurrentTime(),
                    status: 'delivered',
                    isZoomLink: true
                };
                
                // Add to active conversation
                const conversation = conversations.find(c => c.id === activeConversation.id);
                if (conversation) {
                    conversation.messages.push(newMessage);
                    conversation.lastMessage = "Zoom meeting link shared";
                    conversation.lastMessageTime = 'Just now';
                    renderMessages(conversation.messages);
                }
                
                // Close attachment modal if open
                const modal = document.querySelector('.attachment-modal');
                if (modal) modal.remove();
            }

            // Schedule Google Meeting
            function scheduleGoogleMeeting() {
                if (!activeConversation) {
                    alert('Please select a conversation first');
                    return;
                }
                
                const user = users.find(u => u.id === activeConversation.userId);
                const subject = prompt('Meeting Subject:', `Swap Discussion with ${user.name}`);
                if (!subject) return;
                
                const date = prompt('Meeting Date (YYYY-MM-DD):', getFormattedDate(new Date()));
                if (!date) return;
                
                const time = prompt('Meeting Time (HH:MM):', '15:00');
                if (!time) return;
                
                // Create Google Calendar link
                const startTime = `${date}T${time.replace(':', '')}00`;
                const endTime = `${date}T${(parseInt(time.split(':')[0])+1)}${time.split(':')[1]}00`;
                
                const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(subject)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(`Meeting to discuss swap details`)}&add=${user.email || ''}`;
                
                // Open in new tab
                window.open(googleCalendarLink, '_blank');
                
                // Close attachment modal if open
                const modal = document.querySelector('.attachment-modal');
                if (modal) modal.remove();
            }

            // Helper function to format date as YYYY-MM-DD
            function getFormattedDate(date) {
                const d = new Date(date);
                let month = '' + (d.getMonth() + 1);
                let day = '' + d.getDate();
                const year = d.getFullYear();

                if (month.length < 2) month = '0' + month;
                if (day.length < 2) day = '0' + day;

                return [year, month, day].join('-');
            }

            // Render conversation list
            function renderConversationList(filter = '') {
                conversationList.innerHTML = '';

                const filteredConversations = conversations.filter(conv => {
                    const user = users.find(u => u.id === conv.userId);
                    return user.name.toLowerCase().includes(filter.toLowerCase()) || 
                           conv.lastMessage.toLowerCase().includes(filter.toLowerCase());
                });

                if (filteredConversations.length === 0) {
                    conversationList.innerHTML = '<div class="empty-state"><p>No conversations found</p></div>';
                    return;
                }

                filteredConversations.forEach(conv => {
                    const user = users.find(u => u.id === conv.userId);
                    const conversationItem = document.createElement('div');
                    conversationItem.className = 'conversation-item';
                    if (activeConversation && activeConversation.id === conv.id) {
                        conversationItem.classList.add('active');
                    }
                    conversationItem.innerHTML = `
                        <div class="conversation-avatar">${user.avatar}</div>
                        <div class="conversation-info">
                            <div class="conversation-name">${user.name}</div>
                            <div class="conversation-preview">${conv.lastMessage}</div>
                        </div>
                        <div class="conversation-time">${conv.lastMessageTime}</div>
                        ${conv.unread > 0 ? `<div class="unread-badge">${conv.unread}</div>` : ''}
                    `;
                    conversationItem.addEventListener('click', () => loadConversation(conv.id));
                    conversationList.appendChild(conversationItem);
                });
            }

            // Filter conversations based on search input
            function filterConversations() {
                renderConversationList(searchConversations.value);
            }

            // Load a conversation
function loadConversation(conversationId) {
    // Find the conversation object using its ID
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Set the active conversation globally
    activeConversation = conversation;

    // Find the user associated with this conversation
    const user = users.find(u => u.id === conversation.userId);

    // Update UI with chat partner details
    chatPartnerName.textContent = user.name;
    chatPartnerStatus.textContent = user.online ? 'online' : 'offline';
    chatPartnerStatus.className = user.online ? 'partner-status online' : 'partner-status offline';

    // 🟡 Fetch messages from your backend (via API) using the conversation ID
    fetch(`/api/messages/${conversation.id}`)
        .then(res => res.json())
        .then(dbMessages => {
            // Map database rows to your internal message format
            conversation.messages = dbMessages.map(m => ({
                id: m.id,
                sender: m.sender_id,
                text: m.text,
                time: new Date(m.time_sent).toLocaleTimeString(), // Format timestamp
                status: "read"
            }));

            // Render the fetched messages in the chat area
            renderMessages(conversation.messages);
        })
        .catch(err => {
            console.error("Failed to load messages from server:", err);
        });

    // Mark messages as read (update UI and possibly backend)
    markMessagesAsRead(conversationId);

    // Highlight the selected conversation in the sidebar
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.conversation-item[data-id="${conversationId}"]`)?.classList.add('active');

    // Load any related swap/trade details in the sidebar
    loadSwapDetails(conversation.swapDetails);
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
                    const isSent = msg.sender === currentUser.id;
                    const messageElement = document.createElement('div');
                    messageElement.className = `message ${isSent ? 'message-sent' : 'message-received'}`;
                    
                    const user = isSent ? currentUser : users.find(u => u.id === msg.sender);
                    
                    // Special handling for Zoom links
                    if (msg.text.includes('zoom.us') || msg.isZoomLink) {
                        const zoomLink = msg.text.includes('http') ? msg.text.split(' ').find(part => part.includes('http')) : '';
                        messageElement.innerHTML = `
                            <div class="message-text">
                                <strong>Zoom Meeting Invitation</strong><br>
                                ${msg.text.replace(zoomLink, '').replace('Zoom Meeting Link:', '')}
                                ${zoomLink ? `<a href="${zoomLink}" target="_blank" class="zoom-join-btn">Join Zoom Meeting</a>` : ''}
                            </div>
                            <div class="message-info">
                                <span>${msg.time}</span>
                                ${isSent ? `<span class="message-status ${msg.status}"><i class="fas fa-check${msg.status === 'read' ? '-double' : ''}"></i></span>` : ''}
                            </div>
                        `;
                    } else {
                        messageElement.innerHTML = `
                            <div class="message-text">${msg.text}</div>
                            <div class="message-info">
                                <span>${msg.time}</span>
                                ${isSent ? `<span class="message-status ${msg.status}"><i class="fas fa-check${msg.status === 'read' ? '-double' : ''}"></i></span>` : ''}
                            </div>
                        `;
                    }
                    messagesContainer.appendChild(messageElement);
                });

                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            // Mark messages as read
            function markMessagesAsRead(conversationId) {
                const conversation = conversations.find(c => c.id === conversationId);
                if (!conversation) return;

                conversation.messages.forEach(msg => {
                    if (msg.sender !== currentUser.id) {
                        msg.status = 'read';
                    }
                });

                conversation.unread = 0;
                renderConversationList();
            }

            // Send a message
            function sendMessage() {
                const messageText = messageInput.value.trim();
                if (!messageText || !activeConversation) return;

                const newMessage = {
                    id: `msg${Date.now()}`,
                    sender: currentUser.id,
                    text: messageText,
                    time: getCurrentTime(),
                    status: 'delivered'
                };

                // Add to active conversation
                const conversation = conversations.find(c => c.id === activeConversation.id);
                if (conversation) {
                    conversation.messages.push(newMessage);
                    conversation.lastMessage = messageText;
                    conversation.lastMessageTime = 'Just now';
                    renderMessages(conversation.messages);
                }

                // Clear input
                messageInput.value = '';
            }

            // Search users
            function searchUsers() {
                const searchTerm = searchUserInput.value.toLowerCase();
                userSearchResults.innerHTML = '';

                if (searchTerm.length < 2) return;

                const filteredUsers = users
    .filter(user => user.id !== currentUser.id)
    .filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        (user.email && user.email.toLowerCase().includes(searchTerm))
    );


                if (filteredUsers.length === 0) {
                    userSearchResults.innerHTML = '<div class="empty-result">No users found</div>';
                    return;
                }

                filteredUsers.forEach(user => {
                    const userElement = document.createElement('div');
                    userElement.className = 'user-result';
                    userElement.innerHTML = `
                        <div class="user-result-info">
                            <div class="user-result-avatar">${user.avatar}</div>
                            <div>
                                <div class="user-result-name">${user.name}</div>
                                <div class="user-result-email">${user.email}</div>
                            </div>
                        </div>
                    `;
                    userElement.addEventListener('click', () => {
                        searchUserInput.value = user.name;
                        userSearchResults.innerHTML = '';
                    });
                    userSearchResults.appendChild(userElement);
                });
            }

            // Create new conversation
          function createNewConversation() {
    const userName = searchUserInput.value.trim();
    const initialMsg = initialMessage.value.trim();
    
    if (!userName || !initialMsg) {
        alert('Please select a user and write an initial message');
        return;
    }

    const user = users.find(u => u.name === userName);
    if (!user) {
        alert('User not found');
        return;
    }

    // Check if conversation already exists
    const existingConv = conversations.find(c => c.userId === user.id);
    if (existingConv) {
        loadConversation(existingConv.id);
        newChatModal.classList.remove('show');
        return;
    }

    const newConvId = `conv${Date.now()}`;
    const messageId = `msg${Date.now()}`;

    // Create new conversation object (frontend copy)
    const newConversation = {
        id: newConvId,
        userId: user.id,
        lastMessage: initialMsg,
        lastMessageTime: 'Just now',
        unread: 0,
        swapDetails: null,
        messages: [
            {
                id: messageId,
                sender: currentUser.id,
                text: initialMsg,
                time: getCurrentTime(),
                status: 'delivered'
            }
        ]
    };

    // 🔴 Save initial message to backend DB
    fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            conversationId: newConvId,
            senderId: currentUser.id,
            userId: newConversation.userId,
            initialMessage: initialMsg
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log("✅ Conversation and message saved to DB");
        } else {
            console.warn("⚠️ Could not save to DB");
        }
    })
    .catch(err => {
        console.error("❌ DB Error:", err);
    });

    // Update frontend
    conversations.push(newConversation);
    renderConversationList();
    loadConversation(newConversation.id);
    newChatModal.classList.remove('show');
    searchUserInput.value = '';
    initialMessage.value = '';
}


            // Show swap details
            function showSwapDetails() {
                if (!activeConversation || !activeConversation.swapDetails) {
                    alert('No swap details available for this conversation');
                    return;
                }

                const details = activeConversation.swapDetails;
                swapDetailsModalBody.innerHTML = `
                    <div class="swap-item">
                        <h4>Your Item</h4>
                        <p>${details.yourItem}</p>
                        <p class="item-description">${details.yourItemDesc}</p>
                    </div>
                    <div class="swap-item">
                        <h4>Their Item</h4>
                        <p>${details.theirItem}</p>
                        <p class="item-description">${details.theirItemDesc}</p>
                    </div>
                    <div class="swap-images">
                        ${details.images.map(img => `<img src="${img}" class="swap-image" alt="Swap item">`).join('')}
                    </div>
                    <div class="swap-status">
                        <p>Status: <span class="status-${details.status}">${details.status}</span></p>
                    </div>
                `;

                swapDetailsModal.classList.add('show');
            }

            // Load swap details in sidebar
            function loadSwapDetails(details) {
                if (!details) {
                    swapDetailsContent.innerHTML = `
                        <div class="empty-details">
                            <i class="fas fa-info-circle"></i>
                            <p>No swap details available</p>
                        </div>
                    `;
                    return;
                }

                swapDetailsContent.innerHTML = `
                    <div class="swap-item">
                        <h4>Your Item</h4>
                        <p>${details.yourItem}</p>
                        <p class="item-description">${details.yourItemDesc}</p>
                    </div>
                    <div class="swap-item">
                        <h4>Their Item</h4>
                        <p>${details.theirItem}</p>
                        <p class="item-description">${details.theirItemDesc}</p>
                    </div>
                    <div class="swap-images">
                        ${details.images.map(img => `<img src="${img}" class="swap-image" alt="Swap item">`).join('')}
                    </div>
                    <div class="swap-status">
                        <p>Status: <span class="status-${details.status}">${details.status}</span></p>
                    </div>
                `;

                swapDetailsSidebar.classList.add('show');
            }

            // Agree to swap
            function agreeToSwapAction() {
                if (!activeConversation || !activeConversation.swapDetails) return;

                activeConversation.swapDetails.status = 'agreed';
                loadSwapDetails(activeConversation.swapDetails);
                swapDetailsModal.classList.remove('show');
                
                // Add system message about agreement
                const newMessage = {
                    id: `msg${Date.now()}`,
                    sender: 'system',
                    text: `${currentUser.name} has agreed to the swap!`,
                    time: getCurrentTime(),
                    status: 'read'
                };

                const conversation = conversations.find(c => c.id === activeConversation.id);
                if (conversation) {
                    conversation.messages.push(newMessage);
                    renderMessages(conversation.messages);
                }
            }

            // Get current time in HH:MM AM/PM format
            function getCurrentTime() {
                const now = new Date();
                let hours = now.getHours();
                const minutes = now.getMinutes().toString().padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                return `${hours}:${minutes} ${ampm}`;
            }

            // Simulate receiving a message
            function simulateReceivedMessage() {
                if (conversations.length === 0) return;

                const randomConvIndex = Math.floor(Math.random() * conversations.length);
                const conversation = conversations[randomConvIndex];
                const user = users.find(u => u.id === conversation.userId);

                const messages = [
                    "Hi there!",
                    "Are you still interested?",
                    "When would you like to meet?",
                    "I can send you more photos if you'd like",
                    "Here's the Zoom link for our meeting: https://zoom.us/j/123456789",
                    "Does tomorrow work for you?"
                ];

                const newMessage = {
                    id: `msg${Date.now()}`,
                    sender: user.id,
                    text: messages[Math.floor(Math.random() * messages.length)],
                    time: getCurrentTime(),
                    status: 'delivered'
                };

                conversation.messages.push(newMessage);
                conversation.lastMessage = newMessage.text;
                conversation.lastMessageTime = 'Just now';
                
                if (!activeConversation || activeConversation.id !== conversation.id) {
                    conversation.unread = (conversation.unread || 0) + 1;
                }

                renderConversationList();
                
                if (activeConversation && activeConversation.id === conversation.id) {
                    renderMessages(conversation.messages);
                    markMessagesAsRead(conversation.id);
                }
            }

            // Initialize the app
            init();
        });