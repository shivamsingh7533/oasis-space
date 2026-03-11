import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setExchangeRates } from '../redux/currency/currencySlice';

export default function CurrencyProvider({ children }) {
  const { rates, lastFetched } = useSelector((state) => state.currency);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Fetch rates if we don't have them OR if they are older than 12 hours (43,200,000 ms)
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        
        if (!rates || !lastFetched || Date.now() - lastFetched > TWELVE_HOURS) {
          // Using a free, no-key-required exchange rate API with INR as base
          const res = await fetch('https://open.er-api.com/v6/latest/INR');
          const data = await res.json();
          
          if (data && data.rates) {
            dispatch(setExchangeRates(data.rates));
            console.log('✅ Latest Exchange Rates Fetched from ER-API');
          }
        }
      } catch (error) {
        console.log('Failed to fetch exchange rates:', error);
      }
    };

    fetchRates();
  }, [dispatch, rates, lastFetched]);

  return <>{children}</>;
}
