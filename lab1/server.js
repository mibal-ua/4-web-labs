const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Store users and rooms
const users = new Map();
const rooms = new Map();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // Handle user join
    socket.on('join', (data) => {
        const { username, room } = data;
        
        // Store user info
        users.set(socket.id, { username, room });
        
        // Join room
        socket.join(room);
        
        // Get users in room
        const roomUsers = Array.from(users.values()).filter(user => user.room === room);
        
        // Welcome current user
        socket.emit('message', {
            user: 'Admin',
            text: `Welcome to room ${room}!`,
            time: new Date().toTimeString().split(' ')[0]
        });
        
        // Broadcast when user joins
        socket.broadcast.to(room).emit('message', {
            user: 'Admin',
            text: `${username} has joined the chat`,
            time: new Date().toTimeString().split(' ')[0]
        });
        
        // Send users in room
        io.to(room).emit('roomUsers', {
            room,
            users: roomUsers
        });
    });

    // Handle chat message
    socket.on('chatMessage', (msg) => {
        const user = users.get(socket.id);
        if (user) {
            io.to(user.room).emit('message', {
                user: user.username,
                text: msg,
                time: new Date().toTimeString().split(' ')[0]
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            // Remove user
            users.delete(socket.id);
            
            // Get remaining users in room
            const roomUsers = Array.from(users.values()).filter(u => u.room === user.room);
            
            // Notify room that user left
            socket.broadcast.to(user.room).emit('message', {
                user: 'Admin',
                text: `${user.username} has left the chat`,
                time: new Date().toTimeString().split(' ')[0]
            });
            
            // Update room users
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: roomUsers
            });
        }
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});