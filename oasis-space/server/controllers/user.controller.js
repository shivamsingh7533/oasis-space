import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js'; // Listing model import zaroori hai
import { errorHandler } from '../utils/error.js';

// ... (Baaki purane functions: test, updateUser, deleteUser, getUserListings, getUser) ...

// --- NEW FUNCTION: Save or Unsave a Listing ---
export const saveListing = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only update your own account!'));
  }

  try {
    const user = await User.findById(req.params.id);
    // Listing ID jo body mein aayi hai
    const listingId = req.body.listingId; 

    // Check agar listing pehle se saved hai
    if (user.savedListings.includes(listingId)) {
      // Agar saved hai, to REMOVE karo (Unsave)
      await User.findByIdAndUpdate(
        req.params.id,
        {
          $pull: { savedListings: listingId },
        },
        { new: true }
      );
      res.status(200).json('Listing has been removed from saved items');
    } else {
      // Agar saved nahi hai, to ADD karo (Save)
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
    
    // User ke savedListings array mein jo IDs hain, unhe Listing collection se dhundo
    const savedListings = await Promise.all(
      user.savedListings.map((listingId) => Listing.findById(listingId))
    );

    res.status(200).json(savedListings);
  } catch (error) {
    next(error);
  }
};