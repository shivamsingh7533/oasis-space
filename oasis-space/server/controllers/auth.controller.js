import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';
import nodemailer from 'nodemailer'; 

// 🔥 EMAIL SENDER CONFIGURATION
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Company Email
    pass: process.env.EMAIL_PASS, 
  },
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"OasisSpace Security" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent, 
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.log("❌ Email sending failed:", error.message);
  }
};

// 💎 ADMIN NOTIFICATION CARD (Styled HTML)
const notifyAdmin = async (user, method) => {
    const adminEmail = process.env.EMAIL_USER; // Admin receives notification
    const profilePic = user.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
    
    const htmlCard = `
    <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 450px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 20px;">🚀 New User Registered</h2>
          <span style="background: rgba(255,255,255,0.2); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 8px; display: inline-block;">${method}</span>
        </div>

        <div style="text-align: center; margin-top: -35px;">
           <img src="${profilePic}" alt="Profile" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); object-fit: cover;">
        </div>

        <div style="padding: 24px;">
           <h3 style="text-align: center; color: #1f2937; margin: 0 0 5px 0;">${user.username}</h3>
           <p style="text-align: center; color: #6b7280; font-size: 14px; margin: 0 0 20px 0;">${user.email}</p>

           <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
             <tr style="border-bottom: 1px solid #e5e7eb;">
               <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Mobile</td>
               <td style="padding: 12px 0; color: #111827; font-weight: 600; text-align: right;">${user.mobile || 'N/A'}</td>
             </tr>
             <tr style="border-bottom: 1px solid #e5e7eb;">
               <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Role</td>
               <td style="padding: 12px 0; color: #111827; font-weight: 600; text-align: right; text-transform: capitalize;">${user.role || 'User'}</td>
             </tr>
             <tr style="border-bottom: 1px solid #e5e7eb;">
               <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Status</td>
               <td style="padding: 12px 0; color: #10b981; font-weight: 600; text-align: right;">Active</td>
             </tr>
              <tr>
               <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Date</td>
               <td style="padding: 12px 0; color: #111827; font-weight: 600; text-align: right;">${new Date().toLocaleDateString()}</td>
             </tr>
           </table>

           <div style="text-align: center; margin-top: 25px;">
             <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: block; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">Open Admin Dashboard</a>
           </div>
        </div>

      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">OasisSpace Automated System</p>
    </div>
    `;

    await sendEmail(adminEmail, `🔔 New Signup: ${user.username}`, htmlCard);
};

// 🎨 USER EMAIL TEMPLATES
const getWelcomeTemplate = (username) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
  <div style="background-color: #10b981; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to OasisSpace! 🌴</h1>
  </div>
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333;">Hello ${username},</h2>
    <p style="color: #666;">We are thrilled to have you on board! Your account is ready.</p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
    </div>
  </div>
</div>
`;

const getOtpTemplate = (otp) => `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
  <div style="background-color: #334155; padding: 20px; text-align: center;">
    <h2 style="color: #ffffff; margin: 0;">Verification Code</h2>
  </div>
  <div style="padding: 30px; background-color: #ffffff; text-align: center;">
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
    </div>
    <p style="color: #999; font-size: 14px;">Valid for 10 minutes.</p>
  </div>
</div>
`;

const getSuccessTemplate = (username) => `
<div style="padding: 20px; border: 1px solid #d1fae5; background-color: #ecfdf5; border-radius: 8px;">
  <h2 style="color: #047857; text-align: center;">Password Updated</h2>
  <p style="text-align: center;">Hello ${username}, you can now login with your new password.</p>
</div>
`;


// ✅ 1. SIGN UP (Sends OTP + Notifies Admin)
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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; 

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

    // 📧 User OTP
    await sendEmail(
      cleanEmail,
      'Verify your Account - OasisSpace',
      getOtpTemplate(otp)
    );

    // 🔔 ADMIN NOTIFICATION
    await notifyAdmin(newUser, 'Manual Signup');

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

// ✅ 1.5 VERIFY EMAIL
export const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const cleanEmail = email.trim();
    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) return next(errorHandler(404, 'User not found'));
    if (user.isVerified) return res.status(200).json({ message: 'User is already verified' });
    if (user.otp.toString() !== otp.toString()) return next(errorHandler(400, 'Invalid OTP'));
    if (user.otpExpires < Date.now()) return next(errorHandler(400, 'OTP has expired.'));

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // 🚀 Welcome Email sent AFTER verification (Manual Signup)
    await sendEmail(user.email, 'Welcome to OasisSpace! 🌴', getWelcomeTemplate(user.username));

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

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = validUser._doc;

    // Login Alert to User
    sendEmail(validUser.email, 'New Login Detected', `<p>Hello ${validUser.username}, new login detected.</p>`);

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

// ✅ 3. GOOGLE AUTH (Updated Logic for Welcome Email)
export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    
    const sendResponse = async (userData, statusCode, isNewUser = false) => {
      const token = jwt.sign({ id: userData._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = userData._doc;

      if (isNewUser) {
        // 🚀 Welcome Email for Google Users (Immediate)
        await sendEmail(userData.email, 'Welcome to OasisSpace! 🌴', getWelcomeTemplate(userData.username));
        // 🔔 Admin Notification
        await notifyAdmin(userData, 'Google OAuth');
      } else {
        await sendEmail(userData.email, 'New Google Login', `<p>Hello ${userData.username}, logged in via Google.</p>`);
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
      await sendResponse(user, 200, false); 
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
      await sendResponse(newUser, 200, true); // true = isNewUser
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 15 * 60 * 1000; 

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail(user.email, 'Reset Password OTP', getOtpTemplate(otp));

    res.status(200).json({ success: true, message: 'OTP sent to your email!' });
  } catch (error) {
    next(error);
  }
};

// --- 6. RESET PASSWORD ---
export const resetPassword = async (req, res, next) => {
  const { email, otp, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return next(errorHandler(404, 'User not found'));
    if (!user.otp || user.otp.toString() !== otp.toString()) return next(errorHandler(400, 'Invalid OTP'));
    if (user.otpExpires < Date.now()) return next(errorHandler(400, 'OTP Expired'));

    const hashedPassword = bcryptjs.hashSync(password, 10);
    
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    sendEmail(user.email, 'Password Changed Successfully', getSuccessTemplate(user.username));

    res.status(200).json({ success: true, message: 'Password updated successfully! Please login.' });
  } catch (error) {
    next(error);
  }
};