import express from 'express';
import { verifyToken } from '../utils/verifyUser.js'; 
// ✅ cancelOrder ko bhi import kiya
import { createOrder, verifyPayment, getOrderHistory, deleteOrder, cancelOrder } from '../controllers/order.controller.js'; 

const router = express.Router();

// Route: /api/order/create
router.post('/create', verifyToken, createOrder);

// Route: /api/order/verify
router.post('/verify', verifyToken, verifyPayment);

// Route: GET ORDER HISTORY
router.get('/history', verifyToken, getOrderHistory);

// Route: DELETE ORDER (History se udana)
router.delete('/delete/:id', verifyToken, deleteOrder);

// ✅ NEW ROUTE: CANCEL ORDER (Status badalna)
router.post('/cancel/:id', verifyToken, cancelOrder);

export default router;