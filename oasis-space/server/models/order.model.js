import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userRef: {
      type: String, // Jo user payment kar raha hai
      required: true,
    },
    listingRef: {
      type: mongoose.Schema.Types.ObjectId, // Jis property ke liye payment hui
      ref: 'Listing', // Isse hum Listing ka photo/naam fetch kar payenge
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String, // Razorpay Payment ID (future ke liye)
      default: 'manual_entry',
    },
    status: {
      type: String,
      default: 'success', // success, pending, failed
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;