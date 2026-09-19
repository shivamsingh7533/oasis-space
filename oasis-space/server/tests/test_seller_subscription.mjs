import '../config/env.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import Order from '../models/order.model.js';
import Notification from '../models/notification.model.js';
import { createOrder, verifyPayment } from '../controllers/order.controller.js';
import { createListing } from '../controllers/listing.controller.js';
import { SELLER_PACK } from '../utils/fees.js';

function mockReqRes({ body = {}, user = {}, query = {}, params = {} }) {
  const req = { body, user, query, params, cookies: {} };
  let status = 200;
  let data = null;
  let nextErr = null;

  const res = {
    status(code) { status = code; return this; },
    json(d) { data = d; return this; },
    get statusValue() { return status; },
    get responseData() { return data; }
  };

  const next = (err) => { if (err) nextErr = err; };
  return { req, res, next, getErr: () => nextErr };
}

async function testSellerSubscription() {
  await mongoose.connect(process.env.MONGO);
  console.log('\n============================================================');
  console.log('  🚀 TESTING MANDATORY SELLER SUBSCRIPTION & RECLAIM FLOW');
  console.log('============================================================\n');

  const testSellerEmail = `seller_sub_${Date.now()}@oasisspace.test`;
  const testSeller = await User.create({
    username: `seller_sub_${Date.now().toString().slice(-4)}`,
    email: testSellerEmail,
    password: 'Password123!',
    mobile: '9876543210',
    isVerified: true,
    sellerStatus: 'approved',
  });

  const createdListingIds = [];
  const createdOrderIds = [];

  try {
    // --- SCENARIO 1: Unsubscribed seller attempts to list property (MUST BE BLOCKED) ---
    console.log('Scenario 1: Unsubscribed seller attempts to create a listing (Paywall Guard)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          name: 'Unsubscribed Penthouse',
          description: 'Should be blocked by paywall',
          address: 'Marine Drive, Mumbai',
          regularPrice: 20000000,
          discountPrice: 19000000,
          bathrooms: 3,
          bedrooms: 3,
          furnished: true,
          parking: true,
          type: 'sale',
          offer: false,
          imageUrls: ['https://oasisspace.test/blocked.jpg'],
        }
      });

      await createListing(req, res, next);
      const err = getErr();

      if (!err) {
        throw new Error('Expected unsubscribed seller to be blocked with 403, but request succeeded!');
      }
      console.log(`  ✔ Successfully blocked: ${err.statusCode} - "${err.message}"`);
      if (err.statusCode !== 403) {
        throw new Error(`Expected status 403, got ${err.statusCode}`);
      }
    }

    // --- SCENARIO 2: Seller initiates Razorpay order for Seller Pro Pack (₹5,100) ---
    console.log('\nScenario 2: Seller initiates Razorpay order for Seller Pro Pack (₹5,100)');
    let rzpOrderId = null;
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          orderType: 'seller_subscription'
        }
      });

      await createOrder(req, res, next);
      const err = getErr();
      if (err) throw err;

      const orderData = res.responseData;
      rzpOrderId = orderData.order.id;
      console.log(`  ✔ Status: ${res.statusValue} OK`);
      console.log(`  ✔ Order Type: ${orderData.type}`);
      console.log(`  ✔ Order Amount: ₹${orderData.order.amount / 100} (${orderData.order.amount} paise)`);
      console.log(`  ✔ Razorpay Order ID: ${rzpOrderId}`);

      if (orderData.order.amount !== SELLER_PACK.price * 100) {
        throw new Error(`Expected amount ${SELLER_PACK.price * 100}, got ${orderData.order.amount}`);
      }
    }

    // --- SCENARIO 3: Payment Verification & 10 Credits Fulfillment ---
    console.log('\nScenario 3: Payment Verification & 10 Listings Quota Allocation');
    const fakePaymentId1 = `pay_sub_${Date.now()}`;
    const sig1 = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${fakePaymentId1}`)
      .digest('hex');

    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: fakePaymentId1,
          razorpay_signature: sig1,
        }
      });

      await verifyPayment(req, res, next);
      const err = getErr();
      if (err) throw err;

      console.log(`  ✔ Status: ${res.statusValue} OK`);
      console.log(`  ✔ Message: "${res.responseData.message}"`);

      // Verify User in MongoDB
      const updatedUser = await User.findById(testSeller._id);
      const sub = updatedUser.sellerSubscription;
      console.log(`  ✔ User Subscription in DB:`);
      console.log(`     - Status: ${sub.status}`);
      console.log(`     - Total Quota: ${sub.totalQuota} listings`);
      console.log(`     - Used Quota: ${sub.usedQuota}`);
      console.log(`     - Remaining: ${sub.totalQuota - sub.usedQuota}`);

      if (sub.status !== 'active' || sub.totalQuota !== 10 || sub.usedQuota !== 0) {
        throw new Error('Seller subscription not properly activated in DB!');
      }

      const orderRecord = await Order.findOne({ paymentId: fakePaymentId1 });
      createdOrderIds.push(orderRecord._id);
      console.log(`  ✔ Saved Order Record: ID=${orderRecord._id}, type=${orderRecord.type}, amount=₹${orderRecord.amount}`);
    }

    // --- SCENARIO 4: Create Listings 1 through 9 (All Instant Live) ---
    console.log('\nScenario 4: Subscribed seller creates listings 1 through 9');
    for (let i = 1; i <= 9; i++) {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          name: `Luxury Villa #${i}`,
          description: `Test Villa #${i} with instant live publishing`,
          address: `Palm Street #${i}, Mumbai`,
          regularPrice: 10000000 + i * 100000,
          discountPrice: 9500000 + i * 100000,
          bathrooms: 2,
          bedrooms: 3,
          furnished: true,
          parking: true,
          type: 'sale',
          offer: false,
          imageUrls: [`https://oasisspace.test/villa${i}.jpg`],
        }
      });

      await createListing(req, res, next);
      const err = getErr();
      if (err) throw err;

      const listing = res.responseData;
      createdListingIds.push(listing._id);
      if (listing.status !== 'available') {
        throw new Error(`Listing #${i} expected status 'available', got ${listing.status}`);
      }
    }

    const userAfter9 = await User.findById(testSeller._id);
    console.log(`  ✔ Listings 1-9 created successfully.`);
    console.log(`  ✔ Quota status: ${userAfter9.sellerSubscription.usedQuota}/${userAfter9.sellerSubscription.totalQuota} used (${userAfter9.sellerSubscription.status})`);
    if (userAfter9.sellerSubscription.usedQuota !== 9 || userAfter9.sellerSubscription.status !== 'active') {
      throw new Error(`Expected usedQuota=9 and status='active', got ${userAfter9.sellerSubscription.usedQuota}, ${userAfter9.sellerSubscription.status}`);
    }

    // --- SCENARIO 5: Create the 10th Listing (Reaches Quota, Triggers Alerts) ---
    console.log('\nScenario 5: Seller creates 10th Listing (Reaches Quota, Triggers Exhaustion Alerts)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          name: 'Grand Milestone Villa #10',
          description: 'The 10th listing exhausting the current pack',
          address: 'Worli Sea Face, Mumbai',
          regularPrice: 50000000,
          discountPrice: 48000000,
          bathrooms: 4,
          bedrooms: 5,
          furnished: true,
          parking: true,
          type: 'sale',
          offer: true,
          imageUrls: ['https://oasisspace.test/villa10.jpg'],
        }
      });

      await createListing(req, res, next);
      const err = getErr();
      if (err) throw err;

      const listing = res.responseData;
      createdListingIds.push(listing._id);
      console.log(`  ✔ 10th Listing Created: "${listing.name}" (Status: ${listing.status})`);

      // Verify User state transitioned to 'exhausted'
      const userAfter10 = await User.findById(testSeller._id);
      const sub10 = userAfter10.sellerSubscription;
      console.log(`  ✔ Subscription Status: ${sub10.status}`);
      console.log(`  ✔ Used Quota: ${sub10.usedQuota}/${sub10.totalQuota}`);

      if (sub10.status !== 'exhausted' || sub10.usedQuota !== 10) {
        throw new Error(`Expected status='exhausted' and usedQuota=10, got ${sub10.status}, ${sub10.usedQuota}`);
      }

      // Verify In-App Notification created
      const notif = await Notification.findOne({
        recipient: testSeller._id,
        message: { $regex: /Quota complete/i }
      });
      if (!notif) {
        throw new Error('Expected in-app exhaustion notification was not found in DB!');
      }
      console.log(`  ✔ In-App Exhaustion Notification in DB: "${notif.message}"`);
    }

    // --- SCENARIO 6: Attempt 11th listing while exhausted (MUST BE REJECTED WITH 403) ---
    console.log('\nScenario 6: Attempt 11th listing while exhausted (Paywall blocks further listings)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          name: 'Listing #11 (Exhausted)',
          description: 'Should fail with quota exhausted message',
          address: 'Juhu Tara Road, Mumbai',
          regularPrice: 30000000,
          bathrooms: 3,
          bedrooms: 3,
          furnished: true,
          parking: true,
          type: 'sale',
          imageUrls: ['https://oasisspace.test/villa11.jpg'],
        }
      });

      await createListing(req, res, next);
      const err = getErr();
      if (!err) {
        throw new Error('Expected 11th listing to be blocked with 403, but it succeeded!');
      }
      console.log(`  ✔ Successfully blocked: ${err.statusCode} - "${err.message}"`);
      if (err.statusCode !== 403 || !err.message.includes('exhausted')) {
        throw new Error(`Expected 403 with exhaustion message, got ${err.statusCode}: ${err.message}`);
      }
    }

    // --- SCENARIO 7: Seller Reclaims/Renews Seller Pro Pack (₹5,100) ---
    console.log('\nScenario 7: Seller Reclaims/Renews Seller Pro Pack (+10 Credits)');
    let renewRzpOrderId = null;
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: { orderType: 'seller_subscription' }
      });
      await createOrder(req, res, next);
      const err = getErr();
      if (err) throw err;
      renewRzpOrderId = res.responseData.order.id;
    }

    const fakePaymentId2 = `pay_renew_${Date.now()}`;
    const sig2 = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${renewRzpOrderId}|${fakePaymentId2}`)
      .digest('hex');

    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          razorpay_order_id: renewRzpOrderId,
          razorpay_payment_id: fakePaymentId2,
          razorpay_signature: sig2,
        }
      });

      await verifyPayment(req, res, next);
      const err = getErr();
      if (err) throw err;

      const userRenewed = await User.findById(testSeller._id);
      const subRenewed = userRenewed.sellerSubscription;
      console.log(`  ✔ Reclaim Verified:`);
      console.log(`     - Status: ${subRenewed.status}`);
      console.log(`     - Total Quota: ${subRenewed.totalQuota} (was 10, now +10 = 20)`);
      console.log(`     - Used Quota: ${subRenewed.usedQuota}`);
      console.log(`     - Available Credits: ${subRenewed.totalQuota - subRenewed.usedQuota}`);

      if (subRenewed.status !== 'active' || subRenewed.totalQuota !== 20 || subRenewed.usedQuota !== 10) {
        throw new Error('Reclaim did not properly allocate +10 quota or set active status!');
      }

      const orderRecord = await Order.findOne({ paymentId: fakePaymentId2 });
      createdOrderIds.push(orderRecord._id);
    }

    // --- SCENARIO 8: Create Listing #11 after Reclaim (Now Succeeds) ---
    console.log('\nScenario 8: Create Listing #11 after Reclaim (Unblocked)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          name: 'Listing #11 Post-Reclaim Luxury Villa',
          description: 'Published successfully after reclaiming seller pack',
          address: 'Bandra Bandstand, Mumbai',
          regularPrice: 32000000,
          discountPrice: 31000000,
          bathrooms: 3,
          bedrooms: 4,
          furnished: true,
          parking: true,
          type: 'sale',
          offer: false,
          imageUrls: ['https://oasisspace.test/villa11.jpg'],
        }
      });

      await createListing(req, res, next);
      const err = getErr();
      if (err) throw err;

      const listing = res.responseData;
      createdListingIds.push(listing._id);
      console.log(`  ✔ Listing #11 Created: "${listing.name}" (Status: ${listing.status})`);

      const userPost11 = await User.findById(testSeller._id);
      console.log(`  ✔ Used Quota: ${userPost11.sellerSubscription.usedQuota}/${userPost11.sellerSubscription.totalQuota} (Remaining: ${userPost11.sellerSubscription.totalQuota - userPost11.sellerSubscription.usedQuota})`);
      if (userPost11.sellerSubscription.usedQuota !== 11) {
        throw new Error(`Expected usedQuota=11, got ${userPost11.sellerSubscription.usedQuota}`);
      }
    }

    // --- SCENARIO 9: Admin Exemption Test ---
    console.log('\nScenario 9: Admin Exemption Test (Admins bypass subscription requirement)');
    const adminUser = await User.create({
      username: `admin_${Date.now().toString().slice(-4)}`,
      email: `admin_${Date.now()}@oasisspace.test`,
      password: 'Password123!',
      role: 'admin',
      isVerified: true,
    });

    try {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: adminUser._id.toString() },
        body: {
          name: 'Admin Exclusive Showcase Property',
          description: 'Created by platform admin without pack',
          address: 'Nariman Point, Mumbai',
          regularPrice: 100000000,
          bathrooms: 5,
          bedrooms: 6,
          furnished: true,
          parking: true,
          type: 'sale',
          offer: false,
          discountPrice: 0,
          imageUrls: ['https://oasisspace.test/admin.jpg'],
        }
      });

      await createListing(req, res, next);
      const err = getErr();
      if (err) throw err;

      const adminListing = res.responseData;
      createdListingIds.push(adminListing._id);
      console.log(`  ✔ Admin Listing Created: "${adminListing.name}" (Status: ${adminListing.status})`);
      if (adminListing.status !== 'available') {
        throw new Error('Admin listing should be immediately available');
      }
    } finally {
      await User.deleteOne({ _id: adminUser._id });
    }

  } finally {
    // --- CLEANUP ---
    console.log('\n--- Cleaning Up Test Records ---');
    for (const lid of createdListingIds) {
      await Listing.deleteOne({ _id: lid });
    }
    for (const oid of createdOrderIds) {
      await Order.deleteOne({ _id: oid });
    }
    await Notification.deleteMany({ recipient: testSeller._id });
    await User.deleteOne({ _id: testSeller._id });
    await mongoose.connection.close();
    console.log('  ✔ All test data cleaned up successfully.');
  }

  console.log('\n============================================================');
  console.log('  🎉 ALL SELLER SUBSCRIPTION & RECLAIM TESTS PASSED!');
  console.log('============================================================\n');
}

testSellerSubscription().catch(console.error);

