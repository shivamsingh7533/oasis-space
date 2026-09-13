import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import Order from '../models/order.model.js';
import Notification from '../models/notification.model.js';
import Subscription from '../models/subscription.model.js';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js'; // ✅ Using Brevo API
import { sendPushNotification } from '../utils/sendPush.js';

const SELLER_STATUSES = ['regular', 'pending', 'approved', 'rejected'];

// UPDATE USER
export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, 'You can only update your own account!'));

  // Allowlist — only these fields may ever be written from a profile update.
  const allowedFields = ['username', 'email', 'avatar', 'mobile'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = (field === 'email') ? req.body[field].trim().toLowerCase() : String(req.body[field]).trim();
    }
  }

  // Password is updated ONLY when a real, non-empty value is provided.
  // Fixes the bug where Profile.jsx sent `password: ''` on every save and
  // wiped the hash, locking the account out permanently.
  if (req.body.password && typeof req.body.password === 'string' && req.body.password.trim().length > 0) {
    if (req.body.password.length < 8) return next(errorHandler(400, 'Password must be at least 8 characters'));
    updates.password = bcryptjs.hashSync(req.body.password, 10);
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-otp -otpExpires');

    if (!updatedUser) return next(errorHandler(404, 'User not found'));
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return next(errorHandler(409, `This ${field === 'email' ? 'email' : 'username'} is already in use`));
    }
    next(error);
  }
};

// DELETE USER (self or admin) + cascade cleanup of dependent data
export const deleteUser = async (req, res, next) => {
  try {
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser) return next(errorHandler(404, 'User not found!'));

    if (req.user.id !== req.params.id && requestingUser.role !== 'admin') {
      return next(errorHandler(401, 'You can only delete your own account!'));
    }

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Listing.deleteMany({ userRef: req.params.id }),
      Order.deleteMany({ userRef: req.params.id }),
      Notification.deleteMany({ $or: [{ recipient: req.params.id }, { sender: req.params.id }] }),
      Subscription.deleteMany({ userRef: req.params.id }),
    ]);

    if (req.user.id === req.params.id) {
      res.clearCookie('access_token');
    }
    res.status(200).json('User and all associated data has been deleted!');
  } catch (error) {
    next(error);
  }
};

// GET USER LISTINGS
export const getUserListings = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const listings = await Listing.find({ userRef: req.params.id }).sort({ createdAt: -1 });
      res.status(200).json(listings);
    } catch (error) {
      next(error);
    }
  } else {
    return next(errorHandler(401, 'You can only view your own listings!'));
  }
};

// GET PUBLIC USER INFO (safe allowlisted fields only)
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found!'));
    res.status(200).json({
      username: user.username,
      avatar: user.avatar,
      sellerStatus: user.sellerStatus,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// WISHLIST LOGIC
export const saveListing = async (req, res, next) => {
  try {
    const listingId = req.params.id;
    const userId = req.user.id;
    const [user, listingExists] = await Promise.all([
      User.findById(userId),
      Listing.exists({ _id: listingId }),
    ]);
    if (!user) return next(errorHandler(404, 'User not found!'));
    if (!listingExists) return next(errorHandler(404, 'Listing not found!'));

    const savedListings = user.savedListings || [];
    const isSaved = savedListings.some((id) => id.toString() === listingId);

    if (isSaved) {
      await User.findByIdAndUpdate(userId, { $pull: { savedListings: listingId } });
      res.status(200).json('Listing removed from wishlist');
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { savedListings: listingId } });
      res.status(200).json('Listing saved to wishlist');
    }
  } catch (error) {
    next(error);
  }
};

// GET SAVED LISTINGS
export const getSavedListings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(errorHandler(404, 'User not found'));
    const savedListingsIds = user.savedListings || [];
    const listings = savedListingsIds.length
      ? await Listing.find({ _id: { $in: savedListingsIds }, status: { $ne: 'pending' } })
      : [];
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// ADMIN: GET ALL USERS
export const getUsers = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(errorHandler(401, 'User not authenticated'));
    }
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return next(errorHandler(403, 'Access Denied! Admins only.'));
    }
    const users = await User.find().sort({ createdAt: -1 }).select('-otp -otpExpires');
    res.status(200).json(users);
  } catch (error) {
    console.log("Error in getUsers:", error.message);
    next(error);
  }
};

