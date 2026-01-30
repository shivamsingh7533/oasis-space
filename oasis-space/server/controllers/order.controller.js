import Order from '../models/order.model.js';
import { errorHandler } from '../utils/error.js';

// 1. Create Order (Jab payment successful hogi tab ye call hoga)
export const createOrder = async (req, res, next) => {
  try {
    const { listingRef, amount, paymentId } = req.body;

    const newOrder = new Order({
      userRef: req.user.id, // Token se user ID ayegi
      listingRef,
      amount,
      paymentId,
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
};

// 2. Get User Orders (Profile page par dikhane ke liye)
export const getUserOrders = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only view your own orders!'));
  }
  try {
    // .populate() ka magic: Ye sirf Listing ID nahi, balki puri Listing ki details (Name, Image) bhi layega
    const orders = await Order.find({ userRef: req.params.id })
      .populate('listingRef') 
      .sort({ createdAt: -1 }); // Newest pehle

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};