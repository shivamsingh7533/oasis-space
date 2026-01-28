import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';
import nodemailer from 'nodemailer'; 
import jwt from 'jsonwebtoken'; 

// EMAIL HELPER FUNCTION
const sendEmail = async (to, subject, htmlContent) => {
  try {
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
      from: `"OasisSpace Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent, 
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email notification sent to ${to}`);
  } catch (error) {
    console.log("❌ Email sending failed:", error.message);
  }
};

// TEST ROUTE
export const test = (req, res) => {
  res.json({ message: 'Api route is working!' });
};

// UPDATE USER
export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, 'You can only update your own account!'));
  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
          mobile: req.body.mobile,
        },
      },
      { new: true }
    );
    const { password, ...rest } = updatedUser._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

// DELETE USER
export const deleteUser = async (req, res, next) => {
  try {
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser) return next(errorHandler(404, 'User not found!'));

    if (req.user.id !== req.params.id && requestingUser.role !== 'admin') {
      return next(errorHandler(401, 'You can only delete your own account!'));
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    if (req.user.id === req.params.id) {
        res.clearCookie('access_token');
    }
    res.status(200).json('User has been deleted!');
  } catch (error) {
    next(error);
  }
};

// GET USER LISTINGS
export const getUserListings = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const listings = await Listing.find({ userRef: req.params.id });
      res.status(200).json(listings);
    } catch (error) {
      next(error);
    }
  } else {
    return next(errorHandler(401, 'You can only view your own listings!'));
  }
};

// GET PUBLIC USER INFO
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found!'));
    const { password: pass, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

// WISHLIST LOGIC
export const saveListing = async (req, res, next) => {
  try {
    const listingId = req.params.id; 
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return next(errorHandler(404, 'User not found!'));

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
    const savedListings = await Promise.all(savedListingsIds.map((listingId) => Listing.findById(listingId)));
    const validListings = savedListings.filter(listing => listing !== null);
    res.status(200).json(validListings);
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
    const users = await User.find().sort({ createdAt: -1 });
    const usersWithoutPassword = users.map((u) => {
      const { password, ...rest } = u._doc;
      return rest;
    });
    res.status(200).json(usersWithoutPassword);
  } catch (error) {
    console.log("Error in getUsers:", error.message);
    next(error);
  }
};

// SELLER FEATURES (WITH MAGIC LINKS)

// Request Seller Status
export const requestSeller = async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (user.sellerStatus === 'approved') return next(errorHandler(400, 'Already Approved!'));
      if (user.sellerStatus === 'pending') return next(errorHandler(400, 'Request Pending!'));
  
      user.sellerStatus = 'pending';
      await user.save();

      const approveToken = jwt.sign({ id: user._id, action: 'approved' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const rejectToken = jwt.sign({ id: user._id, action: 'rejected' }, process.env.JWT_SECRET, { expiresIn: '7d' });

      // ✅ DYNAMIC SERVER URL for Email Links (Production Ready)
      const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'; 

      const adminEmail = process.env.EMAIL_USER;
      await sendEmail(
        adminEmail,
        `📢 Seller Request: ${user.username}`,
        `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd; max-width: 500px; margin: 0 auto;">
           <h2 style="color: #d97706; text-align: center;">New Seller Request</h2>
           <p>User <strong>${user.username}</strong> (${user.email}) wants to become a seller.</p>
           
           <div style="margin: 30px 0; text-align: center;">
             <p style="margin-bottom: 15px;">One-click Action:</p>
             
             <a href="${serverUrl}/api/user/respond-seller/${approveToken}" 
                style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">
                ✅ Approve
             </a>

             <a href="${serverUrl}/api/user/respond-seller/${rejectToken}" 
                style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                ❌ Reject
             </a>
           </div>

           <p style="font-size: 12px; color: gray; text-align: center;">These links are valid for 7 days.</p>
         </div>
        `
      );

      const { password, ...rest } = user._doc;
      res.status(200).json(rest);
    } catch (error) {
      next(error);
    }
};

// Respond via Email Link
export const respondSellerViaEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id, action } = decoded;

        const user = await User.findByIdAndUpdate(
            id,
            { $set: { sellerStatus: action } },
            { new: true }
        );

        if (!user) return res.send("<h1>User not found or deleted.</h1>");

        const color = action === 'approved' ? '#10b981' : '#ef4444';
        await sendEmail(
            user.email,
            `Seller Request: ${action.toUpperCase()}`,
            `<div style="font-family: Arial; padding: 20px;">
               <h2 style="color: ${color};">Application ${action.toUpperCase()}</h2>
               <p>Hello ${user.username}, your request has been ${action}.</p>
             </div>`
        );

        res.send(`
            <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f3f4f6;">
                <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center;">
                    <h1 style="color: ${color}; margin: 0;">Success! 🎉</h1>
                    <p style="font-size: 18px; margin-top: 10px;">User <strong>${user.username}</strong> has been <strong>${action.toUpperCase()}</strong>.</p>
                    <p style="color: gray;">You can close this window now.</p>
                </div>
            </div>
        `);

    } catch (error) {
        res.send(`<h1 style="color: red; text-align: center; margin-top: 50px;">Error: Invalid or Expired Link</h1>`);
    }
};
  
