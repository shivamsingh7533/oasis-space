import { createSlice } from '@reduxjs/toolkit';

// Default state uses INR as the base currency since property prices in DB are in INR
const initialState = {
  currency: 'INR',
  rates: null, // Will store exchange rates (e.g., { USD: 0.012, EUR: 0.011 })
  lastFetched: null, // Timestamp to avoid fetching APIs too often
};

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency: (state, action) => {
      // e.g., 'USD', 'EUR'
      state.currency = action.payload; 
    },
    setExchangeRates: (state, action) => {
      state.rates = action.payload;
      state.lastFetched = Date.now();
    },
  },
});

export const { setCurrency, setExchangeRates } = currencySlice.actions;
export default currencySlice.reducer;
