import { io } from 'socket.io-client';

/**
 * Socket.io Client Service
 * Handles real-time sync for code editor and canvas
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let currentRoomId = null;

// Event callbacks storage
const eventCallbacks = new Map();

/**
 * Initialize socket connection
 */
export const initSocket = (token = null) => {
    if (socket?.connected) {
        console.log('Socket already connected');
        return socket;
    }

    // Close existing socket if any
    if (socket) {
        socket.disconnect();
    }

    console.log('🔌 Initializing socket connection to:', SOCKET_URL);

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    // Register all pending event callbacks with this new socket
    eventCallbacks.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
            socket.on(event, callback);
        });
    });

    // Connection events
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        triggerCallback('connect', { socketId: socket.id });
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        triggerCallback('disconnect', { reason });
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        triggerCallback('error', { error: error.message });
    });

    socket.on('error', (data) => {
        console.error('Socket error:', data);
        triggerCallback('error', data);
    });

    // Listen for room-state event (critical for entering room)
    socket.on('room-state', (data) => {
        console.log('📥 Room state received:', data.roomId);
        triggerCallback('room-state', data);
    });

    return socket;
};

/**
 * Get socket instance
 */
export const getSocket = () => socket;

/**
 * Check if connected
 */
export const isConnected = () => socket?.connected || false;

/**
 * Disconnect socket
 */
export const disconnect = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentRoomId = null;
    }
};

/**
 * Get socket ID (for Canvas component compatibility)
 */
export const getSocketId = () => socket?.id || null;

/**
 * Sync canvas (alias for canvas full sync - for Canvas component compatibility)
 */
export const syncCanvas = (canvasData) => {
    console.log('📤 syncCanvas called:', {
        socketConnected: socket?.connected,
        currentRoomId,
        hasData: !!canvasData
    });

    if (!socket?.connected || !currentRoomId) {
        console.warn('❌ Canvas sync failed - not connected or no room:', { connected: socket?.connected, roomId: currentRoomId });
        return;
    }

    // Pass through the full canvas data including type, data, roomId, senderId
    socket.emit('canvas-full-sync', {
        canvasId: 'main',
        ...canvasData  // Spread the type, data, roomId, senderId
    });
    console.log('✅ Canvas sync emitted to server');
};

/**
 * Listen for canvas updates (alias - for Canvas component compatibility)
 */
export const onCanvasUpdate = (callback) => on('canvas-full-sync', callback);

// ========================================
// ROOM MANAGEMENT
// ========================================

/**
 * Join a room
 */
export const joinRoom = (roomId) => {
    if (!socket?.connected) {
        console.error('Socket not connected');
        return false;
    }

    // Get display name from localStorage
    const displayName = localStorage.getItem('displayName') ||
        localStorage.getItem('username') ||
        null;

    currentRoomId = roomId;
    socket.emit('join-room', { roomId, displayName });
    console.log('🚀 Joining room:', roomId, 'as:', displayName);
    return true;
};

/**
 * Leave current room
 */
export const leaveRoom = () => {
    if (socket?.connected && currentRoomId) {
        socket.emit('leave-room');
        currentRoomId = null;
    }
};

/**
 * Get current room ID
 */
export const getCurrentRoomId = () => currentRoomId;

// ========================================
// CODE EDITOR SYNC
// ========================================

/**
 * Send code change to server
 */
export const sendCodeChange = (fileId, content, cursorPosition = null) => {
    console.log('📤 sendCodeChange called:', {
        fileId,
        contentLength: content?.length,
        socketConnected: socket?.connected,
        currentRoomId
    });

    if (!socket?.connected || !currentRoomId) {
        console.warn('❌ Cannot send code change:', { socketConnected: socket?.connected, currentRoomId });
        return;
    }

    socket.emit('code-change', { fileId, content, cursorPosition });
    console.log('✅ Code change emitted');
};

/**
 * Send cursor position
 */
export const sendCursorPosition = (fileId, position, selection = null) => {
    if (!socket?.connected || !currentRoomId) return;

    socket.emit('cursor-position', { fileId, position, selection });
};

/**
 * File operations
 */
export const sendFileCreate = (file) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('file-create', { file });
};

export const sendFileDelete = (fileId) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('file-delete', { fileId });
};

export const sendFileRename = (fileId, newName) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('file-rename', { fileId, newName });
};

export const sendActiveFileChange = (fileId) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('active-file-change', { fileId });
};

/**
 * Tab group operations
 */
