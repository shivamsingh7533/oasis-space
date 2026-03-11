/**
 * Converts a base INR price to the target currency using live exchange rates and formats it properly.
 * 
 * @param {number} priceInINR - The original price stored in the DB in INR.
 * @param {string} targetCurrency - The currency code to convert to (e.g., 'USD', 'EUR').
 * @param {object} exchangeRates - The rates object fetched from the ER-API (relative to INR taking as base).
 * @returns {string} - The formatted string (e.g., "$1,200.50" or "₹50,000").
 */
export const formatPrice = (priceInINR, targetCurrency = 'INR', exchangeRates = null) => {
    if (typeof priceInINR !== 'number') return priceInINR;
  
    let finalPrice = priceInINR;
  
    // Convert logic if target is NOT INR and rates are available
    if (targetCurrency !== 'INR' && exchangeRates && exchangeRates[targetCurrency]) {
      finalPrice = priceInINR * exchangeRates[targetCurrency];
    }
  
    // Format the number securely with Intl.NumberFormat based on locales
    // Safari/older browsers fallback to standard formats gracefully
    const formatted = new Intl.NumberFormat(
      // Choose locale based on currency for best UX (e.g., Indian commas vs Global commas)
      targetCurrency === 'INR' ? 'en-IN' : 'en-US',
      {
        style: 'currency',
        currency: targetCurrency,
        maximumFractionDigits: 0, // Properties rarely need decimal cents displaying publicly
        minimumFractionDigits: 0
      }
    ).format(finalPrice);
  
    return formatted;
  };
  
