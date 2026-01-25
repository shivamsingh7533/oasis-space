import express from 'express';
import { 
  signup, 
  signin, 
  signout, 
  google,           // ✅ Added Google Auth
  forgotPassword,   // ✅ Added Forgot Password
  resetPassword     // ✅ Added Reset Password
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/google', google); // ✅ Google Route
router.get('/signout', signout);

// 👇 New Routes for Password Reset 👇
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:id/:token', resetPassword);

export default router;