import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

// --- 1. EXISTING: LOGIN CHECK ---
export const verifyToken = (req, res, next) => {
  // Check if the cookie exists
  const token = req.cookies.access_token;

  if (!token) return next(errorHandler(401, 'Unauthorized'));

  // Verify the token is valid
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(errorHandler(403, 'Forbidden'));

    req.user = user; // Save user info to request
    next(); // Move to the next step
  });
};

// --- 2. NEW: ADMIN CHECK ---
export const verifyAdmin = (req, res, next) => {
    // verifyToken पहले चलेगा, इसलिए req.user में डेटा आ चुका होगा
    if (req.user && req.user.role === 'admin') {
        next(); // अगर Admin है, तो जाने दो
    } else {
        // अगर User या Seller है, तो रोक दो
        return next(errorHandler(403, 'Access Denied! Admin privileges required.'));
    }
};