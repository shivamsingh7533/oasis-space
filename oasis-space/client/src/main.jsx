import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { store, persistor } from './redux/store.js';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import ThemeProvider from './components/ThemeProvider.jsx';
import CurrencyProvider from './components/CurrencyProvider.jsx'; // ✅ New Providers

// Self-heal on stale deploys: after a new build, Vite asset hashes change and Vercel's
// SPA catch-all returns index.html (MIME text/html) for missing chunks, which is a
// fatal MIME error. Reload once to pick up the fresh bundle.
window.addEventListener('vite:preloadError', () => {
  const last = Number(sessionStorage.getItem('os-stale-reload-at') || 0);
  if (Date.now() - last > 5000) {
    sessionStorage.setItem('os-stale-reload-at', String(Date.now()));
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    {/* PersistGate ensure karta hai ki refresh karne par user logout na ho */}
    <PersistGate loading={null} persistor={persistor}>
      <ThemeProvider>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </ThemeProvider>
    </PersistGate>
  </Provider>
);