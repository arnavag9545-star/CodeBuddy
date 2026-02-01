# CodeBuddy Backend

Real-time collaborative coding platform backend.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Configure MongoDB:
   - Edit `server/.env` and add your MongoDB Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/codebuddy?retryWrites=true&w=majority
   ```

3. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:roomId` - Get room details
- `POST /api/rooms/:roomId/join` - Join room
- `GET /api/rooms/:roomId/state` - Get room state
- `DELETE /api/rooms/:roomId` - Delete room (host only)

## Socket.io Events

### Room Events
- `join-room` - Join a collaboration room
- `leave-room` - Leave current room
- `room-state` - Receive full room state (for late joiners)
- `user-joined` - User joined notification
- `user-left` - User left notification

### Code Sync (Real-time)
- `code-change` - Code content changed
- `cursor-position` - Cursor position update
- `file-create` - New file created
- `file-delete` - File deleted
- `file-rename` - File renamed
- `active-file-change` - Active file changed

### Canvas Sync (Real-time)
- `canvas-object-add` - Object added to canvas
- `canvas-object-modify` - Object modified
- `canvas-object-delete` - Object deleted
- `canvas-path-create` - Drawing path created
- `canvas-full-sync` - Full canvas state sync

### Chat
- `chat-message` - Chat message sent/received

### Terminal
- `terminal-output` - Code execution output
