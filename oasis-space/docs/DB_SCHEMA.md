# OasisSpace — Database Schema

MongoDB, Mongoose 7. Six collections. All documents use `timestamps: true`
(`createdAt`, `updatedAt`).

## users
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | PK | |
| `username` | String | required, **unique** | |
| `email` | String | required, **unique** | |
| `mobile` | String | optional | Google users have none |
| `password` | String | optional, **`select:false`** | bcrypt hash; absent for Google-only users |
| `avatar` | String | default `blank-profile...` | |
| `role` | String | enum `user\|admin`, default `user` | admin = dashboard + verify-seller + feature |
| `sellerStatus` | String | enum `regular\|pending\|approved\|rejected`, default `regular` | |
| `savedListings` | [ObjectId] | ref `Listing`, default `[]` | wishlist |
| `isVerified` | Boolean | default `false` | email/OTP verified |
| `otp` | String | `select:false` | crypto-random OTP |
| `otpExpires` | Date | `select:false` | null unless pending reset |

## listings
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | PK | |
| `name` | String | required | |
| `description` | String | required | |
| `address` | String | required | |
| `regularPrice` | Number | required | always INR |
| `discountPrice` | Number | required | must be < `regularPrice` (client + create validation) |
| `bathrooms` / `bedrooms` | Number | required | |
| `furnished` / `parking` | Boolean | required | |
| `type` | String | required | `rent` \| `sale` |
| `offer` | Boolean | required | |
| `featured` | Boolean | default `false` | admin only |
| `imageUrls` | Array | required | Supabase public URLs (or legacy data: URIs) |
| `imageLabels` | Array | default `[]` | parallel to `imageUrls` (Kitchen, Living Room…) |
| `userRef` | String | required | owner id |
| `status` | String | enum **`pending\|available\|sold\|rented`**, default `available` | `pending` = unpaid sale draft (rent is free → created `available`) |

> ⚠️ `pending` was missing from the enum previously — a draft save would throw a
> Mongoose `ValidationError`. Fixed so the draft → pay → publish flow works.

## orders
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | PK | |
| `userRef` | String | required, **index** | payer |
| `listingRef` | ObjectId | ref `Listing`, required, **index** | |
| `amount` | Number | required | INR |
| `paymentId` | String | required, **unique+sparse** | Razorpay payment id (idempotency) |
| `orderId` | String | required, **unique+sparse** | Razorpay order id (idempotency) |
| `status` | String | enum `pending\|success\|failed\|cancelled`, default `pending`, **index** | |
| `type` | String | enum `listing_fee\|booking`, default `booking`, **index** | `booking` = legacy pre-fee orders |
| `mobile` | String | default `''` | |

## notifications
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | PK | |
| `recipient` | ObjectId | ref `User`, required, **index** | who receives |
| `sender` | ObjectId | ref `User`, required | who acted |
| `message` | String | required | |
| `relatedId` | ObjectId | ref `Listing`, default null | deep-link target |
| `isRead` | Boolean | default `false`, **index** | |

## subscriptions (web push)
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | PK | |
| `userRef` | ObjectId | ref `User`, required, **index** | |
| `endpoint` | String | required, **unique** | device endpoint (no duplicates) |
| `keys` | Object | required | `{ p256dh, auth }` |

## Indexes / notes
- `orderId`/`paymentId` sparse-unique → double Razorpay webhook/verify is neutralized.
- `password`, `otp`, `otpExpires` excluded by default from reads (`select: false`).
- Admin user list `select('-otp -otpExpires')`; legacy profile endpoints never expose hashes.

## Relationships
```
User 1───* Listing      (userRef)
User 1───* Order        (userRef)
Listing 1───* Order     (listingRef)
User 1───* Notification (recipient)
User 1───* Subscription (userRef)
User *───* Listing      (savedListings wishlist)
```