import Razorpay from 'razorpay';
import Order from '../models/order.model.js';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import crypto from 'crypto';
import { errorHandler } from '../utils/error.js';
import sendEmail from '../utils/sendEmail.js';
import { sendPushNotification } from '../utils/sendPush.js';
import { getListingFee, BOOKING_TOKEN_FEE, SELLER_PACK, FEES_CURRENCY } from '../utils/fees.js';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const escapeHtml = (str = '') =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 1. CREATE ORDER — handles both seller listing fees and buyer token bookings.
//    Amounts are computed SERVER-SIDE (never trusted from the client).
export const createOrder = async (req, res, next) => {
  try {
    const { listingId, orderType = 'listing_fee' } = req.body;

    // --- A. SELLER SUBSCRIPTION PACK ORDER (₹5,100 for 10 Sale Listings) ---
    if (orderType === 'seller_subscription') {
      const options = {
        amount: SELLER_PACK.price * 100, // 510000 paise = ₹5,100
        currency: FEES_CURRENCY,
        receipt: `rcpt_sub_${req.user.id.slice(-6)}_${Date.now().toString().slice(-6)}`,
        notes: {
          type: 'seller_subscription',
          userId: req.user.id,
          quota: String(SELLER_PACK.listingQuota),
          planName: SELLER_PACK.name,
        }
      };

      const order = await razorpay.orders.create(options);
      if (!order) {
        return next(errorHandler(500, "Razorpay Order Creation Failed"));
      }

      return res.status(200).json({
        success: true,
        order,
        type: 'seller_subscription',
        plan: SELLER_PACK,
      });
    }

    if (!listingId) {
      return next(errorHandler(400, "Listing ID is required!"));
    }

    const listing = await Listing.findById(listingId);
    if (!listing) return next(errorHandler(404, 'Listing not found!'));

    // --- B. BUYER BOOKING ORDER ---
    if (orderType === 'booking') {
      // Owner cannot book their own property
      if (listing.userRef === req.user.id) {
        return next(errorHandler(400, 'You cannot book your own property.'));
      }

      // Property must be available (cannot book sold, rented, or pending draft)
      if (listing.status !== 'available') {
        return next(errorHandler(400, 'This property is not currently available for booking.'));
      }

      const options = {
        amount: BOOKING_TOKEN_FEE * 100, // Convert to paise (e.g. ₹999 -> 99900)
        currency: FEES_CURRENCY,
        receipt: `rcpt_bk_${listingId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
        notes: {
          listingId: listingId.toString(),
          userId: req.user.id,
          type: 'booking',
        }
      };

      const order = await razorpay.orders.create(options);
      if (!order) {
        return next(errorHandler(500, "Razorpay Order Creation Failed"));
      }

      return res.status(200).json({
        success: true,
        order,
        type: 'booking',
      });
    }

    // --- B. SELLER LISTING FEE ORDER ---
    // Only the listing owner can publish their own property.
    if (listing.userRef !== req.user.id) {
      return next(errorHandler(403, 'You can only pay the listing fee for your own property.'));
    }

    const fee = getListingFee(listing.type);

    // Rent listings publish free — there is no fee to pay (protects against
    // bypassing the guard with a ₹0 Razorpay order).
    if (fee === 0) {
      return next(errorHandler(400, 'Rent listings publish free — no payment required.'));
    }

    if (listing.status !== 'pending') {
      return next(errorHandler(400, 'This listing is not awaiting a listing fee.'));
    }

    const existingPaid = await Order.findOne({
      userRef: req.user.id,
      listingRef: listingId,
      type: 'listing_fee',
      status: 'success',
    });
    if (existingPaid) {
      return next(errorHandler(400, 'Listing fee already paid for this property.'));
    }

    const options = {
      amount: fee * 100, // Convert to paise
      currency: FEES_CURRENCY,
      receipt: `receipt_listing_${listingId}`,
      notes: {
        listingId: listingId.toString(),
        userId: req.user.id,
        type: 'listing_fee',
      }
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return next(errorHandler(500, "Razorpay Order Creation Failed"));
    }

    res.status(200).json({
      success: true,
      order,
      type: 'listing_fee',
    });
  } catch (error) {
    console.log("Create Order Error:", error);
    next(error);
  }
};

// 2. VERIFY PAYMENT
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return next(errorHandler(400, 'Missing payment parameters'));
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: "Invalid Signature! Payment Verification Failed." });
    }

    // A. Idempotency — a payment/order id can only be processed once
    const alreadyProcessed = await Order.findOne({
      $or: [{ paymentId: razorpay_payment_id }, { orderId: razorpay_order_id }],
    });
    if (alreadyProcessed) {
      return res.status(200).json({ success: true, message: "Payment already verified." });
    }

    // B. Fetch Razorpay Order to get type + listing from notes
    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    const notes = rzpOrder.notes || {};
    const listingId = notes.listingId;
    const paymentType = notes.type === 'seller_subscription'
      ? 'seller_subscription'
      : (notes.type === 'listing_fee' ? 'listing_fee' : 'booking');

    let listing = null;
    if (paymentType !== 'seller_subscription') {
      listing = await Listing.findById(listingId);
      if (!listing) return next(errorHandler(404, 'Listing not found'));
    }

    if (paymentType === 'seller_subscription') {
      if (rzpOrder.amount / 100 !== SELLER_PACK.price) {
        return next(errorHandler(400, 'Payment amount does not match Seller Pack price.'));
      }
    } else if (paymentType === 'listing_fee') {
      // Validate this is still an unpublished draft owned by the payer
      if (listing.userRef !== req.user.id) {
        return next(errorHandler(403, 'You can only verify a fee payment for your own listing.'));
      }
      if (listing.status !== 'pending') {
        return next(errorHandler(400, 'This listing already paid its listing fee.'));
      }
      const expectedFee = getListingFee(listing.type);
      if (rzpOrder.amount / 100 !== expectedFee) {
        return next(errorHandler(400, 'Payment amount does not match the listing fee.'));
      }
    }

    const buyer = await User.findById(req.user.id);

    // C. Save to Database
    const newOrder = new Order({
      userRef: req.user.id,
      listingRef: listing ? listingId : null,
      amount: rzpOrder.amount / 100,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'success',
      type: paymentType,
      mobile: (buyer && buyer.mobile) || '',
    });

    const order = await newOrder.save();

    // D. Fulfill Seller Subscription
    if (paymentType === 'seller_subscription') {
      const now = new Date();
      const endDate = new Date(now.getTime() + SELLER_PACK.validityDays * 24 * 60 * 60 * 1000);

      const currentTotal = (buyer.sellerSubscription && buyer.sellerSubscription.totalQuota) || 0;
      const currentUsed = (buyer.sellerSubscription && buyer.sellerSubscription.usedQuota) || 0;

      buyer.sellerSubscription = {
        status: 'active',
        totalQuota: currentTotal + SELLER_PACK.listingQuota,
        usedQuota: currentUsed,
        startDate: now,
        endDate: endDate,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      };

      if (buyer.sellerStatus !== 'approved') {
        buyer.sellerStatus = 'approved';
      }

      await buyer.save();

      // Email receipt to seller
      if (buyer.email) {
        const emailSubject = `🎉 Seller Pro Pack Activated: 10 Sale Listings Added!`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2563eb;">Congratulations, ${escapeHtml(buyer.username)}!</h2>
            <p>Your <strong>${escapeHtml(SELLER_PACK.name)}</strong> is now ACTIVE.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p><strong>📦 Package:</strong> ${escapeHtml(SELLER_PACK.name)}</p>
              <p><strong>🏷️ Sale Listings Quota:</strong> 10 Properties</p>
              <p><strong>💰 Amount Paid:</strong> ₹${SELLER_PACK.price}</p>
              <p><strong>📅 Valid Till:</strong> ${endDate.toDateString()}</p>
              <p><strong>🧾 Payment ID:</strong> ${escapeHtml(razorpay_payment_id)}</p>
            </div>
            <p>You can now list up to 10 Sale properties and they will publish immediately!</p>
            <br/>
            <p style="font-size: 12px; color: #888;">Team OasisSpace</p>
          </div>
        `;
        await sendEmail(buyer.email, emailSubject, emailBody);
        await sendEmail(process.env.SENDER_EMAIL, emailSubject, emailBody);
      }

      // In-app notification
      const remaining = buyer.sellerSubscription.totalQuota - buyer.sellerSubscription.usedQuota;
      await Notification.create({
        recipient: buyer._id,
        sender: buyer._id,
        message: `🚀 Seller Pack activated! You have ${remaining} Sale listing credits valid for 1 year.`,
        relatedId: null
      });

      return res.status(200).json({
        success: true,
        message: "Seller Pro Pack activated! 10 Sale listings added to your account.",
        type: 'seller_subscription',
        sellerSubscription: buyer.sellerSubscription,
      });
    }

    if (paymentType === 'listing_fee') {
      // Publish the listing — draft becomes publicly visible
      listing.status = 'available';
      await listing.save();

      const fee = getListingFee(listing.type);

      // Receipt email to the seller
      if (buyer) {
        const emailSubject = `✅ Your Listing "${listing.name}" is now Live!`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2563eb;">Congratulations, ${escapeHtml(buyer.username)}!</h2>
            <p>Your property <strong>${escapeHtml(listing.name)}</strong> has been published.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p><strong>📋 Property:</strong> ${escapeHtml(listing.name)}</p>
              <p><strong>📍 Address:</strong> ${escapeHtml(listing.address)}</p>
              <p><strong>💰 Listing Fee Paid:</strong> ₹${fee}</p>
              <p><strong>🧾 Payment ID:</strong> ${escapeHtml(razorpay_payment_id)}</p>
            </div>
            <p>Your listing is now visible to buyers and tenants.</p>
            <br/>
            <p style="font-size: 12px; color: #888;">Team OasisSpace</p>
          </div>
        `;
        await sendEmail(buyer.email, emailSubject, emailBody);
    // Also send a copy to the admin/sender email
    await sendEmail(process.env.SENDER_EMAIL, emailSubject, emailBody);
      }

      // In-app notification to the seller
      const msg = `🚀 "${listing.name}" is now LIVE! Listing fee of ₹${fee} received.`;
      await Notification.create({ recipient: listing.userRef, sender: req.user.id, message: msg, relatedId: listingId });

      // Web push to the seller
      await sendPushNotification(listing.userRef, {
        title: '🎉 Listing Published!',
        body: `"${listing.name}" is now live on OasisSpace.`,
        icon: '/icon-192.png'
      });

      // Admin notification
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          sender: req.user.id,
          message: `👑 ${buyer ? buyer.username : 'A seller'} published "${listing.name}" (fee ₹${fee} collected)`,
          relatedId: listingId
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment Verified. Your listing is now live!",
        type: 'listing_fee',
      });
    }

    // --- LEGACY BOOKING PATH (pre-fee-model orders only) ---
    const landlord = await User.findById(listing.userRef);

    if (landlord && buyer) {
      // Email to Landlord
      const emailSubject = `🏠 New Booking Alert: ${listing.name}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #2563eb;">Good News, ${escapeHtml(landlord.username)}!</h2>
          <p>Your property <strong>${escapeHtml(listing.name)}</strong> has been booked.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <p><strong>👤 Buyer Name:</strong> ${escapeHtml(buyer.username)}</p>
            <p><strong>📞 Contact:</strong> ${order.mobile ? escapeHtml(order.mobile) : 'Not provided'}</p>
            <p><strong>✉️ Email:</strong> ${escapeHtml(buyer.email)}</p>
            <p><strong>💰 Booking Amount:</strong> ₹${order.amount}</p>
          </div>
          <p>Please contact the buyer as soon as possible to proceed further.</p>
          <br/>
          <p style="font-size: 12px; color: #888;">Team OasisSpace</p>
        </div>
      `;
      await sendEmail(landlord.email, emailSubject, emailBody);

      // In-App Notification
      await Notification.create({ recipient: listing.userRef, sender: buyer._id, message: `🚀 New Booking! ${buyer.username} booked "${listing.name}".`, relatedId: listingId });

      // Web Push to Landlord
      await sendPushNotification(listing.userRef, {
        title: '🎉 New Booking Received!',
        body: `${buyer.username} just booked "${listing.name}". Check your email for contact details.`,
        icon: '/icon-192.png'
      });

      // Admin Notification
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          sender: buyer._id,
          message: `👑 Admin Alert: ${buyer.username} booked ${listing.name}`,
          relatedId: listingId
        });
        await sendPushNotification(admin._id, {
          title: '👑 Admin Alert: New Booking',
          body: `${buyer.username} booked ${listing.name}.`,
          icon: '/icon-192.png'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment Verified, Email Sent & Landlord Notified!",
      type: 'booking',
    });
  } catch (error) {
    console.log("Verify Error:", error);
    next(error);
  }
};

// 3. GET ORDER HISTORY
export const getOrderHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = parseInt(req.query.startIndex) || 0;

    const [orders, total] = await Promise.all([
      Order.find({ userRef: req.user.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(startIndex)
        .populate('listingRef'),
      Order.countDocuments({ userRef: req.user.id }),
    ]);

    res.status(200).json({ orders, total });
  } catch (error) {
    next(error);
  }
};

// 3b. ADMIN: COLLECTED FEES & PAYMENT STATS (real numbers from the orders collection)
export const getAdminOrderStats = async (req, res, next) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') return next(errorHandler(403, 'Admins only!'));

    const [fees, bookings] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'success', type: 'listing_fee' } },
        { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$amount' } } },
      ]),
      Order.aggregate([
        { $match: { status: 'success', type: 'booking' } },
        { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$amount' } } },
      ]),
    ]);

    const feeAgg = fees[0] || { count: 0, value: 0 };
    const bookingAgg = bookings[0] || { count: 0, value: 0 };

    res.status(200).json({
      success: true,
      feesCollected: feeAgg.value || 0,
      feesCount: feeAgg.count || 0,
      bookingsValue: bookingAgg.value || 0,
      bookingsCount: bookingAgg.count || 0,
    });
  } catch (error) {
    next(error);
  }
};

// 4. DELETE ORDER
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(errorHandler(404, 'Order not found!'));
    if (order.userRef !== req.user.id) return next(errorHandler(401, 'You can only delete your own orders!'));
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json('Order has been deleted!');
  } catch (error) {
    next(error);
  }
};

// 5. CANCEL ORDER
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(errorHandler(404, 'Order not found!'));
    if (order.userRef !== req.user.id) return next(errorHandler(401, 'You can only cancel your own orders!'));

    // Fee payments cannot be cancelled here — no automated refund is wired up.
    if (order.type === 'listing_fee') {
      return next(errorHandler(400, 'Listing fee payments cannot be cancelled online. Contact support for a refund.'));
    }

    order.status = 'cancelled';
    await order.save();

    const listing = await Listing.findById(order.listingRef);
    const buyer = await User.findById(req.user.id);
    const landlord = listing ? await User.findById(listing.userRef) : null;

    if (listing && landlord && buyer) {
       const emailSubject = `❌ Booking Cancelled: ${listing.name}`;
       const emailBody = `
         <div style="font-family: Arial, sans-serif; color: #333;">
           <h2 style="color: #dc2626;">Booking Cancelled</h2>
           <p>Hello ${escapeHtml(landlord.username)},</p>
           <p>The user <strong>${escapeHtml(buyer.username)}</strong> has cancelled their booking for <strong>${escapeHtml(listing.name)}</strong>.</p>
           <p>The status has been updated in your dashboard.</p>
           <br/>
           <p style="font-size: 12px; color: #888;">Team OasisSpace</p>
         </div>
       `;
await sendEmail(landlord.email, emailSubject, emailBody);
    // Also send a copy to the admin/sender email
    await sendEmail(process.env.SENDER_EMAIL, emailSubject, emailBody);

       await Notification.create({
         recipient: listing.userRef,
         sender: buyer._id,
         message: `❌ Booking Cancelled! ${buyer.username} cancelled booking for "${listing.name}".`,
         relatedId: listing._id
       });
    }
    res.status(200).json('Order has been cancelled successfully!');
  } catch (error) {
    next(error);
  }
};