import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';
import bcryptjs from 'bcryptjs';

export const test = (req, res) => {
  res.json({ message: 'Api route is working!' });
};

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

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, 'You can only delete your own account!'));
  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie('access_token');
    res.status(200).json('User has been deleted!');
  } catch (error) {
    next(error);
  }
};

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

// --- FIX 1: SAFE SAVE LISTING ---
export const saveListing = async (req, res, next) => {
  try {
    const listingId = req.params.id; 
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return next(errorHandler(404, 'User not found!'));

    // ✅ SAFETY CHECK: Agar savedListings nahi hai, to empty array lo
    const savedListings = user.savedListings || [];

    const isSaved = savedListings.some((id) => id.toString() === listingId);

    if (isSaved) {
      await User.findByIdAndUpdate(userId, {
        $pull: { savedListings: listingId },
      });
      res.status(200).json('Listing removed from wishlist');
    } else {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { savedListings: listingId },
      });
      res.status(200).json('Listing saved to wishlist');
    }
  } catch (error) {
    next(error);
  }
};

// --- FIX 2: SAFE GET SAVED LISTINGS ---
export const getSavedListings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(errorHandler(404, 'User not found'));

    // ✅ SAFETY CHECK
    const savedListingsIds = user.savedListings || [];

    const savedListings = await Promise.all(
        savedListingsIds.map((listingId) => Listing.findById(listingId))
    );

    const validListings = savedListings.filter(listing => listing !== null);
    res.status(200).json(validListings);
  } catch (error) {
    next(error);
  }
};