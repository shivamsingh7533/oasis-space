import express from 'express';
import {
  test,
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
  contactLandlord, // ✅ NEW IMPORT
  contactUs        // ✅ FOOTER CONTACT
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// 1. Test Route
router.get('/test', test);

// 2. Auth Required Routes
router.post('/update/:id', verifyToken, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);

// 3. User Specific Routes
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

// 7. ✅ CONTACT ROUTES
router.post('/contact', verifyToken, contactLandlord);
router.post('/contact-us', contactUs); // Public — no auth needed

// 8. Public Route (Always keep at bottom)
router.get('/:id', verifyToken, getUser);

export default router;