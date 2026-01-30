import express from 'express';
import { verifyToken } from '../utils/verifyUser.js'; 
import { createOrder, verifyPayment, getOrderHistory, deleteOrder } from '../controllers/order.controller.js'; // ✅ Import deleteOrder

const router = express.Router();

// Route: /api/order/create
router.post('/create', verifyToken, createOrder);

// Route: /api/order/verify
router.post('/verify', verifyToken, verifyPayment);

// Route: GET ORDER HISTORY
router.get('/history', verifyToken, getOrderHistory);

// ✅ NEW ROUTE: DELETE ORDER
router.delete('/delete/:id', verifyToken, deleteOrder);

export default router;