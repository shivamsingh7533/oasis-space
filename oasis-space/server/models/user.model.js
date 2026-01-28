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
    // ✅ FIX: Mobile se 'unique: true' hata diya gaya hai
    // Taaki Google Auth users same dummy number (0000000000) share kar sakein bina crash hue.
    mobile: {
      type: String,
      required: true,
      unique: false, 
    },
    password: {
      type: String,
      required: true,
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
    },
    otpExpires: {
      type: Date, 
      default: null,
    }
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;