import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Import Routes
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';
import chatRouter from './routes/chat.route.js';
import orderRouter from './routes/order.route.js';
import notificationRouter from './routes/notification.route.js'; // ✅ NEW NOTIFICATION IMPORT

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log('✅ Connected to MongoDB!');
  })
  .catch((err) => {
    console.log('❌ MongoDB Connection Error:', err);
  });

const app = express();

// ✅ PRODUCTION READY CORS SETUP
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ✅ Fix for Cross-Origin-Opener-Policy (Google Auth Popup Fix)
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// ✅ Trust Proxy (Critical for Render/Vercel/Heroku cookies)
app.set('trust proxy', 1);

// ✅ Rate Limiter to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: true, // Enable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);

app.use(express.json());
app.use(cookieParser());

// --- ROUTES ---
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);
app.use('/api/chat', chatRouter);
app.use('/api/order', orderRouter);
app.use('/api/notification', notificationRouter); // ✅ NEW NOTIFICATION ROUTE ADDED

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

// Error Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// ✅ Dynamic Port for Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});