// Central business fee config — single source of truth for listing fees.
// Matches the published pricing in FAQ.jsx / Terms.jsx.
export const LISTING_FEES = {
  rent: 0, // Rent listings publish FREE (instant, no payment required)
  sale: 5100,
};

// Buyer token booking amount to reserve/express interest in a property
export const BOOKING_TOKEN_FEE = 999;

export const getListingFee = (type) => (type === 'rent' ? LISTING_FEES.rent : LISTING_FEES.sale);

export const FEES_CURRENCY = 'INR';