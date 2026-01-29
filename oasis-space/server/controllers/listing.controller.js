import Listing from '../models/listing.model.js';
import User from '../models/user.model.js'; 
import { errorHandler } from '../utils/error.js';
import { GoogleGenerativeAI } from "@google/generative-ai"; // ✅ AI Import

// 1. Create Listing
export const createListing = async (req, res, next) => {
  try {
    if (req.body.type === 'sale') {
        const user = await User.findById(req.user.id);
        if (user.sellerStatus !== 'approved' && user.role !== 'admin') {
            return next(errorHandler(403, 'Permission Denied! Only Approved Sellers can list properties for SALE.'));
        }
    }
    const newListingData = {
        ...req.body,
        status: req.body.status || 'available' 
    };
    const listing = await Listing.create(newListingData);
    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

// 2. Delete Listing
export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(errorHandler(404, 'Listing not found!'));

  try {
    const user = await User.findById(req.user.id);
    if (req.user.id !== listing.userRef && user.role !== 'admin') {
      return next(errorHandler(401, 'You can only delete your own listings!'));
    }
    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json('Listing has been deleted!');
  } catch (error) {
    next(error);
  }
};

// 3. Update Listing
export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(errorHandler(404, 'Listing not found!'));

  try {
    const user = await User.findById(req.user.id);
    if (req.user.id !== listing.userRef && user.role !== 'admin') {
        return next(errorHandler(401, 'You can only update your own listings!'));
    }
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

// 5. Get All Listings (Frontend Search)
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
      featured,
      status: { $nin: ['sold', 'rented'] } 
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// 6. Admin Get All Listings
export const getAdminListings = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
        return next(errorHandler(401, 'User not authenticated!'));
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
         return next(errorHandler(403, 'Admins only.'));
    }

    const listings = await Listing.find().sort({ createdAt: -1 });
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// 7. Toggle Featured
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

// 8. UPDATE STATUS (Sold/Rented)
export const updateListingStatus = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(errorHandler(404, 'Listing not found!'));

    const user = await User.findById(req.user.id);
    if (req.user.id !== listing.userRef && user.role !== 'admin') {
      return next(errorHandler(401, 'Permission denied!'));
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

// 👇👇👇 9. NEW AI FEATURE: GENERATE DESCRIPTION 🤖 👇👇👇
export const generateDescription = async (req, res, next) => {
  const { name, address, type, bedrooms, bathrooms, parking, furnished, offer } = req.body;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return next(errorHandler(500, 'Gemini API Key is missing!'));
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // ✅ Using the model confirmed by your check-models.js
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Write a professional, attractive, and SEO-friendly real estate description for a property with these details:
      - Title/Name: ${name}
      - Location: ${address}
      - Type: ${type} (Rent or Sale)
      - Bedrooms: ${bedrooms}
      - Bathrooms: ${bathrooms}
      - Parking: ${parking ? 'Available' : 'Not Available'}
      - Furnished: ${furnished ? 'Yes' : 'No'}
      - Special Offer: ${offer ? 'Yes' : 'No'}

      Tone: Inviting and Luxury. 
      Length: Under 150 words. 
      Format: Plain text (no markdown like ** or ##), ready to paste.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ description: text });

  } catch (error) {
    console.log("AI Generation Error:", error);
    next(errorHandler(500, 'Failed to generate description. Try again.'));
  }
};