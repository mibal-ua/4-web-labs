require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory user storage (in production, use a database)
const users = [];

// Helper function to find user
const findUser = (username) => users.find(user => user.username === username);
const findUserById = (id) => users.find(user => user.id === id);

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Middleware to check admin role
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next();
};

// Routes
// Welcome route
app.get('/', (req, res) => {
    res.json({ 
        message: 'JWT Authentication API',
        endpoints: {
            register: 'POST /users/register',
            login: 'POST /users/login',
            profile: 'GET /users/profile (requires auth)',
            users: 'GET /users (requires admin)',
            update: 'PUT /users/:id (requires auth)',
            delete: 'DELETE /users/:id (requires admin)'
        }
    });
});

// User registration
app.post('/users/register', async (req, res) => {
    try {
        const { username, password, role = 'user' } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        // Check if user already exists
        if (findUser(username)) {
            return res.status(409).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
            id: users.length + 1,
            username,
            password: hashedPassword,
            role: ['admin', 'user'].includes(role) ? role : 'user',
            createdAt: new Date()
        };
        
        users.push(newUser);
        
        // Generate token
        const token = generateToken(newUser);
        
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// User login
app.post('/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        // Find user
        const user = findUser(username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Generate token
        const token = generateToken(user);
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// Get user profile (protected route)
app.get('/users/profile', authMiddleware, (req, res) => {
    const user = findUserById(req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
    });
});

// Get all users (admin only)
app.get('/users', authMiddleware, adminMiddleware, (req, res) => {
    const usersData = users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
    }));
    
    res.json(usersData);
});

// Update user (authenticated users can update their own profile)
app.put('/users/:id', authMiddleware, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { password, newRole } = req.body;
        
        // Check if user can update this profile
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const user = findUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update password if provided
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }
        
        // Only admin can change roles
        if (newRole && req.user.role === 'admin') {
            if (['admin', 'user'].includes(newRole)) {
                user.role = newRole;
            }
        }
        
        res.json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
});

// Delete user (admin only)
app.delete('/users/:id', authMiddleware, adminMiddleware, (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    users.splice(userIndex, 1);
    res.json({ message: 'User deleted successfully' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} for API documentation`);
});