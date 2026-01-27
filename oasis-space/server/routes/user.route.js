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
  respondSellerViaEmail // ✅ NEW: Controller import kiya
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// 1. Test Route
router.get('/test', test);

// 2. Auth Required Routes (Update/Delete)
router.post('/update/:id', verifyToken, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);

// 3. User Specific Routes (Listings & Wishlist)
router.get('/listings/:id', verifyToken, getUserListings);
router.get('/saved', verifyToken, getSavedListings); 
router.post('/save/:id', verifyToken, saveListing);

// 4. ADMIN DASHBOARD ROUTE (Users List)
router.get('/getusers', verifyToken, getUsers);

// 5. SELLER VERIFICATION ROUTES
router.post('/request-seller/:id', verifyToken, requestSeller); // User request karega
router.post('/verify-seller/:id', verifyToken, verifySeller);   // Admin dashboard se approve karega

// 🔥 NEW: Magic Link Route (Email se Approve/Reject) 🪄
// Note: Yahan verifyToken mat lagana kyunki ye Gmail se direct click hoga
router.get('/respond-seller/:token', respondSellerViaEmail);

// 6. Public/Dynamic Route (Sabse last mein rakhein)
router.get('/:id', verifyToken, getUser);

export default router;