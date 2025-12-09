const API_URL = '/api';
let socket = null;
let currentUser = null;
let currentRoom = null;
let selectedFile = null;

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabButtons = document.querySelectorAll('.tab-btn');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${tab}-form`).classList.add('active');
    });
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            initializeApp();
        } else {
            document.getElementById('login-error').textContent = data.error || 'Помилка входу';
        }
    } catch (error) {
        document.getElementById('login-error').textContent = 'Помилка з\'єднання з сервером';
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            initializeApp();
        } else {
            document.getElementById('register-error').textContent = data.error || 'Помилка реєстрації';
        }
    } catch (error) {
        document.getElementById('register-error').textContent = 'Помилка з\'єднання з сервером';
    }
});

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            return true;
        } else {
            localStorage.removeItem('token');
            return false;
        }
    } catch (error) {
        return false;
    }
}

async function initializeApp() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'flex';
    
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-avatar').src = currentUser.avatar;
    
    connectSocket();
    await loadRooms();
    loadOnlineUsers();
    
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('create-room-btn').addEventListener('click', showCreateRoomModal);
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    setupTypingIndicator();
    setupFileUpload();
    setupModal();
}

function connectSocket() {
    const token = localStorage.getItem('token');
    socket = io({
        auth: { token }
    });
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('userConnected', (data) => {
        showSystemMessage(`${data.userName} приєднався до чату`);
        loadOnlineUsers();
    });
    
    socket.on('userDisconnected', (data) => {
        showSystemMessage(`${data.userName} покинув чат`);
        loadOnlineUsers();
    });
    
    socket.on('newMessage', (message) => {
        if (currentRoom === message.roomId.toString()) {
            displayMessage(message);
        }
        updateRoomLastMessage(message.roomId, message.text);
    });
    
    socket.on('userJoinedRoom', (data) => {
        if (currentRoom === data.roomId) {
            showSystemMessage(`${data.userName} приєднався до кімнати`);
        }
    });
    
    socket.on('userLeftRoom', (data) => {
        if (currentRoom === data.roomId) {
            showSystemMessage(`${data.userName} покинув кімнату`);
        }
    });
    
    socket.on('roomCreated', (room) => {
        loadRooms();
    });
    
    socket.on('userTyping', (data) => {
        if (currentRoom === data.roomId && data.userId !== currentUser.id) {
            showTypingIndicator(data.userName);
        }
    });
    
    socket.on('userStoppedTyping', (data) => {
        if (currentRoom === data.roomId) {
            hideTypingIndicator();
        }
    });
    
    socket.on('error', (error) => {
        alert(error.message || 'Виникла помилка');
    });
}

async function loadRooms() {
    try {
        const response = await fetch(`${API_URL}/rooms`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const rooms = await response.json();
            displayRooms(rooms);
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

function displayRooms(rooms) {
    const roomsList = document.getElementById('rooms-list');
    roomsList.innerHTML = rooms.map(room => `
        <div class="room-item ${currentRoom === room._id ? 'active' : ''}" data-room-id="${room._id}">
            <h4>${room.name}</h4>
            <p>${room.description || 'Немає опису'}</p>
            ${room.lastMessage ? `
                <p style="font-size: 12px; color: #95a5a6; margin-top: 5px;">
                    ${room.lastMessage.text.substring(0, 30)}${room.lastMessage.text.length > 30 ? '...' : ''}
                </p>
            ` : ''}
            ${room.messageCount > 0 ? `<span class="badge">${room.messageCount}</span>` : ''}
        </div>
    `).join('');
    
    document.querySelectorAll('.room-item').forEach(item => {
        item.addEventListener('click', () => joinRoom(item.dataset.roomId));
    });
}

async function joinRoom(roomId) {
    if (currentRoom === roomId) return;
    
    if (currentRoom) {
        socket.emit('leaveRoom', currentRoom);
    }
    
    currentRoom = roomId;
    socket.emit('joinRoom', roomId);
    
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.toggle('active', item.dataset.roomId === roomId);
    });
    
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('chat-container').style.display = 'flex';
    
    const room = await getRoomInfo(roomId);
    document.getElementById('room-name').textContent = room.name;
    document.getElementById('room-members-count').textContent = `${room.members.length} учасників`;
    
    await loadMessages(roomId);
}

async function getRoomInfo(roomId) {
    const response = await fetch(`${API_URL}/rooms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const rooms = await response.json();
    return rooms.find(r => r._id === roomId);
}

