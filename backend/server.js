// This code is used for the server entry point of the backend Node.js application.
const http = require('http');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
// credentials:true lets the browser send/receive the HTTP-only auth cookie across the two ports
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Multer does not create its target folder, so make sure it exists
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Central error handling - must come AFTER all routes
app.use(notFound);
app.use(errorHandler);

// Socket.io shares the same HTTP server; controllers reach it through app.get('io')
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: FRONTEND_URL, credentials: true } });
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
