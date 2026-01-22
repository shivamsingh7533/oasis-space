import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { store, persistor } from './redux/store.js';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import 'leaflet/dist/leaflet.css'; // <-- Map CSS Import

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    {/* PersistGate ensure karta hai ki refresh karne par user logout na ho */}
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);