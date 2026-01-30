import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userRef: {
      type: String,
      required: true,
    },
    listingRef: { // Kis property ke liye payment hua
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentId: { // Razorpay Payment ID
      type: String,
      required: true,
    },
    orderId: { // Razorpay Order ID
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'pending', // pending, success, failed
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;