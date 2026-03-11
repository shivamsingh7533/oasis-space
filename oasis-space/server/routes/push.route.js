import express from 'express';
import { getVapidPublicKey, subscribe, unsubscribe } from '../controllers/push.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Get the public key to configure the service worker (public route)
router.get('/vapidPublicKey', getVapidPublicKey);

// Subscribe/unsubscribe logic requires authentication
router.post('/subscribe', verifyToken, subscribe);
router.post('/unsubscribe', verifyToken, unsubscribe);

export default router;
