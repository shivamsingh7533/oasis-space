import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Preloader from './components/Preloader';

// --- DYNAMIC IMPORTS (Code Splitting) ---
const Home = lazy(() => import('./pages/Home'));
const ChatWidget = lazy(() => import('./components/ChatWidget'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const About = lazy(() => import('./pages/About'));
const Profile = lazy(() => import('./pages/Profile'));
const CreateListing = lazy(() => import('./pages/CreateListing'));
const UpdateListing = lazy(() => import('./pages/UpdateListing'));
const Listing = lazy(() => import('./pages/Listing'));
const Search = lazy(() => import('./pages/Search'));
const SavedListings = lazy(() => import('./pages/SavedListings'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));

// Footer Pages
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const FAQ = lazy(() => import('./pages/FAQ'));

export default function App() {
  return (
    <BrowserRouter>
      {/* ✅ FIX: Added 'w-full' and 'overflow-x-hidden' to force full width */}
      <div className="flex flex-col min-h-screen w-full overflow-x-hidden relative bg-slate-900">

        {/* Header (Ab ye bhi full width container ke andar hoga) */}
        <Header />

        {/* ✅ FIX: Added 'w-full' to main tag */}
        <main className="flex-grow w-full min-h-[85vh]">
          <Suspense fallback={<Preloader />}>
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
          </Suspense>
        </main>

        {/* CHATBOT - Lazy Loaded */}
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>

        <Footer />
      </div>
    </BrowserRouter>
  );
}