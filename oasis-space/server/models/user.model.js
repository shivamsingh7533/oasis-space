import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    avatar: {
      type: String,
      default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    },
    // --- ROLE FIELD ---
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // --- SELLER STATUS ---
    sellerStatus: {
        type: String,
        enum: ['regular', 'pending', 'approved', 'rejected'],
        default: 'regular',
    },
    // --- SELLER SUBSCRIPTION PACK (₹5,100 for 10 listings) ---
    sellerSubscription: {
      status: {
        type: String,
        enum: ['none', 'active', 'expired', 'exhausted'],
        default: 'none',
      },
      totalQuota: {
        type: Number,
        default: 0,
      },
      usedQuota: {
        type: Number,
        default: 0,
      },
      startDate: {
        type: Date,
        default: null,
      },
      endDate: {
        type: Date,
        default: null,
      },
      paymentId: {
        type: String,
        default: null,
      },
      orderId: {
        type: String,
        default: null,
      },
    },
    // --- WISHLIST ---
    savedListings: {
      type: [mongoose.Schema.Types.ObjectId], 
      ref: 'Listing', 
      default: [],
    },
    
    // 👇✅ OTP & VERIFICATION FIELDS 👇
    isVerified: {
      type: Boolean,
      default: false, 
    },
    otp: {
      type: String,
      default: null,
      select: false,
    },
    otpExpires: {
      type: Date,
      default: null,
      select: false,
    }
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;