import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { // Jisko message milega (Landlord/Admin)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: { // Jisne action kiya (Buyer/Seller)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedId: { // Deep-link target (property/listing id)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;