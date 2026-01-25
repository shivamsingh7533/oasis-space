import express from 'express';
import { 
  test, 
  updateUser, 
  deleteUser, 
  getUserListings, 
  getUser, 
  saveListing,
  getSavedListings,
  getUsers,        // ✅ Dashboard ke liye zaroori
  requestSeller,   // ✅ Seller feature ke liye
  verifySeller     // ✅ Admin feature ke liye
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
router.get('/saved', verifyToken, getSavedListings); // ⚠️ Isse '/:id' se pehle rakhna zaroori hai
router.post('/save/:id', verifyToken, saveListing);

// 4. ADMIN DASHBOARD ROUTE (Ye missing tha!) 🔥
router.get('/getusers', verifyToken, getUsers);

// 5. SELLER VERIFICATION ROUTES 💼
router.post('/request-seller/:id', verifyToken, requestSeller);
router.post('/verify-seller/:id', verifyToken, verifySeller);

// 6. Public/Dynamic Route (Sabse last mein rakhein)
router.get('/:id', verifyToken, getUser);

export default router;