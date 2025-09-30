# Lab 1 - Real-time Chat Application

A real-time chat application built with Node.js, Express, and Socket.io for the Web Technologies course.

## Features

- Real-time messaging using WebSocket protocol
- Multiple chat rooms support
- User authentication (username-based)
- Active users list
- Join/leave notifications
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:
```bash
npm install
```

## Running the Application

Start the server:
```bash
npm start
```

The application will be available at http://localhost:3001

## Usage

1. Open http://localhost:3001 in your browser
2. Enter a username and room name
3. Click "Приєднатись" (Join) to enter the chat room
4. Start chatting with other users in the same room

You can open multiple browser windows/tabs to simulate multiple users.

## Project Structure

```
lab1/
├── server.js           # Express server with Socket.io
├── package.json        # Project dependencies
├── public/            # Static files
│   ├── index.html     # Login page
│   ├── chat.html      # Chat interface
│   └── styles.css     # Application styles
└── README.md          # This file
```

## Technologies Used

- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **HTML/CSS/JavaScript** - Frontend technologies

## Features Implementation

- **WebSocket Connection**: Established using Socket.io for real-time communication
- **Room Management**: Users can join specific rooms and only see messages from their room
- **User Tracking**: Active users are tracked and displayed in the sidebar
- **Message Types**: Different styling for own messages, other users' messages, and system notifications
- **Responsive Design**: Works on both desktop and mobile devices