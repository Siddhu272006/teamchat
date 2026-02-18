const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const fileRoutes = require('./routes/files');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send(`
      <h1>Backend Server Running</h1>
      <p>Access the frontend at: <a href="http://localhost:5173">http://localhost:5173</a></p>
      <p>(If 5173 is busy, check your terminal for the correct port like 5174 or 5175)</p>
    `);
});

// Routes
// Note: authRoutes exports { router, authMiddleware }
app.use('/api/auth', authRoutes.router);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);

app.get('/api/health', (req, res) => {
    const state = mongoose.connection.readyState;
    const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
        status: state === 1 ? 'ok' : 'error',
        dbState: stateNames[state] || 'unknown',
        activeConnection: !!mongoose.connection.db
    });
});

// Socket.io - Real-time Chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('send-message', (data) => {
        io.to(data.roomId).emit('new-message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

mongoose.connection.on('connected', () => console.log('Mongoose: Connected'));
mongoose.connection.on('error', (err) => console.error('Mongoose: Connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose: Disconnected'));

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
