import '../config/env.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import Order from '../models/order.model.js';
import Notification from '../models/notification.model.js';
import { createOrder, verifyPayment } from '../controllers/order.controller.js';
import { createListing, updateListing } from '../controllers/listing.controller.js';
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
  console.log('  🚀 TESTING SELLER SUBSCRIPTION & RENT-TO-SALE FLOW');
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
  let testRentListingId = null;

  try {
    // --- SCENARIO 1A: Unsubscribed user lists a RENT property (FREE, NO SUBSCRIPTION REQUIRED) ---
    console.log('Scenario 1A: Unsubscribed user lists a RENT property (FREE - Allowed without subscription)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          name: 'Affordable 2BHK Apartment for Rent',
          description: 'Spacious rental flat in Andheri West',
          address: 'Andheri West, Mumbai',
          regularPrice: 45000,
          discountPrice: 0,
          bathrooms: 2,
          bedrooms: 2,
          furnished: true,
          parking: true,
          type: 'rent',
          offer: false,
          imageUrls: ['https://oasisspace.test/rent1.jpg'],
        }
      });

      await createListing(req, res, next);
      const err = getErr();
      if (err) throw err;

      const rentListing = res.responseData;
      testRentListingId = rentListing._id;
      createdListingIds.push(rentListing._id);
      console.log(`  ✔ Rent Listing Created: "${rentListing.name}"`);
      console.log(`  ✔ Status: ${rentListing.status} (Published live immediately for FREE)`);

      if (rentListing.status !== 'available') {
        throw new Error(`Expected rent listing status 'available', got ${rentListing.status}`);
      }
    }

    // --- SCENARIO 1B: Unsubscribed user attempts to create a SALE listing (BLOCKED 403) ---
    console.log('\nScenario 1B: Unsubscribed user attempts to list a SALE property (Paywall Guard)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          name: 'Unsubscribed Luxury Penthouse for Sale',
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
        throw new Error('Expected unsubscribed seller to be blocked with 403 on Sale listing, but request succeeded!');
      }
      console.log(`  ✔ Successfully blocked: ${err.statusCode} - "${err.message}"`);
      if (err.statusCode !== 403) {
        throw new Error(`Expected status 403, got ${err.statusCode}`);
      }
    }

    // --- SCENARIO 1C: Unsubscribed user attempts to update RENT listing to SALE (BLOCKED 403) ---
    console.log('\nScenario 1C: Unsubscribed user attempts to update RENT property to SALE (Bypass Guard)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        params: { id: testRentListingId.toString() },
        body: {
          type: 'sale',
          regularPrice: 15000000,
        }
      });

      await updateListing(req, res, next);
      const err = getErr();

      if (!err) {
        throw new Error('Expected update from rent to sale without subscription to fail with 403!');
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
      console.log(`  ✔ Order Amount: ₹${orderData.order.amount / 100}`);
      console.log(`  ✔ Razorpay Order ID: ${rzpOrderId}`);
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
    }

    // --- SCENARIO 4: Subscribed seller converts RENT listing to SALE via updateListing (DEDUCTS 1 QUOTA) ---
    console.log('\nScenario 4: Subscribed seller converts RENT listing to SALE via updateListing (Deducts 1 Credit)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        params: { id: testRentListingId.toString() },
        body: {
          type: 'sale',
          regularPrice: 15000000,
        }
      });

      await updateListing(req, res, next);
      const err = getErr();
      if (err) throw err;

      const updated = res.responseData;
      console.log(`  ✔ Listing updated successfully. New type: ${updated.type}`);
      if (updated.type !== 'sale') {
        throw new Error(`Expected type 'sale', got ${updated.type}`);
      }

      // Verify quota count decreased (usedQuota incremented by 1)
      const userAfterUpdate = await User.findById(testSeller._id);
      console.log(`  ✔ Quota after Rent->Sale update: ${userAfterUpdate.sellerSubscription.usedQuota}/${userAfterUpdate.sellerSubscription.totalQuota} used (Remaining: ${userAfterUpdate.sellerSubscription.totalQuota - userAfterUpdate.sellerSubscription.usedQuota})`);
      if (userAfterUpdate.sellerSubscription.usedQuota !== 1) {
        throw new Error(`Expected usedQuota=1, got ${userAfterUpdate.sellerSubscription.usedQuota}`);
      }
    }

    // --- SCENARIO 5: Create Sale Listings 2 through 9 ---
    console.log('\nScenario 5: Subscribed seller creates Sale listings 2 through 9');
    for (let i = 2; i <= 9; i++) {
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

      createdListingIds.push(res.responseData._id);
    }

    const userAfter9 = await User.findById(testSeller._id);
    console.log(`  ✔ Sale listings 2-9 created. Total used quota: ${userAfter9.sellerSubscription.usedQuota}/${userAfter9.sellerSubscription.totalQuota}`);
    if (userAfter9.sellerSubscription.usedQuota !== 9) {
      throw new Error(`Expected usedQuota=9, got ${userAfter9.sellerSubscription.usedQuota}`);
    }

    // --- SCENARIO 6: Seller creates 10th Sale listing (Reaches Quota Limit & Triggers Alerts) ---
    console.log('\nScenario 6: Seller creates 10th Sale listing (Reaches Quota, Triggers Exhaustion Alerts)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          name: 'Milestone Villa #10',
          description: 'The 10th listing exhausting the pack',
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

      createdListingIds.push(res.responseData._id);

      const userAfter10 = await User.findById(testSeller._id);
      const sub10 = userAfter10.sellerSubscription;
      console.log(`  ✔ Subscription Status: ${sub10.status}`);
      console.log(`  ✔ Used Quota: ${sub10.usedQuota}/${sub10.totalQuota}`);

      if (sub10.status !== 'exhausted' || sub10.usedQuota !== 10) {
        throw new Error(`Expected status='exhausted' and usedQuota=10, got ${sub10.status}, ${sub10.usedQuota}`);
      }

      const notif = await Notification.findOne({
        recipient: testSeller._id,
        message: { $regex: /Quota complete/i }
      });
      if (!notif) throw new Error('Expected in-app exhaustion notification not found in DB!');
      console.log(`  ✔ In-App Exhaustion Alert verified in DB`);
    }

    // --- SCENARIO 7: Create an additional RENT listing while exhausted (ALLOWED) ---
    console.log('\nScenario 7: Create a RENT listing while exhausted (Rent remains FREE & Allowed)');
    let rentWhileExhaustedId = null;
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          name: 'Another Rental Property While Exhausted',
          description: 'Should succeed because rent is free without quota',
          address: 'Powai, Mumbai',
          regularPrice: 60000,
          discountPrice: 0,
          bathrooms: 2,
          bedrooms: 2,
          furnished: false,
          parking: true,
          type: 'rent',
          offer: false,
          imageUrls: ['https://oasisspace.test/rent2.jpg'],
        }
      });

      await createListing(req, res, next);
      const err = getErr();
      if (err) throw err;

      rentWhileExhaustedId = res.responseData._id;
      createdListingIds.push(rentWhileExhaustedId);
      console.log(`  ✔ Rent Listing Created: "${res.responseData.name}" (Status: ${res.responseData.status})`);
      if (res.responseData.status !== 'available') {
        throw new Error(`Expected rent listing status 'available', got ${res.responseData.status}`);
      }
    }

    // --- SCENARIO 8: Attempt to update this RENT listing to SALE while exhausted (BLOCKED 403) ---
    console.log('\nScenario 8: Attempt to update RENT property to SALE while exhausted (Blocked 403)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        params: { id: rentWhileExhaustedId.toString() },
        body: {
          type: 'sale',
          regularPrice: 25000000,
        }
      });

      await updateListing(req, res, next);
      const err = getErr();
      if (!err) {
        throw new Error('Expected update from rent to sale while exhausted to fail with 403!');
      }
      console.log(`  ✔ Successfully blocked: ${err.statusCode} - "${err.message}"`);
      if (err.statusCode !== 403 || !err.message.includes('exhausted')) {
        throw new Error(`Expected 403 with exhaustion message, got ${err.statusCode}: ${err.message}`);
      }
    }

    // --- SCENARIO 9: Seller Reclaims Seller Pro Pack (+10 Credits) ---
    console.log('\nScenario 9: Seller Reclaims/Renews Seller Pro Pack (+10 Credits)');
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

    // --- SCENARIO 10: Convert RENT to SALE now that seller has reclaimed quota (NOW SUCCEEDS) ---
    console.log('\nScenario 10: Convert RENT to SALE post-reclaim (Now Succeeds & Consumes 1 Credit)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        params: { id: rentWhileExhaustedId.toString() },
        body: {
          type: 'sale',
          regularPrice: 25000000,
        }
      });

      await updateListing(req, res, next);
      const err = getErr();
      if (err) throw err;

      const userPostReclaim = await User.findById(testSeller._id);
      console.log(`  ✔ Successfully converted Rent to Sale post-reclaim!`);
      console.log(`  ✔ Used Quota: ${userPostReclaim.sellerSubscription.usedQuota}/${userPostReclaim.sellerSubscription.totalQuota} (Remaining: ${userPostReclaim.sellerSubscription.totalQuota - userPostReclaim.sellerSubscription.usedQuota})`);
      if (userPostReclaim.sellerSubscription.usedQuota !== 11) {
        throw new Error(`Expected usedQuota=11, got ${userPostReclaim.sellerSubscription.usedQuota}`);
      }
    }

    // --- SCENARIO 11: Admin Exemption Test ---
    console.log('\nScenario 11: Admin Exemption Test (Admins bypass subscription requirement)');
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
  console.log('  🎉 ALL SELLER SUBSCRIPTION & RENT-TO-SALE TESTS PASSED!');
  console.log('============================================================\n');
}

testSellerSubscription().catch(console.error);

