import express from 'express';
// ✅ Import updated function name
import { chatWithGemini } from '../controllers/chat.controller.js'; 

const router = express.Router();

// Route wahi rahega, bas function badal gaya
router.post('/ask', chatWithGemini);

export default router;