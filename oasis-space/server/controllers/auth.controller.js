import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';
import nodemailer from 'nodemailer'; 

// --- 1. SIGN UP ---
export const signup = async (req, res, next) => {
  const { username, email, password, mobile } = req.body;

  if (!username || !email || !password || !mobile || username === '' || email === '' || password === '' || mobile === '') {
    return next(errorHandler(400, 'All fields are required'));
  }

  // ✅ FIX 1: Trim inputs to remove accidental spaces
  const cleanUsername = username.trim();
  const cleanEmail = email.trim();
  const cleanPassword = password.trim(); // Password se bhi space hatao

  if (cleanPassword.length < 8) return next(errorHandler(400, 'Password must be at least 8 characters long'));
  if (!/[A-Z]/.test(cleanPassword)) return next(errorHandler(400, 'Password must contain at least one uppercase letter'));
  if (!/[0-9]/.test(cleanPassword)) return next(errorHandler(400, 'Password must contain at least one number'));
  if (!/[!@#$%^&*]/.test(cleanPassword)) return next(errorHandler(400, 'Password must contain at least one special character'));

  if (!/^\d+$/.test(mobile)) return next(errorHandler(400, 'Mobile number must contain only digits'));
  if (mobile.length < 8 || mobile.length > 15) return next(errorHandler(400, 'Invalid mobile number length'));

  try {
    const hashedPassword = bcryptjs.hashSync(cleanPassword, 10);
    
    const newUser = new User({ 
      username: cleanUsername, 
      email: cleanEmail, 
      password: hashedPassword, 
      mobile 
    });
    
    await newUser.save();
    res.status(201).json({ success: true, message: "User created successfully!" });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.mobile) return next(errorHandler(400, 'Mobile number already in use'));
      if (error.keyPattern.email) return next(errorHandler(400, 'Email already in use'));
      if (error.keyPattern.username) return next(errorHandler(400, 'Username already taken'));
    }
    next(error);
  }
};

// --- 2. SIGN IN (Debugging Added) ---
export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password || email === '' || password === '') {
    return next(errorHandler(400, 'All fields are required'));
  }

  try {
    // ✅ FIX 2: Email ko trim karo taaki space ki wajah se fail na ho
    const cleanEmail = email.trim();
    
    // 🔍 DEBUGGING LOGS (Terminal check karein)
    console.log("---- LOGIN ATTEMPT ----");
    console.log("Input Email:", cleanEmail);
    console.log("Input Password:", password);

    const validUser = await User.findOne({ email: cleanEmail });
    
    if (!validUser) {
      console.log("❌ User not found in DB");
      return next(errorHandler(404, 'User not found!'));
    }

    console.log("✅ User Found:", validUser.username);
    console.log("DB Hashed Password:", validUser.password);

    // ✅ FIX 3: Compare Sync
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    
    if (!validPassword) {
      console.log("❌ Password Mismatch! (Hash compare failed)");
      return next(errorHandler(401, 'Wrong credentials!'));
    }

    console.log("✅ Password Matched!");

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = validUser._doc;

    res
      .cookie('access_token', token, { httpOnly: true })
      .status(200)
      .json(rest);
      
  } catch (error) {
    console.log("Error in signin:", error);
    next(error);
  }
};

// --- 3. GOOGLE AUTH ---
export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = user._doc;
      res.cookie('access_token', token, { httpOnly: true }).status(200).json(rest);
    } else {
      const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      const newUser = new User({
        username: req.body.name.split(' ').join('').toLowerCase() + Math.random().toString(36).slice(-4),
        email: req.body.email,
        password: hashedPassword,
        avatar: req.body.photo,
        mobile: '0000000000', 
      });
      await newUser.save();
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = newUser._doc;
      res.cookie('access_token', token, { httpOnly: true }).status(200).json(rest);
    }
  } catch (error) {
    next(error);
  }
};

// --- 4. SIGN OUT ---
export const signout = async (req, res, next) => {
  try {
    res.clearCookie('access_token');
    res.status(200).json('User has been signed out!');
  } catch (error) {
    next(error);
  }
};

// --- 5. FORGOT PASSWORD ---
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return next(errorHandler(404, 'User not found!'));

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientURL}/reset-password/${user._id}/${token}`;

    const mailOptions = {
      from: 'OasisSpace Support',
      to: user.email,
      subject: 'Reset your Password - OasisSpace',
      text: `Click the link to reset your password: ${resetLink}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return next(errorHandler(500, 'Email sending failed'));
      } else {
        return res.status(200).json({ message: 'Email sent successfully!' });
      }
    });

  } catch (error) {
    next(error);
  }
};

// --- 6. RESET PASSWORD ---
export const resetPassword = async (req, res, next) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) return next(errorHandler(403, 'Link Expired or Invalid'));
      
      const hashedPassword = bcryptjs.hashSync(password, 10);
      
      await User.findByIdAndUpdate(id, { password: hashedPassword });
      res.status(200).json({ message: 'Password updated successfully!' });
    });
  } catch (error) {
    next(error);
  }
};