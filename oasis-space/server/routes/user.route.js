import express from 'express';
import {
  updateUser,
  deleteUser,
  getUserListings,
  getUser,
  saveListing,
  getSavedListings,
  getUsers,
  requestSeller,
  verifySeller,
  respondSellerViaEmail,
  getSellerDashboard,
  contactLandlord,
  contactUs
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { contactLimiter } from '../utils/limiters.js';

const router = express.Router();

// 1. Auth Required Routes
router.post('/update/:id', verifyToken, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);

// 2. User Specific Routes
router.get('/listings/:id', verifyToken, getUserListings);

// ✅ Saved Listings (Must be before /:id)
router.get('/saved', verifyToken, getSavedListings);
router.post('/save/:id', verifyToken, saveListing);

// 🔥 Seller Dashboard
router.get('/dashboard/:id', verifyToken, getSellerDashboard);

// 4. ADMIN DASHBOARD
router.get('/getusers', verifyToken, getUsers);

// 5. SELLER VERIFICATION ROUTES
router.post('/request-seller/:id', verifyToken, requestSeller);
router.post('/verify-seller/:id', verifyToken, verifySeller);

// 6. Magic Link Route
router.get('/respond-seller/:token', respondSellerViaEmail);

// 7. ✅ CONTACT ROUTES (public — spam-limited, never double-counted)
//    contactLandlord is called from the public Listing detail page by
//    anonymous visitors too.
router.post('/contact', contactLimiter, contactLandlord);
router.post('/contact-us', contactLimiter, contactUs);

// 8. Public Route (Always keep at bottom) — allowlisted safe fields only
router.get('/:id', getUser);

export default router;