// --- 🔥 SELLER FEATURES (Using Brevo) ---

// Request Seller Status
export const requestSeller = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.sellerStatus === 'approved') return next(errorHandler(400, 'Already Approved!'));
    if (user.sellerStatus === 'pending') return next(errorHandler(400, 'Request Pending!'));

    user.sellerStatus = 'pending';
    await user.save();

    const approveToken = jwt.sign({ id: user._id, action: 'approved', purpose: 'seller' }, process.env.JWT_SECRET.trim(), { expiresIn: '7d' });
    const rejectToken = jwt.sign({ id: user._id, action: 'rejected', purpose: 'seller' }, process.env.JWT_SECRET.trim(), { expiresIn: '7d' });

    // Dynamic Server URL (Render compatible)
    const serverUrl = process.env.SERVER_URL || 'https://oasis-space.onrender.com';
    const adminEmail = process.env.SENDER_EMAIL; // Admin email

    await sendEmail(
      adminEmail,
      `📢 Seller Request: ${user.username}`,
      `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd; max-width: 500px; margin: 0 auto;">
           <h2 style="color: #d97706; text-align: center;">New Seller Request</h2>
           <p>User <strong>${user.username}</strong> wants to become a seller.</p>
           
           <div style="margin: 30px 0; text-align: center;">
             <a href="${serverUrl}/api/user/respond-seller/${approveToken}" 
                style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                ✅ Approve
             </a>
             <a href="${serverUrl}/api/user/respond-seller/${rejectToken}" 
                style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                ❌ Reject
             </a>
           </div>
         </div>
        `
    );

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Respond via Email Link
export const respondSellerViaEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET.trim());
    const { id, action, purpose } = decoded;

    if (purpose !== 'seller') {
      return res.status(400).send(`<h1 style="color: red;">Error: Invalid Link</h1>`);
    }
    if (!SELLER_STATUSES.includes(action)) {
      return res.status(400).send(`<h1 style="color: red;">Error: Invalid Link</h1>`);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { sellerStatus: action } },
      { new: true }
    );

    if (!user) return res.send("<h1>User not found.</h1>");

    const color = action === 'approved' ? '#10b981' : '#ef4444';

    // Notify User
    await sendEmail(
      user.email,
      `Seller Request: ${action.toUpperCase()}`,
      `<div style="font-family: Arial; padding: 20px;">
               <h2 style="color: ${color};">Application ${action.toUpperCase()}</h2>
               <p>Hello ${user.username}, your request has been ${action}.</p>
             </div>`
    );

    // Web Push Notification to User
    await sendPushNotification(user._id, {
      title: `Seller Request ${action.toUpperCase()}`,
      body: `Your request to become a seller has been ${action}.`,
      icon: '/icon-192.png'
    });

    res.send(`
            <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f3f4f6;">
                <h1 style="color: ${color};">Success! 🎉</h1>
                <p>User <strong>${user.username}</strong> has been <strong>${action.toUpperCase()}</strong>.</p>
            </div>
        `);

  } catch (error) {
    res.send(`<h1 style="color: red;">Error: Invalid or Expired Link</h1>`);
  }
};

