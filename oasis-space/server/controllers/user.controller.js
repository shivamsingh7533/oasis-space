import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

// --- TEST ROUTE ---
export const test = (req, res) => {
  res.json({ message: 'Api route is working!' });
};

// --- UPDATE USER ---
export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, 'You can only update your own account!'));
  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
          mobile: req.body.mobile,
        },
      },
      { new: true }
    );
    const { password, ...rest } = updatedUser._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

// --- DELETE USER ---
export const deleteUser = async (req, res, next) => {
  try {
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser) return next(errorHandler(404, 'User not found!'));

    if (req.user.id !== req.params.id && requestingUser.role !== 'admin') {
      return next(errorHandler(401, 'You can only delete your own account!'));
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    if (req.user.id === req.params.id) {
        res.clearCookie('access_token');
    }
    res.status(200).json('User has been deleted!');
  } catch (error) {
    next(error);
  }
};

// --- GET USER LISTINGS ---
export const getUserListings = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const listings = await Listing.find({ userRef: req.params.id });
      res.status(200).json(listings);
    } catch (error) {
      next(error);
    }
  } else {
    return next(errorHandler(401, 'You can only view your own listings!'));
  }
};

// --- GET PUBLIC USER INFO ---
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found!'));
    const { password: pass, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

// --- WISHLIST ---
export const saveListing = async (req, res, next) => {
  try {
    const listingId = req.params.id; 
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return next(errorHandler(404, 'User not found!'));

    const savedListings = user.savedListings || [];
    const isSaved = savedListings.some((id) => id.toString() === listingId);

    if (isSaved) {
      await User.findByIdAndUpdate(userId, { $pull: { savedListings: listingId } });
      res.status(200).json('Listing removed from wishlist');
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { savedListings: listingId } });
      res.status(200).json('Listing saved to wishlist');
    }
  } catch (error) {
    next(error);
  }
};

// --- GET SAVED LISTINGS ---
export const getSavedListings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(errorHandler(404, 'User not found'));
    const savedListingsIds = user.savedListings || [];
    const savedListings = await Promise.all(savedListingsIds.map((listingId) => Listing.findById(listingId)));
    const validListings = savedListings.filter(listing => listing !== null);
    res.status(200).json(validListings);
  } catch (error) {
    next(error);
  }
};

// 👇👇👇 CRASH PROOF: GET ALL USERS 👇👇👇
export const getUsers = async (req, res, next) => {
  try {
    // 🛡️ Safety Check 1: Auth check
    if (!req.user || !req.user.id) {
        return next(errorHandler(401, 'User not authenticated'));
    }

    const user = await User.findById(req.user.id);

    // 🛡️ Safety Check 2: Admin check
    if (!user || user.role !== 'admin') {
      return next(errorHandler(403, 'Access Denied! Admins only.'));
    }

    const users = await User.find().sort({ createdAt: -1 });
    const usersWithoutPassword = users.map((u) => {
      const { password, ...rest } = u._doc;
      return rest;
    });

    res.status(200).json(usersWithoutPassword);
  } catch (error) {
    console.log("Error in getUsers:", error.message); // Crash nahi hoga, bas print karega
    next(error);
  }
};

// --- SELLER FEATURES ---
export const requestSeller = async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (user.sellerStatus === 'approved') return next(errorHandler(400, 'Already Approved!'));
      if (user.sellerStatus === 'pending') return next(errorHandler(400, 'Request Pending!'));
  
      user.sellerStatus = 'pending';
      await user.save();
      const { password, ...rest } = user._doc;
      res.status(200).json(rest);
    } catch (error) {
      next(error);
    }
};
  
export const verifySeller = async (req, res, next) => {
    try {
        const adminUser = await User.findById(req.user.id);
        if (!adminUser || adminUser.role !== 'admin') return next(errorHandler(403, 'Admins Only!'));

        const { status } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { sellerStatus: status } },
            { new: true }
        );
        const { password, ...rest } = updatedUser._doc;
        res.status(200).json(rest);
    } catch (error) {
      next(error);
    }
};