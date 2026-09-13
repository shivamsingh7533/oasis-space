import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userRef: {
      type: String,
      required: true,
      index: true,
    },
    listingRef: { // Property the payment is for
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
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
    //  - 'listing_fee'  : seller pays to publish a listing (rent is free; sale ₹5,100)
    //  - 'booking'      : legacy buyer booking (pre-fee-model orders)
    type: {
      type: String,
      enum: ['listing_fee', 'booking'],
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