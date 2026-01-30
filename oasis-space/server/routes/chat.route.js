import express from 'express';
// ✅ Import updated function name
import { chatWithGroq } from '../controllers/chat.controller.js'; 

const router = express.Router();

// ✅ Route /ask par ab Groq wala function chalega
router.post('/ask', chatWithGroq);

export default router;