// Verify Seller via Admin Dashboard
export const verifySeller = async (req, res, next) => {
    try {
        const adminUser = await User.findById(req.user.id);
        if (!adminUser || adminUser.role !== 'admin') return next(errorHandler(403, 'Admins Only!'));

        const { status } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { sellerStatus: status } },
            { new: true }
        );

        const color = status === 'approved' ? '#10b981' : '#ef4444';
        await sendEmail(
            updatedUser.email,
            `Seller Request Update: ${status.toUpperCase()}`,
            `<div style="font-family: Arial; padding: 20px; border: 1px solid #ddd;">
               <h2 style="color: ${color};">Application ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
               <p>Hello ${updatedUser.username},</p>
               <p>Your request to become a seller on OasisSpace has been <strong>${status}</strong>.</p>
               ${status === 'approved' ? '<p>You can now list properties for SALE! 🎉</p>' : '<p>Please contact support if you have questions.</p>'}
             </div>`
        );

        const { password, ...rest } = updatedUser._doc;
        res.status(200).json(rest);
    } catch (error) {
        next(error);
    }
};

// 🔥 PRODUCTION LEVEL SELLER DASHBOARD (ANALYTICS & FINANCE) 📊
export const getSellerDashboard = async (req, res, next) => {
    if (req.user.id === req.params.id) {
        try {
            // 1. Fetch all listings by this seller
            const listings = await Listing.find({ userRef: req.params.id }).sort({ createdAt: -1 });

            // 2. Basic Stats
            const totalListings = listings.length;
            const rentListings = listings.filter(l => l.type === 'rent').length;
            const saleListings = listings.filter(l => l.type === 'sale').length;
            const offerListings = listings.filter(l => l.offer).length;
            
            // 3. 💰 FINANCE & STATUS CALCULATION
            let totalRevenue = 0;
            let soldCount = 0;
            let rentedCount = 0;
            let availableCount = 0;

            listings.forEach((listing) => {
                if (listing.status === 'sold') {
                    soldCount++;
                    // Revenue is the price it was sold at (discountPrice if exists, else regularPrice)
                    totalRevenue += (listing.discountPrice || listing.regularPrice);
                } else if (listing.status === 'rented') {
                    rentedCount++;
                    // For rent, we assume the price listed is the revenue
                    totalRevenue += (listing.discountPrice || listing.regularPrice);
                } else {
                    if (!listing.status || listing.status === 'available') {
                        availableCount++;
                    }
                }
            });

            // 4. Mock Views (Can be upgraded later)
            const totalViews = listings.reduce((acc, curr) => acc + (curr.views || Math.floor(Math.random() * 50) + 5), 0); 

            res.status(200).json({
                success: true,
                stats: {
                    totalListings,
                    rentListings,
                    saleListings,
                    offerListings,
                    totalViews,
                    // Finance Data
                    soldCount,
                    rentedCount,
                    availableCount,
                    totalRevenue
                },
                listings // Full listings list for the table
            });
        } catch (error) {
            next(error);
        }
    } else {
        return next(errorHandler(401, 'You can only view your own dashboard!'));
    }
};