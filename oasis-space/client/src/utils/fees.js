// Client-side mirror of server/utils/fees.js — single source of truth for display.
export const LISTING_FEES = {
  rent: 0, // Rent listings publish FREE (instant, no payment required)
  sale: 5100,
};

export const getListingFee = (type) => (type === 'rent' ? LISTING_FEES.rent : LISTING_FEES.sale);