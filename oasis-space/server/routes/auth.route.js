import express from 'express';
// 1. Import 'signout' here
import { signup, signin, signout } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
// 2. Add the route here (Using GET, not POST)
router.get('/signout', signout);

export default router;