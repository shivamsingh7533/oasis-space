import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import Order from '../models/order.model.js';
import { errorHandler } from '../utils/error.js';
import { getListingFee } from '../utils/fees.js';
import { GoogleGenerativeAI } from "@google/generative-ai"; // ✅ AI Import

import Notification from '../models/notification.model.js';
import sendEmail from '../utils/sendEmail.js';
import { sendPushNotification } from '../utils/sendPush.js';

const escapeHtml = (str = '') =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Whitelist applied on create — never trust raw req.body keys like userRef/featured/status.
const CREATE_FIELDS = [
  'name', 'description', 'address', 'regularPrice', 'discountPrice',
  'bathrooms', 'bedrooms', 'furnished', 'parking', 'type', 'offer',
  'imageUrls', 'imageLabels',
];

const UPDATE_FIELDS_SELLER = [
  'name', 'description', 'address', 'regularPrice', 'discountPrice',
  'bathrooms', 'bedrooms', 'furnished', 'parking', 'offer',
  'imageUrls', 'imageLabels',
];

const toBools = {
  'true': true, '1': true, 'yes': true, 'on': true,
  'false': false, '0': false, 'no': false, 'off': false,
};

// Helper to trigger automated quota exhaustion alerts
async function triggerQuotaExhaustionAlert(sellerUser) {
  sellerUser.sellerSubscription.status = 'exhausted';

  // 1. Dispatch automated quota exhaustion email
  if (sellerUser.email) {
    const emailSubject = `⚠️ Action Required: Your OasisSpace Seller Pack Quota is Complete (10/10 Listings Used)`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="color: #dc2626;">Your 10 Listing Credits Have Been Used!</h2>
        <p>Hello <strong>${escapeHtml(sellerUser.username)}</strong>,</p>
        <p>You have successfully published your 10th property on OasisSpace. Your current <strong>Seller Pro Pack quota is now fully exhausted (10/10 used)</strong>.</p>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #991b1b; font-weight: bold;">⚠️ Future property listings will be paused until your pack is reclaimed.</p>
        </div>
        <p>To continue posting properties with instant live publishing, please reclaim or renew your Seller Pack for <strong>₹5,100 (10 more listings)</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'https://oasis-space.vercel.app'}/seller-dashboard" 
             style="background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Reclaim Seller Pack on Dashboard &rarr;
          </a>
        </div>
        <p style="font-size: 12px; color: #888;">Team OasisSpace &bull; Built for serious real estate professionals</p>
      </div>
    `;
    await sendEmail(sellerUser.email, emailSubject, emailBody);
    await sendEmail(process.env.SENDER_EMAIL, emailSubject, emailBody);
  }

  // 2. In-App Notification
  await Notification.create({
    recipient: sellerUser._id,
    sender: sellerUser._id,
    message: `⚠️ Quota complete! You have used all 10 listing credits. Reclaim your Seller Pack on the dashboard to continue listing properties.`,
    relatedId: null,
  });

  // 3. Web Push Notification
  await sendPushNotification(sellerUser._id, {
    title: '⚠️ Seller Pack Quota Exhausted',
    body: 'You have used all 10 listing credits. Reclaim your Seller Pack on the dashboard.',
    icon: '/icon-192.png'
  });
}

// 1. Create Listing — Rent listings are FREE & require no subscription.
//    Sale listings require Approved Seller status and an active Seller Pro Pack.
export const createListing = async (req, res, next) => {
  try {
    const type = req.body.type;

    if (type !== 'rent' && type !== 'sale') {
      return next(errorHandler(400, "Listing type must be either 'rent' or 'sale'."));
    }

    const sellerUser = await User.findById(req.user.id);
    if (!sellerUser) return next(errorHandler(404, 'User not found!'));

    // --- SALE LISTINGS: Approved seller status & active pack quota required ---
    if (type === 'sale') {
      if (sellerUser.role !== 'admin' && sellerUser.sellerStatus !== 'approved') {
        return next(errorHandler(403, 'Permission Denied! Only Approved Sellers can list properties for SALE.'));
      }

      if (sellerUser.role !== 'admin') {
        const sub = sellerUser.sellerSubscription;
        const isSubActive = sub && sub.status === 'active' && sub.endDate && new Date(sub.endDate) > new Date();
        const hasQuota = isSubActive && (sub.usedQuota < sub.totalQuota);

        if (!hasQuota) {
          const isExhausted = sub && (sub.status === 'exhausted' || (sub.totalQuota > 0 && sub.usedQuota >= sub.totalQuota));
          const msg = isExhausted
            ? 'Your Seller Pack quota is exhausted (10/10 properties listed). Please reclaim your Seller Pack to list more properties.'
            : 'Active Seller Pack required to list properties for Sale! Please purchase the Seller Pro Pack (₹5,100 for 10 listings) to proceed.';
          return next(errorHandler(403, msg));
        }
      }
    }

    const newListingData = {};
    for (const field of CREATE_FIELDS) {
      if (req.body[field] !== undefined) newListingData[field] = req.body[field];
    }

    // Server-authoritative fields — never taken from the client.
    newListingData.userRef = req.user.id;
    newListingData.featured = false;
    newListingData.status = 'available'; // Rent & subscribed Sale listings publish instantly!

    // Deduct 1 credit from quota for non-admin SALE listings
    if (type === 'sale' && sellerUser.role !== 'admin') {
      sellerUser.sellerSubscription.usedQuota += 1;
      const reachedLimit = sellerUser.sellerSubscription.usedQuota >= sellerUser.sellerSubscription.totalQuota;

      if (reachedLimit) {
        await triggerQuotaExhaustionAlert(sellerUser);
      }

      await sellerUser.save();
    }

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

    const isAdmin = user.role === 'admin';
    const updates = {};

    // Check type change: prevent rent -> sale bypass, decrement quota if changed
    if (req.body.type !== undefined) {
      if (req.body.type !== 'rent' && req.body.type !== 'sale') {
        return next(errorHandler(400, "Listing type must be either 'rent' or 'sale'."));
      }

      if (req.body.type !== listing.type) {
        // Converting Rent -> Sale requires active Seller Pack quota
        if (listing.type === 'rent' && req.body.type === 'sale') {
          if (!isAdmin) {
            if (user.sellerStatus !== 'approved') {
              return next(errorHandler(403, 'Permission Denied! Only Approved Sellers can list properties for SALE.'));
            }

            const sub = user.sellerSubscription;
            const isSubActive = sub && sub.status === 'active' && sub.endDate && new Date(sub.endDate) > new Date();
            const hasQuota = isSubActive && (sub.usedQuota < sub.totalQuota);

            if (!hasQuota) {
              const isExhausted = sub && (sub.status === 'exhausted' || (sub.totalQuota > 0 && sub.usedQuota >= sub.totalQuota));
              const msg = isExhausted
                ? 'Your Seller Pack quota is exhausted (10/10 properties listed). Cannot change rent property to sale. Please reclaim your Seller Pack.'
                : 'Active Seller Pack required to change property to Sale! Please purchase the Seller Pro Pack (₹5,100 for 10 listings).';
              return next(errorHandler(403, msg));
            }

            // Deduct 1 credit from quota
            user.sellerSubscription.usedQuota += 1;
            const reachedLimit = user.sellerSubscription.usedQuota >= user.sellerSubscription.totalQuota;
            if (reachedLimit) {
              await triggerQuotaExhaustionAlert(user);
            }
            await user.save();
          }
        }
        updates.type = req.body.type;
      }
    }

    // Admin-only fields
    if (isAdmin) {
      if (req.body.userRef !== undefined) updates.userRef = req.body.userRef;
      if (req.body.featured !== undefined) updates.featured = req.body.featured;
      if (req.body.status !== undefined) updates.status = req.body.status;
    }

    for (const field of UPDATE_FIELDS_SELLER) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    res.status(200).json({
      ...updatedListing.toObject(),
      sellerSubscription: user.sellerSubscription,
    });
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

    // Boolean filters coerce reliably ('true'/'1'/'yes'/'on' → true, rest → false)
    const boolFilter = (key) => {
      if (req.query[key] === undefined) return { $in: [false, true] };
      const parsed = toBools[String(req.query[key]).toLowerCase()];
      return parsed === undefined ? { $in: [false, true] } : parsed;
    };

    let offer = boolFilter('offer');
    let furnished = boolFilter('furnished');
    let parking = boolFilter('parking');

    let type = req.query.type;
    if (type === undefined || type === 'all') type = { $in: ['sale', 'rent'] };

    let featured = boolFilter('featured');

    const searchTerm = req.query.searchTerm || '';
    const words = searchTerm.split(/\s+/).filter(Boolean);

    let searchRegexPattern = '';
    if (words.length > 0) {
      const lookaheads = words.map(word => {
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const vwTolerantWord = escapedWord.replace(/[vw]/gi, '(v|w)');
        return `(?=.*${vwTolerantWord})`;
      });
      searchRegexPattern = lookaheads.join('');
    }
    const searchRegex = searchRegexPattern ? new RegExp(searchRegexPattern, 'i') : new RegExp('', 'i');

    // Map client sort keys → real schema fields (frontend used the non-existent `created_at`)
    const sortKey = { created_at: 'createdAt', createdAt: 'createdAt', price: 'regularPrice', price_desc: 'regularPrice' }[req.query.sort] || 'createdAt';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';

    // Numeric filters apply only when present and finite ('' / missing / NaN are skipped).
    const num = (v) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
    const minPrice = num(req.query.minPrice);
    const maxPrice = num(req.query.maxPrice);
    const bedrooms = num(req.query.bedrooms);
    const city = (req.query.city || '').trim();

    // "Effective price" = the discounted price on offer listings, the regular price
    // otherwise (same rule the AI search tool uses).
    const priceExpr = {
      $cond: [
        { $and: [{ $eq: ['$offer', true] }, { $gt: ['$discountPrice', 0] }] },
        '$discountPrice',
        '$regularPrice',
      ],
    };

    const filter = {
      $or: [
        { name: { $regex: searchRegex } },
        { address: { $regex: searchRegex } },
      ],
      offer,
      furnished,
      parking,
      type,
      featured,
      status: { $nin: ['sold', 'rented', 'pending'] }
    };

    // Minimum bedrooms (0 → exact Studio match, N>0 → "N or more").
    if (bedrooms === 0) filter.bedrooms = { $eq: 0 };
    else if (bedrooms !== null && bedrooms > 0) filter.bedrooms = { $gte: bedrooms };

    // City chips: word-boundary, case-insensitive match on the address.
    if (city) {
      const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.address = { $regex: new RegExp(`\\b${escapedCity}\\b`, 'i') };
    }

    // Price range on the effective price.
    if (minPrice !== null || maxPrice !== null) {
      const priceAnd = [];
      if (minPrice !== null) priceAnd.push({ $expr: { $gte: [priceExpr, minPrice] } });
      if (maxPrice !== null) priceAnd.push({ $expr: { $lte: [priceExpr, maxPrice] } });
      filter.$and = priceAnd;
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort({ [sortKey]: order })
        .limit(limit)
        .skip(startIndex),
      Listing.countDocuments(filter),
    ]);

    return res.status(200).json({ listings, total, hasMore: startIndex + listings.length < total });
  } catch (error) {
    next(error);
  }
};

// 6. Admin Get All Listings (paginated)
export const getAdminListings = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(errorHandler(401, 'User not authenticated!'));
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return next(errorHandler(403, 'Admins only.'));
    }

    const limit = parseInt(req.query.limit) || 50;
    const startIndex = parseInt(req.query.startIndex) || 0;

    const [listings, total] = await Promise.all([
      Listing.find().sort({ createdAt: -1 }).limit(limit).skip(startIndex),
      Listing.countDocuments(),
    ]);

    res.status(200).json({ listings, total });
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

    if (!['available', 'sold', 'rented'].includes(req.body.status)) {
      return next(errorHandler(400, 'Invalid status'));
    }

    // Draft listings can't be published/moved to sold/rented until the listing fee is paid.
    // The only publish path is the paid Razorpay flow (order.controller verifyPayment).
    // Rent is free: fee-less listings may change status without a paid order.
    if (listing.status === 'pending' && req.body.status !== 'pending' && getListingFee(listing.type) > 0) {
      const paid = await Order.exists({
        listingRef: listing._id,
        userRef: listing.userRef,
        type: 'listing_fee',
        status: 'success',
      });
      if (!paid) {
        return next(errorHandler(400, 'Pay the listing fee before publishing this listing.'));
      }
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

// 👇👇👇 9. AI FEATURE: GENERATE DESCRIPTION 🤖 👇👇👇
export const generateDescription = async (req, res, next) => {
  const { name, address, type, bedrooms, bathrooms, parking, furnished, offer } = req.body;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return next(errorHandler(500, 'Gemini API Key is missing!'));
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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