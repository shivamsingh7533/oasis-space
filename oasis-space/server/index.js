import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Import Routes
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';

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
// Ye automatically detect karega ki aap localhost par hain ya live domain par
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', 
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// --- ROUTES ---
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);

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

app.listen(3000, () => {
  console.log('🚀 Server running on port: 3000');
});