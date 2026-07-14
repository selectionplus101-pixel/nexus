import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
// express-mongo-sanitize and xss-clean are incompatible with Express 5.x - using custom middleware
import mongoSanitize from './middleware/mongoSanitizeMiddleware.js';
import xssProtection from './middleware/xssProtectionMiddleware.js';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import socketHandler from './socket/socketHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure trust proxy for Railway deployment
// Railway uses proxies, so we need to trust the first hop
app.set('trust proxy', 1);

// Initialize Socket.IO with CORS configuration
const allowedSocketOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://nexus-y1w8.vercel.app',
];

if (process.env.CLIENT_URL && !allowedSocketOrigins.includes(process.env.CLIENT_URL)) {
  allowedSocketOrigins.push(process.env.CLIENT_URL);
}

const io = new Server(httpServer, {
  cors: {
    origin: allowedSocketOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Body parser middleware
app.use(express.json());

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // For Socket.IO compatibility
  })
);

// CORS configuration with whitelist - support multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://nexus-y1w8.vercel.app',
  'https://nexus-f-d.vercel.app',
];

// Add CLIENT_URL from environment if provided
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Prevent MongoDB injection attacks
// Custom middleware for Express 5.x compatibility (express-mongo-sanitize incompatible)
app.use(mongoSanitize({
  replaceWith: '_',
}));

// Prevent XSS attacks
// Custom middleware for Express 5.x compatibility (xss-clean incompatible)
app.use(xssProtection());

// Apply general API rate limiting
app.use('/api/', apiLimiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/collaborations', collaborationRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    server: 'running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize Socket.IO handler
socketHandler(io);

const startServer = async () => {
  console.log('[INFO] Starting Nexus backend server...');

  // Start HTTP server first for health checks and basic functionality
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log('[Socket.IO] Real-time chat server ready');
  });

  // Attempt MongoDB connection with retries, but don't block server startup
  let dbConnected = false;
  let retryCount = 0;
  const maxRetries = 3;

  while (!dbConnected && retryCount < maxRetries) {
    try {
      console.log(`[ATTEMPT ${retryCount + 1}/${maxRetries}] Connecting to MongoDB...`);
      await connectDB();
      dbConnected = true;
      console.log('[SUCCESS] MongoDB connection established - all systems operational');
    } catch (error) {
      retryCount++;
      console.error(`[ERROR] MongoDB connection failed (attempt ${retryCount}/${maxRetries}): ${error.message}`);

      if (retryCount < maxRetries) {
        const delay = 5000 * retryCount; // Linear backoff: 5s, 10s, 15s
        console.log(`[RETRY] Waiting ${delay/1000}s before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.warn('[WARNING] MongoDB connection failed after all retries');
        console.warn('[WARNING] Server is running with limited functionality');
        console.warn('[WARNING] Database-dependent API endpoints will return errors');

        // Continue running for health checks and troubleshooting
        console.log('[INFO] Server will continue running for health checks and debugging');

        // Set up background retry every 30 seconds
        const backgroundRetry = setInterval(async () => {
          try {
            console.log('[BACKGROUND] Retrying MongoDB connection...');
            await connectDB();
            console.log('[SUCCESS] MongoDB connection established via background retry');
            clearInterval(backgroundRetry);
          } catch (bgError) {
            console.log('[BACKGROUND] MongoDB connection still failed, will retry in 30s');
          }
        }, 30000);
      }
    }
  }
};

startServer();
