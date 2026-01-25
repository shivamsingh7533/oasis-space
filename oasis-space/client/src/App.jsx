import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import About from './pages/About';
import Profile from './pages/Profile';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import CreateListing from './pages/CreateListing';
import UpdateListing from './pages/UpdateListing';
import Listing from './pages/Listing';
import Search from './pages/Search';
import Preloader from './components/Preloader';
import SavedListings from './pages/SavedListings';
import Footer from './components/Footer';

// --- NEW IMPORTS FOR ADMIN PANEL ---
import Dashboard from './pages/Dashboard';
import AdminRoute from './components/AdminRoute';

// --- 👇 NEW IMPORTS FOR PASSWORD RESET 👇 ---
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  // State to track if we are loading
  const [loading, setLoading] = useState(true);

  // Use Effect to wait for 3 seconds, then stop loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // 3000 milliseconds = 3 seconds

    return () => clearTimeout(timer);
  }, []);

  // If loading is true, ONLY show the Preloader
  if (loading) {
    return <Preloader />;
  }

  // Otherwise, show the full app
  return (
    <BrowserRouter>
      {/* 1. LAYOUT WRAPPER: Ensures footer stays at bottom */}
      <div className="flex flex-col min-h-screen">
        
        <Header />
        
        {/* 2. MAIN CONTENT: flex-grow pushes the footer down */}
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path='/' element={<Home />} />
            <Route path='/sign-in' element={<SignIn />} />
            <Route path='/sign-up' element={<SignUp />} />
            <Route path='/about' element={<About />} />
            <Route path='/search' element={<Search />} />
            <Route path='/listing/:listingId' element={<Listing />} />

            {/* 👇 PASSWORD RESET ROUTES ADDED HERE 👇 */}
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/reset-password/:id/:token' element={<ResetPassword />} />

            {/* --- ADMIN PROTECTED ROUTES --- */}
            <Route element={<AdminRoute />}>
              <Route path='/dashboard' element={<Dashboard />} />
            </Route>

            {/* User Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route path='/saved-listings' element={<SavedListings />} />
              <Route path='/profile' element={<Profile />} />
              <Route path='/create-listing' element={<CreateListing />} />
              <Route path='/update-listing/:listingId' element={<UpdateListing />} />
            </Route>
          </Routes>
        </main>

        {/* 3. FOOTER COMPONENT */}
        <Footer />
        
      </div>
    </BrowserRouter>
  );
}