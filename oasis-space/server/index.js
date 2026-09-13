import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import webpush from 'web-push';

// Import Routes
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';
import chatRouter from './routes/chat.route.js';
import orderRouter from './routes/order.route.js';
import notificationRouter from './routes/notification.route.js';
import pushRouter from './routes/push.route.js';
import { globalLimiter, authLimiter, chatLimiter } from './utils/limiters.js';

dotenv.config();

// Initialize Web Push
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY?.trim().replace(/=+$/, '');
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY?.trim().replace(/=+$/, '');
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(
    'mailto:support@oasisspace.com',
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );
  console.log('✅ Web Push VAPID keys configured!');
} else {
  console.warn('⚠️ Web Push VAPID keys missing in .env');
}

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log('✅ Connected to MongoDB!');
    await mongoose.connection.syncIndexes().catch((e) => console.warn('Index sync skipped:', e.message));
  } catch (err) {
    console.log('❌ MongoDB Connection Error:', err);
    // Retry once after 5s instead of silently running without a DB
    setTimeout(connectDB, 5000);
  }
}
connectDB();

const app = express();

// ✅ PRODUCTION READY CORS — allow primary + preview/PWA origins
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // Allow same-origin / non-browser requests, plus the configured origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return cb(null, true);
    }
    return cb(null, false);
  },
  credentials: true,
}));

// ✅ Fix for Cross-Origin-Opener-Policy (Google Auth Popup Fix)
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// ✅ Trust Proxy (Critical for Render/Vercel/Heroku cookies)
app.set('trust proxy', 1);

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// --- ROUTES (each limiter applied exactly once per endpoint) ---
app.use('/api/auth', authLimiter, authRouter);            // 🔒 Strict
app.use('/api/chat', chatLimiter, chatRouter);            // 🔒 AI spend guard
app.use('/api/user', globalLimiter, userRouter);
app.use('/api/listing', globalLimiter, listingRouter);
app.use('/api/order', globalLimiter, orderRouter);
app.use('/api/notification', globalLimiter, notificationRouter);
app.use('/api/push', globalLimiter, pushRouter);

// Health Check
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: '🚀 OasisSpace API is working!',
    status: 'Active',
    env: process.env.NODE_ENV || 'development'
  });
});

// Error Middleware — log details server-side, keep client response generic for 5xx
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const is5xx = statusCode >= 500;
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, is5xx ? err : '');
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message: is5xx ? 'Something went wrong on our end. Please try again.' : err.message,
  });
});

// ✅ Dynamic Port for Render
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});

// Graceful shutdown — save in-flight payments and disconnect cleanly
const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));