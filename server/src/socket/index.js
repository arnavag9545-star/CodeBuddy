import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Room from '../models/Room.js';
import RoomState from '../models/RoomState.js';

/**
 * Socket.io Handler - Core Real-time Sync Engine
 * 
 * PRIORITY FEATURES:
 * 1. Code Editor Sync (real-time code changes)
 * 2. Canvas Sync (real-time drawing)
 * 3. Late Joiner State Restoration
 * 4. Chat Messages
 */

// Store active users per room
const roomUsers = new Map(); // roomId -> Map<socketId, userInfo>

// Store host per room (first user to join becomes host)
const roomHosts = new Map(); // roomId -> socketId

// Store room settings
const roomSettings = new Map(); // roomId -> { chatDisabled: boolean }

// Debounce timers for database saves
const saveTimers = new Map();

/**
 * Debounced save to database (prevents hammering DB on every keystroke)
 * Supports both general updates and file-specific updates
 */
const pendingSaves = new Map(); // roomId -> { fileId: content }

const debouncedSave = (roomId, fileId = null, content = null) => {
    // Clear existing timer
    if (saveTimers.has(roomId)) {
        clearTimeout(saveTimers.get(roomId));
    }

    // Track pending file updates
    if (fileId && content !== null) {
        if (!pendingSaves.has(roomId)) {
            pendingSaves.set(roomId, new Map());
        }
        pendingSaves.get(roomId).set(fileId, content);
    }

    // Set new timer - save after 2 seconds of inactivity
    const timer = setTimeout(async () => {
        try {
            const filesToSave = pendingSaves.get(roomId);
            if (filesToSave && filesToSave.size > 0) {
                // Save each pending file update
                for (const [fId, fContent] of filesToSave) {
                    await RoomState.findOneAndUpdate(
                        { roomId, 'codeFiles.id': fId },
                        {
                            $set: {
                                'codeFiles.$.content': fContent,
                                'codeFiles.$.lastModified': new Date()
                            },
                            lastUpdated: new Date()
                        }
                    );
                }
                console.log(`💾 Saved ${filesToSave.size} file(s) for room: ${roomId}`);
                pendingSaves.delete(roomId);
            }
        } catch (error) {
            console.error(`❌ Save error for room ${roomId}:`, error.message);
        }
        saveTimers.delete(roomId);
    }, 2000);

    saveTimers.set(roomId, timer);
};

/**
 * Initialize Socket.io with all handlers
 */
