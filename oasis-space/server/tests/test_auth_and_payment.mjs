// Test Suite: Authentication & Payment Gateway (Razorpay)
// Runs comprehensive functional, security, and integration tests for OasisSpace.
import '../config/env.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';

// Models
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import Order from '../models/order.model.js';
import Notification from '../models/notification.model.js';

// Utils
import { validatePassword } from '../utils/password.js';
import { verifyToken } from '../utils/verifyUser.js';
import { getListingFee, BOOKING_TOKEN_FEE } from '../utils/fees.js';

// Controllers
import { signup, verifyEmail, signin, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { createOrder, verifyPayment, cancelOrder } from '../controllers/order.controller.js';
import { updateListingStatus } from '../controllers/listing.controller.js';

// Test statistics
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${testName}`);
  } else {
    failedTests++;
    const message = detail ? `${testName} - ${detail}` : testName;
    failures.push(message);
    console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${message}`);
  }
}

// Helper to simulate Express req, res, next
function mockReqRes({ body = {}, params = {}, query = {}, cookies = {}, user = null } = {}) {
  const req = {
    body,
    params,
    query,
    cookies,
    user,
  };

  let resData = null;
  let resStatus = 200;
  let clearedCookieName = null;
  const setCookies = {};

  const res = {
    status(code) {
      resStatus = code;
      return this;
    },
    json(data) {
      resData = data;
      return this;
    },
    send(data) {
      resData = data;
      return this;
    },
    cookie(name, val, opts) {
      setCookies[name] = { val, opts };
      return this;
    },
    clearCookie(name, opts) {
      clearedCookieName = name;
      return this;
    },
    get statusValue() {
      return resStatus;
    },
    get data() {
      return resData;
    },
    get cookiesSet() {
      return setCookies;
    },
    get cookieCleared() {
      return clearedCookieName;
    },
  };

  let nextErr = null;
  const next = (err) => {
    if (err) nextErr = err;
  };

  return { req, res, next, getErr: () => nextErr };
}

