import express from 'express';
import { 
  signup, 
  signin, 
  signout, 
  google, 
  forgotPassword, 
  resetPassword,
  verifyEmail // ✅ NEW: Added verifyEmail import
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-email', verifyEmail); // ✅ NEW: Route for OTP Verification
router.post('/signin', signin);
router.post('/google', google);
router.get('/signout', signout);

// 👇 Routes for Password Reset 👇
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:id/:token', resetPassword);

export default router;