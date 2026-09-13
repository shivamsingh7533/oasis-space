// Client-side mirror of server/utils/fees.js — single source of truth for display.
export const LISTING_FEES = {
  rent: 1100,
  sale: 5100,
};

export const getListingFee = (type) => (type === 'rent' ? LISTING_FEES.rent : LISTING_FEES.sale);