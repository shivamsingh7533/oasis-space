import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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

// --- HELPER: CRYPTO OTP (cryptographically secure, unlike Math.random) ---
const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

// --- HELPER: COOKIE OPTIONS ---
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days — matches JWT lifetime, avoids daily surprise logouts
};
const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
};

const signSessionToken = (id) => {
  // Session tokens expire after 7 days — cookie matched to the same lifetime.
  // `purpose: 'session'` disambiguates from seller magic-link tokens (purpose: 'seller').
  const secret = (process.env.JWT_SECRET || '').trim();
  return jwt.sign({ id, purpose: 'session' }, secret, { expiresIn: '7d' });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- LOGIN BRUTE-FORCE GUARD (per-account, in-memory) ---
// 5 failed attempts inside a 15 min window lock the account for 15 min.
// Every failed attempt also pays a ~1s delay to slow automated guessing.
// In-memory is fine for a single instance; authLimiter still throttles per-IP.
const MAX_LOGIN_FAILS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const FAIL_DELAY_MS = 1000;
const loginGuard = new Map(); // normalized email -> { fails, lastFailAt, lockedUntil }

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const getLoginLock = (email) => {
  const rec = loginGuard.get(normalizeEmail(email));
  if (!rec) return null;
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) return rec;
  if (rec.lockedUntil) loginGuard.delete(normalizeEmail(email)); // lock expired
  return null;
};

const recordLoginFail = async (email) => {
  const key = normalizeEmail(email);
  const now = Date.now();
  const prev = loginGuard.get(key) || { fails: 0, lastFailAt: 0, lockedUntil: 0 };
  if (prev.lockedUntil > now) {
    await sleep(FAIL_DELAY_MS);
    return prev;
  }
  const fails = now - prev.lastFailAt > LOCK_WINDOW_MS ? 1 : prev.fails + 1;
  const rec = {
    fails,
    lastFailAt: now,
    lockedUntil: fails >= MAX_LOGIN_FAILS ? now + LOCKOUT_MS : 0,
  };
  loginGuard.set(key, rec);
  await sleep(FAIL_DELAY_MS);
  return rec;
};

const clearLoginFails = (email) => loginGuard.delete(normalizeEmail(email));

const toSafeUser = (doc) => {
  // otp / otpExpires / password are `select: false`, so this is always clean.
  return doc.toObject();
};

// --- CONTROLLER LOGIC ---

// ✅ 1. SIGN UP
export const signup = async (req, res, next) => {
  const { username, email, password, mobile } = req.body;
  if (!username || !email || !password || !mobile) return next(errorHandler(400, 'All fields are required'));

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanUsername.length < 3) return next(errorHandler(400, 'Username must be at least 3 characters'));
  if (password.length < 8) return next(errorHandler(400, 'Password must be at least 8 characters'));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return next(errorHandler(400, 'Please enter a valid email'));

  try {
    const hashedPassword = bcryptjs.hashSync(password, 10);
    const otp = generateOtp();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const newUser = new User({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      mobile: mobile.trim(),
      otp,
      otpExpires,
      isVerified: false
    });

    try {
      await newUser.save();
    } catch (err) {
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return next(errorHandler(409, `This ${field === 'email' ? 'email' : 'username'} is already registered`));
      }
      throw err;
    }
    await sendEmail(newUser.email, 'Verify Your Account 🔐', getOtpTemplate(otp));

    res.status(201).json({ success: true, message: "OTP sent! Please check your email." });
  } catch (error) {
    next(error);
  }
};

// ✅ 2. VERIFY EMAIL
export const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) return next(errorHandler(400, 'Email and OTP are required'));
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+otp +otpExpires');

    if (!user) return next(errorHandler(404, 'User not found'));
    if (!user.otp || user.otp !== otp) return next(errorHandler(400, 'Invalid OTP'));
    if (user.otpExpires && Date.now() > new Date(user.otpExpires).getTime()) {
      return next(errorHandler(400, 'OTP has expired. Please request a new one.'));
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    console.log(`⏳ Preparing to send PREMIUM Welcome Card to: ${user.email}`);
    try {
      await sendEmail(user.email, 'Welcome to the Family! 🌴', getWelcomeTemplate(user.username));
      console.log("✅ Premium Welcome Card SENT!");
    } catch (emailError) {
      console.error("❌ Email Failed but User Verified:", emailError);
    }

    const token = signSessionToken(user._id);

    res.cookie('access_token', token, cookieOptions).status(200).json(toSafeUser(user));
  } catch (error) {
    next(error);
  }
};

