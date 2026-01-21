import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js'; // Error handler utility import karein

// --- SIGN UP CONTROLLER (Updated with Validations) ---
export const signup = async (req, res, next) => {
  const { username, email, password, mobile } = req.body;

  // 1. CHECK: All fields present
  if (!username || !email || !password || !mobile || username === '' || email === '' || password === '' || mobile === '') {
    return next(errorHandler(400, 'All fields are required'));
  }

  // 2. CHECK: Password Strength
  if (password.length < 8) {
    return next(errorHandler(400, 'Password must be at least 8 characters long'));
  }
  if (!/[A-Z]/.test(password)) {
    return next(errorHandler(400, 'Password must contain at least one uppercase letter'));
  }
  if (!/[0-9]/.test(password)) {
    return next(errorHandler(400, 'Password must contain at least one number'));
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return next(errorHandler(400, 'Password must contain at least one special character'));
  }

  // 3. CHECK: Mobile Number Validity (International Format)
  // Ensure only digits are present
  if (!/^\d+$/.test(mobile)) {
    return next(errorHandler(400, 'Mobile number must contain only digits'));
  }
  // Length check (Standard E.164 says max 15, usually min 8 for country code + number)
  if (mobile.length < 8 || mobile.length > 15) {
    return next(errorHandler(400, 'Invalid mobile number length (8-15 digits required)'));
  }

  try {
    // 4. Hash Password
    const hashedPassword = bcryptjs.hashSync(password, 10);

    // 5. Create New User
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      mobile // Saving the mobile number
    });

    await newUser.save();
    res.status(201).json({ success: true, message: "User created successfully!" });

  } catch (error) {
    // 6. Handle Duplicate Data Errors (MongoDB Error Code 11000)
    if (error.code === 11000) {
      if (error.keyPattern.mobile) {
        return next(errorHandler(400, 'Mobile number already in use'));
      }
      if (error.keyPattern.email) {
        return next(errorHandler(400, 'Email already in use'));
      }
      if (error.keyPattern.username) {
        return next(errorHandler(400, 'Username already taken'));
      }
    }
    next(error);
  }
};

// --- SIGN IN CONTROLLER ---
export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password || email === '' || password === '') {
    return next(errorHandler(400, 'All fields are required'));
  }

  try {
    // 1. Check User
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, 'User not found!'));

    // 2. Check Password
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, 'Wrong credentials!'));

    // 3. Create Token
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);

    // 4. Remove Password from Response
    // Note: validUser._doc contains 'mobile' too, so it will be sent to frontend automatically
    const { password: pass, ...rest } = validUser._doc;

    // 5. Send Cookie + User Data
    res
      .cookie('access_token', token, { httpOnly: true })
      .status(200)
      .json(rest);

  } catch (error) {
    next(error);
  }
};

// --- SIGN OUT CONTROLLER ---
export const signout = async (req, res, next) => {
  try {
    res.clearCookie('access_token');
    res.status(200).json('User has been signed out!');
  } catch (error) {
    next(error);
  }
};