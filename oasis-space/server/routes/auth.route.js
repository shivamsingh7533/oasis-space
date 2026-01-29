import express from 'express';
import { 
  signup, 
  signin, 
  google, 
  signout, 
  verifyEmail, 
  forgotPassword, 
  resetPassword 
} from '../controllers/auth.controller.js';

const router = express.Router();

// Auth Routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/google', google);
router.get('/signout', signout);

// Verification & Password Reset Routes
router.post('/verify-email', verifyEmail);       // ✅ OTP Verification
router.post('/forgot-password', forgotPassword); // ✅ Forgot Password Request
router.post('/reset-password', resetPassword);   // ✅ Reset Password

export default router;