// Unique run ID for isolated test fixtures
const RUN_ID = `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
const TEST_EMAIL = `${RUN_ID}@oasisspace.test`;
const TEST_EMAIL_2 = `${RUN_ID}_alt@oasisspace.test`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NEW_PASSWORD = 'NewPassword456@';

async function runTestSuite() {
  console.log('\n============================================================');
  console.log(`  🚀 OASISSPACE TEST RUNNER — AUTH & PAYMENT GATEWAY`);
  console.log(`  Run ID: ${RUN_ID}`);
  console.log('============================================================\n');

  // Connect Database
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO);
    console.log('✅ Connected to MongoDB successfully.\n');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  try {
    // -------------------------------------------------------------
    // SUITE 1: Password Strength Validation Unit Tests
    // -------------------------------------------------------------
    console.log('\x1b[36m--- [SUITE 1] Password Policy Rules (password.js) ---\x1b[0m');
    assert(validatePassword('short1!') !== null, 'Rejects password shorter than 8 chars');
    assert(validatePassword('nouppercase123!') !== null, 'Rejects password without uppercase letter');
    assert(validatePassword('NoDigitsHere!@#') !== null, 'Rejects password without digit');
    assert(validatePassword('NoSpecialChar123') !== null, 'Rejects password without special character');
    assert(validatePassword('ThisPasswordIsWayTooLongAndExceedsTwentyCharacters123!') !== null, 'Rejects password exceeding 20 chars');
    assert(validatePassword(TEST_PASSWORD) === null, 'Accepts compliant password (8-20, Upper, Lower, Digit, Special)');

    // -------------------------------------------------------------
    // SUITE 2: User Registration & OTP Generation Flow
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- [SUITE 2] User Registration (POST /api/auth/signup) ---\x1b[0m');
    
    // Missing fields
    {
      const { req, res, next, getErr } = mockReqRes({ body: { email: TEST_EMAIL } });
      await signup(req, res, next);
      const err = getErr();
      assert(err && err.statusCode === 400, 'Rejects signup with missing required fields (400)');
    }

    // Invalid email format
    {
      const { req, res, next, getErr } = mockReqRes({
        body: { username: `${RUN_ID}_user`, email: 'invalid-email', password: TEST_PASSWORD, mobile: '9999999999' }
      });
      await signup(req, res, next);
      const err = getErr();
      assert(err && err.statusCode === 400, 'Rejects signup with invalid email format (400)');
    }

    // Valid signup
    let createdUser;
    {
      const { req, res, next, getErr } = mockReqRes({
        body: { username: `${RUN_ID}_user`, email: TEST_EMAIL, password: TEST_PASSWORD, mobile: '9876543210' }
      });
      await signup(req, res, next);
      assert(!getErr() && res.statusValue === 201, 'Creates new user account and returns 201');

      createdUser = await User.findOne({ email: TEST_EMAIL }).select('+otp +otpExpires +password');
      assert(createdUser !== null, 'User saved to MongoDB');
      assert(createdUser && createdUser.isVerified === false, 'User begins in unverified state (isVerified: false)');
      assert(createdUser && createdUser.otp && /^[0-9]{6}$/.test(createdUser.otp), 'Cryptographic 6-digit numeric OTP generated');
      assert(createdUser && bcryptjs.compareSync(TEST_PASSWORD, createdUser.password), 'Password is correctly hashed with bcrypt');
      assert(createdUser && createdUser.otpExpires > new Date(), 'OTP expiration set in future (+10 minutes)');
    }

    // Duplicate email registration
    {
      const { req, res, next, getErr } = mockReqRes({
        body: { username: `${RUN_ID}_user_alt`, email: TEST_EMAIL, password: TEST_PASSWORD, mobile: '9876543210' }
      });
      await signup(req, res, next);
      const err = getErr();
      assert(err && err.statusCode === 409, 'Rejects duplicate email with HTTP 409 Conflict');
    }

    // -------------------------------------------------------------
    // SUITE 3: Email Verification Flow
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- [SUITE 3] Email OTP Verification (POST /api/auth/verify-email) ---\x1b[0m');

    // Wrong OTP
    {
      const { req, res, next, getErr } = mockReqRes({
        body: { email: TEST_EMAIL, otp: '000000' }
      });
      await verifyEmail(req, res, next);
      const err = getErr();
      assert(err && err.statusCode === 400, 'Rejects invalid OTP with HTTP 400');
    }

    // Correct OTP verification
    {
      const { req, res, next, getErr } = mockReqRes({
        body: { email: TEST_EMAIL, otp: createdUser.otp }
      });
      await verifyEmail(req, res, next);
      assert(!getErr() && res.statusValue === 200, 'Verifies valid OTP and returns 200');
      assert(res.cookiesSet['access_token'] !== undefined, 'Sets HTTP-only access_token cookie on verification');

      const verifiedUser = await User.findOne({ email: TEST_EMAIL }).select('+otp +otpExpires');
      assert(verifiedUser.isVerified === true, 'User isVerified flipped to true in MongoDB');
      assert(!verifiedUser.otp, 'OTP cleared from user record after verification');
    }

    // -------------------------------------------------------------
    // SUITE 4: Sign In & Brute-Force Lockout Guard
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- [SUITE 4] Sign In & Security Guardrails (POST /api/auth/signin) ---\x1b[0m');

    // Wrong password
    {
      const { req, res, next, getErr } = mockReqRes({
        body: { email: TEST_EMAIL, password: 'WrongPassword999!' }
      });
      await signin(req, res, next);
      const err = getErr();
      assert(err && err.statusCode === 401, 'Rejects incorrect password with 401 (generic message)');
    }

    // Non-existent email
    {
      const { req, res, next, getErr } = mockReqRes({
        body: { email: 'nonexistent_account@oasisspace.test', password: 'SomePassword123!' }
      });
      await signin(req, res, next);
      const err = getErr();
      assert(err && err.statusCode === 401, 'Rejects non-existent email with generic 401 (prevents user enumeration)');
    }

    // Valid sign in
    let sessionToken;
    {
      const { req, res, next, getErr } = mockReqRes({
        body: { email: TEST_EMAIL, password: TEST_PASSWORD }
      });
      await signin(req, res, next);
      assert(!getErr() && res.statusValue === 200, 'Signs in successfully with valid credentials (200)');
      assert(res.data && res.data.password === undefined, 'Sign in response sanitizes password field');
      assert(res.data && res.data.otp === undefined, 'Sign in response sanitizes OTP field');
      assert(res.cookiesSet['access_token'] !== undefined, 'Issues access_token cookie on signin');
      sessionToken = res.cookiesSet['access_token']?.val;
    }

    // -------------------------------------------------------------
    // SUITE 5: JWT Session Token Verification & Purpose Isolation
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- [SUITE 5] JWT Middleware & Token Isolation (verifyToken) ---\x1b[0m');

    // No cookie
    {
      const { req, res, next, getErr } = mockReqRes({ cookies: {} });
      verifyToken(req, res, next);
      assert(res.statusValue === 401, 'Blocks requests with missing cookie (401 Unauthorized)');
    }

    // Forged JWT
    {
      const { req, res, next, getErr } = mockReqRes({ cookies: { access_token: 'fake.jwt.token' } });
      verifyToken(req, res, next);
      assert(res.statusValue === 401, 'Blocks requests with forged/invalid JWT signature (401)');
    }

    // Token with purpose 'seller' (Magic link token, not session token)
    {
      const sellerToken = jwt.sign(
        { id: createdUser._id, action: 'approved', purpose: 'seller' },
        process.env.JWT_SECRET.trim(),
        { expiresIn: '1d' }
      );
      const { req, res, next, getErr } = mockReqRes({ cookies: { access_token: sellerToken } });
      verifyToken(req, res, next);
      const err = getErr();
      assert(err && err.statusCode === 403, 'Rejects seller magic-link token from API session access (403 Forbidden)');
    }

    // Valid session token
    {
      const { req, res, next, getErr } = mockReqRes({ cookies: { access_token: sessionToken } });
      verifyToken(req, res, next);
      assert(!getErr() && req.user && req.user.id === createdUser._id.toString(), 'Validates authentic session token and attaches req.user');
    }

    // -------------------------------------------------------------
    // SUITE 6: Password Reset Flow
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- [SUITE 6] Password Reset Flow (forgot / reset) ---\x1b[0m');

    // Forgot password request
    let resetOtp;
    {
      const { req, res, next, getErr } = mockReqRes({ body: { email: TEST_EMAIL } });
      await forgotPassword(req, res, next);
      assert(!getErr() && res.statusValue === 200, 'Issues reset password OTP (200)');
      const userDoc = await User.findOne({ email: TEST_EMAIL }).select('+otp +otpExpires');
      resetOtp = userDoc.otp;
      assert(resetOtp && /^[0-9]{6}$/.test(resetOtp), 'Generates new 6-digit OTP for password reset');
    }

    // Reset password submission
    {
      const { req, res, next, getErr } = mockReqRes({
        body: { email: TEST_EMAIL, otp: resetOtp, password: TEST_NEW_PASSWORD }
      });
      await resetPassword(req, res, next);
      assert(!getErr() && res.statusValue === 200, 'Resets password successfully with valid OTP (200)');

      // Verify sign in works with new password
      const userDoc = await User.findOne({ email: TEST_EMAIL }).select('+password');
      assert(bcryptjs.compareSync(TEST_NEW_PASSWORD, userDoc.password), 'New password hash persisted in DB');
    }

    // -------------------------------------------------------------
    // SUITE 7: Razorpay SDK Connectivity & Live API Test
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- [SUITE 7] Razorpay SDK Live Connectivity ---\x1b[0m');
    assert(Boolean(process.env.RAZORPAY_KEY_ID), 'RAZORPAY_KEY_ID configured in environment');
    assert(Boolean(process.env.RAZORPAY_KEY_SECRET), 'RAZORPAY_KEY_SECRET configured in environment');

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    let liveRzpOrder;
    try {
      liveRzpOrder = await razorpay.orders.create({
        amount: 510000, // ₹5,100 in paise
        currency: 'INR',
        receipt: `rcpt_test_${Date.now()}`,
        notes: {
          test: 'oasisspace_qa_runner',
          runId: RUN_ID,
        },
      });
      assert(liveRzpOrder && Boolean(liveRzpOrder.id), 'Successfully communicates with Razorpay API and creates test order');
      assert(liveRzpOrder.amount === 510000, 'Order amount matches expected 510000 paise (₹5,100)');
      assert(liveRzpOrder.currency === 'INR', 'Order currency is INR');
      console.log(`    ↳ Razorpay Order ID created: ${liveRzpOrder.id}`);
    } catch (rzpErr) {
      assert(false, 'Failed to connect to Razorpay API', rzpErr.message);
    }

    // -------------------------------------------------------------
    // SUITE 8: Order Creation API (POST /api/order/create)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- [SUITE 8] Listing Fee Order Creation (POST /api/order/create) ---\x1b[0m');

    // Create a test seller user (approved)
    const sellerUser = await User.create({
      username: `${RUN_ID}_seller`,
      email: TEST_EMAIL_2,
      password: bcryptjs.hashSync(TEST_PASSWORD, 10),
      mobile: '9876543210',
      isVerified: true,
      sellerStatus: 'approved',
    });

    // Create a rent listing (free)
    const rentListing = await Listing.create({
      name: `${RUN_ID} 2BHK Apartment for Rent`,
      description: 'Test rent property description',
      address: 'Bandra West, Mumbai',
      regularPrice: 45000,
      discountPrice: 0,
      bathrooms: 2,
      bedrooms: 2,
      furnished: true,
      parking: true,
      type: 'rent',
      offer: false,
      imageUrls: ['https://example.com/test.jpg'],
      userRef: sellerUser._id.toString(),
      status: 'available', // Rent is free and live immediately
    });

    // Create a sale listing (draft / pending fee)
    const saleListing = await Listing.create({
      name: `${RUN_ID} Luxury Villa for Sale`,
      description: 'Test luxury villa description',
      address: 'Whitefield, Bengaluru',
      regularPrice: 12500000,
      discountPrice: 12000000,
      bathrooms: 3,
      bedrooms: 4,
      furnished: true,
      parking: true,
      type: 'sale',
      offer: true,
      imageUrls: ['https://example.com/test_villa.jpg'],
      userRef: sellerUser._id.toString(),
      status: 'pending', // Sale starts as fee-pending draft
    });

    // Attempt to pay for rent listing (rent is free -> should reject)
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: sellerUser._id.toString() },
        body: { listingId: rentListing._id.toString() }
      });
      await createOrder(req, res, next);
      const err = getErr();
      assert(err && err.statusCode === 400 && err.message.includes('Rent listings publish free'), 'Blocks fee payment for rent listings (Rent is free)');
    }

    // Attempt to pay for another user's listing (unauthorized)
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: createdUser._id.toString() }, // createdUser is not the owner
        body: { listingId: saleListing._id.toString() }
      });
      await createOrder(req, res, next);
      const err = getErr();
      assert(err && err.statusCode === 403, 'Blocks payment attempt on property owned by another user (403)');
    }

    // Valid listing fee order creation by owner
    let createdSaleOrder;
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: sellerUser._id.toString() },
        body: { listingId: saleListing._id.toString() }
      });
      await createOrder(req, res, next);
      assert(!getErr() && res.statusValue === 200 && res.data.success === true, 'Generates Razorpay order for sale listing fee (200)');
      assert(res.data.order && res.data.order.amount === 510000, 'Server enforces exact listing fee amount (510000 paise = ₹5,100)');
      assert(res.data.order.notes?.listingId === saleListing._id.toString(), 'Embeds listingId in Razorpay order notes');
      assert(res.data.order.notes?.type === 'listing_fee', 'Embeds type=listing_fee in Razorpay order notes');
      createdSaleOrder = res.data.order;
    }

    // Buyer Token Booking: Owner cannot book own property
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: sellerUser._id.toString() },
        body: { listingId: rentListing._id.toString(), orderType: 'booking' }
      });
      await createOrder(req, res, next);
      const err = getErr();
      assert(err && err.statusCode === 400 && err.message.includes('own property'), 'Token Booking: Blocks property owner from booking own property (400)');
    }

    // Buyer Token Booking: Buyer can create booking order for available property
    let createdBuyerTokenOrder;
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: createdUser._id.toString() }, // createdUser is a prospective buyer
        body: { listingId: rentListing._id.toString(), orderType: 'booking' }
      });
      await createOrder(req, res, next);
      assert(!getErr() && res.statusValue === 200 && res.data.success === true, 'Token Booking: Generates token booking order for buyer (200)');
      assert(res.data.order && res.data.order.amount === BOOKING_TOKEN_FEE * 100, `Token Booking: Server enforces ₹${BOOKING_TOKEN_FEE} token amount (${BOOKING_TOKEN_FEE * 100} paise)`);
      assert(res.data.order.notes?.type === 'booking', 'Token Booking: Embeds type=booking in Razorpay order notes');
      createdBuyerTokenOrder = res.data.order;
    }

    // -------------------------------------------------------------
    // SUITE 9: Payment Verification, HMAC Security & Fulfillment
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- [SUITE 9] Payment Verification & Fulfillment (POST /api/order/verify) ---\x1b[0m');

    const fakePaymentId = `pay_${Date.now()}_test`;

    // Signature forgery attempt
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: sellerUser._id.toString() },
        body: {
          razorpay_order_id: createdSaleOrder.id,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: 'forged_invalid_signature_hex',
        }
      });
      await verifyPayment(req, res, next);
      assert(res.statusValue === 400 && res.data.success === false, 'Rejects invalid/tampered HMAC signature with HTTP 400');
    }

    // Authentic HMAC-SHA256 signature verification
    const authenticSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${createdSaleOrder.id}|${fakePaymentId}`)
      .digest('hex');

    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: sellerUser._id.toString() },
        body: {
          razorpay_order_id: createdSaleOrder.id,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: authenticSignature,
        }
      });
      await verifyPayment(req, res, next);
      assert(!getErr() && res.statusValue === 200 && res.data.success === true, 'Accepts authentic Razorpay HMAC signature (200)');
      assert(res.data.type === 'listing_fee', 'Returns verified order type as listing_fee');

      // Check database state transitions
      const updatedListing = await Listing.findById(saleListing._id);
      assert(updatedListing.status === 'available', 'Listing status successfully transitioned from pending -> available');

      const savedOrder = await Order.findOne({ paymentId: fakePaymentId });
      assert(savedOrder !== null, 'Order record persisted to MongoDB');
      assert(savedOrder.status === 'success', 'Order status marked as success');
      assert(savedOrder.type === 'listing_fee', 'Order type recorded as listing_fee');
      assert(savedOrder.amount === 5100, 'Order amount recorded as ₹5,100');

      // Check notification creation
      const notif = await Notification.findOne({ relatedId: saleListing._id, recipient: sellerUser._id });
      assert(notif !== null && notif.message.includes('is now LIVE'), 'In-app notification sent to seller informing property is LIVE');
    }

    // Idempotency: re-verifying the same payment
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: sellerUser._id.toString() },
        body: {
          razorpay_order_id: createdSaleOrder.id,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: authenticSignature,
        }
      });
      await verifyPayment(req, res, next);
      assert(res.statusValue === 200 && res.data.message === 'Payment already verified.', 'Idempotency: Repeated verification returns 200 without duplicate execution');

      const orderCount = await Order.countDocuments({ paymentId: fakePaymentId });
      assert(orderCount === 1, 'Idempotency: Order document is not duplicated in DB');
    }

    // Buyer Token Booking Verification & Landlord Notification
    {
      const fakeTokenPaymentId = `pay_token_${Date.now()}_test`;
      const tokenSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${createdBuyerTokenOrder.id}|${fakeTokenPaymentId}`)
        .digest('hex');

      const { req, res, next, getErr } = mockReqRes({
        user: { id: createdUser._id.toString() },
        body: {
          razorpay_order_id: createdBuyerTokenOrder.id,
          razorpay_payment_id: fakeTokenPaymentId,
          razorpay_signature: tokenSignature,
        }
      });
      await verifyPayment(req, res, next);
      assert(!getErr() && res.statusValue === 200 && res.data.success === true, 'Token Booking: Accepts authentic signature and verifies booking payment (200)');
      assert(res.data.type === 'booking', 'Token Booking: Verified response type is booking');

      const tokenOrderDoc = await Order.findOne({ paymentId: fakeTokenPaymentId });
      assert(tokenOrderDoc !== null && tokenOrderDoc.status === 'success', 'Token Booking: Saved order with status success in DB');
      assert(tokenOrderDoc && tokenOrderDoc.type === 'booking', 'Token Booking: Order type recorded as booking');
      assert(tokenOrderDoc && tokenOrderDoc.amount === BOOKING_TOKEN_FEE, `Token Booking: Order amount recorded as ₹${BOOKING_TOKEN_FEE}`);

      // Landlord notification
      const landlordNotif = await Notification.findOne({
        recipient: sellerUser._id,
        sender: createdUser._id,
        relatedId: rentListing._id,
      });
      assert(landlordNotif !== null && landlordNotif.message.includes('New Booking!'), 'Token Booking: In-app notification sent to landlord with booking details');
    }

    // -------------------------------------------------------------
    // SUITE 10: Security Edge Cases (Fee Bypass & Fee Cancellation)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- [SUITE 10] Security Edge Cases & Guardrails ---\x1b[0m');

    // Create another unpaid sale draft
    const unpaidSaleListing = await Listing.create({
      name: `${RUN_ID} Unpaid Bypass Attempt Villa`,
      description: 'Testing bypass attempt',
      address: 'South Mumbai',
      regularPrice: 20000000,
      discountPrice: 0,
      bathrooms: 4,
      bedrooms: 4,
      furnished: true,
      parking: true,
      type: 'sale',
      offer: false,
      imageUrls: ['https://example.com/unpaid.jpg'],
      userRef: sellerUser._id.toString(),
      status: 'pending',
    });

    // Attempt to manually publish without paying via updateListingStatus
    {
      const { req, res, next, getErr } = mockReqRes({
        user: { id: sellerUser._id.toString() },
        params: { id: unpaidSaleListing._id.toString() },
        body: { status: 'available' }
      });
      await updateListingStatus(req, res, next);
      const err = getErr();
      assert(
        err && err.statusCode === 400 && err.message.includes('Pay the listing fee before publishing'),
        'Fee Bypass Guard: Blocks unpaid pending sale listing from being moved to available (400)'
      );
    }

    // Attempt to cancel a listing_fee order
    {
      const feeOrder = await Order.findOne({ paymentId: fakePaymentId });
      const { req, res, next, getErr } = mockReqRes({
        user: { id: sellerUser._id.toString() },
        params: { id: feeOrder._id.toString() }
      });
      await cancelOrder(req, res, next);
      const err = getErr();
      assert(
        err && err.statusCode === 400 && err.message.includes('Listing fee payments cannot be cancelled online'),
        'Cancellation Guard: Blocks online cancellation of listing_fee orders (400)'
      );
    }

  } catch (unexpectedErr) {
    console.error('\n💥 Unexpected Exception during test run:', unexpectedErr);
    failures.push(`Unexpected error: ${unexpectedErr.message}`);
  } finally {
    // -------------------------------------------------------------
    // CLEANUP FIXTURES
    // -------------------------------------------------------------
    console.log('\n\x1b[33m--- [CLEANUP] Removing Test Records from MongoDB ---\x1b[0m');
    try {
      const userRes = await User.deleteMany({ email: { $in: [TEST_EMAIL, TEST_EMAIL_2] } });
      const listingRes = await Listing.deleteMany({ name: { $regex: `^${RUN_ID}` } });
      const orderRes = await Order.deleteMany({ orderId: { $regex: 'test' } });
      const notifRes = await Notification.deleteMany({ message: { $regex: RUN_ID } });

      console.log(`  ✔ Cleaned ${userRes.deletedCount} test user(s)`);
      console.log(`  ✔ Cleaned ${listingRes.deletedCount} test listing(s)`);
      console.log(`  ✔ Cleaned ${orderRes.deletedCount} test order(s)`);
      console.log(`  ✔ Cleaned ${notifRes.deletedCount} test notification(s)`);
    } catch (cleanupErr) {
      console.warn('  ⚠️ Warning during cleanup:', cleanupErr.message);
    }

    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.\n');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('============================================================');
    console.log(`  🏁 TEST EXECUTION SUMMARY`);
    console.log(`  Total Assertions: ${totalTests}`);
    console.log(`  \x1b[32mPassed: ${passedTests}\x1b[0m`);
    console.log(`  \x1b[31mFailed: ${failedTests}\x1b[0m`);
    console.log('============================================================\n');

    if (failedTests > 0) {
      console.error('\x1b[31mFailures:\x1b[0m');
      failures.forEach((f, idx) => console.error(`  ${idx + 1}. ${f}`));
      process.exit(1);
    } else {
      console.log('\x1b[32m🎉 ALL AUTHENTICATION & PAYMENT GATEWAY TESTS PASSED!\x1b[0m\n');
      process.exit(0);
    }
  }
}

runTestSuite();
