# Web Technologies Course - Project Summary

## Course Information
- **Course**: Основи WEB технологій (Web Technologies Fundamentals)
- **Student Variant**: 11
- **Institution**: КПІ ім. Сікорського

## Completed Labs

### Lab 1 - Real-time Chat Application (WebSocket + Socket.io)
**Directory**: `/lab1`

**Objective**: Develop a real-time messaging application using WebSocket protocol and Socket.io library.

**Implementation**:
- **Server**: Node.js + Express + Socket.io
- **Features**: 
  - Real-time messaging
  - Multiple chat rooms
  - User authentication (username-based)
  - Active users list
  - Join/leave notifications
- **Files**:
  - `server.js` - Main server with Socket.io
  - `public/index.html` - Login page
  - `public/chat.html` - Chat interface
  - `public/styles.css` - Application styling
  - `README.md` - Documentation
  - `lab1_report.md` - Lab report

**Key Technologies**:
- WebSocket protocol for real-time communication
- Socket.io for bidirectional event-based communication
- Express for web server
- Session storage for user data

**Running**: `npm start` → http://localhost:3001

---

### Lab 2 - JWT Authentication System
**Directory**: `/lab2`

**Objective**: Create website authorization system using JWT tokens with encrypted password storage and role-based access control.

**Requirements Met**:
1. ✅ Password encryption during registration and updates (bcrypt)
2. ✅ `/users/login` endpoint for authentication
3. ✅ JWT token authorization via Authorization header
4. ✅ Role-based access (user and admin roles)

**Implementation**:
- **Server**: Node.js + Express + JWT
- **Security**: bcrypt password hashing, JWT tokens (24h expiration)
- **Features**:
  - User registration with role selection
  - Login with JWT token generation
  - Protected routes with token verification
  - Role-based middleware (admin/user permissions)
  - Complete user management CRUD operations
- **Files**:
  - `server.js` - Main API server
  - `public/index.html` - Web testing interface
  - `.env` - Environment configuration
  - `.gitignore` - Git ignore rules
  - `README.md` - API documentation
  - `lab2_report.md` - Lab report

**API Endpoints**:
- `POST /users/register` - User registration
- `POST /users/login` - User authentication
- `GET /users/profile` - Get profile (auth required)
- `GET /users` - Get all users (admin only)
- `PUT /users/:id` - Update user (auth required)
- `DELETE /users/:id` - Delete user (admin only)

**Key Technologies**:
- JWT (JSON Web Token) for stateless authentication
- bcrypt for secure password hashing
- Role-based access control
- Express middleware for route protection

**Running**: `npm start` → http://localhost:3001

---

## Project Structure
```
web-tech/
├── lab1/                    # Real-time Chat Application
│   ├── server.js           # Socket.io server
│   ├── public/             # Client-side files
│   ├── package.json        # Dependencies
│   └── README.md           # Documentation
├── lab2/                    # JWT Authentication System
│   ├── server.js           # Express API server
│   ├── public/             # Web interface
│   ├── .env                # Environment config
│   ├── package.json        # Dependencies
│   └── README.md           # API documentation
└── project_summary.md      # This file
```

## Variant 11 Context
- **Lab 1**: No variant-specific requirements (common chat app)
- **Lab 2**: No variant-specific requirements (common JWT auth)
- **Lab 4**: Database design for technological cards (деталь, вид обробки, тривалість обробки)

## Technologies Used
- **Backend**: Node.js, Express.js
- **Real-time**: Socket.io, WebSocket
- **Authentication**: JWT, bcrypt
- **Frontend**: HTML, CSS, JavaScript
- **Development**: npm, git

## Testing
Both labs include:
- Web interfaces for manual testing
- API endpoints for programmatic testing
- Complete documentation with usage examples
- cURL commands for API testing

## Git Repository
- Clean commits with descriptive messages
- Proper .gitignore files (excluding node_modules)
- Separate directories for each lab
- Comprehensive documentation