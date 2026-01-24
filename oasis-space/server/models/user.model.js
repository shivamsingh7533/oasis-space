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
    // --- NEW ROLE FIELD ADDED HERE ---
    role: {
      type: String,
      enum: ['user', 'seller', 'admin'], // केवल ये 3 रोल्स ही हो सकते हैं
      default: 'user', // डिफ़ॉल्ट रूप से सब नॉर्मल यूजर होंगे
    },
    savedListings: {
      type: Array,
      default: [],
    }
  },
  { timestamps: true }
);

// Check if model exists before creating
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;