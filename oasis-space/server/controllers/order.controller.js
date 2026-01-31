import Razorpay from 'razorpay';
import Order from '../models/order.model.js';
import Listing from '../models/listing.model.js'; 
import User from '../models/user.model.js';       
import Notification from '../models/notification.model.js'; // ✅ In-App Notification
import crypto from 'crypto';
import { errorHandler } from '../utils/error.js';
import sendEmail from '../utils/sendEmail.js'; // ✅ Email Utility (Brevo)

// 1. CREATE ORDER (No Change)
export const createOrder = async (req, res, next) => {
  try {
    const { amount, listingId } = req.body;

    if (!amount || !listingId) {
      return next(errorHandler(400, "Amount and Listing ID are required!"));
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Number(amount * 100),
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    if (!order) {
      return next(errorHandler(500, "Razorpay Order Creation Failed"));
    }

    const newOrder = new Order({
      userRef: req.user.id,
      listingRef: listingId,
      amount: amount,
      orderId: order.id,
      paymentId: "pending",
      status: "pending",
    });

    await newOrder.save();

    res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {
    console.log("Create Order Error:", error);
    next(error);
  }
};

// 2. VERIFY PAYMENT (No Change in Logic)
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const order = await Order.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          status: "success",
        },
        { new: true }
      );

      const listing = await Listing.findById(order.listingRef);
      const buyer = await User.findById(order.userRef);
      const landlord = await User.findById(listing.userRef);

      if (listing && buyer && landlord) {
          // Email
          const emailSubject = `🏠 New Booking Alert: ${listing.name}`;
          const emailBody = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2 style="color: #2563eb;">Good News, ${landlord.username}!</h2>
              <p>Your property <strong>${listing.name}</strong> has just been booked.</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
                <p><strong>👤 Buyer Name:</strong> ${buyer.username}</p>
                <p><strong>📞 Contact:</strong> ${buyer.mobile || "Not provided"}</p>
                <p><strong>✉️ Email:</strong> ${buyer.email}</p>
                <p><strong>💰 Booking Amount:</strong> ₹${order.amount}</p>
              </div>
              <p>Please contact the buyer as soon as possible to proceed further.</p>
              <br/>
              <p style="font-size: 12px; color: #888;">Team OasisSpace</p>
            </div>
          `;
          await sendEmail(landlord.email, emailSubject, emailBody);

          // Notification
          const msg = `🚀 New Booking! ${buyer.username} booked "${listing.name}". Check your email for details.`;
          await Notification.create({ recipient: listing.userRef, sender: buyer._id, message: msg });

          // Admin Notification
          const admins = await User.find({ role: 'admin' });
          for (const admin of admins) {
              await Notification.create({
                recipient: admin._id,
                sender: buyer._id,
                message: `👑 Admin Alert: ${buyer.username} booked ${listing.name}`
              });
          }
      }

      res.status(200).json({
        success: true,
        message: "Payment Verified, Email Sent & Landlord Notified!",
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

// 3. GET ORDER HISTORY (No Change)
export const getOrderHistory = async (req, res, next) => {
  try {
    const orders = await Order.find({ userRef: req.user.id })
      .sort({ createdAt: -1 })
      .populate('listingRef'); 

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// 4. DELETE ORDER (No Change)
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(errorHandler(404, 'Order not found!'));
    }

    if (order.userRef !== req.user.id) {
      return next(errorHandler(401, 'You can only delete your own orders!'));
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json('Order has been deleted!');
  } catch (error) {
    next(error);
  }
};

// ✅ 5. CANCEL ORDER (NEW FUNCTION ADDED)
export const cancelOrder = async (req, res, next) => {
  try {
    // 1. Order Dhoondo
    const order = await Order.findById(req.params.id);
    if (!order) return next(errorHandler(404, 'Order not found!'));

    // 2. Authorization Check (Kya ye order isi user ka hai?)
    if (order.userRef !== req.user.id) {
      return next(errorHandler(401, 'You can only cancel your own orders!'));
    }

    // 3. Update Status to 'cancelled'
    order.status = 'cancelled';
    await order.save();

    // 4. Fetch Details for Notification
    const listing = await Listing.findById(order.listingRef);
    const buyer = await User.findById(req.user.id);
    const landlord = await User.findById(listing.userRef);

    if (listing && landlord && buyer) {
       // --- A. Send Email to Landlord ---
       const emailSubject = `❌ Booking Cancelled: ${listing.name}`;
       const emailBody = `
         <div style="font-family: Arial, sans-serif; color: #333;">
           <h2 style="color: #dc2626;">Booking Cancelled</h2>
           <p>Hello ${landlord.username},</p>
           <p>The user <strong>${buyer.username}</strong> has cancelled their booking for <strong>${listing.name}</strong>.</p>
           <p>The status has been updated in your dashboard.</p>
           <br/>
           <p style="font-size: 12px; color: #888;">Team OasisSpace</p>
         </div>
       `;
       await sendEmail(landlord.email, emailSubject, emailBody);

       // --- B. In-App Notification ---
       await Notification.create({
         recipient: listing.userRef, // Landlord
         sender: buyer._id,
         message: `❌ Booking Cancelled! ${buyer.username} cancelled booking for "${listing.name}".`
       });
    }

    res.status(200).json('Order has been cancelled successfully!');

  } catch (error) {
    next(error);
  }
};