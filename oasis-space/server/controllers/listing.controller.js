import Listing from '../models/listing.model.js';
import User from '../models/user.model.js'; 
import { errorHandler } from '../utils/error.js';

// 1. Create Listing (With Seller Permission Check) 💼
export const createListing = async (req, res, next) => {
  try {
    if (req.body.type === 'sale') {
        const user = await User.findById(req.user.id);
        if (user.sellerStatus !== 'approved' && user.role !== 'admin') {
            return next(errorHandler(403, 'Permission Denied! You need to be an Approved Seller to sell properties.'));
        }
    }
    const listing = await Listing.create(req.body);
    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

// 2. Delete Listing (Owner OR Admin) 🛡️
export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(errorHandler(404, 'Listing not found!'));

  try {
    const user = await User.findById(req.user.id);
    // Check: Owner ya Admin
    if (req.user.id !== listing.userRef && user.role !== 'admin') {
      return next(errorHandler(401, 'You can only delete your own listings!'));
    }

    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json('Listing has been deleted!');
  } catch (error) {
    next(error);
  }
};

// 3. Update Listing (SAFE MODE: Owner nahi badlega) 🛡️✏️
export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(errorHandler(404, 'Listing not found!'));

  try {
    const user = await User.findById(req.user.id);
    
    // Check: Owner ya Admin
    if (req.user.id !== listing.userRef && user.role !== 'admin') {
        return next(errorHandler(401, 'You can only update your own listings!'));
    }

    // 🔥 FIX: userRef ko body se hata dein taaki admin owner na ban jaye
    const { userRef, ...rest } = req.body;

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      rest, 
      { new: true }
    );
    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

// 4. Get Single Listing
export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(errorHandler(404, 'Listing not found!'));
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

// 5. Get All Listings (UPDATED FOR HOME PAGE SLIDER 🌟)
export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;
    
    let offer = req.query.offer;
    if (offer === undefined || offer === 'false') offer = { $in: [false, true] };

    let furnished = req.query.furnished;
    if (furnished === undefined || furnished === 'false') furnished = { $in: [false, true] };

    let parking = req.query.parking;
    if (parking === undefined || parking === 'false') parking = { $in: [false, true] };

    let type = req.query.type;
    if (type === undefined || type === 'all') type = { $in: ['sale', 'rent'] };

    // 👇 ADDED: Featured Filter for Home Page
    let featured = req.query.featured;
    if (featured === undefined || featured === 'false') {
        featured = { $in: [false, true] };
    } else {
        featured = true;
    }

    const searchTerm = req.query.searchTerm || '';
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';

    const listings = await Listing.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
      ],
      offer,
      furnished,
      parking,
      type,
      featured, // <--- Added here
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// 6. Admin Get All Listings 👑
export const getAdminListings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return next(errorHandler(403, 'Access Denied!'));

    const listings = await Listing.find().sort({ createdAt: -1 });
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// 7. Toggle Featured Status 🌟
export const featureListing = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') return next(errorHandler(403, 'Access Denied!'));

    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(errorHandler(404, 'Listing not found'));

    listing.featured = !listing.featured;
    await listing.save();
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

// 8. AI Generator
export const generateDescription = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!process.env.GEMINI_API_KEY) return next(errorHandler(500, 'API Key missing!'));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Write a real estate description for: ${prompt}` }] }] }),
      }
    );
    const data = await response.json();
    if (data.candidates?.[0]?.content) {
      res.status(200).json(data.candidates[0].content.parts[0].text);
    } else {
      res.status(500).json("No description generated.");
    }
  } catch (error) {
    next(error);
  }
};