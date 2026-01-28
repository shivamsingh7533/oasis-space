import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';
import nodemailer from 'nodemailer';

// --- 📧 DYNAMIC EMAIL SENDER ---
const sendEmail = async (to, subject, htmlContent) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("❌ Missing Email Credentials in .env");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"OasisSpace Security" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email successfully sent to ${to}`);
  } catch (error) {
    console.log("❌ Nodemailer Error:", error.message);
  }
};

// --- 💎 ADMIN NOTIFICATION ---
const notifyAdmin = async (user, method) => {
  const adminEmail = process.env.EMAIL_USER;
  const profilePic = user.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
  const htmlCard = `
    <div style="background-color: #f3f4f6; padding: 20px; font-family: sans-serif; text-align: center;">
      <div style="max-width: 450px; margin: 0 auto; background: white; border-radius: 16px; padding: 20px;">
        <h2 style="color: #4f46e5;">New User: ${user.username}</h2>
        <p>Method: <b>${method}</b></p>
        <img src="${profilePic}" style="width: 80px; border-radius: 50%; border: 2px solid #ddd;">
      </div>
    </div>`;
  await sendEmail(adminEmail, `🔔 New Signup: ${user.username}`, htmlCard);
};

// --- 🎨 TEMPLATES ---
const getWelcomeTemplate = (username) => `
  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
    <h1 style="color: #10b981;">Welcome to OasisSpace, ${username}! 🌴</h1>
    <p>We're glad to have you with us. Your perfect oasis is just a click away.</p>
  </div>`;

const getOtpTemplate = (otp) => `
  <div style="font-family: sans-serif; text-align: center; border: 1px solid #ddd; padding: 20px;">
    <h2>Your Verification Code</h2>
    <h1 style="letter-spacing: 5px; color: #3b82f6;">${otp}</h1>
    <p>This code is valid for 10 minutes.</p>
  </div>`;

// ✅ 1. SIGN UP
export const signup = async (req, res, next) => {
  const { username, email, password, mobile } = req.body;
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
    await sendEmail(newUser.email, 'Verify Account', getOtpTemplate(otp));
    await notifyAdmin(newUser, 'Manual Signup');
    
    res.status(201).json({ success: true, message: "OTP sent to your email!" });
  } catch (error) { 
    console.log("Signup Error:", error); 
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
    
    await sendEmail(user.email, 'Welcome!', getWelcomeTemplate(user.username));
    res.status(200).json({ success: true, message: 'Verified!' });
  } catch (error) { 
    console.log("Verification Error:", error); 
    next(error); 
  }
};

// ✅ 3. SIGN IN
export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return next(errorHandler(404, 'User not found'));
    
    const validPassword = bcryptjs.compareSync(password, user.password);
    if (!validPassword) return next(errorHandler(401, 'Wrong credentials'));
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = user._doc;
    res.cookie('access_token', token, { httpOnly: true }).status(200).json(rest);
  } catch (error) { 
    console.log("Signin Error:", error); 
    next(error); 
  }
};

// ✅ 4. GOOGLE AUTH (FIXED: Added Mobile Field)
export const google = async (req, res, next) => {
  const { name, email, photo } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = user._doc;
      
      // Welcome back email
      await sendEmail(user.email, 'Welcome Back to OasisSpace! 🌴', getWelcomeTemplate(user.username));
      
      res.cookie('access_token', token, { httpOnly: true }).status(200).json(rest);
    } else {
      const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      
      const newUser = new User({ 
        username: name.toLowerCase().split(' ').join('') + Math.random().toString(36).slice(-4), 
        email, 
        password: hashedPassword, 
        avatar: photo, 
        // 👇👇 IMPORTANT FIX: Dummy mobile added to satisfy 'required: true'
        mobile: "0000000000", 
        isVerified: true 
      });
      
      await newUser.save();
      await sendEmail(newUser.email, 'Welcome to OasisSpace! 🌴', getWelcomeTemplate(newUser.username));
      await notifyAdmin(newUser, 'Google OAuth');
      
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
      const { password: p, ...rest2 } = newUser._doc;
      res.cookie('access_token', token, { httpOnly: true }).status(200).json(rest2);
    }
  } catch (error) { 
    console.log("Google Auth Error:", error); 
    next(error); 
  }
};

// ✅ 5. FORGOT PASSWORD
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return next(errorHandler(404, 'User not found'));
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;
    
    await user.save();
    await sendEmail(user.email, 'Reset Password OTP', getOtpTemplate(otp));
    res.status(200).json({ success: true, message: 'OTP sent!' });
  } catch (error) { 
    console.log("Forgot Pass Error:", error); 
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
    res.status(200).json({ success: true, message: 'Password reset!' });
  } catch (error) { 
    console.log("Reset Pass Error:", error); 
    next(error); 
  }
};

// ✅ 7. SIGN OUT
export const signout = async (req, res, next) => {
  try {
    res.clearCookie('access_token').status(200).json('Signed out!');
  } catch (error) {
    console.log("Signout Error:", error);
    next(error);
  }
};