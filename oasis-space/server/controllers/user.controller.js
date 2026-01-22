import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
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

// --- CRITICAL FIX: deleteUser function added back ---
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

// --- NEW FUNCTION: Save or Unsave a Listing ---
export const saveListing = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only update your own account!'));
  }

  try {
    const user = await User.findById(req.params.id);
    const listingId = req.body.listingId; 

    if (user.savedListings.includes(listingId)) {
      // Unsave (Remove)
      await User.findByIdAndUpdate(
        req.params.id,
        {
          $pull: { savedListings: listingId },
        },
        { new: true }
      );
      res.status(200).json('Listing has been removed from saved items');
    } else {
      // Save (Add)
      await User.findByIdAndUpdate(
        req.params.id,
        {
          $push: { savedListings: listingId },
        },
        { new: true }
      );
      res.status(200).json('Listing saved successfully');
    }
  } catch (error) {
    next(error);
  }
};

// --- NEW FUNCTION: Get All Saved Listings ---
export const getSavedListings = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only view your own saved listings!'));
  }

  try {
    const user = await User.findById(req.params.id);
    
    // Convert IDs to Listing Objects
    const savedListings = await Promise.all(
      user.savedListings.map((listingId) => Listing.findById(listingId))
    );

    res.status(200).json(savedListings);
  } catch (error) {
    next(error);
  }
};