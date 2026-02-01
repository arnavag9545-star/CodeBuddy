import mongoose from 'mongoose';

/**
 * RoomState - Stores ALL state for a room
 * This is the KEY model for persistence and late-joiner restoration
 */
const roomStateSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // ========== CODE EDITOR STATE ==========
    codeFiles: [{
        id: String,
        filename: String,
        language: String,
        content: String,
        groupId: String,
        lastModified: { type: Date, default: Date.now }
    }],
    activeCodeFileId: String,
    tabGroups: [{
        id: String,
        name: String,
        color: String,
        collapsed: { type: Boolean, default: false }
    }],
    editorSettings: {
        theme: { type: String, default: 'vs-dark' },
        fontSize: { type: Number, default: 14 },
        tabSize: { type: Number, default: 4 }
    },

    // ========== CANVAS STATE ==========
    canvasFiles: [{
        id: String,
        name: String,
        fabricJSON: mongoose.Schema.Types.Mixed, // Fabric.js serialized canvas
        createdAt: { type: Date, default: Date.now }
    }],
    activeCanvasFileId: String,
    canvasSettings: {
        darkMode: { type: Boolean, default: false },
        backgroundMode: { type: String, default: 'plain' }
    },

    // ========== TERMINAL HISTORY ==========
    terminalHistory: [{
        id: String,
        filename: String,
        language: String,
        output: String,
        error: String,
        exitCode: Number,
        executionTime: Number,
        timestamp: { type: String, default: () => new Date().toLocaleTimeString() }
    }],

    // ========== CHAT MESSAGES ==========
    chatMessages: [{
        id: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],

    // ========== METADATA ==========
    version: { type: Number, default: 1 },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Update lastUpdated on save
roomStateSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    this.version += 1;
    next();
});

// Static method to get or create room state
roomStateSchema.statics.getOrCreate = async function (roomId) {
    let state = await this.findOne({ roomId });

    if (!state) {
        // Create default state for new room
        state = await this.create({
            roomId,
            codeFiles: [{
                id: Date.now().toString(),
                filename: 'main.py',
                language: 'python',
                content: '# Welcome to CodeBuddy!\n# Start coding here...\n\nprint("Hello, World!")\n',
                groupId: null,
                lastModified: new Date()
            }],
            activeCodeFileId: Date.now().toString(),
            tabGroups: [],
            canvasFiles: [{
                id: Date.now().toString() + '-canvas',
                name: 'Untitled Canvas',
                fabricJSON: { objects: [], background: 'transparent' },
                createdAt: new Date()
            }],
            activeCanvasFileId: Date.now().toString() + '-canvas',
            terminalHistory: [],
            chatMessages: []
        });
    }

    return state;
};

const RoomState = mongoose.model('RoomState', roomStateSchema);
export default RoomState;