// ✅ 3. GOOGLE AUTH
export const google = async (req, res, next) => {
  const { name, email, photo } = req.body;
  if (!email) return next(errorHandler(400, 'Email is required'));
  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({ email: cleanEmail });

    if (user) {
      const token = signSessionToken(user._id);
      res.cookie('access_token', token, cookieOptions).status(200).json(toSafeUser(user));
    } else {
      const generatedPassword = crypto.randomBytes(12).toString('hex');
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);

      const newUser = new User({
        username: (name || 'user').toLowerCase().split(' ').join('') + crypto.randomBytes(2).toString('hex'),
        email: cleanEmail,
        password: hashedPassword,
        avatar: photo,
        isVerified: true
      });

      await newUser.save();

      console.log("⏳ Sending Google Welcome Email...");
      try {
        await sendEmail(newUser.email, 'Welcome to OasisSpace! 🌴', getWelcomeTemplate(newUser.username));
        console.log("✅ Google Welcome Email Sent Successfully!");
      } catch (err) {
        console.error("❌ Google Email Failed:", err);
      }

      const token = signSessionToken(newUser._id);
      res.cookie('access_token', token, cookieOptions).status(200).json(toSafeUser(newUser));
    }
  } catch (error) {
    next(error);
  }
};

// ✅ 4. SIGN IN
export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(errorHandler(400, 'Email and password are required'));

  // Per-account lockout — block before doing any work so the attack is cheap to stop.
  const lock = getLoginLock(email);
  if (lock) {
    const mins = Math.ceil((lock.lockedUntil - Date.now()) / 60000);
    return next(errorHandler(429, `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`));
  }

  try {
    const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');

    // Generic message (no account enumeration) + same delay as wrong-password.
    if (!user) {
      await recordLoginFail(email);
      return next(errorHandler(401, 'Invalid email or password'));
    }

    // Google-only account — keep the helpful hint, but still throttle probing.
    if (!user.password) {
      await recordLoginFail(email);
      return next(errorHandler(400, 'Please login with Google'));
    }

    if (!user.isVerified) {
      return next(errorHandler(403, 'Please verify your email first. Check your inbox for the OTP.'));
    }

    const validPassword = bcryptjs.compareSync(password, user.password);
    if (!validPassword) {
      const rec = await recordLoginFail(email);
      if (rec.lockedUntil > Date.now()) {
        const mins = Math.ceil((rec.lockedUntil - Date.now()) / 60000);
        return next(errorHandler(429, `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`));
      }
      return next(errorHandler(401, 'Invalid email or password'));
    }

    clearLoginFails(email);
    const token = signSessionToken(user._id);

    res.cookie('access_token', token, cookieOptions).status(200).json(toSafeUser(user));
  } catch (error) {
    next(error);
  }
};

// ✅ 5. FORGOT PASSWORD
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(errorHandler(400, 'Email is required'));
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return next(errorHandler(404, 'User not found'));

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;

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
  if (!email || !otp || !password) return next(errorHandler(400, 'Email, OTP and new password are required'));
  if (password.length < 8) return next(errorHandler(400, 'Password must be at least 8 characters'));

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+otp +otpExpires');
    if (!user || user.otp !== otp) return next(errorHandler(400, 'Invalid OTP'));
    if (user.otpExpires && Date.now() > new Date(user.otpExpires).getTime()) {
      return next(errorHandler(400, 'OTP has expired. Please request a new one.'));
    }

    user.password = bcryptjs.hashSync(password, 10);
    user.otp = undefined;
    user.otpExpires = undefined;
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