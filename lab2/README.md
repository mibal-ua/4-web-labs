# Lab 2 - JWT Authentication System

A JWT (JSON Web Token) authentication system built with Node.js and Express for the Web Technologies course.

## Features

- User registration with encrypted passwords (bcrypt)
- User login with JWT token generation
- Role-based access control (user and admin roles)
- Protected routes with JWT verification
- Token-based authentication in Authorization header

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your JWT secret:
```
JWT_SECRET=your_super_secret_key_here_change_in_production
PORT=3001
```

## Running the Application

Start the server:
```bash
npm start
```

The application will be available at http://localhost:3001

## API Endpoints

### Public Endpoints

- `POST /users/register` - Register a new user
  - Body: `{ "username": "string", "password": "string", "role": "user|admin" }`
  
- `POST /users/login` - Login user
  - Body: `{ "username": "string", "password": "string" }`

### Protected Endpoints (Require JWT Token)

- `GET /users/profile` - Get current user profile
  - Headers: `Authorization: Bearer <token>`

- `GET /users` - Get all users (Admin only)
  - Headers: `Authorization: Bearer <token>`

- `PUT /users/:id` - Update user
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "password": "string", "newRole": "user|admin" }`

- `DELETE /users/:id` - Delete user (Admin only)
  - Headers: `Authorization: Bearer <token>`

## Testing with Web Interface

1. Open http://localhost:5000 in your browser
2. Register a new user (choose role: user or admin)
3. Login with your credentials
4. Test protected endpoints

## Testing with cURL

### Register a user:
```bash
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"admin123","role":"admin"}'
```

### Login:
```bash
curl -X POST http://localhost:5000/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"admin123"}'
```

### Get profile (use token from login response):
```bash
curl -X GET http://localhost:5000/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Role-based access control for admin operations
- Token verification middleware for protected routes