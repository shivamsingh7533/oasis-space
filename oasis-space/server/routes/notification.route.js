import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { getNotifications, markRead } from '../controllers/notification.controller.js';

const router = express.Router();

// Get Notifications
router.get('/', verifyToken, getNotifications);

// Mark as Read
router.post('/read', verifyToken, markRead);

export default router;