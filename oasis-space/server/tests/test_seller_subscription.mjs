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
  console.log('  🚀 TESTING SELLER SUBSCRIPTION PACK (₹5,100 / 10 LISTINGS)');
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
    // --- SCENARIO 1: Unsubscribed seller creates a Sale listing ---
    console.log('Scenario 1: Seller without active pack creates a Sale listing');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          name: 'Unsubscribed Draft Villa',
          description: 'Luxury villa awaiting fee',
          address: 'Mumbai Sea Link',
          regularPrice: 15000000,
          discountPrice: 14000000,
          bathrooms: 3,
          bedrooms: 4,
          furnished: true,
          parking: true,
          type: 'sale',
          offer: true,
          imageUrls: ['https://oasisspace.test/villa.jpg'],
        }
      });

      await createListing(req, res, next);
      const err = getErr();
      if (err) throw err;

      const listing = res.responseData;
      createdListingIds.push(listing._id);
      console.log(`  ✔ Listing Created: "${listing.name}"`);
      console.log(`  ✔ Status: ${listing.status} (Correctly pending listing fee/pack)`);
      if (listing.status !== 'pending') throw new Error('Expected status to be pending!');
    }

    // --- SCENARIO 2: Seller purchases Seller Pro Pack (₹5,100 for 10) ---
    console.log('\nScenario 2: Seller initiates Razorpay order for Seller Pro Pack');
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
      console.log(`  ✔ Embedded Notes:`, orderData.order.notes);

      if (orderData.order.amount !== SELLER_PACK.price * 100) {
        throw new Error(`Expected amount ${SELLER_PACK.price * 100}, got ${orderData.order.amount}`);
      }
    }

    // --- SCENARIO 3: Payment Verification & 10 Credits Fulfillment ---
    console.log('\nScenario 3: Payment Verification & 10 Listings Quota Allocation');
    const fakePaymentId = `pay_sub_${Date.now()}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${fakePaymentId}`)
      .digest('hex');

    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: signature,
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
      console.log(`     - Valid Till: ${new Date(sub.endDate).toLocaleDateString()}`);

      if (sub.status !== 'active' || sub.totalQuota !== 10 || sub.usedQuota !== 0) {
        throw new Error('Seller subscription not properly activated in DB!');
      }

      // Verify Order record in DB
      const orderRecord = await Order.findOne({ paymentId: fakePaymentId });
      createdOrderIds.push(orderRecord._id);
      console.log(`  ✔ Saved Order Record: ID=${orderRecord._id}, type=${orderRecord.type}, amount=₹${orderRecord.amount}`);
    }

    // --- SCENARIO 4: Subscribed seller creates a Sale listing (Publishes Live Instantly) ---
    console.log('\nScenario 4: Subscribed seller creates Sale listing (Instant Live Publishing)');
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: testSeller._id.toString() },
        body: {
          name: 'Instant Live Sea View Apartment',
          description: 'Luxury flat published instantly via active Seller Pack',
          address: 'Bandra West, Mumbai',
          regularPrice: 25000000,
          discountPrice: 24000000,
          bathrooms: 2,
          bedrooms: 3,
          furnished: true,
          parking: true,
          type: 'sale',
          offer: false,
          imageUrls: ['https://oasisspace.test/flat.jpg'],
        }
      });

      await createListing(req, res, next);
      const err = getErr();
      if (err) throw err;

      const listing = res.responseData;
      createdListingIds.push(listing._id);
      console.log(`  ✔ Listing Created: "${listing.name}"`);
      console.log(`  ✔ Status: ${listing.status} (INSTANT LIVE - No payment pending!)`);

      if (listing.status !== 'available') {
        throw new Error('Expected subscribed listing to publish live immediately as available!');
      }

      // Verify quota decremented in User DB
      const userAfterListing = await User.findById(testSeller._id);
      const subAfter = userAfterListing.sellerSubscription;
      console.log(`  ✔ Updated Quota: ${subAfter.usedQuota} used of ${subAfter.totalQuota} (${subAfter.totalQuota - subAfter.usedQuota} remaining)`);

      if (subAfter.usedQuota !== 1) {
        throw new Error(`Expected usedQuota to be 1, got ${subAfter.usedQuota}`);
      }
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
  console.log('  🎉 ALL SELLER SUBSCRIPTION PACK TESTS PASSED!');
  console.log('============================================================\n');
}

testSellerSubscription().catch(console.error);
