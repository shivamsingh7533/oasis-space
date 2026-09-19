import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userRef: {
      type: String,
      required: true,
      index: true,
    },
    listingRef: { // Property the payment is for (optional for seller subscriptions)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: false,
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentId: { // Razorpay Payment ID
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    orderId: { // Razorpay Order ID
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    // What kind of payment:
    //  - 'listing_fee'        : seller pays to publish a listing (rent is free; sale ₹5,100)
    //  - 'booking'            : buyer ₹999 advance token booking
    //  - 'seller_subscription': seller buys ₹5,100 pack for 10 sale listings
    type: {
      type: String,
      enum: ['listing_fee', 'booking', 'seller_subscription'],
      default: 'booking',
      index: true,
    },
    mobile: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;