// Verify Seller via Dashboard
export const verifySeller = async (req, res, next) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') return next(errorHandler(403, 'Admins Only!'));

    const { status } = req.body;
    if (!SELLER_STATUSES.includes(status)) return next(errorHandler(400, 'Invalid seller status'));

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { sellerStatus: status } },
      { new: true }
    ).select('-otp -otpExpires');

    if (!updatedUser) return next(errorHandler(404, 'User not found'));

    const color = status === 'approved' ? '#10b981' : '#ef4444';
    await sendEmail(
      updatedUser.email,
      `Seller Request Update: ${status.toUpperCase()}`,
      `<div style="font-family: Arial; padding: 20px;">
               <h2 style="color: ${color};">Application ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
               <p>Hello ${updatedUser.username}, your request has been <strong>${status}</strong>.</p>
             </div>`
    );

    // Web Push Notification to User
    await sendPushNotification(updatedUser._id, {
      title: `Seller Account ${status.toUpperCase()}`,
      body: `Your seller account status is now: ${status}.`,
      icon: '/icon-192.png'
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

// SELLER DASHBOARD (ANALYTICS) — honest numbers only, no fabricated revenue/views
export const getSellerDashboard = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const [listings, orderStats] = await Promise.all([
        Listing.find({ userRef: req.params.id }).sort({ createdAt: -1 }),
        Order.aggregate([
          { $match: { status: 'success' } },
          // join on real ObjectId listingRef — legacy order docs keep working via cast
          { $lookup: { from: 'listings', localField: 'listingRef', foreignField: '_id', as: 'listing' } },
          { $unwind: { path: '$listing', preserveNullAndEmptyArrays: true } },
          { $match: { 'listing.userRef': req.params.id } },
          { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$amount' } } },
        ]),
      ]);

      const soldCount = listings.filter((l) => l.status === 'sold').length;
      const rentedCount = listings.filter((l) => l.status === 'rented').length;
      const pendingListings = listings.filter((l) => l.status === 'pending').length;
      const activeListings = listings.filter((l) => l.status === 'available').length;
      const rentListings = listings.filter((l) => l.type === 'rent' && l.status === 'available').length;
      const saleListings = listings.filter((l) => l.type === 'sale' && l.status === 'available').length;
      const offerListings = listings.filter((l) => l.offer && l.status === 'available').length;

      const orderAgg = orderStats[0] || { count: 0, value: 0 };

      res.status(200).json({
        success: true,
        stats: {
          totalListings: listings.length,
          activeListings,
          pendingListings,
          rentListings,
          saleListings,
          offerListings,
          soldCount,
          rentedCount,
          bookingsCount: orderAgg.count,
          bookingsValue: orderAgg.value || 0,
        },
        listings
      });
    } catch (error) {
      next(error);
    }
  } else {
    return next(errorHandler(401, 'You can only view your own dashboard!'));
  }
};

// GET CONTACT LANDLORD (DIRECT EMAIL)
export const contactLandlord = async (req, res, next) => {
  try {
    const { landlordId, listingName, message, senderName, senderEmail } = req.body;
    if (!landlordId || !listingName || !message || !senderName || !senderEmail) {
      return next(errorHandler(400, 'All fields are required.'));
    }

    const landlord = await User.findById(landlordId);
    if (!landlord) return next(errorHandler(404, 'Landlord not found!'));

    // Send Direct Email to Landlord
    await sendEmail(
      landlord.email,
      `New Lead for ${listingName} 🏠`,
      `
      <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd; max-width: 600px; border-radius: 10px;">
        <h2 style="color: #10b981;">New Inquiry Received! 📩</h2>
        <p>You have a new potential buyer/renter for <strong>${listingName}</strong>.</p>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${senderName}</p>
          <p><strong>Email:</strong> ${senderEmail}</p>
          <p><strong>Message:</strong></p>
          <p style="font-style: italic; color: #555;">"${message}"</p>
        </div>

        <p>Please reply to this lead directly via email.</p>
        <br/>
        <p style="font-size: 12px; color: #888;">Powered by OasisSpace</p>
      </div>
      `
    );

    res.status(200).json({ success: true, message: 'Email sent successfully to the owner!' });
  } catch (error) {
    next(error);
  }
};

// CONTACT US (Public — Footer Form)
export const contactUs = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return next(errorHandler(400, 'All fields are required.'));

    const adminEmail = process.env.SENDER_EMAIL;

    await sendEmail(
      adminEmail,
      `📩 New Contact Form Message from ${name}`,
      `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; border: 1px solid #e2e8f0; max-width: 600px; border-radius: 16px; background: #f8fafc;">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">New Contact Us Message 📩</h2>
        <div style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Message:</strong></p>
          <p style="font-style: italic; color: #555; background: #f1f5f9; padding: 12px; border-radius: 8px;">${message}</p>
        </div>
        <p style="font-size: 12px; color: #888; margin-top: 20px;">Sent from OasisSpace Contact Form</p>
      </div>
      `
    );

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    next(error);
  }
};