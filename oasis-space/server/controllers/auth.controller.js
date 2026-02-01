import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';
import sendEmail from '../utils/sendEmail.js';

// --- 💎 1. PREMIUM EMAIL TEMPLATES (HTML/CSS) ---

const getWelcomeTemplate = (username) => `
<!DOCTYPE html>
<html>
<head>
  <style> .button:hover { background-color: #047857 !important; } </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 32px; letter-spacing: 1px;">Welcome to OasisSpace! 🌴</h1>
      <p style="margin: 10px 0 0; color: #d1fae5; font-size: 16px;">Your journey to a dream home begins here.</p>
    </div>
    <div style="padding: 40px 30px; text-align: center;">
      <h2 style="color: #1f2937; margin-top: 0;">Hello, ${username}! 👋</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        We are absolutely thrilled to have you on board. At OasisSpace, we don't just sell properties; we help you find your sanctuary.
      </p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: left;">
        <p style="margin: 5px 0; color: #166534;">✅ <b>Explore:</b> Browse thousands of exclusive listings.</p>
        <p style="margin: 5px 0; color: #166534;">✅ <b>Connect:</b> Chat directly with top-rated sellers.</p>
        <p style="margin: 5px 0; color: #166534;">✅ <b>List:</b> Sell your property with ease.</p>
      </div>
      <a href="${process.env.CLIENT_URL || 'https://oasis-space.vercel.app'}" 
         style="display: inline-block; background-color: #10b981; color: white; padding: 16px 32px; font-size: 18px; font-weight: bold; text-decoration: none; border-radius: 50px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); transition: background 0.3s;">
          Start Exploring Now 🚀
      </a>
      <p style="margin-top: 30px; font-size: 14px; color: #9ca3af;">(If the button doesn't work, verify via your profile settings)</p>
    </div>
    <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">&copy; 2026 OasisSpace Inc. All rights reserved.</p>
      <p style="margin: 5px 0;">Made with ❤️ for your dream home.</p>
    </div>
  </div>
</body>
</html>
`;

const getOtpTemplate = (otp) => `
  <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px; text-align: center;">
    <h2 style="color: #374151;">Verify Your Email 🔐</h2>
    <p style="color: #6b7280; font-size: 16px;">Use the code below to complete your sign up.</p>
    <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <span style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">${otp}</span>
    </div>
    <p style="color: #9ca3af; font-size: 12px;">This code expires in 10 minutes.</p>
  </div>
`;

// --- HELPER: COOKIE OPTIONS ---
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
  maxAge: 24 * 60 * 60 * 1000 // 1 Day
};
const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
};

// --- CONTROLLER LOGIC ---

// ✅ 1. SIGN UP
export const signup = async (req, res, next) => {
  const { username, email, password, mobile } = req.body;
  // Manual check zaroori hai kyunki model se required hata diya hai
  if (!username || !email || !password || !mobile) return next(errorHandler(400, 'All fields are required'));

  try {
    const hashedPassword = bcryptjs.hashSync(password.trim(), 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      mobile: mobile.trim(),
      otp,
      otpExpires,
      isVerified: false
    });

    await newUser.save();
    await sendEmail(newUser.email, 'Verify Your Account 🔐', getOtpTemplate(otp));

    res.status(201).json({ success: true, message: "OTP sent! Please check your email." });
  } catch (error) {
    next(error);
  }
};

// ✅ 2. VERIFY EMAIL
export const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) return next(errorHandler(404, 'User not found'));
    if (user.otp !== otp) return next(errorHandler(400, 'Invalid OTP'));

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    console.log(`⏳ Preparing to send PREMIUM Welcome Card to: ${user.email}`);
    try {
      await sendEmail(user.email, 'Welcome to the Family! 🌴', getWelcomeTemplate(user.username));
      console.log("✅ Premium Welcome Card SENT!");
    } catch (emailError) {
      console.error("❌ Email Failed but User Verified:", emailError);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = user._doc;

    res.cookie('access_token', token, cookieOptions).status(200).json(rest);

  } catch (error) {
    next(error);
  }
};

// ✅ 3. GOOGLE AUTH
export const google = async (req, res, next) => {
  const { name, email, photo } = req.body;
  console.log("🔹 Google Auth Request:", { name, email }); // DEBUG LOG

  try {
    const user = await User.findOne({ email });
    console.log("🔹 User found in DB:", user ? "Yes" : "No"); // DEBUG LOG

    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = user._doc;
      res.cookie('access_token', token, cookieOptions).status(200).json(rest);
    } else {
      const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);

      // Make username more unique with timestamp
      const uniqueUsername = name.toLowerCase().split(' ').join('') + Date.now().toString(36).slice(-4);
      console.log("🔹 Creating new user with username:", uniqueUsername); // DEBUG LOG

      const newUser = new User({
        username: uniqueUsername,
        email,
        password: hashedPassword,
        avatar: photo,
        mobile: "0000000000",
        isVerified: true
      });

      await newUser.save();
      console.log("✅ New Google user saved to DB"); // DEBUG LOG

      console.log("⏳ Sending Google Welcome Email...");
      try {
        await sendEmail(newUser.email, 'Welcome to OasisSpace! 🌴', getWelcomeTemplate(newUser.username));
        console.log("✅ Google Welcome Email Sent Successfully!");
      } catch (err) {
        console.error("❌ Google Email Failed:", err);
      }

      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
      const { password: p, ...rest2 } = newUser._doc;
      res.cookie('access_token', token, cookieOptions).status(200).json(rest2);
    }
  } catch (error) {
    console.error("❌ GOOGLE AUTH ERROR:", error.message); // DEBUG ERROR LOG
    console.error("❌ Full Error:", error); // FULL ERROR
    next(error);
  }
};

// ✅ 4. SIGN IN
export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return next(errorHandler(404, 'User not found'));

    // Google users might not have a password set initially
    if (!user.password) return next(errorHandler(400, 'Please login with Google'));

    const validPassword = bcryptjs.compareSync(password, user.password);
    if (!validPassword) return next(errorHandler(401, 'Wrong credentials'));

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = user._doc;

    res.cookie('access_token', token, cookieOptions).status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

// ✅ 5. FORGOT PASSWORD (Fix applied here indirectly via Model)
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return next(errorHandler(404, 'User not found'));

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;

    // Ab ye line crash nahi karegi kyunki Model me password required: false hai
    await user.save();

    await sendEmail(user.email, 'Reset Password OTP', getOtpTemplate(otp));

    res.status(200).json({ success: true, message: 'OTP sent to your email!' });
  } catch (error) {
    next(error);
  }
};

// ✅ 6. RESET PASSWORD
export const resetPassword = async (req, res, next) => {
  const { email, otp, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp) return next(errorHandler(400, 'Invalid OTP'));

    user.password = bcryptjs.hashSync(password, 10);
    user.otp = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful!' });
  } catch (error) {
    next(error);
  }
};

// ✅ 7. SIGN OUT
export const signout = async (req, res, next) => {
  try {
    res.clearCookie('access_token', clearCookieOptions).status(200).json('Signed out!');
  } catch (error) {
    next(error);
  }
};