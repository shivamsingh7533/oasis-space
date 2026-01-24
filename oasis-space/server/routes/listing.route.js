import express from 'express';
import { 
  createListing, 
  deleteListing, 
  updateListing, 
  getListing, 
  getListings,
  getAdminListings,     
  generateDescription,
  featureListing       // <--- ✅ Import check (Star Button ke liye)
} from '../controllers/listing.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// 1. Fixed Routes (Specific routes sabse upar)
router.post('/create', verifyToken, createListing);
router.get('/admin-listings', verifyToken, getAdminListings); // Dashboard data
router.post('/generate-ai', verifyToken, generateDescription); // AI Description

// 2. FEATURE ROUTE (STAR BUTTON) ⭐ <--- ✅ Route added here
router.post('/feature/:id', verifyToken, featureListing);

// 3. Search Route (Isse '/:id' wale se PEHLE rakhna zaroori hai)
router.get('/get', getListings); 

// 4. ID Based Routes (Inhe sabse neeche rakhein)
router.delete('/delete/:id', verifyToken, deleteListing);
router.post('/update/:id', verifyToken, updateListing);
router.get('/get/:id', getListing); // Single Listing (Last mein)

export default router;