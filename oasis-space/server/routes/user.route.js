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
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    },
    role: {
        type: String,
        default: 'user', // 'user' or 'admin'
        enum: ['user', 'admin']
    },
    // 👇👇 YE FIELD ADD KARNA ZAROORI HAI 👇👇
    sellerStatus: {
        type: String,
        default: 'regular', // Options: 'regular', 'pending', 'approved', 'rejected'
        enum: ['regular', 'pending', 'approved', 'rejected']
    },
    // 👆👆 YAHAN TAK 👆👆
    
    savedListings: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Listing',
        default: [],
    }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;