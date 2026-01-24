import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Import Routes
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';

dotenv.config();

// --- DATABASE CONNECTION START ---
mongoose
  .connect(process.env.MONGO, {
    // These options allow connection on strict networks (Jio/Airtel)
    family: 4, // Force IPv4 (Crucial for fixing DNS timeouts)
  })
  .then(() => {
    console.log('✅ Connected to MongoDB!');
  })
  .catch((err) => {
    console.log('❌ MongoDB Connection Error:', err);
  });
// --- DATABASE CONNECTION END ---

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Server Listen
app.listen(3000, () => {
  console.log('🚀 Server running on port: 3000');
});

// Routes
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);

// Global Error Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});