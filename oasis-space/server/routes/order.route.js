import express from 'express';
import { createOrder, getUserOrders } from '../controllers/order.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Order Create karne ka route
router.post('/create', verifyToken, createOrder);

// Order History dekhne ka route
router.get('/history/:id', verifyToken, getUserOrders);

export default router;