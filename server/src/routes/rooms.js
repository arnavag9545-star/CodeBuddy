import express from 'express';
import Room from '../models/Room.js';
import RoomState from '../models/RoomState.js';
import { auth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// In-memory room storage for instant response (bypasses slow MongoDB)
const inMemoryRooms = new Map();

/**
 * POST /api/rooms
 * Create a new room - INSTANT (in-memory only)
 */
router.post('/', (req, res) => {
    try {
        const { name } = req.body;

        // Generate unique room ID
        const roomId = generateRoomId();
        const roomName = name || `Room ${roomId}`;

        // Store in memory
        inMemoryRooms.set(roomId, {
            roomId,
            name: roomName,
            createdAt: new Date().toISOString(),
            participants: []
        });

        // Send response immediately
        res.status(201).json({
            message: 'Room created',
            room: {
                roomId,
                name: roomName,
                createdAt: new Date().toISOString()
            }
        });

        // Optionally save to MongoDB in background (non-blocking)
        saveRoomToDBAsync(roomId, roomName);

    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// Generate 6-character room ID
function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Background save to MongoDB (non-blocking)
async function saveRoomToDBAsync(roomId, name) {
    try {
        const room = new Room({ roomId, name });
        await room.save();
        console.log(`💾 Room ${roomId} saved to DB`);
    } catch (error) {
        console.error(`Failed to save room ${roomId} to DB:`, error.message);
    }
}

/**
 * GET /api/rooms/:roomId
 * Get room details
 */
router.get('/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findOne({ roomId })
            .populate('host', 'username email')
            .populate('participants.user', 'username');

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json({ room });

    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ error: 'Failed to get room' });
    }
});

/**
 * GET /api/rooms/:roomId/state
 * Get current room state (for manual fetching)
 */
router.get('/:roomId/state', async (req, res) => {
    try {
        const { roomId } = req.params;

        const state = await RoomState.getOrCreate(roomId);

        res.json({ state });

    } catch (error) {
        console.error('Get room state error:', error);
        res.status(500).json({ error: 'Failed to get room state' });
    }
});

/**
 * POST /api/rooms/:roomId/join
 * Join a room (add user to participants)
 */
router.post('/:roomId/join', optionalAuth, async (req, res) => {
    try {
        const roomIdParam = req.params.roomId;

        // Try both cases (room IDs are stored uppercase)
        const roomIdUpper = roomIdParam.toUpperCase();
        const roomIdLower = roomIdParam.toLowerCase();

        // First check in-memory storage (instant)
        let memoryRoom = inMemoryRooms.get(roomIdUpper) || inMemoryRooms.get(roomIdLower) || inMemoryRooms.get(roomIdParam);

        if (memoryRoom) {
            console.log(`✅ Found room ${memoryRoom.roomId} in memory`);
            // Get or create room state
            const state = await RoomState.getOrCreate(memoryRoom.roomId);

            return res.json({
                message: 'Joined room',
                room: {
                    roomId: memoryRoom.roomId,
                    name: memoryRoom.name
                },
                state
            });
        }

        // Fallback to MongoDB (case-insensitive search)
        let room = await Room.findOne({
            roomId: { $regex: new RegExp(`^${roomIdParam}$`, 'i') }
        });

        if (!room) {
            console.log(`❌ Room not found: ${roomIdParam}`);
            return res.status(404).json({ error: 'Room not found' });
        }

        console.log(`✅ Found room ${room.roomId} in MongoDB`);

        // Add user to participants if authenticated
        if (req.user && !req.user.isGuest) {
            const alreadyJoined = room.participants.some(
                p => p.user?.toString() === req.user._id.toString()
            );

            if (!alreadyJoined) {
                room.participants.push({ user: req.user._id });
                await room.save();
            }
        }

        // Get room state
        const state = await RoomState.getOrCreate(room.roomId);

        res.json({
            message: 'Joined room',
            room: {
                roomId: room.roomId,
                name: room.name
            },
            state
        });

    } catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({ error: 'Failed to join room' });
    }
});

/**
 * DELETE /api/rooms/:roomId
 * Delete a room (host only)
 */
router.delete('/:roomId', auth, async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Check if user is host
        if (room.host?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the host can delete this room' });
        }

        // Delete room and state
        await Room.deleteOne({ roomId });
        await RoomState.deleteOne({ roomId });

        res.json({ message: 'Room deleted' });

    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});

export default router;
