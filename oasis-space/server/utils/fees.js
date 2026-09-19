// Central business fee config — single source of truth for listing fees.
// Matches the published pricing in FAQ.jsx / Terms.jsx.
export const LISTING_FEES = {
  rent: 0, // Rent listings publish FREE (instant, no payment required)
  sale: 5100,
};

// Buyer token booking amount to reserve/express interest in a property
export const BOOKING_TOKEN_FEE = 999;

// Seller subscription pack: ₹5,100 for 10 Sale properties (1 year validity)
export const SELLER_PACK = {
  price: 5100,
  listingQuota: 10,
  validityDays: 365,
  name: 'Seller Pro Pack (10 Listings)',
};

export const getListingFee = (type) => (type === 'rent' ? LISTING_FEES.rent : LISTING_FEES.sale);

export const FEES_CURRENCY = 'INR';