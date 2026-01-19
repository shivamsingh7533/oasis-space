import express from 'express';
import { 
  deleteUser, 
  test, 
  updateUser, 
  getUserListings, 
  getUser,
  saveListing,       // <--- Added comma here
  getSavedListings   // <--- Added this new function
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/test', test);
router.post('/update/:id', verifyToken, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);
router.get('/listings/:id', verifyToken, getUserListings);
router.get('/:id', verifyToken, getUser);
router.post('/save/:id', verifyToken, saveListing);
// --- NEW ROUTE for getting saved listings ---
router.get('/saved/:id', verifyToken, getSavedListings); 

export default router;