async function loadMessages(roomId) {
    try {
        const response = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const messages = await response.json();
            const container = document.getElementById('messages-container');
            container.innerHTML = '';
            messages.forEach(message => displayMessage(message));
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function displayMessage(message) {
    const container = document.getElementById('messages-container');
    const isOwn = message.userId === currentUser.id || message.user?.id === currentUser.id;
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isOwn ? 'own' : ''}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let fileHtml = '';
    if (message.file) {
        const fileSize = (message.file.size / 1024).toFixed(1);
        const fileIcon = getFileIcon(message.file.mimetype);
        fileHtml = `
            <a href="${message.file.url}" target="_blank" class="file-attachment">
                <span class="file-icon">${fileIcon}</span>
                <div class="file-info">
                    <span class="file-name">${message.file.originalName}</span>
                    <span class="file-size">${fileSize} KB</span>
                </div>
            </a>
        `;
    }
    
    messageEl.innerHTML = `
        ${!isOwn ? `<img src="${message.user?.avatar || ''}" alt="${message.user?.name || ''}" class="message-avatar">` : ''}
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${message.user?.name || 'Unknown'}</span>
                <span class="message-time">${time}</span>
            </div>
            ${message.text ? `<div class="message-text">${escapeHtml(message.text)}</div>` : ''}
            ${fileHtml}
        </div>
    `;
    
    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;
}

function showSystemMessage(text) {
    const container = document.getElementById('messages-container');
    const messageEl = document.createElement('div');
    messageEl.className = 'system-message';
    messageEl.textContent = text;
    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (!text && !selectedFile) return;
    if (!currentRoom) return;
    
    let fileId = null;
    if (selectedFile) {
        fileId = await uploadFile(selectedFile);
        if (!fileId) return;
    }
    
    socket.emit('sendMessage', {
        roomId: currentRoom,
        text,
        fileId
    });
    
    input.value = '';
    cancelFileSelection();
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            return data._id;
        } else {
            alert('Помилка завантаження файлу');
            return null;
        }
    } catch (error) {
        alert('Помилка завантаження файлу');
        return null;
    }
}

function setupFileUpload() {
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            fileName.textContent = file.name;
            filePreview.style.display = 'block';
        }
    });
    
    document.getElementById('cancel-file').addEventListener('click', cancelFileSelection);
}

function cancelFileSelection() {
    selectedFile = null;
    document.getElementById('file-input').value = '';
    document.getElementById('file-preview').style.display = 'none';
}

function setupTypingIndicator() {
    let typingTimer;
    const input = document.getElementById('message-input');
    
    input.addEventListener('input', () => {
        if (!currentRoom) return;
        
        socket.emit('typing', { roomId: currentRoom });
        
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            socket.emit('stopTyping', { roomId: currentRoom });
        }, 1000);
    });
}

function showTypingIndicator(userName) {
    const indicator = document.getElementById('typing-indicator');
    indicator.textContent = `${userName} друкує...`;
}

function hideTypingIndicator() {
    document.getElementById('typing-indicator').textContent = '';
}

async function loadOnlineUsers() {
    try {
        const response = await fetch(`${API_URL}/users/online`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayOnlineUsers(users);
        }
    } catch (error) {
        console.error('Error loading online users:', error);
    }
}

function displayOnlineUsers(users) {
    const container = document.getElementById('online-users-list');
    container.innerHTML = users.map(user => `
        <div class="online-user">
            <div class="online-indicator"></div>
            <span>${user.name}</span>
        </div>
    `).join('');
}

function setupModal() {
    const modal = document.getElementById('create-room-modal');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('create-room-form');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('room-name-input').value;
        const description = document.getElementById('room-description-input').value;
        const isPrivate = document.getElementById('room-private-input').checked;
        
        try {
            const response = await fetch(`${API_URL}/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name, description, isPrivate })
            });
            
            if (response.ok) {
                modal.style.display = 'none';
                form.reset();
                await loadRooms();
            } else {
                alert('Помилка створення кімнати');
            }
        } catch (error) {
            alert('Помилка створення кімнати');
        }
    });
}

function showCreateRoomModal() {
    document.getElementById('create-room-modal').style.display = 'flex';
}

function updateRoomLastMessage(roomId, text) {
    const roomItem = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomItem) {
        const lastMessageEl = roomItem.querySelector('p:last-child');
        if (lastMessageEl && lastMessageEl.style.fontSize === '12px') {
            lastMessageEl.textContent = text.substring(0, 30) + (text.length > 30 ? '...' : '');
        }
    }
}

function getFileIcon(mimetype) {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('zip')) return '📦';
    if (mimetype.includes('doc')) return '📝';
    return '📎';
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function logout() {
    localStorage.removeItem('token');
    if (socket) socket.disconnect();
    currentUser = null;
    currentRoom = null;
    authContainer.style.display = 'flex';
    appContainer.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkAuth();
    if (isAuthenticated) {
        initializeApp();
    }
});