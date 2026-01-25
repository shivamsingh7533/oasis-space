import express from 'express';
import { 
  createListing, 
  deleteListing, 
  updateListing, 
  getListing, 
  getListings,
  getAdminListings, // ✅ Dashboard ke liye zaroori
  featureListing    // ✅ Star button ke liye zaroori
} from '../controllers/listing.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// 1. Dashboard & Creation Routes
router.post('/create', verifyToken, createListing);
router.get('/admin-listings', verifyToken, getAdminListings); 

// 2. Feature Route (Star Button)
router.post('/feature/:id', verifyToken, featureListing);

// 3. Public Search Route
router.get('/get', getListings); 

// 4. ID Based Routes (Inhe last mein rakhna zaroori hai)
router.delete('/delete/:id', verifyToken, deleteListing);
router.post('/update/:id', verifyToken, updateListing);
router.get('/get/:id', getListing); 

export default router;