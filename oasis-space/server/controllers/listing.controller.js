import { GoogleGenerativeAI } from '@google/generative-ai';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

export const createListing = async (req, res, next) => {
  try {
    const listing = await Listing.create(req.body);
    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(errorHandler(404, 'Listing not found!'));
  }

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only delete your own listings!'));
  }

  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json('Listing has been deleted!');
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return next(errorHandler(404, 'Listing not found!'));
  }
  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only update your own listings!'));
  }

  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

// --- THIS IS THE SEARCH FUNCTION ---
export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;
    
    // 1. Handle "Offer" Filter
    let offer = req.query.offer;
    if (offer === undefined || offer === 'false') {
      offer = { $in: [false, true] }; // If unchecked, show ALL
    }

    // 2. Handle "Furnished" Filter
    let furnished = req.query.furnished;
    if (furnished === undefined || furnished === 'false') {
      furnished = { $in: [false, true] };
    }

    // 3. Handle "Parking" Filter
    let parking = req.query.parking;
    if (parking === undefined || parking === 'false') {
      parking = { $in: [false, true] };
    }

    // 4. Handle "Type" Filter (Rent/Sale)
    let type = req.query.type;
    if (type === undefined || type === 'all') {
      type = { $in: ['sale', 'rent'] };
    }

    // 5. Handle Search Term & Sorting
    const searchTerm = req.query.searchTerm || '';
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';

    // 6. Find in Database (SEARCH BY NAME OR ADDRESS)
    const listings = await Listing.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
      ],
      offer,
      furnished,
      parking,
      type,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
    
  } catch (error) {
    next(error);
  }
};

// --- AI DESCRIPTION GENERATOR ---

// server/controllers/listing.controller.js

export const generateDescription = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    
    // Check API Key
    if (!process.env.GEMINI_API_KEY) {
      return next(errorHandler(500, 'Gemini API Key is missing!'));
    }

    const finalPrompt = `Write a professional real estate description (within 100 words) for: ${prompt}.`;

    // UPDATED: Using 'gemini-2.5-flash' (Based on your JSON list)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
        }),
      }
    );

    const data = await response.json();

    // Check for Google Errors
    if (!response.ok) {
      console.log("Google API Error:", data);
      return next(errorHandler(response.status, `Google Error: ${data.error?.message}`));
    }

    // Extract Text safely
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      res.status(200).json(text);
    } else {
      res.status(500).json("No description generated.");
    }

  } catch (error) {
    console.log("Server Error:", error);
    next(error);
  }
};