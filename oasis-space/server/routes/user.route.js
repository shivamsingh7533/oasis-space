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
  requestSeller,      // User ke liye
  verifySeller        // Admin ke liye (Controller mein yahi naam hai)
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// 1. Test Route
router.get('/test', test);

// 2. ADMIN ROUTE 
router.get('/getusers', verifyToken, getUsers);

// 3. SELLER FEATURES 💼
router.post('/request-seller', verifyToken, requestSeller);         // User Request
router.post('/verify-seller/:id', verifyToken, verifySeller);       // Admin Approve/Reject

// 4. WISHLIST ROUTES ❤️
router.post('/save/:id', verifyToken, saveListing);                 // Save/Unsave Listing
router.get('/saved', verifyToken, getSavedListings);                // Get Wishlist (Token se ID lega)

// 5. Update & Delete
router.post('/update/:id', verifyToken, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);

// 6. User Listings
router.get('/listings/:id', verifyToken, getUserListings);

// 7. Get Public User Info (Isse hamesha LAST mein rakhein)
router.get('/:id', verifyToken, getUser);

export default router;