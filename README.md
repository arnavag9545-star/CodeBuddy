# CodeBuddy

A real-time collaborative coding platform. Multiple users can join a shared workspace to write code together, draw on a whiteboard, and communicate via voice chat.

## Features

- **Collaborative Code Editor** - Monaco-based editor with syntax highlighting, autocomplete, and real-time sync across users
- **Shared Canvas** - Whiteboard for sketching ideas, diagrams, or explaining concepts
- **Voice Chat** - WebRTC-based voice rooms for communication during sessions
- **Multiple File Support** - Create and switch between multiple code files
- **Room System** - Create or join rooms using a simple room code
- **User Authentication** - Email/password based login and signup

## Tech Stack

**Frontend:**
- React 18 with Vite
- Monaco Editor
- Fabric.js for canvas
- PeerJS for voice chat
- Socket.io client

**Backend:**
- Node.js with Express
- Socket.io for real-time communication
- MongoDB with Mongoose
- JWT for authentication

## Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/arnavag9545-star/CodeBuddy.git
cd CodeBuddy
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file in the `server` directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/codebuddy
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

Replace `MONGODB_URI` with your MongoDB connection string if using Atlas.

### 5. Start the backend server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:5000`.

### 6. Start the frontend (in a new terminal)

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`.

## Usage

1. Open `http://localhost:5173` in your browser
2. Create an account or log in
3. Create a new room or join an existing one using a room code
4. Share the room code with others to collaborate

## Project Structure

```
CodeBuddy/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── pages/              # Page components
│   └── services/           # API and socket services
├── server/                 # Backend Node.js app
│   ├── src/
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # Express routes
│   │   ├── socket/         # Socket.io handlers
│   │   └── middleware/     # Auth middleware
│   └── package.json
├── public/                 # Static assets
└── package.json
```

## Known Issues

- Google OAuth is not implemented (requires Google Cloud Console setup)
- Code execution uses a third-party API and may have rate limits
- Voice chat requires microphone permissions

## License

MIT
