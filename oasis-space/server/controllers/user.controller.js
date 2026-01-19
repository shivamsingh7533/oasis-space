import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js'; // <--- CRITICAL IMPORT
import { errorHandler } from '../utils/error.js';

export const test = (req, res) => {
  res.json({
    message: 'Api route is working!',
  });
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

// --- PASTE YOUR NEW CODE HERE (At the bottom) ---

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
    const { password, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};
// ... (keep all your existing imports and functions) ...

// --- TOGGLE SAVED LISTING ---
export const saveListing = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only update your own account!'));
  }
  
  try {
    const user = await User.findById(req.params.id);
    const listingId = req.body.listingId;

    // Check if listing is already saved
    if (user.savedListings.includes(listingId)) {
      // If yes, REMOVE it ($pull)
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { savedListings: listingId },
      });
      res.status(200).json('Listing removed from saved!');
    } else {
      // If no, ADD it ($push)
      await User.findByIdAndUpdate(req.params.id, {
        $push: { savedListings: listingId },
      });
      res.status(200).json('Listing saved!');
    }
  } catch (error) {
    next(error);
  }
};
// ... (keep all existing code) ...

// --- GET SAVED LISTINGS (Full Details) ---
export const getSavedListings = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only view your own saved listings!'));
  }
  try {
    const user = await User.findById(req.params.id);
    const savedListings = await Listing.find({
      _id: { $in: user.savedListings },
    });
    res.status(200).json(savedListings);
  } catch (error) {
    next(error);
  }
};