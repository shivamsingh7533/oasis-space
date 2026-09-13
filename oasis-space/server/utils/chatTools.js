// Chat tool implementations for the Jarvis agent. These are executed server-side
// from the LLM's tool_calls — never trust unvalidated input, clamp everything.
import Listing from '../models/listing.model.js';
import { getListingFee } from './fees.js';

const MAX_RESULTS = 8;

const clampInt = (value, min, max, fallback) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const priceMatch = (minPrice, maxPrice) => {
  const conditions = [];
  if (minPrice != null && maxPrice != null) {
    conditions.push({ offer: true, discountPrice: { $gte: minPrice, $lte: maxPrice } });
    conditions.push({ offer: false, regularPrice: { $gte: minPrice, $lte: maxPrice } });
  } else if (minPrice != null) {
    conditions.push({ offer: true, discountPrice: { $gte: minPrice } });
    conditions.push({ offer: false, regularPrice: { $gte: minPrice } });
  } else if (maxPrice != null) {
    conditions.push({ offer: true, discountPrice: { $lte: maxPrice } });
    conditions.push({ offer: false, regularPrice: { $lte: maxPrice } });
  }
  return conditions.length ? { $or: conditions } : null;
};

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatListing = (l) => ({
  id: l._id.toString(),
  name: l.name || 'Property',
  type: l.type,
  price: l.offer ? l.discountPrice : l.regularPrice,
  offer: !!l.offer,
  address: l.address || '',
  bedrooms: l.bedrooms,
  bathrooms: l.bathrooms,
  furnished: !!l.furnished,
  image: (l.imageUrls && l.imageUrls[0]) || '',
  url: `/listing/${l._id}`,
});

// Tool 1: search live listings with filters.
const searchListings = async (args = {}) => {
  const filter = { status: 'available' };

  const type = String(args.type || '').toLowerCase();
  if (type === 'rent' || type === 'sale') filter.type = type;

  const city = String(args.city || '').trim();
  if (city) filter.address = { $regex: escapeRegex(city), $options: 'i' };

  const bedrooms = clampInt(args.bedrooms, 1, 20, null);
  if (bedrooms != null) filter.bedrooms = bedrooms;

  const bathrooms = clampInt(args.bathrooms, 1, 20, null);
  if (bathrooms != null) filter.bathrooms = bathrooms;

  if (typeof args.furnished === 'boolean') filter.furnished = args.furnished;
  if (typeof args.furnished === 'string') {
    const f = String(args.furnished).toLowerCase();
    if (f === 'true' || f === 'yes') filter.furnished = true;
    else if (f === 'false' || f === 'no') filter.furnished = false;
  }

  if (typeof args.offer === 'boolean') filter.offer = args.offer;

  const minPrice = clampInt(args.minPrice, 0, 1e9, null);
  const maxPrice = clampInt(args.maxPrice, 0, 1e9, null);
  if (maxPrice != null && minPrice != null && minPrice > maxPrice) {
    return [];
  }
  const priceCond = priceMatch(minPrice, maxPrice);
  if (priceCond) Object.assign(filter, priceCond);

  const sortKey = ['recent', 'price-asc', 'price-desc', 'newest'].includes(args.sort)
    ? args.sort
    : 'recent';
  const limit = clampInt(args.limit, 1, MAX_RESULTS, MAX_RESULTS);

  let listings = await Listing.find(filter)
    .select('name type regularPrice discountPrice address bathrooms bedrooms furnished offer imageUrls status')
    .limit(40)
    .lean();

  // Filter + sort by effective price in JS (supports offer/discount math simply).
  const priced = listings.map((l) => ({ ...l, _price: l.offer ? l.discountPrice : l.regularPrice }))
    .filter((l) => (minPrice == null || l._price >= minPrice) && (maxPrice == null || l._price <= maxPrice));

  if (sortKey === 'price-asc') priced.sort((a, b) => a._price - b._price);
  else if (sortKey === 'price-desc') priced.sort((a, b) => b._price - a._price);
  else priced.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return priced.slice(0, limit).map(formatListing);
};

// Tool 2: full detail for a single listing.
const getListingDetail = async (args = {}) => {
  const id = String(args.id || '').trim();
  if (!/^[0-9a-fA-F]{24}$/.test(id)) return { error: 'Invalid listing id', found: false };

  const listing = await Listing.findById(id).lean();
  if (!listing) return { error: 'Listing not found', found: false };

  return {
    found: true,
    listing: {
      ...formatListing(listing),
      description: listing.description || '',
      parking: !!listing.parking,
      status: listing.status,
      imageLabels: listing.imageLabels || [],
    },
  };
};

// Tool 3: platform facts (fees, seller verification, how-to-list, support).
const platformInfo = (args = {}) => {
  const topic = String(args.topic || '').toLowerCase();
  const saleFee = getListingFee('sale').toLocaleString('en-IN');

  const FACTS = {
    fees: [
      'Rent listings publish FREE — instantly, no payment needed.',
      `Sale listings: one-time fee of ₹${saleFee} via Razorpay (non-refundable once live).`,
      'No hidden commissions. Browsing and contacting landlords is free.',
    ].join('\n'),
    list: `How to list: sign up (email + OTP) -> verify -> request seller status -> admin approves -> create listing. Rent publishes free & instantly; Sale pays ₹${saleFee} once and goes live right after payment.`,
    seller: 'Seller status: regular -> pending -> approved / rejected. Admins approve sellers; sale listings need an approved seller, rent listings do not.',
    verification: 'Sellers are manually approved by admins (approved/rejected magic-link from dashboard) to keep the marketplace genuine.',
    emi: 'The site offers an EMI calculator on each sale property page to compare loan options and total payable.',
    search: 'Search supports filters like city, type (rent/sale), price range, bedrooms, bathrooms, furnished and offers, plus sorting by recent or price.',
    support: 'Use the Contact us form (/api/user/contact) or the footer contact form. Chat assistant is available 24x7.',
    browse: 'Browsing, searching, the interactive map and messaging landlords is completely free.',
    default: 'Ask me about listing fees, seller verification, how to list a property, EMI, or search for properties.',
  };

  const key = FACTS[topic] ? topic : 'default';
  return FACTS[key];
};

// Dispatcher used by the tool-calling loop.
export const runTool = async (name, args) => {
  switch (name) {
    case 'search_listings': return await searchListings(args || {});
    case 'get_listing_detail': return await getListingDetail(args || {});
    case 'get_platform_info': return platformInfo(args || {});
    default: return { error: `Unknown tool '${name}'` };
  }
};

export const MAX_TOOL_RESULTS = MAX_RESULTS;