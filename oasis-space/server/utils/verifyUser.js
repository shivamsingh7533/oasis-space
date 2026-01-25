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
        return next(errorHandler(401, 'Unauthorized: No Token Found'));
    }

    if (!process.env.JWT_SECRET) {
        console.log("JWT_SECRET missing in .env file!");
        return next(errorHandler(500, 'Server Config Error'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return next(errorHandler(403, 'Forbidden: Invalid Token'));

      req.user = user;
      next();
    });
  } catch (error) {
      console.log("Auth Middleware Error:", error);
      next(error);
  }
};