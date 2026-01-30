import Razorpay from 'razorpay';
import Order from '../models/order.model.js';
import crypto from 'crypto';
import { errorHandler } from '../utils/error.js';

// 1. CREATE ORDER (Jab user "Pay Now" dabayega)
export const createOrder = async (req, res, next) => {
  try {
    const { amount, listingId } = req.body;

    if (!amount || !listingId) {
      return next(errorHandler(400, "Amount and Listing ID are required!"));
    }

    // Razorpay Instance
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Options for Razorpay Order
    const options = {
      amount: Number(amount * 100), // Amount paise mein hona chahiye (e.g. 500 INR = 50000 paise)
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    // Create Order via Razorpay API
    const order = await instance.orders.create(options);

    if (!order) {
      return next(errorHandler(500, "Razorpay Order Creation Failed"));
    }

    // Database mein entry (Status: Pending)
    const newOrder = new Order({
      userRef: req.user.id,
      listingRef: listingId,
      amount: amount,
      orderId: order.id,
      paymentId: "pending", // Abhi payment nahi hui
      status: "pending",
    });

    await newOrder.save();

    res.status(200).json({
      success: true,
      order, // Ye frontend pe jayega
    });

  } catch (error) {
    console.log("Create Order Error:", error);
    next(error);
  }
};

// 2. VERIFY PAYMENT (Jab Payment complete ho jaye)
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Signature Verification Formula
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Database Update (Status: Success)
      await Order.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          status: "success",
        }
      );

      res.status(200).json({
        success: true,
        message: "Payment Verified Successfully!",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid Signature! Payment Verification Failed.",
      });
    }

  } catch (error) {
    console.log("Verify Error:", error);
    next(error);
  }
};

// 3. GET ORDER HISTORY
export const getOrderHistory = async (req, res, next) => {
  try {
    // Current user ke saare orders nikalo (Latest pehle)
    const orders = await Order.find({ userRef: req.user.id })
      .sort({ createdAt: -1 })
      .populate('listingRef'); 

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// ✅ 4. DELETE ORDER (New Function)
export const deleteOrder = async (req, res, next) => {
  try {
    // 1. Order find karo
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(errorHandler(404, 'Order not found!'));
    }

    // 2. Security Check: Kya ye order isi user ka hai?
    if (order.userRef !== req.user.id) {
      return next(errorHandler(401, 'You can only delete your own orders!'));
    }

    // 3. Delete karo
    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json('Order has been deleted!');
  } catch (error) {
    next(error);
  }
};