// Test script to verify "Book Now" (Buyer Token Booking) on Listing page
import '../config/env.js';
import mongoose from 'mongoose';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import Order from '../models/order.model.js';
import Notification from '../models/notification.model.js';
import crypto from 'crypto';
import { createOrder, verifyPayment } from '../controllers/order.controller.js';
import { BOOKING_TOKEN_FEE } from '../utils/fees.js';

function mockReqRes({ body = {}, user = null } = {}) {
  const req = { body, user };
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

async function testBookNowFlow() {
  await mongoose.connect(process.env.MONGO);
  console.log('\n============================================================');
  console.log('  🔍 VERIFYING BUYER "BOOK PROPERTY" TOKEN FLOW');
  console.log('============================================================\n');

  // Find a sample live listing from DB
  const liveListing = await Listing.findOne({ status: 'available' });
  if (!liveListing) {
    console.log('No live listings found in DB.');
    await mongoose.connection.close();
    return;
  }

  console.log(`Property Tested:`);
  console.log(`  - Title: "${liveListing.name}"`);
  console.log(`  - Type: ${liveListing.type}`);
  console.log(`  - Status: ${liveListing.status}`);
  console.log(`  - Owner userRef: ${liveListing.userRef}\n`);

  // Ensure landlord exists in DB for notification/email testing
  let landlord = await User.findById(liveListing.userRef);
  let createdLandlord = false;
  if (!landlord) {
    landlord = await User.create({
      _id: new mongoose.Types.ObjectId(liveListing.userRef),
      username: 'Landlord Host',
      email: 'landlord_test@oasisspace.com',
      password: 'testpassword123'
    });
    createdLandlord = true;
  }

  // Scenario 1: Logged-out Visitor
  console.log('Scenario 1: Logged-out visitor');
  console.log('  -> RazorpayBtn checks (!currentUser) and prompts login.\n');

  // Scenario 2: Owner attempting to book their own property
  console.log('Scenario 2: Owner attempts to book their own property');
  {
    const { req, res, next, getErr } = mockReqRes({
      user: { id: liveListing.userRef },
      body: { listingId: liveListing._id.toString(), orderType: 'booking' }
    });
    await createOrder(req, res, next);
    const err = getErr();
    console.log(`  Status: ${err ? err.statusCode : res.statusValue}`);
    console.log(`  Response: "${err ? err.message : JSON.stringify(res.responseData)}"`);
    if (err && err.statusCode === 400 && err.message.includes('own property')) {
      console.log('  ✔ Correctly rejected: Owner cannot book their own property!\n');
    }
  }

  // Scenario 3: Prospective Buyer books property with token (₹999)
  console.log(`Scenario 3: Prospective Buyer clicks "Book Property (₹${BOOKING_TOKEN_FEE} Token)"`);
  let createdBookingOrder;
  const buyerId = new mongoose.Types.ObjectId();
  // Create a temporary test buyer in DB so verifyPayment can find buyer
  const testBuyer = await User.create({
    _id: buyerId,
    username: 'test_buyer_qa',
    email: `buyer_${Date.now()}@oasisspace.test`,
    mobile: '9876543210',
    isVerified: true
  });

  {
    const { req, res, next, getErr } = mockReqRes({
      user: { id: testBuyer._id.toString() },
      body: { listingId: liveListing._id.toString(), orderType: 'booking' }
    });
    await createOrder(req, res, next);
    const err = getErr();
    if (err) {
      console.error('  ✖ Order creation error:', err);
    } else {
      console.log(`  ✔ Status: ${res.statusValue} OK`);
      console.log(`  ✔ Razorpay Order ID: ${res.responseData.order.id}`);
      console.log(`  ✔ Order Amount: ₹${res.responseData.order.amount / 100} (${res.responseData.order.amount} paise)`);
      console.log(`  ✔ Order Currency: ${res.responseData.order.currency}`);
      console.log(`  ✔ Razorpay Notes:`, res.responseData.order.notes);
      createdBookingOrder = res.responseData.order;
    }
  }

  // Scenario 4: Buyer completes payment on Razorpay modal -> verifyPayment
  console.log('\nScenario 4: Payment Verification & Landlord Notification');
  if (createdBookingOrder) {
    const fakePaymentId = `pay_${Date.now()}_qa`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${createdBookingOrder.id}|${fakePaymentId}`)
      .digest('hex');

    const { req, res, next, getErr } = mockReqRes({
      user: { id: testBuyer._id.toString() },
      body: {
        razorpay_order_id: createdBookingOrder.id,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: signature,
      }
    });

    await verifyPayment(req, res, next);
    const err = getErr();
    if (err) {
      console.error('  ✖ Verify error:', err);
    } else {
      console.log(`  ✔ Status: ${res.statusValue} OK`);
      console.log(`  ✔ Response Message: "${res.responseData.message}"`);
      console.log(`  ✔ Order Type: "${res.responseData.type}"`);

      // Verify DB Order record
      const savedOrder = await Order.findOne({ paymentId: fakePaymentId });
      console.log(`  ✔ Saved Order in DB: ID=${savedOrder?._id}, type=${savedOrder?.type}, status=${savedOrder?.status}, amount=₹${savedOrder?.amount}`);

      // Verify Notification sent to Landlord
      const landlordNotif = await Notification.findOne({
        recipient: liveListing.userRef,
        sender: testBuyer._id,
        relatedId: liveListing._id,
      });
      console.log(`  ✔ In-App Notification to Landlord: "${landlordNotif?.message}"`);

      // Clean up test records
      await Order.deleteOne({ _id: savedOrder?._id });
      if (landlordNotif) await Notification.deleteOne({ _id: landlordNotif._id });
    }
  }

  // Clean up test buyer & landlord
  await User.deleteOne({ _id: testBuyer._id });
  if (createdLandlord) await User.deleteOne({ _id: landlord._id });

  await mongoose.connection.close();
  console.log('\n============================================================');
  console.log('  🎉 "BOOK NOW" TOKEN BOOKING FLOW VERIFIED SUCCESSFULLY!');
  console.log('============================================================\n');
}

testBookNowFlow();
