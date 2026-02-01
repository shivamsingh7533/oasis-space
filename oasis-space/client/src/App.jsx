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
import Dashboard from './pages/Dashboard';
import AdminRoute from './components/AdminRoute';
import SellerDashboard from './pages/SellerDashboard'; 
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import ChatWidget from './components/ChatWidget';
import OrderHistory from './pages/OrderHistory';

// Footer Pages
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import FAQ from './pages/FAQ';

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Preloader />;
  }

  return (
    <BrowserRouter>
      {/* ✅ FIX: Added 'w-full' and 'overflow-x-hidden' to force full width */}
      <div className="flex flex-col min-h-screen w-full overflow-x-hidden relative bg-slate-900"> 
        
        {/* Header (Ab ye bhi full width container ke andar hoga) */}
        <Header />
        
        {/* ✅ FIX: Added 'w-full' to main tag */}
        <main className="flex-grow w-full min-h-[85vh]">
          <Routes>
            {/* --- PUBLIC ROUTES --- */}
            <Route path='/' element={<Home />} />
            <Route path='/sign-in' element={<SignIn />} />
            <Route path='/sign-up' element={<SignUp />} />
            <Route path='/verify-email' element={<VerifyEmail />} />
            <Route path='/about' element={<About />} />
            <Route path='/search' element={<Search />} />
            <Route path='/listing/:listingId' element={<Listing />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/reset-password/:id/:token' element={<ResetPassword />} />

            {/* Footer Pages Routes */}
            <Route path='/privacy' element={<Privacy />} />
            <Route path='/terms' element={<Terms />} />
            <Route path='/faq' element={<FAQ />} />

            {/* --- ADMIN PROTECTED ROUTES --- */}
            <Route element={<AdminRoute />}>
              <Route path='/dashboard' element={<Dashboard />} />
            </Route>

            {/* --- USER & SELLER PRIVATE ROUTES --- */}
            <Route element={<PrivateRoute />}>
              <Route path='/saved-listings' element={<SavedListings />} />
              <Route path='/profile' element={<Profile />} />
              <Route path='/create-listing' element={<CreateListing />} />
              <Route path='/update-listing/:listingId' element={<UpdateListing />} />
              
              {/* Seller Dashboard */}
              <Route path='/seller-dashboard' element={<SellerDashboard />} />

              {/* Order History */}
              <Route path='/order-history' element={<OrderHistory />} />
            </Route>
          </Routes>
        </main>

        {/* CHATBOT */}
        <ChatWidget />

        <Footer />
      </div>
    </BrowserRouter>
  );
}