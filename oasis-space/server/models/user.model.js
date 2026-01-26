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
    // Mobile unique hona chahiye
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    },
    // --- ROLE FIELD (Admin Control) ---
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // --- SELLER STATUS (Verification Logic) ---
    sellerStatus: {
        type: String,
        enum: ['regular', 'pending', 'approved', 'rejected'],
        default: 'regular',
    },
    // --- WISHLIST (Advanced Reference) ---
    savedListings: {
      type: [mongoose.Schema.Types.ObjectId], 
      ref: 'Listing', 
      default: [],
    },
    
    // 👇✅ NEW: OTP & VERIFICATION FIELDS ADDED 👇
    isVerified: {
      type: Boolean,
      default: false, // Default false rahega jab tak OTP verify na ho
    },
    otp: {
      type: String, // OTP store karne ke liye
      default: null,
    },
    otpExpires: {
      type: Date, // OTP expiry time ke liye (e.g. 10 mins)
      default: null,
    }
  },
  { timestamps: true }
);

// Agar model pehle se bana hai to wahi use karega, warna naya banayega
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;