export default function initializeSocket(io) {
    // Authentication middleware for sockets
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId);
                if (user) {
                    socket.user = user;
                }
            }

            // Allow anonymous users with a guest identity
            if (!socket.user) {
                socket.user = {
                    _id: `guest-${socket.id}`,
                    username: `Guest-${socket.id.substring(0, 6)}`,
                    isGuest: true
                };
            }

            next();
        } catch (error) {
            // Allow connection even with invalid token (as guest)
            socket.user = {
                _id: `guest-${socket.id}`,
                username: `Guest-${socket.id.substring(0, 6)}`,
                isGuest: true
            };
            next();
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Connected: ${socket.user.username} (${socket.id})`);

        // ========================================
        // ROOM MANAGEMENT
        // ========================================

        /**
         * Join a room - CRITICAL: Sends full state to late joiners
         * Optimized for speed - uses in-memory state first
         */
        socket.on('join-room', async ({ roomId, displayName }) => {
            try {
                socket.join(roomId);
                socket.roomId = roomId;

                // If displayName is provided, update socket.user.username
                if (displayName && displayName.trim()) {
                    socket.user.username = displayName.trim();
                    socket.displayName = displayName.trim();
                }

                // Track user in room
                if (!roomUsers.has(roomId)) {
                    roomUsers.set(roomId, new Map());
                }
                roomUsers.get(roomId).set(socket.id, {
                    id: socket.user._id,
                    username: socket.user.username,
                    isGuest: socket.user.isGuest || false,
                    socketId: socket.id
                });

                // Set host if first user in room
                if (!roomHosts.has(roomId)) {
                    roomHosts.set(roomId, socket.id);
                    console.log(`👑 ${socket.user.username} is now host of room: ${roomId}`);
                }

                // Initialize room settings if needed
                if (!roomSettings.has(roomId)) {
                    roomSettings.set(roomId, { chatDisabled: false });
                }

                const hostSocketId = roomHosts.get(roomId);
                const settings = roomSettings.get(roomId);

                // Fetch REAL state from database (enables late joiners + persistence)
                const roomState = await RoomState.getOrCreate(roomId);

                socket.emit('room-state', {
                    roomId,
                    state: {
                        codeFiles: roomState.codeFiles || [],
                        canvasFiles: roomState.canvasFiles || [],
                        chatMessages: roomState.chatMessages || [],
                        terminalHistory: roomState.terminalHistory || [],
                        activeCodeFileId: roomState.activeCodeFileId,
                        activeCanvasFileId: roomState.activeCanvasFileId
                    },
                    users: Array.from(roomUsers.get(roomId).values()),
                    hostSocketId,
                    chatDisabled: settings.chatDisabled
                });

                // Notify others that a new user joined
                socket.to(roomId).emit('user-joined', {
                    user: {
                        id: socket.user._id,
                        username: socket.user.username,
                        socketId: socket.id
                    },
                    users: Array.from(roomUsers.get(roomId).values()),
                    hostSocketId
                });

                console.log(`👤 ${socket.user.username} joined room: ${roomId}`);

            } catch (error) {
                console.error('Join room error:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        /**
         * Leave room
         */
        socket.on('leave-room', () => {
            handleLeaveRoom(socket, io);
        });

        // ========================================
        // CODE EDITOR SYNC - TOP PRIORITY
        // ========================================

        /**
         * Code change - broadcast to all users in room
         * This is the CORE real-time sync for code editor
         */
        socket.on('code-change', async ({ fileId, content, cursorPosition }) => {
            const roomId = socket.roomId;
            if (!roomId) {
                console.log('❌ code-change: No roomId');
                return;
            }

            console.log(`📝 code-change received from ${socket.user.username} in room ${roomId}, broadcasting...`);

            // Broadcast to all OTHER users in the room
            socket.to(roomId).emit('code-change', {
                fileId,
                content,
                cursorPosition,
                userId: socket.user._id,
                username: socket.user.username
            });

            // Debounced save to database
            debouncedSave(roomId, fileId, content);
        });

        /**
         * File operations (create, delete, rename)
         */
        socket.on('file-create', async ({ file }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            // Broadcast to others
            socket.to(roomId).emit('file-create', { file, userId: socket.user._id });

            // Save to database
            try {
                await RoomState.findOneAndUpdate(
                    { roomId },
                    { $push: { codeFiles: file } }
                );
            } catch (error) {
                console.error('File create save error:', error);
            }
        });

        socket.on('file-delete', async ({ fileId }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('file-delete', { fileId, userId: socket.user._id });

            try {
                await RoomState.findOneAndUpdate(
                    { roomId },
                    { $pull: { codeFiles: { id: fileId } } }
                );
            } catch (error) {
                console.error('File delete save error:', error);
            }
        });

        socket.on('file-rename', async ({ fileId, newName }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('file-rename', { fileId, newName, userId: socket.user._id });

            // Save to database - update filename directly
            try {
                await RoomState.findOneAndUpdate(
                    { roomId, 'codeFiles.id': fileId },
                    {
                        $set: {
                            'codeFiles.$.filename': newName,
                            'codeFiles.$.lastModified': new Date()
                        },
                        lastUpdated: new Date()
                    }
                );
            } catch (error) {
                console.error('File rename save error:', error);
            }
        });

        socket.on('active-file-change', async ({ fileId }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            // Just broadcast - don't sync active file to others (personal preference)
            socket.to(roomId).emit('active-file-change', {
                fileId,
                userId: socket.user._id,
                username: socket.user.username
            });
        });

        /**
         * Cursor position sync - shows where other users are editing
         */
        socket.on('cursor-position', ({ fileId, position, selection }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('cursor-position', {
                fileId,
                position,
                selection,
                userId: socket.user._id,
                username: socket.user.username
            });
        });

        // ========================================
        // TAB GROUPS SYNC
        // ========================================

        socket.on('tab-group-create', async ({ group }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('tab-group-create', { group });

            try {
                await RoomState.findOneAndUpdate(
                    { roomId },
                    { $push: { tabGroups: group } }
                );
            } catch (error) {
                console.error('Tab group create error:', error);
            }
        });

        socket.on('tab-group-update', async ({ groupId, updates }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('tab-group-update', { groupId, updates });
        });

        socket.on('tab-group-delete', async ({ groupId }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('tab-group-delete', { groupId });

            try {
                await RoomState.findOneAndUpdate(
                    { roomId },
                    { $pull: { tabGroups: { id: groupId } } }
                );
            } catch (error) {
                console.error('Tab group delete error:', error);
            }
        });

        // ========================================
        // CANVAS SYNC - TOP PRIORITY
        // ========================================

        /**
         * Canvas object added/modified
         */
        socket.on('canvas-object-add', ({ canvasId, object, objectId }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('canvas-object-add', {
                canvasId,
                object,
                objectId,
                userId: socket.user._id
            });
        });

        socket.on('canvas-object-modify', ({ canvasId, objectId, changes }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('canvas-object-modify', {
                canvasId,
                objectId,
                changes,
                userId: socket.user._id
            });
        });

        socket.on('canvas-object-delete', ({ canvasId, objectId }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('canvas-object-delete', {
                canvasId,
                objectId,
                userId: socket.user._id
            });
        });

        /**
         * Canvas path created (drawing)
         * This is the most frequent event during drawing
         */
        socket.on('canvas-path-create', ({ canvasId, pathData }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('canvas-path-create', {
                canvasId,
                pathData,
                userId: socket.user._id
            });
        });

        /**
         * Full canvas state sync (for complex operations)
         */
        socket.on('canvas-full-sync', async (payload) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            console.log(`🎨 Canvas sync from ${socket.user.username} in room ${roomId}`);

            // Pass through all payload fields (type, data, roomId, senderId, etc.)
            socket.to(roomId).emit('canvas-full-sync', {
                ...payload,
                userId: socket.user._id
            });

            // Save to database if there's actual canvas data
            if (payload.fabricJSON && payload.canvasId) {
                try {
                    await RoomState.findOneAndUpdate(
                        { roomId, 'canvasFiles.id': payload.canvasId },
                        {
                            $set: {
                                'canvasFiles.$.fabricJSON': payload.fabricJSON
                            },
                            lastUpdated: new Date()
                        }
                    );
                    console.log(`💾 Canvas saved for room: ${roomId}`);
                } catch (error) {
                    console.error('Canvas save error:', error);
                }
            }
        });

        /**
         * Canvas file operations
         */
        socket.on('canvas-file-create', async ({ file }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('canvas-file-create', { file });

            try {
                await RoomState.findOneAndUpdate(
                    { roomId },
                    { $push: { canvasFiles: file } }
                );
            } catch (error) {
                console.error('Canvas file create error:', error);
            }
        });

        socket.on('canvas-file-switch', ({ canvasId }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.to(roomId).emit('canvas-file-switch', {
                canvasId,
                userId: socket.user._id,
                username: socket.user.username
            });
        });

        // ========================================
        // CHAT MESSAGES
        // ========================================

        socket.on('chat-message', async ({ message }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            const chatMessage = {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: socket.user._id,
                username: socket.user.username,
                message,
                timestamp: new Date()
            };

            // Broadcast to all including sender
            io.to(roomId).emit('chat-message', chatMessage);

            // Save to database
            try {
                await RoomState.findOneAndUpdate(
                    { roomId },
                    {
                        $push: {
                            chatMessages: {
                                $each: [chatMessage],
                                $slice: -100 // Keep last 100 messages
                            }
                        }
                    }
                );
            } catch (error) {
                console.error('Chat save error:', error);
            }
        });

        // ========================================
        // VOICE ROOM - Zoom-style voice chat
        // ========================================

        // Track voice participants per room (in-memory)
        if (!global.voiceRooms) {
            global.voiceRooms = new Map(); // roomId -> Set of { peerId, socketId }
        }

        /**
         * User joins voice room
         */
        socket.on('voice-join', ({ peerId, roomId: voiceRoomId }) => {
            const roomId = socket.roomId || voiceRoomId;
            if (!roomId) return;

            console.log(`🎤 Voice join: ${peerId} in room ${roomId}`);

            // Initialize room if needed
            if (!global.voiceRooms.has(roomId)) {
                global.voiceRooms.set(roomId, []);
            }

            const voiceRoom = global.voiceRooms.get(roomId);

            // Send existing participants to the new joiner (include username)
            socket.emit('voice-participants', {
                participants: voiceRoom.filter(p => p.peerId !== peerId).map(p => ({
                    peerId: p.peerId,
                    socketId: p.socketId,
                    isMuted: p.isMuted,
                    username: p.username
                }))
            });

            // Add to voice room with username
            if (!voiceRoom.find(p => p.peerId === peerId)) {
                voiceRoom.push({ peerId, socketId: socket.id, isMuted: true, username: socket.user.username });
            }

            // Store voice peer ID on socket for cleanup
            socket.voicePeerId = peerId;

            // Broadcast to everyone (including sender) so their UI updates - include username
            io.to(roomId).emit('voice-join', { peerId, socketId: socket.id, username: socket.user.username });
        });

        /**
         * User leaves voice room
         */
        socket.on('voice-leave', ({ peerId }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            console.log(`🎤 Voice leave: ${peerId} from room ${roomId}`);

            const voiceRoom = global.voiceRooms.get(roomId);
            if (voiceRoom) {
                const idx = voiceRoom.findIndex(p => p.peerId === peerId);
                if (idx !== -1) voiceRoom.splice(idx, 1);
            }

            socket.voicePeerId = null;
            io.to(roomId).emit('voice-leave', { peerId });
        });

        /**
         * User mutes/unmutes
         */
        socket.on('voice-mute', ({ peerId, isMuted }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            const voiceRoom = global.voiceRooms.get(roomId);
            if (voiceRoom) {
                const participant = voiceRoom.find(p => p.peerId === peerId);
                if (participant) participant.isMuted = isMuted;
            }

            io.to(roomId).emit('voice-mute', { peerId, isMuted });
        });

        // ========================================
        // TERMINAL OUTPUT SYNC
        // ========================================

        socket.on('terminal-output', async ({ entry }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            // Broadcast to others
            socket.to(roomId).emit('terminal-output', { entry });

            // Save to database (keep last 50 entries)
            try {
                await RoomState.findOneAndUpdate(
                    { roomId },
                    {
                        $push: {
                            terminalHistory: {
                                $each: [entry],
                                $slice: -50
                            }
                        }
                    }
                );
            } catch (error) {
                console.error('Terminal save error:', error);
            }
        });

        // ========================================
        // CANVAS SYNC
        // ========================================

        socket.on('canvas-full-sync', async (data) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            console.log(`🎨 Canvas sync from ${socket.username} in room ${roomId}`);

            // Broadcast to all other users in the room
            socket.to(roomId).emit('canvas-full-sync', data);

            // Save to database for late joiners (only for full-canvas type)
            if (data.type === 'full-canvas' && data.data) {
                try {
                    await RoomState.findOneAndUpdate(
                        { roomId },
                        {
                            $set: {
                                'canvasFiles.0.fabricJSON': data.data,
                                lastUpdated: new Date()
                            }
                        }
                    );
                } catch (error) {
                    console.error('Canvas save error:', error.message);
                }
            }
        });

        // ========================================
        // CURSOR POSITION (Multiple Cursors)
        // ========================================

        // Color palette for cursors
        const cursorColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6', '#34D399', '#60A5FA', '#FBBF24'];

        // Store last known cursor positions per room
        if (!global.roomCursorPositions) {
            global.roomCursorPositions = new Map(); // roomId -> Map<socketId, {username, color, position}>
        }

        socket.on('cursor-position', ({ position }) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            // Get username from socket.user (set during auth middleware)
            const username = socket.user?.username || `Guest-${socket.id.substring(0, 6)}`;

            // Assign consistent color based on USERNAME (not socket.id)
            // This ensures the same user always gets the same color across all tabs
            const colorIndex = Math.abs(username.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % cursorColors.length;

            // Store cursor position for late joiners
            if (!global.roomCursorPositions.has(roomId)) {
                global.roomCursorPositions.set(roomId, new Map());
            }
            global.roomCursorPositions.get(roomId).set(socket.id, {
                username,
                color: cursorColors[colorIndex],
                position
            });

            // Broadcast to others in the room
            socket.to(roomId).emit('cursor-position', {
                socketId: socket.id,
                username,
                color: cursorColors[colorIndex],
                position
            });
        });

        // Request existing cursor positions (for late joiners)
        socket.on('request-cursors', () => {
            const roomId = socket.roomId;
            if (!roomId) return;

            const cursors = global.roomCursorPositions.get(roomId);
            if (cursors && cursors.size > 0) {
                // Send all existing cursor positions to the new joiner
                cursors.forEach((cursorData, cursorSocketId) => {
                    if (cursorSocketId !== socket.id) {
                        socket.emit('cursor-position', {
                            socketId: cursorSocketId,
                            ...cursorData
                        });
                    }
                });
            }
        });

        // ========================================
        // VOICE ROOM
        // ========================================

        // Track voice participants per room
        const voiceParticipants = new Map(); // roomId -> Set of peerIds

        socket.on('voice-join', ({ peerId, roomId: voiceRoomId }) => {
            const roomId = voiceRoomId || socket.roomId;
            if (!roomId) return;

            console.log(`🎤 ${socket.username} joined voice room: ${roomId}, peerId: ${peerId}`);

            // Track participant
            if (!voiceParticipants.has(roomId)) {
                voiceParticipants.set(roomId, new Set());
            }
            voiceParticipants.get(roomId).add(peerId);

            // Notify others in the room
            socket.to(roomId).emit('voice-join', {
                peerId,
                socketId: socket.id,
                username: socket.username
            });

            // Send existing participants to the new joiner
            const existing = Array.from(voiceParticipants.get(roomId)).filter(p => p !== peerId);
            if (existing.length > 0) {
                socket.emit('voice-participants', { participants: existing });
            }
        });

        socket.on('voice-leave', ({ peerId, roomId: voiceRoomId }) => {
            const roomId = voiceRoomId || socket.roomId;
            if (!roomId) return;

            console.log(`👋 ${socket.username} left voice room: ${roomId}`);

            // Remove from tracking
            if (voiceParticipants.has(roomId)) {
                voiceParticipants.get(roomId).delete(peerId);
            }

            // Notify others
            socket.to(roomId).emit('voice-leave', { peerId });
        });

        socket.on('voice-mute', ({ peerId, isMuted, roomId: voiceRoomId }) => {
            const roomId = voiceRoomId || socket.roomId;
            if (!roomId) return;

            // Broadcast mute status
            socket.to(roomId).emit('voice-mute', { peerId, isMuted });
        });

        // ========================================
        // HOST CONTROLS
        // ========================================

        /**
         * Helper: Check if socket is host
         */
        const isHost = (socket) => {
            const roomId = socket.roomId;
            return roomId && roomHosts.get(roomId) === socket.id;
        };

        /**
         * Kick a user from the room (host only)
         */
        socket.on('host-kick-user', ({ targetSocketId }) => {
            if (!isHost(socket)) {
                socket.emit('host-error', { message: 'Only the host can kick users' });
                return;
            }

            const roomId = socket.roomId;
            const targetSocket = io.sockets.sockets.get(targetSocketId);

            if (targetSocket && targetSocket.roomId === roomId) {
                // Notify the kicked user
                targetSocket.emit('you-were-kicked', {
                    by: socket.user.username
                });

                // Remove them from the room
                handleLeaveRoom(targetSocket, io);

                console.log(`🚪 ${socket.user.username} kicked ${targetSocket.user.username} from room: ${roomId}`);
            }
        });

        /**
         * Force mute a user's voice (host only)
         */
        socket.on('host-mute-user', ({ targetSocketId }) => {
            if (!isHost(socket)) {
                socket.emit('host-error', { message: 'Only the host can mute users' });
                return;
            }

            const roomId = socket.roomId;

            // Notify the muted user
            io.to(targetSocketId).emit('you-were-muted', {
                by: socket.user.username
            });

            // Broadcast mute status to everyone
            io.to(roomId).emit('voice-mute', {
                peerId: null, // Will need peerId lookup
                socketId: targetSocketId,
                isMuted: true,
                forcedByHost: true
            });

            console.log(`🔇 Host muted user: ${targetSocketId} in room: ${roomId}`);
        });

        /**
         * Transfer host role to another user (host only)
         */
        socket.on('host-transfer', ({ targetSocketId }) => {
            if (!isHost(socket)) {
                socket.emit('host-error', { message: 'Only the host can transfer host role' });
                return;
            }

            const roomId = socket.roomId;

            // Verify target is in the room
            if (roomUsers.has(roomId) && roomUsers.get(roomId).has(targetSocketId)) {
                roomHosts.set(roomId, targetSocketId);

                // Notify everyone
                io.to(roomId).emit('host-changed', {
                    hostSocketId: targetSocketId
                });

                console.log(`👑 Host transferred from ${socket.id} to ${targetSocketId} in room: ${roomId}`);
            }
        });

        /**
         * Toggle chat enabled/disabled for the room (host only)
         */
        socket.on('host-toggle-chat', ({ disabled }) => {
            if (!isHost(socket)) {
                socket.emit('host-error', { message: 'Only the host can toggle chat' });
                return;
            }

            const roomId = socket.roomId;

            if (roomSettings.has(roomId)) {
                roomSettings.get(roomId).chatDisabled = disabled;
            }

            // Notify everyone
            io.to(roomId).emit('chat-toggled', {
                disabled,
                by: socket.user.username
            });

            console.log(`💬 Chat ${disabled ? 'disabled' : 'enabled'} by host in room: ${roomId}`);
        });

        /**
         * End session for everyone (host only)
         */
        socket.on('host-end-session', () => {
            if (!isHost(socket)) {
                socket.emit('host-error', { message: 'Only the host can end the session' });
                return;
            }

            const roomId = socket.roomId;

            // Notify everyone that session is ending
            io.to(roomId).emit('session-ended', {
                by: socket.user.username
            });

            console.log(`🛑 Session ended by host in room: ${roomId}`);

            // Disconnect all users from the room
            const roomSocketIds = roomUsers.has(roomId)
                ? Array.from(roomUsers.get(roomId).keys())
                : [];

            roomSocketIds.forEach(socketId => {
                const targetSocket = io.sockets.sockets.get(socketId);
                if (targetSocket) {
                    handleLeaveRoom(targetSocket, io);
                }
            });

            // Clean up room data
            roomUsers.delete(roomId);
            roomHosts.delete(roomId);
            roomSettings.delete(roomId);
        });

        // ========================================
        // DISCONNECT HANDLING
        // ========================================

        socket.on('disconnect', () => {
            handleLeaveRoom(socket, io);
            console.log(`🔌 Disconnected: ${socket.user.username}`);
        });
    });
}

/**
 * Handle user leaving room
 */
function handleLeaveRoom(socket, io) {
    const roomId = socket.roomId;
    if (!roomId) return;

    // Remove from room users
    if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id);

        // Handle host leaving - transfer to next user
        if (roomHosts.get(roomId) === socket.id) {
            const remainingUsers = Array.from(roomUsers.get(roomId).keys());
            if (remainingUsers.length > 0) {
                const newHostId = remainingUsers[0];
                roomHosts.set(roomId, newHostId);
                console.log(`👑 Host transferred to socket: ${newHostId} in room: ${roomId}`);

                // Notify everyone of new host
                io.to(roomId).emit('host-changed', {
                    hostSocketId: newHostId
                });
            }
        }

        // Notify others
        socket.to(roomId).emit('user-left', {
            user: {
                id: socket.user._id,
                username: socket.user.username,
                socketId: socket.id
            },
            users: Array.from(roomUsers.get(roomId).values()),
            hostSocketId: roomHosts.get(roomId)
        });

        // Clean up empty rooms
        if (roomUsers.get(roomId).size === 0) {
            roomUsers.delete(roomId);
            roomHosts.delete(roomId);
            roomSettings.delete(roomId);
        }
    }

    socket.leave(roomId);
    socket.roomId = null;
}
