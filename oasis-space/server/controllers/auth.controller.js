import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';
import nodemailer from 'nodemailer'; 

// 🔥 Helper Function: Email bhejne ke liye
const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
      },
    });

    const mailOptions = {
      from: `"OasisSpace Security" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.log("❌ Email sending failed:", error.message);
  }
};

// ✅ 1. SIGN UP (Sends OTP)
export const signup = async (req, res, next) => {
  const { username, email, password, mobile } = req.body;

  if (!username || !email || !password || !mobile || username === '' || email === '' || password === '' || mobile === '') {
    return next(errorHandler(400, 'All fields are required'));
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  if (cleanPassword.length < 8) return next(errorHandler(400, 'Password must be at least 8 characters long'));
  if (!/[A-Z]/.test(cleanPassword)) return next(errorHandler(400, 'Password must contain at least one uppercase letter'));
  if (!/[0-9]/.test(cleanPassword)) return next(errorHandler(400, 'Password must contain at least one number'));
  if (!/[!@#$%^&*]/.test(cleanPassword)) return next(errorHandler(400, 'Password must contain at least one special character'));
  if (!/^\d+$/.test(mobile)) return next(errorHandler(400, 'Mobile number must contain only digits'));

  try {
    const hashedPassword = bcryptjs.hashSync(cleanPassword, 10);
    
    // 🔥 Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 Minutes expiry

    // 🛑 DEBUG: OTP ko Terminal me print karo (Taaki test kar sako bina email ke)
    console.log(`🔒 GENERATED OTP for ${cleanEmail}: ${otp}`);

    const newUser = new User({ 
      username: cleanUsername, 
      email: cleanEmail, 
      password: hashedPassword, 
      mobile,
      otp,           
      otpExpires,    
      isVerified: false 
    });
    
    await newUser.save();

    // 🔥 Send OTP Email
    await sendEmail(
      cleanEmail,
      'Verify your Account - OasisSpace',
      `Your Verification OTP is: ${otp}. It is valid for 10 minutes.`
    );

    res.status(201).json({ success: true, message: "User created! Please verify your OTP sent to email." });

  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.mobile) return next(errorHandler(400, 'Mobile number already in use'));
      if (error.keyPattern.email) return next(errorHandler(400, 'Email already in use'));
      if (error.keyPattern.username) return next(errorHandler(400, 'Username already taken'));
    }
    next(error);
  }
};

// ✅ 1.5 VERIFY EMAIL (UPDATED FIX)
export const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    // FIX 1: Email ko trim karke search karo
    const cleanEmail = email.trim();
    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) return next(errorHandler(404, 'User not found'));

    if (user.isVerified) {
      return res.status(200).json({ message: 'User is already verified' });
    }

    // FIX 2: OTP Comparison Logic (String conversion zaroori hai)
    // Database me OTP number ho sakta hai, aur req.body me string.
    if (user.otp.toString() !== otp.toString()) {
      return next(errorHandler(400, 'Invalid OTP'));
    }

    if (user.otpExpires < Date.now()) {
      return next(errorHandler(400, 'OTP has expired. Please request a new one.'));
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully! You can now login.' });

  } catch (error) {
    next(error);
  }
};

// ✅ 2. SIGN IN
export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password || email === '' || password === '') {
    return next(errorHandler(400, 'All fields are required'));
  }

  try {
    const cleanEmail = email.trim();
    const validUser = await User.findOne({ email: cleanEmail });
    if (!validUser) return next(errorHandler(404, 'User not found!'));

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, 'Wrong credentials!'));

    // Check if verified
    if (validUser.isVerified === false) {
       return next(errorHandler(401, 'Please verify your email first!'));
    }

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = validUser._doc;

    // 🔥 Send Login Alert
    sendEmail(
      validUser.email,
      'New Login Detected - OasisSpace',
      `Hello ${validUser.username},\n\nA new login was detected on your account just now.\n\nIf this was you, ignore this email.`
    );

    res
      .cookie('access_token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 
      })
      .status(200)
      .json(rest);

  } catch (error) {
    next(error);
  }
};

// ✅ 3. GOOGLE AUTH
export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    
    const sendResponse = (userData, statusCode) => {
      const token = jwt.sign({ id: userData._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = userData._doc;

      // 🔥 Send Google Login Alert
      sendEmail(
        userData.email,
        'New Google Login - OasisSpace',
        `Hello ${userData.username},\n\nYou successfully logged in via Google.\n\nTime: ${new Date().toLocaleString()}`
      );
      
      res
        .cookie('access_token', token, { 
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 24 * 60 * 60 * 1000 
        })
        .status(statusCode)
        .json(rest);
    };

    if (user) {
      sendResponse(user, 200);
    } else {
      const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      const newUser = new User({
        username: req.body.name.split(' ').join('').toLowerCase() + Math.random().toString(36).slice(-4),
        email: req.body.email,
        password: hashedPassword,
        avatar: req.body.photo,
        mobile: '0000000000', 
        isVerified: true 
      });
      await newUser.save();
      sendResponse(newUser, 200);
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

    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientURL}/reset-password/${user._id}/${token}`;

    // 🔥 Send Forgot Password Email
    await sendEmail(
      user.email,
      'Reset your Password - OasisSpace',
      `Click the link to reset your password: ${resetLink}`
    );

    res.status(200).json({ message: 'Email sent successfully!' });

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