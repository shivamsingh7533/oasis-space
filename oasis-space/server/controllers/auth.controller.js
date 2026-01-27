import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';
import nodemailer from 'nodemailer'; 

// 🔥 HTML EMAIL TEMPLATES (DESIGN)
const getWelcomeTemplate = (username) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
  <div style="background-color: #10b981; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to OasisSpace! 🌴</h1>
  </div>
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="color: #333;">Hello ${username},</h2>
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      We are thrilled to have you on board! Your account has been successfully verified.
    </p>
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      Start exploring the best properties or list your own space today. We are here to help you find your perfect oasis.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
    </div>
    <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
      If you did not create this account, please ignore this email.
    </p>
  </div>
</div>
`;

const getOtpTemplate = (otp) => `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #334155; padding: 20px; text-align: center;">
    <h2 style="color: #ffffff; margin: 0;">Password Reset Request</h2>
  </div>
  <div style="padding: 30px; background-color: #ffffff; text-align: center;">
    <p style="color: #555; font-size: 16px;">Use the code below to reset your password. This code expires in 15 minutes.</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
    </div>
    <p style="color: #999; font-size: 14px;">Do not share this code with anyone.</p>
  </div>
</div>
`;

const getSuccessTemplate = (username) => `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #d1fae5; background-color: #ecfdf5; border-radius: 8px;">
  <h2 style="color: #047857; text-align: center;">Password Changed Successfully</h2>
  <p style="color: #065f46; text-align: center;">Hello ${username}, your password has been updated. You can now login with your new credentials.</p>
</div>
`;

// 🔥 Helper Function: Updated for HTML Support
const sendEmail = async (to, subject, htmlContent) => {
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
      html: htmlContent, // Changed from text to html
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

    // 🔥 Send Signup OTP (Simple HTML)
    await sendEmail(
      cleanEmail,
      'Verify your Account - OasisSpace',
      `<h3>Your Verification OTP is: <span style="color:blue">${otp}</span></h3><p>It is valid for 10 minutes.</p>`
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

// ✅ 1.5 VERIFY EMAIL (UPDATED: Sends Welcome Email)
export const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const cleanEmail = email.trim();
    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) return next(errorHandler(404, 'User not found'));

    if (user.isVerified) {
      return res.status(200).json({ message: 'User is already verified' });
    }

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

    // 🚀 NEW: Send Welcome Email after successful verification
    sendEmail(
      user.email,
      'Welcome to OasisSpace! 🌴',
      getWelcomeTemplate(user.username)
    );

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

    if (validUser.isVerified === false) {
       return next(errorHandler(401, 'Please verify your email first!'));
    }

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = validUser._doc;

    // Login Alert
    sendEmail(
      validUser.email,
      'New Login Detected - OasisSpace',
      `<p>Hello ${validUser.username}, a new login was detected on your account.</p>`
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

// ✅ 3. GOOGLE AUTH (UPDATED: Sends Welcome Email to New Users)
export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    
    const sendResponse = (userData, statusCode, isNewUser = false) => {
      const token = jwt.sign({ id: userData._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = userData._doc;

      if (isNewUser) {
        // 🚀 NEW: Send Welcome Email for Google Signups
        sendEmail(
            userData.email,
            'Welcome to OasisSpace! 🌴',
            getWelcomeTemplate(userData.username)
        );
      } else {
        // Login Alert for existing users
        sendEmail(
            userData.email,
            'New Google Login - OasisSpace',
            `<p>Hello ${userData.username}, logged in via Google.</p>`
        );
      }
      
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
      sendResponse(user, 200, false); // Existing user
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
      sendResponse(newUser, 200, true); // New user
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

// --- 5. FORGOT PASSWORD (UPDATED: Sends OTP instead of Link) ---
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return next(errorHandler(404, 'User not found!'));

    // 🚀 Generate OTP instead of Token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 15 * 60 * 1000; // 15 mins

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // 🔥 Send OTP Email
    await sendEmail(
      user.email,
      'Reset Password OTP - OasisSpace',
      getOtpTemplate(otp)
    );

    res.status(200).json({ success: true, message: 'OTP sent to your email!' });

  } catch (error) {
    next(error);
  }
};

// --- 6. RESET PASSWORD (UPDATED: Verifies OTP) ---
export const resetPassword = async (req, res, next) => {
  // 🛑 Note: Frontend must now send { email, otp, password } in body
  // instead of using params for token
  const { email, otp, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return next(errorHandler(404, 'User not found'));

    if (!user.otp || user.otp.toString() !== otp.toString()) {
        return next(errorHandler(400, 'Invalid OTP'));
    }

    if (user.otpExpires < Date.now()) {
        return next(errorHandler(400, 'OTP Expired'));
    }

    // Hash New Password
    const hashedPassword = bcryptjs.hashSync(password, 10);
    
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // 🚀 NEW: Send Password Changed Confirmation
    sendEmail(
        user.email,
        'Password Changed Successfully',
        getSuccessTemplate(user.username)
    );

    res.status(200).json({ success: true, message: 'Password updated successfully! Please login.' });
  } catch (error) {
    next(error);
  }
};