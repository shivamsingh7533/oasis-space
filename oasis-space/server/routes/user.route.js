import express from 'express';
import { 
  test, 
  updateUser, 
  deleteUser, 
  getUserListings, 
  getUser,
  saveListing,       // <-- 1. Import Naya Function
  getSavedListings   // <-- 2. Import Naya Function
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Purane Routes
router.get('/test', test);
router.post('/update/:id', verifyToken, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);
router.get('/listings/:id', verifyToken, getUserListings);
router.get('/:id', verifyToken, getUser);

// --- NEW ROUTES FOR SAVED LISTINGS ---

// 3. Route to Save or Unsave a listing (POST method kyunki hum database modify kar rahe hain)
router.post('/save/:id', verifyToken, saveListing);

// 4. Route to Get all Saved listings (GET method)
router.get('/saved/:id', verifyToken, getSavedListings);

export default router;