export const sendTabGroupCreate = (group) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('tab-group-create', { group });
};

export const sendTabGroupUpdate = (groupId, updates) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('tab-group-update', { groupId, updates });
};

export const sendTabGroupDelete = (groupId) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('tab-group-delete', { groupId });
};

// ========================================
// CANVAS SYNC
// ========================================

/**
 * Send canvas object added
 */
export const sendCanvasObjectAdd = (canvasId, object, objectId) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('canvas-object-add', { canvasId, object, objectId });
};

/**
 * Send canvas object modified
 */
export const sendCanvasObjectModify = (canvasId, objectId, changes) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('canvas-object-modify', { canvasId, objectId, changes });
};

/**
 * Send canvas object deleted
 */
export const sendCanvasObjectDelete = (canvasId, objectId) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('canvas-object-delete', { canvasId, objectId });
};

/**
 * Send canvas path created (drawing)
 */
export const sendCanvasPathCreate = (canvasId, pathData) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('canvas-path-create', { canvasId, pathData });
};

/**
 * Send full canvas state (for complex operations like undo/redo)
 */
export const sendCanvasFullSync = (canvasId, fabricJSON) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('canvas-full-sync', { canvasId, fabricJSON });
};

/**
 * Canvas file operations
 */
export const sendCanvasFileCreate = (file) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('canvas-file-create', { file });
};

export const sendCanvasFileSwitch = (canvasId) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('canvas-file-switch', { canvasId });
};

// ========================================
// CHAT
// ========================================

/**
 * Send chat message
 */
export const sendChatMessage = (message) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('chat-message', { message });
};

// ========================================
// TERMINAL
// ========================================

/**
 * Send terminal output
 */
export const sendTerminalOutput = (entry) => {
    console.log('📤 sendTerminalOutput called', { connected: socket?.connected, currentRoomId });
    if (!socket?.connected || !currentRoomId) {
        console.warn('❌ sendTerminalOutput failed: Not connected or no room ID');
        return;
    }
    socket.emit('terminal-output', { entry });
    console.log('🚀 terminal-output emitted');
};

// ========================================
// CANVAS SYNC
// ========================================

/**
 * Emit full canvas state for sync
 */
export const emitCanvasFullSync = (fabricJSON) => {
    if (!socket?.connected || !currentRoomId) {
        console.warn('❌ emitCanvasFullSync: Not connected or no room');
        return;
    }
    console.log('🎨 Emitting canvas-full-sync');
    socket.emit('canvas-full-sync', {
        roomId: currentRoomId,
        fabricJSON,
        canvasId: 'main' // Default canvas ID
    });
};

/**
 * Remove canvas sync listener
 */
export const offCanvasFullSync = (callback) => {
    if (socket) {
        socket.off('canvas-full-sync', callback);
    }
};

// ========================================
// CURSOR POSITION (Multiple Cursors)
// ========================================

/**
 * Emit cursor position to other users
 */
export const emitCursorPosition = (position) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('cursor-position', {
        roomId: currentRoomId,
        position // { lineNumber, column, fileId }
    });
};

/**
 * Listen for remote cursor positions
 */
export const onCursorPosition = (callback) => {
    if (socket) {
        socket.on('cursor-position', callback);
    }
    // Store callback for reconnection
    if (!eventCallbacks.has('cursor-position')) {
        eventCallbacks.set('cursor-position', new Set());
    }
    eventCallbacks.get('cursor-position').add(callback);
};

/**
 * Remove cursor position listener
 */
export const offCursorPosition = (callback) => {
    if (socket) {
        socket.off('cursor-position', callback);
    }
    if (eventCallbacks.has('cursor-position')) {
        eventCallbacks.get('cursor-position').delete(callback);
    }
};

/**
 * Request existing cursor positions (for late joiners)
 */
export const requestCursors = () => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('request-cursors');
};

// ========================================
// HOST CONTROLS
// ========================================

/**
 * Kick a user from the room (host only)
 */
export const kickUser = (targetSocketId) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('host-kick-user', { targetSocketId });
};

/**
 * Force mute a user (host only)
 */
export const muteUser = (targetSocketId) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('host-mute-user', { targetSocketId });
};

/**
 * Transfer host role (host only)
 */
export const transferHost = (targetSocketId) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('host-transfer', { targetSocketId });
};

/**
 * Toggle chat disabled (host only)
 */
export const toggleChat = (disabled) => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('host-toggle-chat', { disabled });
};

