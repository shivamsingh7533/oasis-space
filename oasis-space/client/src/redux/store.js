import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userReducer from './user/userSlice';
import themeReducer from './theme/themeSlice'; // ✅ Imported Theme Reducer
import currencyReducer from './currency/currencySlice'; // ✅ Imported Currency Reducer
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

// 1. Combine all reducers
const rootReducer = combineReducers({
  user: userReducer,
  theme: themeReducer,
  currency: currencyReducer,
});

// 2. Define the config (Key name and storage type)
const persistConfig = {
  key: 'root',
  storage,
  version: 1,
};

// 3. Create the persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4. Configure the store with the persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // This prevents errors with Redux Persist
    }),
});

// 5. Export the persistor to use in main.jsx
export const persistor = persistStore(store);