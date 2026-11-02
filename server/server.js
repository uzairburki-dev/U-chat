import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Middleware & Socket
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { initSocket } from './socket/socketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/.env is loaded regardless of working directory
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  pingTimeout: 60000
});

initSocket(io);

// Make io accessible in request if needed
app.set('io', io);

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Database connection management with connection pooling & state caching
let isConnecting = null;
export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (isConnecting) {
    return isConnecting;
  }

  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatboat';

  isConnecting = mongoose
    .connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000
    })
    .then((conn) => {
      const dbName = conn.connection.name;
      const dbHost = conn.connection.host || 'cluster';
      console.log(`✅ Connected to MongoDB database: [${dbName}] on host: ${dbHost}`);
      isConnecting = null;
      return conn;
    })
    .catch((err) => {
      isConnecting = null;
      console.error('❌ MongoDB connection error:', err.message);
      throw err;
    });

  return isConnecting;
};

// Ensure database connection is ready for API requests
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/health') {
    try {
      if (mongoose.connection.readyState !== 1) {
        await connectDB();
      }
    } catch (err) {
      const hasMongoUri = !!process.env.MONGO_URI;
      let hint = '';

      if (!hasMongoUri) {
        hint = 'MONGO_URI environment variable is missing. In production (Vercel), please configure MONGO_URI in Project Settings > Environment Variables.';
      } else if (err.message.includes('ECONNREFUSED') || err.message.includes('timed out') || err.message.includes('querySrv')) {
        hint = 'Cannot reach MongoDB Atlas. Please ensure 0.0.0.0/0 is added in MongoDB Atlas Network Access (IP Access List).';
      } else {
        hint = err.message;
      }

      return res.status(503).json({
        success: false,
        message: `Database connection unavailable: ${hint}`
      });
    }
  }
  next();
});

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    hasMongoUriEnv: !!process.env.MONGO_URI,
    timestamp: new Date().toISOString(),
    service: 'ChatBoat Live Chat API'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

// Start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 ChatBoat Server running on http://localhost:${PORT}`);
    });
  })
  .catch(() => {
    server.listen(PORT, () => {
      console.log(`🚀 ChatBoat Server running on http://localhost:${PORT} (awaiting database connection)`);
    });
  });

export default app;
