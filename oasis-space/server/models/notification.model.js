import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { // Jisko message milega (Landlord/Admin)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: { // Jisne book kiya (Buyer)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: { // "User X booked Property Y. Contact: 999..."
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;