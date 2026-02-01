import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import modules
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import initializeSocket from './socket/index.js';

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Middleware - Allow multiple origins for dev
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for canvas data
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Initialize Socket.io handlers
        initializeSocket(io);

        // Start HTTP server
        httpServer.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 CodeBuddy Server Running!                            ║
║                                                           ║
║   📡 HTTP:    http://localhost:${PORT}                      ║
║   🔌 Socket:  ws://localhost:${PORT}                        ║
║                                                           ║
║   📚 API Endpoints:                                       ║
║   • POST /api/auth/signup     - Create account            ║
║   • POST /api/auth/login      - Login                     ║
║   • POST /api/rooms           - Create room               ║
║   • POST /api/rooms/:id/join  - Join room                 ║
║   • GET  /api/rooms/:id/state - Get room state            ║
║                                                           ║
║   🔧 Socket Events:                                       ║
║   • join-room       - Join a collaboration room           ║
║   • code-change     - Real-time code sync                 ║
║   • canvas-*        - Real-time canvas sync               ║
║   • chat-message    - Real-time chat                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
            `);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
