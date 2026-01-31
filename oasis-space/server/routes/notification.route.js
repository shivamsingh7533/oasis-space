import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
// ✅ clearNotifications ko import kiya
import { getNotifications, markRead, clearNotifications } from '../controllers/notification.controller.js';

const router = express.Router();

// Get Notifications
router.get('/', verifyToken, getNotifications);

// Mark as Read
router.post('/read', verifyToken, markRead);

// ✅ NEW ROUTE: CLEAR ALL NOTIFICATIONS
router.delete('/clear', verifyToken, clearNotifications);

export default router;