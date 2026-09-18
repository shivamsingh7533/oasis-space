import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

export const verifyToken = (req, res, next) => {
  try {
    // Crash prevention: Check if cookies object exists
    if (!req.cookies) {
      console.log("No cookies found! Is cookie-parser installed?");
      return next(errorHandler(500, 'Internal Server Error: Cookie Parser missing'));
    }

    const token = req.cookies.access_token;

    if (!token) {
      // ✅ NEW: Instead of 401, redirect to login so the user can re-authenticate
      return res.status(401).json({ success: false, message: 'Unauthorized — please log in again.' });
    }

    if (!process.env.JWT_SECRET) {
      console.log("JWT_SECRET missing in .env file!");
      return next(errorHandler(500, 'Server Config Error'));
    }

    jwt.verify(token, process.env.JWT_SECRET.trim(), (err, user) => {
      if (err) {
        // ✅ NEW: Token expired/invalid → redirect to login rather than bare 403
        return res.status(401).json({ success: false, message: 'Session expired — please log in again.' });
      }
      if (!user || !user.id) return next(errorHandler(403, 'Forbidden: Invalid Token'));

      // Session tokens only — reject seller magic-link tokens (`purpose: 'seller'`)
      // from being used as authenticated API sessions.
      if (user.purpose && user.purpose !== 'session') {
        return next(errorHandler(403, 'Forbidden: Invalid Token'));
      }

      req.user = user;
      next();
    });
  } catch (error) {
      console.log("Auth Middleware Error:", error);
      next(error);
  }
};