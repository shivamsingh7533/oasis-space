import express from 'express';
import { 
  createListing, 
  deleteListing, 
  updateListing, 
  getListing, 
  getListings,
  getAdminListings, 
  featureListing,
  updateListingStatus,
  generateDescription // ✅ AI wala naya import
} from '../controllers/listing.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// 1. Dashboard & Creation Routes
router.post('/create', verifyToken, createListing);
router.get('/admin-listings', verifyToken, getAdminListings); 

// 2. Feature Route (Star Button)
router.post('/feature/:id', verifyToken, featureListing);

// 3. Status Update Route (Mark Sold/Rented)
router.post('/status/:id', verifyToken, updateListingStatus);

// 4. 🔥 AI Generate Route (NEW FEATURE)
router.post('/generate-ai', verifyToken, generateDescription);

// 5. Public Search Route
router.get('/get', getListings); 

// 6. ID Based Routes (Inhe hamesha last mein rakhna)
router.delete('/delete/:id', verifyToken, deleteListing);
router.post('/update/:id', verifyToken, updateListing);
router.get('/get/:id', getListing); 

export default router;