/**
 * End session for all (host only)
 */
export const endSession = () => {
    if (!socket?.connected || !currentRoomId) return;
    socket.emit('host-end-session');
};

// ========================================
// EVENT LISTENERS
// ========================================

/**
 * Register event callback
 */
export const on = (event, callback) => {
    if (!eventCallbacks.has(event)) {
        eventCallbacks.set(event, new Set());
    }
    eventCallbacks.get(event).add(callback);

    // Also register with socket if connected
    if (socket) {
        socket.on(event, callback);
    }

    // Return unsubscribe function
    return () => off(event, callback);
};

/**
 * Remove event callback
 */
export const off = (event, callback) => {
    if (eventCallbacks.has(event)) {
        eventCallbacks.get(event).delete(callback);
    }
    if (socket) {
        socket.off(event, callback);
    }
};

/**
 * Trigger callbacks for an event
 */
const triggerCallback = (event, data) => {
    if (eventCallbacks.has(event)) {
        eventCallbacks.get(event).forEach(cb => cb(data));
    }
};

// ========================================
// CONVENIENCE LISTENERS
// ========================================

// Room events
export const onRoomState = (callback) => on('room-state', callback);
export const onUserJoined = (callback) => on('user-joined', callback);
export const onUserLeft = (callback) => on('user-left', callback);

// Code events
export const onCodeChange = (callback) => on('code-change', callback);
export const onFileCreate = (callback) => on('file-create', callback);
export const onFileDelete = (callback) => on('file-delete', callback);
export const onFileRename = (callback) => on('file-rename', callback);
export const onActiveFileChange = (callback) => on('active-file-change', callback);

// Tab group events
export const onTabGroupCreate = (callback) => on('tab-group-create', callback);
export const onTabGroupUpdate = (callback) => on('tab-group-update', callback);
export const onTabGroupDelete = (callback) => on('tab-group-delete', callback);

// Canvas events
export const onCanvasObjectAdd = (callback) => on('canvas-object-add', callback);
export const onCanvasObjectModify = (callback) => on('canvas-object-modify', callback);
export const onCanvasObjectDelete = (callback) => on('canvas-object-delete', callback);
export const onCanvasPathCreate = (callback) => on('canvas-path-create', callback);
export const onCanvasFullSync = (callback) => on('canvas-full-sync', callback);
export const onCanvasFileCreate = (callback) => on('canvas-file-create', callback);
export const onCanvasFileSwitch = (callback) => on('canvas-file-switch', callback);

// Chat events
export const onChatMessage = (callback) => on('chat-message', callback);

// Terminal events
export const onTerminalOutput = (callback) => on('terminal-output', callback);

// Connection events
export const onConnect = (callback) => on('connect', callback);
export const onDisconnect = (callback) => on('disconnect', callback);

// Host control events
export const onHostChanged = (callback) => on('host-changed', callback);
export const onChatToggled = (callback) => on('chat-toggled', callback);
export const onYouWereKicked = (callback) => on('you-were-kicked', callback);
export const onYouWereMuted = (callback) => on('you-were-muted', callback);
export const onSessionEnded = (callback) => on('session-ended', callback);
export const onHostError = (callback) => on('host-error', callback);

export default {
    initSocket,
    getSocket,
    isConnected,
    disconnect,
    joinRoom,
    leaveRoom,
    getCurrentRoomId,
    // Code
    sendCodeChange,
    sendCursorPosition,
    sendFileCreate,
    sendFileDelete,
    sendFileRename,
    sendActiveFileChange,
    sendTabGroupCreate,
    sendTabGroupUpdate,
    sendTabGroupDelete,
    // Canvas
    sendCanvasObjectAdd,
    sendCanvasObjectModify,
    sendCanvasObjectDelete,
    sendCanvasPathCreate,
    sendCanvasFullSync,
    sendCanvasFileCreate,
    sendCanvasFileSwitch,
    syncCanvas,
    onCanvasUpdate,
    getSocketId,
    // Chat
    sendChatMessage,
    // Terminal
    sendTerminalOutput,
    // Host Controls
    kickUser,
    muteUser,
    transferHost,
    toggleChat,
    endSession,
    // Events
    on,
    off,
    onRoomState,
    onUserJoined,
    onUserLeft,
    onCodeChange,
    onCursorPosition,
    onConnect,
    onDisconnect,
    onHostChanged,
    onChatToggled,
    onYouWereKicked,
    onYouWereMuted,
    onSessionEnded,
    onHostError
};
