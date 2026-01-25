import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors'; // ✅ IMP: Import CORS

// Import Routes
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';

dotenv.config();

// --- DATABASE CONNECTION ---
mongoose
  .connect(process.env.MONGO, { family: 4 }) // IPv4 Force for stability
  .then(() => {
    console.log('✅ Connected to MongoDB!');
  })
  .catch((err) => {
    console.log('❌ MongoDB Connection Error:', err);
  });

const app = express();

// --- ✅ CORS CONFIGURATION (MOST IMPORTANT) ---
// Isse Vercel wala frontend Render wale backend se baat kar payega
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Live URL ya Localhost
  credentials: true, // Cookies (Token) allow karne ke liye zaroori hai
}));

// --- MIDDLEWARES ---
app.use(express.json());
app.use(cookieParser()); // Auth check ke liye zaroori

// --- ROUTES ---
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);

// 👇 NEW PING ROUTE (For Cron Job) ⚡
// Cron-job.org is route ko hit karega server ko jagaye rakhne ke liye
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

// 👇 ROOT ROUTE (API Health Check for Humans)
// Jab aap https://oasis-space.onrender.com kholenge, to ye dikhega
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: '🚀 OasisSpace API is working successfully on Render!',
    status: 'Active',
    client: process.env.CLIENT_URL || 'Localhost'
  });
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// --- SERVER LISTEN ---
app.listen(3000, () => {
  console.log('🚀 Server running on port: 3000');
});